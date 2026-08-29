import * as React from "react";
import { useState } from "react";
import { useEarlyWarning } from "@/hooks/useEarlyWarning";
import { RiskScoreCard } from "@/components/early-warning/RiskScoreCard";
import { SubjectHeatmap } from "@/components/early-warning/SubjectHeatmap";
import { AtRiskStudentTable } from "@/components/early-warning/AtRiskStudentTable";
import { EarlyWarningSettingsDialog } from "@/components/early-warning/EarlyWarningSettingsDialog";
import { ExportButton } from "@/components/common/ExportButton";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  RefreshCw,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

export const EarlyWarning: React.FC = () => {
  const {
    atRiskStudents,
    stats,
    settings,
    subjectPerformance,
    isLoading,
    isRefreshing,
    isIntervening,
    isUpdatingSettings,
    refetch,
    sendNudge,
    sendBulkNudge,
    alertLecturer,
    bulkAlertLecturers,
    updateSettings,
    resetSettings,
    isRunningAutomation,
    runAutomationCycle,
  } = useEarlyWarning();

  const [refreshState, setRefreshState] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleRefresh = async () => {
    if (refreshState || isRefreshing) return;
    setRefreshState(true);
    try {
      await refetch();
    } catch (err) {
      toast.error("Failed to refresh retention analytics.");
    } finally {
      setRefreshState(false);
    }
  };

  // Prepare export dataset
  const exportData = atRiskStudents.map((s) => ({
    "Student Name": s.fullName,
    "Student ID": s.studentId,
    Email: s.email,
    Department: s.department,
    "Risk Score": `${s.riskScore}/100`,
    "Risk Level": s.riskLevel.toUpperCase(),
    "Missed Assignments": `${s.missedAssignmentsCount} of ${s.totalAssignmentsCount}`,
    "Failed Quizzes": `${s.failedQuizzesCount} of ${s.totalQuizzesCount}`,
    "Days Inactive": s.daysSinceLastActivity,
    "Primary Risk Drivers": s.factors
      .filter((f) => f.score >= 30)
      .map((f) => `${f.label} (${f.score}%)`)
      .join("; ") || "None",
  }));

  const exportCols = [
    { header: "Student Name", key: "Student Name", width: 25 },
    { header: "Student ID", key: "Student ID", width: 15 },
    { header: "Email", key: "Email", width: 25 },
    { header: "Department", key: "Department", width: 20 },
    { header: "Risk Score", key: "Risk Score", width: 15 },
    { header: "Risk Level", key: "Risk Level", width: 15 },
    { header: "Missed Assignments", key: "Missed Assignments", width: 20 },
    { header: "Failed Quizzes", key: "Failed Quizzes", width: 20 },
    { header: "Days Inactive", key: "Days Inactive", width: 15 },
    { header: "Primary Risk Drivers", key: "Primary Risk Drivers", width: 35 },
  ];

  const activeAutomationRulesCount = (settings.automationRules || []).filter((r) => r.enabled).length;

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-primary/15 text-primary border border-primary/25 shadow-sm shrink-0">
            <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground truncate">
                Early Warning & Retention
              </h1>
              <div className="hidden sm:flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Configurable risk scoring, bottleneck detection, multi-select cohort broadcasts, and hands-free trigger automation.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Configure Weights / Automation Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent shrink-0 rounded-lg"
            title="Configure Algorithm Weights & Automation Rules"
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline ml-1.5">Rules & Weights</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshState || isRefreshing}
            className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent shrink-0 rounded-lg"
            title="Refresh Analytics"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshState || isRefreshing ? "animate-spin text-primary" : ""
              }`}
            />
            <span className="hidden sm:inline ml-1.5">
              {refreshState || isRefreshing ? "Syncing..." : "Refresh"}
            </span>
          </Button>

          <ExportButton
            data={exportData}
            columns={exportCols}
            filename="eduspace_at_risk_students"
            className="h-7 px-2.5 sm:h-9 sm:px-3 text-xs"
          />
        </div>
      </div>

      {/* 1. Summary KPI Cards */}
      <RiskScoreCard stats={stats} isLoading={isLoading} />

      {/* 2. Subject Performance Heatmap Matrix */}
      <SubjectHeatmap data={subjectPerformance} isLoading={isLoading} />

      {/* 3. Filterable At-Risk Students Table with Multi-Select Bulk Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">At-Risk Student Registry</h2>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
            Multi-select supported for cohort intervention dispatch
          </span>
        </div>

        <AtRiskStudentTable
          students={atRiskStudents}
          isLoading={isLoading}
          onSendNudge={sendNudge}
          onSendBulkNudge={sendBulkNudge}
          onAlertLecturer={alertLecturer}
          onBulkAlertLecturers={bulkAlertLecturers}
          isIntervening={isIntervening}
        />
      </div>

      {/* 4. Algorithm Factor Weights, Automation Rules & Cutoffs Settings Drawer */}
      <EarlyWarningSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
        onRunAutomation={runAutomationCycle}
        isSaving={isUpdatingSettings}
        isRunningAutomation={isRunningAutomation}
      />
    </div>
  );
};
export default EarlyWarning;
