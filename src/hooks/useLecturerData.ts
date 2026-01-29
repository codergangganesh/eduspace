import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export interface DashboardStats {
    enrolledStudents: number;
    submissionsReceived: number;
    pendingSubmissions: number;
    totalExpectedSubmissions: number; // For "X / Y" format display
}

export interface RecentSubmission {
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseCode: string;
    className: string; // Added for activity display
    submittedAt: string;
    status: "pending" | "graded";
    grade: string | null;
    classId?: string; // Added for navigation
    assignmentId?: string; // Added for navigation
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
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
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

            if (classIds.length > 0) {
                // A. Enrolled Students: Count unique ACCEPTED students across all classes
                // Use access_requests table with status='accepted' for accurate counts
                const { data: acceptedEnrollments } = await supabase
                    .from("access_requests")
                    .select("student_id, class_id")
                    .in("class_id", classIds)
                    .eq("status", "accepted");

                // Count unique students (a student might be in multiple classes)
                const uniqueStudents = new Set(acceptedEnrollments?.map(e => e.student_id));
                enrolledStudents = uniqueStudents.size;

                // Create a map of class_id -> accepted student count for submissions calculation
                const classStudentCounts = new Map<string, number>();
                acceptedEnrollments?.forEach(e => {
                    if (e.class_id) {
                        classStudentCounts.set(e.class_id, (classStudentCounts.get(e.class_id) || 0) + 1);
                    }
                });

                // B. Assignments & Submissions
                // Fetch assignments by lecturer_id OR by class_id for the lecturer's classes
                let allAssignmentIds: string[] = [];

                // Get assignments by lecturer_id
                const { data: directAssignments } = await supabase
                    .from("assignments")
                    .select("id, class_id")
                    .eq("lecturer_id", user.id)
                    .or("status.eq.published,status.eq.active");

                if (directAssignments) {
                    allAssignmentIds = directAssignments.map(a => a.id);
                }

                // Also get assignments from lecturer's classes (in case lecturer_id wasn't set)
                const { data: classAssignments } = await supabase
                    .from("assignments")
                    .select("id, class_id")
                    .in("class_id", classIds)
                    .or("status.eq.published,status.eq.active");

                if (classAssignments) {
                    const classAssignmentIds = classAssignments.map(a => a.id);
                    // Merge and deduplicate
                    allAssignmentIds = [...new Set([...allAssignmentIds, ...classAssignmentIds])];
                }

                // All assignments for calculating expected submissions
                const allAssignmentsWithClass = [...(directAssignments || []), ...(classAssignments || [])];
                // Deduplicate by id
                const uniqueAssignments = Array.from(
                    new Map(allAssignmentsWithClass.map(a => [a.id, a])).values()
                );

                if (allAssignmentIds.length > 0) {
                    // Count total submissions
                    const { count: submissionCount } = await supabase
                        .from("assignment_submissions")
                        .select("*", { count: 'exact', head: true })
                        .in("assignment_id", allAssignmentIds);

                    submissionsReceived = submissionCount || 0;

                    // Calculate total expected submissions using class student counts
                    for (const assign of uniqueAssignments) {
                        if (assign.class_id && classStudentCounts.has(assign.class_id)) {
                            totalExpectedSubmissions += classStudentCounts.get(assign.class_id) || 0;
                        }
                    }

                    pendingSubmissions = Math.max(0, totalExpectedSubmissions - submissionsReceived);
                }
            }

            setStats({
                enrolledStudents,
                submissionsReceived,
                pendingSubmissions,
                totalExpectedSubmissions
            });

            // 2. Fetch Recent Submissions - Only for THIS lecturer's assignments
            // Get assignments either directly owned by lecturer OR belonging to lecturer's classes
            let lecturerAssignmentIds: string[] = [];

            // Get assignments by lecturer_id
            const { data: directAssignments } = await supabase
                .from("assignments")
                .select("id")
                .eq("lecturer_id", user.id);

            if (directAssignments) {
                lecturerAssignmentIds = directAssignments.map(a => a.id);
            }

            // Also get assignments from lecturer's classes (in case lecturer_id wasn't set)
            if (classIds.length > 0) {
                const { data: classAssignments } = await supabase
                    .from("assignments")
                    .select("id")
                    .in("class_id", classIds);

                if (classAssignments) {
                    const classAssignmentIds = classAssignments.map(a => a.id);
                    // Merge and deduplicate
                    lecturerAssignmentIds = [...new Set([...lecturerAssignmentIds, ...classAssignmentIds])];
                }
            }

            if (lecturerAssignmentIds.length > 0) {
                const { data: submissions, error: submissionsError } = await supabase
                    .from("assignment_submissions")
                    .select(`
                        id,
                        assignment_id,
                        submitted_at,
                        status,
                        grade,
                        student:profiles!student_id(full_name),
                        assignment:assignments!assignment_id(id, title, class_id)
                    `)
                    .in("assignment_id", lecturerAssignmentIds)
                    .order("submitted_at", { ascending: false })
                    .limit(10);

                if (!submissionsError && submissions) {
                    const formattedSubmissions: RecentSubmission[] = [];
                    for (const sub of submissions) {
                        const assignmentData = sub.assignment as any;
                        const assignmentClassId = assignmentData?.class_id;
                        const assignmentId = assignmentData?.id || sub.assignment_id;
                        let courseCode = "N/A";
                        let className = "Unknown Class";

                        if (assignmentClassId && classesMap.has(assignmentClassId)) {
                            const classInfo = classesMap.get(assignmentClassId);
                            courseCode = classInfo?.course_code || "N/A";
                            className = classInfo?.class_name || "Unknown Class";
                        } else if (assignmentClassId) {
                            try {
                                const { data: cls } = await supabase.from('classes').select('course_code, class_name').eq('id', assignmentClassId).single();
                                if (cls) {
                                    courseCode = cls.course_code;
                                    className = cls.class_name || "Unknown Class";
                                }
                            } catch (e) {
                                // ignore error
                            }
                        }

                        formattedSubmissions.push({
                            id: sub.id,
                            studentName: (sub.student as any)?.full_name || "Unknown Student",
                            assignmentTitle: assignmentData?.title || "Untitled",
                            courseCode: courseCode,
                            className: className,
                            submittedAt: format(new Date(sub.submitted_at), "MMM d, h:mm a"),
                            status: sub.status === "graded" ? "graded" : "pending",
                            grade: sub.grade ? sub.grade.toString() : null,
                            classId: assignmentClassId,
                            assignmentId: assignmentId
                        });
                    }
                    setRecentSubmissions(formattedSubmissions);
                }
            } else {
                setRecentSubmissions([]);
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
                            day: days[s.day_of_week],
                            classId: s.class_id // Populate classId
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
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Subscriptions - use silent refresh to avoid UI flicker
        const silentFetch = () => fetchData(true);
        const subs = [
            supabase.channel('dashboard_submissions').on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_submissions' }, silentFetch).subscribe(),
            supabase.channel('dashboard_class_students').on('postgres_changes', { event: '*', schema: 'public', table: 'class_students' }, silentFetch).subscribe(),
            supabase.channel('dashboard_classes').on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, silentFetch).subscribe(),
            supabase.channel('dashboard_schedules').on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, silentFetch).subscribe(),
            supabase.channel('dashboard_access_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, silentFetch).subscribe()
        ];

        return () => {
            subs.forEach(s => s.unsubscribe());
        };
    }, [user]);

    return { stats, recentSubmissions, upcomingClasses, loading };
}
