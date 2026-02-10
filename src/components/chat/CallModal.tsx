import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'audio' | 'video';
    conversationId: string;
    userName: string;
    isMeeting?: boolean;
}

export function CallModal({ isOpen, onClose, type, conversationId, userName, isMeeting }: CallModalProps) {
    const appId = "vpaas-magic-cookie-f796d7a3ec46435793193a60b0aef396";
    const domain = "8x8.vc";
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        let api: any = null;

        const initJitsi = async () => {
            try {
                setIsLoading(true);

                const conferenceName = (isMeeting
                    ? `eduspace_meeting_${conversationId}`
                    : `eduspace_secure_${conversationId.replace(/[^a-zA-Z0-9]/g, '_')}`).toLowerCase();

                // 1. Fetch the JWT token from our secure edge function
                const { data, error } = await supabase.functions.invoke('generate-jitsi-token', {
                    body: {
                        roomName: conferenceName,
                        userProfile: {
                            id: (await supabase.auth.getUser()).data.user?.id || 'unknown',
                            name: userName
                        }
                    }
                });

                if (error) throw error;

                // 2. Load Jitsi External API Script
                const script = document.createElement("script");
                script.src = `https://${domain}/${appId}/external_api.js`;
                script.async = true;
                document.body.appendChild(script);

                script.onload = () => {
                    // 8x8 JaaS requires the format: appId/roomName
                    const roomName = `${appId}/${conferenceName}`;

                    if ((window as any).JitsiMeetExternalAPI) {
                        api = new (window as any).JitsiMeetExternalAPI(domain, {
                            roomName: roomName,
                            parentNode: document.querySelector('#jaas-container'),
                            width: '100%',
                            height: '100%',
                            jwt: data.token,
                            configOverwrite: {
                                prejoinPageEnabled: false,
                                startWithAudioMuted: false,
                                startWithVideoMuted: type === 'audio',
                                startAudioOnly: type === 'audio',
                                disableThirdPartyRequests: false,
                                enableNoAudioDetection: true,
                                enableNoNotificationsIsolation: true,
                                p2p: {
                                    enabled: true,
                                    preferH264: true,
                                    disableH264: false,
                                },
                                // Higher quality audio settings
                                audioQuality: {
                                    stereo: true
                                },
                                disableDeepLinking: true,
                                doNotStoreRoom: true,
                            },
                            prejoinConfigOverwrite: {
                                enabled: false
                            },
                            interfaceConfigOverwrite: {
                                SHOW_JITSI_WATERMARK: false,
                                SHOW_WATERMARK_FOR_GUESTS: false,
                                SHOW_BRAND_WATERMARK: false,
                                BRAND_WATERMARK_LINK: '',
                                MOBILE_APP_PROMO: false,
                                DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                                ENABLE_FEEDBACK_ANIMATION: false,
                                TOOLBAR_BUTTONS: [
                                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                                    'security'
                                ],
                            },
                        });

                        api.addEventListener('videoConferenceLeft', () => {
                            onClose();
                        });

                        setIsLoading(false);
                    }
                };
            } catch (err) {
                console.error("Failed to initialize Jitsi:", err);
                setIsLoading(false);
            }
        };

        initJitsi();

        return () => {
            if (api) api.dispose();
            const container = document.querySelector('#jaas-container');
            if (container) container.innerHTML = '';
            const scripts = document.querySelectorAll(`script[src*="external_api.js"]`);
            scripts.forEach(s => s.remove());
        };
    }, [isOpen, conversationId, userName, type, isMeeting]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="fixed inset-0 w-[100vw] h-[100dvh] max-w-none m-0 p-0 rounded-none overflow-hidden bg-black border-none [&>button]:hidden z-[1000]">
                {isLoading && (
                    <div className="absolute inset-0 z-[1100] flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
                        <div className="relative">
                            <Loader2 className="size-12 animate-spin text-emerald-500" />
                            <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold px-4">Establishing Secure Connection</h3>
                            <p className="text-sm text-slate-400">Verifying session with 8x8 JaaS...</p>
                        </div>
                    </div>
                )}

                <div id="jaas-container" className="absolute inset-0 w-full h-full bg-black" />

                {/* Close Button Overlay */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-[1200] text-white hover:bg-white/10 rounded-full bg-black/20 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <X className="size-5" />
                </Button>
            </DialogContent>
        </Dialog>
    );
}
