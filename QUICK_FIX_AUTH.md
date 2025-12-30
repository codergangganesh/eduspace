# 🚨 IMMEDIATE ACTION REQUIRED - Fix 401 Auth Error

## ⚡ Quick Fix (5 minutes)

### The Problem
Your Supabase API key is **invalid or expired**. The diagnostic shows: `Invalid API key`

### The Solution
You need to get **fresh credentials** from Supabase Dashboard.

---

## 📋 Step-by-Step Fix

### 1️⃣ Open Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2️⃣ Check Your Project
- Look for project: **cxszwmogxarovfuiofqu**
- **If you see it**: Continue to step 3
- **If you DON'T see it**: The project was deleted → See "Option B" below

### 3️⃣ Get New API Keys (Option A - Project Exists)

1. Click on your project: `cxszwmogxarovfuiofqu`
2. Go to: **Settings** (⚙️ icon in sidebar)
3. Click: **API**
4. Copy these values:
   - **Project URL**: Should be `https://cxszwmogxarovfuiofqu.supabase.co`
   - **Project API keys** → **anon** **public**: Copy the long key starting with `eyJ...`

### 4️⃣ Update .env File

Open: `e:\AI PROJECT LISTS\STUDENT WORKSPACE\eduspace\.env`

Replace line 4 with your **new anon key**:
```bash
VITE_SUPABASE_ANON_KEY=<PASTE_YOUR_NEW_KEY_HERE>
```

### 5️⃣ Restart Dev Server

In your terminal:
1. Press `Ctrl+C` to stop the server
2. Run: `npm run dev`
3. Wait for it to start

### 6️⃣ Test Again

1. Open: http://localhost:8082
2. Try logging in or registering
3. Should work now! ✅

---

## 🆕 Option B - Create New Project (If Old One Doesn't Exist)

### 1. Create New Supabase Project
1. Go to: https://supabase.com/dashboard
2. Click: **+ New Project**
3. Fill in:
   - **Name**: EduSpace
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
4. Click: **Create new project**
5. Wait 2-3 minutes for setup

### 2. Get Credentials
1. Go to: **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key

### 3. Update .env
```bash
VITE_SUPABASE_URL=<YOUR_NEW_PROJECT_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_NEW_ANON_KEY>
```

### 4. Apply Database Migrations
1. In Supabase Dashboard, go to: **SQL Editor**
2. Click: **+ New Query**
3. Open file: `supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql`
4. Copy ALL the SQL code
5. Paste into SQL Editor
6. Click: **Run** (or press F5)
7. Should see: "Success. No rows returned"

### 5. Configure Auth Settings
1. Go to: **Authentication** → **Settings**
2. **Disable Email Confirmations** (for development):
   - Find: "Enable Email Confirmations"
   - Toggle: **OFF**
3. Set **Site URL**: `http://localhost:8082`
4. Click: **Save**

### 6. Restart & Test
```bash
npm run dev
```

---

## ✅ Verification

After fixing, run this to verify:
```bash
node diagnose-auth.mjs
```

Should show:
- ✅ Connection successful
- ✅ Table 'profiles' exists
- ✅ Table 'user_roles' exists

---

## 🎯 Most Likely Cause

Based on the error, your Supabase project either:
- Was **paused** due to inactivity
- Was **deleted** accidentally
- Has **expired keys** (rare but possible)

**Solution**: Get fresh keys from dashboard or create new project.

---

## 📞 Still Not Working?

1. **Clear browser cache**: Ctrl+Shift+Delete
2. **Try incognito mode**: Ctrl+Shift+N
3. **Check Supabase status**: https://status.supabase.com
4. **Verify project isn't paused**: Dashboard → Project Settings

---

## 💡 Pro Tip

For development, always:
1. **Disable email confirmations** in Auth settings
2. **Set Site URL** to your localhost
3. **Keep API keys safe** (don't commit to git)

---

**Need Help?** Check `FIX_AUTH_ERROR.md` for detailed troubleshooting!
