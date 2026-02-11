import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Loader2, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export function TestPushNotification() {
    const { profile } = useAuth();
    const { permission, isSupported, subscribe } = usePushSubscription();
    const [isTesting, setIsTesting] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleTest = async () => {
        // Safety check: Respect notification preference
        if (profile?.notifications_enabled === false) {
            toast.error("Notifications are disabled in your profile settings.");
            return;
        }

        if (!isSupported) {
            toast.error("Push notifications are not supported by this browser.");
            return;
        }

        if (permission !== 'granted') {
            const success = await subscribe();
            if (!success) {
                toast.error("Please enable notification permissions to test push.");
                return;
            }
        }

        setIsTesting(true);
        setCountdown(5);

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    sendTestNotification();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const sendTestNotification = async () => {
        setIsTesting(false);
        const isBackground = document.visibilityState === 'hidden';

        if (isBackground) {
            // Case B: Background - Send Push via Edge Function
            try {
                const { error } = await supabase.functions.invoke('send-push', {
                    body: {
                        user_id: profile?.user_id,
                        title: "Test Notification",
                        body: "This is a test push notification.",
                        url: "/lecturer-dashboard",
                        type: "test",
                        icon: profile?.avatar_url || "/pwa-192x192.png",
                        badge: "/pwa-192x192.png"
                    }
                });

                if (error) throw error;
                // Since user is in background, they won't see this toast immediately
            } catch (err) {
                console.error("Test push failed:", err);
                // This might not be seen if they are in background, but good to have
            }
        } else {
            // Case A: Active - Show in-app only
            try {
                const { error } = await supabase.from("notifications").insert({
                    recipient_id: profile?.user_id,
                    title: "Test Notification",
                    message: "This is a test in-app notification.",
                    type: "general",
                    sender_id: profile?.user_id,
                    is_read: false
                });

                if (error) throw error;
                // useNotifications hook will handle the toast and bell update
            } catch (err) {
                console.error("Test in-app failed:", err);
                toast.error("Failed to create test notification.");
            }
        }
    };

    return (
        <Card className="border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-background overflow-hidden shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Bell className="size-4 text-indigo-500" />
                        Notification Test
                    </span>
                    {permission === 'granted' ? (
                        <span title="Permissions Granted">
                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                        </span>
                    ) : (
                        <span title="Action Required">
                            <ShieldAlert className="size-3.5 text-amber-500" />
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Test push functionality. Click and switch to background within 5 seconds to receive a system notification.
                </p>
                <Button
                    size="sm"
                    className="w-full gap-2 transition-all shadow-sm"
                    onClick={handleTest}
                    disabled={isTesting}
                    variant={isTesting ? "outline" : (permission === 'granted' ? "default" : "secondary")}
                >
                    {isTesting ? (
                        <>
                            <Loader2 className="size-3 animate-spin" />
                            Sending in {countdown}s...
                        </>
                    ) : (
                        <>
                            <Send className="size-3" />
                            {permission === 'granted' ? 'Send Test Notification' : 'Enable & Test Push'}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
