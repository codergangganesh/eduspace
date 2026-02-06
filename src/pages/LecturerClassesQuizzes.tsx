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
import { Badge } from '@/components/ui/badge';

export default function LecturerClassesQuizzes() {
    const navigate = useNavigate();
    const { classes, loading } = useClasses();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClasses = classes.filter(
        (classItem) =>
            classItem.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            classItem.lecturer_department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewQuizzes = (classId: string) => {
        navigate(`/lecturer/quizzes/${classId}`);
    };

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-10 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            Quiz Management
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Select a class below to create, manage, and analyze student assessments.
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
                        <div className="flex items-center justify-center py-24">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {filteredClasses.map((classItem) => (
                                <SectionClassCard
                                    key={classItem.id}
                                    classData={classItem}
                                    variant="quizzes"
                                    onAction={() => handleViewQuizzes(classItem.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
