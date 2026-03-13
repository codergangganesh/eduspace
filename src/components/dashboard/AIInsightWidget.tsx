import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Bot, Zap, ChevronRight, BookOpen, Target, Calendar, Trophy, ArrowRight, Volume2, Send, MessageCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiChatService, AIChatMessage } from "@/lib/aiChatService";
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
    // Guard: tracks the last data signature that was successfully fetched
    // so we never re-call the AI on a simple tab switch / remount.
    const lastFetchedSignatureRef = useRef<string | null>(null);



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
            const dataSignature = `${data.upcomingAssignmentsCount}-${data.overdueCount}-${data.currentStreak}-${data.nextClass}`;
            const briefingKey = `briefing_${todayStr}`;

            // ✅ If we already fetched this exact signature in this session, do nothing.
            // This prevents re-calling the AI on tab switches or component remounts.
            if (lastFetchedSignatureRef.current === dataSignature) {
                return;
            }
            
            setIsLoading(true);

            try {
                const { data: existingNode } = await supabase
                    .from('knowledge_nodes')
                    .select('label, metadata, updated_at')
                    .eq('user_id', profile.id)
                    .eq('entity_type', 'chat')
                    .eq('label', briefingKey)
                    .maybeSingle();

                if (existingNode && (existingNode.metadata as any)?.signature === dataSignature) {
                    setInsight((existingNode.metadata as any).briefing);
                    setDeepDive((existingNode.metadata as any).deepDive || "");
                    setIsLoading(false);
                    // Mark this signature as already handled so future remounts skip the AI call.
                    lastFetchedSignatureRef.current = dataSignature;
                    return;
                }

                setInsight(""); 
                setDeepDive("");

                const isAchievementUpdate = existingNode && (existingNode.metadata as any)?.signature !== dataSignature;

                // 1. Generate Briefing (Fast)
                const briefingPrompt = `
                    As a professional academic advisor, provide a single, unique briefing sentence.
                    STATS: Tasks: ${data.upcomingAssignmentsCount} upcoming, ${data.overdueCount} overdue. Streak: ${data.currentStreak} days.
                    CONTEXT: ${isAchievementUpdate ? "ACHIEVEMENT Update." : "DAILY MISSION."}
                    Exactly one short sentence (max 100 chars). No names, no emojis.
                `;

                const briefingMessages = [
                    { role: 'system', content: 'You are an elite academic performance coach.' },
                    { role: 'user', content: briefingPrompt }
                ];

                let finalBriefing = "";
                await aiChatService.streamChat(briefingMessages, (token) => {
                    finalBriefing += token;
                    setInsight(finalBriefing);
                });

                // 2. Generate Deep Dive (Slower)
                setIsDeepLoading(true);
                const deepDivePrompt = `
                    As an elite academic performance coach, write a detailed "Coach's Notebook" entry for today.
                    
                    STUDENT DATA:
                    - ${data.upcomingAssignmentsCount} Assignments pending.
                    - ${data.overdueCount} Overdue items (CRITICAL).
                    - ${data.currentStreak} Day study streak.
                    - Next Class: ${data.nextClass || 'No classes today'}.

                    REQUIREMENTS:
                    - Tone: Clinical, motivating, and high-performance.
                    - Structure: Give a "Strategic Focus" (what subject needs attention) and "Action Steps" (3 specific bullets).
                    - Format: Use plain text but separate sections clearly. Max 200 words.
                `;

                const deepDiveMessages = [
                    { role: 'system', content: 'You are an elite academic performance coach.' },
                    { role: 'user', content: deepDivePrompt }
                ];

                let finalDeepDive = "";
                await aiChatService.streamChat(deepDiveMessages, (token) => {
                    finalDeepDive += token;
                    setDeepDive(finalDeepDive);
                });
                
                if (finalBriefing) {
                    const nodeData = {
                        user_id: profile.id,
                        entity_type: 'chat',
                        source_id: '00000000-0000-0000-0000-000000000000',
                        label: briefingKey,
                        metadata: { 
                            briefing: finalBriefing,
                            deepDive: finalDeepDive,
                            signature: dataSignature
                        },
                        keywords: ['daily_briefing', todayStr],
                        updated_at: new Date().toISOString()
                    };

                    if (existingNode) {
                        await supabase
                            .from('knowledge_nodes')
                            .update(nodeData)
                            .eq('user_id', profile.id)
                            .eq('label', briefingKey);
                    } else {
                        await supabase.from('knowledge_nodes').insert(nodeData);
                    }

                    // Mark as fetched so remounts don't re-trigger the AI.
                    lastFetchedSignatureRef.current = dataSignature;
                }
            } catch (error) {
                console.error("Failed to generate AI insight:", error);
                setInsight("Focus on your upcoming deadlines. You've got this!");
            } finally {
                setIsLoading(false);
                setIsDeepLoading(false);
            }
        };

        generateInsight();
    }, [data.upcomingAssignmentsCount, data.overdueCount, data.currentStreak, data.nextClass, profile?.id]);

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(insight);
        
        // Premium Voice Selection
        const voices = window.speechSynthesis.getVoices();
        const premiumVoice = voices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Natural') || 
            v.name.includes('Premium') ||
            (v.name.includes('English') && v.name.includes('Great Britain'))
        );
        
        if (premiumVoice) utterance.voice = premiumVoice;
        utterance.rate = 0.95; // Slightly slower for better clarity
        utterance.pitch = 1.0;
        
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
            const contextPrompt = `
                CONTEXT: You are the student's elite academic coach. 
                TODAY'S BRIEFING: "${insight}"
                DETAILED PLAN: "${deepDive}"
                
                STUDENT QUESTION: "${questionText}"
                
                Answer the student's question based on their data and your coaching plan. Keep it concise, motivational, and strategic. Max 60 words.
            `;

            const messages = [
                { role: 'system', content: 'You are an elite academic performance coach.' },
                ...chatMessages.slice(-4).map(({ role, content }) => ({ role, content })),
                { role: 'user', content: contextPrompt }
            ];

            let aiResponse = "";
            setChatMessages(prev => [...prev, { role: 'assistant' as const, content: "", id: tempAIMessageId }]);

            await aiChatService.streamChat(messages, (token) => {
                aiResponse += token;
                setChatMessages(prev => {
                    const updated = [...prev];
                    // Find the AI placeholder by id, searching from the end
                    for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].id === tempAIMessageId) {
                            updated[i] = { ...updated[i], content: aiResponse };
                            break;
                        }
                    }
                    return updated;
                });
            });


        } catch (error) {
            console.error("AI streaming error:", error);
            // Only remove the placeholder if AI streaming itself failed (not a DB save error)
            setChatMessages(prev => prev.filter(msg => msg.id !== tempAIMessageId));
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className="w-full text-left relative group outline-none cursor-pointer" role="button" tabIndex={0}>
                    {/* Ultra-Slim Integrated AI Banner */}
                    <div className="flex items-center gap-3 py-1.5 px-0.5 sm:px-0 max-w-full hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-xl transition-colors cursor-pointer group/banner">
                        
                        {/* Brand Identity + Status - Constant Logo */}
                        <div className="relative shrink-0">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden p-1.5 transition-transform group-hover/banner:scale-105">
                                <img src="/favicon.png" alt="Eduspace" className="h-full w-full object-contain" />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-indigo-500 border-2 border-white dark:border-slate-900"></span>
                            </span>
                        </div>

                        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>

                        {/* AI Briefing Message */}
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
                                                    "p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors shrink-0",
                                                    isSpeaking ? "text-indigo-600 animate-pulse" : "text-slate-400"
                                                )}
                                            >
                                                <Volume2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover/banner:text-indigo-500 group-hover/banner:translate-x-0.5 transition-all shrink-0" />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg overflow-hidden shrink-0 border border-border dark:border-slate-700 shadow-sm transition-all">
                            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight dark:text-white">Eduspace</span>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mt-1">Coach's Notebook</span>
                        </div>
                    </div>
                </SheetHeader>

                <ScrollArea ref={scrollRef} className="flex-1">
                    <div className="p-6 space-y-8">
                        {/* Global Performance Metric */}
                        <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-100/50 dark:bg-amber-500/20 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500/80">Academic Streak</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{data.currentStreak} Days Active</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full border-2 border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400">
                                {data.currentStreak}
                            </div>
                        </div>

                        {/* AI Coach Content - Clean Minimalist Box */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <Bot className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-sm tracking-tight">Today's Perspective</h3>
                            </div>
                            
                            <div className="relative p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
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

                        {/* Follow-up Chat Experience */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                <MessageCircle className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-sm tracking-tight">Clarification Chat</h3>
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
                                                    <div className="h-full w-full bg-white dark:bg-slate-900 rounded-full p-1 flex items-center justify-center">
                                                        <img 
                                                            src="/favicon.png" 
                                                            alt="Eduspace AI"
                                                            className="h-full w-full object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 max-w-[85%]">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                msg.role === 'user' 
                                                    ? "text-slate-500 dark:text-slate-400" 
                                                    : "text-indigo-500"
                                            )}>
                                                {msg.role === 'user' ? (profile?.full_name || 'You') : 'Eduspace AI'}
                                            </span>
                                            <div className={cn(
                                                "text-xs p-3.5 rounded-2xl shadow-sm",
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

                {/* Chat Input Bar */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <Input 
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
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
