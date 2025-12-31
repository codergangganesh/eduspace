import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, parseISO } from "date-fns";

export interface DashboardStats {
    enrolledStudents: number;
    submissionsReceived: number;
    pendingSubmissions: number;
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
        enrolledStudents: 0,
        submissionsReceived: 0,
        pendingSubmissions: 0,
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
                // Fetch Lecturer's Courses
                const { data: courses, error: coursesError } = await supabase
                    .from("courses")
                    .select("id, course_code, title")
                    .eq("lecturer_id", user.id);

                if (coursesError) throw coursesError;
                const courseIds = courses.map(c => c.id);

                let enrolledStudents = 0;
                let submissionsReceived = 0;
                let pendingSubmissions = 0;

                if (courseIds.length > 0) {
                    // A. Enrolled Students: Count distinct students enrolled in lecturer's courses
                    const { data: enrollments } = await supabase
                        .from("course_enrollments")
                        .select("student_id")
                        .in("course_id", courseIds)
                        .eq("status", "active");

                    enrolledStudents = enrollments?.length || 0;

                    // Get published assignments for these courses
                    const { data: assignments, error: assignmentsError } = await supabase
                        .from("assignments")
                        .select("id")
                        .in("course_id", courseIds)
                        .eq("status", "published");

                    if (!assignmentsError && assignments && assignments.length > 0) {
                        const assignmentIds = assignments.map(a => a.id);

                        // B. Submissions Received: Count distinct students who have submitted
                        const { data: submissions } = await supabase
                            .from("assignment_submissions")
                            .select("student_id, assignment_id")
                            .in("assignment_id", assignmentIds);

                        submissionsReceived = submissions?.length || 0;

                        // C. Pending Submissions: (Total Students × Published Assignments) - Submissions Received
                        const totalExpectedSubmissions = enrolledStudents * assignments.length;
                        pendingSubmissions = totalExpectedSubmissions - submissionsReceived;
                    }
                }

                setStats({
                    enrolledStudents,
                    submissionsReceived,
                    pendingSubmissions
                })

                // 2. Fetch Recent Submissions
                if (courses.length > 0) {
                    // Fetch all assignments for recent submissions display
                    const { data: allAssignments } = await supabase
                        .from("assignments")
                        .select("id")
                        .in("course_id", courseIds);

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
                        .in("assignment_id", allAssignments?.map(a => a.id) || [])
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

        // Set up real-time subscription for assignment submissions
        const submissionsChannel = supabase
            .channel('assignment_submissions_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions'
                },
                () => {
                    // Refetch data when submissions change
                    fetchData();
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(submissionsChannel);
        };
    }, [user]);

    return { stats, recentSubmissions, upcomingClasses, loading };
}
