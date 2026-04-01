import { useState, useEffect, useRef } from "react";
import { Plus, Folder, Trash2, MoreVertical, Search, Home, X, Clock, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgentConversation {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface AgentSidebarProps {
  currentConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  conversations: AgentConversation[];
  isLoading?: boolean;
  onClose?: () => void;
}

export function AgentSidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  conversations,
  isLoading,
  onClose,
}: AgentSidebarProps) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const filteredConversations = (conversations || []).filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-card/20 backdrop-blur-md">
      <div className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl overflow-hidden border border-border/60 shadow-lg shrink-0">
            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
          </div>
          <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.15em] text-foreground/90 whitespace-nowrap">
            Eduspace Agent
          </span>
        </div>
        <div className="flex items-center gap-2 mr-8 md:mr-0">
          <Button
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8 md:h-9 md:w-9 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm shadow-primary/5"
            variant="outline"
            title="New Chat"
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

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-2 h-9 min-h-[36px]">
          <AnimatePresence mode="wait">
            {!showSearch ? (
              <motion.p
                key="history-label"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2"
              >
                Recent History
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
              showSearch ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"
            )}
          >
            {showSearch ? <X className="h-4 w-4" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1.5 py-2">
          {isLoading ? (
            <div className="space-y-4 px-4 py-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 opacity-20 animate-pulse">
                  <div className="size-4 bg-foreground rounded " />
                  <div className="h-3 w-full bg-foreground rounded" />
                </div>
              ))}
            </div>
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
            filteredConversations.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer border border-transparent mb-1",
                  currentConversationId === item.id
                    ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
                onClick={() => onSelectConversation(item.id)}
              >
                <Folder className={cn(
                  "mr-3 h-4 w-4 shrink-0 transition-colors",
                  currentConversationId === item.id ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                )} />

                <div className="flex-1 flex flex-col justify-center min-w-0 pr-8">
                  <span className="text-[13px] font-semibold leading-tight text-foreground/90 line-clamp-2 break-words">
                    {item.title}
                  </span>
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
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer py-2.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteConversation?.(item.id);
                                }}
                            >
                                <Trash2 className="mr-3 h-4 w-4" />
                                <span className="font-semibold">Delete Chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {currentConversationId === item.id && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40 bg-background/20 mt-auto">
        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em] text-center leading-relaxed">
          Chat history is automatically cleared <br /> after 7 days of inactivity
        </p>
      </div>
    </div>
  );
}
