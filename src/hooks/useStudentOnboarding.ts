import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentPendingInvitations, linkEmailToAccount } from '@/lib/classInvitationService';
import { checkPendingInvitations } from '@/lib/accessControlService';

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

export function useStudentOnboarding() {
    const { user } = useAuth();
    const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasPending, setHasPending] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);

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
            }
        } catch (err) {
            console.error('Error fetching pending invitations:', err);
        }
    };

    const refreshInvitations = async () => {
        await fetchPendingInvitations();
    };

    return {
        pendingInvitations,
        loading,
        hasPending,
        isOnboarding,
        refreshInvitations
    };
}
