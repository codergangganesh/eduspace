import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAssignmentSubmissions } from '@/hooks/useAssignmentSubmissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeft,
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    FileText,
    MoreVertical,
    Download,
    AlertCircle,
    Trophy
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatFileSize, getFileExtension, getFileTypeDisplay } from '@/lib/fileUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AssignmentSubmissionsPage() {
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { submissions, loading: submissionsLoading } = useAssignmentSubmissions(assignmentId!, classId!);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'on_time' | 'late'>('all');

    // Fetch assignment details for the header
    const { data: assignment, isLoading: assignmentLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('assignments')
                .select('*')
                .eq('id', assignmentId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!assignmentId
    });

    // Stats Calculation
    const stats = useMemo(() => {
        const total = submissions.length;
        const pending = submissions.filter(s => s.status === 'pending').length;

        // Calculate average score for graded assignments
        const gradedSubs = submissions.filter(s => s.grade !== null && s.grade !== undefined);
        const totalScore = gradedSubs.reduce((acc, curr) => acc + (parseInt(curr.grade || '0') || 0), 0);
        const avgScore = gradedSubs.length > 0 ? Math.round(totalScore / gradedSubs.length) : 0;

        return { total, pending, avgScore };
    }, [submissions]);

    // Filtering
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(student => {
            const matchesSearch =
                student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.register_number.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filter === 'all') return true;
            if (filter === 'on_time') return student.status === 'submitted' || student.status === 'graded';
            if (filter === 'late') return student.status === 'returned' || student.status === 'pending';

            return true;
        });
    }, [submissions, searchQuery, filter]);

    const getStatusBadge = (student: any) => {
        switch (student.status) {
            case 'graded':
                return (
                    <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200 gap-1.5 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-blue-600" />
                        GRADED ({student.grade || '0'}/100)
                    </Badge>
                );
            case 'submitted':
                return (
                    <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-200 gap-1.5 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-emerald-600" />
                        ON TIME
                    </Badge>
                );
            case 'returned': // Mapping 'returned' or 'late' 
                return (
                    <Badge variant="outline" className="bg-amber-50/50 text-amber-600 border-amber-200 gap-1.5 px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-amber-600" />
                        LATE
                    </Badge>
                );
        }
    };

    if (submissionsLoading || assignmentLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 w-full">

                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/lecturer/assignments/${classId}`)}
                        className="w-fit text-muted-foreground hover:text-foreground pl-0 gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Courses
                    </Button>

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
                                Assignment Submissions
                            </h1>
                            <p className="text-base sm:text-lg text-slate-500 font-bold uppercase tracking-tight">
                                {assignment?.title || "Assignment Review"}
                            </p>
                        </div>

                        {/* Stats Cards - Responsive Grid */}
                        {/* Stats Cards - Premium Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 w-full lg:w-auto">
                            <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group">
                                <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <FileText className="size-12 sm:size-20 text-white" />
                                    </div>
                                    <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                        <FileText className="size-5 sm:size-7 text-white" />
                                    </div>
                                    <div className="relative z-10 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                            Total
                                        </p>
                                        <p className="text-xl sm:text-3xl font-black text-white">{stats.total}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl rounded-2xl overflow-hidden group">
                                <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Clock className="size-12 sm:size-20 text-white" />
                                    </div>
                                    <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                        <Clock className="size-5 sm:size-7 text-white" />
                                    </div>
                                    <div className="relative z-10 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-amber-100/80 font-semibold uppercase tracking-wider truncate">
                                            Pending
                                        </p>
                                        <p className="text-xl sm:text-3xl font-black text-white">{stats.pending}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none bg-gradient-to-br from-violet-600 to-purple-700 shadow-xl rounded-2xl overflow-hidden group col-span-2 sm:col-span-1">
                                <CardContent className="p-3 sm:p-5 flex items-center gap-2 sm:gap-5 relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Trophy className="size-12 sm:size-20 text-white" />
                                    </div>
                                    <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                        <Trophy className="size-5 sm:size-7 text-white" />
                                    </div>
                                    <div className="relative z-10 min-w-0">
                                        <p className="text-[10px] sm:text-xs text-violet-100/80 font-semibold uppercase tracking-wider truncate">
                                            Avg Score
                                        </p>
                                        <p className="text-xl sm:text-3xl font-black text-white">{stats.avgScore}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card/50 p-1.5 rounded-2xl border border-border flex flex-col sm:flex-row gap-2 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            className="pl-9 border-0 bg-transparent focus-visible:ring-0 text-sm sm:text-base h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                        <Button
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn("flex-1 sm:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider h-8", filter === 'all' ? "shadow-sm" : "text-muted-foreground")}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'on_time' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn("flex-1 sm:flex-none rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider h-8", filter === 'on_time' ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm text-white" : "text-muted-foreground")}
                            onClick={() => setFilter('on_time')}
                        >
                            On Time
                        </Button>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="flex flex-col gap-3">
                    {filteredSubmissions.map((student) => (
                        <div key={student.student_id} className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-2xl sm:rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group">
                            {/* Student Info & Status Toggle for Mobile */}
                            <div className="flex items-center justify-between w-full sm:w-auto sm:min-w-[200px] gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-10 sm:size-12 border-2 border-border shadow-sm rounded-full overflow-hidden">
                                        <AvatarImage
                                            src={student.profile_image || undefined}
                                            alt={student.student_name}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-bold w-full h-full flex items-center justify-center">
                                            {student.student_name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h4 className="font-bold text-sm sm:text-base text-foreground leading-tight truncate max-w-[150px]">{student.student_name}</h4>
                                </div>
                                <div className="sm:hidden">
                                    {getStatusBadge(student)}
                                </div>
                            </div>

                            {/* File Block */}
                            <div className={cn(
                                "flex-1 flex items-center gap-3 sm:gap-4 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 transition-all w-full",
                                student.file_url
                                    ? "bg-slate-50 dark:bg-slate-900 border-border hover:border-primary/30"
                                    : "bg-muted/10 border-border/50"
                            )}>
                                {student.file_url ? (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-foreground truncate">{student.file_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                                                {getFileTypeDisplay(student.file_type) || "FILE"}
                                                {student.file_size && ` • ${formatFileSize(student.file_size)}`}
                                            </p>
                                        </div>
                                        <a
                                            href={student.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download className="size-4 sm:size-5" />
                                        </a>
                                    </>
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic font-bold uppercase tracking-wider w-full text-center">No Submission</p>
                                )}
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-6 w-full sm:w-auto shrink-0 justify-end">
                                <div className="hidden md:block">
                                    {getStatusBadge(student)}
                                </div>

                            </div>
                        </div>
                    ))}

                    <div className="py-8 text-center text-muted-foreground text-sm font-medium">
                        Showing <span className="text-foreground font-bold">{filteredSubmissions.length}</span> of <span className="text-foreground font-bold">{submissions.length}</span> submissions
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}

