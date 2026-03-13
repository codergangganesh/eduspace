import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    BookOpen,
    Calendar,
    Command as CommandIcon,
    FileText,
    Flame,
    HelpCircle,
    Laptop,
    LayoutDashboard,
    Loader2,
    LogOut,
    MessageSquare,
    Moon,
    Plus,
    Search,
    Settings,
    Bot,
    Sun,
    User,
    ArrowRight,
    Clock,
    Hash,
    Shield,
    Globe,
    Zap,
    History,
    Orbit,
    GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [results, setResults] = useState<{
        assignments: any[];
        quizzes: any[];
        chats: any[];
        coach?: any;
    }>({ assignments: [], quizzes: [], chats: [] });
    const [isSearching, setIsSearching] = useState(false);
    
    const navigate = useNavigate();
    const { setTheme, theme } = useTheme();
    const { signOut, user, role } = useAuth();

    // Find the currently selected entity for the preview panel
    const selectedItem = [...results.assignments, ...results.quizzes, ...results.chats].find(item => item.id === selectedId) || 
                         [
                            { id: 'dashboard', title: 'Dashboard', desc: 'Overview of your academic progress, streaks, and upcoming tasks.', icon: LayoutDashboard },
                            { id: 'profile', title: 'Profile', desc: 'Manage your personal information, academic history, and public appearance.', icon: User },
                            { id: 'settings', title: 'Settings', desc: 'Configure application preferences, theme settings, and account security.', icon: Settings },
                            { id: 'assignments', title: 'Assignments', desc: 'View all your active coursework, submit assignments, and track grades.', icon: FileText },
                            { id: 'quizzes', title: 'Quizzes', desc: 'Take academic quizzes, view results, and track your performance.', icon: BookOpen },
                            { id: 'streak', title: 'Streak', desc: 'Track your daily academic momentum and earn rewards for consistency.', icon: Flame },
                            { id: 'feed', title: 'Class Feed', desc: 'Stay updated with global announcements and class-specific news.', icon: MessageSquare },
                            { id: 'schedule', title: 'Schedule', desc: 'Your personalized academic calendar with classes and lab sessions.', icon: Calendar },
                            { id: 'knowledge-map', title: 'Knowledge Map', desc: 'Visualize your academic connections and learning history in 3D.', icon: Orbit },
                            { id: 'ai-chat', title: 'AI Chat', desc: 'Interact with EduSpace AI for tutoring, brainstorming, and support.', icon: Bot },
                            { id: 'ai-coach', title: 'AI Coach', desc: 'Get personalized academic insights and coaching strategies from your AI mentor.', icon: GraduationCap },
                            { id: 'help', title: 'Help Center', desc: 'Access documentation, tutorials, and contact support for assistance.', icon: HelpCircle },
                            { id: 'logout', title: 'Logout', desc: 'Securely sign out of your EduSpace account.', icon: LogOut },
                            { id: 'light', title: 'Light Theme', desc: 'Switch to a bright, readable interface.', icon: Sun },
                            { id: 'dark', title: 'Dark Theme', desc: 'Switch to a sleek, eye-friendly dark interface.', icon: Moon },
                            { id: 'system', title: 'System Theme', desc: 'Sync interface with your operating system settings.', icon: Laptop },
                         ].find(item => item.id === selectedId);

    const getGlowColor = () => {
        if (!selectedId) return 'rgba(99, 102, 241, 0.5)'; // Default Indigo
        if (results.assignments.some(a => a.id === selectedId)) return 'rgba(59, 130, 246, 0.6)'; // Blue
        if (results.quizzes.some(q => q.id === selectedId)) return 'rgba(168, 85, 247, 0.6)'; // Purple
        if (results.chats.some(c => c.id === selectedId)) return 'rgba(16, 185, 129, 0.6)'; // Emerald
        if (selectedId === 'logout') return 'rgba(239, 68, 68, 0.6)'; // Red
        if (selectedId === 'ai-chat') return 'rgba(99, 102, 241, 0.8)'; // Bot Indigo
        if (selectedId === 'ai-coach') return 'rgba(79, 70, 229, 0.8)'; // Indigo 600
        return 'rgba(99, 102, 241, 0.5)';
    };

    // Search functionality
    useEffect(() => {
        if (!search || search.length < 2) {
            setResults({ assignments: [], quizzes: [], chats: [] });
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                // Parallel search queries
                const [assignmentsSearch, quizzesSearch, chatsSearch] = await Promise.all([
                    supabase
                        .from('assignments')
                        .select('id, title, course_name, status')
                        .ilike('title', `%${search}%`)
                        .limit(5),
                    supabase
                        .from('quizzes')
                        .select('id, title, status')
                        .ilike('title', `%${search}%`)
                        .limit(5),
                    supabase
                        .from('ai_conversations')
                        .select('id, title')
                        .eq('user_id', user?.id)
                        .ilike('title', `%${search}%`)
                        .limit(5)
                ]);

                setResults({
                    assignments: assignmentsSearch.data || [],
                    quizzes: quizzesSearch.data || [],
                    chats: chatsSearch.data || [],
                    coach: "AI Coach".toLowerCase().includes(search.toLowerCase()) ? { id: 'ai-coach', title: 'AI Coach' } : null
                });
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [search, user?.id]);

    // Toggle the menu when pressing Alt+K or receiving custom event
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Main trigger: Alt + K (Safer on Windows than Ctrl+K which can be Search)
            if (e.key === "k" && e.altKey) {
                e.preventDefault();
                setOpen((open) => !open);
            }

            // Global navigation shortcuts (Alt + Key)
            if (e.altKey) {
                const key = e.key.toLowerCase();

                const shortcuts: Record<string, string | (() => void)> = {
                    d: () => navigate(role === 'lecturer' ? '/lecturer-dashboard' : '/dashboard'),
                    p: '/profile',
                    s: '/settings',
                    a: role === 'lecturer' ? '/lecturer/assignments' : '/student/assignments',
                    q: role === 'lecturer' ? '/lecturer/quizzes' : '/student/quizzes',
                    m: '/streak',
                    f: '/class-feed',
                    c: '/schedule',
                    e: '/student/knowledge-map',
                    j: '/ai-chat',
                    h: '/help',
                    i: () => {
                        if (role === 'lecturer') window.dispatchEvent(new CustomEvent("open-invite-dialog"));
                    },
                    x: () => signOut(),
                    '1': () => setTheme('light'),
                    '2': () => setTheme('dark'),
                    '0': () => setTheme('system'),
                };

                const action = shortcuts[key];
                if (action) {
                    e.preventDefault();
                    if (typeof action === 'function') {
                        action();
                    } else {
                        navigate(action);
                    }
                    setOpen(false);
                }
            }
        };

        const handleOpen = () => setOpen(true);

        document.addEventListener("keydown", down);
        window.addEventListener("open-command-palette", handleOpen);
        return () => {
            document.removeEventListener("keydown", down);
            window.removeEventListener("open-command-palette", handleOpen);
        };
    }, [role, navigate, signOut, setTheme]);

    const handleToggleCoach = () => {
        window.dispatchEvent(new CustomEvent("toggle-ai-coach"));
        setOpen(false);
    };

    const runCommand = (command: () => void) => {
        setOpen(false);
        setSearch("");
        command();
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-background/40 backdrop-blur-md transition-all duration-500 pointer-events-none",
                    open ? "opacity-100 scale-100" : "opacity-0 scale-105"
                )}
                aria-hidden="true"
            />

            <Command.Dialog
                open={open}
                onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) {
                        setSearch("");
                        setSelectedId(undefined);
                    }
                }}
                label="Global Command Palette"
                className="fixed left-1/2 top-1/2 z-[101] w-[95vw] md:w-[90vw] max-w-[850px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.3)] transition-all duration-500 ease-in-out"
                onValueChange={setSelectedId}
            >
                {/* Dynamic Glow Background */}
                <div 
                    className="absolute -inset-[100px] pointer-events-none opacity-20 blur-[120px] transition-colors duration-1000 z-[-1]"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}, transparent 70%)` }}
                />

                <div className="flex items-center border-b border-white/10 px-6" cmdk-input-wrapper="">
                    <div className="relative flex items-center justify-center p-2 rounded-xl bg-primary/10 mr-3">
                        {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Search className="h-5 w-5 text-primary" />}
                    </div>
                    <Command.Input
                        value={search}
                        onValueChange={(val) => {
                            setSearch(val);
                            if (val.length === 0) setSelectedId(undefined);
                        }}
                        placeholder="Search for something..."
                        className="flex h-16 md:h-20 w-full rounded-md bg-transparent py-4 text-base md:text-lg font-medium outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-muted-foreground shadow-sm">
                            <span className="text-[12px] opacity-70">ALT</span>
                            <span>K</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-muted-foreground shadow-sm">
                            <span className="text-[12px] opacity-70">ESC</span>
                        </div>
                    </div>
                </div>

                <div className="flex h-full min-h-[400px] md:min-h-[500px]">
                    {/* Left Results List */}
                    <div className="flex-1 border-r border-white/5 md:max-w-[450px] w-full">
                        <Command.List className="max-h-[60vh] md:max-h-[500px] overflow-y-auto overflow-x-hidden p-3 md:p-4 scrollbar-thin scrollbar-thumb-muted">
                            <Command.Empty className="py-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-16 rounded-3xl bg-muted/30 flex items-center justify-center">
                                        <Search className="size-8 text-muted-foreground/40" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base font-bold text-foreground">No records found</p>
                                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Try searching for classes, students, or academic assignments.</p>
                                    </div>
                                </div>
                            </Command.Empty>

                    {/* Search Results Sections */}
                    {results.assignments.length > 0 && (
                        <Command.Group heading="Assignments" className="p-2">
                            {results.assignments.map(a => (
                                <Item key={a.id} value={a.id} onSelect={() => runCommand(() => navigate(role === 'lecturer' ? '/lecturer/assignments' : '/student/assignments'))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-blue-500/10 mr-3">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-bold text-foreground truncate">{a.title}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Assignment</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-aria-selected:opacity-40" />
                                </Item>
                            ))}
                        </Command.Group>
                    )}

                    {results.quizzes.length > 0 && (
                        <Command.Group heading="Quizzes" className="p-2">
                            {results.quizzes.map(q => (
                                <Item key={q.id} value={q.id} onSelect={() => runCommand(() => navigate(role === 'lecturer' ? '/lecturer/quizzes' : '/student/quizzes'))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-purple-500/10 mr-3">
                                        <BookOpen className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-bold text-foreground truncate">{q.title}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Academic Quiz</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-aria-selected:opacity-40" />
                                </Item>
                            ))}
                        </Command.Group>
                    )}

                    {results.chats.length > 0 && (
                        <Command.Group heading="AI Conversations" className="p-2">
                            {results.chats.map(c => (
                                <Item key={c.id} value={c.id} onSelect={() => runCommand(() => navigate(`/ai-chat?id=${c.id}`))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 mr-3">
                                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 truncate">
                                        <span className="font-bold text-foreground truncate">{c.title}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">AI Conversation</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-aria-selected:opacity-40" />
                                </Item>
                            ))}
                        </Command.Group>
                    )}

                    {results.coach && (
                        <Command.Group heading="AI Intelligence" className="p-2">
                             <Item value="ai-coach" onSelect={() => handleToggleCoach()}>
                                <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-500/10 mr-3 transition-colors group-aria-selected:bg-indigo-500/20">
                                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div className="flex flex-col flex-1 truncate">
                                    <span className="font-bold">AI Performance Coach</span>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Personal Mentor</span>
                                </div>
                            </Item>
                        </Command.Group>
                    )}

                    <Command.Group heading="AI Intelligence" className="p-2">
                         <Item value="ai-coach" onSelect={() => handleToggleCoach()}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-500/10 mr-3 transition-colors group-aria-selected:bg-indigo-500/20">
                                <GraduationCap className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                                <span className="font-bold">AI Performance Coach</span>
                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Personal Mentor</span>
                            </div>
                        </Item>
                        <Item value="ai-chat" onSelect={() => runCommand(() => navigate("/ai-chat"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 mr-3 transition-colors group-aria-selected:bg-primary/20">
                                <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <span>EduSpace AI Chat</span>
                            <Shortcut>Alt + J</Shortcut>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="General" className="p-2">
                        <Item value="dashboard" onSelect={() => runCommand(() => navigate(role === 'lecturer' ? '/lecturer-dashboard' : '/dashboard'))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span>Dashboard</span>
                            <Shortcut>Alt + D</Shortcut>
                        </Item>
                        <Item value="profile" onSelect={() => runCommand(() => navigate("/profile"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <User className="h-4 w-4" />
                            </div>
                            <span>Profile</span>
                            <Shortcut>Alt + P</Shortcut>
                        </Item>
                        <Item value="settings" onSelect={() => runCommand(() => navigate("/settings"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <Settings className="h-4 w-4" />
                            </div>
                            <span>Settings</span>
                            <Shortcut>Alt + S</Shortcut>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Quick Access" className="p-2">
                        {role === 'student' && (
                            <>
                                <Item value="assignments" onSelect={() => runCommand(() => navigate("/student/assignments"))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span>Assignments</span>
                                    <Shortcut>Alt + A</Shortcut>
                                </Item>
                                <Item value="quizzes" onSelect={() => runCommand(() => navigate("/student/quizzes"))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <span>My Quizzes</span>
                                    <Shortcut>Alt + Q</Shortcut>
                                </Item>
                                <Item value="streak" onSelect={() => runCommand(() => navigate("/streak"))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                        <Flame className="h-4 w-4" />
                                    </div>
                                    <span>Streak & Momentum</span>
                                    <Shortcut>Alt + M</Shortcut>
                                </Item>
                            </>
                        )}
                        {role === 'lecturer' && (
                            <>
                                <Item value="assignments" onSelect={() => runCommand(() => navigate("/lecturer/assignments"))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span>Class Assignments</span>
                                    <Shortcut>Alt + A</Shortcut>
                                </Item>
                                <Item value="quizzes" onSelect={() => runCommand(() => navigate("/lecturer/quizzes"))}>
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <span>Create/Manage Quizzes</span>
                                    <Shortcut>Alt + Q</Shortcut>
                                </Item>
                            </>
                        )}
                        <Item value="feed" onSelect={() => runCommand(() => navigate("/class-feed"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <span>Class News Feed</span>
                            <Shortcut>Alt + F</Shortcut>
                        </Item>
                        <Item value="schedule" onSelect={() => runCommand(() => navigate("/schedule"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <span>Full Schedule</span>
                            <Shortcut>Alt + C</Shortcut>
                        </Item>
                        {role === 'student' && (
                            <Item value="knowledge-map" onSelect={() => runCommand(() => navigate("/student/knowledge-map"))}>
                                <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <span>Knowledge Map</span>
                                <Shortcut>Alt + E</Shortcut>
                            </Item>
                        )}
                    </Command.Group>

                    <Command.Group heading="Appearance" className="p-2">
                        <Item value="light" onSelect={() => setTheme("light")}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <Sun className="h-4 w-4" />
                            </div>
                            <span>Light Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "light" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 1</Shortcut>
                            </div>
                        </Item>
                        <Item value="dark" onSelect={() => setTheme("dark")}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <Moon className="h-4 w-4" />
                            </div>
                            <span>Dark Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "dark" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 2</Shortcut>
                            </div>
                        </Item>
                        <Item value="system" onSelect={() => setTheme("system")}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <Laptop className="h-4 w-4" />
                            </div>
                            <span>System Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "system" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 0</Shortcut>
                            </div>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Account" className="p-2">
                        <Item value="help" onSelect={() => runCommand(() => navigate("/help"))}>
                            <div className="flex items-center justify-center size-8 rounded-lg bg-muted/20 mr-3">
                                <HelpCircle className="h-4 w-4" />
                            </div>
                            <span>Help Center</span>
                            <Shortcut>Alt + H</Shortcut>
                        </Item>
                        <Item value="logout" onSelect={() => runCommand(() => signOut())} className="text-destructive">
                            <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10 mr-3">
                                <LogOut className="h-4 w-4" />
                            </div>
                            <span className="font-bold">Logout</span>
                            <Shortcut>Alt + X</Shortcut>
                        </Item>
                    </Command.Group>
                </Command.List>
            </div>

            {/* Right Preview Panel */}
            <div className="hidden md:flex flex-col flex-1 bg-black/5 dark:bg-black/20 p-8 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {selectedItem ? (
                        <motion.div
                            key={selectedId}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex flex-col h-full"
                        >
                            {/* Entity Icon / Image Large */}
                            <div className="mb-8">
                                <div className={cn(
                                    "size-20 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden group",
                                    selectedItem.icon ? "bg-white dark:bg-slate-800 border border-white/20" : 
                                    (results.assignments.some(a => a.id === selectedId) ? "bg-blue-600 shadow-blue-500/20" : 
                                     results.quizzes.some(q => q.id === selectedId) ? "bg-purple-600 shadow-purple-500/20" : "bg-primary shadow-primary/20")
                                )}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                    {selectedItem.icon ? (
                                        <selectedItem.icon className="size-10 text-primary group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-3xl font-black text-white italic drop-shadow-md">
                                            {selectedItem.title?.substring(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title & Metadata */}
                            <div className="space-y-4 mb-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black tracking-tight text-foreground">{selectedItem.title}</h2>
                                        {selectedItem.status && (
                                            <div className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-black uppercase text-primary border border-primary/20">
                                                {selectedItem.status}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                        {selectedItem.desc || `Access and manage your ${selectedItem.title?.toLowerCase()} development records.`}
                                    </p>
                                </div>

                                {/* Rich Metadata Bar */}
                                <div className="flex flex-wrap gap-4 pt-4">
                                    {results.assignments.some(a => a.id === selectedId) && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                            <Zap className="size-3 text-blue-500" />
                                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">PRIORITY TASK</span>
                                        </div>
                                    )}
                                    {results.quizzes.some(q => q.id === selectedId) && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                            <Zap className="size-3 text-purple-500" />
                                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">ACADEMIC QUIZ</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/10 border border-white/5">
                                        <History className="size-3 text-muted-foreground" />
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Recently Updated</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Hint */}
                            <div className="mt-auto pt-8 border-t border-white/5">
                                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 rounded-md bg-muted/20 flex items-center justify-center font-bold">↵</div>
                                        <span>Press Enter to Open</span>
                                    </div>
                                    <Bot className="size-4 text-primary opacity-30" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-30">
                            <div className="size-24 rounded-[2.5rem] bg-muted/20 flex items-center justify-center">
                                <History className="size-12" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold">Spotlight Preview</p>
                                <p className="text-xs max-w-[200px]">Highlight an item to see detailed information and specific quick actions.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>

                <div className="flex items-center justify-between border-t border-white/5 bg-black/10 dark:bg-black/40 px-6 py-4 text-xs text-muted-foreground z-10">
                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] shadow-sm tracking-tighter">↵</kbd>
                            <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">To Open</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] shadow-sm tracking-tighter">↑</kbd>
                            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] shadow-sm tracking-tighter">↓</kbd>
                            <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">To Navigate</span>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center md:justify-end gap-2.5">
                        <div className="size-7 rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-lg bg-white/5 p-1">
                            <img src="/favicon.png" alt="EduSpace" className="size-full object-contain filter drop-shadow-sm" />
                        </div>
                        <span className="text-[11px] font-black tracking-[0.2em] uppercase text-muted-foreground/80">EduSpace</span>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}

function Item({ children, onSelect, className, value }: { children: React.ReactNode, onSelect?: () => void, className?: string, value?: string }) {
    return (
        <Command.Item
            onSelect={onSelect}
            value={value}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-xl md:rounded-2xl px-3 py-3 md:py-3.5 text-sm outline-none aria-selected:bg-white/10 dark:aria-selected:bg-white/5 aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-all duration-200 group border border-transparent aria-selected:border-white/10 aria-selected:shadow-xl active:scale-[0.98]",
                className
            )}
        >
            {children}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-full transition-all duration-300 group-aria-selected:h-1/2" />
        </Command.Item>
    );
}

function Shortcut({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="ml-auto hidden md:flex items-center gap-1 text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase group-aria-selected:text-primary/60 transition-colors">
            {children}
        </kbd>
    );
}
