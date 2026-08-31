import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail, LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const SuspensionModal: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const handleSupportOpened = () => setIsSupportOpen(true);
    const handleSupportClosed = () => setIsSupportOpen(false);

    window.addEventListener("open-contact-support", handleSupportOpened);
    window.addEventListener("close-contact-support", handleSupportClosed);

    return () => {
      window.removeEventListener("open-contact-support", handleSupportOpened);
      window.removeEventListener("close-contact-support", handleSupportClosed);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    // Direct Supabase Database Verification
    const checkSuspendedFromDatabase = async () => {
      try {
        // 1. Query Supabase profiles table by user.id
        if (user.id) {
          const { data: p1 } = await (supabase as any)
            .from("profiles")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();

          if (p1) {
            const isSuspended = p1.status === "suspended";
            setIsOpen(isSuspended);
            if (!isSuspended && profile?.status === "suspended") {
              void refreshProfile();
            }
            return;
          }
        }

        // 2. Query Supabase profiles table by user.email
        if (user.email) {
          const cleanEmail = user.email.trim();

          const { data: p2 } = await (supabase as any)
            .from("profiles")
            .select("status")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (p2) {
            const isSuspended = p2.status === "suspended";
            setIsOpen(isSuspended);
            if (!isSuspended && profile?.status === "suspended") {
              void refreshProfile();
            }
            return;
          }
        }

        // 3. Fallback to local Auth profile
        setIsOpen(profile?.status === "suspended");
      } catch (err) {
        console.warn("[SuspensionModal] Supabase query error:", err);
      }
    };

    checkSuspendedFromDatabase();

    // Real-Time Postgres Channel Subscription
    const channelName = `suspension_modal_sub_${user.id || user.email}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: user.id ? `user_id=eq.${user.id}` : undefined,
        },
        (payload: any) => {
          if (payload.new?.status === "suspended") {
            setIsOpen(true);
          } else if (payload.new?.status === "active" || payload.new?.status === null) {
            setIsOpen(false);
            void refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.status]);

  if (!isOpen) {
    return null;
  }

  const handleContactSupport = () => {
    window.dispatchEvent(new CustomEvent("open-contact-support"));
  };

  return (
    <Dialog open={isOpen && !isSupportOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-md border-rose-500/30 bg-card shadow-2xl [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col items-center text-center pt-2">
          <div className="size-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 mb-3 shadow-inner">
            <ShieldAlert className="size-7" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Your Account Has Been Suspended
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1 max-w-sm">
            An administrator has suspended platform access for this account.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2.5 my-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Account Email:</span>
            <span className="font-mono font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Access Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
              Suspended
            </span>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              If you believe this is a mistake or require reactivation, please submit a request to support or contact your institution coordinator.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="default"
            onClick={handleContactSupport}
            className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md font-semibold text-xs h-9"
          >
            <Mail className="size-3.5 mr-2" />
            Contact Administrator
          </Button>

          <Button
            variant="outline"
            onClick={() => signOut()}
            className="text-xs h-9 text-muted-foreground hover:text-foreground font-medium"
          >
            <LogOut className="size-3.5 mr-1.5" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
