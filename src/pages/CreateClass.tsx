import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Plus,
    BookOpen,
    TrendingUp,
    GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { CreateClassModal } from "@/components/lecturer/CreateClassModal";
import { ClassCard } from "@/components/lecturer/ClassCard";

export default function CreateClass() {
    const { classes, loading } = useClasses();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Calculate stats
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0);
    const activeClasses = classes.filter(cls => cls.is_active).length;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Class Management</h1>
                        <p className="text-sm text-muted-foreground">Create and manage your classes</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 gap-2"
                    >
                        <Plus className="size-4" />
                        Create New Class
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Total Classes</p>
                                    <p className="text-3xl font-bold text-foreground">{totalClasses}</p>
                                    <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                                        <TrendingUp className="size-3" />
                                        <span>{activeClasses} active</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <BookOpen className="size-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                                    <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <Users className="size-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Avg. Class Size</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Students per class</p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-lg">
                                    <GraduationCap className="size-6 text-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="bg-card border-border">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-12 w-12 bg-secondary rounded-full"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-secondary rounded w-3/4"></div>
                                            <div className="h-3 bg-secondary rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="p-12">
                            <div className="flex flex-col items-center justify-center text-center gap-4">
                                <div className="p-4 bg-secondary rounded-full">
                                    <BookOpen className="size-8 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-lg font-semibold text-foreground">No classes yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((classItem) => (
                            <ClassCard key={classItem.id} classData={classItem} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Class Modal */}
            <CreateClassModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </DashboardLayout>
    );
}
