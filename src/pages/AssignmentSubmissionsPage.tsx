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
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { formatFileSize, getFileExtension, getFileTypeDisplay } from '@/lib/fileUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AssignmentSubmissionsPage() {
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { submissions, loading: submissionsLoading } = useAssignmentSubmissions(assignmentId!, classId!);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'submitted' | 'not_submitted'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filter]);

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
            if (filter === 'submitted') return student.status !== 'pending';
            if (filter === 'not_submitted') return student.status === 'pending';

            return true;
        });
    }, [submissions, searchQuery, filter]);

    // Pagination Logic
    const paginatedSubmissions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSubmissions, currentPage]);

    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredSubmissions.length);

    const getStatusBadge = (student: any) => {
        const statusMap = {
            graded: {
                label: `GRADED (${student.grade || '0'}/100)`,
                dot: "bg-blue-500",
                bg: "bg-blue-500/10",
                text: "text-blue-500",
                border: "border-blue-500/20"
            },
            submitted: {
                label: "ON TIME",
                dot: "bg-emerald-500",
                bg: "bg-emerald-500/10",
                text: "text-emerald-500",
                border: "border-emerald-500/20"
            },
            returned: {
                label: "LATE",
                dot: "bg-amber-500",
                bg: "bg-amber-500/10",
                text: "text-amber-500",
                border: "border-amber-500/20"
            },
            pending: {
                label: "NOT SUBMITTED",
                dot: "bg-slate-400",
                bg: "bg-slate-400/10",
                text: "text-slate-400",
                border: "border-slate-400/20"
            }
        };

        const config = statusMap[student.status as keyof typeof statusMap] || statusMap.pending;

        return (
            <Badge
                variant="outline"
                className={cn(
                    "gap-2 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-full border shadow-sm",
                    config.bg, config.text, config.border
                )}
            >
                <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
                {config.label}
            </Badge>
        );
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

                        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                            <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg rounded-2xl overflow-hidden group">
                                <CardContent className="p-3 flex items-center gap-2 relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                        <FileText className="size-10 text-white" />
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                        <FileText className="size-4 text-white" />
                                    </div>
                                    <div className="relative z-10 min-w-0">
                                        <p className="text-[10px] text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                            Total
                                        </p>
                                        <p className="text-xl font-black text-white">{stats.total}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg rounded-2xl overflow-hidden group">
                                <CardContent className="p-3 flex items-center gap-2 relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                        <Clock className="size-10 text-white" />
                                    </div>
                                    <div className="p-2 bg-white/10 rounded-xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                        <Clock className="size-4 text-white" />
                                    </div>
                                    <div className="relative z-10 min-w-0">
                                        <p className="text-[10px] text-amber-100/80 font-semibold uppercase tracking-wider truncate">
                                            Pending
                                        </p>
                                        <p className="text-xl font-black text-white">{stats.pending}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Filter Bar - Mockup Style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-[350px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search students..."
                            className="h-12 pl-11 pr-4 bg-[#1a1625]/50 dark:bg-[#1a1625]/50 border-white/5 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-sm font-medium transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#1a1625]/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 w-full md:w-fit overflow-x-auto no-scrollbar ml-auto">
                        <Button
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "flex-1 md:flex-none rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-6 h-9 transition-all shrink-0",
                                filter === 'all'
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 md:px-8"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'submitted' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "flex-1 md:flex-none rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-6 h-9 transition-all shrink-0",
                                filter === 'submitted'
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 md:px-8"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                            onClick={() => setFilter('submitted')}
                        >
                            Submitted
                        </Button>
                        <Button
                            variant={filter === 'not_submitted' ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                                "flex-1 md:flex-none rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-6 h-9 transition-all shrink-0",
                                filter === 'not_submitted'
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 md:px-8"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                            onClick={() => setFilter('not_submitted')}
                        >
                            Pending
                        </Button>
                    </div>
                </div>

                {/* Submissions List Container */}
                <div className="bg-[#1a1625]/30 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col">
                    {/* Header Row - Desktop Only */}
                    <div className="hidden md:grid md:grid-cols-[250px,1fr,200px,120px] gap-8 px-10 py-6 border-b border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Student</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Submission</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</span>
                    </div>

                    <div className="divide-y divide-white/5">
                        {paginatedSubmissions.length > 0 ? (
                            paginatedSubmissions.map((student) => (
                                <div key={student.student_id} className="group">
                                    {/* Desktop Row View */}
                                    <div className="hidden md:grid md:grid-cols-[250px,1fr,200px,120px] items-center gap-8 px-10 py-6 hover:bg-white/[0.02] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="size-10 border-2 border-indigo-500/20 shadow-lg bg-indigo-500/10">
                                                    <AvatarImage src={student.profile_image || undefined} />
                                                    <AvatarFallback className="bg-transparent text-indigo-400 text-[10px] font-black line-height-none">
                                                        {student.student_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-emerald-500 border-2 border-[#1a1625] rounded-full" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-indigo-400 transition-colors">{student.student_name}</h4>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                    {student.register_number || "711523BAD303"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            {student.file_url ? (
                                                <div className="inline-flex items-center gap-4 bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.05] p-3 rounded-xl transition-all max-w-sm w-full">
                                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                                        <FileText className="size-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-200 truncate">{student.file_name || "Assignment File.pdf"}</p>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                            {student.file_type?.toUpperCase() || "PDF"} • {formatFileSize(student.file_size) || "114.9 KB"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.1em] italic">No Submission</span>
                                            )}
                                        </div>

                                        <div className="flex justify-center">
                                            {getStatusBadge(student)}
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            {student.file_url ? (
                                                <>
                                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white/5 text-slate-400 hover:text-indigo-400 transition-all" asChild>
                                                        <a href={student.file_url} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="size-4" />
                                                        </a>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white/5 text-slate-400 hover:text-indigo-400 transition-all" asChild>
                                                        <a href={student.file_url} target="_blank" rel="noopener noreferrer" download>
                                                            <Download className="size-4" />
                                                        </a>
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-700 tracking-wider">N/A</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Card View - Easy to use design */}
                                    <div className="md:hidden p-5 flex flex-col gap-4 hover:bg-white/[0.02]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-11 border-2 border-indigo-500/20">
                                                    <AvatarFallback className="bg-indigo-500/10 text-indigo-400 text-xs font-black">
                                                        {student.student_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-100">{student.student_name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold">{student.register_number}</p>
                                                </div>
                                            </div>
                                            {getStatusBadge(student)}
                                        </div>

                                        {student.file_url ? (
                                            <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl flex items-center gap-3 active:scale-95 transition-transform">
                                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                                                    <FileText className="size-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-200 truncate">{student.file_name}</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{student.file_type?.toUpperCase()} • {formatFileSize(student.file_size)}</p>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <Button variant="ghost" size="icon" className="size-9 bg-white/5 rounded-full" asChild>
                                                        <a href={student.file_url} target="_blank" rel="noopener noreferrer"><Download className="size-4" /></a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl text-center">
                                                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">No Submission recorded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <AlertCircle className="size-10 text-slate-700 mx-auto mb-4" />
                                <p className="text-sm font-bold text-slate-500">No students found matching your filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Footer - Mockup Style */}
                    <div className="px-10 py-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Showing <span className="text-indigo-400">{filteredSubmissions.length === 0 ? 0 : startIndex + 1} - {endIndex}</span> of <span className="text-slate-300">{filteredSubmissions.length}</span> students
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="size-10 rounded-xl border-white/5 bg-white/[0.03] text-slate-500 hover:text-white transition-all disabled:opacity-20 shadow-lg shadow-black/20"
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages || totalPages === 0}
                                    className="size-10 rounded-xl border-white/5 bg-white/[0.03] text-slate-500 hover:text-white transition-all disabled:opacity-20 shadow-lg shadow-black/20"
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
}

