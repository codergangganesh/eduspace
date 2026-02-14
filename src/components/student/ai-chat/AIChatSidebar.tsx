import { useState, useEffect, useRef } from "react";
import { SidebarSkeleton } from "./AIChatSkeleton";
import { Plus, Folder, Trash2, MoreVertical, Sparkles, Pencil, Check, X, Search, Bot, Pin, PinOff, Share2, Link } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatSidebarProps {
    currentConversationId?: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    conversations: AIConversation[];
    onDeleteConversation: (id: string) => void;
    onUpdateTitle?: (id: string, newTitle: string) => void;
    onTogglePin?: (id: string) => void;
    onToggleShare?: (id: string) => void;
    onCopyShareLink?: (shareToken: string) => void;
    onClose?: () => void;
    isLoading?: boolean;
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
}: AIChatSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <div className="flex flex-col h-full w-full bg-card/20 backdrop-blur-md">
            <div className="p-4 md:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl overflow-hidden border border-border/60 shadow-lg shrink-0">
                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.15em] text-foreground/90">
                        Eduspace AI
                    </span>
                </div>
                <div className="flex items-center gap-2 mr-8 md:mr-0">
                    <Button
                        size="icon"
                        onClick={onNewChat}
                        className="h-8 w-8 md:h-9 md:w-9 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm shadow-primary/5"
                        variant="outline"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {onClose && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onClose}
                        className="absolute top-4 right-4 h-8 w-8 text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted md:hidden rounded-full transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="px-6 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">
                        Recent History
                    </p>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowSearch(!showSearch)}
                        className={cn(
                            "h-6 w-6 rounded-md transition-colors",
                            showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                    >
                        <Search className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-2 mb-2"
                    >
                        <Input
                            ref={searchInputRef}
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-xs bg-background/50 border-border/40 focus-visible:ring-primary/20"
                        />
                    </motion.div>
                )}
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="space-y-1.5 py-2">
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
                        filteredConversations.map((chat) => (
                            <div
                                key={chat.id}
                                className={cn(
                                    "group relative flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer border border-transparent mb-1",
                                    currentConversationId === chat.id
                                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                                onClick={() => editingId !== chat.id && onSelectConversation(chat.id)}
                            >
                                <Folder className={cn(
                                    "mr-3 h-4 w-4 shrink-0 transition-colors",
                                    currentConversationId === chat.id ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                                )} />

                                {editingId === chat.id ? (
                                    <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <Input
                                            ref={inputRef}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(chat.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            className="h-7 py-0 px-2 text-sm font-semibold bg-background/50 border-primary/30"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-primary hover:bg-primary/10"
                                            onClick={() => handleSaveEdit(chat.id)}
                                        >
                                            <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                                            onClick={() => setEditingId(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 flex items-center gap-2 truncate pr-6">
                                            <span className="truncate leading-tight font-semibold">{chat.title}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {chat.is_pinned && (
                                                    <Pin className="h-2.5 w-2.5 text-primary rotate-45" />
                                                )}
                                                {chat.share_token && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 p-0 hover:bg-emerald-500/10 text-emerald-500 rounded-md transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCopyShareLink?.(chat.share_token!);
                                                        }}
                                                        title="Copy Share Link"
                                                    >
                                                        <Link className="h-2.5 w-2.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform scale-100 md:scale-90 md:group-hover:scale-100">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-lg">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl border-border/40">
                                                    <DropdownMenuItem
                                                        className="rounded-lg cursor-pointer py-2.5 font-semibold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleShare(chat);
                                                        }}
                                                    >
                                                        <Share2 className="mr-3 h-4 w-4" />
                                                        <span>{chat.share_token ? "Stop Sharing" : "Share Chat"}</span>
                                                    </DropdownMenuItem>
                                                    {chat.share_token && (
                                                        <DropdownMenuItem
                                                            className="rounded-lg cursor-pointer py-2.5 font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"
                                                            onClick={(e) => {
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTogglePin?.(chat.id);
                                                        }}
                                                    >
                                                        {chat.is_pinned ? (
                                                            <PinOff className="mr-3 h-4 w-4" />
                                                        ) : (
                                                            <Pin className="mr-3 h-4 w-4" />
                                                        )}
                                                        <span>{chat.is_pinned ? "Unpin Chat" : "Pin Chat"}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="rounded-lg cursor-pointer py-2.5 font-semibold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEdit(chat);
                                                        }}
                                                    >
                                                        <Pencil className="mr-3 h-4 w-4" />
                                                        <span>Edit Title</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5"
                                                        onClick={(e) => {
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
                                    </>
                                )}

                                {currentConversationId === chat.id && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/40 bg-background/20 mt-auto">
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em] text-center leading-relaxed">
                    Chat history is automatically cleared <br /> after 10 days of inactivity
                </p>
            </div>
        </div>
    );
}
