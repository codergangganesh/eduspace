import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccessRequestCard } from './AccessRequestCard';
import { useStudentOnboarding } from '@/hooks/useStudentOnboarding';
import { useRealtimeInvitations } from '@/hooks/useRealtimeInvitations';
import { Loader2, Inbox } from 'lucide-react';

export function PendingInvitationsPanel() {
    const { pendingInvitations, loading, hasPending, refreshInvitations } = useStudentOnboarding();
    const [localInvitations, setLocalInvitations] = useState(pendingInvitations);

    // Listen for real-time invitation updates
    useRealtimeInvitations(() => {
        refreshInvitations();
    });

    useEffect(() => {
        setLocalInvitations(pendingInvitations);
    }, [pendingInvitations]);

    const handleRespond = async (requestId: string) => {
        // Refresh invitations after responding
        await refreshInvitations();
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!hasPending || localInvitations.length === 0) {
        return null;
    }

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Inbox className="size-5" />
                    Pending Class Invitations
                </CardTitle>
                <CardDescription>
                    You have {localInvitations.length} pending class invitation{localInvitations.length > 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {localInvitations.map((invitation) => (
                    <AccessRequestCard
                        key={invitation.id}
                        request={invitation}
                        onRespond={handleRespond}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
