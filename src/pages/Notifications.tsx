import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BookOpen,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle,
  Info,
  Trash2,
  Check,
  Settings,
  MoreHorizontal,
  Loader2,
  Clock,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useAccessRequests } from "@/hooks/useAccessRequests";
import { AccessRequestCard } from "@/components/student/AccessRequestCard";
import { JoinRequestModal } from "@/components/student/JoinRequestModal";
import { useStudentOnboarding } from "@/hooks/useStudentOnboarding";
import { toast } from "sonner";

type NotificationType = 'assignment' | 'schedule' | 'message' | 'grade' | 'announcement' | 'general' | 'access_request';

interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "assignment":
      return FileText;
    case "course":
      return BookOpen;
    case "message":
      return MessageSquare;
    case "announcement":
      return Bell;
    case "grade":
      return CheckCircle;
    case "schedule":
      return Calendar;
    case "access_request":
      return GraduationCap;
    default:
      return Info;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "assignment":
      return "bg-blue-500";
    case "course":
      return "bg-purple-500";
    case "message":
      return "bg-green-500";
    case "announcement":
      return "bg-orange-500";
    case "grade":
      return "bg-emerald-500";
    case "schedule":
      return "bg-pink-500";
    case "access_request":
      return "bg-indigo-500";
    default:
      return "bg-gray-500";
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const { getMyAccessRequests } = useAccessRequests();
  const {
    pendingInvitations,
    showModal,
    dismissModal,
    refreshInvitations,
    reopenModalForRequest,
    markRequestAsHandled
  } = useStudentOnboarding();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadAccessRequests();
  }, []);

  const loadAccessRequests = async () => {
    try {
      setLoadingRequests(true);
      const requests = await getMyAccessRequests();
      setAccessRequests(requests || []);
    } catch (error) {
      console.error("Error loading access requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setShowClearConfirm(false);
    toast.success("All notifications cleared");
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.is_read;
    if (activeTab === "access_requests") return notification.type === "access_request";
    return notification.type === activeTab;
  });

  if (loading && loadingRequests) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="default">{unreadCount} new</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Stay updated with your courses, assignments, and messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <Check className="size-4 mr-2" />
              Mark all as read
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowClearConfirm(true)}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="size-4 mr-2" />
                  Clear all notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile?tab=notifications')}>
                  <Settings className="size-4 mr-2" />
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Access Requests Section */}
        {accessRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Pending Class Invitations</h2>
              <Badge variant="secondary">{accessRequests.length}</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {accessRequests.map((request) => (
                <AccessRequestCard
                  key={request.id}
                  request={request}
                  onRespond={loadAccessRequests}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              Unread
              {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="access_requests">Class Invitations</TabsTrigger>
            <TabsTrigger value="assignment">Assignments</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="message">Messages</TabsTrigger>
            <TabsTrigger value="announcement">Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-xl border border-border">
                <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Bell className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {activeTab === "unread"
                    ? "You're all caught up!"
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border transition-all hover:bg-secondary/50 cursor-pointer group",
                          notification.is_read
                            ? "bg-surface border-border"
                            : "bg-primary/5 border-primary/20"
                        )}
                        onClick={() => {
                          // Handle access_request notifications differently
                          if (notification.type === 'access_request' && notification.related_id) {
                            // Reopen modal for this specific request
                            reopenModalForRequest(notification.related_id);
                            // Mark as read
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                          } else {
                            setSelectedNotification(notification);
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                          }
                        }}
                      >
                        {/* Icon */}
                        <div
                          className={cn(
                            "size-10 rounded-full flex items-center justify-center shrink-0 text-white",
                            getNotificationColor(notification.type)
                          )}
                        >
                          <Icon className="size-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4
                                  className={cn(
                                    "font-medium",
                                    !notification.is_read && "text-foreground"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <span className="size-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Notification Detail Modal */}
        <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedNotification && (() => {
                  const Icon = getNotificationIcon(selectedNotification.type);
                  return (
                    <>
                      <div className={cn(
                        "size-10 rounded-full flex items-center justify-center text-white",
                        getNotificationColor(selectedNotification.type)
                      )}>
                        <Icon className="size-5" />
                      </div>
                      <span>{selectedNotification.title}</span>
                    </>
                  );
                })()}
              </DialogTitle>
            </DialogHeader>

            {selectedNotification && (
              <div className="space-y-4">
                {/* Type Badge */}
                <div>
                  <Badge variant="outline" className="capitalize">
                    {selectedNotification.type.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Full Message */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  <span>
                    {new Date(selectedNotification.created_at).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                    Close
                  </Button>
                  {selectedNotification.related_id && (
                    <Button onClick={() => {
                      console.log('Navigate to:', selectedNotification.type, selectedNotification.related_id);
                      setSelectedNotification(null);
                    }}>
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Clear All Confirmation Dialog */}
        <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Notifications?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}.
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearAll}>
                  <Trash2 className="size-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Join Request Modal */}
        <JoinRequestModal
          open={showModal}
          onOpenChange={dismissModal}
          pendingInvitations={pendingInvitations}
          onRequestHandled={refreshInvitations}
          onRequestMarkedAsHandled={markRequestAsHandled}
        />
      </div>
    </DashboardLayout>
  );
}
