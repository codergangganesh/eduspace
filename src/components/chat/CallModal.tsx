import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'audio' | 'video';
    conversationId: string;
    userName: string;
    isMeeting?: boolean;
}

export function CallModal({ isOpen, onClose, type, conversationId, userName, isMeeting }: CallModalProps) {
    // Use a sanitized room name
    const roomName = isMeeting
        ? `Eduspace_Meeting_${conversationId}`
        : `Eduspace_Secure_${conversationId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Jitsi configuration
    // We use the public meet.jit.si instance
    const domain = "meet.jit.si";
    const options = [
        `config.prejoinPageEnabled=false`,
        `config.startWithAudioMuted=true`,
        `config.startWithVideoMuted=${type === 'audio' ? 'true' : 'false'}`,
        `userInfo.displayName=${encodeURIComponent(userName)}`,
        `interfaceConfig.SHOW_JITSI_WATERMARK=false`,
        `interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`,
        `interfaceConfig.SHOW_BRAND_WATERMARK=false`,
        `interfaceConfig.SHOW_POWERED_BY=false`,
        `interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE=false`,
    ].join('&');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none overflow-hidden bg-black border-none [&>button]:hidden">
                <div className="relative w-full h-full flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                        <div className="text-white font-medium">
                            {type === 'audio' ? 'Audio Call' : 'Video Call'}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full"
                            onClick={onClose}
                        >
                            <X className="size-5" />
                        </Button>
                    </div>

                    {/* Jitsi Iframe */}
                    <iframe
                        src={`https://${domain}/${roomName}#${options}`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="w-full h-full border-none"
                        title="Jitsi Meet"
                    />

                    {/* Fallback info / Loading state could go here but iframe handles it */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
