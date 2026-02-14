import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface CallState {
    type: 'audio' | 'video';
    conversationId: string;
    isMeeting?: boolean;
    userName?: string;
    startTime?: number;
}

interface CallContextType {
    activeCall: CallState | null;
    isMinimized: boolean;
    startCall: (call: CallState) => Promise<void>;
    endCall: () => Promise<void>;
    setMinimized: (minimized: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { user, profile, updateProfile } = useAuth();
    const [isMinimized, setIsMinimized] = useState(false);
    const [activeCall, setActiveCall] = useState<CallState | null>(() => {
        const saved = localStorage.getItem('eduspace_active_call');
        return saved ? JSON.parse(saved) : null;
    });

    // Sync state with profile whenever it changes (Supabase is source of truth)
    useEffect(() => {
        if (profile) {
            if (profile.active_call) {
                const call = profile.active_call as CallState;
                setActiveCall(call);
                localStorage.setItem('eduspace_active_call', JSON.stringify(call));
            } else {
                setActiveCall(null);
                localStorage.removeItem('eduspace_active_call');
                setIsMinimized(false);
            }
        }
    }, [profile]);

    const startCall = async (call: CallState) => {
        setActiveCall(call);
        setIsMinimized(false);
        localStorage.setItem('eduspace_active_call', JSON.stringify(call));
        if (user) {
            await updateProfile({ active_call: call });
        }
    };

    const endCall = async () => {
        setActiveCall(null);
        setIsMinimized(false);
        localStorage.removeItem('eduspace_active_call');
        if (user) {
            await updateProfile({ active_call: null });
        }
    };

    return (
        <CallContext.Provider value={{ activeCall, isMinimized, startCall, endCall, setMinimized: setIsMinimized }}>
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
