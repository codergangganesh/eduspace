import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useClasses, Class } from "@/hooks/useClasses";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classData: Class | null;
}

export function EditClassModal({ open, onOpenChange, classData }: EditClassModalProps) {
    const { updateClass } = useClasses();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        lecturer_name: "",
        lecturer_department: "",
        course_code: "",
        class_name: "",
        semester: "",
        academic_year: "",
    });

    useEffect(() => {
        if (classData && open) {
            setFormData({
                lecturer_name: classData.lecturer_name || "",
                lecturer_department: classData.lecturer_department || "",
                course_code: classData.course_code || "",
                class_name: classData.class_name || "",
                semester: classData.semester || "",
                academic_year: classData.academic_year || "",
            });
        }
    }, [classData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classData) return;

        // Validation
        if (!formData.course_code.trim()) {
            toast({
                title: "Validation Error",
                description: "Course code is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await updateClass(classData.id, {
                lecturer_name: formData.lecturer_name,
                lecturer_department: formData.lecturer_department,
                course_code: formData.course_code,
                class_name: formData.class_name || undefined,
                semester: formData.semester || undefined,
                academic_year: formData.academic_year || undefined,
            });

            toast({
                title: "Class Updated",
                description: "Class details have been successfully updated",
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error updating class:", error);
            toast({
                title: "Error",
                description: "Failed to update class. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const academicYears = [];
    for (let i = -2; i <= 5; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 4;
        academicYears.push(`${startYear}-${endYear}`);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Class</DialogTitle>
                    <DialogDescription>
                        Update the details for this class
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Read-only fields if needed, but allow editing for now */}
                    <div className="space-y-2">
                        <Label htmlFor="lecturer_name">
                            Lecturer Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lecturer_name"
                            value={formData.lecturer_name}
                            onChange={(e) => setFormData({ ...formData, lecturer_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lecturer_department">
                            Lecturer Department <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lecturer_department"
                            value={formData.lecturer_department}
                            onChange={(e) => setFormData({ ...formData, lecturer_department: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course_code">
                            Course Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="course_code"
                            value={formData.course_code}
                            onChange={(e) =>
                                setFormData({ ...formData, course_code: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class_name">Class Name (Optional)</Label>
                        <Input
                            id="class_name"
                            value={formData.class_name}
                            onChange={(e) =>
                                setFormData({ ...formData, class_name: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select
                            value={formData.semester}
                            onValueChange={(value) =>
                                setFormData({ ...formData, semester: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Semester 1">Semester 1</SelectItem>
                                <SelectItem value="Semester 2">Semester 2</SelectItem>
                                <SelectItem value="Semester 3">Semester 3</SelectItem>
                                <SelectItem value="Semester 4">Semester 4</SelectItem>
                                <SelectItem value="Semester 5">Semester 5</SelectItem>
                                <SelectItem value="Semester 6">Semester 6</SelectItem>
                                <SelectItem value="Semester 7">Semester 7</SelectItem>
                                <SelectItem value="Semester 8">Semester 8</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="academic_year">Academic Year</Label>
                        <Select
                            value={formData.academic_year}
                            onValueChange={(value) =>
                                setFormData({ ...formData, academic_year: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map((year) => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Update Class
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
