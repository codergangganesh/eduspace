import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { Smartphone, ShieldCheck, Plus, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { mfaService, MfaFactor } from "@/services/mfa.service";
import { AdminMfaEnrollModal } from "./AdminMfaEnrollModal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

// Sleek Official Android Bugdroid Icon
const AndroidIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.156-.2701.0633-.6159-.2068-.7719-.2698-.1561-.6159-.0633-.7719.2069l-2.0227 3.5034c-1.3916-.6337-2.9439-.9939-4.5761-.9939s-3.1845.3602-4.5761.9939L5.7011 5.3025c-.156-.2702-.5021-.363-.7719-.2069-.2701.156-.3628.5018-.2068.7719l1.996 3.4572C3.0458 11.238 0 15.5397 0 20.6128h24c0-5.0731-3.0458-9.3748-6.1185-11.2914" />
  </svg>
);

export const AdminMfaSecurityCard: React.FC = () => {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [enrollModalOpen, setEnrollModalOpen] = useState<boolean>(false);
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
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                <Smartphone className="h-4 w-4 text-primary shrink-0" />
                Two-Factor Authentication (TOTP)
              </CardTitle>
              {hasActiveMfa ? (
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/30 py-0.5 px-2 uppercase tracking-wider shrink-0 whitespace-nowrap">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  Active 2FA
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2 shrink-0 whitespace-nowrap">
                  Not Configured
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Require a 6-digit rotating security code from Google Authenticator, Microsoft Authenticator, or Authy when signing in.
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setEnrollModalOpen(true)}
            className="text-xs font-semibold h-8 sm:h-9 gap-1.5 shadow-sm w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Set Up Authenticator App
          </Button>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-5 space-y-4">
          {isLoading ? (
            <div className="space-y-2.5 py-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : factors.length === 0 ? (
            <div className="text-center py-6 px-4 rounded-2xl border-2 border-dashed border-border/70 bg-muted/10 space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-foreground">No Authenticator App Configured</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Protect your administrator account against unauthorized logins by pairing an authenticator app.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEnrollModalOpen(true)}
                className="text-xs font-semibold gap-1.5 h-8 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                Configure Google Authenticator
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-all shadow-xs gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-[#3DDC84] border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <AndroidIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
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
                          <AndroidIcon className="w-2.5 h-2.5" />
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
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrollment Modal */}
      <AdminMfaEnrollModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onEnrollmentSuccess={loadFactors}
      />

      {/* Remove Confirmation Modal */}
      <AlertDialog open={Boolean(deletingFactor)} onOpenChange={(open) => !open && setDeletingFactor(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove Authenticator App?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Removing this 2FA factor will disable two-factor authentication requirement for your account during sign-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8 gap-1.5"
            >
              {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
              Remove Factor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
