import { supabase } from "@/lib/supabase";

export const activityService = {
  async getActivityLogs(options: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = options;

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from("user_activity_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Fetch user profile info for these activity rows
      const userIds = Array.from(new Set((data || []).map((d) => d.user_id).filter(Boolean)));
      let userMap: Record<string, { full_name: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        (profiles || []).forEach((p) => {
          userMap[p.user_id] = {
            full_name: p.full_name || "Unknown User",
            email: p.email || "",
          };
        });
      }

      const enriched = (data || []).map((item) => ({
        ...item,
        user: item.user_id ? userMap[item.user_id] : null,
      }));

      return {
        data: enriched,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (err) {
      console.error("[ActivityService] Error fetching activity logs:", err);
      throw err;
    }
  },
};
