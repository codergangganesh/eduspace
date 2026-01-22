import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
    metadata?: any;
    class_id?: string; // Class association for filtering
}

/**
 * Helper function to check if a notification should be visible to the user
 * Students only see notifications from enrolled classes, access requests, or general notifications
 */
const shouldShowNotification = (
    notification: Notification,
    enrolledClassIds: string[],
    isStudent: boolean
): boolean => {
    // Non-students (lecturers) see all their notifications
    if (!isStudent) return true;

    // Always show access_request notifications (invitations)
    if (notification.type === 'access_request') return true;

    // Always show notifications without class_id (general notifications)
    if (!notification.class_id) return true;

    // For class-scoped notifications, only show if enrolled in that class
    return enrolledClassIds.includes(notification.class_id);
};

export function useNotifications() {
    const { user, role } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Cache enrolled class IDs to avoid refetching on every real-time update
    const enrolledClassIdsRef = useRef<string[]>([]);
    const isStudent = role === 'student';

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications with enrollment filtering
        const fetchNotifications = async () => {
            try {
                // For students, first get their enrolled class IDs
                let enrolledClassIds: string[] = [];

                if (isStudent) {
                    const { data: enrollments } = await supabase
                        .from('class_students')
                        .select('class_id')
                        .eq('student_id', user.id);

                    enrolledClassIds = enrollments?.map(e => e.class_id) || [];
                    enrolledClassIdsRef.current = enrolledClassIds;
                }

                // Fetch notifications for the user
                const { data, error } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("recipient_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(50); // Fetch more to account for filtering

                if (error) throw error;

                // Filter notifications based on enrollment status
                const filteredData = (data || []).filter(n =>
                    shouldShowNotification(n as Notification, enrolledClassIds, isStudent)
                ).slice(0, 20); // Limit to 20 after filtering

                setNotifications(filteredData);
                setUnreadCount(filteredData.filter(n => !n.is_read).length);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel(`notifications-${user.id}`) // Unique channel per user
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                async (payload) => {
                    const newNotification = payload.new as Notification;

                    // For students, check if notification should be shown
                    if (isStudent) {
                        // Refresh enrolled class IDs if needed (e.g., after accepting invitation)
                        const { data: enrollments } = await supabase
                            .from('class_students')
                            .select('class_id')
                            .eq('student_id', user.id);

                        enrolledClassIdsRef.current = enrollments?.map(e => e.class_id) || [];

                        // Check if this notification should be visible
                        if (!shouldShowNotification(newNotification, enrolledClassIdsRef.current, true)) {
                            // Don't show this notification - student is not enrolled in this class
                            return;
                        }
                    }

                    // Check for duplicates before adding
                    setNotifications((prev) => {
                        if (prev.some(n => n.id === newNotification.id)) {
                            return prev;
                        }
                        return [newNotification, ...prev];
                    });
                    setUnreadCount((prev) => prev + 1);

                    toast(newNotification.title, {
                        description: newNotification.message,
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const updatedNotification = payload.new as Notification;

                    // Update the notification in state
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === updatedNotification.id ? updatedNotification : n
                        )
                    );

                    // Recalculate unread count
                    setNotifications((prev) => {
                        setUnreadCount(prev.filter(n => !n.is_read).length);
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, isStudent]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("recipient_id", user?.id)
                .eq("is_read", false);

            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
    };
}
