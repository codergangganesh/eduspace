import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BookOpen,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Check,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: "assignment" | "course" | "message" | "announcement" | "grade" | "reminder";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  priority?: "high" | "medium" | "low";
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "assignment",
    title: "Assignment Due Soon",
    description: "Algorithm Analysis Report is due in 24 hours. Make sure to submit before the deadline.",
    timestamp: "10 minutes ago",
    isRead: false,
    actionUrl: "/assignments/1/submit",
    priority: "high",
  },
  {
    id: "2",
    type: "grade",
    title: "New Grade Posted",
    description: "Your grade for JavaScript Quiz has been posted. You earned 23/25 points (A).",
    timestamp: "2 hours ago",
    isRead: false,
    actionUrl: "/assignments",
  },
  {
    id: "3",
    type: "message",
    title: "New Message from Dr. Sarah Smith",
    description: "Please review the attached assignment draft guidelines...",
    timestamp: "3 hours ago",
    isRead: false,
    actionUrl: "/messages",
  },
  {
    id: "4",
    type: "course",
    title: "New Course Material Available",
    description: "Week 12 lecture slides have been uploaded for CS101 - Introduction to Computer Science.",
    timestamp: "5 hours ago",
    isRead: true,
    actionUrl: "/courses",
  },
  {
    id: "5",
    type: "announcement",
    title: "Campus Holiday Schedule",
    description: "The campus will be closed for Winter Break from December 23rd to January 2nd.",
    timestamp: "Yesterday",
    isRead: true,
  },
  {
    id: "6",
    type: "reminder",
    title: "Upcoming Class Reminder",
    description: "CS201 - Data Structures & Algorithms starts in 1 hour at Room 301.",
    timestamp: "Yesterday",
    isRead: true,
    actionUrl: "/schedule",
  },
  {
    id: "7",
    type: "assignment",
    title: "Assignment Submitted Successfully",
    description: "Your submission for Programming Assignment 3 has been received.",
    timestamp: "2 days ago",
    isRead: true,
  },
  {
    id: "8",
    type: "course",
    title: "Course Enrollment Confirmed",
    description: "You have been successfully enrolled in MATH301 - Linear Algebra for Spring 2025.",
    timestamp: "3 days ago",
    isRead: true,
  },
];

const getNotificationIcon = (type: Notification["type"]) => {
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
    case "reminder":
      return Calendar;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
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
    case "reminder":
      return "bg-pink-500";
    default:
      return "bg-gray-500";
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type === activeTab;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

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
                <DropdownMenuItem onClick={clearAll}>
                  <Trash2 className="size-4 mr-2" />
                  Clear all notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="size-4 mr-2" />
                  Notification settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

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
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border transition-all hover:bg-secondary/50 cursor-pointer group",
                          notification.isRead
                            ? "bg-surface border-border"
                            : "bg-primary/5 border-primary/20"
                        )}
                        onClick={() => markAsRead(notification.id)}
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
                                    !notification.isRead && "text-foreground"
                                  )}
                                >
                                  {notification.title}
                                </h4>
                                {notification.priority === "high" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                                {!notification.isRead && (
                                  <span className="size-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
