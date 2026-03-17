
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/useClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    ClipboardList,
    Users,
    Search,
    CheckCircle,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { SectionClassCard } from '@/components/common/SectionClassCard';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';

export default function LecturerClassesAttendance() {
    const navigate = useNavigate();
    const { classes, loading } = useClasses();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClasses = classes.filter(
        (classItem) =>
            classItem.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.lecturer_department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewAttendance = (classId: string) => {
        navigate(`/lecturer/attendance/${classId}`);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex flex-col gap-5 pt-2">
                    <div className="px-1">
                        <h1 className="text-xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                            Attendance Management
                        </h1>
                        <p className="text-[10px] sm:text-sm text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">
                            Central control for student presence
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full max-w-md group px-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find a class..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-11 pr-4 bg-white/20 dark:bg-white/5 backdrop-blur-md border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl text-xs font-bold"
                        />
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="border-none bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 dark:from-indigo-600 dark:to-blue-900 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Calendar className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/20 dark:bg-black/20 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-md shrink-0">
                                <Calendar className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-white/70 font-black uppercase tracking-widest truncate">
                                    Total Classes
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">{classes.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-purple-500 via-violet-600 to-violet-700 dark:from-purple-600 dark:to-violet-900 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/20 dark:bg-black/20 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-md shrink-0">
                                <Users className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-white/70 font-black uppercase tracking-widest truncate">
                                    Total Students
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
                                    {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 dark:from-emerald-600 dark:to-teal-900 shadow-xl rounded-2xl overflow-hidden group col-span-2 sm:col-span-1">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="size-12 sm:size-20 text-white" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/20 dark:bg-black/20 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-md shrink-0">
                                <CheckCircle className="size-5 sm:size-7 text-white" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-xs text-white/70 font-black uppercase tracking-widest truncate">
                                    Active Classes
                                </p>
                                <p className="text-xl sm:text-3xl font-black text-white">
                                    {classes.filter(c => c.is_active).length}
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
                                <ClipboardList className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-foreground">
                                {searchQuery ? 'No classes found' : 'No classes yet'}
                            </h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Create a class to start tracking attendance'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((classItem, index) => (
                            <SectionClassCard
                                key={classItem.id}
                                classData={classItem}
                                variant="attendance"
                                onAction={handleViewAttendance}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
