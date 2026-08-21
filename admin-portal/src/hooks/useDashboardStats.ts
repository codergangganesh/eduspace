import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { DashboardStats } from "@/types";

const STATS_CACHE_KEY = "eduspace_admin_dashboard_stats_v2";
const ACTIVITY_CACHE_KEY = "eduspace_admin_dashboard_activity_v2";

export const getCachedStats = (): DashboardStats | undefined => {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.totalStudents === "number") {
      return parsed;
    }
  } catch (err) {
    console.warn("[DashboardStats] Cache parse error:", err);
  }
  return undefined;
};

export const setCachedStats = (stats: DashboardStats) => {
  try {
    if (stats && typeof stats.totalStudents === "number") {
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
    }
  } catch (err) {
    console.warn("[DashboardStats] Cache set error:", err);
  }
};

export const getCachedActivity = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

export const setCachedActivity = (act: any) => {
  try {
    if (act) {
      localStorage.setItem(ACTIVITY_CACHE_KEY, JSON.stringify(act));
    }
  } catch {}
};

export function useDashboardStats() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading: isAuthLoading } = useAdminAuth();

  const isReady = Boolean(user && isAdmin && !isAuthLoading);

  const query = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const result = await dashboardService.getStats();
      if (result && typeof result.totalStudents === "number") {
        setCachedStats(result);
      }
      return result;
    },
    initialData: getCachedStats,
    staleTime: 1000 * 15, // 15 seconds
  });

  const recentActivityQuery = useQuery({
    queryKey: ["admin", "dashboard", "recent-activity"],
    queryFn: async () => {
      const act = await dashboardService.getRecentActivity();
      if (act) setCachedActivity(act);
      return act;
    },
    initialData: getCachedActivity,
    staleTime: 1000 * 30,
  });

  // Setup Realtime subscriptions to invalidate cache on new entries across all tables
  useEffect(() => {
    if (!isReady) return;

    const channel = supabase
      .channel("admin-dashboard-realtime-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lecturer_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_students" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "courses" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quizzes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_audit_logs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignment_submissions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isReady]);

  // If initialData exists in localStorage, isLoading is false immediately
  const hasData = Boolean(query.data && typeof query.data.totalStudents === "number");

  return {
    stats: query.data,
    isLoading: !hasData && (isAuthLoading || query.isLoading),
    isError: !hasData && query.isError,
    error: query.error,
    refetch: query.refetch,
    recentActivity: recentActivityQuery.data,
    isLoadingActivity: !recentActivityQuery.data && (isAuthLoading || recentActivityQuery.isLoading),
  };
}
