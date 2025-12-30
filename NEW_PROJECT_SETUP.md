# ✅ NEW SUPABASE PROJECT SETUP

## 🎉 Good News!
Your new Supabase credentials are working! Connection successful ✅

## ⚠️ Next Steps Required

You have a **new Supabase project** (`nmzaptlccvoqualcmluj`), so you need to:
1. Apply database migrations
2. Configure authentication settings

---

## 📋 Step 1: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select project: `nmzaptlccvoqualcmluj`

2. **Open SQL Editor**
   - Click: **SQL Editor** in the left sidebar
   - Click: **+ New Query**

3. **Run Main Migration**
   - Open file: `supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql`
   - Copy **ALL** the SQL code (134 lines)
   - Paste into SQL Editor
   - Click: **Run** (or press F5)
   - Should see: ✅ "Success. No rows returned"

4. **Run Additional Migrations** (if needed)
   - `20251229_create_profiles_storage_bucket.sql`
   - `20251229_add_two_factor_enabled.sql`
   - Repeat the copy-paste-run process for each

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref nmzaptlccvoqualcmluj

# Push migrations
npx supabase db push
```

---

## 📋 Step 2: Configure Authentication

1. **Go to Authentication Settings**
   - Dashboard → **Authentication** → **Settings**

2. **Disable Email Confirmations** (for development)
   - Find: "Enable Email Confirmations"
   - Toggle: **OFF**
   - This allows immediate login without email verification

3. **Configure Site URL**
   - Find: "Site URL"
   - Set to: `http://localhost:8082`
   - Click: **Save**

4. **Add Redirect URLs**
   - Find: "Redirect URLs"
   - Add:
     - `http://localhost:8082/**`
     - `http://localhost:8082/auth/callback`
   - Click: **Save**

---

## 📋 Step 3: Restart Development Server

**Important**: You MUST restart the dev server for the new credentials to take effect!

```bash
# In your terminal, press Ctrl+C to stop the server
# Then restart:
npm run dev
```

---

## 📋 Step 4: Verify Everything Works

### Run Diagnostic
```bash
node diagnose-auth.mjs
```

Should show:
- ✅ Connection successful
- ✅ Table 'profiles' exists
- ✅ Table 'user_roles' exists (after migrations)

### Test Authentication
1. Open: http://localhost:8082
2. Click: **Register**
3. Create a new account:
   - Email: test@example.com
   - Password: test123456
   - Full Name: Test User
   - Role: Student
4. Should register successfully!
5. Try logging in with the same credentials

---

## 🔍 Current Status

✅ **Supabase Connection**: Working  
✅ **Environment Variables**: Fixed (VITE_ prefix)  
✅ **Table 'profiles'**: Exists  
❌ **Table 'user_roles'**: Missing (needs migration)  
⚠️ **Total Users**: 0 (fresh database)  

---

## 📝 Quick Migration SQL

If you want to quickly run the migration, here's the essential SQL:

```sql
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'lecturer', 'admin');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  
  -- Default to student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, COALESCE((new.raw_user_meta_data ->> 'role')::app_role, 'student'));
  
  RETURN new;
END;
$$;
```

---

## 🎯 Summary

1. ✅ **Fixed**: Changed `NEXT_PUBLIC_` to `VITE_` prefix
2. ✅ **Working**: New Supabase connection established
3. ⚠️ **Todo**: Apply database migrations
4. ⚠️ **Todo**: Configure auth settings
5. ⚠️ **Todo**: Restart dev server

**After completing these steps, your authentication will work perfectly!** 🚀

---

## 💡 Pro Tips

- Keep the SQL Editor tab open for quick queries
- Use "Table Editor" to view data visually
- Check "Auth" → "Users" to see registered users
- Monitor "Logs" for debugging

**Need help?** All migration files are in `supabase/migrations/` folder!
