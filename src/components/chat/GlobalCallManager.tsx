import { useCall } from "@/contexts/CallContext";
import { useAuth } from "@/contexts/AuthContext";
import { CallModal } from "./CallModal";
import { PrivateCallManager } from "./PrivateCallManager";

/**
 * GlobalCallManager handles the rendering of call interfaces at the top level.
 */
export function GlobalCallManager() {
    const { activeCall, endCall, isMinimized, setMinimized } = useCall();
    const { user, profile } = useAuth();

    if (!activeCall) return null;

    if (activeCall.category === 'private') {
        return <PrivateCallManager />;
    }

    return (
        <CallModal
            isOpen={true}
            onClose={endCall}
            type={activeCall.type}
            conversationId={activeCall.conversationId || 'meeting'}
            userName={activeCall.peerName || profile?.full_name || user?.email || 'User'}
            isMeeting={activeCall.category === 'meeting'}
            isMinimized={isMinimized}
            onMinimize={setMinimized}
        />
    );
}
