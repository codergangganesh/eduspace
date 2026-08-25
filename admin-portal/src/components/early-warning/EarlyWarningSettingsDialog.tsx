import * as React from "react";
import { useState, useEffect } from "react";
import { EarlyWarningAutomationExecutionLog, EarlyWarningSettings } from "@/types";
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
  Check,
  CheckCircle2,
  Clock,
  FileQuestion,
  FileX2,
  History,
  RotateCcw,
  Save,
  ShieldAlert,
  Sliders,
  TrendingDown,
  Zap,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DEFAULT_AUTOMATION_RULES } from "@/services/earlyWarning.service";

interface EarlyWarningSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: EarlyWarningSettings;
  onSave: (settings: EarlyWarningSettings) => Promise<{ success: boolean }>;
  onReset: () => Promise<{ success: boolean }>;
  onRunAutomation?: () => Promise<{ success: boolean; log?: EarlyWarningAutomationExecutionLog }>;
  isSaving?: boolean;
  isRunningAutomation?: boolean;
}

export const EarlyWarningSettingsDialog: React.FC<EarlyWarningSettingsDialogProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  onReset,
  onRunAutomation,
  isSaving = false,
  isRunningAutomation = false,
}) => {
  const [settings, setSettings] = useState<EarlyWarningSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<"weights" | "automation" | "history">("weights");
  const [executionLogs, setExecutionLogs] = useState<EarlyWarningAutomationExecutionLog[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setSettings({
      ...currentSettings,
      automationRules: currentSettings.automationRules || DEFAULT_AUTOMATION_RULES,
      automationEnabled: currentSettings.automationEnabled ?? true,
    });
  }, [currentSettings, isOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem("eduspace_early_warning_automation_logs");
        if (raw) setExecutionLogs(JSON.parse(raw));
      } catch (e) {
        setExecutionLogs([]);
      }
    }
  }, [isOpen, isRunningAutomation]);

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

  const handleToggleRule = (ruleId: string) => {
    setSettings((prev) => {
      const rules = (prev.automationRules || DEFAULT_AUTOMATION_RULES).map((r) => {
        if (r.id === ruleId) return { ...r, enabled: !r.enabled };
        return r;
      });
      return { ...prev, automationRules: rules };
    });
  };

  const handleRuleThresholdChange = (ruleId: string, value: number) => {
    setSettings((prev) => {
      const rules = (prev.automationRules || DEFAULT_AUTOMATION_RULES).map((r) => {
        if (r.id === ruleId) return { ...r, thresholdValue: Math.max(1, value) };
        return r;
      });
      return { ...prev, automationRules: rules };
    });
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

  const handleTriggerAutomationNow = async () => {
    if (onRunAutomation) {
      const res = await onRunAutomation();
      if (res.success && res.log) {
        setExecutionLogs((prev) => [res.log!, ...prev.slice(0, 19)]);
      }
    }
  };

  const factorWeights = [
    {
      key: "missedAssignmentsWeight" as keyof EarlyWarningSettings,
      label: "Missed Assignments",
      desc: "Unsubmitted or overdue tasks",
      icon: FileX2,
    },
    {
      key: "quizDeclineWeight" as keyof EarlyWarningSettings,
      label: "Quiz Trend Decline",
      desc: "Score drops between recent quizzes",
      icon: TrendingDown,
    },
    {
      key: "inactivityWeight" as keyof EarlyWarningSettings,
      label: "Platform Inactivity",
      desc: "Days since last portal activity",
      icon: Clock,
    },
    {
      key: "failedQuizzesWeight" as keyof EarlyWarningSettings,
      label: "Failed Quizzes",
      desc: "Quizzes scored below 50%",
      icon: FileQuestion,
    },
  ];

  const rulesList = settings.automationRules || DEFAULT_AUTOMATION_RULES;
  const activeRulesCount = rulesList.filter((r) => r.enabled).length;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "bg-card p-0 flex flex-col shadow-xl overflow-hidden z-50",
          isMobile
            ? "h-[88vh] max-h-[88vh] rounded-t-2xl border-t border-border"
            : "w-full sm:max-w-lg md:max-w-xl border-l border-border"
        )}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
        )}

        {/* Header */}
        <SheetHeader className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle className="text-sm sm:text-base font-bold text-foreground">
                Early Warning Settings
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Manage risk weights, thresholds, and auto-nudges
              </SheetDescription>
            </div>

            <Badge variant="outline" className="text-[10px] font-semibold">
              {settings.automationEnabled ? `${activeRulesCount} Rules On` : "Auto Off"}
            </Badge>
          </div>

          {/* Navigation Tab Bar */}
          <div className="mt-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9 p-1 bg-muted/80 border border-border/60 rounded-xl">
                <TabsTrigger
                  value="weights"
                  className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                >
                  <Sliders className="size-3.5 shrink-0" />
                  <span className="truncate">Weights & Cutoffs</span>
                </TabsTrigger>

                <TabsTrigger
                  value="automation"
                  className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                >
                  <Zap className="size-3.5 shrink-0" />
                  <span className="truncate">Auto-Rules ({activeRulesCount})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="history"
                  className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-xs transition-all"
                >
                  <History className="size-3.5 shrink-0" />
                  <span className="truncate">History</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ======================================================== */}
            {/* TAB 1: WEIGHTS & CUTOFFS                                */}
            {/* ======================================================== */}
            {activeTab === "weights" && (
              <div className="space-y-4">
                {/* Total Weight Summary */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-background">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Total Weight Sum:</span>
                    <span className={cn("font-bold", isWeightValid ? "text-emerald-600" : "text-destructive")}>
                      {totalWeight}%
                    </span>
                  </div>
                  {isWeightValid ? (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="size-3" /> Valid (100%)
                    </span>
                  ) : (
                    <span className="text-[11px] text-destructive font-medium">
                      Must equal 100%
                    </span>
                  )}
                </div>

                {/* 4 Factor Weights List */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">Risk Factors (Percentages)</Label>
                  <div className="space-y-1.5">
                    {factorWeights.map((f) => {
                      const val = Number(settings[f.key] || 0);

                      return (
                        <div
                          key={f.key}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                        >
                          <div>
                            <span className="font-semibold text-foreground block">{f.label}</span>
                            <span className="text-[10px] text-muted-foreground block">{f.desc}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={val}
                              onChange={(e) => handleWeightChange(f.key, parseInt(e.target.value) || 0)}
                              className="h-7 w-16 text-center text-xs font-bold bg-background"
                            />
                            <span className="text-xs text-muted-foreground font-semibold">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Cutoffs */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-bold text-foreground">Risk Threshold Cutoffs</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg border border-border bg-card">
                      <span className="text-[11px] text-muted-foreground block">Critical Tier (≥)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={50}
                          max={99}
                          value={settings.criticalThreshold}
                          onChange={(e) =>
                            setSettings({ ...settings, criticalThreshold: parseInt(e.target.value) || 75 })
                          }
                          className="h-7 text-xs font-semibold bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg border border-border bg-card">
                      <span className="text-[11px] text-muted-foreground block">High Risk (≥)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={30}
                          max={80}
                          value={settings.highThreshold}
                          onChange={(e) => setSettings({ ...settings, highThreshold: parseInt(e.target.value) || 60 })}
                          className="h-7 text-xs font-semibold bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg border border-border bg-card">
                      <span className="text-[11px] text-muted-foreground block">Moderate Risk (≥)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={20}
                          max={60}
                          value={settings.moderateThreshold}
                          onChange={(e) =>
                            setSettings({ ...settings, moderateThreshold: parseInt(e.target.value) || 40 })
                          }
                          className="h-7 text-xs font-semibold bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">pts</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg border border-border bg-card">
                      <span className="text-[11px] text-muted-foreground block">Inactivity (≥)</span>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          min={3}
                          max={60}
                          value={settings.inactivityDaysThreshold}
                          onChange={(e) =>
                            setSettings({ ...settings, inactivityDaysThreshold: parseInt(e.target.value) || 14 })
                          }
                          className="h-7 text-xs font-semibold bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: AUTOMATION RULES                                 */}
            {/* ======================================================== */}
            {activeTab === "automation" && (
              <div className="space-y-3">
                {/* Master Switch */}
                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">Enable Auto-Nudges</span>
                    <span className="text-[11px] text-muted-foreground">
                      Automatically send notices when rules trigger
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.automationEnabled}
                    onChange={(e) => setSettings({ ...settings, automationEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer"
                  />
                </div>

                {/* Rules List */}
                <div className="space-y-2">
                  {rulesList.map((rule) => (
                    <div
                      key={rule.id}
                      className={cn(
                        "p-3 rounded-lg border text-xs space-y-2 transition-colors",
                        rule.enabled ? "bg-card border-border" : "bg-muted/40 border-border/50 opacity-75"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2 cursor-pointer min-w-0">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer mt-0.5 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block">{rule.name}</span>
                            <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">
                              {rule.description}
                            </span>
                          </div>
                        </label>
                      </div>

                      {rule.enabled && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Threshold:</span>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={rule.thresholdValue}
                              onChange={(e) =>
                                handleRuleThresholdChange(rule.id, parseInt(e.target.value) || rule.thresholdValue)
                              }
                              className="h-6 w-14 text-center text-xs font-semibold bg-background"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {rule.triggerType === "inactivity" ? "days" : rule.triggerType === "critical_risk" ? "score" : "quizzes"}
                            </span>
                          </div>

                          <Badge variant="outline" className="text-[9px] font-medium">
                            {rule.actionType === "both"
                              ? "Student + Faculty"
                              : rule.actionType === "faculty_alert"
                              ? "Faculty"
                              : "Student"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: HISTORY                                          */}
            {/* ======================================================== */}
            {activeTab === "history" && (
              <div className="space-y-3 text-xs">
                {/* Run Test Now Button */}
                <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-foreground block">Test Automation</span>
                    <span className="text-[11px] text-muted-foreground">Evaluate rules right now</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTriggerAutomationNow}
                    disabled={isRunningAutomation || !onRunAutomation}
                    className="h-7 text-xs font-semibold gap-1"
                  >
                    <Zap className={cn("size-3", isRunningAutomation && "animate-spin")} />
                    <span>{isRunningAutomation ? "Running..." : "Run Test Now"}</span>
                  </Button>
                </div>

                {/* History List */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Past Runs</Label>
                  {executionLogs.length === 0 ? (
                    <p className="text-muted-foreground text-[11px] p-3 text-center border rounded-lg">
                      No past runs recorded. Click "Run Test Now" to run a cycle.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {executionLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">
                              {new Date(log.executedAt).toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-[9px]">
                              {log.rulesTriggeredCount} Triggered
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {log.studentsAffectedCount} student(s) · {log.emailsDispatchedCount} email(s) sent
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
            >
              Reset
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSaving}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || !isWeightValid}
                className="h-8 text-xs font-semibold"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
