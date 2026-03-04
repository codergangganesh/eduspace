import { useState, useRef, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useClassFeed, FeedPost } from "@/hooks/useClassFeed";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "@/components/SEO";
import {
    Megaphone,
    Pin,
    PinOff,
    Trash2,
    Paperclip,
    Send,
    Image as ImageIcon,
    FileText,
    X,
    Smile,
    Eye,
    Users,
    ChevronDown,
    Loader2,
    Sparkles,
    Heart,
    ThumbsUp,
    Check,
    CheckCheck,
    Download,
    ExternalLink,
    MessageSquare,
    BookOpen,
    GraduationCap,
    TrendingUp,
    Info,
    Calendar,
    Hash,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Emoji reactions ──────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "😂", "🤔", "👀"];

// ── Feed Skeleton ────────────────────────────────────────────────────────────

function FeedSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface rounded-2xl border border-border p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Sidebar Skeleton ─────────────────────────────────────────────────────────

function SidebarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            </div>
            <div className="bg-surface rounded-2xl border border-border p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
            </div>
        </div>
    );
}

// ── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
    post,
    onTogglePin,
    onDelete,
    onReact,
    isAuthor,
    isLecturer,
    userId,
}: {
    post: FeedPost;
    onTogglePin: () => void;
    onDelete: () => void;
    onReact: (emoji: string) => void;
    isAuthor: boolean;
    isLecturer: boolean;
    userId: string;
}) {
    const [showAllReactions, setShowAllReactions] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Group reactions by emoji
    const reactionGroups = post.reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], hasReacted: false };
        acc[r.emoji].count++;
        acc[r.emoji].users.push(r.user_name || 'Unknown');
        if (r.user_id === userId) acc[r.emoji].hasReacted = true;
        return acc;
    }, {} as Record<string, { count: number; users: string[]; hasReacted: boolean }>);

    const isImage = post.attachment_type?.startsWith('image/');
    const isPDF = post.attachment_type === 'application/pdf' || post.attachment_name?.toLowerCase().endsWith('.pdf');

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "bg-surface rounded-2xl border shadow-sm transition-all hover:shadow-md group",
                post.is_pinned
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-surface dark:from-amber-950/20 dark:to-surface ring-1 ring-amber-300/30"
                    : "border-border"
            )}
        >
            {/* Pinned indicator */}
            {post.is_pinned && (
                <div className="flex items-center gap-1.5 px-5 pt-3 text-amber-600 dark:text-amber-400">
                    <Pin className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pinned Announcement</span>
                </div>
            )}

            <div className="p-5 pt-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border/50 shadow-sm">
                            <AvatarImage src={post.author_avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">{post.author_name}</span>
                                {post.author_role === 'lecturer' && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        Lecturer
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                <span className="opacity-40">·</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-default">{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>{format(new Date(post.created_at), 'EEEE, MMMM d yyyy, h:mm:ss a')}</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {(isAuthor || isLecturer) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                                    <ChevronDown className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {isLecturer && (
                                    <DropdownMenuItem onClick={onTogglePin} className="gap-2">
                                        {post.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                                        {post.is_pinned ? "Unpin" : "Pin to top"}
                                    </DropdownMenuItem>
                                )}
                                {(isAuthor || isLecturer) && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (confirmDelete) {
                                                onDelete();
                                                setConfirmDelete(false);
                                            } else {
                                                setConfirmDelete(true);
                                                setTimeout(() => setConfirmDelete(false), 3000);
                                            }
                                        }}
                                        className="gap-2 text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="size-4" />
                                        {confirmDelete ? "Confirm Delete?" : "Delete"}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Content */}
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {post.content}
                </div>

                {/* Attachment */}
                {post.attachment_url && (
                    <div className="rounded-xl overflow-hidden border border-border/50">
                        {isImage ? (
                            <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                    src={post.attachment_url}
                                    alt={post.attachment_name || 'Attachment'}
                                    className="w-full max-h-96 object-cover rounded-xl hover:opacity-95 transition-opacity"
                                    loading="lazy"
                                />
                            </a>
                        ) : (
                            <a
                                href={post.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-secondary transition-colors rounded-xl"
                            >
                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    {isPDF ? (
                                        <FileText className="size-5 text-red-500" />
                                    ) : (
                                        <Paperclip className="size-5 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{post.attachment_name || 'Attachment'}</p>
                                    <p className="text-xs text-muted-foreground">Click to open</p>
                                </div>
                                <ExternalLink className="size-4 text-muted-foreground shrink-0" />
                            </a>
                        )}
                    </div>
                )}

                {/* Footer: Reactions + Seen */}
                <div className="flex items-center justify-between pt-1">
                    {/* Reactions */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {/* Existing reactions */}
                        {Object.entries(reactionGroups).map(([emoji, data]) => (
                            <TooltipProvider key={emoji}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onReact(emoji)}
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all border",
                                                data.hasReacted
                                                    ? "bg-primary/10 border-primary/30 text-primary"
                                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground"
                                            )}
                                        >
                                            <span>{emoji}</span>
                                            <span className="font-semibold">{data.count}</span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-48">
                                        <p className="text-xs">{data.users.join(', ')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}

                        {/* Add reaction button */}
                        <DropdownMenu open={showAllReactions} onOpenChange={setShowAllReactions}>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center justify-center size-7 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors">
                                    <Smile className="size-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="flex gap-1 p-2 min-w-0">
                                {REACTION_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            onReact(emoji);
                                            setShowAllReactions(false);
                                        }}
                                        className="text-lg hover:scale-125 transition-transform px-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Read receipts */}
                    {isLecturer && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {post.seen_count >= post.total_students && post.total_students > 0 ? (
                                            <CheckCheck className="size-3.5 text-blue-500" />
                                        ) : (
                                            <Eye className="size-3.5" />
                                        )}
                                        <span>
                                            {post.seen_count}/{post.total_students}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">
                                        Seen by {post.seen_count} of {post.total_students} students
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ── Desktop Class Info Sidebar ───────────────────────────────────────────────

function ClassInfoSidebar({
    currentClass,
    classes,
    selectedClassId,
    setSelectedClassId,
    posts,
    isLecturer,
    loading,
}: {
    currentClass: { id: string; class_name: string | null; course_code: string } | undefined;
    classes: { id: string; class_name: string | null; course_code: string }[];
    selectedClassId: string | null;
    setSelectedClassId: (id: string) => void;
    posts: FeedPost[];
    isLecturer: boolean;
    loading: boolean;
}) {
    const pinnedCount = useMemo(() => posts.filter(p => p.is_pinned).length, [posts]);
    const totalReactions = useMemo(() => posts.reduce((sum, p) => sum + p.reactions.length, 0), [posts]);
    const totalStudents = posts.length > 0 ? posts[0].total_students : 0;

    if (loading) return <SidebarSkeleton />;

    return (
        <div className="space-y-4">
            {/* Class Info Card */}
            {currentClass && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    {/* Header gradient banner */}
                    <div className="h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCA0LTRzNCAwIDQgNC0yIDQtNCA0LTQtMi00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                        <div className="absolute bottom-3 left-4">
                            <div className="size-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <GraduationCap className="size-5 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-3">
                        <div>
                            <h3 className="font-bold text-base text-foreground">{currentClass.course_code}</h3>
                            {currentClass.class_name && (
                                <p className="text-sm text-muted-foreground mt-0.5">{currentClass.class_name}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                            </Badge>
                            {isLecturer && (
                                <Badge variant="outline" className="text-[10px] gap-1">
                                    <Users className="size-2.5" />
                                    {totalStudents} students
                                </Badge>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Quick Stats */}
            {currentClass && posts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-surface rounded-2xl border border-border p-4"
                >
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Overview</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary/40 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-foreground">{posts.length}</div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Total Posts</div>
                        </div>
                        <div className="bg-secondary/40 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{pinnedCount}</div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Pinned</div>
                        </div>
                        <div className="bg-secondary/40 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-rose-500">{totalReactions}</div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Reactions</div>
                        </div>
                        <div className="bg-secondary/40 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-blue-500">
                                {posts.filter(p => p.attachment_url).length}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Attachments</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Class Selector — collapsible dropdown, shown if multiple classes */}
            {classes.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <button
                        onClick={() => {
                            const el = document.getElementById('class-switcher-list');
                            if (el) el.classList.toggle('hidden');
                            const icon = document.getElementById('class-switcher-chevron');
                            if (icon) icon.classList.toggle('rotate-180');
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary tracking-wider">
                                    {classes.find(c => c.id === selectedClassId)?.course_code?.substring(0, 2).toUpperCase() || '#'}
                                </span>
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Switch Class</h4>
                                <p className="text-[11px] text-primary font-medium mt-0.5">
                                    {classes.find(c => c.id === selectedClassId)?.course_code || 'Select'}
                                </p>
                            </div>
                        </div>
                        <ChevronDown id="class-switcher-chevron" className="size-4 text-muted-foreground transition-transform duration-200" />
                    </button>
                    <div id="class-switcher-list" className="hidden border-t border-border/50 p-2 space-y-1">
                        {classes.map(cls => (
                            <button
                                key={cls.id}
                                onClick={() => setSelectedClassId(cls.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all text-sm",
                                    cls.id === selectedClassId
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "hover:bg-secondary/60 text-muted-foreground border border-transparent"
                                )}
                            >
                                <div className={cn(
                                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                                    cls.id === selectedClassId
                                        ? "bg-primary/20"
                                        : "bg-secondary"
                                )}>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-wider",
                                        cls.id === selectedClassId ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {cls.course_code.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-xs truncate">{cls.course_code}</div>
                                    {cls.class_name && (
                                        <div className="text-[10px] text-muted-foreground truncate">{cls.class_name}</div>
                                    )}
                                </div>
                                {cls.id === selectedClassId && (
                                    <Check className="size-3.5 ml-auto shrink-0 text-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Info tip */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4"
            >
                <div className="flex gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        <Info className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                            {isLecturer ? "Post Announcements" : "Stay Updated"}
                        </h4>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-300/70 mt-1 leading-relaxed">
                            {isLecturer
                                ? "Your posts will notify all enrolled students via in-app notifications and email."
                                : "You'll receive notifications whenever your lecturer posts a new announcement."}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ClassFeed() {
    const {
        posts,
        classes,
        selectedClassId,
        setSelectedClassId,
        loading,
        posting,
        createPost,
        togglePin,
        deletePost,
        toggleReaction,
    } = useClassFeed();

    const { user, role, profile } = useAuth();
    const isLecturer = role === "lecturer";

    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [content]);

    // File selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File too large", { description: "Maximum file size is 10MB" });
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        const docInput = document.getElementById('doc-file-input') as HTMLInputElement;
        if (docInput) docInput.value = '';
    };

    // Submit post
    const handleSubmit = async () => {
        if (!content.trim() && !selectedFile) {
            toast.error("Please write something to post");
            return;
        }

        let attachment = null;

        if (selectedFile) {
            try {
                setUploading(true);
                const uploaded = await uploadToCloudinary(selectedFile);
                attachment = {
                    url: uploaded.url,
                    name: uploaded.name,
                    type: selectedFile.type,
                };
            } catch (err) {
                toast.error("Failed to upload file");
                setUploading(false);
                return;
            } finally {
                setUploading(false);
            }
        }

        const success = await createPost(content, attachment);

        if (success) {
            setContent("");
            clearFile();
        }
    };

    // Empty state
    const hasClasses = classes.length > 0;
    const currentClass = classes.find(c => c.id === selectedClassId);

    return (
        <DashboardLayout
            actions={
                <div className="flex items-center gap-2">
                    <SEO
                        title="Class Feed"
                        description="Stay updated with announcements, class discussions, and shared resources in your EduSpace class feed."
                    />
                </div>
            }
        >
            {/* ── Desktop: Two-column layout  |  Mobile: Single column ── */}
            <div className="lg:grid lg:grid-cols-[1fr,320px] lg:gap-6 lg:max-w-6xl lg:mx-auto">

                {/* ═══ LEFT COLUMN: Feed ═══ */}
                <div className="max-w-2xl mx-auto w-full lg:max-w-none space-y-5">

                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Megaphone className="size-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Class Feed</h1>
                                <p className="text-xs text-muted-foreground">Announcements & updates</p>
                            </div>
                        </div>

                        {/* Class Selector — Mobile only (desktop uses sidebar) */}
                        {hasClasses && classes.length > 1 && (
                            <div className="lg:hidden">
                                <Select
                                    value={selectedClassId || ''}
                                    onValueChange={(val) => setSelectedClassId(val)}
                                >
                                    <SelectTrigger className="w-48 h-9 text-sm">
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                <span className="font-medium">{cls.course_code}</span>
                                                {cls.class_name && <span className="text-muted-foreground ml-1.5">— {cls.class_name}</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Single class badge — Mobile only */}
                    {hasClasses && classes.length === 1 && (
                        <div className="flex items-center gap-2 lg:hidden">
                            <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                                {currentClass?.course_code}{currentClass?.class_name ? ` — ${currentClass.class_name}` : ''}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                                <Users className="size-3 mr-1" />
                                Active
                            </Badge>
                        </div>
                    )}

                    {/* No classes state */}
                    {!hasClasses && !loading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                                <Megaphone className="size-10 text-blue-500/70" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">No Classes Yet</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    {isLecturer
                                        ? "Create a class first to start posting announcements."
                                        : "Join a class to see announcements from your lecturers."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Composer — Lecturers only */}
                    {hasClasses && isLecturer && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface rounded-2xl border border-border p-4 shadow-sm space-y-3"
                        >
                            <div className="flex gap-3">
                                <Avatar className="size-9 border border-border/50 shrink-0 mt-0.5">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                        {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-3">
                                    <Textarea
                                        ref={textareaRef}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write an announcement for your class..."
                                        className="min-h-[60px] resize-none border-0 bg-secondary/30 rounded-xl p-3 text-sm focus-visible:ring-1 focus-visible:ring-primary/30 placeholder:text-muted-foreground/60"
                                        rows={2}
                                    />

                                    {/* File Preview */}
                                    {selectedFile && (
                                        <div className="relative">
                                            {filePreview ? (
                                                <div className="relative rounded-xl overflow-hidden border border-border/50">
                                                    <img src={filePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                                                    <button
                                                        onClick={clearFile}
                                                        className="absolute top-2 right-2 size-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border border-border/50">
                                                    <FileText className="size-4 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground truncate flex-1">{selectedFile.name}</span>
                                                    <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                                                        <X className="size-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions Bar */}
                            <div className="flex items-center justify-between pl-12">
                                <div className="flex items-center gap-1">
                                    {/* Separate input for images */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    {/* Separate input for documents */}
                                    <input
                                        id="doc-file-input"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar"
                                        onChange={handleFileSelect}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-muted-foreground hover:text-primary text-xs"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon className="size-4" />
                                        <span className="hidden sm:inline">Photo</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-muted-foreground hover:text-primary text-xs"
                                        onClick={() => document.getElementById('doc-file-input')?.click()}
                                    >
                                        <Paperclip className="size-4" />
                                        <span className="hidden sm:inline">File</span>
                                    </Button>
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={posting || uploading || (!content.trim() && !selectedFile)}
                                    size="sm"
                                    className="h-8 gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md shadow-violet-500/20 px-4"
                                >
                                    {posting || uploading ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Send className="size-3.5" />
                                    )}
                                    <span>{posting ? "Posting..." : uploading ? "Uploading..." : "Post"}</span>
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Loading skeleton */}
                    {loading && <FeedSkeleton />}

                    {/* Feed Posts */}
                    {!loading && hasClasses && (
                        <AnimatePresence mode="popLayout">
                            {posts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-16 text-center space-y-4"
                                >
                                    <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                                        <MessageSquare className="size-8 text-violet-500/60" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">No Announcements Yet</h3>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                            {isLecturer
                                                ? "Post your first announcement to your class above! 📢"
                                                : "Your lecturer hasn't posted any announcements yet. Check back later!"}
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onTogglePin={() => togglePin(post.id, post.is_pinned)}
                                            onDelete={() => deletePost(post.id)}
                                            onReact={(emoji) => toggleReaction(post.id, emoji)}
                                            isAuthor={post.author_id === user?.id}
                                            isLecturer={isLecturer}
                                            userId={user?.id || ''}
                                        />
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* ═══ RIGHT COLUMN: Sidebar (Desktop only) ═══ */}
                <aside className="hidden lg:block">
                    <div className="sticky top-0">
                        <ClassInfoSidebar
                            currentClass={currentClass}
                            classes={classes}
                            selectedClassId={selectedClassId}
                            setSelectedClassId={setSelectedClassId}
                            posts={posts}
                            isLecturer={isLecturer}
                            loading={loading}
                        />
                    </div>
                </aside>
            </div>
        </DashboardLayout>
    );
}
