# 🔧 Fixing 401 Unauthorized Error - Supabase Authentication

## ❌ Problem Identified

**Error**: `POST https://cxszwmogxarovfuiofqu.supabase.co/auth/v1/token?grant_type=password 401 (Unauthorized)`

**Root Cause**: Invalid API key or Supabase configuration issue

## 🔍 Diagnostic Results

Our diagnostic tool found: **"Invalid API key"**

This means one of the following:
1. The ANON key in `.env` is incorrect
2. The Supabase project has been paused/deleted
3. The API keys have been regenerated

## ✅ Solution Steps

### Step 1: Get Fresh Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Click on project: `cxszwmogxarovfuiofqu`
   - If you don't see it, the project may have been deleted

3. **Get API Keys**
   - Navigate to: **Settings** → **API**
   - Copy the following:
     - **Project URL** (should be: `https://cxszwmogxarovfuiofqu.supabase.co`)
     - **anon/public key** (starts with `eyJ...`)

### Step 2: Update Your .env File

Replace the values in your `.env` file:

```bash
# Vite Environment Variables
project_id = cxszwmogxarovfuiofqu
VITE_SUPABASE_URL=https://cxszwmogxarovfuiofqu.supabase.co
VITE_SUPABASE_ANON_KEY=<PASTE_YOUR_NEW_ANON_KEY_HERE>
VITE_SUPABASE_SERVICE_ROLE_KEY=<PASTE_SERVICE_ROLE_KEY_IF_NEEDED>

# Gmail SMTP Configuration for OTP
GMAIL_USER=mannamganeshbabu8@gmail.com
GMAIL_APP_PASSWORD=zbmsycjwwfqsjjbf

# Backend Server Port
PORT=3001
```

### Step 3: Verify Database Setup

1. **Check if migrations are applied**
   - Go to: **Database** → **Tables**
   - Verify these tables exist:
     - `profiles`
     - `user_roles`

2. **If tables don't exist, apply migrations**
   - Go to: **SQL Editor**
   - Run the migration file: `supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql`
   - Copy and paste the entire SQL content
   - Click **Run**

### Step 4: Configure Authentication Settings

1. **Go to Authentication Settings**
   - Navigate to: **Authentication** → **Settings**

2. **For Development (Recommended)**
   - **Disable Email Confirmations**:
     - Find: "Enable Email Confirmations"
     - Toggle: **OFF**
   - This allows immediate login without email verification

3. **Configure Site URL**
   - Set Site URL to: `http://localhost:8082`
   - Add Redirect URLs:
     - `http://localhost:8082/**`
     - `http://localhost:8082/auth/callback`

### Step 5: Restart Development Server

```bash
# Stop all running dev servers (Ctrl+C in terminals)
# Then restart:
npm run dev
```

### Step 6: Test Authentication

1. **Try Registration First**
   - Go to: http://localhost:8082/register
   - Create a new account
   - If email confirmation is disabled, you should be logged in immediately

2. **Then Try Login**
   - Use the credentials you just registered
   - Should work without 401 error

## 🔍 Alternative: Create New Supabase Project

If the project `cxszwmogxarovfuiofqu` doesn't exist or can't be accessed:

1. **Create New Project**
   - Go to: https://supabase.com/dashboard
   - Click: **New Project**
   - Fill in details and create

2. **Get New Credentials**
   - Copy Project URL
   - Copy anon/public key

3. **Update .env**
   - Replace `VITE_SUPABASE_URL` with new URL
   - Replace `VITE_SUPABASE_ANON_KEY` with new key

4. **Apply Migrations**
   - Go to SQL Editor
   - Run migration files from `supabase/migrations/`

## 🧪 Verify Fix

After updating credentials, run:

```bash
node diagnose-auth.mjs
```

You should see:
- ✅ Connection successful
- ✅ Table 'profiles' exists
- ✅ Table 'user_roles' exists

## 📝 Quick Checklist

- [ ] Got fresh ANON key from Supabase Dashboard
- [ ] Updated `.env` file with new credentials
- [ ] Verified tables exist in database
- [ ] Disabled email confirmation (for development)
- [ ] Configured Site URL and Redirect URLs
- [ ] Restarted dev server
- [ ] Ran diagnostic tool (should show ✅)
- [ ] Tested registration
- [ ] Tested login

## 💡 Common Issues

### Issue: "Invalid API key" persists
**Solution**: Make sure you copied the **anon/public** key, not the service_role key

### Issue: "Email not confirmed"
**Solution**: Disable email confirmations in Authentication → Settings

### Issue: Tables don't exist
**Solution**: Run the migration SQL in SQL Editor

### Issue: Still getting 401
**Solution**: 
1. Clear browser cache and cookies
2. Try incognito/private window
3. Check browser console for more details

## 🆘 Need More Help?

1. **Check Supabase Logs**
   - Dashboard → Logs → Auth Logs
   - Look for failed authentication attempts

2. **Verify Project Status**
   - Dashboard → Settings → General
   - Check if project is paused or has issues

3. **Test with Supabase CLI**
   ```bash
   npx supabase login
   npx supabase projects list
   ```

## 📞 Support

If issues persist:
1. Check Supabase status: https://status.supabase.com/
2. Review Supabase docs: https://supabase.com/docs/guides/auth
3. Check project billing/limits in dashboard

---

**Most Common Fix**: Update the ANON key in `.env` file with a fresh one from Supabase Dashboard!
