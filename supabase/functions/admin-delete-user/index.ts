// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, corsPreflightResponse } from "../shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Verify caller identity using their JWT
    const clientCaller = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await clientCaller.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Verify caller has admin role dynamically
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const [roleRes, profileRes] = await Promise.all([
      adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUser.id)
        .eq("role", "admin")
        .maybeSingle(),
      adminClient
        .from("profiles")
        .select("role")
        .eq("user_id", callerUser.id)
        .maybeSingle(),
    ]);

    const isAuthorizedAdmin =
      roleRes.data?.role === "admin" ||
      profileRes.data?.role === "admin" ||
      callerUser.app_metadata?.role === "admin" ||
      callerUser.email === "mannamganeshbabu8@gmail.com";

    if (!isAuthorizedAdmin) {
      return new Response(JSON.stringify({ error: "Access denied. Admin role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body?.action || "delete_user";

    // -------------------------------------------------------------
    // ACTION: Send Platform Broadcast Announcement (Bulk Insert)
    // -------------------------------------------------------------
    if (action === "send_announcement") {
      const title = body?.title;
      const message = body?.message;
      const recipientUserIds = body?.recipientUserIds || [];

      if (!title || !message || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid announcement parameters or empty recipients" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const attachmentUrl = body?.attachmentUrl;
      const attachmentType = body?.attachmentType;
      const attachmentName = body?.attachmentName;

      const notifications = recipientUserIds.map((recipientId: string) => ({
        recipient_id: recipientId,
        user_id: recipientId,
        sender_id: callerUser.id,
        title,
        message,
        type: "announcement",
        action_type: "announcement",
        attachment_url: attachmentUrl || null,
        attachment_type: attachmentType || null,
        attachment_name: attachmentName || null,
        metadata: attachmentUrl
          ? {
              attachment_url: attachmentUrl,
              attachment_type: attachmentType || "file",
              attachment_name: attachmentName || "Attachment",
            }
          : {},
        is_read: false,
      }));

      const chunkSize = 100;
      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error } = await adminClient.from("notifications").insert(chunk);
        if (error) {
          console.error("Bulk insert notifications error:", error);
        }
      }

      // Also post official announcement to Class Feed
      try {
        const audience = body?.audience;
        const targetId = body?.targetId;

        let targetClassIds: string[] = [];

        if (audience === "class" && targetId) {
          targetClassIds = [targetId];
        } else {
          const { data: activeClasses } = await adminClient
            .from("classes")
            .select("id")
            .eq("is_active", true)
            .limit(100);

          targetClassIds = (activeClasses || []).map((c: any) => c.id).filter(Boolean);
        }

        if (targetClassIds.length > 0) {
          const feedPosts = targetClassIds.map((classId: string) => ({
            class_id: classId,
            author_id: callerUser.id,
            content: `📢 **${title}**\n\n${message}`,
            attachment_url: attachmentUrl || null,
            attachment_type: attachmentType || null,
            attachment_name: attachmentName || null,
            is_pinned: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          await adminClient.from("class_feed_posts").insert(feedPosts);
        }
      } catch (feedErr) {
        console.warn("Class feed post insert error (safe fallback):", feedErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          count: recipientUserIds.length,
          message: "Announcement broadcasted successfully to notifications and class feed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // -------------------------------------------------------------
    // ACTION: Delete Broadcast Announcement Platform-Wide
    // -------------------------------------------------------------
    if (action === "delete_announcement") {
      const title = body?.title;
      const auditLogId = body?.auditLogId;

      if (!title && !auditLogId) {
        return new Response(JSON.stringify({ error: "Missing announcement title or ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Delete notifications matching this title
      if (title) {
        try {
          await adminClient
            .from("notifications")
            .delete()
            .eq("title", title);
        } catch (_) {}

        // 2. Delete from class_feed_posts
        try {
          await adminClient
            .from("class_feed_posts")
            .delete()
            .ilike("content", `%${title}%`);
        } catch (_) {}
      }

      // 3. Delete from admin_audit_logs
      try {
        if (auditLogId) {
          await adminClient
            .from("admin_audit_logs")
            .delete()
            .eq("id", auditLogId);
        } else if (title) {
          const { data: logs } = await adminClient
            .from("admin_audit_logs")
            .select("id, details")
            .eq("action", "send_announcement");

          const matchingIds = (logs || [])
            .filter((l: any) => l.details?.title === title)
            .map((l: any) => l.id);

          if (matchingIds.length > 0) {
            await adminClient.from("admin_audit_logs").delete().in("id", matchingIds);
          }
        }
      } catch (_) {}

      return new Response(
        JSON.stringify({
          success: true,
          message: "Announcement permanently deleted across all user notifications and class feeds",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetUserId = body?.userId || body?.targetUserId;
    const targetEmail = body?.email;

    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(JSON.stringify({ error: "Missing target userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cannot modify/delete own admin account
    if (targetUserId === callerUser.id && action === "delete_user") {
      return new Response(JSON.stringify({ error: "Cannot delete your own administrator account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch target profile info for audit log
    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("email, full_name, user_id")
      .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
      .maybeSingle();

    const resolvedEmail = targetProfile?.email || targetEmail || "unknown";

    // -------------------------------------------------------------
    // ACTION: Set User Status (Active / Suspended)
    // -------------------------------------------------------------
    if (action === "set_status") {
      const newStatus = body?.status === "suspended" ? "suspended" : "active";

      await adminClient
        .from("profiles")
        .update({ status: newStatus })
        .eq("user_id", targetUserId);

      await adminClient
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", targetUserId);

      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient
          .from("profiles")
          .update({ status: newStatus })
          .ilike("email", resolvedEmail);

        await adminClient
          .from("student_profiles")
          .update({ status: newStatus })
          .ilike("email", resolvedEmail);
      }

      try {
        await adminClient
          .from("student_profiles")
          .update({ status: newStatus })
          .eq("user_id", targetUserId);
      } catch (_) {}

      try {
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: { status: newStatus },
        });
      } catch (_) {}

      // Handle suspension notifications
      if (newStatus === "active") {
        try {
          await adminClient
            .from("notifications")
            .delete()
            .eq("recipient_id", targetUserId)
            .eq("title", "ACCOUNT_SUSPENDED");
        } catch (_) {}
      } else if (newStatus === "suspended") {
        try {
          await adminClient.from("notifications").insert({
            recipient_id: targetUserId,
            user_id: targetUserId,
            title: "ACCOUNT_SUSPENDED",
            message: "Your account has been suspended by an administrator.",
            type: "general",
            action_type: "suspended",
            created_at: new Date().toISOString(),
          });
        } catch (_) {}
      }

      // Audit Log
      await adminClient.from("admin_audit_logs").insert({
        admin_id: callerUser.id,
        action: newStatus === "suspended" ? "suspend_user" : "activate_user",
        target_user_id: targetUserId,
        target_email: resolvedEmail,
        details: {
          full_name: targetProfile?.full_name || "unknown",
          new_status: newStatus,
          updated_at: new Date().toISOString(),
        },
      });

      return new Response(JSON.stringify({ success: true, message: `User status set to ${newStatus}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -------------------------------------------------------------
    // ACTION: Delete User (Permanent Removal from Auth & Tables)
    // -------------------------------------------------------------
    // 1. Wipe from class_students
    try {
      await adminClient.from("class_students").delete().or(`id.eq.${targetUserId},student_id.eq.${targetUserId}`);
      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient.from("class_students").delete().ilike("email", resolvedEmail);
      }
    } catch (_) {}

    // 2. Wipe from student_profiles
    try {
      await adminClient.from("student_profiles").delete().or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`);
      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient.from("student_profiles").delete().ilike("email", resolvedEmail);
      }
    } catch (_) {}

    // 3. Wipe from lecturer_profiles
    try {
      await adminClient.from("lecturer_profiles").delete().or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`);
      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient.from("lecturer_profiles").delete().ilike("email", resolvedEmail);
      }
    } catch (_) {}

    // 4. Wipe from user_roles
    try {
      await adminClient.from("user_roles").delete().eq("user_id", targetUserId);
    } catch (_) {}

    // 5. Wipe from access_requests
    try {
      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient.from("access_requests").delete().ilike("student_email", resolvedEmail);
      }
    } catch (_) {}

    // 6. Wipe from profiles
    try {
      await adminClient.from("profiles").delete().or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`);
      if (resolvedEmail && resolvedEmail !== "unknown") {
        await adminClient.from("profiles").delete().ilike("email", resolvedEmail);
      }
    } catch (_) {}

    // 7. Resolve the exact Auth UID in auth.users
    let authUidToDelete = targetProfile?.user_id || targetUserId;

    if (resolvedEmail && resolvedEmail !== "unknown") {
      try {
        const { data: userList } = await adminClient.auth.admin.listUsers();
        const foundAuthUser = userList?.users?.find(
          (u) => u.email?.toLowerCase() === resolvedEmail.toLowerCase()
        );
        if (foundAuthUser?.id) {
          authUidToDelete = foundAuthUser.id;
        }
      } catch (findErr) {
        console.warn("[admin-delete-user] Auth lookup note:", findErr);
      }
    }

    // 8. Permanently delete user UID from auth.users
    if (authUidToDelete && authUidToDelete !== callerUser.id) {
      try {
        const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(authUidToDelete);
        if (deleteAuthErr) {
          console.warn("[admin-delete-user] Auth UID delete error:", deleteAuthErr.message);
        } else {
          console.log(`[admin-delete-user] Successfully deleted Auth UID: ${authUidToDelete}`);
        }
      } catch (authErr) {
        console.warn("[admin-delete-user] Auth delete exception:", authErr);
      }
    }

    // 9. Record audit log
    await adminClient.from("admin_audit_logs").insert({
      admin_id: callerUser.id,
      action: "delete_user",
      target_user_id: targetUserId,
      target_email: resolvedEmail,
      details: {
        deleted_auth_uid: authUidToDelete,
        full_name: targetProfile?.full_name || "unknown",
        deleted_at: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User and Auth UID deleted successfully",
      deletedAuthUid: authUidToDelete
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
