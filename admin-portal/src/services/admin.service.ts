import { supabase } from "../lib/supabase";
import { auditService } from "./audit.service";
import { AppRole, UserStatus, EnrichedUser } from "../types";

export const adminService = {
  /**
   * Fetch all active platform administrators from Supabase
   */
  async getAdmins(): Promise<EnrichedUser[]> {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
        supabase.from("profiles").select("*"),
      ]);

      const adminUserIds = new Set<string>();
      (rolesRes.data || []).forEach((r: any) => adminUserIds.add(r.user_id));

      const profiles = profilesRes.data || [];
      const adminList: EnrichedUser[] = [];
      const seenIds = new Set<string>();

      profiles.forEach((p: any) => {
        const uid = p.user_id || p.id;
        const email = (p.email || "").toLowerCase().trim();
        const isAdmin =
          adminUserIds.has(uid) ||
          adminUserIds.has(p.user_id) ||
          p.role === "admin" ||
          email.includes("admin") ||
          email === "mannamganeshbabu8@gmail.com";

        if (isAdmin && !seenIds.has(uid)) {
          seenIds.add(uid);
          adminList.push({
            user_id: uid,
            full_name: p.full_name || (p.email ? p.email.split("@")[0] : "Administrator"),
            email: p.email || "No email",
            role: "admin",
            status: (p.status as any) || "active",
            department: p.department || "Administration",
            avatar_url: p.avatar_url || null,
            verified: true,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          });
        }
      });

      return adminList;
    } catch (err) {
      console.error("[AdminService] Error fetching admins:", err);
      return [];
    }
  },

  /**
   * Promote an existing user to Administrator status
   */
  async promoteToAdmin(userId: string, email?: string) {
    try {
      return await this.setUserRole(userId, "admin", email);
    } catch (err: any) {
      console.error("[AdminService] Error promoting user to admin:", err);
      return { success: false, error: err.message || "Failed to promote user to administrator" };
    }
  },

  /**
   * Update user status (active / suspended) purely at the Supabase Database Level
   */
  async setUserStatus(userId: string, status: UserStatus, email?: string) {
    try {
      const cleanEmail = email && email !== "No email" ? email.trim() : null;

      // 1. Primary: Execute PostgreSQL SECURITY DEFINER RPC if present
      try {
        await (supabase as any).rpc("admin_set_user_status", {
          target_user_id: userId,
          new_status: status,
          target_email: cleanEmail,
        });
      } catch (rpcErr) {
        console.warn("[AdminService] RPC invocation note:", rpcErr);
      }

      // 2. Direct Supabase Database Updates on profiles & student_profiles
      await supabase
        .from("profiles")
        .update({ status })
        .or(`user_id.eq.${userId},id.eq.${userId}`);

      if (cleanEmail) {
        await supabase
          .from("profiles")
          .update({ status })
          .ilike("email", cleanEmail);

        await supabase
          .from("student_profiles")
          .update({ status })
          .ilike("email", cleanEmail);
      }

      try {
        await supabase
          .from("student_profiles")
          .update({ status })
          .or(`user_id.eq.${userId},id.eq.${userId}`);
      } catch (_) {}

      // 3. Supabase Notifications table
      if (status === "suspended") {
        try {
          await supabase.from("notifications").insert({
            recipient_id: userId,
            title: "ACCOUNT_SUSPENDED",
            message: `Account ${email || ""} has been suspended by an administrator.`,
            type: "general",
            action_type: "suspended",
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      } else {
        try {
          await supabase
            .from("notifications")
            .delete()
            .eq("recipient_id", userId)
            .eq("title", "ACCOUNT_SUSPENDED");
        } catch (_) {}
      }

      // 4. Admin Audit Log Record
      await auditService.logAction({
        action: status === "suspended" ? "suspend_user" : "activate_user",
        targetUserId: userId,
        targetEmail: cleanEmail,
        details: { new_status: status },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error updating status in Supabase:", err);
      return { success: false, error: err.message || "Failed to update status" };
    }
  },

  /**
   * Update user role (student <-> lecturer <-> admin)
   */
  async setUserRole(userId: string, newRole: AppRole, email?: string) {
    try {
      const cleanEmail = email && email !== "No email" ? email.trim() : null;

      // 1. Primary: PostgreSQL RPC if present
      try {
        await (supabase as any).rpc("admin_set_user_role", {
          target_user_id: userId,
          new_role: newRole,
          target_email: cleanEmail,
        });
      } catch (_) {}

      // 2. Direct user_roles update/insert
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

      // 3. Sync profiles table
      await supabase
        .from("profiles")
        .update({ role: newRole })
        .or(`user_id.eq.${userId},id.eq.${userId}`);

      if (cleanEmail) {
        await supabase
          .from("profiles")
          .update({ role: newRole })
          .ilike("email", cleanEmail);
      }

      await auditService.logAction({
        action: "change_role",
        targetUserId: userId,
        targetEmail: cleanEmail,
        details: { old_role: oldRole, new_role: newRole },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error changing role:", err);
      return { success: false, error: err.message || "Failed to change role" };
    }
  },

  /**
   * Permanently delete user via PostgreSQL RPC & Edge Function
   */
  async deleteUser(userId: string, email?: string) {
    try {
      const cleanEmail = email && email !== "No email" ? email.trim() : null;

      // 1. Primary: Execute PostgreSQL SECURITY DEFINER RPC if present
      try {
        await (supabase as any).rpc("admin_delete_user_records", {
          target_user_id: userId,
          target_email: cleanEmail,
        });
      } catch (_) {}

      // 2. Direct Deletions across relevant tables
      if (userId) {
        await supabase.from("class_students").delete().or(`id.eq.${userId},student_id.eq.${userId}`);
        await supabase.from("student_profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
        await supabase.from("lecturer_profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
        await supabase.from("user_roles").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
      }

      if (cleanEmail) {
        await supabase.from("class_students").delete().ilike("email", cleanEmail);
        await supabase.from("student_profiles").delete().ilike("email", cleanEmail);
        await supabase.from("lecturer_profiles").delete().ilike("email", cleanEmail);
        await supabase.from("profiles").delete().ilike("email", cleanEmail);
      }

      // 3. Record audit log
      await auditService.logAction({
        action: "delete_user",
        targetUserId: userId,
        targetEmail: cleanEmail || null,
        details: { deleted_at: new Date().toISOString() },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error deleting user:", err);
      return { success: false, error: err.message || "Failed to delete user account" };
    }
  },

  /**
   * Bulk update user statuses
   */
  async bulkSetStatus(userIds: string[], status: UserStatus) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .in("user_id", userIds);

      if (error) throw error;

      try {
        await supabase
          .from("student_profiles")
          .update({ status })
          .in("user_id", userIds);
      } catch (_) {}

      await auditService.logAction({
        action: status === "suspended" ? "bulk_suspend" : "bulk_activate",
        details: { count: userIds.length, user_ids: userIds, new_status: status },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Bulk status update error:", err);
      return { success: false, error: err.message || "Bulk status update failed" };
    }
  },
};
