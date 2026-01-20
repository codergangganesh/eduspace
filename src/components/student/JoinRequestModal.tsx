import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccessRequestCard } from './AccessRequestCard';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface JoinRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingInvitations: any[];
    onRequestHandled: () => void;
    onRequestMarkedAsHandled?: (requestId: string) => void;
}

export function JoinRequestModal({
    open,
    onOpenChange,
    pendingInvitations,
    onRequestHandled,
    onRequestMarkedAsHandled,
}: JoinRequestModalProps) {
    const [localInvitations, setLocalInvitations] = useState(pendingInvitations);

    useEffect(() => {
        setLocalInvitations(pendingInvitations);
    }, [pendingInvitations]);

    const handleRespond = async (requestId: string) => {
        // Mark request as handled (clears notification)
        if (onRequestMarkedAsHandled) {
            await onRequestMarkedAsHandled(requestId);
        }

        // Refresh the invitations list
        await onRequestHandled();

        // Close modal if no more pending invitations
        if (localInvitations.length <= 1) {
            onOpenChange(false);
        }
    };

    // Don't render if no invitations
    if (!pendingInvitations || pendingInvitations.length === 0) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                // Prevent closing the modal - only allow programmatic close after handling request
                if (!open) return;
                onOpenChange(open);
            }}
        >
            <DialogContent
                className="max-w-4xl max-h-[90vh] [&>button]:hidden"
                onInteractOutside={(e) => {
                    // Prevent closing when clicking outside
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing with Escape key
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="size-6 text-primary" />
                        </div>
                        <span>Class Join Requests</span>
                        <Badge variant="secondary" className="ml-2">
                            {localInvitations.length}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        You have been invited to join {localInvitations.length} class{localInvitations.length > 1 ? 'es' : ''}.
                        Review the details below and accept or reject each invitation.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-4 mt-4">
                        {localInvitations.map((invitation) => (
                            <AccessRequestCard
                                key={invitation.id}
                                request={invitation}
                                onRespond={handleRespond}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
