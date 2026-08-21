import { supabase } from "@/lib/supabase";
import { auditService } from "./audit.service";
import { AppRole, UserStatus } from "@/types";

export const adminService = {
  /**
   * Update user status (active / suspended)
   */
  async setUserStatus(userId: string, status: UserStatus, email?: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("user_id", userId);

      if (error) throw error;

      await auditService.logAction({
        action: status === "suspended" ? "suspend_user" : "activate_user",
        targetUserId: userId,
        targetEmail: email || null,
        details: { new_status: status },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error updating status:", err);
      return { success: false, error: err.message || "Failed to update status" };
    }
  },

  /**
   * Update user role (student <-> lecturer)
   */
  async setUserRole(userId: string, newRole: AppRole, email?: string) {
    try {
      // First check if role record exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      let oldRole = existing?.role || "student";

      if (existing) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      await auditService.logAction({
        action: "change_role",
        targetUserId: userId,
        targetEmail: email || null,
        details: { old_role: oldRole, new_role: newRole },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error changing role:", err);
      return { success: false, error: err.message || "Failed to change role" };
    }
  },

  /**
   * Promote an existing user to Administrator
   */
  async promoteToAdmin(userId: string, email?: string) {
    try {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (error) throw error;

      await auditService.logAction({
        action: "promote_admin",
        targetUserId: userId,
        targetEmail: email || null,
        details: { promoted_to: "admin" },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error promoting to admin:", err);
      return { success: false, error: err.message || "Failed to promote user" };
    }
  },

  /**
   * Permanently delete user via Supabase Edge Function
   */
  async deleteUser(userId: string, email?: string) {
    try {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error deleting user:", err);
      return { success: false, error: err.message || "Failed to delete user" };
    }
  },

  /**
   * Bulk update status for multiple users
   */
  async bulkSetStatus(userIds: string[], status: UserStatus) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .in("user_id", userIds);

      if (error) throw error;

      await auditService.logAction({
        action: status === "suspended" ? "bulk_suspend" : "bulk_activate",
        details: { count: userIds.length, user_ids: userIds, new_status: status },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error in bulk status update:", err);
      return { success: false, error: err.message || "Bulk update failed" };
    }
  },

  /**
   * Get all active administrators
   */
  async getAdmins() {
    try {
      const { data: adminRoles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (error) throw error;

      const adminIds = (adminRoles || []).map((r) => r.user_id);
      if (adminIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", adminIds);

      return profiles || [];
    } catch (err) {
      console.error("[AdminService] Error getting admins:", err);
      return [];
    }
  },
};
