import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/useClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    Users,
    Search,
    CheckCircle,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { SectionClassCard } from '@/components/common/SectionClassCard';
import { Badge } from '@/components/ui/badge';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LecturerClassesQuizzes() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { classes, loading } = useClasses();
    const [searchQuery, setSearchQuery] = useState('');
    const [isClassSelectOpen, setIsClassSelectOpen] = useState(false);

    const isAICreateMode = searchParams.get('mode') === 'create-ai';

    const filteredClasses = classes.filter(
        (classItem) =>
            classItem.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.lecturer_department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewQuizzes = (classId: string) => {
        if (isAICreateMode) {
            navigate(`/lecturer/quizzes/${classId}/create-ai`);
        } else {
            navigate(`/lecturer/quizzes/${classId}`);
        }
    };

    const handleFabClick = () => {
        if (classes.length === 0) {
            navigate('/all-students'); // Redirect to Student Management (Create Class) page
        } else if (classes.length === 1) {
            // If only one class, go directly to create quiz for that class
            navigate(`/lecturer/quizzes/${classes[0].id}/create`);
        } else {
            setIsClassSelectOpen(true);
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            {isAICreateMode ? (
                                <>
                                    <Sparkles className="size-8 text-blue-500 fill-blue-500/20" />
                                    Generate AI Quiz
                                </>
                            ) : (
                                "Quiz Management"
                            )}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            {isAICreateMode
                                ? "Select a class to generate a new quiz using AI."
                                : "Select a class below to create, manage, and analyze student assessments."}
                        </p>
                    </div>

                    {/* Search Bar - Wider on Desktop */}
                    <div className="relative w-full lg:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search class or course code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 text-lg rounded-xl"
                        />
                    </div>
                </div>

                {/* Stats Overview - Premium Look */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-6 flex items-center gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <BookOpen className="size-20 text-white" />
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm">
                                <BookOpen className="size-7 text-white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm text-blue-100/80 font-semibold uppercase tracking-wider">
                                    Total Classes
                                </p>
                                <p className="text-3xl font-black text-white">{classes.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-6 flex items-center gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="size-20 text-white" />
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm">
                                <CheckCircle className="size-7 text-white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-sm text-emerald-100/80 font-semibold uppercase tracking-wider">
                                    Active Quizzes
                                </p>
                                <p className="text-3xl font-black text-white">Live View</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Placeholder for more stats if needed */}
                </div>

                {/* Classes Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Your Academic Classes</h2>
                        <Badge variant="outline" className="px-4 py-1.5 rounded-full text-base font-medium">
                            {filteredClasses.length} Results
                        </Badge>
                    </div>

                    {loading ? (
                        <GridSkeleton count={4} />
                    ) : filteredClasses.length === 0 ? (
                        <Card className="bg-muted/30 border-dashed border-2 rounded-3xl">
                            <CardContent className="p-20 text-center">
                                <Search className="size-16 text-muted-foreground/30 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold mb-3">
                                    {searchQuery ? 'No matching classes found' : 'No classes assigned yet'}
                                </h3>
                                <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                                    {searchQuery ? 'Try adjusting your search terms or course code.' : 'Resources and quizzes will appear here once you are assigned to a class.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-3 gap-6">
                            {filteredClasses.map((classItem) => (
                                <SectionClassCard
                                    key={classItem.id}
                                    classData={classItem}
                                    variant="quizzes"
                                    onAction={handleViewQuizzes}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile FAB */}
                <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <Button
                        onClick={handleFabClick}
                        size="icon"
                        className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                        title="Create Quiz"
                    >
                        <Plus className="size-8 text-white" />
                    </Button>
                </div>

                {/* Select Class Dialog for FAB */}
                <Dialog open={isClassSelectOpen} onOpenChange={setIsClassSelectOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Select Class</DialogTitle>
                            <DialogDescription>
                                Choose a class to create a quiz for.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {classes.map((cls) => (
                                <Button
                                    key={cls.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3 px-4"
                                    onClick={() => navigate(`/lecturer/quizzes/${cls.id}/create`)}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-medium">{cls.course_code}</span>
                                        <span className="text-xs text-muted-foreground">{cls.class_name || "General"}</span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
