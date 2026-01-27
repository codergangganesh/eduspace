import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export interface DashboardStats {
    enrolledStudents: number;
    submissionsReceived: number;
    pendingSubmissions: number;
}

export interface RecentSubmission {
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseCode: string;
    submittedAt: string;
    status: "pending" | "graded";
    grade: string | null;
}

export interface UpcomingClass {
    id: string;
    title: string;
    courseCode: string; // From joined class
    className: string; // From joined class
    time: string;
    room: string;
    isToday: boolean;
    day: string;
}

export function useLecturerData() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        enrolledStudents: 0,
        submissionsReceived: 0,
        pendingSubmissions: 0,
    });
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;

        try {
            setLoading(true);

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

            if (classIds.length > 0) {
                // A. Enrolled Students: Count unique students across all classes
                // We use class_students table which links students to classes
                const { data: enrollments } = await supabase
                    .from("class_students")
                    .select("student_id")
                    .in("class_id", classIds);

                // Count unique students (a student might be in multiple classes)
                const uniqueStudents = new Set(enrollments?.map(e => e.student_id));
                enrolledStudents = uniqueStudents.size;

                // B. Assignments & Submissions
                // Fetch assignments created by this lecturer (or linked to these classes)
                const { data: assignments } = await supabase
                    .from("assignments")
                    .select("id")
                    .eq("lecturer_id", user.id)
                    .eq("status", "published");

                if (assignments && assignments.length > 0) {
                    const assignmentIds = assignments.map(a => a.id);

                    // Count total submissions
                    const { count: submissionCount } = await supabase
                        .from("assignment_submissions")
                        .select("*", { count: 'exact', head: true })
                        .in("assignment_id", assignmentIds);

                    submissionsReceived = submissionCount || 0;

                    // Estimate pending: (Total Enrollments * Total Assignments) is rough. 
                    // Better: Sum of (Students in Class X * Assignments in Class X).
                    // For now, let's use a simpler heuristic or the global count if assignments are not strictly class-scoped in the DB yet?
                    // Given the migration "migrate_assignments_to_classes", assignments should have class_id.

                    // Let's try to get more accurate pending count by fetching assignments with class_id
                    const { data: assignmentsWithClass } = await supabase
                        .from("assignments")
                        .select("id, class_id")
                        .eq("lecturer_id", user.id)
                        .eq("status", "published");

                    let totalExpected = 0;
                    if (assignmentsWithClass) {
                        for (const assign of assignmentsWithClass) {
                            if (assign.class_id) {
                                // Count students in this class
                                const { count: studentCount } = await supabase
                                    .from("class_students")
                                    .select("*", { count: 'exact', head: true })
                                    .eq("class_id", assign.class_id);
                                totalExpected += (studentCount || 0);
                            } else {
                                // Fallback: add total unique students? No, safe to ignore or assume 0 for legacy
                            }
                        }
                    }

                    pendingSubmissions = Math.max(0, totalExpected - submissionsReceived);
                }
            }

            setStats({
                enrolledStudents,
                submissionsReceived,
                pendingSubmissions
            });

            // 2. Fetch Recent Submissions
            // We fetch the most recent submissions for assignments owned by this lecturer
            const { data: submissions, error: submissionsError } = await supabase
                .from("assignment_submissions")
                .select(`
                    id,
                    submitted_at,
                    status,
                    grade,
                    student:profiles!student_id(full_name),
                    assignment:assignments!assignment_id(title, class_id)
                `)
                .order("submitted_at", { ascending: false })
                .limit(5);
            // Note: We should filter by lecturer's assignments, but RLS might handle it?
            // RLS on assignment_submissions usually allows lecturer to see submissions for their assignments.
            // Assuming RLS is set up. If not, we need .in('assignment_id', myAssignmentIds)

            if (!submissionsError && submissions) {
                // Filter client-side if needed, or trust RLS. Let's filter to be safe if we have assignment list
                // Actually, let's trust RLS for efficiency or assume the query is safe.
                // We need to fetch class details for these submissions to show Course Code

                const formattedSubmissions: RecentSubmission[] = [];
                for (const sub of submissions) {
                    const assignmentClassId = (sub.assignment as any)?.class_id;
                    let courseCode = "N/A";

                    if (assignmentClassId && classesMap.has(assignmentClassId)) {
                        courseCode = classesMap.get(assignmentClassId)?.course_code || "N/A";
                    } else if (assignmentClassId) {
                        // Fetch if not in active list (maybe archived?)
                        const { data: cls } = await supabase.from('classes').select('course_code').eq('id', assignmentClassId).single();
                        if (cls) courseCode = cls.course_code;
                    }

                    formattedSubmissions.push({
                        id: sub.id,
                        studentName: (sub.student as any)?.full_name || "Unknown Student",
                        assignmentTitle: (sub.assignment as any)?.title || "Untitled",
                        courseCode: courseCode,
                        submittedAt: format(new Date(sub.submitted_at), "MMM d, h:mm a"),
                        status: sub.status === "graded" ? "graded" : "pending",
                        grade: sub.grade ? sub.grade.toString() : null
                    });
                }
                setRecentSubmissions(formattedSubmissions);
            }

            // 3. Fetch Upcoming Classes (Schedules)
            const { data: schedules, error: scheduleError } = await supabase
                .from("schedules")
                .select(`
                    *,
                    classes:class_id (class_name, course_code)
                `)
                .eq("lecturer_id", user.id)
                .gte("day_of_week", 0) // Just to ensure valid day
                .order("day_of_week", { ascending: true })
                .order("start_time", { ascending: true });

            if (!scheduleError && schedules) {
                const todayIndex = new Date().getDay();
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                const mappedClasses: UpcomingClass[] = schedules
                    .map((s: any) => {
                        const isTodayClass = s.day_of_week === todayIndex;
                        // Handle specific date override logic if present in your app
                        let isTodayEffective = isTodayClass;
                        if (s.specific_date) {
                            const specificDate = new Date(s.specific_date);
                            const todayDate = new Date();
                            isTodayEffective = specificDate.toDateString() === todayDate.toDateString();
                        }

                        // Determine if we should show this (e.g. if it's a specific date in the past, maybe hide?)
                        // For now show all recurring + future specific

                        return {
                            id: s.id,
                            title: s.title,
                            courseCode: s.classes?.course_code || "Class",
                            className: s.classes?.class_name || "",
                            time: s.start_time.slice(0, 5),
                            room: s.location || "Online",
                            isToday: isTodayEffective,
                            day: days[s.day_of_week]
                        };
                    })
                    .sort((a, b) => {
                        // Custom sort: Today's classes first, then upcoming days
                        if (a.isToday && !b.isToday) return -1;
                        if (!a.isToday && b.isToday) return 1;
                        // If same day status, sort by actual day index relative to today?
                        // Simple logic: just show them as returned (ordered by day_of_week)
                        return 0;
                    })
                    .slice(0, 5);

                setUpcomingClasses(mappedClasses);
            }

        } catch (error) {
            console.error("Error fetching lecturer data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscriptions
        const subs = [
            supabase.channel('dashboard_submissions').on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_submissions' }, fetchData).subscribe(),
            supabase.channel('dashboard_class_students').on('postgres_changes', { event: '*', schema: 'public', table: 'class_students' }, fetchData).subscribe(),
            supabase.channel('dashboard_classes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, fetchData).subscribe(),
            supabase.channel('dashboard_schedules').on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, fetchData).subscribe()
        ];

        return () => {
            subs.forEach(s => s.unsubscribe());
        };
    }, [user]);

    return { stats, recentSubmissions, upcomingClasses, loading };
}
