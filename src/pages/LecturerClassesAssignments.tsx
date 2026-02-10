import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/useClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    Users,
    Search,
    CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { SectionClassCard } from '@/components/common/SectionClassCard';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';

export default function LecturerClassesAssignments() {
    const navigate = useNavigate();
    const { classes, loading } = useClasses();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClasses = classes.filter(
        (classItem) =>
            classItem.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.lecturer_department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewAssignments = (classId: string) => {
        navigate(`/lecturer/assignments/${classId}`);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Academic Courses
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your active classroom sessions
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search classes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Stats Overview - Dark Glass Design */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center gap-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/20 relative z-10">
                                <BookOpen className="size-6 text-blue-400" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    Total Classes
                                </p>
                                <p className="text-2xl font-bold text-white">{classes.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center gap-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                            <div className="p-3 bg-violet-500/20 rounded-xl border border-violet-500/20 relative z-10">
                                <Users className="size-6 text-violet-400" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    Total Students
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex items-center gap-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20 relative z-10">
                                <CheckCircle className="size-6 text-emerald-400" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    Active Status
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {classes.length > 0 ? Math.round((classes.filter((c) => c.is_active).length / classes.length) * 100) : 0}%
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <GridSkeleton count={3} />
                ) : filteredClasses.length === 0 ? (
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <div className="p-4 bg-slate-800 rounded-full w-fit mx-auto mb-4">
                                <BookOpen className="size-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-white">
                                {searchQuery ? 'No classes found' : 'No classes yet'}
                            </h3>
                            <p className="text-slate-400">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Create a class to start managing assignments'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((classItem) => (
                            <SectionClassCard
                                key={classItem.id}
                                classData={classItem}
                                variant="assignments"
                                onAction={handleViewAssignments}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
