import { supabase } from "@/lib/supabase";
import { auditService } from "./audit.service";

export type AnnouncementAudience = "all" | "students" | "lecturers" | "department" | "class";

export interface CreateAnnouncementParams {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  targetId?: string; // department name or class_id
}

export const announcementsService = {
  async getRecipientCount(audience: AnnouncementAudience, targetId?: string): Promise<number> {
    try {
      if (audience === "all") {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        return count || 0;
      }

      if (audience === "students") {
        const { count } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student");
        return count || 0;
      }

      if (audience === "lecturers") {
        const { count } = await supabase
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "lecturer");
        return count || 0;
      }

      if (audience === "department" && targetId) {
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("department", targetId);
        return count || 0;
      }

      if (audience === "class" && targetId) {
        const { count } = await supabase
          .from("class_students")
          .select("id", { count: "exact", head: true })
          .eq("class_id", targetId);
        return count || 0;
      }

      return 0;
    } catch (err) {
      console.error("[AnnouncementsService] Error counting recipients:", err);
      return 0;
    }
  },

  async sendAnnouncement(params: CreateAnnouncementParams) {
    const { title, message, audience, targetId } = params;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let recipientUserIds: string[] = [];

      if (audience === "all") {
        const { data } = await supabase.from("profiles").select("user_id");
        recipientUserIds = (data || []).map((p) => p.user_id).filter(Boolean);
      } else if (audience === "students") {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "student");
        recipientUserIds = (data || []).map((r) => r.user_id).filter(Boolean);
      } else if (audience === "lecturers") {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "lecturer");
        recipientUserIds = (data || []).map((r) => r.user_id).filter(Boolean);
      } else if (audience === "department" && targetId) {
        const { data } = await supabase.from("profiles").select("user_id").eq("department", targetId);
        recipientUserIds = (data || []).map((p) => p.user_id).filter(Boolean);
      } else if (audience === "class" && targetId) {
        const { data: classStudents } = await supabase
          .from("class_students")
          .select("student_id")
          .eq("class_id", targetId)
          .not("student_id", "is", null);

        recipientUserIds = (classStudents || []).map((c) => c.student_id!).filter(Boolean);
      }

      if (recipientUserIds.length === 0) {
        return { success: false, error: "No recipients found for this selection." };
      }

      // Batch insert notifications
      const notifications = recipientUserIds.map((recipientId) => ({
        recipient_id: recipientId,
        sender_id: user.id,
        title,
        message,
        type: "admin_announcement",
        is_read: false,
      }));

      // Insert in chunks of 100 to avoid payload size limit
      const chunkSize = 100;
      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error } = await supabase.from("notifications").insert(chunk);
        if (error) throw error;
      }

      // Log to audit trail
      await auditService.logAction({
        action: "send_announcement",
        details: {
          title,
          audience,
          targetId: targetId || null,
          recipientCount: recipientUserIds.length,
        },
      });

      return { success: true, count: recipientUserIds.length };
    } catch (err: any) {
      console.error("[AnnouncementsService] Error sending announcement:", err);
      return { success: false, error: err.message || "Failed to send announcement" };
    }
  },

  async getAnnouncementHistory() {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("title, message, type, created_at, is_read")
        .eq("type", "admin_announcement")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by title + created_at timestamp
      const groups: Record<string, { title: string; message: string; created_at: string; total: number; read: number }> = {};

      (data || []).forEach((n) => {
        const key = `${n.title}_${n.created_at.slice(0, 16)}`;
        if (!groups[key]) {
          groups[key] = {
            title: n.title,
            message: n.message,
            created_at: n.created_at,
            total: 0,
            read: 0,
          };
        }
        groups[key].total++;
        if (n.is_read) groups[key].read++;
      });

      return Object.values(groups);
    } catch (err) {
      console.error("[AnnouncementsService] Error getting history:", err);
      return [];
    }
  },
};
