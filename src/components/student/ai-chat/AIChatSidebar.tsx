import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarSkeleton } from "./AIChatSkeleton";
import { Plus, Folder, Trash2, MoreVertical, Pencil, Check, X, Search, Pin, PinOff, Share2, Link, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AIConversation, aiChatService } from "@/lib/aiChatService";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatSidebarProps {
    currentConversationId?: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    conversations: (AIConversation | any)[];
    onDeleteConversation: (id: string) => void;
    onUpdateTitle?: (id: string, newTitle: string) => void;
    onTogglePin?: (id: string) => void;
    onToggleShare?: (id: string) => void;
    onCopyShareLink?: (shareToken: string) => void;
    onClose?: () => void;
    isLoading?: boolean;
    type?: 'chat' | 'voice';
}

export function AIChatSidebar({
    currentConversationId,
    onSelectConversation,
    onNewChat,
    conversations,
    onDeleteConversation,
    onUpdateTitle,
    onTogglePin,
    onToggleShare,
    onCopyShareLink,
    onClose,
    isLoading,
    type = 'chat',
}: AIChatSidebarProps) {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const formatDisplayTitle = (title: string) => {
        if (type === 'voice' && title.startsWith('Practice -')) {
            return 'Practice Session';
        }
        return title;
    };

    const handleStartEdit = (chat: AIConversation) => {
        setEditingId(chat.id);
        setEditValue(chat.title);
    };

    const handleToggleShare = (chat: AIConversation) => {
        onToggleShare?.(chat.id);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editValue.trim()) {
            setEditingId(null);
            return;
        }

        try {
            await aiChatService.updateConversationTitle(id, editValue.trim());
            onUpdateTitle?.(id, editValue.trim());
            setEditingId(null);
        } catch (error) {
            toast.error("Failed to update title");
        }
    };

    useEffect(() => {
        if (editingId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingId]);

    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    const filteredConversations = conversations.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupConversations = (chats: AIConversation[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);

        const groups: { [key: string]: AIConversation[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Previous 30 Days': [],
            'Older': []
        };

        chats.forEach(chat => {
            const chatDate = new Date(chat.created_at);
            if (chatDate >= today) groups['Today'].push(chat);
            else if (chatDate >= yesterday) groups['Yesterday'].push(chat);
            else if (chatDate >= last7Days) groups['Previous 7 Days'].push(chat);
            else if (chatDate >= last30Days) groups['Previous 30 Days'].push(chat);
            else groups['Older'].push(chat);
        });

        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    };

    const conversationGroups = groupConversations(filteredConversations);

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-card/20 backdrop-blur-md">
            <div className="relative border-b border-border/40 px-4 py-4 md:px-5 md:py-4">
                <div className={cn(
                    "flex items-center gap-3",
                    onClose && "pr-0"
                )}>
                    <div className="size-10 rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.15)] shrink-0 bg-primary/5 p-1.5 flex items-center justify-center">
                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                    </div>
                    <div className="min-w-0 md:flex-1 flex items-center justify-between gap-2 flex-1">
                        <span className="block truncate text-[11px] font-black uppercase tracking-[0.12em] text-foreground/90">
                            {type === 'voice' ? 'Voice Tutor' : 'Eduspace AI'}
                        </span>
                    </div>

                    <Button
                        onClick={onNewChat}
                        variant="outline"
                        size="icon"
                        className="hidden md:flex h-10 w-10 shrink-0 rounded-2xl border-primary/20 bg-primary/5 text-primary shadow-sm transition-all hover:bg-primary/10 ml-auto"
                        title="New Chat"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>

                    {onClose && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onClose}
                            className="h-8 w-8 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted md:hidden rounded-full transition-colors shrink-0 ml-1"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-4 pt-1 pb-1">
                <div className="flex items-center justify-between mb-1 h-8 min-h-[32px]">
                    <AnimatePresence mode="wait">
                        {!showSearch ? (
                            <motion.p
                                key="history-label"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 px-2"
                            >
                                {type === 'voice' ? 'Practice History' : 'Recent History'}
                            </motion.p>
                        ) : (
                            <motion.div
                                key="search-input-box"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "100%" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex-1 px-2 flex items-center gap-2"
                            >
                                <div className="relative flex-1 group">
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search chats..."
                                        value={searchQuery}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                        className="h-8 text-xs bg-background/50 border-border/40 focus-visible:ring-primary/20 pr-7"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground flex items-center justify-center"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            if (showSearch) setSearchQuery("");
                            setShowSearch(!showSearch);
                        }}
                        className={cn(
                            "h-7 w-7 rounded-lg transition-all shrink-0 ml-1",
                            showSearch ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {showSearch ? <X className="h-4 w-4" /> : <Search className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 px-2">
                <div className="py-1 px-1">
                    {isLoading ? (
                        <SidebarSkeleton />
                    ) : filteredConversations.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <div className="h-10 w-10 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Folder className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                {searchQuery ? "No matching chats found" : "No previous chats"}
                            </p>
                        </div>
                    ) : (
                        conversationGroups.map(([groupName, chats]) => (
                            <div key={groupName} className="mb-1">
                                {chats.map((chat) => (
                                    <div key={chat.id}>
                                        {editingId === chat.id ? (
                                            <div className="flex min-w-0 flex-1 items-center gap-1 px-1 py-1 mb-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                <Input
                                                    ref={inputRef}
                                                    value={editValue}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)}
                                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                        if (e.key === 'Enter') handleSaveEdit(chat.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    className="h-8 py-0 px-2 text-[13px] font-medium bg-background/50 border-primary/30"
                                                    autoFocus
                                                />
                                                <div className="flex items-center shrink-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-primary hover:bg-primary/10"
                                                        onClick={() => handleSaveEdit(chat.id)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => onSelectConversation(chat.id)}
                                                className={cn(
                                                    "group relative flex items-center h-[46px] px-3 transition-all cursor-pointer rounded-2xl border mb-1",
                                                    currentConversationId === chat.id
                                                        ? "bg-primary/10 border-primary/20 shadow-sm"
                                                        : "bg-transparent border-transparent hover:bg-muted/40"
                                                )}
                                            >
                                                {/* Active Indicator Bar */}
                                                {currentConversationId === chat.id && (
                                                    <div className="absolute left-0 w-[3px] h-6 bg-primary rounded-r-full" />
                                                )}

                                                <div className="flex-1 flex items-center min-w-0">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0 ml-0.5">
                                                        <Folder className={cn(
                                                            "h-3.5 w-3.5 shrink-0 transition-colors",
                                                            currentConversationId === chat.id ? "text-primary opacity-100" : "text-muted-foreground/50 group-hover:text-foreground opacity-80"
                                                        )} />
                                                        <div className="min-w-0 flex-1 ml-0.5">
                                                            <span className={cn(
                                                                "truncate leading-normal font-bold text-[12px] tracking-tight",
                                                                currentConversationId === chat.id ? "text-primary" : "text-foreground/80"
                                                            )}>
                                                                {formatDisplayTitle(chat.title)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Action Menu (Action dots) */}
                                                    <div className={cn(
                                                        "ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/35 transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                                                        currentConversationId === chat.id && "opacity-100 bg-muted/60"
                                                    )}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-foreground/70 hover:text-foreground rounded-lg transition-colors"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-border/40 p-2 backdrop-blur-xl bg-background/95 z-[100]">
                                                                <DropdownMenuItem
                                                                    className="rounded-lg cursor-pointer py-2.5 font-semibold"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        handleToggleShare(chat);
                                                                    }}
                                                                >
                                                                    <Share2 className="mr-3 h-4 w-4 text-muted-foreground" />
                                                                    <span>{chat.share_token ? "Stop Sharing" : "Share Chat"}</span>
                                                                </DropdownMenuItem>
                                                                {chat.share_token && (
                                                                    <DropdownMenuItem
                                                                        className="rounded-lg cursor-pointer py-2.5 font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                                                        onClick={(e: React.MouseEvent) => {
                                                                            e.stopPropagation();
                                                                            onCopyShareLink?.(chat.share_token!);
                                                                        }}
                                                                    >
                                                                        <Link className="mr-3 h-4 w-4" />
                                                                        <span>Copy Link</span>
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    className="rounded-lg cursor-pointer py-2.5 font-semibold"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        onTogglePin?.(chat.id);
                                                                    }}
                                                                >
                                                                    {chat.is_pinned ? (
                                                                        <PinOff className="mr-3 h-4 w-4 text-muted-foreground" />
                                                                    ) : (
                                                                        <Pin className="mr-3 h-4 w-4 text-muted-foreground" />
                                                                    )}
                                                                    <span>{chat.is_pinned ? "Unpin Chat" : "Pin Chat"}</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="rounded-lg cursor-pointer py-2.5 font-semibold"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        handleStartEdit(chat);
                                                                    }}
                                                                >
                                                                    <Pencil className="mr-3 h-4 w-4 text-muted-foreground" />
                                                                    <span>Rename</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5"
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.stopPropagation();
                                                                        onDeleteConversation(chat.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-3 h-4 w-4" />
                                                                    <span className="font-semibold">Delete Chat</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="mt-auto shrink-0 border-t border-border/40 bg-background/20 p-4 space-y-4">
                <Button
                    onClick={onNewChat}
                    className="w-full flex md:hidden items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4" />
                    <span>{type === 'voice' ? 'Start New Practice' : 'Start New Chat'}</span>
                </Button>

                <Button
                    onClick={() => navigate(role === 'lecturer' ? '/lecturer-dashboard' : '/dashboard')}
                    variant="outline"
                    className="hidden md:flex w-full items-center justify-center gap-2 h-11 rounded-xl border-border/60 bg-background/50 hover:bg-muted text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                    <Home className="h-4 w-4" />
                    <span>Back to Dashboard</span>
                </Button>

                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em] text-center leading-relaxed">
                    Chat history is automatically cleared <br /> after 10 days of inactivity
                </p>
            </div>
        </div>
    );
}
