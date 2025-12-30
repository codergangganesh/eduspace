import { Bell, FileText, CheckCircle, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityFeed() {
    const { notifications, loading } = useNotifications();
    const navigate = useNavigate();

    // Helper to get icon based on notification type
    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return <FileText className="size-4 text-blue-500" />;
            case 'grade': return <CheckCircle className="size-4 text-green-500" />;
            case 'message': return <MessageSquare className="size-4 text-purple-500" />;
            default: return <Info className="size-4 text-gray-500" />;
        }
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground p-4">Loading activity...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Bell className="size-8 mb-2 opacity-20" />
                <p className="text-sm">No recent activity</p>
            </div>
        );
    }

    // Take only the last 5 notifications for the feed
    const recentActivity = notifications.slice(0, 5);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate('/notifications')}
                >
                    <Bell className="size-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="relative space-y-6 ml-2 pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-border/50">
                    {recentActivity.map((item) => (
                        <div key={item.id} className="relative group">
                            {/* Timeline Dot */}
                            <div className="absolute left-[-21px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground/30 group-hover:bg-primary transition-colors" />

                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    {getIcon(item.type)}
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground leading-snug font-medium">
                                    {item.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {item.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Button
                variant="ghost"
                className="w-full mt-4 text-xs h-8"
                onClick={() => navigate('/notifications')}
            >
                View All Notifications
            </Button>
        </div>
    );
}
