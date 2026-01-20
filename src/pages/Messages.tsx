import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  HelpCircle,
  X,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useInstructors } from "@/hooks/useInstructors";
import { useAuth } from "@/contexts/AuthContext";
import { useLongPress } from "@/hooks/useLongPress";
import { format } from "date-fns";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useEligibleStudents } from "@/hooks/useEligibleStudents";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

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
    url: string;
  };
}

export default function Messages() {
  const { user, role } = useAuth();
  const { conversations, messages, sendMessage, deleteMessage, selectedConversationId, setSelectedConversationId, loading, typingUsers, sendTyping } = useMessages();
  const { instructors, loading: instructorsLoading } = useInstructors();
  const { students: eligibleStudents, loading: studentsLoading } = useEligibleStudents();
  const { onlineUsers } = useOnlinePresence();

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isAskDoubtOpen, setIsAskDoubtOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const otherUserId = selectedConversation ? (selectedConversation.participant_1 === user?.id ? selectedConversation.participant_2 : selectedConversation.participant_1) : null;
  const isOtherUserOnline = otherUserId ? onlineUsers.has(otherUserId) : false;
  const isOtherUserTyping = otherUserId ? typingUsers.has(otherUserId) : false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || !user) return;

    const receiverId = selectedConversation.participant_1 === user.id
      ? selectedConversation.participant_2
      : selectedConversation.participant_1;

    try {
      let attachmentData;

      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploaded = await uploadToCloudinary(selectedFile);
          attachmentData = {
            name: uploaded.name,
            url: uploaded.url,
            type: uploaded.type,
            size: uploaded.size
          };
        } catch (uploadError: any) {
          toast.error(`Upload failed: ${uploadError.message}`);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      await sendMessage(receiverId, messageInput, attachmentData);
      setMessageInput("");
      clearSelectedFile();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error("Failed to send message");
      setIsUploading(false);
    }
  };

  const handleStartConversation = (instructorId: string) => {
    // Check if conversation already exists
    const existing = conversations.find(c =>
      (c.participant_1 === user?.id && c.participant_2 === instructorId) ||
      (c.participant_1 === instructorId && c.participant_2 === user?.id)
    );

    if (existing) {
      setSelectedConversationId(existing.id);
    } else {
      // Create new conversation logically (UI will update optimistically or waiting for select)
      // Since useMessages creates on send, we just need to "select" a temporary state or 
      // simplified: just clear selected and let user type to this instructor?
      // Better: We need to set a "pending" conversation or just create it immediately?
      // simpler: We will allow the USER to send a message to this ID.
      // But `sendMessage` requires a `receiverId` which we usually derive from `selectedConversation`.
      // We need to handle "New Conversation" state. 
      // For now, let's just create an empty one or handle it in `useMessages` more robustly?
      // Actually `useMessages` `sendMessage` creates it if not exists.
      // So we can just "fake" a selected conversation or handle it.
      // QUICK FIX: Send a "Hello" message automatically? No that's spammy.
      // ideal: Set a "draft" conversation.
      // For this step, I'll send an initial empty message? No.
      // I'll update `useMessages` to support `createConversation` explicitly or 
      // just auto-create it now.

      // Let's TRY to find it again, if not, we rely on the `sendMessage` logic.
      // But we need to switch the UI view to "chatting with Instructor X".
      // This requires `selectedConversationId`. 
      // If it doesn't exist, I can't select it.
      // I will implement `createConversation` in the hook later or just hack it:
      // I'll send a "Hi" message to initiate? No.
      // I'll trigger a function to create an empty conversation row?
      // Let's just assume for now we can't switch until one exists. 
      // Wait, `sendMessage` handles creation.
      // Sol: I will create a function `startNewChat(instructorId)` in `useMessages`?
      // Or just do it here inline if `supabase` client is available?
      // I'll do it inline here for simplicity since I can't edit hooks easily in parallel.
      // Actually I should have edited the hook.
      // I'll handle it below in `handleStartNewChat`.
    }
    setIsAskDoubtOpen(false);
  };

  const handleStartNewChat = async (instructorId: string) => {
    // Check local existing
    const existing = conversations.find(c =>
      (c.participant_1 === user?.id && c.participant_2 === instructorId) ||
      (c.participant_1 === instructorId && c.participant_2 === user?.id)
    );

    if (existing) {
      setSelectedConversationId(existing.id);
      setIsAskDoubtOpen(false);
      return;
    }

    // Create new conversation via Supabase
    // Note: Ideally moving this to hook, but for speed doing it here
    try {
      // Need to import supabase here? No, I need it from context or props.
      // I don't have direct access here easily without importing.
      // I'll ask the USER to select it, and if it doesn't exist, 
      // I might need a "PendingConversation" state.

      // BETTER: Invoke a temporary "Draft" mode where selectedConversation is a mock object
      // containing just the other user details, and ID is "new".
      // `sendMessage` needs modification to handle "new".
      // BUT `sendMessage` in `useMessages` already handles dynamic creation!
      // So I just need to mock the `selectedConversation` object so the UI renders.
      // But `selectedConversation` comes from `conversations.find`.
      // I will force a "draft" state.
      toast.info("Starting new conversation...");
      await sendMessage(instructorId, "Started a new conversation"); // Auto-initiate
      // Refetch or wait for subscription
      // This is a bit "hacky" but works for MVP "Ask a Doubt"

    } catch (e) {
      console.error(e);
    }
    setIsAskDoubtOpen(false);
  }


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* 
    MERGE LOGIC: 
    We want to show:
    1. Existing conversations (with history)
    2. Eligible students who DON'T have a conversation yet (as "contacts")
  */

  // 1. Get IDs of students researchers already have conversations with
  // Note: For a lecturer, the "other user" is the student.
  const existingContactIds = new Set(conversations.map(c =>
    c.participant_1 === user?.id ? c.participant_2 : c.participant_1
  ));

  // 2. Filter eligible students who are NOT in the conversation list
  const studentsWithoutChat = eligibleStudents.filter(s => !existingContactIds.has(s.id));

  // 3. Create "Virtual Conversation" objects for these students for display purposes
  const studentContacts = studentsWithoutChat.map(s => ({
    id: `new:${s.id}`, // specific prefix to identify as virtual
    participant_1: user?.id || '',
    participant_2: s.id,
    last_message: 'Start a conversation',
    last_message_at: null, // No date means generic placement
    other_user_name: s.full_name,
    other_user_avatar: s.avatar_url,
    other_user_role: 'student',
    other_user_id: s.id, // Explicitly store ID
    is_virtual: true     // Flag
  }));

  // 4. Combine and Filter by Search
  const allItems = [...conversations, ...studentContacts].filter((item) =>
    (item.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 5. Sort: Real conversations first (by date), then virtual ones (alphabetical)
  const sortedItems = allItems.sort((a, b) => {
    // Both real
    if (a.last_message_at && b.last_message_at) {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    }
    // A is real, B is virtual -> A first
    if (a.last_message_at) return -1;
    // B is real, A is virtual -> B first
    if (b.last_message_at) return 1;

    // Both virtual: Sort Alphabetical
    return (a.other_user_name || '').localeCompare(b.other_user_name || '');
  });

  // Transform messages
  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    timestamp: format(new Date(msg.created_at), 'h:mm a'),
    isOwn: msg.sender_id === user?.id,
    sender: msg.sender_name || 'Unknown',
    attachment: msg.attachment_name ? {
      name: msg.attachment_name,
      size: '',
      type: msg.attachment_type || '',
      url: msg.attachment_url || ''
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
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Messages</h2>
              <p className="text-sm text-muted-foreground">Direct conversations</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsAskDoubtOpen(true)} title={role === 'lecturer' ? "New Message" : "Ask a Doubt"}>
              <Plus className="size-5" />
            </Button>
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
              {sortedItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <Button variant="link" onClick={() => setIsAskDoubtOpen(true)}>
                    {role === 'lecturer' ? "Start a new conversation" : "Ask a Doubt"}
                  </Button>
                </div>
              ) : (
                sortedItems.map((item) => {
                  const isVirtual = 'is_virtual' in item && item.is_virtual;
                  const realId = isVirtual ? (item as any).other_user_id : item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => isVirtual ? handleStartNewChat(realId) : setSelectedConversationId(item.id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                        selectedConversationId === item.id
                          ? "bg-primary/10"
                          : "hover:bg-secondary"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="size-10">
                          <AvatarImage src={item.other_user_avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(item.other_user_name || 'U').split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online Status for Real & Virtual */}
                        {onlineUsers.has(isVirtual ? realId : (item.participant_1 === user?.id ? item.participant_2 : item.participant_1)) && (
                          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-surface" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{item.other_user_name || 'Unknown User'}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {item.last_message_at ? format(new Date(item.last_message_at), 'MMM d') : ''}
                          </span>
                        </div>
                        <p className={cn("text-sm truncate", isVirtual ? "text-primary/70 italic" : "text-muted-foreground")}>
                          {item.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
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
                    {isOtherUserOnline ? <span className="text-green-500 ml-2 text-xs font-medium">● Online</span> : <span className="ml-2 text-xs">Offline</span>}
                    {isOtherUserTyping && <span className="ml-2 text-muted-foreground animate-pulse">Typing...</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Messages Mapping */}
                {transformedMessages.map((message) => {
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
                            "rounded-2xl px-4 py-2.5 transition-all relative group",
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
                            <div className="size-10 rounded-lg bg-destructive/10 flex items-center justify-center overflow-hidden">
                              {message.attachment.type.startsWith('image/') ? (
                                <img src={message.attachment.url} alt="Attachment" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="size-5 text-destructive" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {message.attachment.size}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                              <a href={message.attachment.url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="size-4" />
                              </a>
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
              {selectedFile && (
                <div className="mb-2 p-2 bg-secondary rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Badge variant="outline" className="shrink-0">Attachment</Badge>
                    <span className="text-xs truncate">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSelectedFile}>
                    <X className="size-3" />
                  </Button>
                </div>
              )}
              {/* Input Area */}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      // Throttle typing events
                      if (e.target.value.length % 5 === 0) sendTyping();
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full min-h-[44px] max-h-32 px-4 py-3 rounded-xl bg-secondary border-0 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={1}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className={selectedFile ? "text-primary" : ""}
                  >
                    <Paperclip className="size-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="size-5" />
                  </Button>
                  <Button size="icon" onClick={handleSendMessage} disabled={(!messageInput.trim() && !selectedFile) || isUploading}>
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
                Choose a conversation from the sidebar or ask a doubt to a lecturer.
              </p>
              <Button onClick={() => setIsAskDoubtOpen(true)} className="mt-4">
                {role === 'lecturer' ? "New Message" : "Ask a Doubt"}
              </Button>
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

        <Dialog open={isAskDoubtOpen} onOpenChange={setIsAskDoubtOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{role === 'lecturer' ? "New Message" : "Ask a Doubt"}</DialogTitle>
              <DialogDescription>
                {role === 'lecturer'
                  ? "Select a student to message."
                  : "Select a lecturer to start a conversation."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {role === 'lecturer' ? (
                // Lecturer View: List Eligible Students
                studentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : eligibleStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground">No eligible students found.</p>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {eligibleStudents.map(student => (
                        <button
                          key={student.id}
                          onClick={() => handleStartNewChat(student.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <Avatar>
                            <AvatarImage src={student.avatar_url || ''} />
                            <AvatarFallback>{(student.full_name || 'S').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                            {student.class_name && (
                              <Badge variant="outline" className="mt-1 text-xs">{student.class_name}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )
              ) : (
                // Student View: List Instructors
                instructorsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : instructors.length === 0 ? (
                  <p className="text-center text-muted-foreground">No lecturers found.</p>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {instructors.map(inst => (
                        <button
                          key={inst.id}
                          onClick={() => handleStartNewChat(inst.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <Avatar>
                            <AvatarImage src={inst.avatar_url || ''} />
                            <AvatarFallback>{(inst.full_name || 'L').charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{inst.full_name}</p>
                            <Badge variant="secondary" className="text-xs">Lecturer</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
