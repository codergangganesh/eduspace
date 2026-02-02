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
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Quiz Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Select a class to manage quizzes
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

                {/* Stats Overview */}
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
                    {/* Reuse other stats if needed or customize for quizzes */}
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <h3 className="text-lg font-semibold mb-2 text-white">
                                {searchQuery ? 'No classes found' : 'No classes yet'}
                            </h3>
                            <p className="text-slate-400">
                                Create a class to start creating quizzes
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((classItem) => (
                            <SectionClassCard
                                key={classItem.id}
                                classData={classItem}
                                variant="quizzes" // Use default or create a 'quiz' variant if needed
                                onAction={() => handleViewQuizzes(classItem.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
