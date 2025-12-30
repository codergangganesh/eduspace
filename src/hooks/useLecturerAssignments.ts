import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Assignment {
    id: string;
    title: string;
    course_id: string;
    course_title?: string;
    course_code?: string;
    description: string | null;
    due_date: string | null;
    max_points: number | null;
    status: string | null;
    attachment_url: string | null;
    attachment_name: string | null;
    created_at: string;
    submission_count?: number;
}

export interface CreateAssignmentDTO {
    title: string;
    description: string;
    course_id: string;
    due_date: Date;
    max_points: number;
    attachment_url?: string;
    attachment_name?: string;
}

export function useLecturerAssignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [courses, setCourses] = useState<{ id: string; title: string; course_code: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignments = async () => {
        if (!user) return;
        try {
            setLoading(true);

            // 1. Fetch Lecturer's Assignments
            const { data, error } = await supabase
                .from("assignments")
                .select(`
          *,
          courses (
            title,
            course_code
          )
        `)
                .eq("lecturer_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // 2. Fetch submission counts for each assignment (optional, but nice for UI)
            // For now, simpler map
            const formatted: Assignment[] = data.map((item: any) => ({
                ...item,
                course_title: item.courses?.title,
                course_code: item.courses?.course_code,
            }));

            setAssignments(formatted);

        } catch (error: any) {
            console.error("Error fetching assignments:", error);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("id, title, course_code")
                .eq("lecturer_id", user.id);

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const createAssignment = async (data: CreateAssignmentDTO) => {
        if (!user) return { success: false, error: "Not authenticated" };

        try {
            const { error } = await supabase.from("assignments").insert({
                lecturer_id: user.id,
                title: data.title,
                description: data.description,
                course_id: data.course_id,
                due_date: data.due_date.toISOString(),
                max_points: data.max_points,
                attachment_url: data.attachment_url,
                attachment_name: data.attachment_name,
                status: "published" // Default status
            });

            if (error) throw error;

            toast.success("Assignment created successfully");
            fetchAssignments(); // Refresh list
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
            setAssignments(prev => prev.filter(a => a.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("Error deleting assignment:", error);
            toast.error("Failed to delete assignment");
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
    }, [user]);

    return {
        assignments,
        courses,
        loading,
        createAssignment,
        deleteAssignment,
        refreshParams: fetchAssignments
    };
}
