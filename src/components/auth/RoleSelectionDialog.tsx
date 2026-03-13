import { useNavigate } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

interface RoleSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: "login" | "register";
}

export function RoleSelectionDialog({ open, onOpenChange, mode = "login" }: RoleSelectionDialogProps) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const handleRoleSelection = (role: "student" | "lecturer") => {
        onOpenChange(false);
        const path = mode === "register" ? "register" : "login";
        if (role === "student") {
            navigate(`/student/${path}`);
        } else {
            navigate(`/lecturer/${path}`);
        }
    };

    if (isMobile) {
        return (
            <Drawer.Root open={open} onOpenChange={onOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px]" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[200] flex flex-col bg-slate-50 dark:bg-slate-900 rounded-t-[32px] outline-none max-h-[85vh]">
                        <div className="flex-1 overflow-y-auto px-6 pb-12 rounded-t-[32px]">
                            {/* Drag handle */}
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 cursor-grab rounded-full bg-slate-200 dark:bg-slate-800 mt-4 mb-8" />

                            <div className="mb-0 text-center">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4">Select your role</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1 mb-8">To personalize your experience</p>
                            </div>

                            <div className="grid gap-4">
                                {/* Student Section */}
                                <div
                                    className="group relative p-6 bg-white dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 active:scale-[0.98] transition-all"
                                    onClick={() => handleRoleSelection("student")}
                                >
                                    <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                        <BookOpen className="size-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            I'm a Student
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight">
                                            Join classes and learn
                                        </p>
                                    </div>
                                </div>

                                {/* Lecturer Section */}
                                <div
                                    className="group relative p-6 bg-white dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 active:scale-[0.98] transition-all"
                                    onClick={() => handleRoleSelection("lecturer")}
                                >
                                    <div className="size-16 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                        <Users className="size-8 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            I'm a Lecturer
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-tight">
                                            Manage classes and track
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border-none bg-background/95 backdrop-blur-xl shadow-2xl duration-200">
                <DialogHeader className="sr-only">
                    <DialogTitle>Select Your Role</DialogTitle>
                    <DialogDescription>
                        Choose whether you are a student or a lecturer to access your personalized dashboard.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2">
                    {/* Student Section */}
                    <div
                        className="group relative p-8 md:p-10 flex flex-col justify-between hover:bg-muted/50 transition-colors cursor-pointer border-b md:border-b-0 md:border-r border-border/50"
                        onClick={() => handleRoleSelection("student")}
                    >
                        <div className="space-y-6">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <BookOpen className="size-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    I'm a Student
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Access course materials, submit assignments, and track your academic progress.
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            Continue as Student &rarr;
                        </div>
                    </div>

                    {/* Lecturer Section */}
                    <div
                        className="group relative p-8 md:p-10 flex flex-col justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleRoleSelection("lecturer")}
                    >
                        <div className="space-y-6">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Users className="size-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    I'm a Lecturer
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Manage classes, grade submissions, and monitor student performance.
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            Continue as Lecturer &rarr;
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
