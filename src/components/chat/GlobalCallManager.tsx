import { useCall } from "@/contexts/CallContext";
import { useAuth } from "@/contexts/AuthContext";
import { CallModal } from "./CallModal";

/**
 * GlobalCallManager handles the rendering of the CallModal at the top level
 * of the application. This ensures that the Jitsi session remains active
 * and the DOM remains stable even as the user navigates between different
 * routes within the dashboard.
 */
export function GlobalCallManager() {
    const { activeCall, endCall, isMinimized, setMinimized } = useCall();
    const { user, profile } = useAuth();

    if (!activeCall) return null;

    return (
        <CallModal
            isOpen={true}
            onClose={endCall}
            type={activeCall.type}
            conversationId={activeCall.conversationId}
            userName={activeCall.userName || profile?.full_name || user?.email || 'User'}
            isMeeting={activeCall.isMeeting}
            isMinimized={isMinimized}
            onMinimize={setMinimized}
        />
    );
}
