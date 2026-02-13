import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { aiChatService, AIConversation, AIChatMessage } from "@/lib/aiChatService";
import { AIMessage } from "@/components/student/ai-chat/AIMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, ChevronLeft, Share2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function SharedAIChat() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [conversation, setConversation] = useState<AIConversation | null>(null);
    const [messages, setMessages] = useState<AIChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadSharedChat(token);
        }
    }, [token]);

    const loadSharedChat = async (shareToken: string) => {
        setIsLoading(true);
        try {
            const data = await aiChatService.getSharedConversation(shareToken);
            setConversation(data.conversation);
            setMessages(data.messages);
        } catch (err: any) {
            console.error("Failed to load shared chat:", err);
            setError(err.message || "This chat is no longer available or the link is invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading shared conversation...</p>
            </div>
        );
    }

    if (error || !conversation) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-background">
                <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
                    <Share2 className="h-8 w-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Unavailable Chat</h1>
                <p className="text-muted-foreground max-w-md mb-8">{error}</p>
                <Button onClick={() => navigate("/")} variant="outline">
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header */}
            <header className="h-16 shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-30">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="size-8 md:size-9 rounded-xl overflow-hidden border border-border/40 shadow-lg shrink-0">
                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-xs md:text-sm font-bold tracking-tight text-foreground/90 truncate max-w-[200px] md:max-w-none leading-none">
                            {conversation.title}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1 leading-none">
                            <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">Shared View (Read Only)</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                        <MessageCircle className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Conversation</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

                <ScrollArea className="h-full">
                    <div className="max-w-4xl mx-auto w-full px-4 pt-8 pb-32">
                        <div className="space-y-8">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <AIMessage
                                        messageId={msg.id}
                                        role={msg.role}
                                        content={msg.content}
                                        profile={(conversation as any).profiles}
                                        isReadOnly
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 p-8 rounded-3xl border border-dashed border-border/60 bg-muted/5 text-center">
                            <h3 className="text-lg font-bold mb-2">Want to ask your own questions?</h3>
                            <p className="text-sm text-muted-foreground mb-6">Join Eduspace to start your own AI-powered learning journey.</p>
                            <Button onClick={() => navigate("/register")} className="rounded-2xl px-8 shadow-lg shadow-primary/20">
                                Get Started Free
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </main>
        </div>
    );
}
