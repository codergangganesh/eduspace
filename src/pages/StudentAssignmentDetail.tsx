import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
    ExternalLink
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

interface AssignmentDetail {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    due_date: string | null;
    max_points: number;
    attachment_url: string | null;
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
    attachment_name: string | null;
    file_type: string | null;
    file_size: number | null;
    submission_text: string | null;
    grade: number | null;
    feedback: string | null;
    status: string;
}

export default function StudentAssignmentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { submitAssignment } = useAssignments();

    const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);

    useEffect(() => {
        if (!id || !user) return;

        const fetchAssignmentDetails = async () => {
            setLoading(true);
            try {
                // Fetch assignment
                const { data: assignmentData, error: assignmentError } = await supabase
                    .from('assignments')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (assignmentError) throw assignmentError;

                // Fetch related data
                let className = null;
                let subjectName = null;
                let lecturerName = null;

                if (assignmentData.class_id) {
                    const { data: classData } = await supabase
                        .from('classes')
                        .select('name')
                        .eq('id', assignmentData.class_id)
                        .single();
                    className = classData?.name;
                }

                if (assignmentData.subject_id) {
                    const { data: subjectData } = await supabase
                        .from('subjects')
                        .select('name')
                        .eq('id', assignmentData.subject_id)
                        .single();
                    subjectName = subjectData?.name;
                }

                if (assignmentData.lecturer_id) {
                    const { data: lecturerData } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('user_id', assignmentData.lecturer_id)
                        .single();
                    lecturerName = lecturerData?.full_name;
                }

                setAssignment({
                    ...assignmentData,
                    class_name: className,
                    subject_name: subjectName,
                    lecturer_name: lecturerName,
                });

                // Fetch student's submission
                const { data: submissionData } = await supabase
                    .from('assignment_submissions')
                    .select('*, file_type, file_size')
                    .eq('assignment_id', id)
                    .eq('student_id', user.id)
                    .single();

                setSubmission(submissionData || null);
            } catch (err) {
                console.error('Error fetching assignment details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetails();

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
                async (payload) => {
                    console.log('[StudentAssignmentDetail] Submission update:', payload);
                    if (payload.new && 'student_id' in payload.new && payload.new.student_id === user.id) {
                        setSubmission(payload.new as Submission);
                    }
                }
            )
            .subscribe();

        return () => {
            submissionSubscription.unsubscribe();
        };
    }, [id, user]);

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
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="size-8 animate-spin text-primary" />
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
            <div className="flex flex-col gap-6 max-w-4xl">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Link to="/student/assignments">
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {assignment.class_name && (
                                <Badge variant="secondary" className="text-xs">
                                    {assignment.class_name}
                                </Badge>
                            )}
                            {assignment.subject_name && (
                                <Badge variant="outline" className="text-xs">
                                    {assignment.subject_name}
                                </Badge>
                            )}
                            <Badge variant="outline" className={cn("text-xs gap-1", statusConfig.color)}>
                                <StatusIcon className="size-3" />
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{assignment.title}</h1>
                        {assignment.lecturer_name && (
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <User className="size-4" />
                                {assignment.lecturer_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-surface">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Due Date</p>
                                <p className="font-medium text-foreground">
                                    {assignment.due_date
                                        ? format(new Date(assignment.due_date), "MMM d, yyyy")
                                        : "No due date"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Due Time</p>
                                <p className="font-medium text-foreground">
                                    {assignment.due_date
                                        ? format(new Date(assignment.due_date), "h:mm a")
                                        : "N/A"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-surface">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BookOpen className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Points</p>
                                <p className="font-medium text-foreground">
                                    {submission?.grade !== null && submission?.grade !== undefined
                                        ? `${submission.grade} / ${assignment.max_points}`
                                        : `${assignment.max_points} pts`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assignment Details */}
                <Card className="bg-surface">
                    <CardHeader>
                        <CardTitle className="text-lg">Assignment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {assignment.description && (
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
                            </div>
                        )}

                        {assignment.instructions && (
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-2">Instructions</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{assignment.instructions}</p>
                            </div>
                        )}

                        {/* Lecturer's Attached File */}
                        {assignment.attachment_url && (
                            <div className="pt-4 border-t border-border">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Assignment File</h3>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="size-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {assignment.attachment_name || 'Assignment File'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Click to download</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(assignment.attachment_url!, '_blank')}
                                    >
                                        <Download className="size-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submission Section */}
                <Card className={cn(
                    "bg-surface",
                    submission && "border-green-200 dark:border-green-800"
                )}>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            {submission ? (
                                <>
                                    <CheckCircle className="size-5 text-green-500" />
                                    Your Submission
                                </>
                            ) : (
                                <>
                                    <Upload className="size-5 text-primary" />
                                    Submit Your Work
                                </>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {submission ? (
                            <div className="space-y-4">
                                {/* Submission Status */}
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="size-4 text-green-500" />
                                    <span className="text-muted-foreground">
                                        Submitted on {format(new Date(submission.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                                    </span>
                                </div>

                                {/* Submitted File */}
                                {submission.attachment_url && (
                                    <div className="flex flex-col gap-2">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Submitted File</h4>
                                        <div className="flex items-center justify-between p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 group hover:border-emerald-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-emerald-100 dark:border-emerald-800">
                                                    <FileText className="size-6 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 truncate max-w-[200px] sm:max-w-[300px]" title={submission.attachment_name || 'Submitted File'}>
                                                        {submission.attachment_name || 'Submitted File'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                                        <span>{getFileTypeDisplay(submission.file_type) || getFileExtension(submission.attachment_name) || 'PDF'}</span>
                                                        {submission.file_size && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{formatFileSize(submission.file_size)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                                    onClick={() => window.open(submission.attachment_url!, '_blank')}
                                                >
                                                    <ExternalLink className="size-4 mr-2" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none h-9 px-4 hidden sm:flex"
                                                    asChild
                                                >
                                                    <a href={submission.attachment_url!} target="_blank" rel="noreferrer" download>
                                                        <Download className="size-4 mr-2" />
                                                        Download
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submission Text */}
                                {submission.submission_text && (
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-1">Your Notes</h4>
                                        <p className="text-sm text-muted-foreground">{submission.submission_text}</p>
                                    </div>
                                )}

                                {/* Grade & Feedback */}
                                {submission.status === 'graded' && (
                                    <div className="pt-4 border-t border-border space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">Grade</span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                {submission.grade} / {assignment.max_points}
                                            </span>
                                        </div>
                                        {submission.feedback && (
                                            <div>
                                                <h4 className="text-sm font-medium text-foreground mb-1">Lecturer's Feedback</h4>
                                                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                                                    {submission.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Upload className="size-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    Ready to submit?
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Upload your assignment file to submit your work. Make sure to review all
                                    requirements before submitting.
                                </p>
                                <Button
                                    size="lg"
                                    onClick={() => setIsSubmitOpen(true)}
                                    className={cn(
                                        assignment.due_date && new Date(assignment.due_date) < new Date()
                                            ? "bg-red-500 hover:bg-red-600"
                                            : ""
                                    )}
                                >
                                    <Upload className="size-4 mr-2" />
                                    {assignment.due_date && new Date(assignment.due_date) < new Date()
                                        ? "Submit Late"
                                        : "Submit Assignment"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>


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
