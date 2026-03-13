import { useState, useEffect, useRef } from "react";
import { Loader2, Bot, ChevronRight, Trophy, Volume2, Send, MessageCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiChatService } from "@/lib/aiChatService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AIInsightWidgetProps {
    data: {
        upcomingAssignmentsCount: number;
        overdueCount: number;
        currentStreak: number;
        nextClass?: string;
        nextClassTime?: string;
    };
}

export function AIInsightWidget({ data }: AIInsightWidgetProps) {
    const [insight, setInsight] = useState<string>("");
    const [deepDive, setDeepDive] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeepLoading, setIsDeepLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Follow-up Chat State
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string, id?: string}[]>([]);
    const [userQuestion, setUserQuestion] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { profile } = useAuth();
    const [hasLoadedChats, setHasLoadedChats] = useState(false);
    // Guard: tracks the date for which we already loaded/generated content this session.
    const lastFetchedDateRef = useRef<string | null>(null);

    // Auto-scroll effect
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [chatMessages, isChatLoading]);

    useEffect(() => {
        const generateInsight = async () => {
            if (!profile?.id) return;

            const todayStr = new Date().toISOString().split('T')[0];
            const globalKey = `global_briefing_${todayStr}`;
            const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

            // Guard 1: Local Session Memory
            if (lastFetchedDateRef.current === todayStr && insight) {
                return;
            }

            // Guard 2: Prevent concurrent generations
            if ((window as any)._isGlobalBriefingGenerating) return;

            setIsLoading(true);

            try {
                // 1. Check for GLOBAL record (All users share this)
                const { data: globalNode } = await supabase
                    .from('knowledge_nodes')
                    .select('label, metadata')
                    .eq('entity_type', 'chat')
                    .eq('label', globalKey)
                    .maybeSingle();

                if (globalNode && (globalNode.metadata as any)?.briefing) {
                    setInsight((globalNode.metadata as any).briefing);
                    setDeepDive((globalNode.metadata as any).deepDive || "");
                    setIsLoading(false);
                    lastFetchedDateRef.current = todayStr;
                    return;
                }

                // 2. Not found -> Generate globally
                (window as any)._isGlobalBriefingGenerating = true;

                setInsight("");
                setDeepDive("");

                const briefingPrompt = "Generate one elite performance slogan (max 80 chars, no names/emojis) for students today. Focus on discipline and excellence.";
                const briefingMessages = [
                    { role: 'system' as const, content: 'You are an elite academic performance coach.' },
                    { role: 'user' as const, content: briefingPrompt }
                ];

                let finalBriefing = "";
                await aiChatService.streamChat(briefingMessages, (token: string) => {
                    finalBriefing += token;
                    setInsight(finalBriefing);
                });

                setIsDeepLoading(true);
                const deepDivePrompt = "Write a detailed 'Coach's Notebook' entry for today. Theme: Strategic high performance. Format: Perspective (1 para) + Daily Directives (3 bullets). Max 180 words.";
                const deepDiveMessages = [
                    { role: 'system' as const, content: 'You are an elite academic performance coach.' },
                    { role: 'user' as const, content: deepDivePrompt }
                ];

                let finalDeepDive = "";
                await aiChatService.streamChat(deepDiveMessages, (token: string) => {
                    finalDeepDive += token;
                    setDeepDive(finalDeepDive);
                });

                if (finalBriefing) {
                    await supabase.from('knowledge_nodes').upsert({
                        user_id: SYSTEM_USER_ID,
                        entity_type: 'chat',
                        source_id: '00000000-0000-0000-0000-000000000000',
                        label: globalKey,
                        metadata: { briefing: finalBriefing, deepDive: finalDeepDive },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,label' });
                    lastFetchedDateRef.current = todayStr;
                }
            } catch (error) {
                console.error("Failed to generate AI insight:", error);
                setInsight("Focus on discipline and excellence. Success is a habit.");
            } finally {
                (window as any)._isGlobalBriefingGenerating = false;
                setIsLoading(false);
                setIsDeepLoading(false);
            }
        };

        generateInsight();
    }, [profile?.id, insight]);

    useEffect(() => {
        const loadChats = async () => {
            if (!profile?.id || hasLoadedChats) return;
            const todayStr = new Date().toISOString().split('T')[0];
            const chatKey = `daily_chat_${todayStr}`;

            try {
                const { data: existingChat } = await supabase
                    .from('knowledge_nodes')
                    .select('metadata')
                    .eq('user_id', profile.id)
                    .eq('entity_type', 'daily_chat_history')
                    .eq('label', chatKey)
                    .maybeSingle();

                if (existingChat && (existingChat.metadata as any)?.messages) {
                    setChatMessages((existingChat.metadata as any).messages);
                }
                setHasLoadedChats(true);
            } catch (err) {
                console.error("Failed to load daily chats:", err);
            }
        };
        loadChats();
    }, [profile?.id, hasLoadedChats]);

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(insight);
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const handleFollowUp = async () => {
        if (!userQuestion.trim() || isChatLoading) return;

        const questionText = userQuestion;
        const newMessage = { role: 'user' as const, content: questionText };
        setChatMessages(prev => [...prev, newMessage]);
        setUserQuestion("");
        setIsChatLoading(true);

        const tempAIMessageId = crypto.randomUUID();

        try {
            const contextPrompt = `CONTEXT: You are the student coach. Briefing: "${insight}". Perspective: "${deepDive}". Question: "${questionText}". Answer concisely (max 60 words).`;
            const messages = [
                { role: 'system' as const, content: 'You are an elite academic performance coach.' },
                ...chatMessages.slice(-4).map(({ role, content }) => ({ role, content })),
                { role: 'user' as const, content: contextPrompt }
            ];

            let aiResponse = "";
            setChatMessages(prev => [...prev, { role: 'assistant' as const, content: "", id: tempAIMessageId }]);

            await aiChatService.streamChat(messages, (token: string) => {
                aiResponse += token;
                setChatMessages(prev => prev.map(m => m.id === tempAIMessageId ? { ...m, content: aiResponse } : m));
            });

            const todayStr = new Date().toISOString().split('T')[0];
            await supabase.from('knowledge_nodes').upsert({
                user_id: profile?.id,
                entity_type: 'daily_chat_history',
                source_id: '00000000-0000-0000-0000-000000000000',
                label: `daily_chat_${todayStr}`,
                metadata: { messages: [...chatMessages, newMessage, { role: 'assistant', content: aiResponse }] },
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,label' });

        } catch (error) {
            console.error("AI streaming error:", error);
            setChatMessages(prev => prev.filter(msg => msg.id !== tempAIMessageId));
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <div className="w-full text-left relative group outline-none">
                <div className="flex items-center gap-3 py-1.5 px-0.5 sm:px-0 max-w-full rounded-xl transition-colors group/banner">
                    <div className="relative shrink-0">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden p-1.5 transition-transform">
                            <img src="/favicon.png" alt="Eduspace" className="h-full w-full object-contain" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-indigo-500 border-2 border-white dark:border-slate-900"></span>
                        </span>
                    </div>

                    <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>

                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={insight}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full flex items-center justify-between gap-2"
                            >
                                {isLoading && !insight ? (
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded-full w-4/5 animate-pulse"></div>
                                ) : (
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <p className="text-[13px] sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-100 leading-snug md:leading-relaxed truncate">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-black mr-2 uppercase text-[10px] tracking-tight shrink-0">AI:</span>
                                            {insight || "Generating your session insights..."}
                                        </p>
                                        
                                        <button 
                                            onClick={handleSpeak}
                                            className={cn(
                                                "p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-all shrink-0",
                                                isSpeaking ? "text-indigo-600 animate-pulse" : "text-slate-400"
                                            )}
                                        >
                                            <Volume2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <SheetTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 pr-2 pl-3 gap-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100/50 dark:border-indigo-500/10 transition-all shrink-0"
                        >
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider hidden sm:inline">Coach Notebook</span>
                            <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                            </div>
                        </Button>
                    </SheetTrigger>
                </div>
            </div>

            <SheetContent className="w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="sr-only">Coach's Notebook</SheetTitle>
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg overflow-hidden shrink-0 border border-border dark:border-slate-700 shadow-sm transition-all">
                            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-bold tracking-tight dark:text-white">Eduspace</span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mt-1">Coach's Notebook</span>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea ref={scrollRef} className="flex-1">
                    <div className="p-6 space-y-8">
                        <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-100/50 dark:bg-amber-500/20 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/80">Academic Streak</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{data.currentStreak} Days Active</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full border-2 border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400">
                                {data.currentStreak}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <Bot className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-sm tracking-tight text-left">Today's Perspective</h3>
                            </div>
                            
                            <div className="relative p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 transition-colors text-left">
                                {isDeepLoading ? (
                                    <div className="space-y-3">
                                        <div className="h-3 bg-slate-100 dark:bg-slate-700/20 rounded-full w-full animate-pulse"></div>
                                        <div className="h-3 bg-slate-100 dark:bg-slate-700/20 rounded-full w-5/6 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium whitespace-pre-line">
                                        {deepDive || "Consolidating your academic trajectory logs..."}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <MessageCircle className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-sm tracking-tight text-left">Clarification Chat</h3>
                            </div>

                            <div className="space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={idx} 
                                        className={cn(
                                            "flex gap-3",
                                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={cn(
                                                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden border",
                                                msg.role === 'user' 
                                                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                                                    : "bg-transparent border-transparent"
                                            )}>
                                                {msg.role === 'user' ? (
                                                    profile?.avatar_url ? (
                                                        <img 
                                                            src={profile.avatar_url} 
                                                            alt={profile.full_name || 'User'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                                    )
                                                ) : (
                                                    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-full p-1 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                                                        <img 
                                                            src="/favicon.png" 
                                                            alt="Eduspace AI"
                                                            className="h-full w-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn("flex flex-col gap-1 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                msg.role === 'user' 
                                                    ? "text-slate-500 dark:text-slate-400" 
                                                    : "text-indigo-500"
                                            )}>
                                                {msg.role === 'user' ? (profile?.full_name || 'You') : 'Eduspace AI'}
                                            </span>
                                            <div className={cn(
                                                "text-xs p-3.5 rounded-2xl shadow-sm text-left",
                                                msg.role === 'user' 
                                                    ? "bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200" 
                                                    : "bg-indigo-600 text-white"
                                            )}>
                                                {msg.content || <Loader2 className="h-3 w-3 animate-spin" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Input 
                            value={userQuestion}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserQuestion(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleFollowUp()}
                            placeholder="Ask the coach for details..."
                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-indigo-500 transition-all text-xs"
                        />
                        <Button 
                            size="icon"
                            onClick={handleFollowUp}
                            disabled={!userQuestion.trim() || isChatLoading}
                            className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
