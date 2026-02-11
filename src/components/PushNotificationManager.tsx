import { useEffect } from 'react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useFCM } from '@/hooks/useFCM';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function PushNotificationManager() {
    const { user } = useAuth();
    const { subscribe: subscribeWebPush, permission: webPushPermission, isSupported: webPushSupported } = usePushSubscription();
    const { subscribe: subscribeFCM, isSupported: fcmSupported } = useFCM();
    const { toast } = useToast();

    useEffect(() => {
        if (!user || (!webPushSupported && !fcmSupported)) return;

        if (webPushPermission === 'default') {
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
                                const webPushSuccess = await subscribeWebPush();
                                const fcmSuccess = await subscribeFCM();

                                if (webPushSuccess || fcmSuccess) {
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

    }, [user, webPushPermission, webPushSupported, fcmSupported, subscribeWebPush, subscribeFCM, toast]);

    return null;
}
