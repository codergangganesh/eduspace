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
    studentIds: string[],
    assignmentTitle: string,
    assignmentId: string,
    dueDate?: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

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
    studentIds: string[],
    assignmentTitle: string,
    assignmentId: string,
    updateDetails: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

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
 * Notify a user about a new message
 */
export async function notifyNewMessage(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
) {
    // Check if recipient has push_notifications enabled
    const { data } = await supabase
        .from("profiles")
        .select("push_notifications")
        .eq("user_id", recipientId)
        .single();

    if (!data?.push_notifications) return { success: true };

    return createNotification({
        userId: recipientId,
        title: `New message from ${senderName}`,
        message: messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview,
        type: "message",
        relatedId: conversationId,
    });
}

/**
 * Notify students about a schedule change
 */
export async function notifyScheduleChange(
    studentIds: string[],
    scheduleTitle: string,
    changeDetails: string,
    scheduleId: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

        return await createBulkNotifications(studentIds, {
            title: "Schedule Updated",
            message: `${scheduleTitle}: ${changeDetails}`,
            type: "schedule",
            relatedId: scheduleId,
        });
    } catch (err) {
        console.error("Error in notifyScheduleChange:", err);
        return { success: false, error: err };
    }
}
