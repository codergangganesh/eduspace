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
                {/* Stats Overview - Premium Design */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <BookOpen className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <BookOpen className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                    Total Classes
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">{classes.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-violet-600 to-purple-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <Users className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-violet-100/80 font-semibold uppercase tracking-wider truncate">
                                    Total Students
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
                                    {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl rounded-2xl overflow-hidden group col-span-2 sm:col-span-1">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <CheckCircle className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-emerald-100/80 font-semibold uppercase tracking-wider truncate">
                                    Active Status
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
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
                    <Card className="bg-muted/30 border-dashed border-2 rounded-3xl">
                        <CardContent className="p-12 text-center">
                            <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                                <BookOpen className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                {searchQuery ? 'No classes found' : 'No classes yet'}
                            </h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Create a class to start managing assignments'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((classItem, index) => (
                            <SectionClassCard
                                key={classItem.id}
                                classData={classItem}
                                variant="assignments"
                                onAction={handleViewAssignments}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
