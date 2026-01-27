import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useClasses } from '@/hooks/useClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    Users,
    Calendar,
    GraduationCap,
    Search,
    FileText,
} from 'lucide-react';
import { useState } from 'react';

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

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            Assignment Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Select a class to view and manage assignments
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
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <BookOpen className="size-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Total Classes
                                </p>
                                <p className="text-2xl font-bold">{classes.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Users className="size-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Total Students
                                </p>
                                <p className="text-2xl font-bold">
                                    {classes.reduce((sum, c) => sum + (c.student_count || 0), 0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <FileText className="size-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    Active Classes
                                </p>
                                <p className="text-2xl font-bold">
                                    {classes.filter((c) => c.is_active).length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <BookOpen className="size-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClasses.map((classItem) => (
                            <Card
                                key={classItem.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer group"
                            >
                                <CardContent className="p-6">
                                    {/* Class Image/Icon */}
                                    <div className="mb-4">
                                        {classItem.class_image_url ? (
                                            <img
                                                src={classItem.class_image_url}
                                                alt={classItem.class_name || classItem.course_code}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                                                <GraduationCap className="size-12 text-primary" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Class Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground line-clamp-1">
                                                {classItem.class_name || classItem.course_code}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {classItem.course_code}
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                            {classItem.lecturer_department && (
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="size-4" />
                                                    <span className="line-clamp-1">
                                                        {classItem.lecturer_department}
                                                    </span>
                                                </div>
                                            )}

                                            {(classItem.semester || classItem.academic_year) && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="size-4" />
                                                    <span>
                                                        {[classItem.semester, classItem.academic_year]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Users className="size-4" />
                                                <span>
                                                    {classItem.student_count || 0} student
                                                    {classItem.student_count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            className="w-full mt-4 gap-2"
                                            onClick={() =>
                                                navigate(`/lecturer/assignments/${classItem.id}`)
                                            }
                                        >
                                            <FileText className="size-4" />
                                            View Assignments
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
