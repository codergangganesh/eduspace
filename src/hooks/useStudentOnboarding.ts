import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentPendingInvitations, linkEmailToAccount } from '@/lib/classInvitationService';
import { checkPendingInvitations } from '@/lib/accessControlService';
import { notifyPendingAccessRequest, clearAccessRequestNotification } from '@/lib/notificationService';

export interface PendingInvitation {
    id: string;
    class_id: string;
    student_email: string;
    sent_at: string;
    classes: {
        course_code: string;
        class_name?: string;
        semester?: string;
        academic_year?: string;
        lecturer_name?: string;
        lecturer_department?: string;
    };
}

const DISMISSED_REQUESTS_KEY = 'dismissedJoinRequests';

// Helper to get dismissed requests from session storage
const getDismissedRequests = (): Set<string> => {
    try {
        const stored = sessionStorage.getItem(DISMISSED_REQUESTS_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
};

// Helper to save dismissed requests to session storage
const saveDismissedRequests = (requests: Set<string>) => {
    try {
        sessionStorage.setItem(DISMISSED_REQUESTS_KEY, JSON.stringify([...requests]));
    } catch (err) {
        console.error('Error saving dismissed requests:', err);
    }
};

export function useStudentOnboarding() {
    const { user } = useAuth();
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasPending, setHasPending] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [dismissedRequests, setDismissedRequests] = useState<Set<string>>(getDismissedRequests());

    useEffect(() => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        checkAndLinkAccount();
    }, [user]);

    const checkAndLinkAccount = async () => {
        if (!user?.email) return;

        try {
            setLoading(true);
            setIsOnboarding(true);

            // Check if there are pending invitations for this email
            const { hasPending: hasInvitations, count } = await checkPendingInvitations(user.email);
            setHasPending(hasInvitations);

            if (hasInvitations) {
                console.log(`Found ${count} pending invitations for ${user.email}`);

                // Link email-based records to this account
                const { success, linkedCount } = await linkEmailToAccount(user.email, user.id);

                if (success) {
                    console.log(`Linked ${linkedCount} email-based records to account`);
                }

                // Fetch pending invitations
                await fetchPendingInvitations();
            }
        } catch (err) {
            console.error('Error during onboarding check:', err);
        } finally {
            setLoading(false);
            setIsOnboarding(false);
        }
    };

    const fetchPendingInvitations = async () => {
        if (!user?.email) return;

        try {
            const { success, data } = await getStudentPendingInvitations(user.email);

            if (success && data) {
                setPendingInvitations(data as PendingInvitation[]);
                setHasPending(data.length > 0);

                // Check if there are new requests that haven't been dismissed
                const dismissed = getDismissedRequests();
                const hasNewRequests = data.some((inv: PendingInvitation) => !dismissed.has(inv.id));

                // Show modal only if there are new requests
                if (hasNewRequests && data.length > 0) {
                    setShowModal(true);
                }
            }
        } catch (err) {
            console.error('Error fetching pending invitations:', err);
        }
    };

    const refreshInvitations = async () => {
        await fetchPendingInvitations();
    };

    const dismissModal = async () => {
        setShowModal(false);

        // Create notifications for all pending invitations
        if (user?.id && pendingInvitations.length > 0) {
            for (const invitation of pendingInvitations) {
                await notifyPendingAccessRequest(
                    user.id,
                    invitation.classes.lecturer_name || 'A lecturer',
                    invitation.classes.course_code,
                    invitation.classes.class_name,
                    invitation.id
                );
            }
        }

        // Mark all current invitations as dismissed
        const newDismissed = new Set(dismissedRequests);
        pendingInvitations.forEach(inv => newDismissed.add(inv.id));
        setDismissedRequests(newDismissed);
        saveDismissedRequests(newDismissed);
    };

    const markRequestAsHandled = async (requestId: string) => {
        // Clear notification for this request
        if (user?.id) {
            await clearAccessRequestNotification(user.id, requestId);
        }

        // Don't add to dismissed list - handled requests should not prevent new requests from showing
        // The request will be removed from pendingInvitations by the refresh
    };

    const showModalForNewRequest = () => {
        setShowModal(true);
    };

    const reopenModalForRequest = (requestId: string) => {
        // Remove from dismissed list to allow modal to show
        const newDismissed = new Set(dismissedRequests);
        newDismissed.delete(requestId);
        setDismissedRequests(newDismissed);
        saveDismissedRequests(newDismissed);

        // Show the modal
        setShowModal(true);
    };

    return {
        pendingInvitations,
        loading,
        hasPending,
        isOnboarding,
        showModal,
        setShowModal,
        dismissModal,
        markRequestAsHandled,
        showModalForNewRequest,
        reopenModalForRequest,
        refreshInvitations
    };
}
