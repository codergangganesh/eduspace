import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
    id: string;
    recipient_id: string;
    sender_id: string | null;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    related_id?: string | null;
    class_id?: string | null;
    link?: string;
    metadata?: any;
}

export function useNotifications() {
    const { user, profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("recipient_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const subscription = supabase
            .channel(`notifications-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    if (profile?.notifications_enabled === false) {
                        return;
                    }

                    setNotifications((prev) => [newNotification, ...prev]);
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
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n.id === updatedNotification.id ? updatedNotification : n
                        )
                    );
                    setUnreadCount((prev) => {
                        const wasRead = (payload.old as Notification).is_read;
                        const isRead = updatedNotification.is_read;
                        if (!wasRead && isRead) return Math.max(0, prev - 1);
                        if (wasRead && !isRead) return prev + 1;
                        return prev;
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "notifications",
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    const deletedNotification = payload.old as Notification;
                    setNotifications((prev) =>
                        prev.filter((n) => n.id !== deletedNotification.id)
                    );
                    if (!deletedNotification.is_read) {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user, profile?.notifications_enabled, fetchNotifications]);

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
        if (!user) return;

        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("recipient_id", user.id)
                .eq("is_read", false);

            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const clearAllNotifications = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("recipient_id", user.id);

            if (error) throw error;

            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const notification = notifications.find(n => n.id === id);
            
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (notification && !notification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        deleteNotification,
        refetch: fetchNotifications,
    };
}
