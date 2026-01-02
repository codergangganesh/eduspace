import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RoleSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<"student" | "lecturer" | null>(null);

    const handleRoleSelect = (role: "student" | "lecturer") => {
        setSelectedRole(role);
    };

    const handleContinue = () => {
        if (selectedRole === "student") {
            navigate("/student/login");
        } else if (selectedRole === "lecturer") {
            navigate("/lecturer/login");
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal>
            <DialogContent
                className="sm:max-w-[500px] p-0 overflow-hidden"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-3xl font-black text-center">
                            Welcome to EduSpace
                        </DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Please select your role to continue
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Student Card */}
                        <button
                            onClick={() => handleRoleSelect("student")}
                            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${selectedRole === "student"
                                ? "border-primary bg-primary/10 shadow-lg scale-105"
                                : "border-border bg-surface hover:border-primary/50 hover:shadow-md"
                                }`}
                        >
                            <div className="p-6 flex flex-col items-center gap-4">
                                <div
                                    className={`p-4 rounded-full transition-colors ${selectedRole === "student"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                        }`}
                                >
                                    <GraduationCap className="size-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-1">Student</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Access courses, assignments, and grades
                                    </p>
                                </div>
                                {selectedRole === "student" && (
                                    <div className="absolute top-2 right-2">
                                        <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                                            <svg
                                                className="size-4 text-primary-foreground"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>

                        {/* Lecturer Card */}
                        <button
                            onClick={() => handleRoleSelect("lecturer")}
                            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${selectedRole === "lecturer"
                                ? "border-primary bg-primary/10 shadow-lg scale-105"
                                : "border-border bg-surface hover:border-primary/50 hover:shadow-md"
                                }`}
                        >
                            <div className="p-6 flex flex-col items-center gap-4">
                                <div
                                    className={`p-4 rounded-full transition-colors ${selectedRole === "lecturer"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                        }`}
                                >
                                    <Users className="size-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-lg mb-1">Lecturer</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Manage classes, students, and assignments
                                    </p>
                                </div>
                                {selectedRole === "lecturer" && (
                                    <div className="absolute top-2 right-2">
                                        <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                                            <svg
                                                className="size-4 text-primary-foreground"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>

                    <div className="mt-8">
                        <Button
                            onClick={handleContinue}
                            disabled={!selectedRole}
                            className="w-full h-12 text-base font-semibold"
                        >
                            Continue
                        </Button>
                    </div>

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        By continuing, you agree to our{" "}
                        <a href="#" className="underline hover:text-foreground">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="underline hover:text-foreground">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
