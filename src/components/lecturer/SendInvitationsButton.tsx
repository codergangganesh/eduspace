import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Send, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccessRequests } from '@/hooks/useAccessRequests';
import { toast } from 'sonner';

interface SendInvitationsButtonProps {
    classId: string;
    studentCount: number;
    onInvitationsSent?: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SendInvitationsButton({
    classId,
    studentCount,
    onInvitationsSent,
    variant = 'default',
    size = 'default'
}: SendInvitationsButtonProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{
        sent: number;
        skipped: number;
        failed: number;
    } | null>(null);

    const { sendAccessRequestToAll } = useAccessRequests();

    const handleSendInvitations = async () => {
        try {
            setSending(true);
            setResult(null);

            const invitationResult = await sendAccessRequestToAll(classId);

            if (invitationResult.success) {
                setResult({
                    sent: invitationResult.sent,
                    skipped: invitationResult.skipped,
                    failed: invitationResult.failed
                });

                if (invitationResult.sent > 0) {
                    toast.success(
                        `Sent ${invitationResult.sent} invitation${invitationResult.sent > 1 ? 's' : ''}`,
                        {
                            description: invitationResult.skipped > 0
                                ? `Skipped ${invitationResult.skipped} (already invited)`
                                : undefined
                        }
                    );
                } else if (invitationResult.skipped > 0) {
                    toast.info('All students have already been invited');
                }

                if (onInvitationsSent) {
                    onInvitationsSent();
                }

                // Close dialog after 2 seconds if successful
                setTimeout(() => {
                    setShowDialog(false);
                    setResult(null);
                }, 2000);
            } else {
                toast.error('Failed to send invitations', {
                    description: invitationResult.message
                });
            }
        } catch (error) {
            console.error('Error sending invitations:', error);
            toast.error('Failed to send invitations');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setShowDialog(true)}
                className="gap-2"
            >
                <Send className="size-4" />
                Send Invitations
            </Button>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Send Class Invitations</DialogTitle>
                        <DialogDescription>
                            Send access requests to all students in this class
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        {!result ? (
                            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="size-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">
                                        {studentCount} student{studentCount !== 1 ? 's' : ''} will receive invitations
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Students with accounts will get in-app notifications.
                                        Others will receive emails.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {result.sent > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <CheckCircle2 className="size-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-900 dark:text-green-100">
                                                {result.sent} invitation{result.sent > 1 ? 's' : ''} sent successfully
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {result.skipped > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <AlertCircle className="size-5 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                                {result.skipped} student{result.skipped > 1 ? 's' : ''} already invited
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {result.failed > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <AlertCircle className="size-5 text-red-600" />
                                        <div>
                                            <p className="text-sm text-red-900 dark:text-red-100">
                                                {result.failed} invitation{result.failed > 1 ? 's' : ''} failed
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {!result && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDialog(false)}
                                    disabled={sending}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSendInvitations}
                                    disabled={sending || studentCount === 0}
                                    className="gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            Send Invitations
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
