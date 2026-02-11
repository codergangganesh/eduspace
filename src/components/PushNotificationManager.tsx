import { useEffect } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export function PushNotificationManager() {
    const { user } = useAuth();
    const { subscribe, permission, isSupported } = usePushSubscription();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !isSupported) return;

        // If already granted, the hook will have synced the subscription on mount
        // If denied, we can't do anything.
        // If default, we could prompt, but we want to avoid spam.
        // Let's prompt ONCE if it's default and we haven't asked recently?
        // Or just leave it to a manual action in Settings.

        // For this requirement: "Enable real mobile push notifications... Prevent spammy permission prompts"
        // We will NOT auto-prompt. We rely on the user to enable it in Settings or via a specific "Enable Notifications" toast?

        // Let's show a toast if permission is default, encouraging them to enable it.
        if (permission === 'default') {
            const hasAsked = localStorage.getItem('eduspace_push_asked');
            if (!hasAsked) {
                toast({
                    title: "Enable Notifications",
                    description: "Get real-time updates for assignments and messages.",
                    action: (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                                const success = await subscribe();
                                if (success) {
                                    toast({
                                        title: "Notifications Enabled",
                                        description: "You're all set! You'll receive updates even when the app is closed.",
                                        variant: "default"
                                    });
                                } else {
                                    // Subscription failed (likely permission denied)
                                    toast({
                                        title: "Action Required",
                                        description: "Notifications are blocked by your browser. Please enable them in your site settings to receive updates.",
                                        variant: "destructive"
                                    });
                                }
                            }}
                        >
                            Enable
                        </Button>
                    ),
                    duration: 10000,
                });
                localStorage.setItem('eduspace_push_asked', 'true');
            }
        }

    }, [user, permission, isSupported, subscribe, toast]);

    return null;
}
