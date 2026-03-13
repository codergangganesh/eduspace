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
    const signalingChannel = useRef<any>(null);
    const isMediaJoining = useRef(false);
    const pendingOffer = useRef<any>(null);
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
    const remoteDescriptionSet = useRef(false);
    const isSignalingReady = useRef(false);
    const pendingAnswer = useRef<any>(null);
    const watchdogTimer = useRef<any>(null);
    const outgoingChannel = useRef<any>(null);
    
    // Master Background References (Always Active)
    const masterAudioRef = useRef<HTMLAudioElement>(null);
    const masterRemoteVideoRef = useRef<HTMLVideoElement>(null);
    const masterLocalVideoRef = useRef<HTMLVideoElement>(null);

    // UI-Specific References (May Unmount)
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const ringtoneRef = useRef<HTMLAudioElement>(null);
    const timerInterval = useRef<any>(null);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
    };

    // Ensure streams are attached when UI elements mount/unmount
    useEffect(() => {
        // Master background sync
        if (remoteStream) {
            if (masterAudioRef.current && masterAudioRef.current.srcObject !== remoteStream) {
                masterAudioRef.current.srcObject = remoteStream;
                masterAudioRef.current.play().catch(() => {});
            }
            if (masterRemoteVideoRef.current && masterRemoteVideoRef.current.srcObject !== remoteStream) {
                masterRemoteVideoRef.current.srcObject = remoteStream;
                masterRemoteVideoRef.current.play().catch(() => {});
            }
            // UI video sync
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch(() => {});
            }
        }
        
        if (localStream) {
            if (masterLocalVideoRef.current && masterLocalVideoRef.current.srcObject !== localStream) {
                masterLocalVideoRef.current.srcObject = localStream;
            }
            if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
                localVideoRef.current.srcObject = localStream;
            }
        }
    }, [remoteStream, localStream, activeCall?.status, isMinimized, isRemoteVideoOff]);

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
            // Explicitly resume remote audio on any interaction during active call
            if (activeCall?.status === 'active') {
                if (masterAudioRef.current) masterAudioRef.current.play().catch(() => {});
                if (masterRemoteVideoRef.current) masterRemoteVideoRef.current.play().catch(() => {});
                if (remoteVideoRef.current) remoteVideoRef.current.play().catch(() => {});
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [activeCall?.status]);

    // WebRTC Connection Life-Cycle
    useEffect(() => {
        if (!activeCall || activeCall.category !== 'private' || !user) return;

        const initConnection = () => {
            if (peerConnection.current) return;
            
            console.log("[CallManager] Initializing PeerConnection for call:", activeCall.id);
            const pc = new RTCPeerConnection(iceServers);
            peerConnection.current = pc;

            pc.onconnectionstatechange = () => {
                console.log(`[CallManager] PC State: ${pc.connectionState} | Signaling: ${pc.signalingState}`);
                if (pc.connectionState === 'connected') {
                    toast.success("Connection secured");
                    if (watchdogTimer.current) clearInterval(watchdogTimer.current);
                }
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    console.warn("[CallManager] Connection lost, cleaning up...");
                    endCall();
                }
            };

            pc.onicegatheringstatechange = () => {
                console.log("[CallManager] ICE Gathering State:", pc.iceGatheringState);
            };

            pc.oniceconnectionstatechange = () => {
                console.log("[CallManager] ICE Connection State:", pc.iceConnectionState);
                if (pc.iceConnectionState === 'failed') {
                    console.log("[CallManager] ICE failed. Restarting ICE...");
                    pc.restartIce();
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && activeCall.peerId) {
                    console.log("[CallManager] Local ICE candidate found");
                    const channel = outgoingChannel.current;
                    if (channel) {
                        channel.send({
                            type: 'broadcast',
                            event: 'call:ice-candidate',
                            payload: { candidate: event.candidate, senderId: user.id },
                        });
                    }
                }
            };

            pc.ontrack = (event) => {
                console.log(`[CallManager] Remote ${event.track.kind} track received`);
                
                setRemoteStream(prev => {
                    const stream = prev || new MediaStream();
                    if (!stream.getTracks().find(t => t.id === event.track.id)) {
                        stream.addTrack(event.track);
                    }
                    return new MediaStream(stream.getTracks());
                });

                // Attach to master refs immediately for stable audio/video playback
                const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
                
                if (event.track.kind === 'audio' && masterAudioRef.current) {
                    masterAudioRef.current.srcObject = stream;
                    masterAudioRef.current.play().catch(() => {});
                }
                
                if (event.track.kind === 'video' && masterRemoteVideoRef.current) {
                    masterRemoteVideoRef.current.srcObject = stream;
                    masterRemoteVideoRef.current.play().catch(() => {});
                }
            };

            pc.onnegotiationneeded = async () => {
                try {
                    // Critical: Wait for both signaling readiness AND initiator status
                    if (activeCall.isInitiator && pc.signalingState === 'stable' && isSignalingReady.current) {
                        console.log("[CallManager] Negotiation needed: Creating Offer...");
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        
                        const channel = outgoingChannel.current;
                        if (channel) {
                            channel.send({
                                type: 'broadcast',
                                event: 'call:sdp-offer',
                                payload: { sdp: offer, senderId: user.id },
                            });
                        }
                    }
                } catch (err) {
                    console.error("[CallManager] Negotiation error:", err);
                }
            };
        };

        initConnection();

        // Signaling listeners
        if (!signalingChannel.current) {
            signalingChannel.current = supabase.channel(`calls:${user.id}`);
        }
        
        const channel = signalingChannel.current;
        channel
            .on('broadcast', { event: 'call:sdp-offer' }, async ({ payload }) => {
                const pc = peerConnection.current;
                if (!pc) return;

                console.log("[CallManager] Received sdp-offer from", payload.senderId);
                // If we don't have local media yet, queue the offer
                if (activeCall.status !== 'active') {
                    console.log("[CallManager] Queuing offer (waiting for active status)");
                    pendingOffer.current = payload;
                    return;
                }

                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    remoteDescriptionSet.current = true;
                    
                    // Process queued candidates
                    while (iceCandidateQueue.current.length > 0) {
                        const candidate = iceCandidateQueue.current.shift();
                        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    const outgoing = outgoingChannel.current;
                    if (isSignalingReady.current && outgoing) {
                        console.log("[CallManager] Sending Answer immediately");
                        outgoing.send({
                            type: 'broadcast',
                            event: 'call:sdp-answer',
                            payload: { sdp: answer, senderId: user.id },
                        });
                    } else {
                        console.log("[CallManager] Queuing Answer (waiting for signaling/channel ready)");
                        pendingAnswer.current = { sdp: answer };
                    }
                } catch (err) {
                    console.error("[CallManager] Error processing offer:", err);
                }
            })
            .on('broadcast', { event: 'call:sdp-answer' }, async ({ payload }) => {
                const pc = peerConnection.current;
                if (pc && pc.signalingState !== 'stable') {
                    console.log("[CallManager] Received sdp-answer from", payload.senderId);
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                        remoteDescriptionSet.current = true;
                        
                        // Process queued candidates
                        while (iceCandidateQueue.current.length > 0) {
                            const candidate = iceCandidateQueue.current.shift();
                            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }
                    } catch (err) {
                        console.error("[CallManager] Error processing sdp-answer:", err);
                    }
                }
            })
            .on('broadcast', { event: 'call:ice-candidate' }, async ({ payload }) => {
                const pc = peerConnection.current;
                if (!pc) return;

                try {
                    if (remoteDescriptionSet.current) {
                        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                    } else {
                        console.log("[CallManager] Queuing ICE candidate (waiting for remote description)");
                        iceCandidateQueue.current.push(payload.candidate);
                    }
                } catch (e) {
                    console.error("[CallManager] Ice error:", e);
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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("[CallManager] Incoming signaling ready");
                    isSignalingReady.current = true;
                    
                    // Setup persistent outgoing channel to peer
                    if (activeCall.peerId && !outgoingChannel.current) {
                        console.log("[CallManager] Subscribing to outgoing channel:", activeCall.peerId);
                        outgoingChannel.current = supabase.channel(`calls:${activeCall.peerId}`).subscribe((outStatus) => {
                            if (outStatus === 'SUBSCRIBED') {
                                console.log("[CallManager] Outgoing signaling ready");
                                // 1. If we have a queued answer, send it now
                                if (pendingAnswer.current && user) {
                                    console.log("[CallManager] Sending queued Answer now that outgoing is ready");
                                    outgoingChannel.current.send({
                                        type: 'broadcast',
                                        event: 'call:sdp-answer',
                                        payload: { ...pendingAnswer.current, senderId: user.id },
                                    });
                                    pendingAnswer.current = null;
                                }

                                // 2. If we are initiator and connection is waiting, trigger offer
                                if (activeCall.isInitiator && peerConnection.current?.signalingState === 'stable') {
                                    console.log("[CallManager] Triggering deferred negotiation...");
                                    peerConnection.current.onnegotiationneeded?.(new Event('negotiationneeded'));
                                }
                            }
                        });
                    }
                }
            });

        return () => {
            // No cleanup here - handle cleanup in a dedicated effect
        };
    }, [activeCall?.id, user?.id]);

    // Media Acquisition Logic (Starts when active)
    useEffect(() => {
        if (activeCall?.status === 'active' && !localStream && user) {
            const startMedia = async () => {
                if (isMediaJoining.current) return;
                isMediaJoining.current = true;
                
                try {
                    console.log("[CallManager] Acquiring media...");
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: activeCall.type === 'video',
                        audio: { echoCancellation: true, noiseSuppression: true }
                    });
                    
                    setLocalStream(stream);
                    const pc = peerConnection.current;
                    if (pc) {
                        stream.getTracks().forEach(track => pc.addTrack(track, stream));
                        
                        // If we had a pending offer, handle it now
                        if (!activeCall.isInitiator && pendingOffer.current) {
                            console.log("[CallManager] Handling pending offer after media acquisition");
                            const payload = pendingOffer.current;
                            pendingOffer.current = null;
                            
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                            remoteDescriptionSet.current = true;
                            
                            // Process queued ICE candidates
                            while (iceCandidateQueue.current.length > 0) {
                                const candidate = iceCandidateQueue.current.shift();
                                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            }

                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            supabase.channel(`calls:${activeCall.peerId}`).send({
                                type: 'broadcast',
                                event: 'call:sdp-answer',
                                payload: { sdp: answer, senderId: user.id },
                            });
                        }
                    }
                } catch (err) {
                    console.error("[CallManager] Media error:", err);
                    toast.error("Could not access camera/mic");
                    endCall();
                } finally {
                    isMediaJoining.current = false;
                }
            };
            startMedia();
        }
    }, [activeCall?.status, activeCall?.id, user]);

    // Handshake Watchdog Effect
    useEffect(() => {
        if (activeCall?.status === 'active' && !remoteStream) {
            console.log("[CallManager] Starting connection watchdog...");
            // If after 8 seconds we still don't have video, force a re-negotiation
            watchdogTimer.current = setInterval(() => {
                const pc = peerConnection.current;
                if (pc && pc.connectionState !== 'connected' && activeCall.isInitiator) {
                    console.warn("[CallManager] Handshake timeout. Force-triggering re-negotiation...");
                    pc.onnegotiationneeded?.(new Event('negotiationneeded'));
                }
            }, 8000);
        } else {
            if (watchdogTimer.current) clearInterval(watchdogTimer.current);
        }

        return () => {
            if (watchdogTimer.current) clearInterval(watchdogTimer.current);
        };
    }, [activeCall?.status, remoteStream, activeCall?.isInitiator]);

    // Final Cleanup Effect
    useEffect(() => {
        return () => {
            if (!activeCall) {
                console.log("[CallManager] Final cleanup");
                if (watchdogTimer.current) clearInterval(watchdogTimer.current);
                if (signalingChannel.current) {
                    signalingChannel.current.unsubscribe();
                    signalingChannel.current = null;
                }
                if (outgoingChannel.current) {
                    outgoingChannel.current.unsubscribe();
                    outgoingChannel.current = null;
                }
                if (peerConnection.current) {
                    peerConnection.current.close();
                    peerConnection.current = null;
                }
                localStream?.getTracks().forEach(t => t.stop());
                setLocalStream(null);
                setRemoteStream(null);
                pendingOffer.current = null;
                pendingAnswer.current = null;
                iceCandidateQueue.current = [];
                remoteDescriptionSet.current = false;
                isSignalingReady.current = false;
            }
        };
    }, [activeCall?.id]);

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
            if (activeCall?.peerId && outgoingChannel.current) {
                outgoingChannel.current.send({
                    type: 'broadcast',
                    event: 'call:camera-toggle',
                    payload: { isCameraOff: newStatus, senderId: user?.id },
                });
            }
        }
    };

    // Final Render Wrapper
    return (
        <>
            {/* Hidden Media Elements - Visually hidden but active to ensure continuous playback regardless of UI changes */}
            <div className="fixed opacity-0 pointer-events-none w-px h-px overflow-hidden">
                <audio 
                    ref={masterAudioRef} 
                    autoPlay 
                    playsInline 
                />
                <video 
                    ref={masterLocalVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                />
                <video 
                    ref={masterRemoteVideoRef} 
                    autoPlay 
                    playsInline 
                />
            </div>

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