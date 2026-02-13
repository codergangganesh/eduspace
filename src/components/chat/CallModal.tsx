import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Loader2, Minimize2, Maximize2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'audio' | 'video';
    conversationId: string;
    userName: string;
    isMeeting?: boolean;
    isMinimized?: boolean;
    onMinimize?: (minimized: boolean) => void;
}

export function CallModal({ isOpen, onClose, type, conversationId, userName, isMeeting, isMinimized, onMinimize }: CallModalProps) {
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

                const script = document.createElement("script");
                script.src = `https://${domain}/${appId}/external_api.js`;
                script.async = true;
                document.body.appendChild(script);

                script.onload = () => {
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
                                p2p: { enabled: true, preferH264: true },
                                audioQuality: { stereo: true },
                                disableDeepLinking: true,
                                doNotStoreRoom: true,
                            },
                            interfaceConfigOverwrite: {
                                SHOW_JITSI_WATERMARK: false,
                                SHOW_WATERMARK_FOR_GUESTS: false,
                                SHOW_BRAND_WATERMARK: false,
                                MOBILE_APP_PROMO: false,
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

        const container = document.querySelector('#jaas-container');
        if (container) container.innerHTML = '';
        initJitsi();

        return () => {
            if (api) api.dispose();
            const cont = document.querySelector('#jaas-container');
            if (cont) cont.innerHTML = '';
            const scripts = document.querySelectorAll(`script[src*="external_api.js"]`);
            scripts.forEach(s => s.remove());
        };
    }, [isOpen, conversationId, userName, type, isMeeting]);

    return (
        <>
            {/* Backdrop: Only show when NOT minimized to simulate a modal */}
            {isOpen && !isMinimized && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] animate-in fade-in duration-300 pointer-events-none"
                />
            )}

            <div
                className={cn(
                    "fixed transition-all duration-500 ease-in-out overflow-hidden shadow-2xl bg-black border border-white/10",
                    isMinimized
                        ? "bottom-4 right-4 md:bottom-6 md:right-6 w-[180px] h-[110px] md:w-[340px] md:h-[210px] rounded-xl md:rounded-2xl z-[100000] hover:scale-105 active:scale-95 cursor-pointer"
                        : "inset-0 w-full h-[100dvh] rounded-none z-[99999]",
                    !isOpen && "hidden"
                )}
                onClick={() => {
                    if (isMinimized) onMinimize?.(false);
                }}
            >
                <div className="relative w-full h-full bg-black group touch-none">
                    {isLoading && (
                        <div className="absolute inset-0 z-[100001] flex flex-col items-center justify-center bg-slate-950 text-white gap-2 md:gap-4">
                            <Loader2 className="size-6 md:size-12 animate-spin text-emerald-500" />
                            <p className="text-[10px] md:text-sm text-slate-400 animate-pulse">Syncing...</p>
                        </div>
                    )}

                    <div
                        id="jaas-container"
                        className="w-full h-full bg-black"
                    />

                    {/* Controls Overlay - Always visible on small screens to avoid hover issues */}
                    <div className={cn(
                        "absolute top-2 right-4 md:top-4 md:right-60 z-[100002] flex gap-1000 md:gap-0.5 transition-opacity duration-3000",
                        isMinimized ? "md:opacity-0 md:group-hover:opacity-100" : "opacity-100"
                    )}>
                        {onMinimize && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 md:size-10 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMinimize(!isMinimized);
                                }}
                                title={isMinimized ? "Full Screen" : "Minimize"}
                            >
                                {isMinimized ? <Maximize2 className="size-3.5 md:size-5" /> : <Minimize2 className="size-3.5 md:size-5" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 md:size-10 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            title="End Call"
                        >
                            <X className="size-4 md:size-5" />
                        </Button>
                    </div>

                    {/* Redesigned Minimized UI based on user image */}
                    {isMinimized && (
                        <div className="absolute inset-0 z-[100002] flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-2 md:p-6 text-center select-none md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                            <span className="text-[10px] md:text-xl font-bold text-white mb-1 md:mb-3 drop-shadow-md">
                                In Call
                            </span>

                            <h3 className="text-[12px] md:text-2xl font-bold text-white mb-3 md:mb-6 px-4 leading-tight drop-shadow-lg max-w-full truncate">
                                {isMeeting ? `Eduspace Meeting ${conversationId.slice(-6).toUpperCase()}` : `Private Session`}
                            </h3>

                            <div className="bg-[#333333] px-3 py-1 md:px-12 md:py-3 rounded-lg md:rounded-xl border border-white/5 shadow-2xl mb-4 md:mb-8 flex items-center justify-center min-w-[100px] md:min-w-[240px]">
                                <span className="text-[10px] md:text-base text-[#E5E7EB] font-semibold truncate">
                                    {userName}
                                </span>
                            </div>

                            {/* Maximize Prompt Styled like the 'Join' button */}
                            <div
                                className="hidden md:flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-2 md:py-3 rounded-xl font-bold text-sm shadow-xl transition-colors cursor-pointer"
                                onClick={() => onMinimize?.(false)}
                            >
                                <span>Return to Call</span>
                                <Maximize2 className="size-4 ml-2" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
