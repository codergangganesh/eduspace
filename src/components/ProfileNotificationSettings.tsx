import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileNotificationSettings() {
    const { profile } = useAuth();
    const [globalEnabled, setGlobalEnabled] = useState(profile?.notifications_enabled ?? true);
    const [isUpdating, setIsUpdating] = useState(false);

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
                        checked={globalEnabled}
                        onCheckedChange={handleGlobalToggle}
                        disabled={isUpdating}
                    />
                </div>


            </CardContent>
        </Card>
    );
}
