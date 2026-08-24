import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { mfaService, MfaFactor } from "@/services/mfa.service";
import { MfaEnrollDrawer, AndroidIcon } from "./MfaEnrollDrawer";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const MfaSecurityCard: React.FC = () => {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [enrollDrawerOpen, setEnrollDrawerOpen] = useState<boolean>(false);
  const [deletingFactor, setDeletingFactor] = useState<MfaFactor | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadFactors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { totpFactors, error } = await mfaService.listFactors();
      if (!error) {
        setFactors(totpFactors);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactors();
  }, [loadFactors]);

  const handleConfirmRemove = async () => {
    if (!deletingFactor) return;

    setIsDeleting(true);
    try {
      const { success, error } = await mfaService.unenrollFactor(deletingFactor.id);
      if (success) {
        toast.success("Authenticator app removed successfully.");
        setDeletingFactor(null);
        loadFactors();
      } else {
        toast.error(error || "Failed to remove authenticator app.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove authenticator app.");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveMfa = factors.some((f) => f.status === "verified");

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shrink-0">
                <AndroidIcon className="size-4" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Two-Factor Authentication (TOTP)
                </h3>
                {hasActiveMfa ? (
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/30 py-0.5 px-2 uppercase tracking-wider shrink-0 whitespace-nowrap">
                    <CheckCircle2 className="size-2.5 mr-1" />
                    Active 2FA
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2 shrink-0 whitespace-nowrap">
                    Not Configured
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require a 6-digit rotating security code from Google Authenticator, Microsoft Authenticator, or Android 2FA app when signing in.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setEnrollDrawerOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="size-3.5" />
            Set Up Authenticator
          </Button>
        </div>

        {/* Factors Listing */}
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-16 bg-muted/40 animate-pulse rounded-xl" />
          </div>
        ) : factors.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
            <div className="mx-auto size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <AndroidIcon className="size-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">No Authenticator App Configured</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Protect your student or lecturer account against unauthorized access by pairing an authenticator app.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEnrollDrawerOpen(true)}
              className="text-xs font-semibold gap-1.5 h-8 mt-1 border-emerald-500/30 text-emerald-600 dark:text-[#3DDC84] hover:bg-emerald-500/10 cursor-pointer"
            >
              <AndroidIcon className="size-3.5" />
              Configure Android / Google Authenticator
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-card border border-border/80 hover:border-emerald-500/40 transition-all shadow-xs gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="size-9 sm:size-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
                    <AndroidIcon className="size-4.5 sm:size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                        {factor.friendly_name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] sm:text-[10px] font-semibold text-emerald-500 border-emerald-500/30 py-0 px-1.5 shrink-0 whitespace-nowrap"
                      >
                        Verified
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-[#3DDC84] bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                        <AndroidIcon className="size-2.5" />
                        Android TOTP
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                        Added on {formatDate(factor.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingFactor(factor)}
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 sm:px-2.5 shrink-0 gap-1 cursor-pointer"
                  title="Remove this 2FA factor"
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Drawer */}
      <MfaEnrollDrawer
        open={enrollDrawerOpen}
        onOpenChange={setEnrollDrawerOpen}
        onEnrollmentSuccess={loadFactors}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={Boolean(deletingFactor)} onOpenChange={(open) => !open && setDeletingFactor(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Remove Authenticator App?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Removing this factor will turn off the Two-Factor Authentication requirement for your account during sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8 gap-1.5"
            >
              {isDeleting ? <RefreshCw className="size-3.5 animate-spin" /> : null}
              Remove Factor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
