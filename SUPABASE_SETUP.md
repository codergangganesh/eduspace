# Supabase Setup Guide for EduSpace

This guide will help you set up your Supabase database and configure Google OAuth authentication for the EduSpace application.

## Prerequisites

- Supabase account (already configured with project ID: `cxszwmogxarovfuiofqu`)
- Google Cloud account (for OAuth credentials)

## Step 1: Apply Database Migration

Your database schema is already defined in `supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql`. Follow these steps to apply it:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **cxszwmogxarovfuiofqu**
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the migration file: `supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql`
6. Copy the entire SQL content
7. Paste it into the SQL Editor
8. Click **Run** to execute the migration

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref cxszwmogxarovfuiofqu

# Apply migrations
supabase db push
```

### Verify Database Setup

After running the migration, verify the tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see two new tables:
   - **profiles** - Stores user profile information
   - **user_roles** - Stores user role assignments

## Step 2: Configure Google OAuth

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - If prompted, configure the OAuth consent screen:
     - User Type: **External**
     - App name: **EduSpace**
     - User support email: Your email
     - Developer contact: Your email
     - Click **Save and Continue**
   
5. Configure OAuth Client:
   - Application type: **Web application**
   - Name: **EduSpace Production**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for local development)
     - Your production domain (if applicable)
   - Authorized redirect URIs:
     - `https://cxszwmogxarovfuiofqu.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for local testing)
   - Click **Create**
   
6. **Copy the Client ID and Client Secret** - you'll need these in the next step

### 2.2 Configure Google Provider in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **cxszwmogxarovfuiofqu**
3. Navigate to **Authentication** → **Providers** in the left sidebar
4. Find **Google** in the list of providers
5. Toggle it to **Enabled**
6. Paste your **Client ID** and **Client Secret** from Google Cloud
7. Click **Save**

## Step 3: Test the Authentication Flow

### 3.1 Start Development Server

```bash
npm run dev
```

The app should be running at `http://localhost:5173`

### 3.2 Test Google Sign-In

1. Navigate to the login page
2. Select a role (Student, Lecturer, or Admin) from the role selector
3. Click **Continue with Google**
4. Complete the Google OAuth flow
5. You should be redirected back to the app and logged in
6. Verify you're redirected to the correct dashboard based on your selected role:
   - **Student** → `/dashboard`
   - **Lecturer** → `/lecturer-dashboard`
   - **Admin** → `/dashboard` (or admin-specific page if implemented)

### 3.3 Verify Database Records

1. Go to Supabase Dashboard → **Table Editor**
2. Check the **profiles** table:
   - You should see a new row with your user information
   - `email`, `full_name` should be populated from Google
3. Check the **user_roles** table:
   - You should see a row with your `user_id` and the role you selected

## Step 4: Test Role-Based Access

1. Sign out from the app
2. Sign in again with a different role
3. Verify the role changes in the database
4. Test that role-specific features work correctly

## Troubleshooting

### "Error: Invalid OAuth credentials"
- Double-check that you copied the Client ID and Client Secret correctly
- Ensure the redirect URI in Google Cloud matches exactly: `https://cxszwmogxarovfuiofqu.supabase.co/auth/v1/callback`

### "Error: User already exists"
- This is expected if you've already signed up
- Use the sign-in flow instead

### "Error: No session found" after OAuth redirect
- Check browser console for errors
- Verify the redirect URL is configured correctly in both Google Cloud and Supabase
- Clear browser cache and cookies, then try again

### Profile or role not created
- Check the Supabase logs: Dashboard → **Logs** → **Database**
- Verify the trigger `on_auth_user_created` exists and is enabled
- Check RLS policies are not blocking inserts

### Google OAuth popup blocked
- Allow popups for `localhost:5173` in your browser
- Try using the redirect flow instead of popup

## Database Schema Overview

### `profiles` Table
Stores comprehensive user profile information including:
- Personal details (name, email, phone, DOB)
- Academic info (student ID, program, GPA, credits)
- Address information
- Notification preferences
- UI preferences (theme, language, timezone)

### `user_roles` Table
Maps users to their roles:
- Supports multiple roles per user
- Three role types: `student`, `lecturer`, `admin`
- Used for role-based access control throughout the app

### Row Level Security (RLS)
Both tables have RLS enabled:
- Users can only view/update their own profile
- Users can only view their own roles
- Automatic profile creation via database trigger

## Next Steps

After successful setup:
1. Customize the profile fields as needed
2. Implement role-specific features
3. Add additional OAuth providers if desired (GitHub, Microsoft, etc.)
4. Set up email templates in Supabase for password reset, email verification
5. Configure production environment variables for deployment
