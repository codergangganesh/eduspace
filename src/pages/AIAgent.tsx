import { useState, useRef, useEffect } from "react";
import { Bot, Trash2, Clock, Menu, Plus, Search, Home, FolderOpen, ChevronLeft, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAgentChat } from "@/hooks/useAgentChat";
import { AgentChatWindow } from "@/components/agent/AgentChatWindow";
import { AgentInput } from "@/components/agent/AgentInput";
import { AgentWelcome } from "@/components/agent/AgentWelcome";
import { AgentSidebar } from "@/components/agent/AgentSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useAgentHistory } from "@/hooks/useAgentHistory";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

const AIAgent = () => {
  // ... existing hooks ...
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const {
    messages,
    currentConversationId,
    isTyping,
    typingStatus,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
    loadConversation,
  } = useAgentChat();

  const { conversations, isLoading: isHistoryLoading, fetchConversations, deleteConversation } = useAgentHistory();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, currentConversationId]);

  const handleConfirm = async () => {
    setIsExecuting(true);
    await confirmAction();
    setIsExecuting(false);
  };

  const handleNewChat = () => {
    clearChat();
    setIsReadOnly(false);
    setIsMobileMenuOpen(false);
  };

  const handleSelectConversation = async (id: string) => {
    await loadConversation(id);
    setIsMobileMenuOpen(false);
    setIsHistoryOpen(false);
  };

  return (
    <DashboardLayout fullHeight hideHeaderOnMobile={true}>
      <div className="flex h-full w-full bg-background overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 md:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-card z-[60] md:hidden border-r border-border/40 shadow-2xl"
              >
                <AgentSidebar
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  isLoading={isHistoryLoading}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  onDeleteConversation={deleteConversation}
                  onClose={() => setIsMobileMenuOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-72 shrink-0 h-full border-r border-border/10">
          <AgentSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            isLoading={isHistoryLoading}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onDeleteConversation={deleteConversation}
          />
        </div>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent">
          {/* Chat Header - Matching AI Chat Style */}
          <div className="min-h-16 shrink-0 border-b border-border/10 bg-background/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-30">
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 h-9 w-9"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="size-10 rounded-xl overflow-hidden border border-primary/20 shadow-xl shadow-primary/5 shrink-0 bg-background/80 p-1.5 transition-transform hover:scale-105">
                <img src="/agent-icon.png" alt="EduSpace Agent" className="size-full object-cover rounded-lg" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black tracking-tight text-foreground leading-none">
                  EduSpace Agent
                </h2>
                <div className="flex items-center gap-2 mt-1.5 leading-none">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
                    <span className="text-[9px] text-primary font-black uppercase tracking-wider">Autonomous Core Interface</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                  title="New Chat"
                >
                  <Plus className="size-4.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-primary transition-all hover:bg-primary/5 md:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                title="View History"
              >
                <Clock className="size-4.5" />
              </Button>

              <div className="hidden md:flex items-center gap-2 pl-4 ml-4 border-l border-border/20">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">System Online</span>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full" viewportRef={scrollAreaRef as any}>
              <div className={cn(
                "w-full mx-auto min-h-full flex flex-col",
                isEmpty ? "items-center justify-start pt-2" : "max-w-5xl px-6 md:px-12 py-10 pb-48"
              )}>
                {isEmpty ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center w-full max-w-5xl">
                    <AgentWelcome onChipClick={(prompt) => sendMessage(prompt)} />
                  </div>
                ) : (
                  <AgentChatWindow
                    messages={messages}
                    isTyping={isTyping}
                    typingStatus={typingStatus}
                    pendingConfirmation={pendingConfirmation}
                    isExecuting={isExecuting}
                    onConfirm={handleConfirm}
                    onCancel={cancelAction}
                  />
                )}
                <div className="h-4" />
              </div>
            </ScrollArea>

            {/* Floating Input Area - Matching AI Chat spacing */}
            {!isReadOnly && (
              <div className="absolute inset-x-0 bottom-0 pointer-events-none z-30">
                <div className="h-40 bg-gradient-to-t from-background via-background/95 to-transparent" />
                <div className="bg-background pb-1 md:pb-1 pt-2 px-6 md:px-12 pointer-events-auto">
                  <div className="max-w-4xl lg:max-w-5xl mx-auto">
                    <div className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-border/30 ring-8 ring-primary/[0.02] bg-background/80 backdrop-blur-xl">
                      <AgentInput
                        onSend={sendMessage}
                        disabled={isTyping || isExecuting}
                        placeholder={
                          pendingConfirmation
                            ? 'Confirm action ("yes") or ask to change...'
                            : "Command the Agent..."
                        }
                      />
                    </div>

                    {/* Red Deletion Notice - PER USER REQUEST: Below input text area */}
                    <div className="mt-4 flex flex-col items-center justify-center gap-1.5 opacity-65">
                      <div className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-rose-500 animate-pulse" />
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-rose-500 leading-none">
                          Auto-Cleanup Active
                        </p>
                      </div>
                      <p className="text-center text-[10px] font-bold text-rose-400/90 tracking-tight">
                        Chat history is automatically cleared after 7 days of inactivity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

    </DashboardLayout>
  );
};

export default AIAgent;
