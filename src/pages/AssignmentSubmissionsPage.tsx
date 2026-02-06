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
    AlertCircle
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

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    {/* Ideally fetch Class Name too, but sticking to design mock */}
                                </div>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-2">
                                Assignment Submissions
                            </h1>
                            <p className="text-lg text-slate-500 font-medium">
                                {assignment?.title || "Final Essay: 'The Hero's Journey in Modern Fiction'"}
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="flex gap-4">
                            <Card className="bg-card border-border shadow-sm min-w-[120px]">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">TOTAL</p>
                                    <p className="text-2xl font-black text-foreground">{stats.total}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm min-w-[120px]">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">PENDING</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-black text-foreground">{stats.pending}</p>
                                        <span className="size-2 rounded-full bg-amber-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-card border-border shadow-sm min-w-[120px]">
                                <CardContent className="p-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">AVG SCORE</p>
                                    <p className="text-2xl font-black text-foreground">{stats.avgScore}%</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-card/50 p-2 rounded-2xl border border-border flex flex-col sm:flex-row gap-2 shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student name or ID..."
                            className="pl-10 border-0 bg-transparent focus-visible:ring-0 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                        <Button
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn("rounded-lg text-xs font-bold", filter === 'all' ? "shadow-sm" : "text-muted-foreground")}
                            onClick={() => setFilter('all')}
                        >
                            All Submissions
                        </Button>
                        <Button
                            variant={filter === 'on_time' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn("rounded-lg text-xs font-bold", filter === 'on_time' ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm text-white" : "text-muted-foreground")}
                            onClick={() => setFilter('on_time')}
                        >
                            Submitted On Time
                        </Button>
                    </div>
                </div>

                {/* Submissions List */}
                <div className="flex flex-col gap-3">
                    {filteredSubmissions.map((student) => (
                        <div key={student.student_id} className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <Avatar className="size-12 border-2 border-border shadow-sm rounded-full overflow-hidden">
                                    <AvatarImage
                                        src={student.profile_image || undefined}
                                        alt={student.student_name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold w-full h-full flex items-center justify-center">
                                        {student.student_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-base text-foreground leading-tight">{student.student_name}</h4>
                                </div>
                            </div>

                            {/* File Block */}
                            <div className={cn(
                                "flex-1 flex items-center gap-4 px-5 py-3 rounded-2xl border-2 transition-all w-full",
                                student.file_url
                                    ? "bg-muted/40 border-border hover:border-primary/30"
                                    : "bg-muted/20 border-border/50"
                            )}>
                                {student.file_url ? (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{student.file_name}</p>
                                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                {getFileTypeDisplay(student.file_type) || getFileExtension(student.file_name)}
                                                {student.file_size && ` • ${formatFileSize(student.file_size)}`}
                                            </p>
                                        </div>
                                        <a
                                            href={student.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download className="size-5" />
                                        </a>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400 italic font-medium w-full text-center">No file uploaded yet</p>
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

