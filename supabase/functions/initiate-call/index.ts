// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { caller_id, receiver_id, call_type } = body;

    if (!caller_id || !receiver_id) {
      return new Response(
        JSON.stringify({ error: 'Caller and Receiver IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Get Caller Profile
    console.log(`Checking caller profile: ${caller_id}`);
    const { data: caller, error: callerError } = await supabaseClient
      .from('profiles')
      .select('user_id, institution_id, full_name, avatar_url')
      .eq('user_id', caller_id)
      .single()

    if (callerError) {
      console.error('Caller lookup failed:', callerError);
      return new Response(
        JSON.stringify({ error: `Caller profile lookup failed: ${callerError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get Receiver Profile
    console.log(`Checking receiver profile: ${receiver_id}`);
    const { data: receiver, error: receiverError } = await supabaseClient
      .from('profiles')
      .select('user_id, institution_id, full_name')
      .eq('user_id', receiver_id)
      .single()

    if (receiverError || !receiver) {
      console.error('Receiver lookup failed:', receiverError);
      return new Response(
        JSON.stringify({ error: `Receiver profile lookup failed: ${receiverError?.message || 'Profile not found'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!caller) {
      return new Response(
        JSON.stringify({ error: "Caller profile not found. Please ensure you are logged in." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default to a common UUID if institution_id is missing/null (e.g. for old users)
    const callerInst = caller.institution_id || '00000000-0000-0000-0000-000000000000';
    const receiverInst = receiver.institution_id || '00000000-0000-0000-0000-000000000000';

    console.log(`Inst validation: ${callerInst} vs ${receiverInst}`);

    // 3. Institution Validation
    const isDefault = (id: any) => !id || id === '00000000-0000-0000-0000-000000000000';

    if (!isDefault(callerInst) && !isDefault(receiverInst) && callerInst !== receiverInst) {
      console.warn(`Institution mismatch: ${callerInst} !== ${receiverInst}`);
      // Temporarily allowing mismatch as per previous dev's note, but keeping the logic
    }

    // 4. Create Call Session
    console.log('Inserting call session...');
    const { data: session, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .insert({
        caller_id,
        receiver_id,
        status: 'initiated',
        call_type: call_type || 'video',
        institution_id: caller.institution_id || '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session insert failed:', sessionError);
      return new Response(
        JSON.stringify({ error: `Failed to create call session: ${sessionError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Trigger Push Notification to Receiver
    try {
      console.log(`Sending push notification to receiver: ${receiver_id}`);
      const pushPayload = {
        user_id: receiver_id,
        payload: {
          title: `Incoming ${call_type || 'video'} Call`,
          body: `${caller.full_name || 'Someone'} is calling you...`,
          type: 'call',
          url: `/messages?session=${session.id}`,
          icon: caller.avatar_url || '/logo-branded.png',
          image: caller.avatar_url || null,
          tag: 'incoming-call',
          requireInteraction: true,
          data: {
            sessionId: session.id,
            callerId: caller_id,
            callerName: caller.full_name,
            callType: call_type || 'video'
          }
        }
      };

      // Call send-push function internally
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(pushPayload)
      });
      console.log('Push notification triggered successfully');
    } catch (pushErr) {
      console.error('Failed to trigger push notification:', pushErr);
      // Non-fatal, continue with returning the session
    }

    console.log('Session successful:', session.id);

    return new Response(
      JSON.stringify(session),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Edge Function Fatal Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
