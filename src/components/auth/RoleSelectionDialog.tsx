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
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-2xl bg-primary/10">
                            <GraduationCap className="size-12 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Welcome to EduSpace
                        </h2>
                        <p className="text-muted-foreground">
                            Please choose how you want to continue
                        </p>
                    </div>
                </div>

                {/* Role Selection Buttons */}
                <div className="px-8 pb-8 grid grid-cols-2 gap-4">
                    {/* Student Button */}
                    <Button
                        onClick={() => handleRoleSelection("student")}
                        variant="outline"
                        className="h-auto py-8 px-4 flex flex-col items-center gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary-foreground/20 transition-colors">
                            <BookOpen className="size-8 text-primary group-hover:text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-lg">Student</span>
                    </Button>

                    {/* Lecturer Button */}
                    <Button
                        onClick={() => handleRoleSelection("lecturer")}
                        variant="outline"
                        className="h-auto py-8 px-4 flex flex-col items-center gap-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                    >
                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary-foreground/20 transition-colors">
                            <Users className="size-8 text-primary group-hover:text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-lg">Lecturer</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
