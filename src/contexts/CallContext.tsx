import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CallType = 'audio' | 'video';
export type CallCategory = 'private' | 'meeting';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'incoming' | 'active' | 'ended';

export interface CallState {
    id?: string;
    type: CallType;
    category: CallCategory;
    conversationId?: string;
    peerId?: string;
    peerName?: string;
    peerAvatar?: string;
    isInitiator: boolean;
    status: CallStatus;
    startTime?: number;
}

interface CallContextType {
    activeCall: CallState | null;
    isMinimized: boolean;
    initiateCall: (peerId: string, peerName: string, peerAvatar: string, type: CallType) => Promise<void>;
    acceptCall: () => void;
    rejectCall: () => void;
    endCall: () => void;
    setMinimized: (minimized: boolean) => void;
    startMeeting: (conversationId: string, meetingName: string, type: CallType) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [activeCall, setActiveCall] = useState<CallState | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const channelRef = useRef<any>(null);

    // Handle Incoming Call from URL (Deep Linking / Push Notifications)
    useEffect(() => {
        const handleDeepLinkCall = async () => {
            // CRITICAL: Wait for user AND profile to be loaded before handling deep link
            // This is essential for mobile where auth state might take a second to hydrate
            if (!user || !profile) {
                console.log("[CallContext] Waiting for auth/profile to hydrate...");
                return;
            }

            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session');
            const action = params.get('action');

            if (sessionId && !activeCall) {
                console.log("[CallContext] Deep link session detected:", sessionId);

                try {
                    // Fetch session details from DB
                    const { data: session, error } = await supabase
                        .from('call_sessions')
                        .select(`
                            *,
                            caller:profiles!call_sessions_caller_id_fkey(full_name, avatar_url)
                        `)
                        .eq('id', sessionId)
                        .single();

                    if (error || !session) {
                        console.error("[CallContext] Failed to fetch session for deep link:", error);
                        return;
                    }

                    console.log("[CallContext] Session fetched successfully. Status:", session.status);

                    // Check for stale session (ignore calls older than 5 minutes)
                    const sessionTime = new Date(session.created_at).getTime();
                    const now = Date.now();
                    const fiveMinutes = 5 * 60 * 1000;

                    if (now - sessionTime > fiveMinutes && session.status !== 'active') {
                        console.warn("[CallContext] Ignoring stale deep link session.");
                        return;
                    }

                    // Only handle if the call is still valid (initiated or ringing)
                    // or if it was recently accepted (to avoid losing UI on refresh)
                    const isValidStatus = ['initiated', 'ringing', 'accepted', 'active'].includes(session.status);

                    if (isValidStatus) {
                        const callState: CallState = {
                            id: session.id,
                            type: session.call_type as CallType,
                            category: 'private',
                            peerId: session.caller_id,
                            peerName: session.caller?.full_name || 'Someone',
                            peerAvatar: session.caller?.avatar_url,
                            isInitiator: false,
                            status: session.status === 'active' || session.status === 'accepted' ? 'active' : 'incoming',
                            startTime: session.status === 'active' ? sessionTime : undefined
                        };

                        console.log("[CallContext] Setting recovery call state:", callState.status);
                        setActiveCall(callState);

                        // If the user clicked "Accept" from the push notification
                        if (action === 'accept' && session.status !== 'accepted' && session.status !== 'active') {
                            console.log("[CallContext] Auto-accepting from deep link...");
                            // Longer delay to ensure channel is ready and UI is mounted
                            setTimeout(() => {
                                acceptCallFromSession(callState);
                                // Clean up URL to prevent auto-accept on refresh
                                window.history.replaceState({}, '', '/messages');
                            }, 1500); // Slightly longer delay for mobile stability
                        } else if (action === 'accept') {
                            // Already accepted, just clear URL
                            window.history.replaceState({}, '', '/messages');
                        }
                    }
                } catch (err) {
                    console.error("[CallContext] Critical error in deep link handler:", err);
                }
            }
        };

        handleDeepLinkCall();
    }, [user, profile]); // Depend on profile too

    // Helper for acceptance from deep link
    const acceptCallFromSession = async (call: CallState) => {
        try {
            await supabase
                .from('call_sessions')
                .update({ status: 'accepted', started_at: new Date().toISOString() })
                .eq('id', call.id);

            setActiveCall(prev => prev ? { ...prev, status: 'active', startTime: Date.now() } : null);

            await supabase.channel(`calls:${call.peerId}`).send({
                type: 'broadcast',
                event: 'call:accepted',
                payload: { acceptorId: user?.id, callId: call.id },
            });
        } catch (error) {
            console.error("Error auto-accepting call:", error);
        }
    };

    // Listen for incoming calls via Realtime Broadcast
    useEffect(() => {
        if (!user) return;

        const channel = supabase.channel(`calls:${user.id}`, {
            config: {
                broadcast: { self: false },
            },
        });

        channel
            .on('broadcast', { event: 'call:offer' }, ({ payload }) => {
                if (activeCall) {
                    // Send "busy" message if already in a call
                    channel.send({
                        type: 'broadcast',
                        event: 'call:busy',
                        payload: { callerId: payload.callerId },
                    });
                    return;
                }

                setActiveCall({
                    id: payload.callId,
                    type: payload.type,
                    category: 'private',
                    peerId: payload.callerId,
                    peerName: payload.callerName,
                    peerAvatar: payload.callerAvatar,
                    isInitiator: false,
                    status: 'incoming',
                });
            })
            .on('broadcast', { event: 'call:cancel' }, () => {
                setActiveCall(null);
            })
            .on('broadcast', { event: 'call:accepted' }, ({ payload }) => {
                if (activeCall && activeCall.id === payload.callId) {
                    setActiveCall(prev => prev ? { ...prev, status: 'active', startTime: Date.now() } : null);
                }
            })
            .on('broadcast', { event: 'call:rejected' }, ({ payload }) => {
                if (activeCall && (!payload.callId || activeCall.id === payload.callId)) {
                    toast.error("Call rejected");
                    setActiveCall(null);
                }
            })
            .on('broadcast', { event: 'call:ended' }, ({ payload }) => {
                if (activeCall && activeCall.id === payload.callId) {
                    toast.info("Call ended");
                    setActiveCall(null);
                }
            })
            .on('broadcast', { event: 'call:busy' }, () => {
                toast.error("User is busy");
                setActiveCall(null);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [user, activeCall]);

    const initiateCall = async (peerId: string, peerName: string, peerAvatar: string, type: CallType) => {
        if (!user) return;

        try {
            // Call Edge Function to validate and create session
            const { data: session, error: functionError } = await supabase.functions.invoke('initiate-call', {
                body: {
                    caller_id: user.id,
                    receiver_id: peerId,
                    call_type: type,
                },
            });

            if (functionError) throw functionError;

            const call: CallState = {
                id: session.id,
                type: type,
                category: 'private',
                peerId: peerId,
                peerName: peerName,
                peerAvatar: peerAvatar,
                isInitiator: true,
                status: 'calling',
            };

            setActiveCall(call);

            // Signal the peer
            await supabase.channel(`calls:${peerId}`).send({
                type: 'broadcast',
                event: 'call:offer',
                payload: {
                    callId: session.id,
                    callerId: user.id,
                    callerName: profile?.full_name || 'Someone',
                    callerAvatar: profile?.avatar_url,
                    type: type,
                },
            });

        } catch (error: any) {
            console.error("Initiate call error:", error);
            toast.error(error.message || "Failed to initiate call");
        }
    };

    const acceptCall = async () => {
        if (!activeCall || !user) return;

        try {
            // Update session status in DB
            await supabase
                .from('call_sessions')
                .update({ status: 'accepted', started_at: new Date().toISOString() })
                .eq('id', activeCall.id);

            setActiveCall(prev => prev ? { ...prev, status: 'active', startTime: Date.now() } : null);

            // Signal the initiator
            await supabase.channel(`calls:${activeCall.peerId}`).send({
                type: 'broadcast',
                event: 'call:accepted',
                payload: { acceptorId: user.id, callId: activeCall.id },
            });
        } catch (error) {
            console.error("Accept call error:", error);
        }
    };

    const rejectCall = async () => {
        if (!activeCall) return;

        try {
            await supabase
                .from('call_sessions')
                .update({ status: 'rejected' })
                .eq('id', activeCall.id);

            // Signal the peer
            await supabase.channel(`calls:${activeCall.peerId}`).send({
                type: 'broadcast',
                event: 'call:rejected',
                payload: { rejectorId: user?.id },
            });

            setActiveCall(null);
        } catch (error) {
            console.error("Reject call error:", error);
        }
    };

    const endCall = async () => {
        if (!activeCall) return;

        try {
            const endedAt = new Date().toISOString();
            const duration = activeCall.startTime ? Math.floor((Date.now() - activeCall.startTime) / 1000) : 0;

            await supabase
                .from('call_sessions')
                .update({
                    status: 'completed',
                    ended_at: endedAt,
                    duration: duration
                })
                .eq('id', activeCall.id);

            // Signal the peer
            if (activeCall.peerId) {
                await supabase.channel(`calls:${activeCall.peerId}`).send({
                    type: 'broadcast',
                    event: 'call:ended',
                    payload: { callId: activeCall.id },
                });
            }

            setActiveCall(null);
            setIsMinimized(false);
        } catch (error) {
            console.error("End call error:", error);
            setActiveCall(null);
        }
    };

    const startMeeting = (conversationId: string, meetingName: string, type: CallType) => {
        setActiveCall({
            type: type,
            category: 'meeting',
            conversationId: conversationId,
            peerName: meetingName,
            isInitiator: true,
            status: 'active',
            startTime: Date.now(),
        });
    };

    return (
        <CallContext.Provider value={{
            activeCall,
            isMinimized,
            initiateCall,
            acceptCall,
            rejectCall,
            endCall,
            setMinimized: setIsMinimized,
            startMeeting
        }}>
            {children}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
}
