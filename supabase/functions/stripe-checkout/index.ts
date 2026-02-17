// @ts-ignore: Deno standard library
import { serve } from "std/http/server.ts";
// @ts-ignore: Stripe library
import Stripe from "stripe";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('Function invoked');
        const body = await req.json();
        const { user_id, email, plan_type = 'pro' } = body;
        console.log(`User ID: ${user_id}, Email: ${email}, Plan Type: ${plan_type}`);

        if (!user_id || !email) {
            console.error('Missing user_id or email');
            return new Response(JSON.stringify({ error: 'Missing user_id or email' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // @ts-ignore: Deno global
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            console.error('STRIPE_SECRET_KEY missing');
            return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not set' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // @ts-ignore: Deno global
        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        console.log(`Creating checkout session for user: ${user_id}, email: ${email}, plan: ${plan_type}`);

        const origin = req.headers.get('origin') || 'http://localhost:8080';

        // Plan details
        let amount = 39900; // Default Pro ₹399
        let name = 'Eduspace Pro Access';
        let description = 'Unlimited AI questions and advanced features';

        if (plan_type === 'pro_plus') {
            amount = 99900; // Pro Plus ₹999
            name = 'Eduspace Pro Plus';
            description = 'Everything in Pro + Early access to new features, dedicated support, and unlimited course generations';
        }

        // Creating a simple checkout session for a subscription
        const session = await stripe.checkout.sessions.create({
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: name,
                            description: description,
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/payment-fail`,
            metadata: {
                user_id: user_id,
                plan_type: plan_type,
            },
        });

        console.log(`Checkout session created: ${session.id}`);

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);

        // Extract useful properties from the Error object
        const errorResponse = {
            error: error.message || 'An unknown error occurred',
            type: error.type || error.constructor.name,
            code: error.code,
            param: error.param,
            message: error.message
        };

        return new Response(JSON.stringify(errorResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
