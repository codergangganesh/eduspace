import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

interface AddStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classId: string;
    onStudentAdded: (studentData: any) => Promise<void>;
}

export function AddStudentModal({
    open,
    onOpenChange,
    classId,
    onStudentAdded,
}: AddStudentModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        studentName: "",
        email: "",
        registerNumber: "",
        department: "",
        year: "",
        section: "",
        phone: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.studentName.trim()) {
            toast({
                title: "Validation Error",
                description: "Student name is required",
                variant: "destructive",
            });
            return;
        }

        if (!formData.email.trim()) {
            toast({
                title: "Validation Error",
                description: "Email is required",
                variant: "destructive",
            });
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        if (!formData.registerNumber.trim()) {
            toast({
                title: "Validation Error",
                description: "Register number is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await onStudentAdded(formData);

            // Reset form
            setFormData({
                studentName: "",
                email: "",
                registerNumber: "",
                department: "",
                year: "",
                section: "",
                phone: "",
            });

            onOpenChange(false);
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            studentName: "",
            email: "",
            registerNumber: "",
            department: "",
            year: "",
            section: "",
            phone: "",
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="size-5" />
                        Add Student Manually
                    </DialogTitle>
                    <DialogDescription>
                        Enter student details to add them to this class. A join request will be sent automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Student Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="studentName">
                                Student Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="studentName"
                                placeholder="Enter student's full name"
                                value={formData.studentName}
                                onChange={(e) =>
                                    setFormData({ ...formData, studentName: e.target.value })
                                }
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="student@example.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value.toLowerCase() })
                                }
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Register Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="registerNumber">
                                Register Number <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="registerNumber"
                                placeholder="Enter register number"
                                value={formData.registerNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, registerNumber: e.target.value })
                                }
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Department */}
                        <div className="grid gap-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                placeholder="e.g., Computer Science"
                                value={formData.department}
                                onChange={(e) =>
                                    setFormData({ ...formData, department: e.target.value })
                                }
                                disabled={loading}
                            />
                        </div>

                        {/* Year and Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    placeholder="e.g., 2nd Year"
                                    value={formData.year}
                                    onChange={(e) =>
                                        setFormData({ ...formData, year: e.target.value })
                                    }
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="section">Section</Label>
                                <Input
                                    id="section"
                                    placeholder="e.g., A"
                                    value={formData.section}
                                    onChange={(e) =>
                                        setFormData({ ...formData, section: e.target.value })
                                    }
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding Student...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Student
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
