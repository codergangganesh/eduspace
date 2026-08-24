import { supabase } from "@/lib/supabase";
import { auditService } from "./audit.service";

export type AnnouncementAudience = "all" | "students" | "lecturers" | "department" | "class";
export type AttachmentType = "image" | "audio" | "video" | "file";

export interface AttachedMedia {
  url: string;
  name: string;
  type: AttachmentType;
  size?: string;
}

export interface CreateAnnouncementParams {
  title: string;
  message: string;
  audience: AnnouncementAudience;
  targetId?: string; // department name or class_id
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
  attachments?: AttachedMedia[];
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
    const { title, message, audience, targetId, attachmentUrl, attachmentType, attachmentName, attachments } = params;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let recipientUserIds: string[] = [];

      if (audience === "all") {
        const { data } = await supabase.from("profiles").select("user_id, id");
        recipientUserIds = (data || []).map((p) => p.user_id || p.id).filter(Boolean);
      } else if (audience === "students") {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "student");
        recipientUserIds = (data || []).map((r) => r.user_id).filter(Boolean);
      } else if (audience === "lecturers") {
        const { data } = await supabase.from("user_roles").select("user_id").eq("role", "lecturer");
        recipientUserIds = (data || []).map((r) => r.user_id).filter(Boolean);
      } else if (audience === "department" && targetId) {
        const { data } = await supabase.from("profiles").select("user_id, id").eq("department", targetId);
        recipientUserIds = (data || []).map((p) => p.user_id || p.id).filter(Boolean);
      } else if (audience === "class" && targetId) {
        const [classStudentsRes, classInfoRes] = await Promise.all([
          supabase
            .from("class_students")
            .select("student_id")
            .eq("class_id", targetId)
            .not("student_id", "is", null),
          supabase
            .from("classes")
            .select("lecturer_id")
            .eq("id", targetId)
            .maybeSingle(),
        ]);

        recipientUserIds = (classStudentsRes.data || []).map((c) => c.student_id!).filter(Boolean);
        if (classInfoRes.data?.lecturer_id) {
          recipientUserIds.push(classInfoRes.data.lecturer_id);
        }
      }

      // Deduplicate recipient IDs
      recipientUserIds = Array.from(new Set(recipientUserIds));

      if (recipientUserIds.length === 0) {
        return { success: false, error: "No active recipient accounts found for this selection." };
      }

      const allAttachments: AttachedMedia[] = attachments && attachments.length > 0
        ? attachments
        : attachmentUrl
        ? [{ url: attachmentUrl, name: attachmentName || "Attachment", type: attachmentType || "file" }]
        : [];

      const primaryAttachment = allAttachments[0];
      const metadata = {
        attachments: allAttachments,
        attachment_url: primaryAttachment?.url || null,
        attachment_type: primaryAttachment?.type || null,
        attachment_name: primaryAttachment?.name || null,
      };

      // 1. Try sending via service_role Edge Function first
      let sentViaFunction = false;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dnrjkqila.supabase.co";

        if (token) {
          const fnRes = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "send_announcement",
              title,
              message,
              audience,
              targetId,
              recipientUserIds,
              attachmentUrl: primaryAttachment?.url,
              attachmentType: primaryAttachment?.type,
              attachmentName: primaryAttachment?.name,
              attachments: allAttachments,
            }),
          });

          if (fnRes.ok) {
            sentViaFunction = true;
          }
        }
      } catch (fnErr) {
        console.warn("[AnnouncementsService] Edge function attempt failed, falling back to direct query:", fnErr);
      }

      // 2. Fallback to direct batch insert if edge function was unavailable
      if (!sentViaFunction) {
        const notifications = recipientUserIds.map((recipientId) => ({
          recipient_id: recipientId,
          user_id: recipientId,
          sender_id: user.id,
          title,
          message,
          type: "announcement",
          action_type: "announcement",
          attachment_url: primaryAttachment?.url || null,
          attachment_type: primaryAttachment?.type || null,
          attachment_name: primaryAttachment?.name || null,
          metadata,
          is_read: false,
        }));

        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          const { error } = await supabase.from("notifications").insert(chunk);
          if (error) {
            console.warn("[AnnouncementsService] Insert batch warning:", error);
          }
        }

        // Direct Class Feed fallback
        try {
          let targetClassIds: string[] = [];
          if (audience === "class" && targetId) {
            targetClassIds = [targetId];
          } else {
            const { data: clsData } = await supabase.from("classes").select("id").eq("is_active", true).limit(50);
            targetClassIds = (clsData || []).map((c: any) => c.id).filter(Boolean);
          }

          if (targetClassIds.length > 0) {
            const feedPosts = targetClassIds.map((classId) => ({
              class_id: classId,
              author_id: user.id,
              content: `📢 **${title}**\n\n${message}`,
              attachment_url: primaryAttachment?.url || null,
              attachment_type: primaryAttachment?.type || null,
              attachment_name: primaryAttachment?.name || null,
              is_pinned: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            await (supabase as any).from("class_feed_posts").insert(feedPosts);
          }
        } catch (feedFallbackErr) {
          console.warn("[AnnouncementsService] Class feed insert fallback warning:", feedFallbackErr);
        }
      }

      // 3. Log to audit trail
      await auditService.logAction({
        action: "send_announcement",
        details: {
          title,
          message,
          audience,
          targetId: targetId || null,
          recipientCount: recipientUserIds.length,
          attachment_url: primaryAttachment?.url || null,
          attachment_type: primaryAttachment?.type || null,
          attachment_name: primaryAttachment?.name || null,
          attachments: allAttachments,
          timestamp: new Date().toISOString(),
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
      // Fetch from audit logs for complete, immutable broadcast history
      const { data: auditData } = await supabase
        .from("admin_audit_logs")
        .select("id, details, created_at")
        .eq("action", "send_announcement")
        .order("created_at", { ascending: false })
        .limit(50);

      if (auditData && auditData.length > 0) {
        return auditData.map((a) => {
          const d = (a.details || {}) as any;
          return {
            id: a.id,
            title: d.title || "Announcement",
            message: d.message || "",
            audience: d.audience || "all",
            created_at: a.created_at,
            total: d.recipientCount || 0,
            read: 0,
            attachment_url: d.attachment_url || null,
            attachment_type: d.attachment_type || null,
            attachment_name: d.attachment_name || null,
            attachments: d.attachments || (d.attachment_url ? [{ url: d.attachment_url, type: d.attachment_type, name: d.attachment_name }] : []),
          };
        });
      }

      // Fallback to notifications table grouping
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at, is_read, attachment_url, attachment_type, attachment_name, metadata")
        .in("type", ["announcement", "admin_announcement"])
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const groups: Record<string, any> = {};

      (data || []).forEach((n: any) => {
        const key = `${n.title}_${(n.created_at || "").slice(0, 16)}`;
        if (!groups[key]) {
          const metaAttachments = n.metadata?.attachments || [];
          groups[key] = {
            id: n.id,
            title: n.title,
            message: n.message,
            created_at: n.created_at,
            total: 0,
            read: 0,
            attachment_url: n.attachment_url || null,
            attachment_type: n.attachment_type || null,
            attachment_name: n.attachment_name || null,
            attachments: metaAttachments.length > 0 ? metaAttachments : (n.attachment_url ? [{ url: n.attachment_url, type: n.attachment_type, name: n.attachment_name }] : []),
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

  async deleteAnnouncement(params: { title?: string; id?: string }) {
    const { title, id } = params;
    try {
      // 1. Call edge function for full platform purge
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dnrjkqila.supabase.co";

      if (token) {
        const fnRes = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "delete_announcement",
            title,
            auditLogId: id,
          }),
        });

        if (fnRes.ok) {
          return { success: true };
        }
      }

      // 2. Direct fallback
      if (title) {
        await supabase.from("notifications").delete().eq("title", title);
        await (supabase as any).from("class_feed_posts").delete().ilike("content", `%${title}%`);
      }
      if (id) {
        await supabase.from("admin_audit_logs").delete().eq("id", id);
      }

      return { success: true };
    } catch (err: any) {
      console.error("[AnnouncementsService] Error deleting announcement:", err);
      return { success: false, error: err.message || "Failed to delete announcement" };
    }
  },
};
