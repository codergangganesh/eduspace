import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoleSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
    const navigate = useNavigate();

    const handleRoleSelection = (role: "student" | "lecturer") => {
        onOpenChange(false);
        if (role === "student") {
            navigate("/student/login");
        } else {
            navigate("/lecturer/login");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border-none bg-background/95 backdrop-blur-xl shadow-2xl duration-200">
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
