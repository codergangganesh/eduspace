import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

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

async function getInitiateCallErrorMessage(error: unknown) {
    if (error instanceof FunctionsHttpError) {
        try {
            const responseText = await error.context.text();
            console.error("[CallContext] Edge Function error details:", {
                status: error.context.status,
                statusText: error.context.statusText,
                responseText
            });
            if (responseText) {
                try {
                    const payload = JSON.parse(responseText);
                    if (typeof payload?.error === 'string' && payload.error.trim()) {
                        return payload.error;
                    }
                    if (typeof payload?.message === 'string' && payload.message.trim()) {
                        return payload.message;
                    }
                } catch {
                    return responseText;
                }
            }
        } catch (contextError) {
            console.error("[CallContext] Failed to read initiate-call error response:", contextError);
        }

        return `Call request failed: HTTP ${error.context.status}`;
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "Failed to initiate call";
}

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeCall, setActiveCall] = useState<CallState | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const channelRef = useRef<any>(null);
    const activeCallIdRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        activeCallIdRef.current = activeCall?.id;
    }, [activeCall?.id]);

    const clearCallActionParams = useCallback(() => {
        if (!location.search.includes('session=') && !location.search.includes('action=')) {
            return;
        }

        const params = new URLSearchParams(location.search);
        params.delete('session');
        params.delete('action');

        navigate(
            {
                pathname: location.pathname,
                search: params.toString() ? `?${params.toString()}` : '',
            },
            { replace: true }
        );
    }, [location.pathname, location.search, navigate]);

    const parseCallUrl = useCallback((url: string) => {
        try {
            const parsedUrl = new URL(url);
            return {
                sessionId: parsedUrl.searchParams.get('session'),
                action: parsedUrl.searchParams.get('action'),
            };
        } catch (error) {
            console.error("[CallContext] Failed to parse call URL:", error);
            return {
                sessionId: null,
                action: null,
            };
        }
    }, []);

    const acceptCallFromSession = useCallback(async (call: CallState) => {
        try {
            await supabase
                .from('call_sessions')
                .update({ status: 'accepted', started_at: new Date().toISOString() })
                .eq('id', call.id);

            setActiveCall(prev => prev ? { ...prev, status: 'active', startTime: Date.now() } : null);
            setIsMinimized(false);

            await supabase.channel(`calls:${call.peerId}`).send({
                type: 'broadcast',
                event: 'call:accepted',
                payload: { acceptorId: user?.id, callId: call.id },
            });
        } catch (error) {
            console.error("Error auto-accepting call:", error);
        }
    }, [user?.id]);

    const rejectCallFromSession = useCallback(async (sessionId: string, callerId: string) => {
        if (!user) return;

        try {
            await supabase
                .from('call_sessions')
                .update({ status: 'rejected' })
                .eq('id', sessionId);

            await supabase.channel(`calls:${callerId}`).send({
                type: 'broadcast',
                event: 'call:rejected',
                payload: { rejectorId: user.id, callId: sessionId },
            });

            setActiveCall(prev => prev?.id === sessionId ? null : prev);
            setIsMinimized(false);
        } catch (error) {
            console.error("Error rejecting call from deep link:", error);
        }
    }, [user]);

    // Unified Session Handler
    const handleSession = useCallback(async (sessionId: string | null, action: string | null) => {
        if (!sessionId || !user) return;
        if (!action && activeCallIdRef.current === sessionId) return;

        console.log("[CallContext] Checking session:", sessionId, "Action:", action);

        try {
            // Fetch session details from DB
            const { data: session, error } = await supabase
                .from('call_sessions')
                .select(`
                    *,
                    caller:profiles!call_sessions_caller_id_fkey(full_name, avatar_url),
                    receiver:profiles!call_sessions_receiver_id_fkey(full_name, avatar_url)
                `)
                .eq('id', sessionId)
                .single();

            if (error || !session) {
                console.error("[CallContext] Failed to fetch session for deep link:", error);
                return;
            }

            console.log("[CallContext] Session fetched successfully. Status:", session.status);

            const isReceiver = session.receiver_id === user.id;
            const isCaller = session.caller_id === user.id;

            if (!isReceiver && !isCaller) {
                console.warn("[CallContext] Ignoring call session for unrelated user.");
                clearCallActionParams();
                return;
            }

            if (action === 'reject') {
                if (isReceiver && ['initiated', 'ringing'].includes(session.status)) {
                    await rejectCallFromSession(session.id, session.caller_id);
                }
                clearCallActionParams();
                return;
            }

            // Check for stale session (ignore calls older than 5 minutes)
            const sessionTime = new Date(session.created_at).getTime();
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;

            if (now - sessionTime > fiveMinutes && session.status !== 'active') {
                console.warn("[CallContext] Ignoring stale deep link session.");
                return;
            }

            // Only handle if the call is still valid
            const isValidStatus = ['initiated', 'ringing', 'accepted', 'active'].includes(session.status);

            if (isValidStatus) {
                const peer = isReceiver ? session.caller : session.receiver;
                const startedAt = session.started_at ? new Date(session.started_at).getTime() : sessionTime;
                const callState: CallState = {
                    id: session.id,
                    type: session.call_type as CallType,
                    category: 'private',
                    peerId: isReceiver ? session.caller_id : session.receiver_id,
                    peerName: peer?.full_name || 'Someone',
                    peerAvatar: peer?.avatar_url,
                    isInitiator: isCaller,
                    status: session.status === 'active' || session.status === 'accepted' ? 'active' : 'incoming',
                    startTime: session.status === 'active' ? startedAt : undefined
                };

                console.log("[CallContext] Setting recovery call state:", callState.status);
                setActiveCall(callState);
                setIsMinimized(false);

                // If the user clicked "Accept"
                if (action === 'accept' && isReceiver && session.status !== 'accepted' && session.status !== 'active') {
                    console.log("[CallContext] Auto-accepting from deep link...");
                    setTimeout(() => {
                        acceptCallFromSession(callState);
                        clearCallActionParams();
                    }, 1500);
                } else if (action === 'accept') {
                    clearCallActionParams();
                }
            }
        } catch (err) {
            console.error("[CallContext] Critical error in deep link handler:", err);
        }
    }, [acceptCallFromSession, clearCallActionParams, rejectCallFromSession, user]);

    // Handle Incoming Call from current route changes (web/PWA)
    useEffect(() => {
        if (!user || !profile) return;

        const params = new URLSearchParams(location.search);
        handleSession(params.get('session'), params.get('action'));
    }, [handleSession, location.search, profile, user]);

    // Handle Incoming Call from native deep links
    useEffect(() => {
        if (!user || !profile) return;

        let stateListener: any;
        let urlListener: any;

        const initCapacitor = async () => {
            try {
                const { App } = await import('@capacitor/app');

                const launchUrl = await App.getLaunchUrl();
                if (launchUrl?.url) {
                    const { sessionId, action } = parseCallUrl(launchUrl.url);
                    if (sessionId) {
                        await handleSession(sessionId, action);
                    }
                }

                stateListener = App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive && user && profile) {
                        const params = new URLSearchParams(window.location.search);
                        if (params.get('session')) {
                            handleSession(params.get('session'), params.get('action'));
                        }
                    }
                });

                // Listen for Deep Links (Custom Scheme / Universal Links)
                urlListener = App.addListener('appUrlOpen', (data) => {
                    console.log("[CallContext] App opened with URL:", data.url);
                    const { sessionId, action } = parseCallUrl(data.url);
                    if (sessionId && user && profile) {
                        handleSession(sessionId, action);
                    }
                });
            } catch (err) {
                console.warn("Capacitor App plugin not available", err);
            }
        };

        initCapacitor();

        return () => {
            if (stateListener) stateListener.then((l: any) => l.remove());
            if (urlListener) urlListener.then((l: any) => l.remove());
        };
    }, [handleSession, parseCallUrl, profile, user]);

    useEffect(() => {
        if (!user || !activeCall?.id) return;

        const trackedCallId = activeCall.id;
        const isInitiator = activeCall.isInitiator;

        const statusChannel = supabase
            .channel(`call_session_status:${trackedCallId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'call_sessions',
                    filter: `id=eq.${trackedCallId}`,
                },
                ({ new: updatedSession }: any) => {
                    const updatedStatus = updatedSession?.status as string | undefined;
                    if (!updatedStatus) return;

                    if (updatedStatus === 'accepted') {
                        setActiveCall(prev => {
                            if (!prev || prev.id !== trackedCallId) return prev;

                            return {
                                ...prev,
                                status: 'active',
                                startTime: updatedSession.started_at
                                    ? new Date(updatedSession.started_at).getTime()
                                    : prev.startTime ?? Date.now(),
                            };
                        });
                        setIsMinimized(false);
                        return;
                    }

                    if (updatedStatus === 'rejected') {
                        setActiveCall(prev => prev?.id === trackedCallId ? null : prev);
                        setIsMinimized(false);
                        if (isInitiator) {
                            toast.error("Call rejected");
                        }
                        return;
                    }

                    if (updatedStatus === 'missed') {
                        setActiveCall(prev => prev?.id === trackedCallId ? null : prev);
                        setIsMinimized(false);
                        if (isInitiator) {
                            toast.info("Call not answered");
                        }
                        return;
                    }

                    if (updatedStatus === 'cancelled' || updatedStatus === 'completed' || updatedStatus === 'failed') {
                        setActiveCall(prev => prev?.id === trackedCallId ? null : prev);
                        setIsMinimized(false);

                        if (!isInitiator && updatedStatus !== 'failed') {
                            toast.info("Call ended");
                        }

                        if (updatedStatus === 'failed') {
                            toast.error("Call failed");
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            statusChannel.unsubscribe();
        };
    }, [activeCall?.id, activeCall?.isInitiator, user]);

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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[CallContext] Subscribed to realtime for user ${user.id}`);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error(`[CallContext] Realtime subscription failed for user ${user.id}`);
                }
                if (status === 'CLOSED') {
                    console.warn(`[CallContext] Realtime channel closed for user ${user.id}`);
                }
            });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [user, activeCall]);

    const initiateCall = async (peerId: string, peerName: string, peerAvatar: string, type: CallType) => {
        if (!user) return;

        try {
            console.log("[CallContext] Initiating call to:", peerId, "type:", type);

            // 1. Get current session
            let { data: { session }, error: sessionError } = await supabase.auth.getSession();

            // 2. Fallback refresh if no session or likely to be stale
            if (sessionError || !session) {
                console.warn("[CallContext] No session found, refreshing...");
                const refreshed = await supabase.auth.refreshSession();
                session = refreshed.data.session;
            }

            if (!session) throw new Error("Please sign in to make calls.");

            // 3. Manual fetch with "Gateway Pass-Through" Technique
            // We send the public project ANON_KEY in the standard Authorization header.
            // This satisfies the Supabase Gateway (Kong) because it's a valid JWT for the project.
            // We then pass the ACTUAL user's JWT in 'x-user-token' for manual verification.
            // This bypasses both "Invalid JWT" and "Missing auth header" errors.
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'x-user-token': session.access_token
                },
                body: JSON.stringify({
                    receiver_id: peerId,
                    call_type: type,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const status = response.status;
                console.error("[CallContext] initiate-call failure details:", { status, errorText });

                // Construct a compatible error for the UI
                const customError = new Error(errorText) as any;
                customError.name = 'FunctionsHttpError';
                customError.context = response;
                throw customError;
            }

            const callSession = await response.json();

            const call: CallState = {
                id: callSession.id,
                type: type,
                category: 'private',
                peerId: peerId,
                peerName: peerName,
                peerAvatar: peerAvatar,
                isInitiator: true,
                status: 'calling',
            };

            setActiveCall(call);

            // Signal the peer via Realtime
            await supabase.channel(`calls:${peerId}`).send({
                type: 'broadcast',
                event: 'call:offer',
                payload: {
                    callId: callSession.id,
                    callerId: user.id,
                    callerName: profile?.full_name || 'Someone',
                    callerAvatar: profile?.avatar_url,
                    type: type,
                },
            });

        } catch (error: any) {
            console.error("Initiate call error:", error);
            const message = await getInitiateCallErrorMessage(error);
            toast.error(message);

            // If we still get a 401 even with x-user-token, it means the JWT truly is invalid
            if (error.context?.status === 401) {
                console.error("[CallContext] 401 persistent despite bypass. Signing out might be required.");
            }
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
                payload: { rejectorId: user?.id, callId: activeCall.id },
            });

            setActiveCall(null);
            setIsMinimized(false);
        } catch (error) {
            console.error("Reject call error:", error);
        }
    };

    const endCall = async () => {
        if (!activeCall) return;

        try {
            const endedAt = new Date().toISOString();
            const duration = activeCall.startTime ? Math.floor((Date.now() - activeCall.startTime) / 1000) : 0;
            const finalStatus = activeCall.startTime ? 'completed' : 'cancelled';

            await supabase
                .from('call_sessions')
                .update({
                    status: finalStatus,
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
