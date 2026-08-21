import { supabase } from "@/lib/supabase";
import { ConversationItem, MessageItem } from "@/types";

export const messagesService = {
  async getConversations(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 20 } = options;

    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from("conversations")
        .select("*", { count: "exact" })
        .order("last_message_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Extract unique participant IDs
      const userIds = new Set<string>();
      (data || []).forEach((c) => {
        if (c.participant_1) userIds.add(c.participant_1);
        if (c.participant_2) userIds.add(c.participant_2);
      });

      let profileMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", Array.from(userIds));

        (profiles || []).forEach((p) => {
          profileMap[p.user_id] = p;
        });
      }

      const enriched: ConversationItem[] = (data || []).map((conv) => ({
        id: conv.id,
        class_id: conv.class_id,
        participant_1: conv.participant_1,
        participant_2: conv.participant_2,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        is_class_conversation: conv.is_class_conversation,
        participant_1_profile: conv.participant_1 ? profileMap[conv.participant_1] : null,
        participant_2_profile: conv.participant_2 ? profileMap[conv.participant_2] : null,
      }));

      // Filter by search if provided
      let filtered = enriched;
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        filtered = enriched.filter((c) => {
          const p1 = c.participant_1_profile?.full_name?.toLowerCase() || "";
          const p1Email = c.participant_1_profile?.email?.toLowerCase() || "";
          const p2 = c.participant_2_profile?.full_name?.toLowerCase() || "";
          const p2Email = c.participant_2_profile?.email?.toLowerCase() || "";
          const lastMsg = c.last_message?.toLowerCase() || "";
          return (
            p1.includes(s) ||
            p1Email.includes(s) ||
            p2.includes(s) ||
            p2Email.includes(s) ||
            lastMsg.includes(s)
          );
        });
      }

      return {
        data: filtered,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    } catch (err) {
      console.error("[MessagesService] Error getting conversations:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getConversationMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch senders
      const senderIds = Array.from(new Set((data || []).map((m) => m.sender_id).filter(Boolean)));
      let senderMap: Record<string, any> = {};

      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .in("user_id", senderIds);

        (profiles || []).forEach((p) => {
          senderMap[p.user_id] = p;
        });
      }

      const messages: MessageItem[] = (data || []).map((m) => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        content: m.content || "",
        created_at: m.created_at,
        is_read: m.is_read,
        attachment_name: m.attachment_name,
        attachment_url: m.attachment_url,
        sender_profile: m.sender_id ? senderMap[m.sender_id] : null,
      }));

      return messages;
    } catch (err) {
      console.error("[MessagesService] Error getting messages:", err);
      return [];
    }
  },
};
