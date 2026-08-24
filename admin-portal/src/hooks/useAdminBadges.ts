import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminBadges {
  unreadMessagesCount: number;
  recentAuditLogsCount: number;
  pendingRequestsCount: number;
  totalClassesCount: number;
}

export function useAdminBadges() {
  const [badges, setBadges] = useState<AdminBadges>({
    unreadMessagesCount: 0,
    recentAuditLogsCount: 0,
    pendingRequestsCount: 0,
    totalClassesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBadgeCounts = async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      let auditCount = 0;
      let messagesCount = 0;

      try {
        const auditRes = await supabase
          .from("admin_audit_logs")
          .select("id", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo);
        auditCount = auditRes.count || 0;
      } catch (_) {}

      try {
        const msgRes = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo);
        messagesCount = msgRes.count || 0;
      } catch (_) {}

      setBadges({
        unreadMessagesCount: messagesCount,
        recentAuditLogsCount: auditCount,
        pendingRequestsCount: 0,
        totalClassesCount: 0,
      });
    } catch (err) {
      console.warn("[useAdminBadges] Error fetching badges:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();

    // Set up Realtime subscriptions on messages and audit logs
    let channel: any = null;
    try {
      const channelName = `admin_badges_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          () => {
            setBadges((prev) => ({
              ...prev,
              unreadMessagesCount: prev.unreadMessagesCount + 1,
            }));
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "admin_audit_logs" },
          () => {
            setBadges((prev) => ({
              ...prev,
              recentAuditLogsCount: prev.recentAuditLogsCount + 1,
            }));
          }
        );
      channel.subscribe();
    } catch (err) {
      console.warn("[useAdminBadges] Realtime subscription error:", err);
    }

    // Poll every 45s as a fallback
    const interval = setInterval(fetchBadgeCounts, 45000);

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
      clearInterval(interval);
    };
  }, []);

  return { badges, isLoading, refetchBadges: fetchBadgeCounts };
}
