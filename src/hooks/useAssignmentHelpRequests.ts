import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createBulkNotifications, createNotification } from "@/lib/notificationService";

export interface HelpRequestReply {
  id: string;
  help_request_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  message: string;
  created_at: string;
  is_own: boolean;
}

export interface HelpRequestItem {
  id: string;
  assignment_id: string;
  class_id: string;
  requester_id: string;
  requester_role: "student" | "lecturer" | "admin";
  requester_name: string;
  requester_avatar: string | null;
  message: string;
  status: "open" | "resolved";
  resolved_by: string | null;
  resolved_at: string | null;
  resolver_name: string | null;
  created_at: string;
  updated_at: string;
  is_own: boolean;
  replies: HelpRequestReply[];
}

interface UseAssignmentHelpRequestsOptions {
  assignmentId?: string | null;
  classId?: string | null;
  lecturerId?: string | null;
  assignmentTitle?: string | null;
}

export function useAssignmentHelpRequests({
  assignmentId,
  classId,
  lecturerId,
  assignmentTitle,
}: UseAssignmentHelpRequestsOptions) {
  const { user, profile, role } = useAuth();
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const cacheKey = user && assignmentId
    ? `assignment-help-requests:${user.id}:${assignmentId}`
    : null;

  const fetchRequests = useCallback(async (background = false) => {
    if (!assignmentId || !classId || !user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      if (!background) {
        setLoading(true);
      }

      const { data: requestRows, error: requestError } = await supabase
        .from("help_requests")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: false });

      if (requestError) throw requestError;

      const requestIds = (requestRows || []).map((row) => row.id);

      const { data: replyRows, error: replyError } = requestIds.length
        ? await supabase
            .from("help_request_replies")
            .select("*")
            .in("help_request_id", requestIds)
            .order("created_at", { ascending: true })
        : { data: [], error: null };

      if (replyError) throw replyError;

      const userIds = [
        ...new Set(
          [
            ...(requestRows || []).flatMap((row) => [row.requester_id, row.resolved_by]),
            ...(replyRows || []).map((row) => row.author_id),
          ].filter(Boolean) as string[],
        ),
      ];

      const { data: profiles } = userIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((entry) => [
          entry.user_id,
          {
            name: entry.full_name || "EduSpace User",
            avatar: entry.avatar_url,
          },
        ]),
      );

      const repliesByRequest = new Map<string, HelpRequestReply[]>();
      (replyRows || []).forEach((reply) => {
        const author = profileMap.get(reply.author_id);
        const mappedReply: HelpRequestReply = {
          id: reply.id,
          help_request_id: reply.help_request_id,
          author_id: reply.author_id,
          author_name: author?.name || "EduSpace User",
          author_avatar: author?.avatar || null,
          message: reply.message,
          created_at: reply.created_at,
          is_own: reply.author_id === user.id,
        };

        const existing = repliesByRequest.get(reply.help_request_id) || [];
        existing.push(mappedReply);
        repliesByRequest.set(reply.help_request_id, existing);
      });

      const mappedRequests: HelpRequestItem[] = (requestRows || []).map((row) => {
        const requester = profileMap.get(row.requester_id);
        const resolver = row.resolved_by ? profileMap.get(row.resolved_by) : null;

        return {
          id: row.id,
          assignment_id: row.assignment_id,
          class_id: row.class_id,
          requester_id: row.requester_id,
          requester_role: row.requester_role as HelpRequestItem["requester_role"],
          requester_name: requester?.name || "EduSpace User",
          requester_avatar: requester?.avatar || null,
          message: row.message,
          status: row.status as HelpRequestItem["status"],
          resolved_by: row.resolved_by,
          resolved_at: row.resolved_at,
          resolver_name: resolver?.name || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          is_own: row.requester_id === user.id,
          replies: repliesByRequest.get(row.id) || [],
        };
      });

      setRequests(mappedRequests);
      if (cacheKey) {
        sessionStorage.setItem(cacheKey, JSON.stringify(mappedRequests));
      }
    } catch (error) {
      console.error("[useAssignmentHelpRequests] Failed to fetch help requests:", error);
      toast.error("Failed to load help requests");
    } finally {
      setLoading(false);
    }
  }, [assignmentId, cacheKey, classId, user]);

  useEffect(() => {
    if (!assignmentId || !classId || !user) {
      setLoading(false);
      return;
    }

    if (cacheKey) {
      const cachedRequests = sessionStorage.getItem(cacheKey);
      if (cachedRequests) {
        try {
          setRequests(JSON.parse(cachedRequests) as HelpRequestItem[]);
          setLoading(false);
        } catch (error) {
          console.warn("[useAssignmentHelpRequests] Failed to read cached help requests:", error);
        }
      }
    }

    fetchRequests(Boolean(cacheKey && sessionStorage.getItem(cacheKey)));

    const channel = supabase
      .channel(`assignment_help_${assignmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "help_requests",
          filter: `assignment_id=eq.${assignmentId}`,
        },
        () => {
          fetchRequests(true);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "help_request_replies",
        },
        () => {
          fetchRequests(true);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [assignmentId, cacheKey, classId, fetchRequests, user]);

  const createRequest = useCallback(
    async (message: string) => {
      if (!assignmentId || !classId || !user || !role) return false;
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        toast.error("Describe where you’re stuck first");
        return false;
      }

      try {
        setSubmitting(true);

        const { error } = await supabase.from("help_requests").insert({
          assignment_id: assignmentId,
          class_id: classId,
          requester_id: user.id,
          requester_role: role,
          message: trimmedMessage,
        });

        if (error) throw error;

        const studentName = profile?.full_name || "A student";
        const safeAssignmentTitle = assignmentTitle || "this assignment";

        // Notify lecturer (use provided lecturerId if present, otherwise resolve from class)
        let targetLecturerId = lecturerId || null;
        if (!targetLecturerId) {
          const { data: klass } = await supabase
            .from("classes")
            .select("lecturer_id")
            .eq("id", classId)
            .maybeSingle();
          targetLecturerId = (klass as any)?.lecturer_id || null;
        }

        if (targetLecturerId && targetLecturerId !== user.id) {
          await createNotification({
            userId: targetLecturerId,
            title: "Student needs help",
            message: `${studentName} asked for help on "${safeAssignmentTitle}".`,
            type: "general",
            relatedId: assignmentId,
            classId,
            senderId: user.id,
            actionType: "help_request_created",
            customUrl: `/lecturer/assignments/${classId}/${assignmentId}/submissions`,
          });
        }

        const { data: classmates } = await supabase
          .from("class_students")
          .select("student_id")
          .eq("class_id", classId);

        const classmateIds = [...new Set((classmates || []).map((row) => row.student_id).filter(Boolean) as string[])]
          .filter((id) => id !== user.id);

        if (classmateIds.length > 0) {
          await createBulkNotifications(classmateIds, {
            title: "Classmate needs help",
            message: `${studentName} posted a quick-help request on "${safeAssignmentTitle}".`,
            type: "general",
            relatedId: assignmentId,
            classId,
            senderId: user.id,
            actionType: "help_request_created",
            customUrl: `/student/assignments/${assignmentId}`,
          });
        }

        toast.success("Help request sent live");
        return true;
      } catch (error) {
        console.error("[useAssignmentHelpRequests] Failed to create help request:", error);
        toast.error("Failed to send help request");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentId, assignmentTitle, classId, lecturerId, profile?.full_name, role, user],
  );

  const addReply = useCallback(
    async (helpRequestId: string, message: string) => {
      if (!user) return false;
      const trimmedMessage = message.trim();

      const targetRequest = requests.find((request) => request.id === helpRequestId);
      if (targetRequest?.status === "resolved") {
        toast.error("This help request is already resolved");
        return false;
      }

      if (!trimmedMessage) {
        toast.error("Write a quick reply first");
        return false;
      }

      try {
        setReplyingToId(helpRequestId);

        const { error } = await supabase.from("help_request_replies").insert({
          help_request_id: helpRequestId,
          author_id: user.id,
          message: trimmedMessage,
        });

        if (error) throw error;

        if (targetRequest && targetRequest.requester_id !== user.id) {
          await createNotification({
            userId: targetRequest.requester_id,
            title: "New help reply",
            message: `${profile?.full_name || "Someone"} replied to your quick-help request.`,
            type: "general",
            relatedId: assignmentId || undefined,
            classId: targetRequest.class_id,
            senderId: user.id,
            actionType: "help_request_reply",
            customUrl: role === "lecturer"
              ? `/lecturer/assignments/${targetRequest.class_id}/${targetRequest.assignment_id}/submissions`
              : `/student/assignments/${targetRequest.assignment_id}`,
          });
        }

        toast.success("Reply sent");
        return true;
      } catch (error) {
        console.error("[useAssignmentHelpRequests] Failed to add reply:", error);
        toast.error("Failed to send reply");
        return false;
      } finally {
        setReplyingToId(null);
      }
    },
    [assignmentId, profile?.full_name, requests, role, user],
  );

  const resolveRequest = useCallback(
    async (helpRequestId: string) => {
      if (!user) return false;

      try {
        setResolvingId(helpRequestId);

        const targetRequest = requests.find((request) => request.id === helpRequestId);

        const { error } = await supabase
          .from("help_requests")
          .update({
            status: "resolved",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", helpRequestId);

        if (error) throw error;

        if (targetRequest && targetRequest.requester_id !== user.id) {
          await createNotification({
            userId: targetRequest.requester_id,
            title: "Help request resolved",
            message: `${profile?.full_name || "Someone"} marked your quick-help request as resolved.`,
            type: "general",
            relatedId: assignmentId || undefined,
            classId: targetRequest.class_id,
            senderId: user.id,
            actionType: "help_request_resolved",
            customUrl: `/student/assignments/${targetRequest.assignment_id}`,
          });
        }

        toast.success("Marked as resolved");
        return true;
      } catch (error) {
        console.error("[useAssignmentHelpRequests] Failed to resolve request:", error);
        toast.error("Failed to resolve help request");
        return false;
      } finally {
        setResolvingId(null);
      }
    },
    [assignmentId, profile?.full_name, requests, user],
  );

  return {
    requests,
    loading,
    submitting,
    replyingToId,
    resolvingId,
    createRequest,
    addReply,
    resolveRequest,
    refetch: fetchRequests,
  };
}
