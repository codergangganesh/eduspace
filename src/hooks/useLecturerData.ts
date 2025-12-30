import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, parseISO } from "date-fns";

export interface DashboardStats {
    totalStudents: number;
    pendingReviews: number;
    avgPerformance: string;
}

export interface RecentSubmission {
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseCode: string; // derived from course title or code
    submittedAt: string;
    status: "pending" | "graded";
    grade: string | null;
}

export interface UpcomingClass {
    id: string;
    title: string;
    courseCode: string;
    time: string;
    room: string;
    isToday: boolean;
    day: string;
}

export function useLecturerData() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        pendingReviews: 0,
        avgPerformance: "0%",
    });
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Stats
                // A. Total Students: Count enrollments in courses taught by this lecturer
                const { count: studentCount, error: studentError } = await supabase
                    .from("course_enrollments")
                    .select("student_id", { count: "exact", head: true })
                    .eq("courses.lecturer_id", user.id) // This requires a join or separate fetch if FK not straightforward
                    // The issue is course_enrollments relates to courses to lecturer.
                    // Let's optimize: fetch courses first.
                    ;

                // Fetch Lecturer's Courses
                const { data: courses, error: coursesError } = await supabase
                    .from("courses")
                    .select("id, course_code, title")
                    .eq("lecturer_id", user.id);

                if (coursesError) throw coursesError;
                const courseIds = courses.map(c => c.id);

                let totalStudents = 0;
                if (courseIds.length > 0) {
                    const { count } = await supabase
                        .from("course_enrollments")
                        .select("student_id", { count: "exact", head: true })
                        .in("course_id", courseIds);
                    totalStudents = count || 0;
                }

                // B. Pending Reviews: Check submissions for assignments in these courses
                let pendingReviews = 0;
                let avgPerformance = "0%";

                // Get assignments for these courses
                const { data: assignments, error: assignmentsError } = await supabase
                    .from("assignments")
                    .select("id")
                    .in("course_id", courseIds);

                if (!assignmentsError && assignments && assignments.length > 0) {
                    const assignmentIds = assignments.map(a => a.id);

                    // Count pending
                    const { count: pendingCount } = await supabase
                        .from("assignment_submissions")
                        .select("id", { count: "exact", head: true })
                        .in("assignment_id", assignmentIds)
                        .eq("status", "pending");
                    pendingReviews = pendingCount || 0;

                    // Avg Performance (from graded submissions)
                    const { data: grades } = await supabase
                        .from("assignment_submissions")
                        .select("grade")
                        .in("assignment_id", assignmentIds)
                        .not("grade", "is", null);

                    if (grades && grades.length > 0) {
                        const total = grades.reduce((acc, curr) => acc + (curr.grade || 0), 0);
                        avgPerformance = Math.round(total / grades.length) + "%";
                    }
                }

                setStats({
                    totalStudents,
                    pendingReviews,
                    avgPerformance
                });

                // 2. Fetch Recent Submissions
                if (courses.length > 0) {
                    const { data: submissions, error: submissionsError } = await supabase
                        .from("assignment_submissions")
                        .select(`
                    id,
                    submitted_at,
                    status,
                    grade,
                    student:profiles!student_id(full_name),
                    assignment:assignments!assignment_id(title, course_id)
                `)
                        // Filter indirectly by joining? Supabase filtering on deep relation is tricky. 
                        // Easier to filter by assignment IDs we already fetched.
                        .in("assignment_id", assignments?.map(a => a.id) || [])
                        .order("submitted_at", { ascending: false })
                        .limit(5);

                    if (!submissionsError && submissions) {
                        const formattedSubmissions: RecentSubmission[] = submissions.map((sub: any) => {
                            const course = courses.find(c => c.id === sub.assignment.course_id);
                            return {
                                id: sub.id,
                                studentName: sub.student?.full_name || "Unknown Student",
                                assignmentTitle: sub.assignment?.title || "Untitled Assignment",
                                courseCode: course?.course_code || "N/A",
                                submittedAt: format(new Date(sub.submitted_at), "MMM d, h:mm a"),
                                status: sub.status === "graded" ? "graded" : "pending",
                                grade: sub.grade ? sub.grade.toString() : null
                            };
                        });
                        setRecentSubmissions(formattedSubmissions);
                    }
                }

                // 3. Fetch Upcoming Classes
                // Assuming schedules table has lecturer_id directly
                const { data: schedules, error: scheduleError } = await supabase
                    .from("schedules")
                    .select("*")
                    .eq("lecturer_id", user.id)
                    .order("day_of_week", { ascending: true }) // Simplified ordering
                    .order("start_time", { ascending: true });

                if (!scheduleError && schedules) {
                    const todayIndex = new Date().getDay();
                    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                    // Filter and map
                    const mappedClasses: UpcomingClass[] = schedules
                        .map(s => {
                            const isTodayClass = s.day_of_week === todayIndex;
                            return {
                                id: s.id,
                                title: s.title,
                                courseCode: s.title.split(":")[0] || "Class", // Heuristic if code not in title
                                time: s.start_time.slice(0, 5), // HH:MM
                                room: s.location || "Online",
                                isToday: isTodayClass,
                                day: days[s.day_of_week]
                            };
                        })
                        // Sort: Today first, then by day index from today
                        .sort((a, b) => {
                            if (a.isToday && !b.isToday) return -1;
                            if (!a.isToday && b.isToday) return 1;
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

        fetchData();
    }, [user]);

    return { stats, recentSubmissions, upcomingClasses, loading };
}
