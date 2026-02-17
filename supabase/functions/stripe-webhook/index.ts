// @ts-ignore: Deno standard library
import { serve } from "std/http/server.ts";
// @ts-ignore: Stripe library
import Stripe from "stripe";
// @ts-ignore: Supabase library
import { createClient } from "supabase";

// @ts-ignore: Deno global
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const signature = req.headers.get('Stripe-Signature');

    try {
        const body = await req.text();
        // @ts-ignore: Deno global
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        let event;

        if (webhookSecret && signature) {
            try {
                event = await stripe.webhooks.constructEventAsync(
                    body,
                    signature,
                    webhookSecret
                );
            } catch (sigErr: any) {
                console.error(`Signature verification failed: ${sigErr.message}`);
                return new Response(`Signature verification failed: ${sigErr.message}`, {
                    status: 400,
                    headers: corsHeaders
                });
            }
        } else {
            console.warn('Skipping signature verification (Simulation or missing secret/signature).');
            try {
                event = JSON.parse(body);
            } catch (jsonErr: any) {
                return new Response(`Invalid JSON body: ${jsonErr.message}`, {
                    status: 400,
                    headers: corsHeaders
                });
            }
        }

        console.log(`Received Stripe event: ${event.type}`);

        // @ts-ignore: Deno global
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        // @ts-ignore: Deno global
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase internal environment variables missing');
            throw new Error('Supabase environment setup is incomplete');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            const planType = session.metadata?.plan_type || 'premium'; // fallback to premium if not set
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            if (userId) {
                console.log(`Processing completed checkout for user: ${userId}, Plan: ${planType}`);

                // Get subscription details to get period end
                let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to +30 days

                if (subscriptionId && !subscriptionId.startsWith('sub_test')) {
                    try {
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
                    } catch (subErr: any) {
                        console.error('Error fetching subscription from Stripe:', subErr.message);
                        // Fallback to default end date if Stripe ID is invalid
                    }
                }

                const { error } = await supabase
                    .from('user_subscriptions')
                    .upsert({
                        user_id: userId,
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        status: 'active',
                        plan_type: planType,
                        current_period_end: currentPeriodEnd,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('Error updating user subscription:', error);
                    throw error;
                }
                console.log(`Successfully activated premium for user: ${userId}`);
            }
        }

        if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            // Find user by customer ID
            const { data: subData, error: subError } = await supabase
                .from('user_subscriptions')
                .select('user_id')
                .eq('stripe_customer_id', customerId)
                .single();

            if (subData) {
                const status = subscription.status === 'active' ? 'active' : 'inactive';
                const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

                await supabase
                    .from('user_subscriptions')
                    .update({
                        status: status,
                        current_period_end: currentPeriodEnd,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', subData.user_id);

                console.log(`Updated subscription status for user: ${subData.user_id} to ${status}`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error(`Webhook Error Trace:`, err);

        const errorResponse = {
            error: err.message || 'An unknown error occurred',
            message: err.message,
            stack: err.stack,
            type: err.constructor.name
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
