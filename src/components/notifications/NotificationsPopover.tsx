import { Bell, CheckCheck, MessageSquare, FileText, Calendar, UserPlus, Upload, CheckCircle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export function NotificationsPopover() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
    const navigate = useNavigate();

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "message":
                return <MessageSquare className="h-4 w-4" />;
            case "assignment":
                return <FileText className="h-4 w-4" />;
            case "schedule":
                return <Calendar className="h-4 w-4" />;
            case "access_request":
                return <UserPlus className="h-4 w-4" />;
            case "submission":
                return <Upload className="h-4 w-4" />;
            case "grade":
                return <CheckCircle className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate based on type and related_id
        if (notification.link) {
            navigate(notification.link);
        } else if (notification.related_id) {
            switch (notification.type) {
                case "message":
                    navigate(`/messages?conversation=${notification.related_id}`);
                    break;
                case "assignment":
                    navigate(`/assignments?id=${notification.related_id}`);
                    break;
                case "schedule":
                    navigate(`/schedule?id=${notification.related_id}`);
                    break;
                case "access_request":
                    navigate(`/classes?request=${notification.related_id}`);
                    break;
                case "submission":
                    navigate(`/lecturer-assignments?submission=${notification.related_id}`);
                    break;
                case "grade":
                    navigate(`/assignments?id=${notification.related_id}`);
                    break;
                default:
                    navigate("/notifications");
            }
        } else {
            navigate("/notifications");
        }
    };

    // Group notifications by date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groupedNotifications = {
        today: notifications.filter(n => new Date(n.created_at) >= today),
        yesterday: notifications.filter(n => {
            const date = new Date(n.created_at);
            return date >= yesterday && date < today;
        }),
        earlier: notifications.filter(n => new Date(n.created_at) < yesterday),
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className={cn(
                                "absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1",
                                "flex items-center justify-center text-xs font-bold",
                                "animate-in zoom-in-50 duration-200"
                            )}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b">
                        <div>
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {unreadCount} unread
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs"
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                            <p className="text-sm text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-sm font-medium mb-1">No notifications</p>
                            <p className="text-xs text-muted-foreground">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px]">
                            <div className="p-2">
                                {/* Today */}
                                {groupedNotifications.today.length > 0 && (
                                    <div className="mb-4">
                                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Today
                                        </p>
                                        {groupedNotifications.today.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={() => handleNotificationClick(notification)}
                                                icon={getNotificationIcon(notification.type)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Yesterday */}
                                {groupedNotifications.yesterday.length > 0 && (
                                    <div className="mb-4">
                                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Yesterday
                                        </p>
                                        {groupedNotifications.yesterday.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={() => handleNotificationClick(notification)}
                                                icon={getNotificationIcon(notification.type)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Earlier */}
                                {groupedNotifications.earlier.length > 0 && (
                                    <div className="mb-4">
                                        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Earlier
                                        </p>
                                        {groupedNotifications.earlier.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={() => handleNotificationClick(notification)}
                                                icon={getNotificationIcon(notification.type)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <>
                            <Separator />
                            <div className="p-2">
                                <Button
                                    variant="ghost"
                                    className="w-full text-sm"
                                    onClick={() => navigate("/notifications")}
                                >
                                    View all notifications
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    icon: React.ReactNode;
}

function NotificationItem({ notification, onClick, icon }: NotificationItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                "hover:bg-secondary",
                !notification.is_read && "bg-primary/5"
            )}
        >
            <div
                className={cn(
                    "mt-0.5 p-2 rounded-full shrink-0",
                    notification.is_read ? "bg-secondary" : "bg-primary/10"
                )}
            >
                <div className={cn(notification.is_read ? "text-muted-foreground" : "text-primary")}>
                    {icon}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium mb-0.5", !notification.is_read && "font-semibold")}>
                    {notification.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>
            {!notification.is_read && (
                <div className="mt-2 shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
            )}
        </button>
    );
}
