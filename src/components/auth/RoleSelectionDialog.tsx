import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoleSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode?: "login" | "register";
}

export function RoleSelectionDialog({ open, onOpenChange, mode = "login" }: RoleSelectionDialogProps) {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleRoleSelection = (role: "student" | "lecturer") => {
        onOpenChange(false);
        const path = mode === "register" ? "register" : "login";
        if (role === "student") {
            navigate(`/student/${path}`);
        } else {
            navigate(`/lecturer/${path}`);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                    {/* Backdrop for Desktop Only */}
                    {!isMobile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => onOpenChange(false)}
                            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                        />
                    )}

                    {/* Modal - Opens from center of screen */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "border pointer-events-auto overflow-hidden max-h-[85vh] overflow-y-auto",
                            "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)]",
                            "dark:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                            isMobile
                                ? "fixed inset-4 rounded-[2rem]"
                                : "relative w-full max-w-xl rounded-[2rem] p-0"
                        )}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted-foreground shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                        >
                            <X className="size-5" />
                        </button>

                        {isMobile ? (
                            /* Mobile Layout - Stacked Cards */
                            <>
                                {/* Header */}
                                <div className="p-6 pb-4 text-center pt-12">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Select your role</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">To personalize your experience</p>
                                </div>

                                {/* Role Selection Cards */}
                                <div className="p-6 pt-2 space-y-4">
                                    {/* Student Section */}
                                    <div
                                        className="group relative p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-5 cursor-pointer transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.95),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-[6px_6px_12px_rgba(0,0,0,0.35),-6px_-6px_12px_rgba(255,255,255,0.08),inset_2px_2px_4px_rgba(255,255,255,0.12),inset_-2px_-2px_4px_rgba(0,0,0,0.18)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15)] active:scale-[0.98]"
                                        onClick={() => handleRoleSelection("student")}
                                    >
                                        <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/30 flex items-center justify-center shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
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
                                        className="group relative p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-5 cursor-pointer transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.95),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-[6px_6px_12px_rgba(0,0,0,0.35),-6px_-6px_12px_rgba(255,255,255,0.08),inset_2px_2px_4px_rgba(255,255,255,0.12),inset_-2px_-2px_4px_rgba(0,0,0,0.18)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15)] active:scale-[0.98]"
                                        onClick={() => handleRoleSelection("lecturer")}
                                    >
                                        <div className="size-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/30 flex items-center justify-center shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.8),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
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
                            </>
                        ) : (
                            /* Desktop Layout - Side by Side */
                            <div className="grid md:grid-cols-2">
                                {/* Student Section */}
                                <div
                                    className="group relative p-8 md:p-10 flex flex-col justify-between cursor-pointer border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-700/50 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-slate-50/50 dark:hover:from-blue-900/20 dark:hover:to-slate-800/20 transition-all shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0px_-2px_4px_rgba(0,0,0,0.1)]"
                                    onClick={() => handleRoleSelection("student")}
                                >
                                    <div className="space-y-6">
                                        <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                                            <BookOpen className="size-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                I'm a Student
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
                                    className="group relative p-8 md:p-10 flex flex-col justify-between cursor-pointer hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-slate-50/50 dark:hover:from-purple-900/20 dark:hover:to-slate-800/20 transition-all"
                                    onClick={() => handleRoleSelection("lecturer")}
                                >
                                    <div className="space-y-6">
                                        <div className="size-12 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                                            <Users className="size-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                I'm a Lecturer
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                Manage classes, grade submissions, and monitor student performance.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        Continue as Lecturer &rarr;
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
