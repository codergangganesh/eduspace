import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassStudent } from "@/hooks/useClassStudents";
import { toast } from "sonner";

interface EditStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: ClassStudent | null;
    onSave: (studentId: string, data: any) => Promise<void>;
}

export function EditStudentModal({
    open,
    onOpenChange,
    student,
    onSave,
}: EditStudentModalProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        student_name: "",
        register_number: "",
        email: "",
        department: "",
        course: "",
        year: "",
        section: "",
        phone: "",
    });

    useEffect(() => {
        if (student) {
            setFormData({
                student_name: student.student_name,
                register_number: student.register_number,
                email: student.email,
                department: student.department || "",
                course: student.course || "",
                year: student.year || "",
                section: student.section || "",
                phone: student.phone || "",
            });
        }
    }, [student, open]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData.student_name || !formData.register_number || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!student) {
            toast.error("No student selected");
            return;
        }

        setSaving(true);
        try {
            await onSave(student.id, formData);
            toast.success("Student updated successfully");
            onOpenChange(false);
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                        Update student information. Changes will be saved immediately.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="student_name">
                                Student Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="student_name"
                                value={formData.student_name}
                                onChange={(e) => handleChange("student_name", e.target.value)}
                                placeholder="Enter student name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="register_number">
                                Register Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="register_number"
                                value={formData.register_number}
                                onChange={(e) => handleChange("register_number", e.target.value)}
                                placeholder="e.g., 2024001"
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="student@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="+1234567890"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={formData.department}
                                onChange={(e) => handleChange("department", e.target.value)}
                                placeholder="e.g., Computer Science"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Input
                                id="course"
                                value={formData.course}
                                onChange={(e) => handleChange("course", e.target.value)}
                                placeholder="e.g., B.Tech CS"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Input
                                id="year"
                                value={formData.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                                placeholder="e.g., 2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <Input
                                id="section"
                                value={formData.section}
                                onChange={(e) => handleChange("section", e.target.value)}
                                placeholder="e.g., A"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Update Student"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
