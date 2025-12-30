import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EnrolledStudent {
    student_id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    courses: string[]; // List of course codes this student is taking with this lecturer
}

export function useLecturerStudents() {
    const { user } = useAuth();
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // 1. Get all courses taught by this lecturer
                const { data: courses, error: courseError } = await supabase
                    .from("courses")
                    .select("id, course_code")
                    .eq("lecturer_id", user.id);

                if (courseError) throw courseError;

                if (!courses || courses.length === 0) {
                    setStudents([]);
                    return;
                }

                const courseIds = courses.map(c => c.id);

                // 2. Get all enrollments for these courses, joined with student profiles
                const { data: enrollments, error: enrollError } = await supabase
                    .from("course_enrollments")
                    .select(`
            student_id,
            course_id,
            profiles:student_id (
              full_name,
              email,
              avatar_url
            )
          `)
                    .in("course_id", courseIds);

                if (enrollError) throw enrollError;

                // 3. Process data to group by student
                const studentMap = new Map<string, EnrolledStudent>();

                enrollments?.forEach((enrollment: any) => {
                    const studentId = enrollment.student_id;
                    const courseCode = courses.find(c => c.id === enrollment.course_id)?.course_code || "Unknown";
                    const profile = enrollment.profiles;

                    if (studentMap.has(studentId)) {
                        studentMap.get(studentId)?.courses.push(courseCode);
                    } else {
                        studentMap.set(studentId, {
                            student_id: studentId,
                            full_name: profile?.full_name || "Unknown Student",
                            email: profile?.email || null,
                            avatar_url: profile?.avatar_url || null,
                            courses: [courseCode]
                        });
                    }
                });

                setStudents(Array.from(studentMap.values()));

            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [user]);

    return { students, loading };
}
