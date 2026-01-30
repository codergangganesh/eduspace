import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Calendar,
    FileText,
    MessageSquare,
    Settings,
    User,
    Users,
    Search,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();
    const { role } = useAuth();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    const isLecturer = role === "lecturer";

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="relative inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full sm:w-64"
            >
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="text-muted-foreground">Quick Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                        <CommandItem
                            onSelect={() => runCommand(() => navigate(isLecturer ? "/lecturer-dashboard" : "/dashboard"))}
                        >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/schedule"))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Schedule</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => navigate(isLecturer ? "/lecturer/assignments" : "/student/assignments"))}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            <span>Assignments</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/messages"))}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Messages</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Personal">
                        <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </CommandItem>
                    </CommandGroup>
                    {isLecturer && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Lecturer Tools">
                                <CommandItem onSelect={() => runCommand(() => navigate("/all-students"))}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>All Students</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => navigate("/lecturer/timetable"))}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Time Table</span>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
