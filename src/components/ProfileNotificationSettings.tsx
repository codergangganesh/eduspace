import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Smartphone, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProfileNotificationSettings() {
    const { profile } = useAuth();
    const {
        permission,
        isSupported,
        subscribe,
        notificationEnabled,
        enableNotifications,
        disableNotifications,
        subscription
    } = usePushSubscription();

    const [pushEnabled, setPushEnabled] = useState(notificationEnabled);
    const [globalEnabled, setGlobalEnabled] = useState(profile?.notifications_enabled ?? true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setPushEnabled(notificationEnabled);
    }, [notificationEnabled]);

    useEffect(() => {
        setGlobalEnabled(profile?.notifications_enabled ?? true);
    }, [profile?.notifications_enabled]);

    const handleGlobalToggle = async (enabled: boolean) => {
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ notifications_enabled: enabled })
                .eq('user_id', profile?.user_id);

            if (error) throw error;

            setGlobalEnabled(enabled);
            toast.success(
                enabled
                    ? "All notifications enabled"
                    : "All notifications disabled"
            );
        } catch (error) {
            console.error('Error updating global notification setting:', error);
            toast.error("Failed to update notification settings");
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePushToggle = async (enabled: boolean) => {
        if (!isSupported) {
            toast.error("Push notifications are not supported on this device");
            return;
        }

        setIsUpdating(true);
        try {
            if (enabled) {
                // If no subscription exists, request permission and subscribe
                if (permission !== 'granted') {
                    const success = await subscribe();
                    if (!success) {
                        toast.error("Please allow notifications in your browser settings");
                        setIsUpdating(false);
                        return;
                    }
                } else if (subscription) {
                    // Subscription exists, just enable it
                    const success = await enableNotifications();
                    if (!success) {
                        toast.error("Failed to enable push notifications");
                        setIsUpdating(false);
                        return;
                    }
                } else {
                    // Permission granted but no subscription, create one
                    const success = await subscribe();
                    if (!success) {
                        toast.error("Failed to enable push notifications");
                        setIsUpdating(false);
                        return;
                    }
                }
                setPushEnabled(true);
                toast.success("Push notifications enabled");
            } else {
                // Disable push notifications (keep subscription)
                const success = await disableNotifications();
                if (!success) {
                    toast.error("Failed to disable push notifications");
                    setIsUpdating(false);
                    return;
                }
                setPushEnabled(false);
                toast.success("Push notifications disabled");
            }
        } catch (error) {
            console.error('Error toggling push notifications:', error);
            toast.error("Failed to update push notification settings");
        } finally {
            setIsUpdating(false);
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
                            All Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Master toggle for all notification types. When disabled, you won't receive any notifications.
                        </p>
                    </div>
                    <Switch
                        id="global-notifications"
                        checked={globalEnabled}
                        onCheckedChange={handleGlobalToggle}
                        disabled={isUpdating}
                    />
                </div>

                {/* Push Notification Toggle */}
                {isSupported && (
                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="push-notifications" className="text-base font-medium flex items-center gap-2">
                                <Smartphone className="size-4" />
                                Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive native push notifications even when the app is closed. Works on mobile and desktop.
                            </p>
                            {permission === 'denied' && (
                                <p className="text-sm text-destructive">
                                    ⚠️ Push notifications are blocked. Please enable them in your browser settings.
                                </p>
                            )}
                            {permission === 'default' && (
                                <p className="text-sm text-amber-600 dark:text-amber-500">
                                    Click to enable and grant permission
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {isUpdating && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                            <Switch
                                id="push-notifications"
                                checked={pushEnabled && globalEnabled}
                                onCheckedChange={handlePushToggle}
                                disabled={isUpdating || !globalEnabled || permission === 'denied'}
                            />
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex items-start gap-2">
                        {globalEnabled && pushEnabled ? (
                            <Bell className="size-5 text-emerald-500 mt-0.5" />
                        ) : (
                            <BellOff className="size-5 text-muted-foreground mt-0.5" />
                        )}
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                                {globalEnabled && pushEnabled
                                    ? "You're all set!"
                                    : "Notifications are disabled"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {globalEnabled && pushEnabled
                                    ? "You'll receive push notifications for assignments, messages, quizzes, and schedule updates even when the app is closed."
                                    : globalEnabled
                                        ? "Enable push notifications to receive updates when the app is closed."
                                        : "Enable notifications to stay updated with your classes."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Browser Permission Helper */}
                {permission === 'denied' && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                        <p className="text-sm font-medium text-destructive mb-2">
                            Browser Permissions Required
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                            Push notifications are blocked by your browser. To enable them:
                        </p>
                        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                            <li>Click the lock icon in your browser's address bar</li>
                            <li>Find "Notifications" in the permissions list</li>
                            <li>Change it from "Block" to "Allow"</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
