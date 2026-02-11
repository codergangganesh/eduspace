# Smart VAPID Push Notification System

This system implements smart push notifications for EduSpace using VAPID keys, Supabase Edge Functions, and Service Workers.

## Setup Instructions

### 1. Database Migration
Run the SQL script located at `supabase/migrations/20250211120000_create_push_subscriptions.sql` in your Supabase SQL Editor.
This creates the `push_subscriptions` table.

### 2. Environment Variables
Your `.env` file has been updated with:
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Make sure these keys effectively match the ones used by the `send-push` function.

### 3. Deploy Edge Function
You need to deploy the `send-push` function to Supabase.
Run the following command in your terminal:
```bash
npx supabase functions deploy send-push --no-verify-jwt
```
(Or use the Supabase dashboard).
Make sure to set the secrets for the function:
```bash
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
```
*Note: The function expects `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` as environment variables.*

### 4. Smart Logic
The system automatically:
- Suppresses push notifications if the app is open and focused (Foreground).
- Sends notifications if the app is closed or in background.
- Handles click events to navigate to the correct page.
- Updates UI via Realtime if app is open (handled by existing hooks).

### 5. PWA Install
A custom install prompt appears for fresh users at the bottom of the screen.
