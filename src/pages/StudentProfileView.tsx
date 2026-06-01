import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    BookOpen,
    BarChart2,
    Calendar,
    Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function StudentProfileView() {
    const { classId, enrollmentId } = useParams<{ classId: string; enrollmentId: string }>();
    const navigate = useNavigate();

    // Fetch student info from class_students
    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ['student-profile', enrollmentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_students')
                .select('*')
                .eq('id', enrollmentId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!enrollmentId,
    });

    // Fetch attendance stats
    const { data: attendanceData } = useQuery({
        queryKey: ['student-attendance-stats', enrollmentId, classId],
        queryFn: async () => {
            const { data: sessions } = await supabase
                .from('attendance_sessions')
                .select('id, session_date, title')
                .eq('class_id', classId!)
                .order('session_date', { ascending: false });

            const { data: records } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('enrollment_id', enrollmentId!);

            const sessionCount = sessions?.length || 0;
            const recordMap = new Map((records || []).map(r => [r.session_id, r]));

            const attended = (records || []).filter(r => r.status === 'present' || r.status === 'late').length;
            const percentage = sessionCount > 0 ? Math.round((attended / sessionCount) * 100) : 0;

            const sessionList = (sessions || []).slice(0, 10).map(s => ({
                ...s,
                status: recordMap.get(s.id)?.status || 'absent',
            }));

            return { sessionCount, attended, percentage, sessionList };
        },
        enabled: !!enrollmentId && !!classId,
    });

    // Fetch submission history for this class
    const { data: submissions } = useQuery({
        queryKey: ['student-submissions', enrollmentId, classId],
        queryFn: async () => {
            // Get all assignments for this class
            const { data: assignments } = await supabase
                .from('assignments')
                .select('id, title, due_date, max_points')
                .eq('class_id', classId!);

            if (!assignments || !student) return [];

            const assignmentIds = assignments.map(a => a.id);

            const { data: subs } = await supabase
                .from('assignment_submissions')
                .select('assignment_id, submitted_at, status, grade')
                .in('assignment_id', assignmentIds)
                .eq('student_id', student.student_id || '');

            const subMap = new Map((subs || []).map(s => [s.assignment_id, s]));

            return assignments.map(a => ({
                ...a,
                submission: subMap.get(a.id) || null,
            }));
        },
        enabled: !!classId && !!student,
    });

    const isLoading = studentLoading;

    const getStatusColor = (pct: number) => {
        if (pct >= 75) return 'text-emerald-500';
        if (pct >= 50) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getStatusBg = (pct: number) => {
        if (pct >= 75) return 'bg-emerald-500';
        if (pct >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const attendanceStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <CheckCircle2 className="size-3.5 text-emerald-500" />;
            case 'late': return <Clock className="size-3.5 text-amber-500" />;
            case 'excused': return <BookOpen className="size-3.5 text-blue-500" />;
            default: return <XCircle className="size-3.5 text-rose-400" />;
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-10 animate-in fade-in duration-300">

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="size-4" /> Back to Students
                </button>

                {/* Profile Header */}
                <Card className="overflow-hidden border-none shadow-xl">
                    <div className="h-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 relative">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                    </div>
                    <CardContent className="px-6 pb-6 -mt-10 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                            <Avatar className="size-20 border-4 border-background shadow-xl">
                                <AvatarImage src={student?.student_image_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-2xl font-black">
                                    {student?.student_name?.substring(0, 2).toUpperCase() || '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 pb-1">
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-7 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-black text-foreground">{student?.student_name || 'Unknown Student'}</h1>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                                                <Hash className="size-3" />
                                                {student?.register_number || 'N/A'}
                                            </span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-xs text-muted-foreground font-semibold">{student?.email || 'No email'}</span>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px] font-bold uppercase ml-auto',
                                                    student?.student_id
                                                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                )}
                                            >
                                                {student?.student_id ? 'Account Linked' : 'Pending'}
                                            </Badge>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Academic & Contact Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-border/50 shadow-md bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                                <BookOpen className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Department</p>
                                <p className="text-xs font-black mt-0.5 truncate">{student?.department || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                <Calendar className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Year / Sem</p>
                                <p className="text-xs font-black mt-0.5 truncate">
                                    {student?.year ? `Year ${student.year}` : 'N/A'} 
                                    {student?.section ? ` (Sec ${student.section})` : ''}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <FileText className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Course</p>
                                <p className="text-xs font-black mt-0.5 truncate">{student?.course || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-md bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <span className="font-bold text-xs">📞</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Contact</p>
                                <p className="text-xs font-black mt-0.5 truncate">{student?.phone || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Panel */}
                    <Card className="shadow-lg border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-indigo-500/10 rounded-xl">
                                    <BarChart2 className="size-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base">Attendance</h2>
                                    <p className="text-xs text-muted-foreground">Last 10 sessions</p>
                                </div>
                                {attendanceData && (
                                    <span className={cn('ml-auto text-3xl font-black', getStatusColor(attendanceData.percentage))}>
                                        {attendanceData.percentage}%
                                    </span>
                                )}
                            </div>

                            {/* Progress bar */}
                            {attendanceData && (
                                <div className="mb-4">
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all duration-700', getStatusBg(attendanceData.percentage))}
                                            style={{ width: `${attendanceData.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-wide">
                                        <span>{attendanceData.attended} attended</span>
                                        <span>{attendanceData.sessionCount} total sessions</span>
                                    </div>
                                </div>
                            )}

                            {/* Session list */}
                            <div className="space-y-1.5">
                                {attendanceData?.sessionList?.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        {attendanceStatusIcon(s.status)}
                                        <span className="text-xs font-medium flex-1 truncate">{s.title || 'Session'}</span>
                                        <span className="text-[10px] text-muted-foreground font-bold">
                                            {s.session_date ? format(new Date(s.session_date), 'MMM d') : ''}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-[9px] font-bold uppercase px-1.5 py-0 capitalize',
                                                s.status === 'present' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                                                s.status === 'late' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                                                s.status === 'excused' && 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                                                s.status === 'absent' && 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                                            )}
                                        >
                                            {s.status}
                                        </Badge>
                                    </div>
                                )) || (
                                    <p className="text-xs text-muted-foreground text-center py-6 italic">No sessions recorded yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments Panel */}
                    <Card className="shadow-lg border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-violet-500/10 rounded-xl">
                                    <FileText className="size-5 text-violet-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base">Assignments</h2>
                                    <p className="text-xs text-muted-foreground">
                                        {submissions?.filter(s => s.submission).length || 0} submitted of {submissions?.length || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {submissions?.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                                        <div className={cn(
                                            'size-8 rounded-lg flex items-center justify-center shrink-0',
                                            a.submission ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                        )}>
                                            {a.submission
                                                ? <CheckCircle2 className="size-4 text-emerald-500" />
                                                : <XCircle className="size-4 text-rose-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{a.title}</p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="size-3" />
                                                {a.due_date ? format(new Date(a.due_date), 'MMM d, yyyy') : 'No due date'}
                                            </p>
                                        </div>
                                        {a.submission?.grade ? (
                                            <span className="font-black text-sm text-primary">
                                                {a.submission.grade}/{a.max_points || 100}
                                            </span>
                                        ) : a.submission ? (
                                            <Badge variant="outline" className="text-[9px] font-bold bg-indigo-500/10 text-indigo-600 border-indigo-500/20">Submitted</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[9px] font-bold bg-rose-500/10 text-rose-600 border-rose-500/20">Missing</Badge>
                                        )}
                                    </div>
                                )) || (
                                    <p className="text-xs text-muted-foreground text-center py-6 italic">No assignments in this class</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
