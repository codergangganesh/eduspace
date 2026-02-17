import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'none';

export interface UserSubscription {
    status: SubscriptionStatus;
    plan_type: string;
    current_period_end: string | null;
}

export const getSubscription = async (userId: string): Promise<UserSubscription | null> => {
    try {
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('status, plan_type, current_period_end')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching subscription:', error);
            return null;
        }

        if (!data) return { status: 'none', plan_type: 'free', current_period_end: null };

        return {
            status: (data.status as SubscriptionStatus) || 'inactive',
            plan_type: data.plan_type || 'free',
            current_period_end: data.current_period_end,
        };
    } catch (error) {
        console.error('Subscription service error:', error);
        return null;
    }
};

export const createCheckoutSession = async (userId: string, email: string, planType: 'pro' | 'pro_plus' = 'pro') => {
    try {
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: { user_id: userId, email, plan_type: planType },
        });

        if (error) {
            console.error('Edge Function Error Context:', error);
            console.log('Error Details:', JSON.stringify(error, null, 2));
            let detailedMsg = '';
            try {
                if ((error as any).context && (error as any).context.json) {
                    detailedMsg = (error as any).context.json.error || JSON.stringify((error as any).context.json);
                }
            } catch (e) { }

            throw new Error(detailedMsg || error.message || 'Unknown Function Error');
        }

        return data?.url;
    } catch (error: any) {
        console.error('Service catch block (checkout):', error);
        throw error;
    }
};

/**
 * ONLY FOR TESTING: Simulates a Stripe webhook completion
 */
export const simulateWebhookSuccess = async (userId: string, email: string, planType: string = 'pro') => {
    try {
        const mockPayload = {
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: { user_id: userId, plan_type: planType },
                    customer_email: email,
                    customer: 'cus_test_123',
                    subscription: 'sub_test_123'
                }
            }
        };

        const { data, error } = await supabase.functions.invoke('stripe-webhook', {
            body: mockPayload,
        });

        if (error) {
            console.error('Edge Function Error Context (webhook):', error);
            let detailedMsg = '';
            try {
                if ((error as any).context && (error as any).context.json) {
                    detailedMsg = (error as any).context.json.error || JSON.stringify((error as any).context.json);
                }
            } catch (e) { }
            throw new Error(detailedMsg || error.message || 'Unknown Webhook Error');
        }
        return data;
    } catch (error: any) {
        console.error('Service catch block (webhook):', error);
        throw error;
    }
};
