import * as React from "react";
import { useState } from "react";
import { usePinLock } from "@/hooks/usePinLock";
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
  ShieldCheck,
  Smartphone,
  Keyboard,
  Shuffle,
  Cloud,
  History,
  ShieldAlert,
} from "lucide-react";
import { PinSetupModal } from "./PinSetupModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const PinSecurityCard: React.FC = () => {
  const {
    isPinSetup,
    isPinLockEnabled,
    isBiometricsSupported,
    settings,
    pinRotation,
    lockScreen,
    setupPin,
    removePin,
    updateSettings,
    enableBiometrics,
  } = usePinLock();

  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);
  const [setupInitialLockType, setSetupInitialLockType] = useState<"pin" | "password">("pin");
  const [removeDialogOpen, setRemoveDialogOpen] = useState<boolean>(false);

  const isPasswordLock = settings.lockType === "password";

  const handleToggleEnable = (checked: boolean) => {
    if (checked) {
      if (!isPinSetup) {
        setIsUpdatingPin(false);
        setSetupInitialLockType("pin");
        setSetupModalOpen(true);
      } else {
        updateSettings({ enabled: true });
        toast.success(isPasswordLock ? "Password Screen Lock enabled." : "4-Digit Screen Lock enabled.");
      }
    } else {
      updateSettings({ enabled: false });
      toast.info("Screen Lock disabled.");
    }
  };

  const handleToggleBiometrics = async (checked: boolean) => {
    if (checked) {
      try {
        const res = await enableBiometrics();
        if (res.success) {
          updateSettings({ biometricsEnabled: true });
          toast.success("Biometric Unlock enabled for this device!");
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

  const handleOpenChangeSecret = (targetType?: "pin" | "password") => {
    setIsUpdatingPin(true);
    setSetupInitialLockType(targetType || settings.lockType || "pin");
    setSetupModalOpen(true);
  };

  const handleConfirmRemovePin = () => {
    removePin();
    setRemoveDialogOpen(false);
    toast.success("Screen lock credentials removed and screen lock disabled.");
  };

  return (
    <>
      <Card className="border-border shadow-sm bg-card overflow-hidden rounded-2xl">
        {/* Card Header (Responsive for Mobile & Desktop) */}
        <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Title, Badge & Subtitle */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary mt-0.5 sm:mt-0 shadow-2xs">
                {isPasswordLock ? <Lock className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                    Screen Lock & Biometrics
                  </CardTitle>
                  {isPinLockEnabled ? (
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border-emerald-500/30 py-0.5 px-2 uppercase tracking-wider">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />
                      Active ({isPasswordLock ? "Password" : "4-Digit PIN"})
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2">
                      Disabled
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1 text-muted-foreground leading-relaxed">
                  Protect your workspace with an instant 4-digit PIN, custom password, or 1-touch Biometric unlock.
                </CardDescription>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {isPinLockEnabled && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={lockScreen}
                  className="w-full sm:w-auto text-xs font-semibold h-9 px-3.5 gap-2 shadow-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Lock Screen</span>
                </Button>
              )}

              {!isPinSetup ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsUpdatingPin(false);
                    setSetupInitialLockType("pin");
                    setSetupModalOpen(true);
                  }}
                  className="w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-2 shadow-sm rounded-xl cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Set Up Screen Lock</span>
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>

        {/* Card Body */}
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Main Master Toggle Row */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-2xs mt-0.5">
                <Shield className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Label className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" htmlFor="screen-lock-master">
                    Enable Screen Lock
                  </Label>
                  <Badge variant={isPinLockEnabled ? "default" : "outline"} className="text-[9px] py-0 px-1.5 font-bold uppercase">
                    {isPinLockEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Requires your 4-digit PIN or custom password when returning to your device or switching tabs.
                </p>
              </div>
            </div>
            <Switch
              id="screen-lock-master"
              checked={isPinLockEnabled}
              onCheckedChange={handleToggleEnable}
              className="cursor-pointer shrink-0"
            />
          </div>

          {/* Configuration Options (Visible if PIN is configured) */}
          {isPinSetup && (
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-0.5">
                Security Preferences
              </div>

              {/* Grouped Settings Card */}
              <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
                {/* 0. Lock Type Preference Row */}
                <div className="p-3.5 sm:p-4 hover:bg-muted/15 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary shadow-2xs mt-0.5">
                      {isPasswordLock ? <Lock className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Label className="text-xs sm:text-sm font-semibold text-foreground">
                          Lock Type
                        </Label>
                        <Badge variant="outline" className="text-[9px] text-primary border-primary/30 bg-primary/10 py-0 px-1.5 font-bold uppercase">
                          {isPasswordLock ? "Custom Password" : "4-Digit PIN"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Choose between a fast 4-digit numeric PIN or a high-security alphanumeric password.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenChangeSecret(isPasswordLock ? "pin" : "password")}
                      className="h-8 text-xs font-semibold rounded-lg gap-1.5 border-border/80 cursor-pointer shadow-2xs"
                    >
                      {isPasswordLock ? <KeyRound className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-primary" />}
                      <span>Switch to {isPasswordLock ? "4-Digit PIN" : "Password"}</span>
                    </Button>
                  </div>
                </div>

                {/* 1. Biometric Unlock Row */}
                {isBiometricsSupported ? (
                  <div className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/15 transition-colors gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-500 shadow-2xs mt-0.5">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Label className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" htmlFor="biometrics-switch">
                            Biometric Unlock
                          </Label>
                          <Badge variant="outline" className="text-[9px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 py-0 px-1.5 font-bold uppercase">
                            1-Touch
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Instant unlock via Fingerprint, Windows Hello, or Touch ID.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="biometrics-switch"
                      checked={settings.biometricsEnabled}
                      onCheckedChange={handleToggleBiometrics}
                      disabled={!isPinLockEnabled}
                      className="cursor-pointer shrink-0"
                    />
                  </div>
                ) : null}

                {/* 2. Auto-Lock Inactivity Timeout */}
                <div className="p-3.5 sm:p-4 hover:bg-muted/15 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 shadow-2xs mt-0.5">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-xs sm:text-sm font-semibold text-foreground">
                        Inactivity Timeout
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Automatically lock the workspace after no activity.
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-60 shrink-0">
                    <Select
                      value={String(settings.autoLockTimeout)}
                      onValueChange={(val) => {
                        const minutes = parseInt(val, 10);
                        updateSettings({ autoLockTimeout: minutes });
                      }}
                      disabled={!isPinLockEnabled}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-lg w-full bg-muted/30 font-medium">
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="1" className="text-xs">After 1 minute</SelectItem>
                        <SelectItem value="2" className="text-xs">After 2 minutes</SelectItem>
                        <SelectItem value="5" className="text-xs font-semibold">After 5 minutes (Recommended)</SelectItem>
                        <SelectItem value="10" className="text-xs">After 10 minutes</SelectItem>
                        <SelectItem value="15" className="text-xs">After 15 minutes</SelectItem>
                        <SelectItem value="30" className="text-xs">After 30 minutes</SelectItem>
                        <SelectItem value="60" className="text-xs">After 1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 3. Tab Switch Auto-Lock */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/15 transition-colors gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-500 shadow-2xs mt-0.5">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <Label className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" htmlFor="tab-switch-lock">
                        Lock on Tab Switch
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Lock whenever you switch browser tabs or minimize.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="tab-switch-lock"
                    checked={settings.autoLockOnTabSwitch}
                    onCheckedChange={(checked) => updateSettings({ autoLockOnTabSwitch: checked })}
                    disabled={!isPinLockEnabled}
                    className="cursor-pointer shrink-0"
                  />
                </div>

                {/* 4. Randomized Keypad */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/15 transition-colors gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 text-purple-500 shadow-2xs mt-0.5">
                      <Shuffle className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Label className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" htmlFor="randomize-keypad">
                          Randomize Keypad
                        </Label>
                        <Badge variant="outline" className="text-[9px] text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10 py-0 px-1.5 font-bold uppercase">
                          Anti-Spy
                        </Badge>
                        {isPasswordLock && (
                          <Badge variant="secondary" className="text-[8px] py-0 px-1 font-semibold uppercase">
                            PIN Mode
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Shuffles keypad digit positions to prevent shoulder-surfing when unlocking with PIN.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="randomize-keypad"
                    checked={settings.randomizeKeypad}
                    onCheckedChange={(checked) => updateSettings({ randomizeKeypad: checked })}
                    disabled={!isPinLockEnabled}
                    className="cursor-pointer shrink-0"
                  />
                </div>

                {/* 5. Cloud Multi-Device Sync */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/15 transition-colors gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-500 shadow-2xs mt-0.5">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Label className="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" htmlFor="cloud-sync">
                          Cloud Multi-Device Sync
                        </Label>
                        <Badge variant="outline" className="text-[9px] text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10 py-0 px-1.5 font-bold uppercase">
                          Zero-Knowledge
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Seamlessly synchronize your lock credentials across your phone, tablet, and laptop.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="cloud-sync"
                    checked={settings.syncToCloud}
                    onCheckedChange={(checked) => updateSettings({ syncToCloud: checked })}
                    disabled={!isPinLockEnabled}
                    className="cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* 90-Day Rotation & Security Compliance Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                  pinRotation?.isExpiredOrDue
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                    : pinRotation?.isExpiringSoon
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
                    : "bg-muted/30 border-border/70 text-muted-foreground"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {pinRotation?.isExpiredOrDue ? (
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : pinRotation?.isExpiringSoon ? (
                    <History className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>Security Compliance</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] py-0 px-1.5 font-bold uppercase ${
                          pinRotation?.isExpiredOrDue
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : pinRotation?.isExpiringSoon
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {pinRotation?.isExpiredOrDue
                          ? "Rotation Due (90+ Days)"
                          : pinRotation?.isExpiringSoon
                          ? "Expiring Soon"
                          : "Compliant (90-Day Cycle)"}
                      </Badge>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {pinRotation?.isExpiredOrDue
                        ? `Your credentials were created ${pinRotation.pinAgeDays} days ago. For optimal security, consider rotating your credentials.`
                        : pinRotation?.isExpiringSoon
                        ? `Rotation recommended in ${pinRotation.daysRemaining} days (Current age: ${pinRotation.pinAgeDays} days).`
                        : `Updated ${pinRotation?.pinAgeDays === 0 ? "today" : `${pinRotation?.pinAgeDays} days ago`} • ${pinRotation?.daysRemaining} days remaining in compliance cycle.`}
                    </p>
                  </div>
                </div>

                {pinRotation?.isExpiredOrDue && (
                  <button
                    type="button"
                    onClick={() => handleOpenChangeSecret()}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
                  >
                    Rotate Lock Now
                  </button>
                )}
              </div>

              {/* Management Buttons (Clean Symmetrical Grid) */}
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenChangeSecret()}
                  className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 text-foreground font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
                >
                  {isPasswordLock ? <Lock className="h-3.5 w-3.5 text-primary" /> : <KeyRound className="h-3.5 w-3.5 text-primary" />}
                  <span>Change {isPasswordLock ? "Custom Password" : "4-Digit PIN"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRemoveDialogOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Lock & Disable</span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup / Change Secret Modal */}
      <PinSetupModal
        open={setupModalOpen}
        onOpenChange={setSetupModalOpen}
        onPinConfigured={setupPin}
        isUpdating={isUpdatingPin}
        initialLockType={setupInitialLockType}
        currentLockType={settings.lockType || "pin"}
      />

      {/* Remove PIN Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Remove Screen Lock?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove your screen lock credentials? Your workspace will no longer automatically lock when you leave your desk or switch tabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end">
            <AlertDialogCancel className="text-xs h-8.5 rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemovePin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8.5 rounded-xl"
            >
              Yes, Remove Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
