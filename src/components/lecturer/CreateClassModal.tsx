import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateClassModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateClassModal({ open, onOpenChange }: CreateClassModalProps) {
    const { createClass } = useClasses();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.lecturer_name.trim()) {
            toast({
                title: "Validation Error",
                description: "Lecturer name is required",
                variant: "destructive",
            });
            return;
        }

        if (!formData.lecturer_department.trim()) {
            toast({
                title: "Validation Error",
                description: "Lecturer department is required",
                variant: "destructive",
            });
            return;
        }

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
            await createClass({
                lecturer_name: formData.lecturer_name,
                lecturer_department: formData.lecturer_department,
                course_code: formData.course_code,
                class_name: formData.class_name || undefined,
                semester: formData.semester || undefined,
                academic_year: formData.academic_year || undefined,
            });

            toast({
                title: "Class Created",
                description: `${formData.course_code} has been successfully created`,
            });

            // Reset form
            setFormData({
                lecturer_name: "",
                lecturer_department: "",
                course_code: "",
                class_name: "",
                semester: "",
                academic_year: "",
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error creating class:", error);
            toast({
                title: "Error",
                description: "Failed to create class. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Generate academic year ranges (4-year spans)
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
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new class
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lecturer Name (Manual Input) */}
                    <div className="space-y-2">
                        <Label htmlFor="lecturer_name">
                            Lecturer Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lecturer_name"
                            placeholder="Enter lecturer name"
                            value={formData.lecturer_name}
                            onChange={(e) =>
                                setFormData({ ...formData, lecturer_name: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Lecturer Department (Manual Input) */}
                    <div className="space-y-2">
                        <Label htmlFor="lecturer_department">
                            Lecturer Department <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lecturer_department"
                            placeholder="Enter department name"
                            value={formData.lecturer_department}
                            onChange={(e) =>
                                setFormData({ ...formData, lecturer_department: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Course Code (Required) */}
                    <div className="space-y-2">
                        <Label htmlFor="course_code">
                            Course Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="course_code"
                            placeholder="e.g., CS101, MATH201"
                            value={formData.course_code}
                            onChange={(e) =>
                                setFormData({ ...formData, course_code: e.target.value })
                            }
                            required
                        />
                    </div>

                    {/* Class Name (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="class_name">Class Name (Optional)</Label>
                        <Input
                            id="class_name"
                            placeholder="e.g., Section A, Morning Batch"
                            value={formData.class_name}
                            onChange={(e) =>
                                setFormData({ ...formData, class_name: e.target.value })
                            }
                        />
                    </div>

                    {/* Semester (1-8) */}
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

                    {/* Academic Year (4-year range) */}
                    <div className="space-y-2">
                        <Label htmlFor="academic_year">Academic Year (4-year range)</Label>
                        <Select
                            value={formData.academic_year}
                            onValueChange={(value) =>
                                setFormData({ ...formData, academic_year: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select academic year range" />
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
                            Create Class
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

