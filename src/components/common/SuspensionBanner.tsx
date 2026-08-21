import React, { useState, useEffect } from "react";
import { ShieldAlert, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const SuspensionBanner: React.FC = () => {
  const { profile, signOut, user } = useAuth();
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    // Direct Supabase Database Verification
    const verifySuspensionFromDatabase = async () => {
      try {
        // 1. Check local Auth profile status
        if (profile?.status === "suspended") {
          setIsSuspended(true);
          return;
        }

        // 2. Query Supabase profiles by user.id
        if (user.id) {
          const { data: p1 } = await (supabase as any)
            .from("profiles")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();

          if (p1?.status === "suspended") {
            setIsSuspended(true);
            return;
          }
        }

        // 3. Query Supabase profiles by user.email
        if (user.email) {
          const cleanEmail = user.email.trim();

          const { data: p2 } = await (supabase as any)
            .from("profiles")
            .select("status")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (p2?.status === "suspended") {
            setIsSuspended(true);
            return;
          }

          // 4. Query Supabase student_profiles by user.email
          const { data: sp } = await (supabase as any)
            .from("student_profiles")
            .select("status")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (sp?.status === "suspended") {
            setIsSuspended(true);
            return;
          }

          // 5. Query Supabase class_students by user.email
          const { data: cs } = await (supabase as any)
            .from("class_students")
            .select("status")
            .ilike("email", cleanEmail)
            .maybeSingle();

          if (cs?.status === "suspended") {
            setIsSuspended(true);
            return;
          }

          // 6. Query Supabase notifications table
          const { data: notif } = await (supabase as any)
            .from("notifications")
            .select("id, title")
            .eq("recipient_id", user.id)
            .eq("title", "ACCOUNT_SUSPENDED")
            .maybeSingle();

          if (notif) {
            setIsSuspended(true);
            return;
          }
        }
      } catch (e) {
        console.warn("[SuspensionBanner] Supabase query error:", e);
      }
    };

    verifySuspensionFromDatabase();

    // Real-Time Postgres Channel Subscription
    const channelName = `suspension_banner_realtime_${user.id || user.email}`;
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
            setIsSuspended(true);
          } else if (payload.new?.status === "active") {
            setIsSuspended(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: user.id ? `recipient_id=eq.${user.id}` : undefined,
        },
        (payload: any) => {
          if (payload.new?.title === "ACCOUNT_SUSPENDED") {
            setIsSuspended(true);
          } else if (payload.eventType === "DELETE" && payload.old?.title === "ACCOUNT_SUSPENDED") {
            setIsSuspended(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  if (!isSuspended) {
    return null;
  }

  const handleContactSupport = () => {
    window.dispatchEvent(new CustomEvent("open-contact-support"));
  };

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-4 py-3 shadow-md z-50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full shrink-0">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-black tracking-tight leading-tight">
            Your account has been suspended
          </h4>
          <p className="text-xs text-white/90 leading-snug">
            An administrator has suspended your platform access. Please contact support or your institution administrator for assistance.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleContactSupport}
          className="h-8 text-xs font-semibold bg-white text-rose-700 hover:bg-white/90 border-0 shadow-sm"
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" />
          Contact Support
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => signOut()}
          className="h-8 text-xs font-medium text-white hover:bg-white/20"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
