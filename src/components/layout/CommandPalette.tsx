import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    Laptop,
    Moon,
    Sun,
    Search,
    User,
    Settings,
    LayoutDashboard,
    BookOpen,
    FileText,
    MessageSquare,
    Calendar,
    Flame,
    Command as CommandIcon,
    LogOut,
    HelpCircle,
    Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { setTheme, theme } = useTheme();
    const { signOut, user, role } = useAuth();

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

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-[100] bg-background/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-none",
                    open ? "opacity-100" : "opacity-0"
                )}
                aria-hidden="true"
            />

            <Command.Dialog
                open={open}
                onOpenChange={setOpen}
                label="Global Command Palette"
                className="fixed left-1/2 top-1/2 z-[101] w-[90vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl transition-all duration-300 ease-in-out"
            >
                <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <div className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">ESC</span>
                    </div>
                </div>

                <Command.List className="max-h-[450px] overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-muted">
                    <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>

                    <Command.Group heading="General" className="overflow-hidden p-1 text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
                        <Item onSelect={() => runCommand(() => navigate(role === 'lecturer' ? '/lecturer-dashboard' : '/dashboard'))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                            <Shortcut>Alt + D</Shortcut>
                        </Item>
                        <Item onSelect={() => runCommand(() => navigate("/profile"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                            <Shortcut>Alt + P</Shortcut>
                        </Item>
                        <Item onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                            <Shortcut>Alt + S</Shortcut>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Quick Access" className="overflow-hidden p-1 text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
                        {role === 'student' && (
                            <>
                                <Item onSelect={() => runCommand(() => navigate("/student/assignments"))}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Assignments</span>
                                    <Shortcut>Alt + A</Shortcut>
                                </Item>
                                <Item onSelect={() => runCommand(() => navigate("/student/quizzes"))}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    <span>My Quizzes</span>
                                    <Shortcut>Alt + Q</Shortcut>
                                </Item>
                                <Item onSelect={() => runCommand(() => navigate("/streak"))}>
                                    <Flame className="mr-2 h-4 w-4" />
                                    <span>Streak & Momentum</span>
                                    <Shortcut>Alt + M</Shortcut>
                                </Item>
                            </>
                        )}
                        {role === 'lecturer' && (
                            <>
                                <Item onSelect={() => runCommand(() => navigate("/lecturer/assignments"))}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Class Assignments</span>
                                    <Shortcut>Alt + A</Shortcut>
                                </Item>
                                <Item onSelect={() => runCommand(() => navigate("/lecturer/quizzes"))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    <span>Create/Manage Quizzes</span>
                                    <Shortcut>Alt + Q</Shortcut>
                                </Item>
                            </>
                        )}
                        <Item onSelect={() => runCommand(() => navigate("/class-feed"))}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Class News Feed</span>
                            <Shortcut>Alt + F</Shortcut>
                        </Item>
                        <Item onSelect={() => runCommand(() => navigate("/schedule"))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Full Schedule</span>
                            <Shortcut>Alt + C</Shortcut>
                        </Item>
                        {role === 'student' && (
                            <Item onSelect={() => runCommand(() => navigate("/student/knowledge-map"))}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                <span>Academic Knowledge Map</span>
                                <Shortcut>Alt + E</Shortcut>
                            </Item>
                        )}
                        {role === 'lecturer' && (
                            <Item onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent("open-invite-dialog")))}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Invite New Student</span>
                                <Shortcut>Alt + I</Shortcut>
                            </Item>
                        )}
                        <Item onSelect={() => runCommand(() => navigate("/ai-chat"))}>
                            <CommandIcon className="mr-2 h-4 w-4 text-primary" />
                            <span>EduSpace AI Chat</span>
                            <Shortcut>Alt + J</Shortcut>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Appearance" className="overflow-hidden p-1 text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
                        <Item onSelect={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Light Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "light" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 1</Shortcut>
                            </div>
                        </Item>
                        <Item onSelect={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Dark Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "dark" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 2</Shortcut>
                            </div>
                        </Item>
                        <Item onSelect={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            <span>System Theme</span>
                            <div className="flex items-center gap-2 ml-auto">
                                {theme === "system" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                <Shortcut>Alt + 0</Shortcut>
                            </div>
                        </Item>
                    </Command.Group>

                    <Command.Group heading="Account" className="overflow-hidden p-1 text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium">
                        <Item onSelect={() => runCommand(() => navigate("/help"))}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            <span>Help Center</span>
                            <Shortcut>Alt + H</Shortcut>
                        </Item>
                        <Item onSelect={() => runCommand(() => signOut())} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Logout</span>
                            <Shortcut>Alt + X</Shortcut>
                        </Item>
                    </Command.Group>
                </Command.List>

                <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">↵</kbd>
                            <span>to select</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">↑↓</kbd>
                            <span>to navigate</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>Search in EduSpace</span>
                    </div>
                </div>
            </Command.Dialog>
        </>
    );
}

function Item({ children, onSelect, className }: { children: React.ReactNode, onSelect?: () => void, className?: string }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 transition-colors",
                className
            )}
        >
            {children}
        </Command.Item>
    );
}

function Shortcut({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="ml-auto text-xs tracking-widest text-muted-foreground opacity-60">
            {children}
        </kbd>
    );
}
