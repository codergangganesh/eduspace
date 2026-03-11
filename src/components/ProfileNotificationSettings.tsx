import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type NotificationSettingsState = {
    notifications_enabled: boolean;
    assignment_reminders: boolean;
    message_notifications: boolean;
    grade_updates: boolean;
    course_announcements: boolean;
};

const defaultSettings: NotificationSettingsState = {
    notifications_enabled: true,
    assignment_reminders: true,
    message_notifications: true,
    grade_updates: true,
    course_announcements: true,
};

const notificationOptions: Array<{
    field: keyof NotificationSettingsState;
    title: string;
    description: string;
}> = [
    {
        field: "assignment_reminders",
        title: "Assignments",
        description: "New assignments and assignment updates.",
    },
    {
        field: "message_notifications",
        title: "Messages",
        description: "Direct chat messages and conversation alerts.",
    },
    {
        field: "grade_updates",
        title: "Grades",
        description: "Grading, feedback, and result updates.",
    },
    {
        field: "course_announcements",
        title: "Announcements",
        description: "Class announcements, quizzes, and schedule changes.",
    },
];

export function ProfileNotificationSettings() {
    const { profile, updateProfile } = useAuth();
    const [settings, setSettings] = useState<NotificationSettingsState>({
        ...defaultSettings,
        notifications_enabled: profile?.notifications_enabled ?? true,
        assignment_reminders: profile?.assignment_reminders ?? true,
        message_notifications: profile?.message_notifications ?? true,
        grade_updates: profile?.grade_updates ?? true,
        course_announcements: profile?.course_announcements ?? true,
    });
    const [pendingField, setPendingField] = useState<keyof NotificationSettingsState | null>(null);

    useEffect(() => {
        setSettings({
            notifications_enabled: profile?.notifications_enabled ?? true,
            assignment_reminders: profile?.assignment_reminders ?? true,
            message_notifications: profile?.message_notifications ?? true,
            grade_updates: profile?.grade_updates ?? true,
            course_announcements: profile?.course_announcements ?? true,
        });
    }, [
        profile?.assignment_reminders,
        profile?.course_announcements,
        profile?.grade_updates,
        profile?.message_notifications,
        profile?.notifications_enabled,
    ]);

    const handleToggle = async (field: keyof NotificationSettingsState, enabled: boolean) => {
        const previousValue = settings[field];
        setSettings(prev => ({ ...prev, [field]: enabled }));
        setPendingField(field);

        try {
            const result = await updateProfile({ [field]: enabled });

            if (!result.success) {
                throw new Error(result.error || "Failed to update notification settings");
            }

            toast.success(enabled ? "Preference enabled" : "Preference disabled");
        } catch (error) {
            console.error('Error updating notification setting:', error);
            setSettings(prev => ({ ...prev, [field]: previousValue }));
            toast.error("Failed to update notification settings");
        } finally {
            setPendingField(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="size-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Control how and when you receive notifications
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Global Notification Toggle */}
                <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="global-notifications" className="text-base font-medium">
                            Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Receive updates for assignments, messages, quizzes, and schedule changes.
                        </p>
                    </div>
                    <Switch
                        id="global-notifications"
                        checked={settings.notifications_enabled}
                        onCheckedChange={(enabled) => handleToggle("notifications_enabled", enabled)}
                        disabled={pendingField !== null}
                    />
                </div>

                {notificationOptions.map((option) => (
                    <div key={option.field} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor={option.field} className="text-base font-medium">
                                {option.title}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {option.description}
                            </p>
                        </div>
                        <Switch
                            id={option.field}
                            checked={settings[option.field]}
                            onCheckedChange={(enabled) => handleToggle(option.field, enabled)}
                            disabled={pendingField !== null || !settings.notifications_enabled}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
