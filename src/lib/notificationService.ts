import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: "assignment" | "grade" | "announcement" | "message" | "schedule" | "access_request" | "submission" | "general";
    relatedId?: string;
    classId?: string; // Class ID for filtering
    senderId?: string; // User who triggered this notification
    actionType?: string; // Specific action: created, updated, submitted, accepted, rejected, etc.
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type, relatedId, senderId, actionType } = params;

    try {
        const { error } = await supabase.from("notifications").insert({
            recipient_id: userId,
            title,
            message,
            type,
            related_id: relatedId || null,
            class_id: params.classId || null,
            sender_id: senderId || null,
            action_type: actionType || null,
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
    const { title, message, type, relatedId, classId, senderId, actionType } = params;

    try {
        const notifications = userIds.map((userId) => ({
            recipient_id: userId,
            title,
            message,
            type,
            related_id: relatedId || null,
            class_id: classId || null,
            sender_id: senderId || null,
            action_type: actionType || null,
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

/**
 * Notify all students in a class (class-scoped notification)
 * Respects individual student preferences
 */
export async function notifyClassStudents(
    classId: string,
    type: "assignment" | "grade" | "announcement" | "message" | "schedule",
    title: string,
    message: string,
    senderId: string,
    relatedId?: string
) {
    try {
        // Get all students in the class
        const { data: classStudents, error: studentsError } = await supabase
            .from("class_students")
            .select("student_id")
            .eq("class_id", classId);

        if (studentsError || !classStudents || classStudents.length === 0) {
            return { success: true, message: "No students in class" };
        }

        const studentIds = classStudents.map(cs => cs.student_id);

        // Check preferences based on notification type
        let preferenceField = "email_notifications";
        if (type === "assignment") preferenceField = "assignment_reminders";
        else if (type === "grade") preferenceField = "grade_updates";

        // Get students with the relevant preference enabled
        const { data: profiles, error: profileError } = await supabase
            .from("student_profiles")
            .select("user_id")
            .in("user_id", studentIds)
            .eq(preferenceField, true);

        if (profileError || !profiles || profiles.length === 0) {
            return { success: true, message: "No students with notifications enabled" };
        }

        const notifyUserIds = profiles.map(p => p.user_id);

        // Create notifications with class_id and sender_id
        const notifications = notifyUserIds.map((userId) => ({
            recipient_id: userId,
            title,
            message,
            type,
            related_id: relatedId || null,
            class_id: classId,
            sender_id: senderId,
            is_read: false,
        }));

        const { error } = await supabase.from("notifications").insert(notifications);

        if (error) {
            console.error("Error creating class notifications:", error);
            return { success: false, error };
        }

        return { success: true, count: notifications.length };
    } catch (err) {
        console.error("Error in notifyClassStudents:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify lecturer about student action (e.g., submission)
 * Respects lecturer preferences
 */
export async function notifyLecturer(
    lecturerId: string,
    type: "assignment" | "message" | "access_request",
    title: string,
    message: string,
    classId?: string,
    senderId?: string,
    relatedId?: string
) {
    try {
        // Check lecturer preferences
        let preferenceField = "email_notifications";
        if (type === "assignment") preferenceField = "submission_notifications";
        else if (type === "message") preferenceField = "message_notifications";

        const { data: lecturerProfile } = await supabase
            .from("lecturer_profiles")
            .select(preferenceField)
            .eq("user_id", lecturerId)
            .single();

        if (!lecturerProfile || !lecturerProfile[preferenceField]) {
            return { success: true, message: "Notifications disabled" };
        }

        // Create notification
        const { error } = await supabase.from("notifications").insert({
            recipient_id: lecturerId,
            title,
            message,
            type,
            related_id: relatedId || null,
            class_id: classId || null,
            sender_id: senderId || null,
            is_read: false,
        });

        if (error) {
            console.error("Error creating lecturer notification:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in notifyLecturer:", err);
        return { success: false, error: err };
    }
}

/**
 * Send access request notification to student
 */
export async function notifyAccessRequest(
    studentId: string,
    lecturerName: string,
    courseCode: string,
    classId: string,
    requestId: string
) {
    try {
        // Check if student has notifications enabled
        const { data: studentProfile } = await supabase
            .from("student_profiles")
            .select("email_notifications")
            .eq("user_id", studentId)
            .single();

        if (!studentProfile?.email_notifications) {
            return { success: true, message: "Notifications disabled" };
        }

        return createNotification({
            userId: studentId,
            title: "Class Access Request",
            message: `${lecturerName} has invited you to join ${courseCode}`,
            type: "access_request",
            relatedId: requestId,
        });
    } catch (err) {
        console.error("Error in notifyAccessRequest:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify lecturer when a student rejects their class invitation
 */
export async function notifyInvitationRejected(
    lecturerId: string,
    studentName: string,
    courseCode: string,
    className?: string,
    requestId?: string
) {
    try {
        // Check if lecturer has notifications enabled
        const { data: lecturerProfile } = await supabase
            .from("lecturer_profiles")
            .select("email_notifications")
            .eq("user_id", lecturerId)
            .single();

        if (!lecturerProfile?.email_notifications) {
            return { success: true, message: "Notifications disabled" };
        }

        const classInfo = className ? ` - ${className}` : '';

        return createNotification({
            userId: lecturerId,
            title: "Class Invitation Rejected",
            message: `${studentName} has declined the invitation to join ${courseCode}${classInfo}`,
            type: "access_request",
            relatedId: requestId,
        });
    } catch (err) {
        console.error("Error in notifyInvitationRejected:", err);
        return { success: false, error: err };
    }
}

/**
 * Create notification for pending access request (when popup is dismissed)
 */
export async function notifyPendingAccessRequest(
    studentId: string,
    lecturerName: string,
    courseCode: string,
    className: string | undefined,
    requestId: string
) {
    try {
        // Check if a notification already exists for this request
        const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", studentId)
            .eq("type", "access_request")
            .eq("related_id", requestId)
            .eq("is_read", false)
            .single();

        // Don't create duplicate notification
        if (existingNotification) {
            return { success: true, message: "Notification already exists" };
        }

        const classInfo = className ? ` - ${className}` : '';

        return createNotification({
            userId: studentId,
            title: "Pending Class Invitation",
            message: `${lecturerName} has invited you to join ${courseCode}${classInfo}. Click to review and respond.`,
            type: "access_request",
            relatedId: requestId,
        });
    } catch (err) {
        console.error("Error in notifyPendingAccessRequest:", err);
        return { success: false, error: err };
    }
}

/**
 * Clear notification for a specific access request
 */
export async function clearAccessRequestNotification(
    studentId: string,
    requestId: string
) {
    try {
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("recipient_id", studentId)
            .eq("type", "access_request")
            .eq("related_id", requestId);

        if (error) {
            console.error("Error clearing access request notification:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in clearAccessRequestNotification:", err);
        return { success: false, error: err };
    }
}
