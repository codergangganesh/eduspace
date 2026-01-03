-- Create a function that will be called by the trigger
create or replace function public.handle_new_user_welcome_email()
returns trigger
language plpgsql
security definer
as $$
declare
  response_status int;
  response_body text;
begin
  -- Call the Edge Function via pg_net (or http extension if available)
  -- Note: Supabase Edge Functions are typically invoked via HTTP
  
  -- IMPORTANT: In a real Supabase environment with 'pg_net' or 'http' extension enabled:
  -- We would use select net.http_post(...)
  
  -- However, since simple triggers can't easily wait for async HTTP without extensions, 
  -- and configuring pg_net might be complex for the user,
  -- we will assume the user has the 'mod_datetime' extension or similar, 
  -- BUT actually, the most reliable way without external extensions setup 
  -- is to use Supabase's built-in Webhooks UI or the 'pg_net' extension.
  
  -- Let's try to use the `net` schema if available (standard in Supabase)
  
  perform
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'x-forwarded-host' || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true) -- This might fail if no active session, better use service key if possible, but triggers run in internal context usually
      ),
      body := jsonb_build_object(
        'email', new.email,
        'fullName', new.full_name,
        'role', (select role from public.user_roles where user_id = new.user_id limit 1) -- We might need to fetch role, or just pass 'User'
      )
    );
    
  return new;
exception
  when others then
    -- Don't block the insert if email fails
    return new;
end;
$$;

-- Since the `net` extension usage inside a trigger can be tricky with URL resolution and Auth,
-- A safer code-based approach often used in Supabase examples involves:
-- 1. Using a Trigger to insert into a job queue
-- 2. OR Just relying on the Client Side (AuthContext) to call the function after sign up.

-- RE-EVALUATION: The user wants this "when user creates a new account".
-- Client-side is 100% easier to control for the "Passkey" setup because we can debug the call easily.
-- Database triggers for HTTP requests often require special permissions/setup (pg_net).

-- Let's stick to the CLIENT SIDE TRIGGER in AuthContext for now as it's less prone to obscure database extension errors.
-- If I prefer DB trigger, I should use the "Webhooks" feature in the dashboard, but I cannot configure the dashboard for them.
-- So I will MODIFY the plan to call this function from `AuthContext.tsx` 'signUp' success block.
-- This is also much easier to debug.

-- So this SQL file is actually NOT needed if we go with Client Side.
-- But I will leave a comment here.
