import React, { useState, useEffect, useRef } from 'react';
import { useCall } from '@/contexts/CallContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    Maximize2, Minimize2, X, Loader2,
    ChevronDown, Lock, UserPlus, Volume2, Grid, MessageSquare,
    GripVertical, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function PrivateCallManager() {
    const { activeCall, endCall, acceptCall, rejectCall, isMinimized, setMinimized } = useCall();
    const { user, profile } = useAuth();

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true); // Default to speaker on for web calls
    const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
    const [timer, setTimer] = useState(0);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const ringtoneRef = useRef<HTMLAudioElement>(null);
    const timerInterval = useRef<any>(null);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    // Notification Permission Warning
    useEffect(() => {
        if (!("Notification" in window)) return;

        if (Notification.permission === 'denied') {
            const hasWarned = sessionStorage.getItem('call_notif_denied_warned');
            if (!hasWarned) {
                toast.warning("Notifications are blocked. You might miss incoming calls when the app is in the background.", {
                    description: "Please enable them in your browser settings.",
                    duration: 10000
                });
                sessionStorage.setItem('call_notif_denied_warned', 'true');
            }
        }
    }, []);

    // 1-Minute Auto-End Rule
    useEffect(() => {
        if (activeCall?.status === 'active' && activeCall.category === 'private') {
            timerInterval.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerInterval.current);
            setTimer(0);
        }

        // Auto-end call after 60 mins (safety)
        if (timer > 3600) {
            endCall();
        }

        return () => clearInterval(timerInterval.current);
    }, [activeCall?.status, activeCall?.category, endCall, timer]);

    // Ringtone Management & Vibration
    useEffect(() => {
        let vibrationInterval: any = null;
        let ringtoneRetryInterval: any = null;
        const ringtone = ringtoneRef.current;

        const attemptPlayRingtone = async () => {
            if (!ringtone) return;
            try {
                ringtone.volume = 1.0;
                ringtone.currentTime = 0;
                await ringtone.play();
                console.log("[CallManager] Ringtone playing successfully");
                if (ringtoneRetryInterval) clearInterval(ringtoneRetryInterval);
            } catch (e) {
                console.warn("[CallManager] Ringtone blocked by browser:", e);
            }
        };

        if (activeCall?.status === 'incoming') {
            console.log("[CallManager] Incoming call detected, triggering ringtone/vibration...");
            attemptPlayRingtone();

            // Set a retry interval just in case
            ringtoneRetryInterval = setInterval(() => {
                attemptPlayRingtone();
            }, 3000);

            // Start vibration (for supported mobile devices)
            if ("vibrate" in navigator) {
                try {
                    navigator.vibrate([1000, 500, 1000, 500, 1000]);
                    vibrationInterval = setInterval(() => {
                        navigator.vibrate([1000, 500]);
                    }, 1500);
                } catch (e) {
                    console.error("[CallManager] Vibration failed:", e);
                }
            }
        } else {
            console.log("[CallManager] Call status changed, stopping ringtone/vibration.");
            if (ringtone) {
                ringtone.pause();
                ringtone.currentTime = 0;
            }
            if (vibrationInterval) clearInterval(vibrationInterval);
            if (ringtoneRetryInterval) clearInterval(ringtoneRetryInterval);
            if ("vibrate" in navigator) navigator.vibrate(0);
        }

        return () => {
            if (vibrationInterval) clearInterval(vibrationInterval);
            if (ringtoneRetryInterval) clearInterval(ringtoneRetryInterval);
            if ("vibrate" in navigator) navigator.vibrate(0);
        };
    }, [activeCall?.status]);

    // Global interaction listener to unblock audio
    useEffect(() => {
        const handleInteraction = () => {
            if (activeCall?.status === 'incoming' && ringtoneRef.current) {
                ringtoneRef.current.play().catch(() => { });
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [activeCall?.status]);

    // WebRTC Logic
    useEffect(() => {
        if (!activeCall || activeCall.category !== 'private' || !user) return;

        const setupWebRTC = async () => {
            console.log("Setting up WebRTC...", activeCall.type);
            peerConnection.current = new RTCPeerConnection(iceServers);

            peerConnection.current.onconnectionstatechange = () => {
                const state = peerConnection.current?.connectionState;
                console.log("Connection state change:", state);
                if (state === 'connected') {
                    toast.success("Call connected");
                } else if (state === 'failed') {
                    toast.error("Connection failed");
                    endCall();
                } else if (state === 'disconnected') {
                    toast.info("Peer disconnected");
                    endCall();
                }
            };

            // Add local stream tracks to peer connection
            if (activeCall.status === 'active') {
                try {
                    console.log("Requesting user media...");
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: activeCall.type === 'video',
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                    });
                    setLocalStream(stream);

                    stream.getTracks().forEach(track => {
                        peerConnection.current?.addTrack(track, stream);
                    });

                    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                    // Don't play local audio to avoid feedback loop, but visualize?
                } catch (err) {
                    console.error("Error accessing media devices:", err);
                    toast.error("Could not access camera/microphone");
                    return; // Stop setup if media fails
                }
            }

            // Listen for remote tracks
            peerConnection.current.ontrack = (event) => {
                console.log("[CallManager] Remote track received:", event.track.kind);
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                        remoteVideoRef.current.play().catch(e => console.warn("[CallManager] Video play blocked:", e));
                    }
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = event.streams[0];
                        remoteAudioRef.current.play().catch(e => console.warn("[CallManager] Audio play blocked:", e));
                    }
                }
            };

            // ICE Candidate handling
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    supabase.channel(`calls:${activeCall.peerId}`).send({
                        type: 'broadcast',
                        event: 'call:ice-candidate',
                        payload: { candidate: event.candidate, senderId: user.id },
                    });
                }
            };

            // Negotiation handling
            if (activeCall.isInitiator && activeCall.status === 'active') {
                const offer = await peerConnection.current.createOffer();
                await peerConnection.current.setLocalDescription(offer);
                supabase.channel(`calls:${activeCall.peerId}`).send({
                    type: 'broadcast',
                    event: 'call:sdp-offer',
                    payload: { sdp: offer, senderId: user.id },
                });
            }
        };

        if (activeCall.status === 'active') {
            setupWebRTC();
        }

        // Signaling listeners
        const channel = supabase.channel(`calls:${user.id}`);
        channel
            .on('broadcast', { event: 'call:sdp-offer' }, async ({ payload }) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    const answer = await peerConnection.current.createAnswer();
                    await peerConnection.current.setLocalDescription(answer);
                    supabase.channel(`calls:${activeCall.peerId}`).send({
                        type: 'broadcast',
                        event: 'call:sdp-answer',
                        payload: { sdp: answer, senderId: user.id },
                    });
                }
            })
            .on('broadcast', { event: 'call:sdp-answer' }, async ({ payload }) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                }
            })
            .on('broadcast', { event: 'call:ice-candidate' }, async ({ payload }) => {
                if (peerConnection.current) {
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                    } catch (e) {
                        console.error("Error adding ice candidate:", e);
                    }
                }
            })
            .on('broadcast', { event: 'call:accepted' }, () => {
                // If we are initiator and they accepted, we move to active
                // (Context already handles state update, but we might need trigger setup here)
            })
            .on('broadcast', { event: 'call:camera-toggle' }, ({ payload }) => {
                if (payload.senderId === activeCall.peerId) {
                    setIsRemoteVideoOff(payload.isCameraOff);
                }
            })
            .on('broadcast', { event: 'call:rejected' }, () => {
                toast.error("Call rejected");
                endCall();
            })
            .on('broadcast', { event: 'call:ended' }, () => {
                toast.info("Call ended by peer");
                endCall();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
            localStream?.getTracks().forEach(track => track.stop());
            peerConnection.current?.close();
        };
    }, [activeCall?.status, activeCall?.category, user]);

    if (!activeCall || activeCall.category !== 'private') return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        // Note: Switching between earpiece and speaker is not fully supported in standard Web Audio API
        // without native device access or specific browser flags. 
        // We toggle the UI state to indicate preference.
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = isCameraOff;
            });
            const newStatus = !isCameraOff;
            setIsCameraOff(newStatus);

            // Broadcast camera status to peer
            if (activeCall?.peerId) {
                // Ensure we send to the channel the peer is listening to?
                // Peer listens to calls:{peerId} or calls:{myId}?
                // Peer listens to calls:{peerId}. Wait.
                // In my useEffect (line 145), I listen to calls:{myId}.
                // So I should send to calls:{myId}? NO.
                // The peer listens to calls:{peerId}.
                // Wait, if I am User A, peer is User B.
                // User B listens to calls:{UserB}.
                // I (User A) must send to calls:{UserB}.
                // Yes, sending to `calls:${activeCall.peerId}` is correct.
                supabase.channel(`calls:${activeCall.peerId}`).send({
                    type: 'broadcast',
                    event: 'call:camera-toggle',
                    payload: { isCameraOff: newStatus, senderId: user?.id },
                });
            }
        }
    };

    // Ensure streams are attached when UI elements mount/unmount
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log("[CallManager] Attaching remote video stream");
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.warn("Video play blocked:", e));
        }
        if (remoteAudioRef.current && remoteStream) {
            console.log("[CallManager] Attaching remote audio stream");
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch(e => console.warn("Audio play blocked:", e));
        }
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [remoteStream, localStream, activeCall?.type, activeCall?.status, isRemoteVideoOff, isMinimized]);

    // Final Render Wrapper
    return (
        <>
            {/* Hidden Ringtone Element - Always mounted when a call exists */}
            <audio
                ref={ringtoneRef}
                loop
                src="/notification_ringtone.mp3.mpeg"
                className="hidden"
                preload="auto"
                playsInline
            />

            {/* UI Fragments based on status */}
            {activeCall.status === 'incoming' && (
                <div className="fixed top-4 left-4 right-4 z-[100000] animate-in slide-in-from-top-full duration-500 ease-out">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4 max-w-lg mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                    <AvatarImage src={activeCall.peerAvatar} />
                                    <AvatarFallback>{activeCall.peerName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-900 animate-pulse">
                                    {activeCall.type === 'video' ? <Video className="h-2 w-2 text-white" /> : <Phone className="h-2 w-2 text-white" />}
                                </div>
                            </div>
                            <div className="text-left">
                                <h3 className="text-white font-bold text-sm leading-tight">{activeCall.peerName}</h3>
                                <p className="text-slate-400 text-xs">Incoming {activeCall.type} call...</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-10 w-10 rounded-full shadow-lg shadow-red-500/20"
                                onClick={rejectCall}
                            >
                                <PhoneOff className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="default"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                onClick={acceptCall}
                            >
                                <Phone className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeCall.status === 'calling' && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-8 text-center">
                        <Avatar className="h-32 w-32 border-4 border-primary/50">
                            <AvatarImage src={activeCall.peerAvatar} />
                            <AvatarFallback className="text-4xl">{activeCall.peerName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white">{activeCall.peerName}</h2>
                            <p className="text-slate-400 animate-pulse">Calling...</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-16 w-16 rounded-full mt-8"
                            onClick={endCall}
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            )}

            {activeCall.status === 'active' && (() => {
                // AUDIO CALL UI (Also used when Remote Video is Off in Video Call)
                const showAudioLayout = activeCall.type === 'audio' || isRemoteVideoOff;

                if (showAudioLayout) {
                    return (
                        <>
                            {/* Audio Element (Always Active) */}
                            <audio ref={remoteAudioRef} autoPlay playsInline />

                            {/* Minimized View */}
                            {isMinimized && (
                                <div className="fixed bottom-4 right-4 z-[100000] w-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 z-10" />
                                            <Avatar className="h-10 w-10 border border-white/20">
                                                <AvatarImage src={activeCall.peerAvatar} />
                                                <AvatarFallback>{activeCall.peerName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm max-w-[120px] truncate">{activeCall.peerName}</span>
                                            <span className="text-emerald-400 text-xs font-mono">{formatTime(timer)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 rounded-full text-white hover:bg-white/10"
                                            onClick={() => setMinimized(false)}
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn("h-8 w-8 rounded-full", isMuted ? "text-red-500 bg-red-500/10" : "text-white hover:bg-white/10")}
                                            onClick={toggleMute}
                                        >
                                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 rounded-full"
                                            onClick={endCall}
                                        >
                                            <PhoneOff className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Full Screen Audio UI (Reference Design) */}
                            <div className={cn(
                                "fixed inset-0 z-[99999] flex flex-col bg-gradient-to-b from-slate-900 to-[#0a0a0a] transition-all duration-300",
                                isMinimized ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
                            )}>
                                {/* Header */}
                                <div className="flex justify-between items-center p-6 pt-8">
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10" onClick={() => setMinimized(true)}>
                                        <ChevronDown className="h-6 w-6" />
                                    </Button>
                                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        <Lock className="h-3 w-3" />
                                        <span className="text-[10px] font-bold tracking-wider uppercase">End-to-End Encrypted</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10">
                                        <UserPlus className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                                    <div className="relative mb-6 group">
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#dac395] to-[#bfa068] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000" />
                                        <div className="absolute inset-0 rounded-full border-[1px] border-[#dac395]/30 animate-[spin_10s_linear_infinite]" />
                                        <Avatar className="h-40 w-40 md:h-56 md:w-56 border-4 border-[#dac395]/60 shadow-2xl z-10">
                                            <AvatarImage src={activeCall.peerAvatar} className="object-cover" />
                                            <AvatarFallback className="text-4xl bg-orange-100 text-orange-800">{activeCall.peerName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight text-center px-4">{activeCall.peerName}</h2>

                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-[#dac395] animate-pulse" />
                                        <span className="text-[#dac395] font-mono text-xl font-medium tracking-widest">{formatTime(timer)}</span>
                                    </div>

                                    <p className="text-slate-500 text-sm font-medium tracking-wide border border-slate-800 bg-slate-900/50 px-3 py-1 rounded-md">
                                        {activeCall.type === 'video' ? 'Video Call Ongoing' : 'High Definition Audio'}
                                    </p>
                                </div>

                                {/* Controls Section */}
                                <div className="p-8 md:p-12 pb-16 flex flex-col items-center gap-8 w-full max-w-lg mx-auto">

                                    {/* Control Icons Panel */}
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 w-full max-w-sm flex items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                        {/* Mute Toggle */}
                                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={toggleMute}>
                                            <div className={cn(
                                                "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
                                                isMuted ? "bg-white text-slate-900 shadow-lg scale-105" : "bg-white/10 text-white group-hover:bg-white/20"
                                            )}>
                                                {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                                            </div>
                                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Mute</span>
                                        </div>

                                        {/* Speaker Toggle */}
                                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={toggleSpeaker}>
                                            <div className={cn(
                                                "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_-3px_rgba(218,195,149,0.5)] active:scale-95",
                                                isSpeakerOn ? "bg-[#dac395] text-slate-900" : "bg-white/10 text-white hover:bg-white/20"
                                            )}>
                                                <Volume2 className={cn("h-7 w-7 fill-current", isSpeakerOn ? "" : "fill-none")} />
                                            </div>
                                            <span className={cn(
                                                "text-xs uppercase font-bold tracking-wider transition-colors",
                                                isSpeakerOn ? "text-[#dac395]" : "text-slate-400"
                                            )}>Speaker</span>
                                        </div>

                                        {/* Video Toggle (Only if video call) */}
                                        {activeCall.type === 'video' && (
                                            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={toggleCamera}>
                                                <div className={cn(
                                                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300",
                                                    isCameraOff ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white group-hover:bg-white/20"
                                                )}>
                                                    {isCameraOff ? <VideoOff className="h-7 w-7" /> : <Video className="h-7 w-7" />}
                                                </div>
                                                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Video</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* End Call Button */}
                                    <Button
                                        className="w-full h-16 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xl shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border-none"
                                        onClick={endCall}
                                    >
                                        <div className="bg-white/20 p-2 rounded-full">
                                            <PhoneOff className="h-6 w-6 fill-current" />
                                        </div>
                                        End Call
                                    </Button>
                                </div>
                            </div>
                        </>
                    );
                }

                // VIDEO CALL UI (Existing)
                return (
                    <>
                        {/* Backdrop */}
                        {!isMinimized && <div className="fixed inset-0 bg-black z-[99998]" />}

                        <div className={cn(
                            "fixed transition-all duration-500 ease-in-out shadow-2xl bg-slate-900 overflow-hidden",
                            isMinimized
                                ? "bottom-4 right-4 w-[180px] h-[110px] md:w-[340px] md:h-[210px] rounded-2xl z-[100000] border border-white/10"
                                : "inset-0 z-[99999]"
                        )}>
                            {/* Remote Video (Full Screen) */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={cn("w-full h-full object-cover transition-opacity duration-500", !remoteStream && "opacity-0")}
                            />

                            {/* Placeholder if no remote video yet */}
                            {!remoteStream && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 -z-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
                                        <p className="text-white/50 font-medium text-sm animate-pulse">Connecting...</p>
                                    </div>
                                </div>
                            )}

                            {/* Local Video Overlay */}
                            <div className={cn(
                                "absolute rounded-lg border border-white/20 bg-slate-800 shadow-xl overflow-hidden",
                                isMinimized ? "hidden" : "top-6 right-6 w-32 h-44 md:w-48 md:h-64"
                            )}>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover mirror"
                                />
                                {isCameraOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={profile?.avatar_url} />
                                            <AvatarFallback>ME</AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}
                            </div>

                            {/* Controls Bar */}
                            <div className={cn(
                                "absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-4 px-6 py-4 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 transition-opacity duration-300",
                                isMinimized ? "opacity-0 invisible" : "opacity-100 visible"
                            )}>
                                <div className="text-white font-mono mr-4 border-r border-white/10 pr-4">
                                    {formatTime(timer)}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-full", isMuted ? "bg-red-500/20 text-red-500" : "text-white hover:bg-white/10")}
                                    onClick={toggleMute}
                                >
                                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-12 w-12 rounded-full", isCameraOff ? "bg-red-500/20 text-red-500" : "text-white hover:bg-white/10")}
                                    onClick={toggleCamera}
                                >
                                    {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-12 w-12 rounded-full"
                                    onClick={endCall}
                                >
                                    <PhoneOff className="h-6 w-6" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full text-white hover:bg-white/10"
                                    onClick={() => setMinimized(true)}
                                >
                                    <Minimize2 className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* Minimized Controls Overlay */}
                            {isMinimized && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer group" onClick={() => setMinimized(false)}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-wider opacity-70">Active Call</span>
                                        <span className="text-white text-xs font-medium">{formatTime(timer)}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                );
            })()}
        </>
    );
}
