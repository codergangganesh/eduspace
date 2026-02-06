import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

export interface DashboardStats {
    enrolledStudents: number;
    submissionsReceived: number;
    pendingSubmissions: number;
    totalExpectedSubmissions: number; // For "X / Y" format display
}

export interface ActiveTaskSummary {
    id: string;
    title: string;
    type: 'assignment' | 'quiz';
    courseCode: string;
    className: string;
    submittedCount: number;
    totalStudents: number;
    dueDate?: string | null;
}

export interface RecentActivity {
    id: string;
    studentName: string;
    assignmentTitle: string; // Used for quiz title too
    courseCode: string;
    className: string;
    submittedAt: string;
    status: "pending" | "graded" | "submitted" | "passed" | "failed";
    grade: string | null;
    classId?: string;
    assignmentId?: string; // Used for quizId too
    quizId?: string;
    type: 'assignment' | 'quiz';
    action?: 'submitted' | 'updated' | 'deleted';
}
// ... (keep existing code until line 170)


export interface UpcomingClass {
    id: string;
    title: string;
    courseCode: string; // From joined class
    className: string; // From joined class
    time: string;
    room: string;
    isToday: boolean;
    day: string;
    classId?: string;
}

export function useLecturerData() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        enrolledStudents: 0,
        submissionsReceived: 0,
        pendingSubmissions: 0,
        totalExpectedSubmissions: 0,
    });
    const [recentSubmissions, setRecentSubmissions] = useState<RecentActivity[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
    const [totalTasks, setTotalTasks] = useState<ActiveTaskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // silentRefresh: when true, don't trigger loading state (for real-time updates)
    const fetchData = async (silentRefresh = false) => {
        if (!user) return;

        try {
            // Only show loading spinner on initial load, not on real-time updates
            if (!silentRefresh && isInitialLoad) {
                setLoading(true);
            }

            // 1. Fetch Lecturer's Active Classes
            const { data: classes, error: classesError } = await supabase
                .from("classes")
                .select("id, course_code, class_name")
                .eq("lecturer_id", user.id)
                .eq("is_active", true);

            if (classesError) throw classesError;

            const classIds = classes.map(c => c.id);
            const classesMap = new Map(classes.map(c => [c.id, c]));

            let enrolledStudents = 0;
            let submissionsReceived = 0;
            let pendingSubmissions = 0;
            let totalExpectedSubmissions = 0;
            const allActivities: RecentActivity[] = [];

            // Pre-fetch all IDs needed for counts and activity
            let allAssignmentIds: string[] = [];
            const { data: directAssignments } = await supabase.from("assignments").select("id, class_id").eq("lecturer_id", user.id);
            if (directAssignments) allAssignmentIds = directAssignments.map(a => a.id);
            if (classIds.length > 0) {
                const { data: classAssignments } = await supabase.from("assignments").select("id, class_id").in("class_id", classIds);
                if (classAssignments) allAssignmentIds = [...new Set([...allAssignmentIds, ...classAssignments.map(a => a.id)])];
            }

            let lecturerQuizIds: string[] = [];
            const { data: directQuizzes } = await supabase.from("quizzes").select("id, class_id").eq("lecturer_id", user.id);
            if (directQuizzes) lecturerQuizIds = directQuizzes.map(q => q.id);
            if (classIds.length > 0) {
                const { data: classQuizzes } = await supabase.from("quizzes").select("id, class_id").in("class_id", classIds);
                if (classQuizzes) lecturerQuizIds = [...new Set([...lecturerQuizIds, ...classQuizzes.map(q => q.id)])];
            }

            if (classIds.length > 0) {
                // A. Enrolled Students
                const { data: acceptedEnrollments } = await supabase.from("access_requests").select("student_id, class_id").in("class_id", classIds).eq("status", "accepted");
                const uniqueStudents = new Set(acceptedEnrollments?.map(e => e.student_id));
                enrolledStudents = uniqueStudents.size;

                const classStudentCounts = new Map<string, number>();
                acceptedEnrollments?.forEach(e => {
                    if (e.class_id) classStudentCounts.set(e.class_id, (classStudentCounts.get(e.class_id) || 0) + 1);
                });

                const taskSummaries: ActiveTaskSummary[] = [];

                // B. Assignments Stats
                if (allAssignmentIds.length > 0) {
                    const { count: submissionCount } = await supabase.from("assignment_submissions").select("*", { count: 'exact', head: true }).in("assignment_id", allAssignmentIds);
                    submissionsReceived = (submissionCount || 0);

                    const { data: assignmentDetails } = await supabase.from("assignments").select("id, title, class_id, due_date").in("id", allAssignmentIds).or("status.eq.published,status.eq.active,status.eq.completed,status.eq.closed");

                    for (const a of assignmentDetails || []) {
                        if (a.class_id && classStudentCounts.has(a.class_id)) {
                            totalExpectedSubmissions += classStudentCounts.get(a.class_id) || 0;

                            const { count } = await supabase.from("assignment_submissions").select("*", { count: 'exact', head: true }).eq("assignment_id", a.id);
                            const classInfo = classesMap.get(a.class_id);
                            taskSummaries.push({
                                id: a.id,
                                title: a.title,
                                type: 'assignment',
                                courseCode: classInfo?.course_code || 'N/A',
                                className: classInfo?.class_name || 'Class',
                                submittedCount: count || 0,
                                totalStudents: classStudentCounts.get(a.class_id) || 0,
                                dueDate: a.due_date
                            });
                        }
                    }
                }

                // C. Quizzes Stats (Used only for Active Tasks summary now, not global stats)
                if (lecturerQuizIds.length > 0) {
                    const { data: quizDetails } = await supabase.from("quizzes").select("id, title, class_id").in("id", lecturerQuizIds).eq("status", "published");

                    for (const q of quizDetails || []) {
                        if (q.class_id && classStudentCounts.has(q.class_id)) {
                            const { count } = await supabase.from("quiz_submissions").select("*", { count: 'exact', head: true }).eq("quiz_id", q.id);
                            const classInfo = classesMap.get(q.class_id);
                            taskSummaries.push({
                                id: q.id,
                                title: q.title,
                                type: 'quiz',
                                courseCode: classInfo?.course_code || 'N/A',
                                className: classInfo?.class_name || 'Class',
                                submittedCount: count || 0,
                                totalStudents: classStudentCounts.get(q.class_id) || 0
                            });
                        }
                    }
                }
                setTotalTasks(taskSummaries);
            }

            pendingSubmissions = Math.max(0, totalExpectedSubmissions - submissionsReceived);

            setStats({
                enrolledStudents,
                submissionsReceived,
                pendingSubmissions,
                totalExpectedSubmissions
            });

            // 2. Fetch Recent Activity for Feed
            if (allAssignmentIds.length > 0) {
                const { data: submissions } = await supabase.from("assignment_submissions").select(`
                    id, assignment_id, submitted_at, status, grade,
                    student:profiles!student_id(full_name),
                    assignment:assignments!assignment_id(id, title, class_id)
                `).in("assignment_id", allAssignmentIds).order("submitted_at", { ascending: false }).limit(10);

                // Assignment activity only
                submissions?.forEach(sub => {
                    const assignmentData = sub.assignment as any;
                    const classId = assignmentData?.class_id;
                    allActivities.push({
                        id: sub.id,
                        studentName: (sub.student as any)?.full_name || "Unknown Student",
                        assignmentTitle: assignmentData?.title || "Untitled",
                        courseCode: classId && classesMap.has(classId) ? classesMap.get(classId)?.course_code || "N/A" : "N/A",
                        className: classId && classesMap.has(classId) ? classesMap.get(classId)?.class_name || "Unknown Class" : "Unknown Class",
                        submittedAt: sub.submitted_at,
                        status: sub.status === "graded" ? "graded" : "pending",
                        grade: sub.grade ? sub.grade.toString() : null,
                        classId: classId,
                        assignmentId: assignmentData?.id || sub.assignment_id,
                        type: 'assignment'
                    });
                });
            }

            const finalActivities = allActivities
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .slice(0, 10)
                .map(act => ({ ...act, submittedAt: format(new Date(act.submittedAt), "MMM d, h:mm a") }));

            setRecentSubmissions(finalActivities);

            // 3. Fetch Upcoming Classes
            const { data: schedules } = await supabase.from("schedules").select(`*, classes:class_id(class_name, course_code)`).eq("lecturer_id", user.id).order("day_of_week", { ascending: true }).order("start_time", { ascending: true });
            if (schedules) {
                const todayIndex = new Date().getDay();
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const mappedClasses: UpcomingClass[] = schedules.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    courseCode: s.classes?.course_code || "Class",
                    className: s.classes?.class_name || "",
                    time: s.start_time.slice(0, 5),
                    room: s.location || "Online",
                    isToday: s.day_of_week === todayIndex,
                    day: days[s.day_of_week],
                    classId: s.class_id
                })).sort((a, b) => a.isToday === b.isToday ? 0 : a.isToday ? -1 : 1).slice(0, 5);
                setUpcomingClasses(mappedClasses);
            }

        } catch (error) {
            console.error("Error fetching lecturer data:", error);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchData();
        const silentFetch = () => fetchData(true);

        const assignmentChannel = supabase.channel('dashboard_assignments').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assignment_submissions' }, async (payload) => {
            const submission = payload.new as any;
            try {
                const { data: studentData } = await supabase.from('profiles').select('full_name').eq('user_id', submission.student_id).single();
                const { data: assignmentData } = await supabase.from('assignments').select('title, class_id').eq('id', submission.assignment_id).single();
                if (assignmentData) {
                    const { data: classData } = await supabase.from('classes').select('class_name, course_code').eq('id', assignmentData.class_id).single();
                    const newActivity: RecentActivity = {
                        id: submission.id,
                        studentName: studentData?.full_name || 'Unknown Student',
                        assignmentTitle: assignmentData?.title || 'Unknown Assignment',
                        courseCode: classData?.course_code || 'N/A',
                        className: classData?.class_name || 'Unknown Class',
                        submittedAt: format(new Date(), "MMM d, h:mm a"),
                        status: submission.status,
                        grade: submission.grade,
                        assignmentId: submission.assignment_id,
                        classId: assignmentData.class_id,
                        type: 'assignment',
                        action: 'submitted'
                    };
                    setStats(prev => ({ ...prev, submissionsReceived: prev.submissionsReceived + 1, pendingSubmissions: Math.max(0, prev.pendingSubmissions - 1) }));
                    setRecentSubmissions(prev => [newActivity, ...prev.slice(0, 9)]);
                    toast.success(`New Submission: ${studentData?.full_name}`, { description: `Submitted ${assignmentData?.title}` });
                }
            } catch (err) { silentFetch(); }
        }).subscribe();

        const quizChannel = supabase.channel('dashboard_quizzes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quiz_submissions' }, async (payload) => {
            const submission = payload.new as any;
            try {
                const { data: studentData } = await supabase.from('profiles').select('full_name').eq('user_id', submission.student_id).single();
                const { data: quizData } = await supabase.from('quizzes').select('title, class_id').eq('id', submission.quiz_id).single();
                if (quizData) {
                    const { data: classData } = await supabase.from('classes').select('class_name, course_code').eq('id', quizData.class_id).single();
                    const newActivity: RecentActivity = {
                        id: submission.id,
                        studentName: studentData?.full_name || 'Unknown Student',
                        assignmentTitle: quizData?.title || 'Unknown Quiz',
                        courseCode: classData?.course_code || 'N/A',
                        className: classData?.class_name || 'Unknown Class',
                        submittedAt: format(new Date(), "MMM d, h:mm a"),
                        status: submission.status,
                        grade: submission.total_obtained?.toString() || null,
                        quizId: submission.quiz_id,
                        classId: quizData.class_id,
                        type: 'quiz',
                        action: 'submitted'
                    };
                    toast.success(`Quiz Completed: ${studentData?.full_name}`, { description: `Finished ${quizData?.title}` });
                }
            } catch (err) { silentFetch(); }
        }).subscribe();

        const subs = [
            supabase.channel('dashboard_class_students').on('postgres_changes', { event: '*', schema: 'public', table: 'class_students' }, silentFetch).subscribe(),
            supabase.channel('dashboard_classes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, silentFetch).subscribe(),
            supabase.channel('dashboard_schedules').on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, silentFetch).subscribe(),
            supabase.channel('dashboard_access_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, silentFetch).subscribe()
        ];

        return () => {
            assignmentChannel.unsubscribe();
            quizChannel.unsubscribe();
            subs.forEach(s => s.unsubscribe());
        };
    }, [user]);

    return { stats, recentSubmissions, upcomingClasses, activeTasks: totalTasks, loading };
}
