import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Bot, Trophy, Send, MessageCircle, User, Volume2, X, ChevronRight, GraduationCap, History, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiChatService } from "@/lib/aiChatService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useStreak } from "@/contexts/StreakContext";
import { useNavigate } from "react-router-dom";
import { useLayout } from "@/contexts/LayoutContext";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * AICoachWidget: A global floating AI assistant that provides a daily 
 * briefing and an interactive "Coach's Notebook" for personal academic performance.
 */
export function AICoachWidget() {
    const { profile, user, role } = useAuth();
    const { streak } = useStreak();

    const [insight, setInsight] = useState<string>("");
    const [deepDive, setDeepDive] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDeepLoading, setIsDeepLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { isAICoachOpen: isOpen, setIsAICoachOpen: setIsOpen, isMobileMenuOpen } = useLayout();
    const [activeTab, setActiveTab] = useState<'today' | 'chat'>('today');

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string, id?: string }[]>([]);
    const [allHistory, setAllHistory] = useState<any[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [userQuestion, setUserQuestion] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasLoadedChats, setHasLoadedChats] = useState(false);
    const lastFetchedDateRef = useRef<string | null>(null);

    const loadHistory = async () => {
        if (!user?.id) return;
        try {
            // Cleanup: Delete messages older than 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            await supabase
                .from('coach_notebook_chats')
                .delete()
                .eq('user_id', user.id)
                .lt('created_at', twentyFourHoursAgo);

            const { data, error } = await supabase
                .from('coach_notebook_chats')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) {
                // Group messages by date for the History tab
                const grouped = data.reduce((acc: any, msg: any) => {
                    const dateStr = new Date(msg.created_at).toLocaleDateString('en-CA'); // YYYY-MM-DD
                    if (!acc[dateStr]) acc[dateStr] = [];
                    acc[dateStr].push(msg);
                    return acc;
                }, {});

                // Convert back to sorted array for history display (descending dates)
                const sortedHistory = Object.keys(grouped)
                    .sort((a, b) => b.localeCompare(a))
                    .map(date => ({ date, messages: grouped[date] }));

                setAllHistory(sortedHistory);

                // For the "Today" view, populate the current session
                const todayStr = new Date().toLocaleDateString('en-CA');
                const todayMessages = data.filter((m: any) =>
                    new Date(m.created_at).toLocaleDateString('en-CA') === todayStr
                );

                if (todayMessages.length > 0 && chatMessages.length === 0) {
                    setChatMessages(todayMessages.map((m: any) => ({
                        role: m.role as 'user' | 'assistant',
                        content: m.content
                    })));
                }
            }
        } catch (err) {
            console.error("Coach History load error:", err);
        }
    };

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Only show for students
    if (role !== 'student') return null;

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        }
    }, [chatMessages, isChatLoading]);

    // Handle external toggle (from Command Palette)
    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener("toggle-ai-coach", handleToggle);
        return () => window.removeEventListener("toggle-ai-coach", handleToggle);
    }, []);

    // Refresh history when opened
    useEffect(() => {
        if (isOpen) {
            loadHistory();
            setIsVisible(true); // Always show when open
        }
    }, [isOpen]);

    // Handle Scroll visibility (Hide on scroll down, show on scroll up)
    useEffect(() => {
        const mainContent = document.querySelector('main');
        if (!mainContent) return;

        const handleScroll = () => {
            const currentScrollY = mainContent.scrollTop;
            
            // Show at the very top or if scrolling up
            if (currentScrollY <= 10 || currentScrollY < lastScrollY.current) {
                setIsVisible(true);
            } 
            // Hide if scrolling down past a threshold
            else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setIsVisible(false);
            }
            
            lastScrollY.current = currentScrollY;
        };

        mainContent.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainContent.removeEventListener('scroll', handleScroll);
    }, []);

    // Load or Generate Daily Insights
    useEffect(() => {
        const generateInsight = async () => {
            if (!user?.id) return;
            const todayStr = new Date().toISOString().split('T')[0];
            const globalKey = `global_briefing_${todayStr}`;
            const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

            if (lastFetchedDateRef.current === todayStr && insight) return;
            if ((window as any)._isGlobalBriefingGenerating) return;

            setIsLoading(true);
            try {
                // Check for existing global briefing
                const { data: globalNode } = await supabase
                    .from('knowledge_nodes')
                    .select('metadata')
                    .eq('entity_type', 'chat')
                    .eq('label', globalKey)
                    .maybeSingle();

                if (globalNode && (globalNode.metadata as any)?.briefing) {
                    setInsight((globalNode.metadata as any).briefing);
                    setDeepDive((globalNode.metadata as any).deepDive || "");
                    setIsLoading(false);
                    lastFetchedDateRef.current = todayStr;
                    // Show a mini-preview on first load for desktop
                    if (window.innerWidth > 1024) {
                        setTimeout(() => setShowPreview(true), 1500);
                        setTimeout(() => setShowPreview(false), 8000);
                    }
                    return;
                }

                // Generate new if needed
                (window as any)._isGlobalBriefingGenerating = true;
                setInsight("");
                setDeepDive("");

                const briefingPrompt = "Generate one elite performance slogan (max 80 chars, no names/emojis) for students today.";
                let finalBriefing = "";
                await aiChatService.streamChat([{ role: 'user', content: briefingPrompt }], (token: string) => {
                    finalBriefing += token;
                    setInsight(finalBriefing);
                });

                setIsDeepLoading(true);
                const deepDivePrompt = "Write a platform-wide 'Coach's Notebook' for today. Focus on a high-performance theme (Cognitive Persistence or tactical planning). Format: Perspective (1 para) + Daily Directives (3 bullets). Max 180 words.";
                let finalDeepDive = "";
                await aiChatService.streamChat([{ role: 'user', content: deepDivePrompt }], (token: string) => {
                    finalDeepDive += token;
                    setDeepDive(finalDeepDive);
                });

                if (finalBriefing) {
                    await supabase.from('knowledge_nodes').upsert({
                        user_id: SYSTEM_USER_ID,
                        entity_type: 'chat',
                        source_id: SYSTEM_USER_ID,
                        label: globalKey,
                        metadata: { briefing: finalBriefing, deepDive: finalDeepDive },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,label' });
                    lastFetchedDateRef.current = todayStr;
                }
            } catch (err) {
                console.error("AI Insight error:", err);
                setInsight("Strive for excellence. Progress is a choice.");
            } finally {
                (window as any)._isGlobalBriefingGenerating = false;
                setIsLoading(false);
                setIsDeepLoading(false);
            }
        };
        generateInsight();
        loadHistory();
    }, [user?.id]);



    const handleFollowUp = async () => {
        if (!userQuestion.trim() || isChatLoading) return;
        const q = userQuestion;
        const newUserMsg = { role: 'user' as const, content: q };
        const currentMessages = [...chatMessages];
        setChatMessages(prev => [...prev, newUserMsg]);
        setUserQuestion("");
        setIsChatLoading(true);

        const tempID = crypto.randomUUID();
        try {
            const prompt = `CONTEXT: You are the student coach. Briefing: "${insight}". Perspective: "${deepDive}". Question: "${q}". Answer concisely (max 60 words).`;
            let aiRes = "";
            setChatMessages(prev => [...prev, { role: 'assistant', content: "", id: tempID }]);

            await aiChatService.streamChat([{ role: 'user', content: prompt }], (token: string) => {
                aiRes += token;
                setChatMessages(prev => prev.map(m => m.id === tempID ? { ...m, content: aiRes } : m));
            });

            // Persist to the dedicated coach messages table
            await supabase.from('coach_notebook_chats').insert([
                { user_id: user?.id, role: 'user', content: q },
                { user_id: user?.id, role: 'assistant', content: aiRes }
            ]);

            // Refresh history list
            await loadHistory();

        } catch (err) {
            console.error("AI Chat handleFollowUp error:", err);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
        const u = new SpeechSynthesisUtterance(insight);
        u.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(u);
    };

    return (
        <TooltipProvider>
            <motion.div 
                initial={false}
                animate={{ 
                    opacity: isVisible ? 1 : 0,
                    y: isVisible ? 0 : 20,
                    pointerEvents: isVisible ? 'auto' : 'none'
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2 sm:gap-3 pointer-events-none"
            >
                {/* Floating Preview Slogan */}
                <AnimatePresence>
                    {showPreview && insight && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 10 }}
                            className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 max-w-[280px] sm:max-w-xs relative group overflow-hidden mb-2"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                            <button onClick={() => setShowPreview(false)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                            </button>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Bot className="size-3" />
                                Daily Briefing
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed pr-4">
                                "{insight}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Floating Action Button */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SheetTrigger asChild>
                                <button
                                    className={cn(
                                        "pointer-events-auto group relative flex size-11 sm:size-14 items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-600 text-white shadow-xl transition-all duration-500 hover:scale-110 hover:bg-indigo-700 active:scale-95",
                                        isOpen && "opacity-0 pointer-events-none translate-y-10 scale-50"
                                    )}
                                >
                                    <GraduationCap className="size-5 sm:size-7 transition-all duration-300" />

                                    {!isOpen && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-orange-500 border-2 border-white dark:border-slate-900"></span>
                                        </span>
                                    )}
                                </button>
                            </SheetTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="font-bold hidden sm:block">AI Coach's Notebook</TooltipContent>
                    </Tooltip>

                    <SheetContent
                        side="right"
                        className="w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col"
                    >
                        <SheetHeader className="p-6 pb-2 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                        <GraduationCap className="size-6 text-white" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xl font-bold tracking-tight dark:text-white">Coach's Notebook</span>
                                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest -mt-1">Performance Intelligence</span>
                                    </div>
                                </div>
                            </div>
                        </SheetHeader>

                        <ScrollArea ref={scrollRef} className="flex-1">
                            <AnimatePresence mode="wait">
                                {activeTab === 'today' ? (
                                    <motion.div
                                        key="today-view"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="p-6 space-y-8"
                                    >
                                        {/* Insights Slogan in Drawer */}
                                        <div className="p-5 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 relative overflow-hidden group">
                                            <div className="relative z-10 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold uppercase text-indigo-500 tracking-tighter">Daily Briefing</p>
                                                    <button onClick={handleSpeak} className={cn("p-1.5 rounded-full", isSpeaking ? "bg-indigo-600 text-white animate-pulse" : "text-indigo-400 hover:bg-indigo-100")}>
                                                        <Volume2 className="size-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-base font-bold text-slate-800 dark:text-slate-100 italic leading-snug">
                                                    "{insight || "Your daily vision is being prepared..."}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Active Stats Snapshot */}
                                        <div className="p-5 rounded-[2rem] bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                <Trophy className="size-6 text-amber-600 dark:text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-amber-600/80 dark:text-amber-500/80 tracking-widest">Day Momentum</p>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{(streak as any)?.current_streak || 0} Day Streak</p>
                                            </div>
                                        </div>

                                        {/* Deep Dive Perspective */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                                <Bot className="size-3.5" />
                                                Performance Perspective
                                            </h3>
                                            <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-sm border border-border/40 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line relative">
                                                {isDeepLoading ? (
                                                    <div className="space-y-3"><div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full w-full animate-pulse" /><div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full w-2/3 animate-pulse" /></div>
                                                ) : (
                                                    deepDive || "Coaching logs are being synchronized..."
                                                )}
                                            </div>
                                        </div>

                                        {/* Integrated Chat Section (Per Previous) */}
                                        <div className="space-y-6 pt-8 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                                    <MessageCircle className="size-3.5 text-indigo-500" />
                                                    Clarification Chat
                                                </h3>
                                                
                                                 <button
                                                    onClick={() => {
                                                        setActiveTab('chat');
                                                        loadHistory();
                                                    }}
                                                    className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300"
                                                    title="View Full History"
                                                >
                                                    <History className="size-4" />
                                                </button>
                                            </div>
                                            <ChatMessages messages={chatMessages} profile={profile} />
                                        </div>

                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="chat-view"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="p-6 space-y-8"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                                <History className="size-3.5 text-indigo-500" />
                                                Conversation History
                                            </h3>
                                            
                                            <button
                                               onClick={() => setActiveTab('today')}
                                               className="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300"
                                                title="Back to Active Briefing"
                                            >
                                                <LayoutDashboard className="size-4" />
                                            </button>
                                        </div>

                                        {allHistory.length > 0 ? (
                                            <div className="space-y-10">
                                                {allHistory.map((day) => (
                                                    <div key={day.date} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap bg-white dark:bg-slate-900 px-2">
                                                                {new Date(day.date).toLocaleDateString(undefined, {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                                                        </div>
                                                        <ChatMessages
                                                            messages={day.messages || []}
                                                            profile={profile}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                                <div className="size-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                                                    <History className="size-10 text-slate-300 dark:text-slate-700" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No history yet</p>
                                                    <p className="text-[10px] text-slate-500">Your future daily debriefs will appear here.</p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ScrollArea>

                        <div className="p-4 border-t border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={userQuestion}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserQuestion(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleFollowUp()}
                                    placeholder="Ask the coach..."
                                    className="h-12 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-inner"
                                />
                                <Button size="icon" onClick={() => handleFollowUp()} disabled={!userQuestion.trim() || isChatLoading} className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"><Send className="size-5" /></Button>
                            </div>
                            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-center gap-1.5 italic">
                                <Bot className="size-2.5 opacity-50" />
                                Conversations automatically cleared after 24 hours
                            </p>
                        </div>
                    </SheetContent>
                </Sheet>
            </motion.div>
        </TooltipProvider>
    );
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    id?: string;
}

/**
 * ChatMessages Component to maintain consistent bubble design across tabs
 */
function ChatMessages({ messages, profile }: { messages: ChatMessage[], profile: any }) {
    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="size-16 rounded-[2rem] bg-indigo-50 dark:bg-indigo-500/5 flex items-center justify-center">
                    <MessageCircle className="size-8 text-indigo-200 dark:text-indigo-500/20" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Start a conversation</p>
                    <p className="text-[10px] text-slate-500">Ask for clarifications or tactical advice.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-1">
            {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={i} className={cn("flex flex-col gap-1.5", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn("flex items-center gap-2 mb-0.5", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        {m.role === 'user' ? (
                            <>
                                <Avatar className="size-6 border border-border/50 shadow-sm">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-bold">
                                        {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{profile?.full_name || 'Me'}</span>
                            </>
                        ) : (
                            <>
                                <div className="size-6 rounded-lg overflow-hidden border border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-slate-800 p-0.5 shadow-sm">
                                    <img src="/favicon.png" className="size-full object-cover rounded-[3px]" alt="EduSpace" />
                                </div>
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">EduSpace Coach</span>
                            </>
                        )}
                    </div>
                    <div className={cn(
                        "p-4 rounded-2xl text-xs shadow-sm max-w-[85%] leading-relaxed",
                        m.role === 'user'
                            ? "bg-white dark:bg-slate-800 border rounded-tr-none text-slate-700 dark:text-slate-200"
                            : "bg-indigo-600 text-white rounded-tl-none font-medium"
                    )}>
                        {m.content || <Loader2 className="size-3 animate-spin" />}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
