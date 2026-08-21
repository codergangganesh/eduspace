import { useQuery } from "@tanstack/react-query";
import { messagesService } from "@/services/messages.service";

export function useConversations(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "conversations", options.search, options.page, options.pageSize],
    queryFn: () => messagesService.getConversations(options),
    staleTime: 1000 * 30,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["admin", "conversation-messages", conversationId],
    queryFn: () => (conversationId ? messagesService.getConversationMessages(conversationId) : []),
    enabled: !!conversationId,
    staleTime: 1000 * 15,
  });
}
