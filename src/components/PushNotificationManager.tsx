import { useEffect } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function PushNotificationManager() {
    const { user } = useAuth();
    const { subscribe, permission, isSupported } = usePushSubscription();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || !isSupported) return;

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
                                    toast({
                                        title: "Action Required",
                                        description: "Notifications might be blocked. Please check your browser settings.",
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
