import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAssignmentSubmissions, AssignmentSubmissionDetail } from '@/hooks/useAssignmentSubmissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    FileText,
    Download,
    AlertCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Filter,
    Users,
    TrendingUp,
    Bookmark,
    ExternalLink,
    Calendar,
    MessageSquare,
    User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { formatFileSize } from '@/lib/fileUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { downloadAssignmentFile } from '@/lib/supabaseStorage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentSubmissionsPage() {
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { submissions, loading: submissionsLoading } = useAssignmentSubmissions(assignmentId!, classId!);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'submitted' | 'not_submitted'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Review Modal State
    const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmissionDetail | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

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
        const submitted = total - pending;
        const submissionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

        return { total, pending, submitted, submissionRate };
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

    const handleReviewClick = (submission: AssignmentSubmissionDetail) => {
        setSelectedSubmission(submission);
        setIsReviewOpen(true);
    };

    /**
     * Handles file download by fetching the blob to force the browser to download rather than open
     * Improved to handle absolute and relative Supabase URLs
     */
    const handleDownload = async (e: React.MouseEvent, path: string, filename: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!path) return;

        try {
            await downloadAssignmentFile(path, filename || 'submission');
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const getStatusBadge = (student: any) => {
        const statusMap = {
            graded: {
                label: `GRADED`,
                subLabel: `${student.grade || '0'}/100`,
                dot: "bg-emerald-500",
                bg: "bg-emerald-500/10",
                text: "text-emerald-600 dark:text-emerald-400",
                border: "border-emerald-500/20"
            },
            submitted: {
                label: "SUBMITTED",
                subLabel: "ON TIME",
                dot: "bg-indigo-500",
                bg: "bg-indigo-500/10",
                text: "text-indigo-600 dark:text-indigo-400",
                border: "border-indigo-500/20"
            },
            returned: {
                label: "LATE",
                subLabel: "SUBMITTED",
                dot: "bg-amber-500",
                bg: "bg-amber-500/10",
                text: "text-amber-600 dark:text-amber-400",
                border: "border-amber-500/20"
            },
            pending: {
                label: "MISSING",
                subLabel: "NOT SUBMITTED",
                dot: "bg-rose-500",
                bg: "bg-rose-500/10",
                text: "text-rose-600 dark:text-rose-400",
                border: "border-rose-500/20"
            }
        };

        const config = statusMap[student.status as keyof typeof statusMap] || statusMap.pending;

        return (
            <div className="flex flex-col items-center md:items-center gap-1">
                <Badge
                    variant="outline"
                    className={cn(
                        "gap-1.5 px-3 py-1 font-bold text-[9px] uppercase tracking-widest rounded-full border shadow-sm",
                        config.bg, config.text, config.border
                    )}
                >
                    <span className={cn("size-1.5 rounded-full shrink-0 animate-pulse", config.dot)} />
                    {config.label}
                </Badge>
                <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter text-center">
                    {config.subLabel}
                </span>
            </div>
        );
    };

    const isLoading = submissionsLoading || assignmentLoading;

    return (
        <DashboardLayout>
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 w-full pb-10 px-0 md:px-4">

                {/* Breadcrumbs / Back button */}
                <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-4 md:px-0">
                    <button 
                        onClick={() => navigate(`/lecturer/assignments`)}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                        Classes
                    </button>
                    <span className="opacity-20">/</span>
                    <button 
                        onClick={() => navigate(`/lecturer/assignments/${classId}`)}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                        {assignment?.course_id || "Back"}
                    </button>
                    <span className="opacity-20">/</span>
                    <span className="text-primary/80">Submissions</span>
                </div>

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 px-4 md:px-0">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl border border-primary/20">
                                <Bookmark className="size-5 md:size-6 text-primary" />
                            </div>
                            <div>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-10 w-64" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                                            Review Submissions
                                        </h1>
                                        <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">
                                            {assignment?.title || "Assignment Details"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid - Premium */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 w-full lg:w-auto">
                        {isLoading ? (
                            [1, 2, 3].map((i) => (
                                <Card key={i} className="border-none bg-slate-500/5 shadow-none rounded-2xl md:rounded-3xl border border-border/50">
                                    <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4 h-full">
                                        <Skeleton className="size-10 md:size-12 rounded-xl shrink-0" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-6 w-12" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <>
                                <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent shadow-none rounded-2xl md:rounded-3xl overflow-hidden border border-indigo-500/20 group backdrop-blur-sm">
                                    <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4 h-full">
                                        <div className="p-2 md:p-3 bg-indigo-500/20 rounded-lg md:rounded-2xl border border-indigo-500/20 text-indigo-500 group-hover:scale-110 transition-transform duration-500 shadow-inner shrink-0">
                                            <Users className="size-4 md:size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] text-indigo-500 font-black uppercase tracking-widest opacity-60 text-left">
                                                Total
                                            </p>
                                            <p className="text-lg md:text-2xl font-black text-foreground text-left">{stats.total}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-none rounded-2xl md:rounded-3xl overflow-hidden border border-emerald-500/20 group backdrop-blur-sm">
                                    <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4 h-full">
                                        <div className="p-2 md:p-3 bg-emerald-500/20 rounded-lg md:rounded-2xl border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform duration-500 shadow-inner shrink-0">
                                            <CheckCircle2 className="size-4 md:size-5" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] text-emerald-500 font-black uppercase tracking-widest opacity-60 text-left">
                                                Received
                                            </p>
                                            <p className="text-lg md:text-2xl font-black text-foreground text-left">{stats.submitted}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-none rounded-2xl md:rounded-3xl overflow-hidden border border-blue-500/20 group backdrop-blur-sm col-span-2 md:col-span-1">
                                    <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4 h-full">
                                        <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg md:rounded-2xl border border-blue-500/20 text-blue-500 group-hover:scale-110 transition-transform duration-500 shadow-inner shrink-0">
                                            <TrendingUp className="size-4 md:size-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] md:text-[10px] text-blue-500 font-black uppercase tracking-widest opacity-60 text-left">
                                                Rate
                                            </p>
                                            <p className="text-lg md:text-2xl font-black text-foreground text-left">{stats.submissionRate}%</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-0">
                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-2 bg-slate-500/5 dark:bg-white/5 backdrop-blur-md rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-white/5">
                        <div className="relative w-full md:w-[400px] group pl-2">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Find by name or register number..."
                                className="h-10 md:h-12 pl-12 pr-4 bg-transparent border-none focus-visible:ring-0 text-sm font-bold placeholder:text-muted-foreground/30 transition-all uppercase tracking-tight"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl md:rounded-2xl">
                            {['all', 'submitted', 'not_submitted'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={cn(
                                        "flex-1 md:flex-none px-3 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                                        filter === f
                                            ? "bg-white dark:bg-[#1a1625] text-foreground shadow-sm md:shadow-lg scale-[1.02]"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {f === 'not_submitted' ? 'Missing' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submissions Container */}
                    <div className="bg-white/30 dark:bg-[#1a1625]/30 backdrop-blur-2xl rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl md:shadow-2xl overflow-hidden flex flex-col">
                        {/* List Headers - Desktop Only */}
                        <div className="hidden md:grid md:grid-cols-[1.2fr,350px,100px,120px,160px] gap-6 px-8 py-4 border-b border-slate-200 dark:border-white/5 bg-slate-500/5 items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Profile</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Submission Preview</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Grade</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right pr-4">Actions</span>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <div key={i}>
                                        {/* Desktop Skeleton */}
                                        <div className="hidden md:grid md:grid-cols-[1.2fr,350px,100px,120px,160px] items-center gap-6 px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="size-12 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-12 w-full rounded-xl" />
                                            <div className="flex justify-center"><Skeleton className="h-8 w-12 rounded-lg" /></div>
                                            <div className="flex justify-center"><Skeleton className="h-6 w-24 rounded-full" /></div>
                                            <div className="flex items-center justify-end gap-2 pr-2">
                                                <Skeleton className="h-9 w-24 rounded-xl" />
                                                <Skeleton className="size-9 rounded-xl" />
                                            </div>
                                        </div>
                                        {/* Mobile Skeleton */}
                                        <div className="md:hidden p-4 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="size-12 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-16 w-full rounded-2xl" />
                                        </div>
                                    </div>
                                ))
                            ) : paginatedSubmissions.length > 0 ? (
                                paginatedSubmissions.map((student) => (
                                    <div key={student.student_id} className="group hover:bg-slate-500/10 dark:hover:bg-white/[0.04] transition-all duration-300">
                                        
                                        {/* Desktop Item Layout */}
                                         <div className="hidden md:grid md:grid-cols-[1.2fr,350px,100px,120px,160px] items-center gap-6 px-8 py-6">
                                            {/* Student Profile Info */}
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <Avatar className="size-12 border-2 border-primary/20 bg-primary/5 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                                        <AvatarImage src={student.profile_image || undefined} />
                                                        <AvatarFallback className="bg-transparent text-primary text-xs font-black">
                                                            {student.student_name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="min-w-0 flex flex-col text-left">
                                                    <h4 className="font-black text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                        {student.student_name}
                                                    </h4>
                                                    <span className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-widest mt-0.5">
                                                        {student.register_number || "REG-N/A"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Submission Preview Box */}
                                            <div className="w-full">
                                                {student.file_url || student.submission_text ? (
                                                    <div className="relative flex items-center gap-3 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2 rounded-xl group/sub shadow-sm hover:border-primary/30 transition-all duration-300 overflow-hidden">
                                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                                                            {student.file_url ? <FileText className="size-4" /> : <MessageSquare className="size-4" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <p className="text-[10px] font-black text-foreground truncate">
                                                                {student.file_name || "Submission"}
                                                            </p>
                                                            {student.submission_text && !student.file_url && (
                                                                <p className="text-[9px] text-muted-foreground/60 italic truncate mt-0.5 leading-none">
                                                                    "{student.submission_text.substring(0, 40)}..."
                                                                </p>
                                                            )}
                                                            {student.file_url && (
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-tighter">
                                                                        {student.file_type?.toUpperCase() || "FILE"}
                                                                    </span>
                                                                    <span className="size-0.5 rounded-full bg-muted-foreground/20" />
                                                                    <span className="text-[8px] text-muted-foreground/60 font-black uppercase tracking-tighter">
                                                                        {formatFileSize(student.file_size)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {student.file_url && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); window.open(student.file_url, '_blank'); }}
                                                                className="size-7 rounded-lg opacity-0 group-hover/sub:opacity-100 transition-opacity bg-primary/5 hover:bg-primary/20 text-primary flex items-center justify-center"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/5 text-rose-500/40 w-full justify-start text-[9px] font-black uppercase tracking-widest italic">
                                                        <AlertCircle className="size-3.5 shrink-0" />
                                                        Missing
                                                    </div>
                                                )}
                                            </div>

                                            {/* Grade Column */}
                                            <div className="flex justify-center flex-col items-center">
                                                {student.grade ? (
                                                    <span className="font-black text-sm text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">
                                                        {student.grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest"> ungraded </span>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex justify-center">
                                                {getStatusBadge(student)}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-2 pr-2">
                                                {student.status !== 'pending' ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Button 
                                                            variant="default" 
                                                            size="sm" 
                                                            className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest gap-2" 
                                                            onClick={() => handleReviewClick(student)}
                                                        >
                                                            Review
                                                        </Button>
                                                        {student.file_url && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-muted-foreground transition-all" 
                                                                onClick={(e) => handleDownload(e, student.file_path || student.file_url!, student.file_name || 'submission')}
                                                            >
                                                                <Download className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-border/50">
                                                        <span className="text-[8px] font-black text-muted-foreground/30 tracking-widest uppercase italic">Waiting</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Mobile Item Layout - Integrated Icons */}
                                        <div className="md:hidden p-4 flex flex-col gap-4">
                                            {/* Header: Profile + Status */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <Avatar className="size-12 border border-primary/20 bg-primary/5">
                                                            <AvatarImage src={student.profile_image || undefined} />
                                                            <AvatarFallback className="text-primary text-xs font-black">
                                                                {student.student_name.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className={cn(
                                                            "absolute -bottom-0.5 -right-0.5 size-3 border-2 border-white dark:border-[#1a1625] rounded-full",
                                                            student.status !== 'pending' ? "bg-emerald-500" : "bg-slate-300"
                                                        )} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm text-foreground truncate">{student.student_name}</h4>
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 w-fit mt-0.5">
                                                            {student.register_number || "REG-N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex items-center">
                                                    {getStatusBadge(student)}
                                                </div>
                                            </div>

                                            {/* Body: Submission Details Card with ICONS inside */}
                                            <div className="w-full">
                                                {student.file_url || student.submission_text ? (
                                                    <div className="flex items-center gap-3 bg-white/40 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-3 rounded-2xl relative">
                                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                                                            {student.file_url ? <FileText className="size-5" /> : <MessageSquare className="size-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-black text-foreground truncate max-w-[120px]">
                                                                {student.file_name || (student.submission_text ? "Text Submission" : "Submission File")}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground font-bold truncate">
                                                                {student.file_url ? `${formatFileSize(student.file_size)}` : 'Text Responses'}
                                                            </p>
                                                        </div>

                                                        {/* Icons Container - RIGHT SIDE */}
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            {/* Direct View Icon - Opens URL properly */}
                                                            {student.file_url ? (
                                                                <Button 
                                                                    variant="default" 
                                                                    size="icon"
                                                                    className="size-9 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                                                    asChild
                                                                >
                                                                    <a href={student.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Eye className="size-4" />
                                                                    </a>
                                                                </Button>
                                                            ) : (
                                                                <Button 
                                                                    variant="default" 
                                                                    size="icon"
                                                                    className="size-9 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                                                    onClick={() => handleReviewClick(student)}
                                                                >
                                                                    <Eye className="size-4" />
                                                                </Button>
                                                            )}
                                                            
                                                            {student.file_url && (
                                                                <Button 
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="size-9 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 active:scale-95 transition-all"
                                                                    onClick={(e) => handleDownload(e, student.file_path || student.file_url!, student.file_name || 'submission')}
                                                                >
                                                                    <Download className="size-4 text-muted-foreground" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500/60 justify-center">
                                                        <AlertCircle className="size-3.5" />
                                                        <span className="text-[10px] font-black uppercase tracking-wider italic opacity-60">No Submission Found</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Information */}
                                            <div className="flex items-center justify-between px-1">
                                                {student.submitted_at ? (
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                                        Submitted: {new Date(student.submitted_at).toLocaleDateString()}
                                                    </p>
                                                ) : (
                                                    <p className="text-[9px] font-bold text-rose-500/40 uppercase tracking-widest">
                                                        Pending Submission
                                                    </p>
                                                )}
                                                <button 
                                                    onClick={() => handleReviewClick(student)}
                                                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                                >
                                                    Full Review
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-24 md:py-32 flex flex-col items-center justify-center text-center px-10">
                                    <div className="p-6 md:p-8 bg-slate-500/5 rounded-full border border-border/50 mb-6 group hover:scale-110 transition-transform duration-500">
                                        <Filter className="size-10 md:size-12 text-slate-300 dark:text-slate-700 animate-pulse" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black text-foreground mb-2">No students match your criteria</h3>
                                    <p className="text-slate-500 font-bold max-w-sm mx-auto text-xs md:text-sm">
                                        We couldn't find any submissions for the current filter. Try adjusting your search query or filters above.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {setSearchQuery(""); setFilter('all');}} 
                                        className="mt-6 md:mt-8 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest px-6 md:px-8 border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Pagination Footer - Premium Design */}
                        <div className="px-4 md:px-10 py-5 md:py-6 border-t border-slate-200 dark:border-white/5 bg-slate-500/5 flex flex-col sm:flex-row items-center justify-between gap-5 md:gap-6">
                            {isLoading ? (
                                <Skeleton className="h-4 w-64" />
                            ) : (
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 text-center md:text-left">
                                    Showing <span className="text-primary">{filteredSubmissions.length === 0 ? 0 : startIndex + 1} — {endIndex}</span> of <span className="text-foreground">{filteredSubmissions.length}</span> students in class
                                </p>
                            )}

                            <div className="flex items-center gap-4 md:gap-6">
                                    <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-black/20 rounded-xl md:rounded-2xl border border-white/5">
                                        {isLoading ? (
                                            <Skeleton className="h-10 w-48 rounded-xl" />
                                        ) : (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="size-9 md:size-10 rounded-lg md:rounded-xl hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 transition-all font-black"
                                                >
                                                    <ChevronLeft className="size-4 md:size-5" />
                                                </Button>
                                                
                                                <div className="flex items-center gap-1 px-1 md:px-3">
                                                    {[...Array(Math.min(3, totalPages))].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={cn(
                                                                    "size-8 rounded-lg text-[10px] font-black transition-all",
                                                                    currentPage === pageNum 
                                                                        ? "bg-primary text-white shadow-lg shadow-primary/25" 
                                                                        : "text-muted-foreground hover:bg-white/5"
                                                                )}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        )
                                                    })}
                                                    {totalPages > 3 && <span className="text-muted-foreground px-1 text-xs">...</span>}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage >= totalPages || totalPages === 0}
                                                    className="size-9 md:size-10 rounded-lg md:rounded-xl hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 transition-all font-black"
                                                >
                                                    <ChevronRight className="size-4 md:size-5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal - The "Proper" UI for reviewing individual submission */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-xl w-[90vw] rounded-[2.5rem] p-0 border-none bg-white dark:bg-[#1a1625] shadow-2xl overflow-hidden focus:outline-none">
                    <div className="relative">
                        {/* Header Banner */}
                        <div className="h-20 md:h-24 bg-gradient-to-r from-indigo-600 to-blue-600 relative flex flex-col justify-center px-6 md:px-8 text-white">
                            <div className="absolute right-0 p-4 opacity-10">
                                <FileText className="size-16 md:size-20 rotate-12" />
                            </div>
                            <h2 className="text-lg md:text-xl font-black tracking-tight truncate pr-16">{selectedSubmission?.student_name}</h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mt-0.5">Submission Details</p>
                        </div>

                        <div className="p-5 md:p-6 space-y-5">
                            {/* Metadata Row */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/50">Register Number</p>
                                    <p className="font-bold text-xs truncate">{selectedSubmission?.register_number || 'N/A'}</p>
                                </div>
                                <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/50">Timestamp</p>
                                    <p className="font-bold text-xs whitespace-nowrap">
                                        {selectedSubmission?.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/50">Status</p>
                                    <div className="flex">
                                        <Badge variant="secondary" className="font-black text-[8px] uppercase px-1.5 py-0 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                                            {selectedSubmission?.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <MessageSquare className="size-3.5 text-primary" />
                                    </div>
                                    <h3 className="font-black text-xs uppercase tracking-wider">Submission Content</h3>
                                </div>
                                
                                <ScrollArea className="h-32 md:h-40 w-full rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/30 p-4 md:p-5">
                                    {selectedSubmission?.submission_text ? (
                                        <p className="text-xs md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                            {selectedSubmission.submission_text}
                                        </p>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-2 py-4">
                                            <MessageSquare className="size-6" />
                                            <p className="text-[10px] font-bold italic">No text responses</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            {/* File Listing */}
                            {selectedSubmission?.file_url && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                            <FileText className="size-3.5 text-indigo-500" />
                                        </div>
                                        <h3 className="font-black text-xs uppercase tracking-wider">Attached Asset</h3>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-2xl group transition-all">
                                        <div className="size-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                                            <FileText className="size-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black truncate">{selectedSubmission.file_name || "Attachment"}</p>
                                            <p className="text-[9px] font-bold opacity-40 uppercase mt-0.5">{formatFileSize(selectedSubmission.file_size)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => window.open(selectedSubmission.file_url, '_blank')}
                                                className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                                                title="View"
                                            >
                                                <Eye className="size-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDownload(e, selectedSubmission.file_path || selectedSubmission.file_url!, selectedSubmission.file_name || 'submission')}
                                                className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-5 md:p-6 flex justify-end bg-slate-50/50 dark:bg-transparent border-t border-slate-100 dark:border-white/5">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsReviewOpen(false)} 
                                className="rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest border-slate-200 dark:border-white/10"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
