import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLecturerStudents } from "@/hooks/useLecturerStudents";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Search,
    Eye,
    Mail,
    Trash2,
    BookOpen,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AllStudents() {
    const { students, loading } = useLecturerStudents();
    const [searchQuery, setSearchQuery] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Mock data for demonstration - in real app, this would come from API
    const enhancedStudents = students.map((student, index) => ({
        ...student,
        id: `2024${(901 + index).toString()}`,
        status: index % 3 === 0 ? "active" : index % 3 === 1 ? "probation" : "active",
        progress: Math.floor(Math.random() * 40) + 55, // 55-95%
    }));

    const filteredStudents = enhancedStudents.filter(student => {
        const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCourse = courseFilter === "all" || student.courses.includes(courseFilter);
        const matchesStatus = statusFilter === "all" || student.status === statusFilter;
        return matchesSearch && matchesCourse && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    // Get unique courses for filter
    const allCourses = Array.from(new Set(students.flatMap(s => s.courses)));

    // Calculate stats
    const totalEnrolled = students.length;
    const activeCourses = allCourses.length;
    const avgAttendance = 88;

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Student Management</h1>
                    <p className="text-sm text-muted-foreground">View and manage enrolled students across all your courses.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Total Enrolled</p>
                                    <p className="text-3xl font-bold text-foreground">{totalEnrolled.toLocaleString()}</p>
                                    <div className="flex items-center gap-1 text-xs text-emerald-500 mt-1">
                                        <TrendingUp className="size-3" />
                                        <span>+12% from last semester</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Users className="size-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Active Courses</p>
                                    <p className="text-3xl font-bold text-foreground">{activeCourses}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Spring 2024 Semester</p>
                                </div>
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <BookOpen className="size-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Avg. Attendance</p>
                                    <p className="text-3xl font-bold text-foreground">{avgAttendance}%</p>
                                    <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
                                        <TrendingDown className="size-3" />
                                        <span>-2% this week</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-lg">
                                    <BarChart3 className="size-6 text-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            className="pl-9 bg-card border-border"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-[180px] bg-card border-border">
                            <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {allCourses.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-card border-border">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="probation">Probation</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button className="bg-primary hover:bg-primary/90 gap-2 ml-auto">
                        <Plus className="size-4" />
                        Add New Student
                    </Button>
                </div>

                {/* Students Table */}
                <Card className="bg-card border-border">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/30">
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">Student Name</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">ID</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">Email</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">Enrolled Courses</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">Overall Progress</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="h-32 text-center text-muted-foreground">
                                                No students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedStudents.map((student) => (
                                            <tr key={student.student_id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-10">
                                                            <AvatarImage src={student.avatar_url || undefined} />
                                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                                {student.full_name.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-foreground">{student.full_name}</span>
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    "w-fit mt-1 text-xs",
                                                                    student.status === "active"
                                                                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                                                        : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                                                )}
                                                            >
                                                                {student.status === "active" ? "Active" : "Probation"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-muted-foreground">{student.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-foreground">{student.email || "N/A"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {student.courses.slice(0, 3).map((code) => (
                                                            <Badge
                                                                key={code}
                                                                variant="outline"
                                                                className="bg-primary/5 text-primary border-primary/20 text-xs font-medium"
                                                            >
                                                                {code}
                                                            </Badge>
                                                        ))}
                                                        {student.courses.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{student.courses.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 min-w-[120px]">
                                                        <span className="text-xs text-muted-foreground">Avg</span>
                                                        <div className="flex-1">
                                                            <Progress
                                                                value={student.progress}
                                                                className={cn(
                                                                    "h-2",
                                                                    student.progress >= 80 ? "[&>div]:bg-blue-500" :
                                                                        student.progress >= 60 ? "[&>div]:bg-amber-500" :
                                                                            "[&>div]:bg-red-500"
                                                                )}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-foreground min-w-[35px]">
                                                            {student.progress}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                                        >
                                                            <Mail className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredStudents.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="bg-card border-border"
                                    >
                                        Previous
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "size-8 p-0",
                                                currentPage === page
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-card border-border"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="bg-card border-border"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
