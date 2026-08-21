import { supabase } from "@/lib/supabase";
import { AdminAuditLog } from "@/types";

export const auditService = {
  async logAction(params: {
    action: string;
    targetUserId?: string | null;
    targetEmail?: string | null;
    details?: Record<string, any>;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: params.action,
        target_user_id: params.targetUserId || null,
        target_email: params.targetEmail || null,
        details: params.details || {},
      });
    } catch (err) {
      console.warn("[AuditService] Failed to record audit log:", err);
    }
  },

  async getAuditLogs(options: { page?: number; pageSize?: number; search?: string } = {}) {
    const { page = 1, pageSize = 20, search = "" } = options;

    try {
      let query = supabase.from("admin_audit_logs").select("*", { count: "exact" });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(`action.ilike.%${s}%,target_email.ilike.%${s}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Fetch admin names
      const adminIds = Array.from(new Set((data || []).map((d) => d.admin_id)));
      let adminMap: Record<string, { full_name: string; email: string }> = {};

      if (adminIds.length > 0) {
        const { data: adminProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", adminIds);

        (adminProfiles || []).forEach((p) => {
          adminMap[p.user_id] = {
            full_name: p.full_name || "Admin",
            email: p.email || "",
          };
        });
      }

      const enriched: AdminAuditLog[] = (data || []).map((item) => ({
        id: item.id,
        admin_id: item.admin_id,
        admin_name: adminMap[item.admin_id]?.full_name || "Admin",
        admin_email: adminMap[item.admin_id]?.email || "",
        action: item.action,
        target_user_id: item.target_user_id,
        target_email: item.target_email,
        details: item.details || {},
        created_at: item.created_at,
      }));

      return {
        data: enriched,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (err) {
      console.error("[AuditService] Error fetching audit logs:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },
};
