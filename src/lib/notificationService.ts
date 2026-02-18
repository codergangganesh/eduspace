import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to trigger class email via Edge Function
 */
const BASE_URL = "https://eduspaceacademy.online";

async function sendClassEmail(params: {
    classId: string;
    type: 'assignment' | 'quiz' | 'schedule' | 'update';
    title: string;
    body: string;
    link: string;
    lecturerName?: string; // Optional, defaults to "Your Lecturer" if not provided
}) {
    try {
        console.log(`Triggering class email for ${params.classId}`);
        const { error } = await supabase.functions.invoke('send-class-email', {
            body: {
                ...params,
                lecturerName: params.lecturerName || "Your Lecturer"
            }
        });

        if (error) {
            console.error("Failed to send class email:", error);
        } else {
            console.log("Class email triggered successfully");
        }
    } catch (err) {
        console.error("Error in sendClassEmail:", err);
    }
}


interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: "assignment" | "grade" | "announcement" | "message" | "schedule" | "access_request" | "submission" | "general";
    relatedId?: string;
    classId?: string;
    senderId?: string;
    actionType?: string;
    icon?: string;
    customUrl?: string;
    // Rich push payload overrides
    pushTag?: string;
    pushImage?: string;
}

// ─── Rich Push Helpers ──────────────────────────────────────────────────────
function generateTag(type: string, relatedId?: string, classId?: string): string {
    const id = relatedId || classId || 'general';
    switch (type) {
        case 'message': return `msg-${id}`;
        case 'assignment': return `assign-${id}`;
        case 'announcement': return `quiz-${id}`;
        case 'schedule': return `schedule-${id}`;
        case 'submission': return `submission-${id}`;
        case 'grade': return `grade-${id}`;
        default: return `eduspace-${type}`;
    }
}

function getVibrationPattern(type: string): number[] {
    switch (type) {
        case 'message': return [100, 50, 100];
        case 'assignment':
        case 'submission': return [200, 100, 200];
        case 'announcement':
        case 'schedule': return [200, 100, 200, 100, 200];
        default: return [100, 50, 100];
    }
}

function getActions(type: string): Array<{ action: string; title: string }> {
    switch (type) {
        case 'message': return [{ action: 'view', title: '💬 View Chat' }, { action: 'dismiss', title: 'Dismiss' }];
        case 'assignment': return [{ action: 'view', title: '📝 View Assignment' }];
        case 'announcement': return [{ action: 'view', title: '📋 View Quiz' }];
        case 'submission': return [{ action: 'view', title: '📄 View Submission' }];
        case 'schedule': return [{ action: 'view', title: '📅 View Schedule' }];
        case 'grade': return [{ action: 'view', title: '📊 View Grade' }];
        default: return [{ action: 'open', title: 'Open EduSpace' }];
    }
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

        // Trigger Rich Push Notification
        let pushUrl = params.customUrl || getNotificationUrl(type, relatedId, params.classId);

        // Get the ID of the newly created notification to pass to the push
        const { data: insertedNotif } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", userId)
            .eq("title", title)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Append notifId to URL for auto-mark-as-read on click
        if (insertedNotif?.id) {
            const separator = pushUrl.includes('?') ? '&' : '?';
            pushUrl = `${pushUrl}${separator}notifId=${insertedNotif.id}`;
        }

        supabase.functions.invoke('send-push', {
            body: {
                user_id: userId,
                title,
                body: message,
                url: pushUrl,
                type,
                icon: params.icon || '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: params.pushTag || generateTag(type, relatedId, params.classId),
                image: params.pushImage,
                timestamp: Date.now(),
                vibrate: getVibrationPattern(type),
                actions: getActions(type),
                renotify: true,
                data: {
                    notificationId: insertedNotif?.id,
                    conversationId: type === 'message' ? relatedId : undefined,
                    classId: params.classId,
                    relatedId,
                },
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

        // Trigger Rich Push Notifications for all active users
        const bulkPushUrl = params.customUrl || getNotificationUrl(type, relatedId, classId);
        const bulkTag = (params as any).pushTag || generateTag(type, relatedId, classId);
        activeUserIds.forEach(userId => {
            supabase.functions.invoke('send-push', {
                body: {
                    user_id: userId,
                    title,
                    body: message,
                    url: bulkPushUrl,
                    type,
                    icon: (params as any).icon || '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: bulkTag,
                    image: (params as any).pushImage,
                    timestamp: Date.now(),
                    vibrate: getVibrationPattern(type),
                    actions: getActions(type),
                    renotify: true,
                    data: {
                        conversationId: type === 'message' ? relatedId : undefined,
                        classId: classId,
                        relatedId,
                    },
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

        // Create notification message
        const dueDateText = dueDate ? ` - Due ${new Date(dueDate).toLocaleDateString()}` : "";
        const message = `New assignment: "${assignmentTitle}"${dueDateText}`;

        // Send notifications to students (createBulkNotifications handles master toggle check)
        const result = await createBulkNotifications(studentIds, {
            title: "New Assignment Posted",
            message,
            type: "assignment",
            relatedId: assignmentId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'created',
        });

        // Trigger Email Notification
        const link = `${BASE_URL}/student/assignments`;
        const lecturerName = await getLecturerName(lecturerId);

        sendClassEmail({
            classId: classId || '',
            type: 'assignment',
            title: `New Assignment: ${assignmentTitle}`,
            body: `A new assignment "${assignmentTitle}" has been posted.${dueDate ? ` Due: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
            link,
            lecturerName
        });

        return result;

    } catch (err) {
        console.error("Error in notifyNewAssignment:", err);
        return { success: false, error: err };
    }
}

/**
 * Helper to fetch lecturer name
 */
async function getLecturerName(lecturerId: string): Promise<string> {
    const { data } = await supabase.from('profiles').select('full_name').eq('user_id', lecturerId).single();
    return data?.full_name || "Your Lecturer";
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

        // Send notifications (createBulkNotifications handles master toggle check)
        const result = await createBulkNotifications(studentIds, {
            title: "Assignment Updated",
            message: `"${assignmentTitle}" has been updated: ${updateDetails}`,
            type: "assignment",
            relatedId: assignmentId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'updated',
        });

        // Trigger Email Notification
        const link = `${BASE_URL}/student/assignments`;
        const lecturerName = await getLecturerName(lecturerId);

        sendClassEmail({
            classId: classId || '',
            type: 'update',
            title: `Assignment Updated: ${assignmentTitle}`,
            body: `The assignment "${assignmentTitle}" has been updated: ${updateDetails}`,
            link,
            lecturerName
        });

        return result;

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
        const result = await createBulkNotifications(studentIds, {
            title: "New Quiz Available",
            message: `Quiz "${quizTitle}" is now available. Good luck!`,
            type: "announcement",
            relatedId: quizId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'published',
        });

        // Trigger Email Notification
        const link = `${BASE_URL}/student/quizzes`;
        const lecturerName = await getLecturerName(lecturerId);

        sendClassEmail({
            classId: classId,
            type: 'quiz',
            title: `New Quiz: ${quizTitle}`,
            body: `A new quiz "${quizTitle}" is now available. Good luck!`,
            link,
            lecturerName
        });

        return result;

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
        const result = await createBulkNotifications(studentIds, {
            title: "New Schedule Added",
            message: `${scheduleTitle}: ${scheduleDetails}`,
            type: "schedule",
            relatedId: scheduleId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'created',
        });

        // Trigger Email Notification
        const link = `${BASE_URL}/schedule`;
        const lecturerName = await getLecturerName(lecturerId);

        sendClassEmail({
            classId: classId || '',
            type: 'schedule',
            title: `New Schedule: ${scheduleTitle}`,
            body: `New schedule event "${scheduleTitle}": ${scheduleDetails}`,
            link,
            lecturerName
        });

        return result;

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
        const result = await createBulkNotifications(studentIds, {
            title: "Schedule Updated",
            message: `${scheduleTitle}: ${updateDetails}`,
            type: "schedule",
            relatedId: scheduleId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'updated',
        });

        // Trigger Email Notification
        const link = `${BASE_URL}/schedule`;
        const lecturerName = await getLecturerName(lecturerId);

        sendClassEmail({
            classId: classId || '',
            type: 'schedule',
            title: `Schedule Updated: ${scheduleTitle}`,
            body: `Schedule event "${scheduleTitle}" has been updated: ${updateDetails}`,
            link,
            lecturerName
        });

        return result;

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

        // Use createBulkNotifications for unified logic (handles master toggle)
        return await createBulkNotifications(studentIds, {
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
        // Centralized notification handling (handles master toggle)
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
        // Use createNotification for centralized logic (handles master toggle)
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
        // Use createNotification for centralized logic (handles master toggle)
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

/**
 * Notify lecturer about an assignment submission
 */
export async function notifyAssignmentSubmitted(
    lecturerId: string,
    studentName: string,
    assignmentTitle: string,
    assignmentId: string,
    classId: string,
    studentId: string
) {
    return createNotification({
        userId: lecturerId,
        title: "Assignment Submitted",
        message: `${studentName} submitted "${assignmentTitle}"`,
        type: "submission",
        relatedId: assignmentId,
        classId: classId,
        senderId: studentId,
        actionType: 'submitted'
    });
}

/**
 * Notify students about a new poll in their class
 */
export async function notifyPollCreated(
    classId: string,
    pollTitle: string,
    pollId: string,
    lecturerId: string
) {
    try {
        const { data: classStudents } = await supabase
            .from('class_students')
            .select('student_id')
            .eq('class_id', classId);

        const studentIds = classStudents?.map(s => s.student_id).filter(Boolean) as string[] || [];
        if (studentIds.length === 0) return { success: true };

        return await createBulkNotifications(studentIds, {
            title: "New Class Poll",
            message: `A new poll: "${pollTitle}" is available.`,
            type: "announcement",
            relatedId: pollId,
            classId: classId,
            senderId: lecturerId,
            actionType: 'poll_created',
        });
    } catch (err) {
        console.error("Error in notifyPollCreated:", err);
        return { success: false, error: err };
    }
}

/**
 * Notify students about a quiz update
 */
export async function notifyQuizUpdated(
    studentIds: string[],
    quizTitle: string,
    quizId: string,
    lecturerId: string,
    classId: string
) {
    return createBulkNotifications(studentIds, {
        title: "Quiz Updated",
        message: `The quiz "${quizTitle}" has been updated.`,
        type: "announcement",
        relatedId: quizId,
        classId: classId,
        senderId: lecturerId,
        actionType: 'updated'
    });
}
