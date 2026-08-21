import { supabase } from "../lib/supabase";
import { auditService } from "./audit.service";
import { AppRole, UserStatus } from "../types";

export const adminService = {
  /**
   * Update user status (active / suspended) purely at the Supabase Database Level
   */
  async setUserStatus(userId: string, status: UserStatus, email?: string) {
    try {
      // 1. Direct Supabase Database Update on profiles
      await supabase
        .from("profiles")
        .update({ status })
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (email && email !== "No email") {
        const cleanEmail = email.trim();
        await supabase
          .from("profiles")
          .update({ status })
          .ilike("email", cleanEmail);

        await supabase
          .from("student_profiles")
          .update({ status })
          .ilike("email", cleanEmail);

        try {
          await supabase
            .from("class_students")
            .update({ status } as any)
            .ilike("email", cleanEmail);
        } catch (_) { }
      }

      // 2. Direct Supabase Database Update on student_profiles
      try {
        await supabase
          .from("student_profiles")
          .update({ status })
          .eq("user_id", userId);
      } catch (_) { }

      // 3. Supabase Notifications table (same mechanism as class invitations)
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
        } catch (_) { }
      } else {
        // When activated, remove suspension notifications
        try {
          await supabase
            .from("notifications")
            .delete()
            .eq("recipient_id", userId)
            .eq("title", "ACCOUNT_SUSPENDED");
        } catch (_) { }
      }

      // 4. Supabase RPC Function (Security Definer)
      try {
        await (supabase as any).rpc("admin_set_user_status", {
          target_email: email || "",
          target_user_id: userId || "",
          new_status: status,
        });
      } catch (rpcErr) {
        console.warn("[AdminService] RPC note:", rpcErr);
      }

      // 5. Admin Audit Log Record
      await auditService.logAction({
        action: status === "suspended" ? "suspend_user" : "activate_user",
        targetUserId: userId,
        targetEmail: email || null,
        details: { new_status: status },
      });

      // 6. Supabase Admin Edge Function
      try {
        await supabase.functions.invoke("admin-delete-user", {
          body: { action: "set_status", userId, status, email },
        });
      } catch (_) { }

      return { success: true };
    } catch (err: any) {
      console.error("[AdminService] Error updating status in Supabase:", err);
      return { success: false, error: err.message || "Failed to update status" };
    }
  },

  /**
   * Update user role (student <-> lecturer)
   */
  async setUserRole(userId: string, newRole: AppRole, email?: string) {
    try {
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
   * Permanently delete user via Edge Function
   */
  async deleteUser(userId: string, email?: string) {
    try {
      const cleanEmail = email && email !== "No email" ? email.trim() : null;

      // 1. Delete from class_students
      try {
        if (userId) {
          await supabase.from("class_students").delete().or(`id.eq.${userId},student_id.eq.${userId}`);
        }
        if (cleanEmail) {
          await supabase.from("class_students").delete().ilike("email", cleanEmail);
        }
      } catch (_) { }

      // 2. Delete from student_profiles
      try {
        if (userId) {
          await supabase.from("student_profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
        }
        if (cleanEmail) {
          await supabase.from("student_profiles").delete().ilike("email", cleanEmail);
        }
      } catch (_) { }

      // 3. Delete from lecturer_profiles
      try {
        if (userId) {
          await supabase.from("lecturer_profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
        }
        if (cleanEmail) {
          await supabase.from("lecturer_profiles").delete().ilike("email", cleanEmail);
        }
      } catch (_) { }

      // 4. Delete from user_roles
      try {
        if (userId) {
          await supabase.from("user_roles").delete().eq("user_id", userId);
        }
      } catch (_) { }

      // 5. Delete from access_requests
      try {
        if (cleanEmail) {
          await supabase.from("access_requests").delete().ilike("student_email", cleanEmail);
        }
      } catch (_) { }

      // 6. Delete from profiles
      try {
        if (userId) {
          await supabase.from("profiles").delete().or(`id.eq.${userId},user_id.eq.${userId}`);
        }
        if (cleanEmail) {
          await supabase.from("profiles").delete().ilike("email", cleanEmail);
        }
      } catch (_) { }

      // 7. Invoke Edge Function to delete from auth.users (service role)
      try {
        const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke("admin-delete-user", {
          body: { targetUserId: userId, userId, email: cleanEmail },
        });
        if (edgeErr) {
          console.warn("[AdminService] Edge function invoke error:", edgeErr);
        } else {
          console.log("[AdminService] Edge function response:", edgeRes);
        }
      } catch (invokeErr) {
        console.warn("[AdminService] Edge function network exception:", invokeErr);
      }

      // 8. Record audit log
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
      } catch (_) { }

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
