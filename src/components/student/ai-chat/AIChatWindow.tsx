import { useState, useEffect, useRef } from "react";
import { AIChatSidebar } from "./AIChatSidebar";
import { AIChatInput } from "./AIChatInput";
import { AIMessage } from "./AIMessage";
import { aiChatService, AIConversation, AIChatMessage, MessageContent } from "@/lib/aiChatService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, MessageSquare, Sparkles, ChevronRight, User, Menu, Bot, MessageCircleDashed, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AIChatWindow() {
    const [conversations, setConversations] = useState<AIConversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState("");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTemporaryMode, setIsTemporaryMode] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
        loadUserProfile();
    }, []);

    useEffect(() => {
        if (currentConversation) {
            loadMessages(currentConversation.id);
        } else {
            setMessages([]);
        }
    }, [currentConversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingMessage]);

    const scrollToBottom = () => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({
                behavior: isStreaming ? 'auto' : 'smooth',
                block: 'end'
            });
        }
    };

    const loadUserProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', user.id)
                    .single();

                if (data) setUserProfile(data);
            }
        } catch (err) {
            console.warn("Failed to load profile:", err);
        }
    };

    const loadConversations = async () => {
        setIsInitialLoading(true);
        try {
            const data = await aiChatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error("Failed to load conversations:", error);
        } finally {
            setIsInitialLoading(false);
        }
    };

    const loadMessages = async (id: string) => {
        setIsLoading(true);
        try {
            const data = await aiChatService.getMessages(id);
            setMessages(data);
        } catch (error) {
            console.error("Failed to load messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setCurrentConversation(null);
        setMessages([]);
        setIsTemporaryMode(false);
    };

    const handleDeleteConversation = async (id: string) => {
        try {
            await aiChatService.deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (currentConversation?.id === id) {
                handleNewChat();
            }
            toast.success("Conversation deleted");
        } catch (error) {
            toast.error("Failed to delete conversation");
        }
    };

    const handleUpdateTitle = (id: string, newTitle: string) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
        if (currentConversation?.id === id) {
            setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
        }
    };

    const handleTogglePin = async (id: string) => {
        try {
            const newPinnedStatus = await aiChatService.togglePin(id);
            setConversations(prev => {
                const updated = prev.map(c => c.id === id ? { ...c, is_pinned: newPinnedStatus } : c);
                return [...updated].sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                });
            });
        } catch (error) {
            toast.error("Failed to pin conversation");
        }
    };

    const handleToggleShare = async (id: string) => {
        try {
            const shareToken = await aiChatService.toggleShare(id);
            setConversations(prev => prev.map(c => c.id === id ? { ...c, share_token: shareToken || undefined } : c));

            if (shareToken) {
                const shareUrl = `${window.location.origin}/ai-chat/share/${shareToken}`;
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Share link copied to clipboard!");
            } else {
                toast.success("Sharing disabled");
            }
        } catch (error) {
            toast.error("Failed to update sharing settings");
        }
    };

    const handleToggleTemporaryMode = () => {
        const nextMode = !isTemporaryMode;
        setIsTemporaryMode(nextMode);

        // Always start fresh when toggling mode to ensure privacy/new session
        setCurrentConversation(null);
        setMessages([]);
    };

    const handleUpdateMessage = async (id: string, newContent: string) => {
        try {
            await aiChatService.updateMessage(id, newContent);

            // Find the index of the edited message
            const messageIndex = messages.findIndex(m => m.id === id);
            if (messageIndex === -1) return;

            // Keep only messages up to the edited one
            const updatedMessages = messages.slice(0, messageIndex + 1).map(m =>
                m.id === id ? { ...m, content: newContent } : m
            );

            setMessages(updatedMessages);

            // If it's a user message, trigger regeneration
            if (updatedMessages[updatedMessages.length - 1].role === 'user') {
                await regenerateAIResponse(updatedMessages);
            }
        } catch (error) {
            console.error("Failed to update message:", error);
            toast.error("Failed to update message");
        }
    };

    const regenerateAIResponse = async (historyMessages: AIChatMessage[]) => {
        if (!currentConversation) return;

        try {
            setIsLoading(true);
            setIsStreaming(true);
            setStreamingMessage("");

            const history = [
                { role: 'system', content: 'You are EduSpace Assistant, a helpful and professional academic assistant. You help students with their studies, assignments, and questions about the platform. Provide clear, accurate, and supportive answers.' },
                ...historyMessages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ];

            const fullAIContent = await aiChatService.streamChat(history, (token) => {
                setStreamingMessage(prev => prev + token);
            });

            const assistantMsg = await aiChatService.saveMessage(currentConversation.id, 'assistant', fullAIContent);
            setMessages(prev => [...prev, assistantMsg]);
            setStreamingMessage("");
        } catch (error: any) {
            toast.error(error.message || "Regeneration failed");
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    const handleSendMessage = async (content: string, imageUrl?: string) => {
        let conversationId = currentConversation?.id;

        try {
            setIsLoading(true);

            // Construct content for user message
            const messageContent: string | MessageContent[] = imageUrl ? [
                { type: 'text', text: content || "What is in this image?" },
                { type: 'image_url', image_url: { url: imageUrl } }
            ] : content;

            if (isTemporaryMode) {
                // Temporary Mode: Skip DB logic
                const userMsg: AIChatMessage = {
                    id: crypto.randomUUID(),
                    conversation_id: 'temporary',
                    role: 'user',
                    content: messageContent,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, userMsg]);

                setIsStreaming(true);
                setStreamingMessage("");

                const history = [
                    { role: 'system', content: 'You are EduSpace Assistant in Temporary Mode. Nothing you say here will be saved or stored in history. Help the user with their quick task.' },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                    { role: 'user', content: messageContent }
                ];

                const fullAIContent = await aiChatService.streamChat(history, (token) => {
                    setStreamingMessage(prev => prev + token);
                });

                const assistantMsg: AIChatMessage = {
                    id: crypto.randomUUID(),
                    conversation_id: 'temporary',
                    role: 'assistant',
                    content: fullAIContent,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMsg]);
                setStreamingMessage("");
                return;
            }

            // Normal Mode: standard saving logic
            // 1. Create conversation if not exists
            if (!conversationId) {
                const newConv = await aiChatService.createConversation(content.substring(0, 40) || (imageUrl ? "Image Analysis" : "New Chat"));
                conversationId = newConv.id;
                setCurrentConversation(newConv);
                setConversations(prev => [newConv, ...prev]);
            }

            // 2. Save user message
            const userMsg = await aiChatService.saveMessage(conversationId, 'user', messageContent);
            setMessages(prev => {
                if (prev.some(m => m.id === userMsg.id)) return prev;
                return [...prev, userMsg];
            });

            // 3. Start streaming
            setIsStreaming(true);
            setStreamingMessage("");

            const history = [
                { role: 'system', content: 'You are EduSpace Assistant, a helpful and professional academic assistant. You help students with their studies, assignments, and questions about the platform. Provide clear, accurate, and supportive answers.' },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: messageContent }
            ];

            const fullAIContent = await aiChatService.streamChat(history, (token) => {
                setStreamingMessage(prev => prev + token);
            });

            // 4. Save assistant message
            const assistantMsg = await aiChatService.saveMessage(conversationId, 'assistant', fullAIContent);
            setMessages(prev => {
                if (prev.some(m => m.id === assistantMsg.id)) return prev;
                return [...prev, assistantMsg];
            });
            setStreamingMessage("");
            loadConversations();

        } catch (error: any) {
            console.error("Chat error:", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Initializing chat...</span>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background relative">
            {/* Mobile Sidebar Overlay - Local to this container */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute inset-y-0 left-0 w-72 bg-card z-50 md:hidden border-r border-border/40 shadow-2xl"
                        >
                            <AIChatSidebar
                                conversations={conversations}
                                currentConversationId={currentConversation?.id}
                                onSelectConversation={(id) => {
                                    setCurrentConversation(conversations.find(c => c.id === id) || null);
                                    setIsMobileMenuOpen(false);
                                }}
                                onNewChat={() => {
                                    handleNewChat();
                                    setIsMobileMenuOpen(false);
                                }}
                                onDeleteConversation={handleDeleteConversation}
                                onUpdateTitle={handleUpdateTitle}
                                onTogglePin={handleTogglePin}
                                onToggleShare={handleToggleShare}
                                onClose={() => setIsMobileMenuOpen(false)}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop */}
            <div className="hidden md:block w-72 shrink-0 h-full border-r border-border/40 bg-card/10">
                <AIChatSidebar
                    conversations={conversations}
                    currentConversationId={currentConversation?.id}
                    onSelectConversation={(id) => setCurrentConversation(conversations.find(c => c.id === id) || null)}
                    onNewChat={handleNewChat}
                    onDeleteConversation={handleDeleteConversation}
                    onUpdateTitle={handleUpdateTitle}
                    onTogglePin={handleTogglePin}
                    onToggleShare={handleToggleShare}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Chat Header */}
                <div className="h-16 shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-30">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="size-9 rounded-xl overflow-hidden border border-border/60 shadow-lg shrink-0">
                            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-xs md:text-sm font-bold tracking-tight text-foreground/90 truncate max-w-[150px] md:max-w-none leading-none">
                                {isTemporaryMode ? "Temporary Chat" : (currentConversation?.title || "AI Tutor Assistant")}
                            </h2>
                            {isTemporaryMode && (
                                <div className="flex items-center gap-1.5 mt-1 leading-none">
                                    <MessageCircleDashed className="h-2.5 w-2.5 text-amber-500 animate-pulse" />
                                    <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">Off Record</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleTemporaryMode}
                            className={cn(
                                "h-9 w-9 rounded-xl border transition-all",
                                isTemporaryMode
                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50 border-transparent"
                            )}
                            title={isTemporaryMode ? "Temporary Chat On" : "Start Temporary Chat"}
                        >
                            {isTemporaryMode ? (
                                <MessageCircleDashed className="h-4 w-4 animate-pulse" />
                            ) : (
                                <MessageCircle className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1" viewportRef={scrollAreaRef as any}>
                    <div className="max-w-4xl mx-auto w-full">
                        {messages.length === 0 && !isStreaming ? (
                            <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-12">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative"
                                >
                                    <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-2xl animate-pulse" />
                                    <div className="relative h-24 w-24 rounded-3xl overflow-hidden border border-border shadow-2xl">
                                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                                    </div>
                                </motion.div>

                                <div className="space-y-6 max-w-xl">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                                        Your Personalized <br /> <span className="text-primary">Learning Partner</span>
                                    </h1>
                                </div>

                                <div className="w-full max-w-2xl px-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                        {[
                                            { label: "Summarize notes", icon: "📝", desc: "Get key takeaways" },
                                            { label: "Explain concepts", icon: "⚛️", desc: "Simplify complex topics" },
                                            { label: "Brainstorm ideas", icon: "💡", desc: "Get creative help" },
                                        ].map((item, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 + i * 0.1 }}
                                                onClick={() => handleSendMessage(item.label)}
                                                className="group flex md:flex-col items-center md:items-start gap-4 p-4 rounded-2xl border border-border/40 bg-card/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-left shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl group-hover:scale-110 transition-transform">
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">
                                                        {item.label}
                                                    </p>
                                                    <p className="hidden md:block text-[11px] font-medium text-muted-foreground mt-1">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 md:hidden" />
                                            </motion.button>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="pb-48 px-4 pt-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <AIMessage
                                                messageId={msg.id}
                                                role={msg.role}
                                                content={msg.content}
                                                profile={userProfile || undefined}
                                                onUpdateMessage={handleUpdateMessage}
                                            />
                                        </motion.div>
                                    ))}
                                    {isStreaming && (
                                        <motion.div
                                            key="streaming-message"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <AIMessage role="assistant" content={streamingMessage} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isLoading && !isStreaming && (
                                    <div className="p-8 flex justify-center">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full border border-border/40 animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI is processing...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={lastMessageRef} className="h-4" />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="absolute inset-x-0 bottom-0 pointer-events-none">
                    <div className="h-32 bg-gradient-to-t from-background via-background/90 to-transparent" />
                    <div className="bg-background pb-4 md:pb-6 pt-2 px-4 md:px-6 pointer-events-auto">
                        <div className="max-w-4xl mx-auto">
                            <AIChatInput onSendMessage={handleSendMessage} isLoading={isLoading || isStreaming} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
