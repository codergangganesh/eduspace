import * as React from "react";
import { useState } from "react";
import { useAdminPinLock } from "@/hooks/useAdminPinLock";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Shield,
  KeyRound,
  Lock,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";
import { AdminPinSetupModal } from "./AdminPinSetupModal";
import { toast } from "sonner";

export const AdminPinSecurityCard: React.FC = () => {
  const {
    isPinSetup,
    isPinLockEnabled,
    isBiometricsSupported,
    settings,
    lockScreen,
    setupPin,
    removePin,
    updateSettings,
    enableBiometrics,
  } = useAdminPinLock();

  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState<boolean>(false);

  const handleToggleEnable = (checked: boolean) => {
    if (checked) {
      if (!isPinSetup) {
        setIsUpdatingPin(false);
        setSetupModalOpen(true);
      } else {
        updateSettings({ enabled: true });
        toast.success("4-Digit Screen Lock enabled.");
      }
    } else {
      updateSettings({ enabled: false });
      toast.info("4-Digit Screen Lock disabled.");
    }
  };

  const handleToggleBiometrics = async (checked: boolean) => {
    if (checked) {
      try {
        const res = await enableBiometrics();
        if (res.success) {
          updateSettings({ biometricsEnabled: true });
          toast.success("Biometric Unlock enabled for this workstation!");
        } else {
          toast.error(res.error || "Failed to enable biometrics.");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to enable biometrics.");
      }
    } else {
      updateSettings({ biometricsEnabled: false });
      toast.info("Biometric unlock disabled.");
    }
  };

  const handleOpenChangePin = () => {
    setIsUpdatingPin(true);
    setSetupModalOpen(true);
  };

  const handleConfirmRemovePin = () => {
    removePin();
    setRemoveDialogOpen(false);
    toast.success("4-Digit PIN has been removed and screen lock disabled.");
  };

  return (
    <>
      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-foreground">
                <KeyRound className="h-4 w-4 text-primary shrink-0" />
                4-Digit In-App Screen Lock & Biometrics
              </CardTitle>
              {isPinLockEnabled ? (
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 border-emerald-500/30 py-0 px-2 uppercase tracking-wider">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  Enabled
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-medium py-0 px-2">
                  Disabled
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Lock the Admin Portal with an instant 4-digit PIN or 1-touch Fingerprint/Face ID when away from your desk.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPinLockEnabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={lockScreen}
                className="text-xs font-semibold h-8 gap-1.5 shadow-2xs cursor-pointer"
                title="Lock portal immediately"
              >
                <Lock className="h-3.5 w-3.5 text-primary" />
                Lock Screen Now
              </Button>
            )}

            {!isPinSetup ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsUpdatingPin(false);
                  setSetupModalOpen(true);
                }}
                className="text-xs font-semibold h-8 gap-1.5 shadow-sm cursor-pointer"
              >
                <Shield className="h-3.5 w-3.5" />
                Set Up PIN
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-5 space-y-5">
          {/* Main Toggle Row */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/10">
            <div className="space-y-0.5 pr-4">
              <Label className="text-xs font-bold text-foreground cursor-pointer" htmlFor="screen-lock-switch">
                Enable In-App Screen Lock
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Requires entering your 4-digit PIN or scanning your fingerprint to access institutional controls.
              </p>
            </div>
            <Switch
              id="screen-lock-switch"
              checked={isPinLockEnabled}
              onCheckedChange={handleToggleEnable}
              className="cursor-pointer"
            />
          </div>

          {/* Configuration Options (Visible if PIN is configured) */}
          {isPinSetup && (
            <div className="space-y-4 pt-2 border-t border-border/40">
              {/* Biometric Toggle Row */}
              {isBiometricsSupported ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5" htmlFor="biometrics-switch">
                        <Fingerprint className="h-3.5 w-3.5 text-primary" />
                        Allow Biometric Unlock (Fingerprint / Touch ID / Face ID)
                      </Label>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 py-0 px-1.5 font-bold uppercase">
                        1-Touch
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Instantly unlock the portal using Windows Hello, Touch ID, or your device's fingerprint scanner.
                    </p>
                  </div>
                  <Switch
                    id="biometrics-switch"
                    checked={settings.biometricsEnabled}
                    onCheckedChange={handleToggleBiometrics}
                    disabled={!isPinLockEnabled}
                    className="cursor-pointer"
                  />
                </div>
              ) : null}

              {/* Timeout Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Auto-Lock Inactivity Timeout
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically locks the portal after no mouse or keyboard activity.
                  </p>
                </div>
                <Select
                  value={String(settings.autoLockTimeout)}
                  onValueChange={(val) => {
                    const minutes = parseInt(val, 10);
                    updateSettings({ autoLockTimeout: minutes });
                    toast.success(`Auto-lock timeout set to ${minutes} minute${minutes === 1 ? "" : "s"}.`);
                  }}
                  disabled={!isPinLockEnabled}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">After 1 minute of inactivity</SelectItem>
                    <SelectItem value="2">After 2 minutes of inactivity</SelectItem>
                    <SelectItem value="5">After 5 minutes of inactivity (Recommended)</SelectItem>
                    <SelectItem value="10">After 10 minutes of inactivity</SelectItem>
                    <SelectItem value="15">After 15 minutes of inactivity</SelectItem>
                    <SelectItem value="30">After 30 minutes of inactivity</SelectItem>
                    <SelectItem value="60">After 1 hour of inactivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tab Switch Auto-Lock */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                <div className="space-y-0.5 pr-4">
                  <Label className="text-xs font-semibold text-foreground cursor-pointer" htmlFor="tab-switch-lock">
                    Lock on Tab Switch or Minimize
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Immediately locks the portal whenever you switch to another browser tab or minimize the browser.
                  </p>
                </div>
                <Switch
                  id="tab-switch-lock"
                  checked={settings.autoLockOnTabSwitch}
                  onCheckedChange={(checked) => updateSettings({ autoLockOnTabSwitch: checked })}
                  disabled={!isPinLockEnabled}
                  className="cursor-pointer"
                />
              </div>

              {/* PIN Management Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenChangePin}
                  className="text-xs font-semibold h-8 gap-1.5 cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  Change 4-Digit PIN
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveDialogOpen(true)}
                  className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove PIN & Disable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup / Change PIN Modal */}
      <AdminPinSetupModal
        open={setupModalOpen}
        onOpenChange={setSetupModalOpen}
        onPinConfigured={setupPin}
        isUpdating={isUpdatingPin}
      />

      {/* Remove PIN Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove 4-Digit Screen Lock?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove your 4-digit PIN? Your portal will no longer automatically lock when you leave your desk or switch tabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemovePin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8"
            >
              Yes, Remove PIN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
