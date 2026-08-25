import * as React from "react";
import { useState, useEffect } from "react";
import { EarlyWarningSettings } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileQuestion,
  FileX2,
  RotateCcw,
  Save,
  Settings,
  Sliders,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EarlyWarningSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: EarlyWarningSettings;
  onSave: (settings: EarlyWarningSettings) => Promise<{ success: boolean }>;
  onReset: () => Promise<{ success: boolean }>;
  isSaving?: boolean;
}

export const EarlyWarningSettingsDialog: React.FC<EarlyWarningSettingsDialogProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  onReset,
  isSaving = false,
}) => {
  const [settings, setSettings] = useState<EarlyWarningSettings>(currentSettings);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings, isOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalWeight =
    Number(settings.missedAssignmentsWeight || 0) +
    Number(settings.quizDeclineWeight || 0) +
    Number(settings.inactivityWeight || 0) +
    Number(settings.failedQuizzesWeight || 0);

  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (key: keyof EarlyWarningSettings, val: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, val)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) return;
    const res = await onSave(settings);
    if (res.success) {
      onClose();
    }
  };

  const handleResetDefaults = async () => {
    const res = await onReset();
    if (res.success) {
      onClose();
    }
  };

  const factorWeights = [
    {
      key: "missedAssignmentsWeight" as keyof EarlyWarningSettings,
      label: "Missed Assignments",
      desc: "Penalizes past-due coursework and unsubmitted milestone tasks.",
      icon: FileX2,
      iconColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      key: "quizDeclineWeight" as keyof EarlyWarningSettings,
      label: "Quiz Score Decline Trend",
      desc: "Detects drop-offs between baseline and recent assessment attempts.",
      icon: TrendingDown,
      iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      key: "inactivityWeight" as keyof EarlyWarningSettings,
      label: "Platform Inactivity",
      desc: "Evaluates consecutive elapsed days without portal logins or submissions.",
      icon: Clock,
      iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      key: "failedQuizzesWeight" as keyof EarlyWarningSettings,
      label: "Failed Quizzes Ratio",
      desc: "Percentage of taken quizzes falling below passing cutoff.",
      icon: FileQuestion,
      iconColor: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "bg-card p-0 flex flex-col shadow-2xl overflow-hidden z-50",
          isMobile
            ? "h-[90vh] max-h-[90vh] rounded-t-3xl border-t border-border/80"
            : "w-full sm:max-w-xl md:max-w-2xl border-l border-border/80"
        )}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
        )}

        {/* Header */}
        <SheetHeader className="px-5 py-3 sm:px-6 sm:py-4 border-b border-border/60 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5 pr-8">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
              <Sliders className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                Algorithm & Factor Weights Configuration
              </SheetTitle>
              <SheetDescription className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Customize institution-wide risk weightings and severity tier thresholds
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Total Weight Validator Banner */}
            <div
              className={cn(
                "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors",
                isWeightValid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isWeightValid ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 text-rose-500 shrink-0 animate-pulse" />
                )}
                <span className="font-semibold truncate text-[11px] sm:text-xs">
                  {isWeightValid
                    ? "Weight allocation is balanced (Total: 100%)"
                    : `Total weight sum must equal 100% (Current: ${totalWeight}%)`}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider shrink-0",
                  isWeightValid
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30"
                )}
              >
                {totalWeight}% / 100%
              </Badge>
            </div>

            {/* Section 1: 4 Factor Weight Sliders */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Risk Factor Weights (%)
                </Label>
                <span className="text-[10px] text-muted-foreground">Adjust percentage influence</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {factorWeights.map((factor) => {
                  const Icon = factor.icon;
                  const currentVal = Number(settings[factor.key]) || 0;
                  return (
                    <div
                      key={factor.key}
                      className="p-3 rounded-xl bg-card/60 border border-border/70 space-y-2 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("p-1.5 rounded-lg border shrink-0", factor.iconColor)}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-foreground truncate">{factor.label}</h5>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{factor.desc}</p>
                          </div>
                        </div>

                        {/* Number Input / Tag */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={currentVal}
                            onChange={(e) => handleWeightChange(factor.key, parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-xs font-black text-center bg-background/80"
                          />
                          <span className="text-xs font-bold text-muted-foreground">%</span>
                        </div>
                      </div>

                      {/* Native Range Slider */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={currentVal}
                        onChange={(e) => handleWeightChange(factor.key, parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Severity Cutoff Thresholds */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Risk Tier Score Thresholds (0–100)
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase block">
                    Critical Tier (≥)
                  </span>
                  <Input
                    type="number"
                    value={settings.criticalThreshold}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, criticalThreshold: parseInt(e.target.value) || 75 }))
                    }
                    className="h-7 text-xs font-bold bg-background/80"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">
                    High Risk (≥)
                  </span>
                  <Input
                    type="number"
                    value={settings.highThreshold}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, highThreshold: parseInt(e.target.value) || 60 }))
                    }
                    className="h-7 text-xs font-bold bg-background/80"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">
                    Moderate (≥)
                  </span>
                  <Input
                    type="number"
                    value={settings.moderateThreshold}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, moderateThreshold: parseInt(e.target.value) || 40 }))
                    }
                    className="h-7 text-xs font-bold bg-background/80"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                    Low Risk (≥)
                  </span>
                  <Input
                    type="number"
                    value={settings.lowThreshold}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, lowThreshold: parseInt(e.target.value) || 20 }))
                    }
                    className="h-7 text-xs font-bold bg-background/80"
                  />
                </div>
              </div>
            </div>

            {/* Inactivity Threshold Days */}
            <div className="p-3 rounded-xl bg-card/60 border border-border/70 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="font-bold text-foreground block">Inactivity Warning Trigger</span>
                <p className="text-[10px] text-muted-foreground">Days without login before flagging</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.inactivityDaysThreshold}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      inactivityDaysThreshold: parseInt(e.target.value) || 14,
                    }))
                  }
                  className="w-16 h-7 text-xs font-bold text-center bg-background/80"
                />
                <span className="text-xs text-muted-foreground font-semibold">days</span>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <SheetFooter className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/30 flex flex-row items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="h-8 sm:h-9 text-xs font-semibold gap-1"
            >
              <RotateCcw className="size-3" />
              <span>Reset Defaults</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
                className="h-8 sm:h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || !isWeightValid}
                className="h-8 sm:h-9 text-xs font-semibold shadow-md shadow-primary/20 gap-1.5 min-w-[130px]"
              >
                <Save className="size-3.5" />
                {isSaving ? "Saving..." : "Apply & Recalculate"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
