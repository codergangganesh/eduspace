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
    icon?: string; // Optional icon/avatar for the notification
    customUrl?: string; // Optional custom URL override
}

/**
 * Create a notification for a specific user
 * Respects the master notification toggle (notifications_enabled)
 */
export async function createNotification(params: CreateNotificationParams) {
    const { userId, title, message, type, relatedId, senderId, actionType } = params;

    try {
        // Check if recipient has notifications enabled globally
        const { data: profile } = await supabase
            .from("profiles")
            .select("notifications_enabled")
            .eq("user_id", userId)
            .single();

        if (profile && profile.notifications_enabled === false) {
            return { success: true, message: "Notifications disabled by user" };
        }

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

        if (error && error.code !== '23505') {
            console.error("Error creating notification:", error);
            return { success: false, error };
        }

        // Trigger Push Notification
        supabase.functions.invoke('send-push', {
            body: {
                user_id: userId,
                title,
                body: message,
                url: params.customUrl || getNotificationUrl(type, relatedId, params.classId),
                type,
                badge: '/pwa-192x192.png',
                icon: params.icon // Pass icon if available
            }
        }).catch(err => console.error("Push failed:", err));

        return { success: true };
    } catch (err) {
        console.error("Error creating notification:", err);
        return { success: false, error: err };
    }
}

/**
 * Create notifications for multiple users
 * Automatically filters out users who have disabled notifications globally
 */
export async function createBulkNotifications(
    userIds: string[],
    params: Omit<CreateNotificationParams, "userId">
) {
    const { title, message, type, relatedId, classId, senderId, actionType } = params;

    try {
        if (!userIds || userIds.length === 0) {
            return { success: true, message: "No users to notify" };
        }

        // Filter out users who have notifications disabled globally
        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("user_id")
            .in("user_id", userIds)
            .eq("notifications_enabled", false);

        let activeUserIds = [...userIds];

        if (profiles && profiles.length > 0) {
            const disabledUserIds = new Set(profiles.map(p => p.user_id));
            activeUserIds = userIds.filter(id => !disabledUserIds.has(id));
        }

        if (activeUserIds.length === 0) {
            return { success: true, message: "All target users have notifications disabled" };
        }

        const notifications = activeUserIds.map((userId) => ({
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

        if (error && error.code !== '23505') {
            console.error("Error creating bulk notifications:", error);
            return { success: false, error };
        }

        // Trigger Push Notifications for all active users
        activeUserIds.forEach(userId => {
            supabase.functions.invoke('send-push', {
                body: {
                    user_id: userId,
                    title,
                    body: message,
                    url: params.customUrl || getNotificationUrl(type, relatedId, classId),
                    type, // Pass type for filtering logic in SW (e.g. chat suppression)
                    badge: '/pwa-192x192.png',
                    icon: params.icon
                }
            }).catch(err => console.error(`Push failed for ${userId}:`, err));
        });

        return { success: true };
    } catch (err) {
        console.error("Error creating bulk notifications:", err);
        return { success: false, error: err };
    }
}

function getNotificationUrl(type: string, relatedId?: string, classId?: string): string {
    switch (type) {
        case 'message':
            return relatedId ? `/messages?conversation=${relatedId}` : '/messages';
        case 'assignment':
            return classId ? `/student/assignments` : '/student/assignments';
        case 'quiz':
            return '/student/quizzes';
        case 'announcement':
            // If it's a quiz announcement, link to quizzes
            if (relatedId && !classId) return '/student/quizzes';
            // If it's associated with a class, maybe link to class dashboard or quizzes
            return '/student/quizzes';
        case 'grade':
            return '/student/assignments';
        case 'schedule':
            return '/schedule';
        case 'access_request':
            return '/notifications';
        case 'submission':
            if (classId && relatedId) {
                return `/lecturer/assignments/${classId}/${relatedId}/submissions`;
            }
            return '/notifications';
        default: return '/notifications';
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
    lecturerId: string,
    classId?: string,
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
            classId: classId,
            senderId: lecturerId,
            actionType: 'created',
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
    assignmentId: string,
    lecturerId: string, // Sender
    classId: string
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
        senderId: lecturerId,
        classId: classId,
        actionType: 'graded'
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
    updateDetails: string,
    lecturerId: string,
    classId?: string
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
            classId: classId,
            senderId: lecturerId,
            actionType: 'updated',
        });
    } catch (err) {
        console.error("Error in notifyAssignmentUpdated:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify students about a published quiz
 * Sends notifications to all enrolled students who have accepted the class
 */
export async function notifyQuizPublished(
    quizId: string,
    classId: string,
    quizTitle: string,
    lecturerId: string
) {
    try {
        // Get enrolled students (from class_students table which is the source of truth)
        const { data: classStudents, error: studentsError } = await supabase
            .from('class_students')
            .select('student_id')
            .eq('class_id', classId);

        if (studentsError) {
            console.error("Error fetching class students:", studentsError);
            return { success: false, error: studentsError };
        }

        const studentIds = classStudents?.map(s => s.student_id).filter(Boolean) as string[] || [];

        if (studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

        // Send notifications using bulk function (handles preference checking)
        return await createBulkNotifications(studentIds, {
            title: "New Quiz Available",
            message: `Quiz "${quizTitle}" is now available. Good luck!`,
            type: "announcement",
            relatedId: quizId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'published',
        });
    } catch (err) {
        console.error("Error in notifyQuizPublished:", err);
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
    conversationId: string,
    senderId: string,
    senderAvatar?: string // Added
) {
    // Check if recipient has message_notifications enabled
    const { data } = await supabase
        .from("profiles")
        .select("message_notifications, push_notifications")
        .eq("user_id", recipientId)
        .single();

    // Use message_notifications if available, otherwise fall back to push_notifications (or default to true if both missing/null logic implies enabled by default usually, but here we strictly check preference)
    // Actually, for backward compatibility, if message_notifications is null, we can check push_notifications logic or default to true.
    // The previous logic was: if (!data?.push_notifications) return...

    // New logic: 
    // If message_notifications is explicitly false, return.
    // If message_notifications is null, check push_notifications.

    const messageEnabled = data?.message_notifications ?? data?.push_notifications ?? true;

    if (!messageEnabled) return { success: true };

    return createNotification({
        userId: recipientId,
        title: `New message from ${senderName}`,
        message: messagePreview.length > 100 ? messagePreview.substring(0, 100) + "..." : messagePreview,
        type: "message",
        relatedId: conversationId,
        senderId: senderId,
        actionType: 'sent',
        icon: senderAvatar // Pass avatar
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
 * Notify students about a new schedule
 * Only sends notifications to students enrolled in the class
 */
export async function notifyScheduleCreated(
    studentIds: string[],
    scheduleTitle: string,
    scheduleDetails: string,
    scheduleId: string,
    lecturerId: string,
    classId?: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

        // Use createBulkNotifications which handles preference checking via profiles table
        return await createBulkNotifications(studentIds, {
            title: "New Schedule Added",
            message: `${scheduleTitle}: ${scheduleDetails}`,
            type: "schedule",
            relatedId: scheduleId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'created',
        });
    } catch (err) {
        console.error("Error in notifyScheduleCreated:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify students about a schedule update
 * Only sends notifications to students enrolled in the class
 */
export async function notifyScheduleUpdated(
    studentIds: string[],
    scheduleTitle: string,
    updateDetails: string,
    scheduleId: string,
    lecturerId: string,
    classId?: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { success: true, message: "No students to notify" };
        }

        // Use createBulkNotifications which handles preference checking via profiles table
        return await createBulkNotifications(studentIds, {
            title: "Schedule Updated",
            message: `${scheduleTitle}: ${updateDetails}`,
            type: "schedule",
            relatedId: scheduleId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'updated',
        });
    } catch (err) {
        console.error("Error in notifyScheduleUpdated:", err);
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

        // Use createBulkNotifications for unified logic
        return await createBulkNotifications(notifyUserIds, {
            title,
            message,
            type,
            relatedId: relatedId || undefined,
            classId: classId,
            senderId: senderId,
            actionType: "class_announcement"
        });
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

        // Centralized notification handling
        return await createNotification({
            userId: lecturerId,
            title,
            message,
            type,
            relatedId,
            classId,
            senderId,
            actionType: 'action', // Default action
            customUrl: type === 'message' ? `/messages?conversation=${relatedId}` : '/notifications'
        });
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

/**
 * Notify lecturer about an assignment submission
 * Includes class_id for proper filtering and respects lecturer preferences
 */
export async function notifyAssignmentSubmission(
    lecturerId: string,
    studentName: string,
    assignmentTitle: string,
    assignmentId: string,
    classId: string,
    studentId: string
) {
    try {
        // Check lecturer preferences
        const { data: lecturerProfile } = await supabase
            .from("lecturer_profiles")
            .select("submission_notifications")
            .eq("user_id", lecturerId)
            .single();

        if (!lecturerProfile?.submission_notifications) {
            return { success: true, message: "Notifications disabled" };
        }

        // Use createNotification for centralized logic (DB insert + Push invoke)
        return await createNotification({
            userId: lecturerId,
            senderId: studentId,
            title: "New Assignment Submission",
            message: `${studentName} submitted "${assignmentTitle}"`,
            type: "submission",
            actionType: "submitted",
            relatedId: assignmentId,
            classId: classId,
            customUrl: `/lecturer/assignments/${classId}/${assignmentId}/submissions`
        });
    } catch (err) {
        console.error("Error in notifyAssignmentSubmission:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify lecturer about a quiz submission
 */
export async function notifyQuizSubmission(
    lecturerId: string,
    studentName: string,
    quizTitle: string,
    quizId: string,
    classId: string,
    studentId: string
) {
    try {
        // Check lecturer preferences (using submission_notifications for simplicity as it falls under submission category)
        const { data: lecturerProfile } = await supabase
            .from("lecturer_profiles")
            .select("submission_notifications")
            .eq("user_id", lecturerId)
            .single();

        if (!lecturerProfile?.submission_notifications) {
            return { success: true, message: "Notifications disabled" };
        }

        // Use createNotification for centralized logic
        return await createNotification({
            userId: lecturerId,
            senderId: studentId,
            title: "New Quiz Submission",
            message: `${studentName} completed "${quizTitle}"`,
            type: "submission",
            actionType: "quiz_submitted",
            relatedId: quizId,
            classId: classId,
            customUrl: `/lecturer/quizzes/${classId}/${quizId}/results`
        });
    } catch (err) {
        console.error("Error in notifyQuizSubmission:", err);
        return { success: false, error: err };
    }
}

