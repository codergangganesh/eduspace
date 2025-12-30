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
 * Only sends notifications to students who have assignment_reminders enabled
 */
export async function notifyNewAssignment(
    courseId: string,
    assignmentTitle: string,
    assignmentId: string,
    dueDate?: string
) {
    try {
        // Get all students enrolled in the course
        const { data: enrollments, error: enrollError } = await supabase
            .from("course_enrollments")
            .select("student_id")
            .eq("course_id", courseId);

        if (enrollError) {
            console.error("Error fetching enrollments:", enrollError);
            return { success: false, error: enrollError };
        }

        if (!enrollments || enrollments.length === 0) {
            return { success: true, message: "No students enrolled" };
        }

        const studentIds = enrollments.map(e => e.student_id);

        // Get students who have assignment_reminders enabled
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("user_id")
            .in("user_id", studentIds)
            .eq("assignment_reminders", true);

        if (profileError) {
            console.error("Error fetching profiles:", profileError);
            return { success: false, error: profileError };
        }

        if (!profiles || profiles.length === 0) {
            return { success: true, message: "No students with reminders enabled" };
        }

        const notifyUserIds = profiles.map(p => p.user_id);

        // Create notification message
        const dueDateText = dueDate ? ` - Due ${new Date(dueDate).toLocaleDateString()}` : "";
        const message = `New assignment: "${assignmentTitle}"${dueDateText}`;

        // Send notifications to students with reminders enabled
        return await createBulkNotifications(notifyUserIds, {
            title: "New Assignment Posted",
            message,
            type: "assignment",
            relatedId: assignmentId,
        });
    } catch (err) {
        console.error("Error in notifyNewAssignment:", err);
        return { success: false, error: err };
    }
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
 * Notify students about an assignment update
 * Only sends notifications to students who have assignment_reminders enabled
 */
export async function notifyAssignmentUpdated(
    courseId: string,
    assignmentTitle: string,
    assignmentId: string,
    updateDetails: string
) {
    try {
        // Get all students enrolled in the course
        const { data: enrollments, error: enrollError } = await supabase
            .from("course_enrollments")
            .select("student_id")
            .eq("course_id", courseId);

        if (enrollError) {
            console.error("Error fetching enrollments:", enrollError);
            return { success: false, error: enrollError };
        }

        if (!enrollments || enrollments.length === 0) {
            return { success: true, message: "No students enrolled" };
        }

        const studentIds = enrollments.map(e => e.student_id);

        // Get students who have assignment_reminders enabled
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("user_id")
            .in("user_id", studentIds)
            .eq("assignment_reminders", true);

        if (profileError) {
            console.error("Error fetching profiles:", profileError);
            return { success: false, error: profileError };
        }

        if (!profiles || profiles.length === 0) {
            return { success: true, message: "No students with reminders enabled" };
        }

        const notifyUserIds = profiles.map(p => p.user_id);

        // Send notifications to students with reminders enabled
        return await createBulkNotifications(notifyUserIds, {
            title: "Assignment Updated",
            message: `"${assignmentTitle}" has been updated: ${updateDetails}`,
            type: "assignment",
            relatedId: assignmentId,
        });
    } catch (err) {
        console.error("Error in notifyAssignmentUpdated:", err);
        return { success: false, error: err };
    }
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
