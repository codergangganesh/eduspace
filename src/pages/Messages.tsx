import { useState, useRef, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  X,
  Mic,
  MoreVertical,
  Filter,
  CheckCheck,
  Clock,
  LogOut,
  Pause,
  SwitchCamera,
  Terminal,
  ShieldAlert,
  CalendarCheck,
  Settings,
  User,
  Phone,
  Video,
  Copy,
  Link,
  Play,
  ArrowLeft
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CallModal } from "@/components/chat/CallModal";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useInstructors } from "@/hooks/useInstructors";
import { useAuth } from "@/contexts/AuthContext";
import { useLongPress } from "@/hooks/useLongPress";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { uploadToSupabaseStorage } from "@/lib/supastorage";
import { useEligibleStudents } from "@/hooks/useEligibleStudents";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useCall } from "@/contexts/CallContext";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, GraduationCap, BarChart2 } from "lucide-react";
import { PollBubble } from "@/components/chat/PollBubble";
import { ChatPollDialog } from "@/components/chat/ChatPollDialog";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getDateLabel = (date: Date) => {
  if (isToday(date)) return "TODAY";
  if (isYesterday(date)) return "YESTERDAY";
  return format(date, "MM/dd/yy");
};

// Message Bubble Component
interface MessageBubbleProps {
  message: any;
  setMessageToDelete: (id: string) => void;
}

const MessageBubble = ({ message, setMessageToDelete, onEdit }: {
  message: any;
  setMessageToDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const user = useAuth().user;

  const toggleRecordingPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const longPressHandlers = useLongPress({
    onLongPress: () => message.isOwn && setMessageToDelete(message.id),
    delay: 500,
  });

  const canEdit = message.isOwn &&
    !message.attachment &&
    (Date.now() - new Date(message.created_at_raw).getTime() < 5 * 60 * 1000) &&
    (message.edit_count || 0) < 2;

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "flex mb-2 group/bubble",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "relative flex flex-col max-w-[85%] md:max-w-[70%] min-w-0",
        message.isOwn ? "items-end" : "items-start"
      )}>

        {/* Edit/Delete Menu Trigger for Desktop (Hover) */}
        {message.isOwn && !isEditing && (
          <div className={cn(
            "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1",
            message.isOwn ? "-left-8" : "-right-8"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6 h-6 w-6 p-0">
                  <MoreVertical className="size-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setMessageToDelete(message.id)} className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div
          {...(message.isOwn ? longPressHandlers : {})}
          className={cn(
            "rounded-xl px-3.5 py-2 shadow-sm relative group",
            message.isOwn
              ? "bg-emerald-100 dark:bg-[#064e43] text-slate-800 dark:text-white rounded-tr-none"
              : "bg-white dark:bg-[#202c33] text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-none"
          )}
        >
          {message.attachment && (
            <div className="mb-2">
              {message.attachment.type === 'poll' ? (
                <PollBubble pollId={message.attachment.url} />
              ) : message.attachment.type === 'audio' ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f2c34] dark:bg-[#1f2c34] min-w-[220px] max-w-full overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-full bg-[#00a884] hover:bg-[#008f72] flex items-center justify-center shrink-0 border-0 text-white"
                    onClick={() => {
                      if (isPlaying) {
                        audioRef.current?.pause();
                        setIsPlaying(false);
                      } else {
                        audioRef.current?.play();
                        setIsPlaying(true);
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
                  </Button>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden relative">
                      <div
                        className="absolute h-full left-0 top-0 bg-[#00a884] transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{isPlaying ? "Playing..." : "Voice Message"}</span>
                      <span>{message.attachment.size}</span>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={message.attachment.url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => window.open(message.attachment.url, '_blank')}
                  >
                    <Download className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : message.attachment.type?.startsWith('image/') ? (
                <div className="rounded-lg overflow-hidden mb-2">
                  <img
                    src={message.attachment.url}
                    alt="Attachment"
                    className="max-w-full max-h-64 object-cover rounded-lg cursor-pointer"
                    onClick={() => window.open(message.attachment.url, '_blank')}
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#1f2c34] dark:bg-[#1f2c34] cursor-pointer hover:bg-[#2a3942] transition-colors max-w-full overflow-hidden"
                  onClick={() => window.open(message.attachment.url, '_blank')}
                >
                  <div className="size-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-200">{message.attachment.name}</p>
                    <p className="text-xs text-slate-400">{message.attachment.size}</p>
                  </div>
                  <Download className="size-4 text-slate-400 shrink-0" />
                </div>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="min-w-[200px]">
              <Input
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="mb-2 h-8 text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleCancelEdit}>Cancel</Button>
                <Button size="sm" className="h-6 text-xs bg-emerald-600" onClick={handleSaveEdit}>Save</Button>
              </div>
            </div>
          ) : (
            message.content && (
              <p className="text-sm shadow-none whitespace-pre-wrap [word-break:break-word] leading-relaxed py-0.5">{message.content}</p>
            )
          )}

          <div className={cn(
            "flex items-center gap-1 mt-1 justify-end",
            message.isOwn ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
          )}>
            <span className="text-[10px]">
              {message.timestamp}
              {message.isEdited && <span className="italic ml-1">(edited)</span>}
            </span>
            {message.isOwn && (
              message.read_at ? (
                <CheckCheck className="size-3 text-blue-400" />
              ) : (
                <CheckCheck className="size-3 text-slate-500" />
              )
            )}
          </div>
        </div>
      </div>
    </div >
  );
};

// Date Separator Component
const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center justify-center my-4">
    <div className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-muted-foreground shadow-sm">
      {date}
    </div>
  </div>
);

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
      <div className="flex gap-1">
        <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="size-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

export default function Messages() {
  const { user, role, profile } = useAuth();
  const {
    conversations, messages, sendMessage, deleteMessage, selectedConversationId, setSelectedConversationId,
    loading, typingUsers, sendTyping, startConversation, clearChat, deleteChat, hideChat, unhideChat,
    finalizeDeleteChat, editMessage, hasMore, loadMoreMessages, markMessagesAsRead,
    toggleAutoDelete
  } = useMessages();
  const { instructors, loading: instructorsLoading } = useInstructors();
  const { students: eligibleStudents, classGroups, loading: studentsLoading } = useEligibleStudents();
  const { onlineUsers } = useOnlinePresence();
  const { classes, loading: classesLoading } = useClasses();

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'students' | 'lecturers'>('all');
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Add wallpaper state
  const [wallpaper, setWallpaper] = useState<string>("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const { startCall } = useCall();

  // Meeting State
  const [joinMeetingCode, setJoinMeetingCode] = useState("");
  const [isJoinMeetingOpen, setIsJoinMeetingOpen] = useState(false);
  const [createdMeetingCode, setCreatedMeetingCode] = useState("");
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [meetingType, setMeetingType] = useState<'audio' | 'video'>('video');
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mobile View State
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Auto-open mobile chat when conversation selected
  useEffect(() => {
    if (selectedConversationId) {
      setIsMobileChatOpen(true);
      localStorage.setItem('last_active_conversation', selectedConversationId);
    }
  }, [selectedConversationId]);

  // Restore state on mount
  useEffect(() => {
    const savedId = localStorage.getItem('last_active_conversation');
    if (savedId) {
      setSelectedConversationId(savedId);
      // We don't auto-open mobile view on refresh to prevent getting stuck if user wanted list
      // But user requirement says "Persist state". 
      // Let's check if we should auto-open based on user expectation. 
      // If we restore ID, the effect above runs and sets isMobileChatOpen(true). 
      // Ideally we might want to also save 'isMobileChatOpen' state if we want perfection.
    }
  }, []);

  const { isRecording, recordingTime, audioBlob, startRecording, stopRecording, resetRecorder } = useAudioRecorder();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load wallpaper on mount
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`chat_wallpaper_${user.id}`);
      if (saved) setWallpaper(saved);
    }
  }, [user?.id]);

  const handleWallpaperChange = (value: string) => {
    setWallpaper(value);
    if (user?.id) {
      localStorage.setItem(`chat_wallpaper_${user.id}`, value);
    }
  };

  const generateMeetingCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code.substring(0, 3) + '-' + code.substring(3);
  };

  const handleCreateMeeting = (type: 'audio' | 'video') => {
    const code = generateMeetingCode();
    setCreatedMeetingCode(code);
    setMeetingType(type);
    setIsCreateMeetingOpen(true);
  };

  const startMeeting = (code: string, type: 'audio' | 'video') => {
    startCall({ type, conversationId: code, isMeeting: true });
    setIsCreateMeetingOpen(false);
    setIsJoinMeetingOpen(false);
    setJoinMeetingCode("");
  };

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        handleWallpaperChange(result);
      };
      reader.readAsDataURL(file);
    }
  };


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

  // Infinite Scroll & Scroll Restoration
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Trigger load more when near top (e.g. < 50px)
    if (target.scrollTop < 50 && hasMore && !loadingMore) {
      setLoadingMore(true);
      prevScrollHeightRef.current = target.scrollHeight;
      await loadMoreMessages();
      setLoadingMore(false);
    }
  };

  // Restore scroll position after loading more messages
  useEffect(() => {
    if (prevScrollHeightRef.current > 0 && scrollViewportRef.current) {
      const newScrollHeight = scrollViewportRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      if (diff > 0) {
        scrollViewportRef.current.scrollTop = diff;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (selectedConversationId && messages.length > 0) {
      markMessagesAsRead(selectedConversationId);
    }
  }, [selectedConversationId, messages, markMessagesAsRead]);

  // Scroll to bottom on initial load or new message (if near bottom)
  useEffect(() => {
    // Only scroll to bottom if WE send a message or it's the initial load (prevScrollHeight is 0)
    // If we just loaded old messages (prevScrollHeight > 0), DO NOT scroll to bottom.
    if (prevScrollHeightRef.current === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConversationId]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const otherUserId = selectedConversation ? (selectedConversation.participant_1 === user?.id ? selectedConversation.participant_2 : selectedConversation.participant_1) : null;
  const isOtherUserOnline = otherUserId ? onlineUsers.has(otherUserId) : false;
  const isOtherUserTyping = otherUserId ? typingUsers.has(otherUserId) : false;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File size must be less than 20MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle auto-send for audio recording
  useEffect(() => {
    if (audioBlob) {
      handleSendAudio(audioBlob);
    }
  }, [audioBlob]);

  const handleSendAudio = async (blob: Blob) => {
    if (!selectedConversation || !user) return;
    setIsUploading(true);

    const receiverId = selectedConversation.participant_1 === user.id
      ? selectedConversation.participant_2
      : selectedConversation.participant_1;

    try {
      const file = new File([blob], `audio_message_${Date.now()}.webm`, { type: 'audio/webm' });
      // Use Cloudinary for audio as well, or Supabase. Let's use Cloudinary as it handles media well.
      const uploaded = await uploadToCloudinary(file);

      const attachmentData = {
        name: 'Audio Message',
        url: uploaded.url,
        type: 'audio', // Mark as audio for proper rendering
        size: formatFileSize(blob.size)
      };

      await sendMessage(receiverId, "", attachmentData);
      resetRecorder();
    } catch (err) {
      console.error('Failed to send audio message:', err);
      toast.error("Failed to send audio message");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (err) {
        toast.error("Could not access microphone");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedConversation || !user || isUploading) return;

    setIsUploading(true);

    const receiverId = selectedConversation.participant_1 === user.id
      ? selectedConversation.participant_2
      : selectedConversation.participant_1;

    try {
      let attachmentData;

      if (selectedFile) {
        setIsUploading(true);
        try {
          let uploaded;
          if (selectedFile.type === 'application/pdf') {
            uploaded = await uploadToSupabaseStorage(selectedFile);
          } else {
            uploaded = await uploadToCloudinary(selectedFile);
          }

          attachmentData = {
            name: uploaded.name,
            url: uploaded.url,
            type: uploaded.type,
            size: formatFileSize(selectedFile!.size)
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartNewChat = async (targetId: string) => {
    const existing = conversations.find(c =>
      (c.participant_1 === user?.id && c.participant_2 === targetId) ||
      (c.participant_1 === targetId && c.participant_2 === user?.id)
    );

    if (existing) {
      setSelectedConversationId(existing.id);
      setIsNewChatOpen(false);
      return;
    }

    try {
      const conversationId = await startConversation(targetId);
      if (conversationId) {
        setSelectedConversationId(conversationId);
      }
    } catch (e) {
      console.error('Error starting conversation:', e);
      toast.error("Failed to start conversation");
    }
    setIsNewChatOpen(false);
  };

  const handleClearChat = async () => {
    if (!selectedConversationId) return;
    try {
      await clearChat(selectedConversationId);
      toast.success("Chat cleared");
    } catch (error) {
      console.error("Failed to clear chat:", error);
      toast.error("Failed to clear chat");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversationId) return;
    const previousId = selectedConversationId;

    try {
      // Step 1: Hide immediately (Soft Delete)
      await hideChat(previousId);

      // Step 2: Show Undo Toast
      toast.success("Chat deleted", {
        action: {
          label: "Undo",
          onClick: async () => {
            // Undo Logic: Unhide
            try {
              await unhideChat(previousId);
              toast.success("Chat restored");
            } catch (e) {
              console.error("Restore failed", e);
              toast.error("Failed to restore chat");
            }
          }
        },
        duration: 5000,
        // Removed auto-finalize for now to ensure reliability of restore logic first.
        // Hiding is sufficient for "Deletions". History clearing is optional step 2.
      });
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Merge conversations with eligible contacts
  const existingContactIds = new Set(conversations.map(c =>
    c.participant_1 === user?.id ? c.participant_2 : c.participant_1
  ));

  const studentsWithoutChat = eligibleStudents.filter(s => !existingContactIds.has(s.id));
  const lecturersWithoutChat = instructors.filter(i => !existingContactIds.has(i.id));

  const virtualContacts = role === 'student'
    ? lecturersWithoutChat.map(i => ({
      id: `new:${i.id}`,
      participant_1: user?.id || '',
      participant_2: i.id,
      last_message: 'Start a conversation',
      last_message_at: null,
      other_user_name: i.full_name,
      other_user_avatar: i.avatar_url,
      other_user_role: 'lecturer',
      other_user_id: i.id,
      is_virtual: true
    }))
    : studentsWithoutChat.map(s => ({
      id: `new:${s.id}`,
      participant_1: user?.id || '',
      participant_2: s.id,
      last_message: 'Start a conversation',
      last_message_at: null,
      other_user_name: s.full_name,
      other_user_avatar: s.avatar_url,
      other_user_role: 'student',
      other_user_id: s.id,
      is_virtual: true
    }));

  const allItems = [...conversations, ...virtualContacts].filter((item) =>
    (item.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(item => {
    if (filterMode === 'all') return true;
    if (filterMode === 'online') {
      const realId = 'is_virtual' in item && item.is_virtual ? (item as any).other_user_id : (item.participant_1 === user?.id ? item.participant_2 : item.participant_1);
      return onlineUsers.has(realId);
    }
    // Simplistic role filtering if possible, else just ignore
    return true;
  });

  const sortedItems = allItems.sort((a, b) => {
    if (a.last_message_at && b.last_message_at) {
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    }
    if (a.last_message_at) return -1;
    if (b.last_message_at) return 1;
    return (a.other_user_name || '').localeCompare(b.other_user_name || '');
  });

  // Group messages by date
  const groupedMessages: { date: string; messages: any[] }[] = [];
  let currentDateLabel = "";

  const filteredMessages = messages.filter(msg =>
    !messageSearchQuery ||
    (msg.content && msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))
  );

  filteredMessages.forEach((msg) => {
    const msgDate = new Date(msg.created_at);
    const dateLabel = getDateLabel(msgDate);

    if (dateLabel !== currentDateLabel) {
      currentDateLabel = dateLabel;
      groupedMessages.push({ date: dateLabel, messages: [] });
    }

    groupedMessages[groupedMessages.length - 1].messages.push({
      id: msg.id,
      content: msg.content,
      timestamp: format(msgDate, 'h:mm a'),
      isOwn: msg.sender_id === user?.id,
      sender: msg.sender_name || 'Unknown',
      isEdited: msg.is_edited,
      read_at: msg.read_at,
      edit_count: msg.edit_count,
      created_at_raw: msg.created_at,
      attachment: msg.attachment_name ? {
        name: msg.attachment_name,
        size: msg.attachment_size || '',
        type: msg.attachment_type || '',
        url: msg.attachment_url || ''
      } : undefined,
    });
  });

  if (loading) {
    return (
      <DashboardLayout fullHeight={true} hideHeaderOnMobile={!!selectedConversationId && isMobileChatOpen}>
        <ChatSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullHeight={true} hideHeaderOnMobile={!!selectedConversationId && isMobileChatOpen}>
      <div className={cn(
        "flex h-full w-full bg-white dark:bg-[#111b21] overflow-hidden relative",
        "md:rounded-xl md:shadow-xl md:border md:border-slate-200 dark:md:border-slate-700"
      )}>

        {/* Left Sidebar */}
        <div className={cn(
          "border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-white dark:bg-[#111b21]",
          "md:w-80 w-full shrink-0",
          selectedConversationId && isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>

          {/* Sidebar Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden size-8 text-slate-900 dark:text-slate-900 hover:text-emerald-900 mr-1"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="size-7 md:size-10 ring-2 ring-emerald-500/20">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-emerald-500 text-white font-semibold">
                    {profile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{profile?.full_name || user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Active Now</p>
                </div>
              </div>
            </div >
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                onClick={() => setIsNewChatOpen(true)}
                title="Start New Chat"
              >
                <Plus className="size-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 text-slate-600 dark:text-slate-400 hover:text-emerald-600">
                    <MoreVertical className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pb-2">
                    Background Colors
                  </DropdownMenuLabel>
                  <div className="p-2 grid grid-cols-4 gap-2 mb-2">
                    {[
                      '#fecaca', // Red
                      '#fed7aa', // Orange
                      '#fde68a', // Amber
                      '#bbf7d0', // Green
                      '#a5f3fc', // Cyan
                      '#bfdbfe', // Blue
                      '#ddd6fe', // Violet
                      '#fbcfe8'  // Pink
                    ].map(c => (
                      <button
                        key={c}
                        className="size-8 rounded-lg border shadow-sm transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                        onClick={() => handleWallpaperChange(c)}
                        title={c}
                      />
                    ))}
                  </div>
                  <DropdownMenuItem onClick={() => handleWallpaperChange('')}>
                    <span className="text-xs">Reset Default</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.getElementById('wallpaper-upload')?.click()}>
                    <span className="text-xs">Upload Image</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pb-2">
                    Meetings
                  </DropdownMenuLabel>
                  {role === 'lecturer' && (
                    <DropdownMenuItem onClick={() => handleCreateMeeting('video')}>
                      <Video className="size-4 mr-2" />
                      <span className="text-xs">Create Meeting</span>
                    </DropdownMenuItem>
                  )}
                  {role === 'lecturer' && (
                    <DropdownMenuItem onClick={() => setIsPollDialogOpen(true)}>
                      <BarChart2 className="size-4 mr-2" />
                      <span className="text-xs">Create Poll</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setIsJoinMeetingOpen(true)}>
                    <Link className="size-4 mr-2" />
                    <span className="text-xs">Join Meeting</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search or start new chat"
                  className="pl-9 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("size-9", filterMode !== 'all' ? "text-emerald-600 bg-emerald-50" : "text-slate-500 dark:text-slate-400")}>
                    <Filter className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Chats</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterMode('all')}>
                    All Chats
                    {filterMode === 'all' && <CheckCheck className="size-3 ml-auto text-emerald-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('online')}>
                    Online Only
                    {filterMode === 'online' && <CheckCheck className="size-3 ml-auto text-emerald-500" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {sortedItems.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="size-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">No conversations yet</p>
              </div>
            ) : (
              sortedItems.map((item) => {
                const isVirtual = 'is_virtual' in item && item.is_virtual;
                const realId = isVirtual ? (item as any).other_user_id : item.id;
                const otherUserIdForOnline = isVirtual ? realId : (item.participant_1 === user?.id ? item.participant_2 : item.participant_1);
                const isOnline = onlineUsers.has(otherUserIdForOnline);
                const isTyping = typingUsers.has(otherUserIdForOnline);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isVirtual) {
                        handleStartNewChat(realId);
                      } else {
                        setSelectedConversationId(item.id);
                      }
                      setIsMobileChatOpen(true);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-slate-50 dark:border-slate-700/50",
                      selectedConversationId === item.id
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="size-12">
                        <AvatarImage src={item.other_user_avatar} />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                          {(item.other_user_name || 'U').split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{item.other_user_name || 'Unknown User'}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                          {item.last_message_at ? format(new Date(item.last_message_at), 'h:mm a') : ''}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs truncate mt-0.5",
                        isTyping ? "text-emerald-600 dark:text-emerald-400 italic" : "text-slate-500"
                      )}>
                        {isTyping ? "typing..." : (item.last_message || 'No messages yet')}
                      </p>
                    </div>
                    {isVirtual && (
                      <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Plus className="size-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </ScrollArea>

          {/* New Chat Button */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-700">
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-xl h-11"
              onClick={() => setIsNewChatOpen(true)}
            >
              <MessageSquare className="size-4" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className={cn(
            "flex-1 min-w-0 flex flex-col bg-slate-50 dark:bg-[#0b141a] h-full relative overflow-hidden",
            (!isMobileChatOpen ? "hidden md:flex" : "flex")
          )}
            style={{
              backgroundImage: (wallpaper.startsWith('data:') || wallpaper.startsWith('http')) ? `url(${wallpaper})` : undefined,
              backgroundColor: (!wallpaper.startsWith('data:') && !wallpaper.startsWith('http')) ? wallpaper : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '100%'
            }}
          >

            {/* Chat Header */}
            <div className="h-16 px-3 md:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-[#1f2c34] z-20 shrink-0 select-none">
              {isMessageSearchOpen ? (
                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-2 duration-200">
                  <Search className="size-4 text-slate-400" />
                  <Input
                    autoFocus
                    placeholder="Search in conversation..."
                    className="border-none shadow-none focus-visible:ring-0 bg-transparent h-9 px-0"
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsMessageSearchOpen(false);
                        setMessageSearchQuery("");
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400"
                    onClick={() => {
                      setIsMessageSearchOpen(false);
                      setMessageSearchQuery("");
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 shrink-0 size-10 -ml-2"
                      onClick={() => setIsMobileChatOpen(false)}
                    >
                      <ArrowLeft className="size-6" />
                    </Button>
                    <Avatar className="size-8 md:size-10 shrink-0 border border-slate-200 dark:border-slate-700/50">
                      <AvatarImage src={selectedConversation.other_user_avatar} />
                      <AvatarFallback className="bg-emerald-500 dark:bg-[#064e43] text-white">
                        {(selectedConversation.other_user_name || 'U').split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 flex flex-col justify-center ml-1 text-left">
                      <h3 className="font-bold text-sm truncate leading-tight text-slate-900 dark:text-white">{selectedConversation.other_user_name || 'Unknown User'}</h3>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate leading-none mt-0.5">
                        {isOtherUserOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0 ml-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 min-w-[36px] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white shrink-0"
                      onClick={() => {
                        const callType = 'audio';
                        if (role === 'lecturer') {
                          handleCreateMeeting(callType);
                        } else {
                          setIsJoinMeetingOpen(true);
                        }
                      }}
                    >
                      <Phone className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 min-w-[36px] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white shrink-0"
                      onClick={() => {
                        const callType = 'video';
                        if (role === 'lecturer') {
                          handleCreateMeeting(callType);
                        } else {
                          setIsJoinMeetingOpen(true);
                        }
                      }}
                    >
                      <Video className="size-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 min-w-[36px] text-slate-500 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white shrink-0"
                      onClick={() => setIsMessageSearchOpen(true)}
                    >
                      <Search className="size-5" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-9 text-slate-600 dark:text-slate-500 hover:text-emerald-600">
                          <MoreVertical className="size-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Trash2 className="size-4" />
                            <span>Clear Chat</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Settings className="size-4" />
                            <span>Chat Settings</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <LogOut className="size-4" />
                            <span>Delete Chat</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => document.getElementById('wallpaper-upload')?.click()}>
                          <span className="text-xs">Change Wallpaper</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pb-2">
                          Meetings
                        </DropdownMenuLabel>
                        {role === 'lecturer' && (
                          <DropdownMenuItem onClick={() => handleCreateMeeting('video')}>
                            <Video className="size-4 mr-2" />
                            <span className="text-xs">Create Meeting</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setIsJoinMeetingOpen(true)}>
                          <Link className="size-4 mr-2" />
                          <span className="text-xs">Join Meeting</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <input
                      id="wallpaper-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleWallpaperUpload}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea
              className="flex-1 w-full"
              style={{
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
              viewportRef={scrollViewportRef}
              onScroll={handleScroll}
            >
              <div className="px-2.5 md:px-6 py-4 max-w-5xl mx-auto w-full">
                {loading && !loadingMore ? (
                  <ChatSkeleton />
                ) : (
                  <>
                    {loadingMore && (
                      <div className="flex justify-center py-2 h-8">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {groupedMessages.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        <DateSeparator date={group.date} />
                        {group.messages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            setMessageToDelete={setMessageToDelete}
                            onEdit={editMessage}
                          />
                        ))}
                      </div>
                    ))}
                    {isOtherUserTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="p-2 md:p-4 bg-white dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-700 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] md:pb-4 shrink-0">
              {selectedFile && (
                <div className="mb-2 p-3 bg-[#1f2c34] rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="size-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <FileText className="size-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate text-slate-200">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="size-8 text-slate-400" onClick={clearSelectedFile}>
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 max-w-full mx-auto w-full">
                {/* Plus button outside */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 text-emerald-500 hover:bg-emerald-500/10 rounded-full shrink-0"
                    >
                      <Plus className="size-6 transition-transform hover:rotate-90 duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-56 rounded-2xl p-2 shadow-xl border-slate-700 bg-[#1f2c34]">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-emerald-900/30">
                      <div className="size-10 rounded-xl bg-blue-900/30 flex items-center justify-center text-blue-400">
                        <Paperclip className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-200">File</span>
                        <span className="text-[10px] text-slate-400">Document, image, or video</span>
                      </div>
                    </DropdownMenuItem>
                    {role === 'lecturer' && (
                      <DropdownMenuItem onClick={() => setIsPollDialogOpen(true)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-emerald-900/30">
                        <div className="size-10 rounded-xl bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                          <BarChart2 className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-slate-200">Poll</span>
                          <span className="text-[10px] text-slate-400">Create a class survey</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="*"
                />

                {/* Message Pill */}
                <div className="flex-1 flex items-center bg-slate-100 dark:bg-[#2a3942] rounded-full px-4 py-1 gap-2 min-h-[44px] border border-slate-200 dark:border-none">
                  <div className="flex-1 relative flex items-center">
                    {isRecording ? (
                      <div className="flex-1 flex items-center gap-2 h-9">
                        <span className="size-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium font-mono text-slate-200">{formatTime(recordingTime)}</span>
                        <div className="flex-1 overflow-hidden flex items-center gap-0.5 opacity-40">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-1 bg-emerald-500 rounded-full h-4 animate-pulse" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Input
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          if (e.target.value.length % 5 === 0) sendTyping();
                        }}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm w-full shadow-none text-slate-900 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-400 px-0"
                      />
                    )}
                  </div>

                  {/* Microphone inside the pill */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 shrink-0 rounded-full",
                      isRecording ? "text-red-500" : "text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                    )}
                    onClick={toggleRecording}
                  >
                    <Mic className={cn("size-5", isRecording && "animate-pulse")} />
                  </Button>
                </div>

                {/* Send Button separate circle */}
                <Button
                  size="icon"
                  className={cn(
                    "size-11 rounded-full shrink-0 shadow-lg transition-transform active:scale-90",
                    messageInput.trim() || selectedFile
                      ? "bg-emerald-600 dark:bg-[#00a884] hover:bg-emerald-700 dark:hover:bg-[#008f72] text-white"
                      : "bg-slate-100 dark:bg-[#2a3942] text-slate-400 cursor-not-allowed opacity-80"
                  )}
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && !selectedFile) || isUploading}
                >
                  {isUploading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5 ml-0.5" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (

          <div className="hidden md:flex flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="text-center max-w-md">
              <div className="size-24 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MessageSquare className="size-12 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Messages</h3>
              <p className="text-sm text-slate-500 mb-6">
                Select a conversation from the sidebar or start a new chat to begin messaging.
              </p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 rounded-xl"
                onClick={() => setIsNewChatOpen(true)}
              >
                <Plus className="size-4" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}


        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Conversation</DialogTitle>
              <DialogDescription>
                This will delete the chat only for you. The other person will still have the conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                handleDeleteChat();
                setShowDeleteDialog(false);
              }}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Clear Confirmation Dialog */}
        <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear Chat History</DialogTitle>
              <DialogDescription>
                This will clear all messages in this viewer for you. The chat will remain in your list.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowClearDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                handleClearChat();
                setShowClearDialog(false);
              }}>Clear Messages</Button>
            </div>
          </DialogContent>
        </Dialog>
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

        {/* New Chat Dialog */}
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{role === 'lecturer' ? "New Message" : "Select a Class"}</DialogTitle>
              <DialogDescription>
                {role === 'lecturer'
                  ? "Select a student to message."
                  : "Choose a class to contact the lecturer."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {role === 'lecturer' ? (
                studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-emerald-500" />
                  </div>
                ) : classGroups?.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No eligible students found.</p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {classGroups?.map((group) => (
                        group.students.length > 0 && (
                          <div key={group.class_id}>
                            <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 z-10 py-1">
                              {group.class_name}
                            </h4>
                            <div className="space-y-1">
                              {group.students.map(student => (
                                <button
                                  key={student.id}
                                  onClick={() => handleStartNewChat(student.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                                >
                                  <Avatar className="size-10">
                                    <AvatarImage src={student.avatar_url || ''} />
                                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                                      {(student.full_name || 'S').charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{student.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </ScrollArea>

                )
              ) : (
                classesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-emerald-500" />
                  </div>
                ) : classes.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No enrolled classes found.</p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {classes.map((cls) => (
                        <div key={cls.id}>
                          <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-white dark:bg-slate-900 z-10 py-1">
                            {cls.class_name || cls.course_code}
                          </h4>
                          <div className="space-y-1">
                            <button
                              onClick={() => handleStartNewChat(cls.lecturer_id)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                              <Avatar className="size-10">
                                <AvatarImage src={cls.lecturer_profile_image || ''} />
                                <AvatarFallback className="bg-emerald-100 text-emerald-600">
                                  {(cls.lecturer_name || 'L').charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{cls.lecturer_name || 'Unknown Lecturer'}</p>
                                <p className="text-xs text-slate-500 truncate">Lecturer • {cls.course_code}</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Create Meeting Dialog */}
      <Dialog open={isCreateMeetingOpen} onOpenChange={setIsCreateMeetingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>
              Share this code with others to let them join.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-2 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <code className="text-2xl font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                {createdMeetingCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(createdMeetingCode);
                  toast.success("Meeting code copied!");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <div className="flex gap-4">
              <Button
                variant={meetingType === 'audio' ? 'default' : 'outline'}
                onClick={() => setMeetingType('audio')}
                className="w-32"
              >
                <Phone className="size-4 mr-2" />
                Audio
              </Button>
              <Button
                variant={meetingType === 'video' ? 'default' : 'outline'}
                onClick={() => setMeetingType('video')}
                className="w-32"
              >
                <Video className="size-4 mr-2" />
                Video
              </Button>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => startMeeting(createdMeetingCode, meetingType)}
            >
              Start Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Meeting Dialog */}
      <Dialog open={isJoinMeetingOpen} onOpenChange={setIsJoinMeetingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Meeting</DialogTitle>
            <DialogDescription>
              Enter the 6-character code to join an existing meeting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="e.g. ABC-123"
              className="text-center text-lg tracking-widest uppercase"
              value={joinMeetingCode}
              onChange={(e) => setJoinMeetingCode(e.target.value.toUpperCase())}
              maxLength={7}
            />
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => startMeeting(joinMeetingCode, 'audio')}
                disabled={joinMeetingCode.length < 7}
              >
                <Phone className="size-4 mr-2" />
                Join Audio
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => startMeeting(joinMeetingCode, 'video')}
                disabled={joinMeetingCode.length < 7}
              >
                <Video className="size-4 mr-2" />
                Join Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedConversationId && (
        <ChatPollDialog
          isOpen={isPollDialogOpen}
          onClose={() => setIsPollDialogOpen(false)}
          conversationId={selectedConversationId}
          onSuccess={(pollId, question) => {
            const receiverId = conversations.find(c => c.id === selectedConversationId)?.participant_1 === user?.id
              ? conversations.find(c => c.id === selectedConversationId)?.participant_2
              : conversations.find(c => c.id === selectedConversationId)?.participant_1;

            if (receiverId) {
              sendMessage(receiverId, "📊 " + question, {
                name: question,
                url: pollId,
                type: 'poll'
              });
            }
          }}
        />
      )}
      {/* Chat Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-emerald-600" />
              Chat Settings
            </DialogTitle>
            <DialogDescription>
              Manage privacy and automation for this conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="flex-1 space-y-1">
                <Label htmlFor="auto-delete" className="text-base font-semibold">Auto-Delete Messages</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  When enabled, messages older than 15 days will be automatically removed from this conversation for you.
                </p>
              </div>
              <Switch
                id="auto-delete"
                checked={(user?.id && selectedConversation?.auto_delete_settings?.[user.id]) || false}
                onCheckedChange={async (checked) => {
                  try {
                    await toggleAutoDelete(selectedConversationId!, checked);
                    toast.success(checked ? "Auto-delete enabled" : "Auto-delete disabled", {
                      description: checked ? "Messages will be auto-deleted after 15 days." : "Messages will remain permanently."
                    });
                  } catch (err) {
                    toast.error("Failed to update setting");
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
