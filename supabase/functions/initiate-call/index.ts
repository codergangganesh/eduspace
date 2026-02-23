// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { caller_id, receiver_id, call_type } = body;

    // 1. Get Caller Profile - making it more flexible with columns
    const { data: caller, error: callerError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', caller_id)
      .single()

    if (callerError || !caller) {
      console.error('Caller lookup error:', callerError);
      return new Response(
        JSON.stringify({ error: `Caller not found: ${callerError?.message || 'Empty'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get Receiver Profile
    const { data: receiver, error: receiverError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', receiver_id)
      .single()

    if (receiverError || !receiver) {
      console.error('Receiver lookup error:', receiverError);
      return new Response(
        JSON.stringify({ error: `Receiver not found: ${receiverError?.message || 'Empty'}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Using user_id for everything since that's what we have
    const callerInst = caller.institution_id || '00000000-0000-0000-0000-000000000000';

    // 4. Create Call Session
    const { data: session, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .insert({
        caller_id: caller.user_id,
        receiver_id: receiver.user_id,
        status: 'initiated',
        call_type: call_type || 'video',
        institution_id: callerInst,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      return new Response(
        JSON.stringify({ error: `Session error: ${sessionError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Trigger Push Notification to Receiver
    try {
      const pushPayload = {
        user_id: receiver_id,
        payload: {
          title: `Incoming ${call_type || 'video'} Call`,
          body: `${caller.full_name || 'Someone'} is calling you...`,
          type: 'incoming_call', // Changed from 'call'
          url: `/messages?session=${session.id}&action=accept`,
          icon: caller.avatar_url,
          tag: 'incoming-call',
          requireInteraction: true,
          data: {
            type: 'incoming_call',
            sessionId: session.id,
            roomId: session.id, // User requested roomId
            callerId: caller_id,
            callerName: caller.full_name,
            callerAvatar: caller.avatar_url,
            callType: call_type || 'video',
            url: `/messages?session=${session.id}&action=accept`
          }
        }
      };

      // Call send-push function
      fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify(pushPayload)
      }).catch(err => console.error("Fire-and-forget push failed", err));

    } catch (pushErr) {
      console.error('Push trigger error:', pushErr);
    }

    return new Response(
      JSON.stringify(session),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Fatal Edge Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
