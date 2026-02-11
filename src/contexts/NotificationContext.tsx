import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { getEnrolledClassIds } from "@/lib/studentUtils";

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
    related_id?: string;
    metadata?: any;
    class_id?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    loading: boolean;
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, role } = useAuth();
    const location = useLocation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Cache enrolled class IDs to avoid refetching on every real-time update
    const enrolledClassIdsRef = useRef<string[]>([]);
    const isStudent = role === 'student';

    // Use ref to track current location for subscription callback
    const locationRef = useRef(location.pathname);
    useEffect(() => {
        locationRef.current = location.pathname;
    }, [location.pathname]);

    // ─── Broadcast app state to Service Worker for smart push suppression ────
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const sendStateToSW = (isFocused: boolean) => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const sw = navigator.serviceWorker.controller;
                if (!sw) return;

                const searchParams = new URLSearchParams(window.location.search);
                const activeChatId = location.pathname.startsWith('/messages')
                    ? searchParams.get('conversation') || null
                    : null;

                sw.postMessage({
                    type: 'APP_STATE',
                    isFocused,
                    currentPath: location.pathname,
                    activeChatId,
                });
            }, 300); // Debounce to avoid excessive SW wake-ups
        };

        // Send on route change
        sendStateToSW(document.hasFocus());

        // Send on focus/blur
        const onFocus = () => sendStateToSW(true);
        const onBlur = () => sendStateToSW(false);
        const onVisibilityChange = () => sendStateToSW(document.visibilityState === 'visible');

        window.addEventListener('focus', onFocus);
        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [location.pathname, location.search]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const shouldShowNotification = (
            notification: Notification,
            enrolledClassIds: string[],
            isStudent: boolean
        ): boolean => {
            if (!isStudent) return true;
            if (notification.type === 'access_request') return true;
            if (!notification.class_id) return true;
            return enrolledClassIds.includes(notification.class_id);
        };

        const fetchNotifications = async () => {
            try {
                let enrolledClassIds: string[] = [];
                if (isStudent) {
                    enrolledClassIds = await getEnrolledClassIds(user.id);
                    enrolledClassIdsRef.current = enrolledClassIds;
                }

                const { data, error } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("recipient_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) throw error;

                const filteredData = (data || []).filter(n =>
                    shouldShowNotification(n as Notification, enrolledClassIds, isStudent)
                ).slice(0, 20);

                setNotifications(filteredData);
                setUnreadCount(filteredData.filter(n => !n.is_read).length);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        };

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
                async (payload) => {
                    const newNotification = payload.new as Notification;

                    if (isStudent) {
                        const enrolledClassIds = await getEnrolledClassIds(user.id);
                        enrolledClassIdsRef.current = enrolledClassIds;
                        if (!shouldShowNotification(newNotification, enrolledClassIdsRef.current, true)) {
                            return;
                        }
                    }

                    // Check for duplicates
                    setNotifications((prev) => {
                        if (prev.some(n => n.id === newNotification.id)) return prev;
                        return [newNotification, ...prev];
                    });
                    setUnreadCount((prev) => prev + 1);

                    // Suppress toast if user is on messages page and notification is a message
                    // Access location from REF
                    const currentPath = locationRef.current;
                    const isOnMessagesPage = currentPath.startsWith('/messages');
                    const isMessageNotification = newNotification.type === 'message';

                    if (!(isOnMessagesPage && isMessageNotification)) {
                        toast(newNotification.title, {
                            description: newNotification.message,
                        });
                    }
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
    }, [user, isStudent]); // No location dependency here!

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

    const clearAllNotifications = async () => {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("recipient_id", user?.id);
            if (error) throw error;
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Error clearing all notifications:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            loading,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearAllNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
