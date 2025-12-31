import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Assignment {
    id: string;
    title: string;
    course_id: string;
    subject_id?: string;
    course_title?: string;
    course_code?: string;
    subject_name?: string;
    description: string | null;
    due_date: string | null;
    max_points: number | null;
    status: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    created_at: string;
    submission_count?: number;
}

export interface Subject {
    id: string;
    name: string;
    code: string | null;
    course_id: string;
}

export interface CreateAssignmentDTO {
    title: string;
    description: string;
    course_id: string;
    subject_id: string;
    due_date: Date;
    attachment_url: string;  // Now required
    attachment_name: string; // Now required
}

export function useLecturerAssignments() {
    const { user } = useAuth();
    const [rawAssignments, setRawAssignments] = useState<any[]>([]);
    const [courses, setCourses] = useState<{ id: string; title: string; course_code: string }[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("id, title, course_code")
                .eq("lecturer_id", user.id);

            if (error) throw error;
            setCourses(data || []);
            return data;
        } catch (error) {
            console.error("Error fetching courses:", error);
            return [];
        }
    };

    const fetchSubjects = async (courseId: string) => {
        try {
            const { data, error } = await supabase
                .from("subjects" as any)
                .select("*")
                .eq("course_id", courseId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error fetching subjects:", error);
            return [];
        }
    };

    const fetchAssignments = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // Fetch Raw Assignments (No Join)
            const { data, error } = await supabase
                .from("assignments")
                .select("*")
                .eq("lecturer_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setRawAssignments(data || []);

        } catch (error: any) {
            console.error("Error fetching assignments:", error);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const createAssignment = async (data: CreateAssignmentDTO) => {
        if (!user) return { success: false, error: "Not authenticated" };

        try {
            // Insert assignment
            const { data: newAssignment, error: assignmentError } = await supabase
                .from("assignments")
                .insert({
                    lecturer_id: user.id,
                    title: data.title,
                    description: data.description,
                    course_id: data.course_id,
                    subject_id: data.subject_id,
                    due_date: data.due_date.toISOString(),
                    attachment_url: data.attachment_url,
                    attachment_name: data.attachment_name,
                    status: "published"
                })
                .select()
                .single();

            if (assignmentError) throw assignmentError;

            // Fetch enrolled students for this course
            const { data: enrollments, error: enrollError } = await supabase
                .from("course_enrollments")
                .select("student_id")
                .eq("course_id", data.course_id);

            if (enrollError) {
                console.error("Error fetching enrollments:", enrollError);
            } else if (enrollments && enrollments.length > 0) {
                // Create notifications for all enrolled students
                const notifications = enrollments.map(enrollment => ({
                    user_id: enrollment.student_id,
                    title: "New Assignment Posted",
                    message: `${data.title} has been posted. Due date: ${data.due_date.toLocaleDateString()}`,
                    type: "assignment",
                    related_id: newAssignment.id,
                    is_read: false
                }));

                const { error: notifError } = await supabase
                    .from("notifications")
                    .insert(notifications);

                if (notifError) {
                    console.error("Error creating notifications:", notifError);
                }
            }

            toast.success("Assignment created and students notified!");
            fetchAssignments();
            return { success: true };
        } catch (error: any) {
            console.error("Error creating assignment:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteAssignment = async (id: string) => {
        try {
            const { error } = await supabase
                .from("assignments")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Assignment deleted");
            setRawAssignments(prev => prev.filter(a => a.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting assignment:", error);
            toast.error("Failed to delete assignment");
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        // Initial fetch sequence
        const init = async () => {
            setLoading(true);
            await fetchCourses();
            await fetchAssignments();
            setLoading(false);
        };
        init();
    }, [user]);

    // Client-side Join
    const assignments: Assignment[] = rawAssignments.map((item) => {
        const course = courses.find(c => c.id === item.course_id);
        return {
            ...item,
            course_title: course?.title || "Unknown Course",
            course_code: course?.course_code || "N/A",
        };
    });

    return {
        assignments,
        courses,
        subjects,
        loading,
        createAssignment,
        deleteAssignment,
        fetchSubjects,
        refreshParams: fetchAssignments
    };
}
