import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  DEFAULT_EARLY_WARNING_SETTINGS,
  earlyWarningService,
} from "@/services/earlyWarning.service";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  AtRiskStudent,
  BulkInterventionPayload,
  EarlyWarningSettings,
  EarlyWarningStats,
  InterventionPayload,
  SubjectPerformance,
} from "@/types";
import { toast } from "sonner";

export function useEarlyWarning() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading: isAuthLoading } = useAdminAuth();
  const isReady = Boolean(user && isAdmin && !isAuthLoading);
  const [isIntervening, setIsIntervening] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // 1. Query At-Risk Students & Stats
  const studentsQuery = useQuery({
    queryKey: ["admin", "early-warning", "students"],
    queryFn: () => earlyWarningService.getAtRiskStudents(),
    staleTime: 1000 * 30, // 30s stale time
    refetchOnMount: true,
    enabled: isReady,
  });

  // 2. Query Subject Performance Heatmap
  const subjectQuery = useQuery({
    queryKey: ["admin", "early-warning", "subjects"],
    queryFn: () => earlyWarningService.getSubjectPerformanceData(),
    staleTime: 1000 * 30,
    refetchOnMount: true,
    enabled: isReady,
  });

  // 3. Realtime Supabase Subscriptions for auto-refresh
  useEffect(() => {
    if (!isReady) return;

    let channel: any = null;
    try {
      const channelName = `admin_early_warning_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "assignment_submissions" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quiz_submissions" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_activity_log" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "class_students" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "assignments" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quizzes" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "course_enrollments" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "classes" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "courses" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "student_profiles" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
          }
        );

      channel.subscribe();
    } catch (err) {
      console.warn("[useEarlyWarning] Realtime subscription error:", err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, [queryClient, isReady]);

  // Refetch all queries
  const refetch = async () => {
    await Promise.all([studentsQuery.refetch(), subjectQuery.refetch()]);
  };

  // 1-Click Send Nudge Intervention Handler
  const sendNudge = async (payload: InterventionPayload) => {
    setIsIntervening(true);
    try {
      const res = await earlyWarningService.sendNudgeNotification(payload);
      if (res.success) {
        if (payload.sendEmail) {
          toast.success(`Retention notice & email advisory dispatched to ${payload.studentName}!`);
        } else {
          toast.success(`In-app intervention notice sent to ${payload.studentName}!`);
        }
        queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
        return { success: true };
      } else {
        toast.error(res.error || "Failed to send intervention notification.");
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred while delivering notice.");
      return { success: false, error: err.message };
    } finally {
      setIsIntervening(false);
    }
  };

  // Bulk Nudge Intervention Handler
  const sendBulkNudge = async (payload: BulkInterventionPayload) => {
    setIsIntervening(true);
    try {
      const res = await earlyWarningService.sendBulkNudge(payload);
      if (res.success) {
        if (payload.sendEmail) {
          toast.success(`Retention notice broadcasted to ${res.deliveredCount} student(s) (In-app + Email inbox)!`);
        } else {
          toast.success(`In-app retention notice broadcasted to ${res.deliveredCount} student(s)!`);
        }
        queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
        return { success: true, deliveredCount: res.deliveredCount };
      } else {
        toast.error(res.error || "Failed to broadcast bulk notices.");
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to broadcast bulk notices.");
      return { success: false, error: err.message };
    } finally {
      setIsIntervening(false);
    }
  };

  // 1-Click Alert Faculty Handler
  const alertLecturer = async (params: {
    student: AtRiskStudent;
    customNote?: string;
    sendEmail?: boolean;
    targetLecturerIds?: string[];
  }) => {
    setIsIntervening(true);
    try {
      const res = await earlyWarningService.alertLecturer(params);
      if (res.success) {
        if (params.sendEmail) {
          toast.success(
            `Retention advisory dispatched to ${res.alertedLecturersCount} assigned faculty member(s) (In-app + Email)!`
          );
        } else {
          toast.success(
            `Retention advisory dispatched to ${res.alertedLecturersCount} assigned faculty member(s)!`
          );
        }
        return { success: true, alertedLecturersCount: res.alertedLecturersCount };
      } else {
        toast.error(res.error || "Failed to alert course lecturer.");
        return { success: false, alertedLecturersCount: 0, error: res.error };
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while alerting faculty.");
      return { success: false, alertedLecturersCount: 0, error: err.message };
    } finally {
      setIsIntervening(false);
    }
  };

  // Bulk Alert Faculty Members Handler
  const bulkAlertLecturers = async (params: {
    students: AtRiskStudent[];
    customNote?: string;
    sendEmail?: boolean;
  }) => {
    setIsIntervening(true);
    try {
      const res = await earlyWarningService.bulkAlertLecturers(params);
      if (res.success) {
        if (params.sendEmail) {
          toast.success(
            `Cohort advisory dispatched to ${res.alertedLecturersCount} faculty member(s) across ${res.affectedStudentsCount} student(s) (In-app + Email)!`
          );
        } else {
          toast.success(
            `Cohort advisory dispatched to ${res.alertedLecturersCount} faculty member(s) across ${res.affectedStudentsCount} student(s)!`
          );
        }
        return {
          success: true,
          alertedLecturersCount: res.alertedLecturersCount,
          affectedStudentsCount: res.affectedStudentsCount,
        };
      } else {
        toast.error(res.error || "Failed to dispatch faculty alerts.");
        return { success: false, alertedLecturersCount: 0, affectedStudentsCount: 0, error: res.error };
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch faculty alerts.");
      return { success: false, alertedLecturersCount: 0, affectedStudentsCount: 0, error: err.message };
    } finally {
      setIsIntervening(false);
    }
  };

  // Update & Recalculate with new Weights & Thresholds
  const updateSettings = async (newSettings: EarlyWarningSettings) => {
    setIsUpdatingSettings(true);
    try {
      const res = await earlyWarningService.saveSettings(newSettings);
      if (res.success) {
        toast.success("Early warning algorithm weights and thresholds updated!");
        await queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
        return { success: true };
      } else {
        toast.error("Failed to update algorithm settings.");
        return { success: false };
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating settings.");
      return { success: false };
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Reset settings to default
  const resetSettings = async () => {
    setIsUpdatingSettings(true);
    try {
      await earlyWarningService.resetSettings();
      toast.success("Algorithm settings reset to institutional defaults.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "early-warning"] });
      return { success: true };
    } catch (err: any) {
      toast.error("Failed to reset settings.");
      return { success: false };
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  return {
    atRiskStudents: studentsQuery.data?.students || [],
    stats: studentsQuery.data?.stats || {
      totalStudents: 0,
      totalAtRisk: 0,
      criticalRisk: 0,
      highRisk: 0,
      moderateRisk: 0,
      lowRisk: 0,
      safeCount: 0,
      averageRiskScore: 0,
    },
    settings: studentsQuery.data?.settings || earlyWarningService.getSettings(),
    subjectPerformance: subjectQuery.data || [],
    isLoading: studentsQuery.isLoading || subjectQuery.isLoading,
    isRefreshing: studentsQuery.isFetching || subjectQuery.isFetching,
    isIntervening,
    isUpdatingSettings,
    refetch,
    sendNudge,
    sendBulkNudge,
    alertLecturer,
    bulkAlertLecturers,
    updateSettings,
    resetSettings,
  };
}
