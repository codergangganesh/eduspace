import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Download,
    User,
    BookOpen,
    CheckCircle,
    AlertCircle,
    Loader2,
    Upload,
    ExternalLink,
    Trophy,
    Sparkles,
    MessageSquare,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";
import { useAssignments } from "@/hooks/useAssignments";
import { formatFileSize, getFileTypeDisplay, getFileExtension } from "@/lib/fileUtils";
import { useStreak } from "@/contexts/StreakContext";
import { resolveAnyStorageUrl, downloadAssignmentFile } from "@/lib/supabaseStorage";
import { AssignmentHelpPanel } from "@/components/help/AssignmentHelpPanel";

import { Skeleton } from "@/components/ui/skeleton";

interface AssignmentDetail {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    due_date: string | null;
    max_points: number;
    attachment_url: string | null;
    attachment_path?: string | null;
    attachment_name: string | null;
    status: string;
    created_at: string;
    class_id: string | null;
    subject_id: string | null;
    lecturer_id: string;
    class_name?: string;
    subject_name?: string;
    lecturer_name?: string;
}

interface Submission {
    id: string;
    submitted_at: string;
    attachment_url: string | null;
    attachment_path?: string | null;
    attachment_name: string | null;
    file_type: string | null;
    file_size: number | null;
    submission_text: string | null;
    grade: number | null;
    feedback: string | null;
    status: string;
}

interface AssignmentDetailCache {
    assignment: AssignmentDetail | null;
    submission: Submission | null;
}

export default function StudentAssignmentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { submitAssignment } = useAssignments();
    const { recordAcademicAction } = useStreak();

    const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);

    useEffect(() => {
        if (!id || !user) return;

        const cacheKey = `student-assignment-detail:${user.id}:${id}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData) as AssignmentDetailCache;
                if (parsed.assignment) {
                    setAssignment(parsed.assignment);
                    setSubmission(parsed.submission);
                    setLoading(false);
                }
            } catch (error) {
                console.warn('[StudentAssignmentDetail] Failed to read cached page data:', error);
            }
        }

        const fetchAssignmentDetails = async (background = false) => {
            if (!background && !cachedData) {
                setLoading(true);
            }
            try {
                recordAcademicAction();

                const assignmentPromise = supabase
                    .from('assignments')
                    .select('*')
                    .eq('id', id)
                    .single();

                const submissionPromise = supabase
                    .from('assignment_submissions')
                    .select('*, file_type, file_size')
                    .eq('assignment_id', id)
                    .eq('student_id', user.id)
                    .maybeSingle();

                const [
                    { data: assignmentData, error: assignmentError },
                    { data: submissionData, error: submissionError }
                ] = await Promise.all([assignmentPromise, submissionPromise]);

                if (assignmentError) throw assignmentError;
                if (submissionError) throw submissionError;

                const [classResponse, subjectResponse, lecturerResponse, resolvedAssignmentUrl, resolvedSubmissionUrl] = await Promise.all([
                    assignmentData.class_id
                        ? supabase.from('classes').select('class_name').eq('id', assignmentData.class_id).maybeSingle()
                        : Promise.resolve({ data: null, error: null }),
                    assignmentData.subject_id
                        ? supabase.from('subjects').select('name').eq('id', assignmentData.subject_id).maybeSingle()
                        : Promise.resolve({ data: null, error: null }),
                    assignmentData.lecturer_id
                        ? supabase.from('profiles').select('full_name').eq('user_id', assignmentData.lecturer_id).maybeSingle()
                        : Promise.resolve({ data: null, error: null }),
                    assignmentData?.attachment_url
                        ? resolveAnyStorageUrl(assignmentData.attachment_url)
                        : Promise.resolve(null),
                    submissionData?.attachment_url
                        ? resolveAnyStorageUrl(submissionData.attachment_url)
                        : Promise.resolve(null),
                ]);

                const nextAssignment: AssignmentDetail = {
                    ...assignmentData,
                    attachment_path: assignmentData?.attachment_url,
                    attachment_url: resolvedAssignmentUrl,
                    class_name: classResponse.data?.class_name ?? undefined,
                    subject_name: subjectResponse.data?.name ?? undefined,
                    lecturer_name: lecturerResponse.data?.full_name ?? undefined,
                } as AssignmentDetail;

                const nextSubmission = submissionData
                    ? ({
                        ...submissionData,
                        attachment_url: resolvedSubmissionUrl,
                        attachment_path: submissionData.attachment_url,
                    } as Submission)
                    : null;

                setAssignment(nextAssignment);
                setSubmission(nextSubmission);
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    assignment: nextAssignment,
                    submission: nextSubmission,
                } satisfies AssignmentDetailCache));
            } catch (err) {
                console.error('Error fetching assignment details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetails(!!cachedData);

        // Real-time subscription for submission updates
        const submissionSubscription = supabase
            .channel(`submission_${id}_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                    filter: `assignment_id=eq.${id}`,
                },
                async (payload: any) => {
                    console.log('[StudentAssignmentDetail] Submission update:', payload);
                    if (payload.new && 'student_id' in payload.new && payload.new.student_id === user.id) {
                        const nextSubmission = payload.new
                            ? ({
                                ...payload.new,
                                attachment_path: payload.new.attachment_url,
                                attachment_url: payload.new.attachment_url
                                    ? await resolveAnyStorageUrl(payload.new.attachment_url)
                                    : null,
                            } as Submission)
                            : null;

                        setSubmission(nextSubmission);
                        const existingCache = sessionStorage.getItem(cacheKey);
                        const parsedCache = existingCache
                            ? (JSON.parse(existingCache) as AssignmentDetailCache)
                            : { assignment: null, submission: null };
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            assignment: parsedCache.assignment,
                            submission: nextSubmission,
                        } satisfies AssignmentDetailCache));
                    }
                }
            )
            .subscribe();

        return () => {
            submissionSubscription.unsubscribe();
        };
    }, [id, user, recordAcademicAction]);

    // If user navigates via Help button (e.g. `?help=1` or `#help`), scroll to Quick Help panel.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shouldScroll = params.get('help') === '1' || location.hash === '#help';
        if (!shouldScroll) return;

        const timer = setTimeout(() => {
            document.getElementById('quick-help')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);

        return () => clearTimeout(timer);
    }, [location.hash, location.search]);

    const getStatusConfig = () => {
        if (submission) {
            if (submission.status === 'graded') {
                return {
                    label: 'Graded',
                    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
                    icon: CheckCircle
                };
            }
            return {
                label: 'Submitted',
                color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                icon: CheckCircle
            };
        }

        const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date();
        if (isOverdue) {
            return {
                label: 'Overdue',
                color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
                icon: AlertCircle
            };
        }

        return {
            label: 'Pending',
            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
            icon: Clock
        };
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/20 p-0 lg:p-4">
                    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <Skeleton className="size-10 rounded-full" />
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-3/4 max-w-lg" />
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Skeleton className="h-32 rounded-3xl" />
                            <Skeleton className="h-32 rounded-3xl" />
                            <Skeleton className="h-32 rounded-3xl" />
                        </div>
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
                            <CardContent className="p-8 space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!assignment) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertCircle className="size-16 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold text-foreground">Assignment Not Found</h1>
                    <p className="text-muted-foreground mt-2">The assignment you're looking for doesn't exist.</p>
                    <Link to="/student/assignments" className="mt-4">
                        <Button>Back to Assignments</Button>
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const statusConfig = getStatusConfig();
    const StatusIcon = statusConfig.icon;

    return (
        <DashboardLayout>
            <div className="min-h-full bg-slate-50/50 dark:bg-slate-950/20 p-0 sm:p-4 animate-in fade-in duration-500">
                <div className="w-full max-w-none space-y-4 sm:space-y-5 p-4 sm:p-6 lg:px-8 lg:py-4">
                    {/* Title Section */}
                    <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {assignment.title}
                            </h1>
                            <div className="flex flex-col gap-1.5">
                                {assignment.lecturer_name && (
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm">
                                        <User className="size-3.5 sm:size-4 shrink-0" />
                                        <span>Prof. {assignment.lecturer_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex lg:justify-end">
                            <Badge variant="outline" className={cn("w-fit px-4 py-1.5 rounded-full font-bold text-[10px] sm:text-xs border-none shadow-sm capitalize", statusConfig.color)}>
                                <div className="size-1.5 sm:size-2 rounded-full bg-current mr-2 animate-pulse" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                    </div>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                        <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl sm:rounded-3xl overflow-hidden group">
                            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                                <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="size-5 sm:size-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
                                    <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                                        {assignment.due_date ? format(new Date(assignment.due_date), "MMM d") : "No date"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl sm:rounded-3xl overflow-hidden group">
                            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                                <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="size-5 sm:size-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time</p>
                                    <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                                        {assignment.due_date ? format(new Date(assignment.due_date), "h:mm a") : "N/A"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl sm:rounded-3xl overflow-hidden group col-span-2 sm:col-span-1">
                            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 justify-center sm:justify-start">
                                <div className="size-10 sm:size-12 rounded-xl sm:rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                                    <Trophy className="size-5 sm:size-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 text-center sm:text-left">Max Score</p>
                                    <p className="text-sm sm:text-lg font-black text-slate-900 dark:text-white">
                                        {assignment.max_points} pts
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.82fr),minmax(0,1.6fr)] gap-4 sm:gap-6 items-start">
                        <div className="space-y-4 sm:space-y-5 lg:max-w-[720px] xl:max-w-[760px]">
                            {/* Assignment Details */}
                            <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
                                <CardHeader className="p-5 sm:p-6 pb-2">
                                    <CardTitle className="flex items-center gap-3 text-base sm:text-lg font-black">
                                        <FileText className="size-5 text-blue-500" />
                                        Assignment Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 sm:p-6 pt-0 space-y-5">
                                    {assignment.description && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                {assignment.description}
                                            </p>
                                        </div>
                                    )}

                                    {assignment.attachment_url && (
                                        <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resource Material</p>
                                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 group transition-all max-w-[560px]">
                                                <div className="size-10 sm:size-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 dark:border-slate-800">
                                                    <FileText className="size-5 sm:size-6" />
                                                </div>
                                                <div className="flex-1 text-center sm:text-left min-w-0">
                                                    <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                                        {assignment.attachment_name || 'Instructions.pdf'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Support Resource</p>
                                                </div>
                                                <Button
                                                    onClick={() => downloadAssignmentFile(assignment.attachment_path!, assignment.attachment_name || 'Resource', 'assignment-submissions')}
                                                    className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-5 h-10 rounded-xl font-bold gap-2 text-xs"
                                                >
                                                    <Download className="size-3.5" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Submission Section */}
                            {submission ? (
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
                                    <CardHeader className="p-5 sm:p-6 pb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <CardTitle className="flex items-center gap-3 text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle className="size-5" />
                                                Your Submission
                                            </CardTitle>
                                            {new Date(submission.submitted_at) <= new Date(assignment.due_date || submission.submitted_at) && (
                                                <Badge className="w-fit bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black text-[9px] px-3">
                                                    ON TIME
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-xs sm:text-sm font-bold mt-1 uppercase tracking-tight">
                                            Submitted {format(new Date(submission.submitted_at), "MMM d, h:mm a")}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="p-5 sm:p-6 pt-2 space-y-5">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted File</p>
                                            <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 p-3 sm:p-4 transition-all max-w-[560px]">
                                                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                                                    <div className="size-10 sm:size-12 shrink-0 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-800">
                                                        <FileText className="size-5 sm:size-6" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white break-words leading-snug">
                                                                {submission.attachment_name || 'My_Submission.pdf'}
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 bg-slate-900 text-white border-none">
                                                                    {getFileTypeDisplay(submission.file_type) || "PDF"}
                                                                </Badge>
                                                                {submission.file_size && (
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">
                                                                        {formatFileSize(submission.file_size)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => window.open(submission.attachment_url!, '_blank')}
                                                                className="h-9 px-3 sm:px-4 border-slate-200 dark:border-slate-800 rounded-xl font-bold gap-2 text-xs shrink-0"
                                                            >
                                                                <Eye className="size-3.5" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => downloadAssignmentFile(submission.attachment_path!, submission.attachment_name || 'Submission', 'assignment-submissions')}
                                                                className="h-9 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-emerald-500/20 text-xs shrink-0"
                                                            >
                                                                <Download className="size-3.5" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {submission.submission_text && (
                                            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Notes</p>
                                                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 italic text-slate-600 dark:text-slate-300">
                                                    "{submission.submission_text}"
                                                </div>
                                            </div>
                                        )}

                                        {submission.status === 'graded' && (
                                            <div className="pt-8 space-y-8 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                                            <Sparkles className="size-8" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assignment Grade</p>
                                                            <p className="text-3xl font-black text-slate-900 dark:text-white">
                                                                {submission.grade} <span className="text-lg text-slate-400 font-bold">/ {assignment.max_points}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {submission.feedback && (
                                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-full">
                                                            <CheckCircle className="size-4" />
                                                            Graded & Reviewed
                                                        </div>
                                                    )}
                                                </div>

                                                {submission.feedback && (
                                                    <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                                            <MessageSquare className="size-20 sm:size-32" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 relative z-10">
                                                            <MessageSquare className="size-3.5 sm:size-4" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Instructor Feedback</span>
                                                        </div>
                                                        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed italic relative z-10">
                                                            "{submission.feedback}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden text-center p-8 sm:p-10 lg:p-12">
                                    <div className="size-16 sm:size-20 rounded-2xl sm:rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 mx-auto mb-6 animate-bounce">
                                        <Upload className="size-8 sm:size-9" />
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 sm:mb-4">Ready to submit?</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto mb-8 text-sm sm:text-base">
                                        Upload your assignment file to submit your work. Review all instructions before finalizing.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={() => setIsSubmitOpen(true)}
                                        className={cn(
                                            "w-full sm:w-auto h-14 px-10 rounded-2xl font-black text-base gap-3 transition-all active:scale-95 shadow-2xl",
                                            assignment.due_date && new Date(assignment.due_date) < new Date()
                                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                                        )}
                                    >
                                        <Upload className="size-5" />
                                        {assignment.due_date && new Date(assignment.due_date) < new Date()
                                            ? "Submit Late"
                                            : "Submit Now"}
                                    </Button>
                                </Card>
                            )}
                        </div>

                        <AssignmentHelpPanel
                            assignmentId={assignment.id}
                            classId={assignment.class_id}
                            lecturerId={assignment.lecturer_id}
                            assignmentTitle={assignment.title}
                            canCreateRequest
                            useContainerHeight
                            className="lg:h-[min(980px,calc(100vh-220px))]"
                        />
                    </div>
                </div>
            </div>

            {/* Submit Dialog */}
            <SubmitAssignmentDialog
                isOpen={isSubmitOpen}
                onClose={() => setIsSubmitOpen(false)}
                assignment={assignment}
                onSubmit={submitAssignment}
            />
        </DashboardLayout>
    );
}
