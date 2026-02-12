import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Plus,
    BookOpen,
    GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreateClassModal } from "@/components/lecturer/CreateClassModal";
import { EditClassModal } from "@/components/lecturer/EditClassModal";
import { SectionClassCard } from "@/components/common/SectionClassCard";
import { GridSkeleton } from "@/components/skeletons/GridSkeleton";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreateClass() {
    const navigate = useNavigate();
    const { classes, loading, deleteClass } = useClasses();
    const { toast } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState<any>(null);
    const [classToDelete, setClassToDelete] = useState<any>(null);

    // Calculate stats
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
    const activeClasses = classes.filter(cls => cls.is_active).length;

    const handleViewStudents = (classId: string) => {
        if (!classId) return;
        navigate(`/classes/${classId}/students`);
    };

    const handleEditClass = (classData: any) => {
        setClassToEdit(classData);
        setIsEditModalOpen(true);
    };

    const handleDeleteClass = (classData: any) => {
        setClassToDelete(classData);
    };

    const confirmDelete = async () => {
        if (!classToDelete) return;
        try {
            await deleteClass(classToDelete.id);
            toast({
                title: "Class Deleted",
                description: `${classToDelete.course_code} has been successfully deleted`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete class",
                variant: "destructive",
            });
        } finally {
            setClassToDelete(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Student Management</h1>
                        <p className="text-sm text-muted-foreground">Manage students across your classes</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="hidden sm:flex bg-primary hover:bg-primary/90 gap-2"
                    >
                        <Plus className="size-4" />
                        Create New Class
                    </Button>
                </div>

                {/* Stats Cards - Theme Aware Design */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/10">
                                <BookOpen className="size-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Total Classes
                                </p>
                                <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
                                <p className="text-xs text-emerald-500 mt-0.5">{activeClasses} active</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/10">
                                <Users className="size-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Total Students
                                </p>
                                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Across all classes</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                <GraduationCap className="size-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Avg. Class Size
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">Students per class</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <GridSkeleton count={6} />
                ) : classes.length === 0 ? (
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl">
                        <CardContent className="p-12">
                            <div className="flex flex-col items-center justify-center text-center gap-4">
                                <div className="p-4 bg-slate-800 rounded-full">
                                    <BookOpen className="size-8 text-slate-400" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-lg font-semibold text-white">No classes yet</h3>
                                    <p className="text-sm text-slate-400 max-w-sm">
                                        Get started by creating your first class. You can then add students and manage course materials.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-primary hover:bg-primary/90 gap-2 mt-2"
                                >
                                    <Plus className="size-4" />
                                    Create Your First Class
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((classItem, index) => (
                            <SectionClassCard
                                key={classItem.id}
                                classData={classItem}
                                variant="students"
                                onAction={handleViewStudents}
                                index={index}
                                onEdit={handleEditClass}
                                onDelete={handleDeleteClass}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Class Modal */}
            <CreateClassModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />

            {/* Edit Class Modal */}
            <EditClassModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                classData={classToEdit}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!classToDelete} onOpenChange={() => setClassToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the class
                            <span className="font-semibold text-foreground"> {classToDelete?.course_code} </span>
                            and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Mobile FAB */}
            <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    size="icon"
                    className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                    title="Create New Class"
                >
                    <Plus className="size-8 text-white" />
                </Button>
            </div>
        </DashboardLayout>
    );
}
