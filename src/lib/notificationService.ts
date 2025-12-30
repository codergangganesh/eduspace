import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: "assignment" | "grade" | "announcement" | "message" | "schedule";
    relatedId?: string;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type, relatedId } = params;

    try {
        const { error } = await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message,
            type,
            related_id: relatedId || null,
            is_read: false,
        });

        if (error) {
            console.error("Error creating notification:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error creating notification:", err);
        return { success: false, error: err };
    }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
    userIds: string[],
    params: Omit<CreateNotificationParams, "userId">
) {
    const { title, message, type, relatedId } = params;

    try {
        const notifications = userIds.map((userId) => ({
            user_id: userId,
            title,
            message,
            type,
            related_id: relatedId || null,
            is_read: false,
        }));

        const { error } = await supabase.from("notifications").insert(notifications);

        if (error) {
            console.error("Error creating bulk notifications:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error creating bulk notifications:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify students about a new assignment
 * Note: This function requires an 'enrollments' table to be created
 * For now, it's a placeholder that you can implement when you build the enrollment system
 */
export async function notifyNewAssignment(
    courseId: string,
    assignmentTitle: string,
    assignmentId: string,
    dueDate?: string
) {
    // TODO: Implement when enrollments table is created
    // For now, this is a placeholder
    console.log("notifyNewAssignment called:", { courseId, assignmentTitle, assignmentId, dueDate });
    return { success: true };
}

/**
 * Notify a student about a new grade
 */
export async function notifyGradePosted(
    studentId: string,
    assignmentTitle: string,
    grade: string,
    assignmentId: string
) {
    // Check if student has grade_updates enabled
    const { data } = await supabase
        .from("profiles")
        .select("grade_updates")
        .eq("user_id", studentId)
        .single();

    if (!data?.grade_updates) return { success: true };

    return createNotification({
        userId: studentId,
        title: "Grade Posted",
        message: `Your grade for "${assignmentTitle}" is ${grade}`,
        type: "grade",
        relatedId: assignmentId,
    });
}

/**
 * Notify students about a course announcement
 * Note: This function requires an 'enrollments' table to be created
 * For now, it's a placeholder
 */
export async function notifyCourseAnnouncement(
    courseId: string,
    announcementTitle: string,
    announcementId: string
) {
    // TODO: Implement when enrollments table is created
    console.log("notifyCourseAnnouncement called:", { courseId, announcementTitle, announcementId });
    return { success: true };
}
