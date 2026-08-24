import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function useDashboardStats() {
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoading: isAuthLoading } = useAdminAuth();

  const isReady = Boolean(user && isAdmin && !isAuthLoading);

  const query = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => dashboardService.getStats(),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  const recentActivityQuery = useQuery({
    queryKey: ["admin", "dashboard", "recent-activity"],
    queryFn: () => dashboardService.getRecentActivity(),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  // Setup Realtime subscriptions to invalidate cache on new entries across all tables
  useEffect(() => {
    if (!isReady) return;

    let channel: any = null;
    try {
      const channelName = `admin_dashboard_realtime_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
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
          { event: "*", schema: "public", table: "notifications" },
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
        );
      channel.subscribe();
    } catch (err) {
      console.warn("[useDashboardStats] Realtime subscription error:", err);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, [queryClient, isReady]);

  return {
    stats: query.data,
    isLoading: query.isPending && !query.data,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    recentActivity: recentActivityQuery.data,
    isLoadingActivity: recentActivityQuery.isPending && !recentActivityQuery.data,
  };
}
