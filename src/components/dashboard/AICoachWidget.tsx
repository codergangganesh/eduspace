import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Bot, Trophy, Send, MessageCircle, User, Volume2, X, ChevronRight, GraduationCap, History, LayoutDashboard, ChevronUp, ChevronDown } from "lucide-react";
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
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(true);
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

    // Watch ScrollArea for Top/Bottom positions (Ultra-Fast Response Sync)
    useEffect(() => {
        // Fast-fail if the drawer isn't even open yet
        if (!isOpen) return;

        let checkInterval: NodeJS.Timeout;
        let observer: MutationObserver;

        const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        
        const checkScroll = () => {
            if (!viewport) return;
            const { scrollTop, scrollHeight, clientHeight } = viewport;
            
            // Higher precision for instant feedback
            const atTop = scrollTop <= 5;
            const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 40;
            
            setIsAtTop(atTop);
            setIsAtBottom(atBottom);
        };

        if (viewport) {
            viewport.addEventListener('scroll', checkScroll, { passive: true });
            
            observer = new MutationObserver(checkScroll);
            observer.observe(viewport, { 
                childList: true, 
                subtree: true, 
                characterData: true
            });

            // Perform manual checks in a rapid loop during initial load (Extreme aggressive sync)
            let checksRun = 0;
            checkInterval = setInterval(() => {
                checkScroll();
                checksRun++;
                if (checksRun > 20) clearInterval(checkInterval); // Stop after 1 second of rapid checks
            }, 50);
            
            checkScroll();
        } else {
            // Viewport might not be in DOM yet, retry once
            const retryTimeout = setTimeout(checkScroll, 50);
            return () => clearTimeout(retryTimeout);
        }
        
        return () => {
            if (viewport) viewport.removeEventListener('scroll', checkScroll);
            if (observer) observer.disconnect();
            if (checkInterval) clearInterval(checkInterval);
        };
    }, [chatMessages, isChatLoading, isOpen, activeTab, deepDive, insight]);

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
            const personalKey = `personal_briefing_${todayStr}`;
            
            // Check for existing personal briefing first
            if (lastFetchedDateRef.current === todayStr && insight) return;
            if ((window as any)._isBriefingGenerating) return;

            setIsLoading(true);
            try {
                // 1. Try to load existing personal briefing
                const { data: existingNode } = await supabase
                    .from('knowledge_nodes')
                    .select('metadata')
                    .eq('user_id', user.id)
                    .eq('entity_type', 'chat')
                    .eq('label', personalKey)
                    .maybeSingle();

                if (existingNode && (existingNode.metadata as any)?.briefing) {
                    setInsight((existingNode.metadata as any).briefing);
                    setDeepDive((existingNode.metadata as any).deepDive || "");
                    setIsLoading(false);
                    lastFetchedDateRef.current = todayStr;
                    return;
                }

                // 2. No personal briefing found, generate one using RAG (Context Retrieval)
                (window as any)._isBriefingGenerating = true;
                setIsDeepLoading(true);

                // --- RETRIEVAL PHASE (RAG) ---
                const { data: notes } = await supabase
                    .from('student_notes')
                    .select('title, content')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                const { data: quizzes } = await supabase
                    .from('quiz_submissions')
                    .select('total_obtained, quizzes(title, total_marks)')
                    .eq('student_id', user.id)
                    .order('submitted_at', { ascending: false })
                    .limit(2);

                const studentName = profile?.full_name || "Student";
                const streakCount = (streak as any)?.current_streak || 0;

                let studentContext = `STUDENT PROFILE: ${studentName}, Current Streak: ${streakCount} days.\n`;
                if (notes && notes.length > 0) {
                    studentContext += `RECENT NOTES: ${notes.map(n => n.title).join(", ")}\n`;
                }
                if (quizzes && quizzes.length > 0) {
                    studentContext += `RECENT QUIZ PERFORMANCE: ${quizzes.map(q => `${(q as any).quizzes?.title}: ${q.total_obtained}/${(q as any).quizzes?.total_marks}`).join(", ")}\n`;
                }

                // --- GENERATION PHASE ---
                const briefingPrompt = `As an elite academic coach, generate a one-line motivational slogan (max 80 chars) for this student. 
                CONTEXT: ${studentContext}
                Theme: High-performance and persistence. No emojis.`;

                let finalBriefing = "";
                await aiChatService.streamChat([{ role: 'user', content: briefingPrompt }], (token: string) => {
                    finalBriefing += token;
                    setInsight(finalBriefing);
                });

                const notebookPrompt = `As an elite academic coach, write a short "Coach's Notebook" entry for today. 
                CONTEXT: ${studentContext}
                Structure: 
                1. A brief "Perspective" (1 paragraph) analyzing their current momentum.
                2. "Daily Directives" (3 specific bullets) based on their recent activity (notes/quizzes).
                Max 150 words. Be direct, tactical, and motivating.`;

                let finalDeepDive = "";
                await aiChatService.streamChat([{ role: 'user', content: notebookPrompt }], (token: string) => {
                    finalDeepDive += token;
                    setDeepDive(finalDeepDive);
                });

                // Save for today
                await supabase.from('knowledge_nodes').upsert({
                    user_id: user.id,
                    entity_type: 'chat',
                    source_id: user.id,
                    label: personalKey,
                    metadata: { briefing: finalBriefing, deepDive: finalDeepDive },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,label' });

                lastFetchedDateRef.current = todayStr;
            } catch (err) {
                console.error("AI Personalized Insight error:", err);
                setInsight("Focus on the process. Excellence is a habit.");
            } finally {
                (window as any)._isBriefingGenerating = false;
                setIsLoading(false);
                setIsDeepLoading(false);
            }
        };
        generateInsight();
        loadHistory();
    }, [user?.id, profile?.full_name, streak]);



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
            // Retrieve additional context for the question if needed
            const { data: recentNotes } = await supabase
                .from('student_notes')
                .select('title, content')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(2);

            const conversationContext = recentNotes?.map(n => `Note "${n.title}": ${n.content}`).join("\n") || "";

            const prompt = `CONTEXT: You are the student coach. 
            Briefing: "${insight}"
            Perspective: "${deepDive}"
            Relevant Notes: ${conversationContext}
            Question: "${q}"
            Answer concisely (max 80 words), referring to their notes if relevant.`;

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

    const scrollToTop = () => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
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
                className={cn(
                    "fixed bottom-6 right-6 flex flex-col items-end gap-2 sm:gap-3 pointer-events-none",
                    isOpen ? "z-40" : "z-[60]"
                )}
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
                                        "pointer-events-auto group relative flex size-12 sm:size-16 aspect-square flex-shrink-0 items-center justify-center rounded-full bg-indigo-600/80 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(79,70,229,0.4)] border border-white/30 transition-all duration-500 hover:scale-110 hover:bg-indigo-600 active:scale-95",
                                        isOpen && "opacity-0 pointer-events-none translate-y-10 scale-50"
                                    )}
                                >
                                    <GraduationCap className="size-6 sm:size-8 transition-all duration-300 group-hover:rotate-12" />

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
                        className="w-full sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col z-[70]"
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

                        {/* Smart Floating Scroll Control */}
                        <div className="absolute right-4 bottom-24 z-10 pointer-events-none">
                            <AnimatePresence mode="wait">
                                {isAtTop && !isAtBottom ? (
                                    <motion.button 
                                        key="scroll-down"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={scrollToBottom}
                                        className="pointer-events-auto size-9 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95"
                                        title="Scroll to Bottom"
                                    >
                                        <ChevronDown className="size-5" />
                                    </motion.button>
                                ) : isAtBottom && !isAtTop ? (
                                    <motion.button 
                                        key="scroll-up"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={scrollToTop}
                                        className="pointer-events-auto size-9 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95"
                                        title="Scroll to Top"
                                    >
                                        <ChevronUp className="size-5" />
                                    </motion.button>
                                ) : !isAtTop && !isAtBottom ? (
                                    <div className="flex flex-col gap-2">
                                        <motion.button 
                                            key="scroll-up-mid"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={scrollToTop}
                                            className="pointer-events-auto size-8 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-border/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
                                            title="Scroll to Top"
                                        >
                                            <ChevronUp className="size-4" />
                                        </motion.button>
                                        <motion.button 
                                            key="scroll-down-mid"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={scrollToBottom}
                                            className="pointer-events-auto size-8 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-border/50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
                                            title="Scroll to Bottom"
                                        >
                                            <ChevronDown className="size-4" />
                                        </motion.button>
                                    </div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <div 
                            className="p-4 border-t border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={userQuestion}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserQuestion(e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleFollowUp();
                                        }
                                    }}
                                    placeholder="Ask the coach..."
                                    className="h-12 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-inner"
                                />
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleFollowUp();
                                    }} 
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    disabled={!userQuestion.trim() || isChatLoading} 
                                    className="size-12 aspect-square flex-shrink-0 rounded-full bg-indigo-600/90 backdrop-blur-md border border-white/30 shadow-lg shadow-indigo-600/20 flex items-center justify-center text-white transition-all hover:bg-indigo-600 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed relative z-[80]"
                                >
                                    <Send className="size-5 pointer-events-none" />
                                </button>
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
