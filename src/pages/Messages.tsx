import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  MessageSquare,
  Paperclip,
  Smile,
  Send,
  FileText,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useLongPress } from "@/hooks/useLongPress";
import { format } from "date-fns";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  sender: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
  isGroup?: boolean;
}

// All data now comes from Supabase via useMessages hook

export default function Messages() {
  const { user } = useAuth();
  const { conversations, messages, sendMessage, deleteMessage, selectedConversationId, setSelectedConversationId, loading } = useMessages();
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessage(messageToDelete);
      toast.success("Message deleted");
    } catch (err) {
      toast.error("Failed to delete message");
    } finally {
      setMessageToDelete(null);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;

    const receiverId = selectedConversation.participant_1 === user.id
      ? selectedConversation.participant_2
      : selectedConversation.participant_1;

    try {
      await sendMessage(receiverId, messageInput);
      setMessageInput("");
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Transform messages from Supabase format to component format
  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    timestamp: format(new Date(msg.created_at), 'h:mm a'),
    isOwn: msg.sender_id === user?.id,
    sender: msg.sender_name || 'Unknown',
    attachment: msg.attachment_name ? {
      name: msg.attachment_name,
      size: msg.attachment_size || '',
      type: msg.attachment_type || '',
    } : undefined,
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col bg-surface">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Messages</h2>
            <p className="text-sm text-muted-foreground">Direct conversations</p>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Direct Messages
              </div>
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      selectedConversationId === conv.id
                        ? "bg-primary/10"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage src={conv.other_user_avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(conv.other_user_name || 'U').split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-surface" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{conv.other_user_name || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {conv.last_message_at ? format(new Date(conv.last_message_at), 'MMM d') : ''}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message || 'No messages yet'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-surface">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={selectedConversation.other_user_avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {(selectedConversation.other_user_name || 'U').split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation.other_user_name || 'Unknown User'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.other_user_role || 'User'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Date Divider */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>Yesterday</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {transformedMessages.slice(0, 2).map((message) => {
                  const longPressHandlers = useLongPress({
                    onLongPress: () => message.isOwn && setMessageToDelete(message.id),
                    delay: 500,
                  });

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.isOwn && "flex-row-reverse"
                      )}
                    >
                      {!message.isOwn && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {message.sender.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        {...(message.isOwn ? longPressHandlers : {})}
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 transition-all",
                          message.isOwn
                            ? "bg-primary text-primary-foreground cursor-pointer active:scale-95"
                            : "bg-secondary"
                        )}
                      >
                        {!message.isOwn && (
                          <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Today Divider */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border" />
                  <span>Today</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {transformedMessages.slice(2).map((message) => {
                  const longPressHandlers = useLongPress({
                    onLongPress: () => message.isOwn && setMessageToDelete(message.id),
                    delay: 500,
                  });

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.isOwn && "flex-row-reverse"
                      )}
                    >
                      {!message.isOwn && (
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {message.sender.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="max-w-[70%] space-y-2">
                        <div
                          {...(message.isOwn ? longPressHandlers : {})}
                          className={cn(
                            "rounded-2xl px-4 py-2.5 transition-all",
                            message.isOwn
                              ? "bg-primary text-primary-foreground cursor-pointer active:scale-95"
                              : "bg-secondary"
                          )}
                        >
                          {!message.isOwn && (
                            <p className="text-xs font-medium text-primary mb-1">{message.sender}</p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                        {message.attachment && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                            <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                              <FileText className="size-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {message.attachment.size} • {message.attachment.type}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Download className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-surface">


              {/* Input Area */}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full min-h-[44px] max-h-32 px-4 py-3 rounded-xl bg-secondary border-0 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={1}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="size-5" />
                  </Button>
                  <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background">
            <div className="text-center">
              <MessageSquare className="size-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Message?</DialogTitle>
              <DialogDescription>
                This message will be permanently deleted. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setMessageToDelete(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteMessage}>
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
