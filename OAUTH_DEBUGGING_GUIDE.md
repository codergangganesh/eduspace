# OAuth Role Selection - Debugging Guide

## Issue
When clicking "Continue with Google" on the Lecturer Login page, users were being redirected to the Student dashboard instead of the Lecturer dashboard.

## Solution Implemented
Added comprehensive console logging throughout the OAuth flow to track role selection and redirection.

## How to Test

### 1. Open Browser Console
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to the "Console" tab

### 2. Test Lecturer OAuth Flow
1. Navigate to `http://localhost:5173`
2. Select "Lecturer" role in the dialog
3. Click "Continue" - should go to `/lecturer/login`
4. Click "Continue with Google as Lecturer"
5. **Watch the console** - you should see:
   ```
   🔐 Storing role in localStorage for OAuth: lecturer
   ✅ OAuth initiated successfully, redirecting to Google...
   ```
6. Complete Google sign-in
7. After redirect back to the app, **watch the console** - you should see:
   ```
   🔍 OAuth Callback - Pending Role from localStorage: lecturer
   🆕 New user - Selected role: lecturer | From: localStorage
   ✅ Role created successfully: lecturer
   ✅ Profile created successfully
   🚀 Redirecting user based on role: lecturer
   → Redirecting to /lecturer-dashboard
   ```

### 3. Test Student OAuth Flow
1. Sign out and clear localStorage
2. Navigate to `http://localhost:5173`
3. Select "Student" role in the dialog
4. Click "Continue" - should go to `/student/login`
5. Click "Continue with Google as Student"
6. **Watch the console** - you should see:
   ```
   🔐 Storing role in localStorage for OAuth: student
   ✅ OAuth initiated successfully, redirecting to Google...
   ```
7. Complete Google sign-in
8. After redirect back to the app, **watch the console** - you should see:
   ```
   🔍 OAuth Callback - Pending Role from localStorage: student
   🆕 New user - Selected role: student | From: localStorage
   ✅ Role created successfully: student
   ✅ Profile created successfully
   🚀 Redirecting user based on role: student
   → Redirecting to /dashboard
   ```

## Console Log Meanings

| Emoji | Log Message | Meaning |
|-------|-------------|---------|
| 🔐 | Storing role in localStorage for OAuth | Role is being saved before OAuth redirect |
| ✅ | OAuth initiated successfully | OAuth flow started, redirecting to Google |
| 🔍 | OAuth Callback - Pending Role from localStorage | Checking what role was stored |
| 🆕 | New user - Selected role | Creating new user with this role |
| ✅ | Existing user - Using existing role | User already exists, using their existing role |
| ✅ | Role created successfully | Role saved to database |
| ✅ | Profile created successfully | User profile created |
| 🚀 | Redirecting user based on role | About to redirect to dashboard |
| → | Redirecting to /... | Final redirect destination |
| ❌ | OAuth initiation failed | Error during OAuth setup |

## Troubleshooting

### If you see "student" when you selected "lecturer":
1. Check the first log: `🔐 Storing role in localStorage for OAuth`
   - If it says "student", the issue is in the login page
   - If it says "lecturer", the issue is in the callback

2. Check the callback log: `🔍 OAuth Callback - Pending Role from localStorage`
   - If it says "null", localStorage was cleared or not persisted
   - If it says "student", something overwrote the value

3. Check browser localStorage:
   - Open DevTools → Application → Local Storage
   - Look for key "pendingRole"
   - It should be set to "lecturer" after clicking the button

### Common Issues:

1. **localStorage cleared between pages**
   - Some browsers clear localStorage on redirect
   - Solution: The code already handles this by also checking user_metadata

2. **Multiple tabs/windows**
   - If you have multiple tabs open, they might interfere
   - Solution: Close all tabs and test in a single tab

3. **Cached OAuth session**
   - Google might remember your previous role selection
   - Solution: Sign out completely and clear browser cache

## Files Modified

1. **`src/contexts/AuthContext.tsx`**
   - Added logging when storing role in localStorage
   - Added logging for OAuth success/failure

2. **`src/pages/AuthCallback.tsx`**
   - Added logging to show pendingRole from localStorage
   - Added logging to show which role is being used (localStorage vs metadata vs default)
   - Added logging for role creation success
   - Added logging for profile creation success
   - Added logging for final redirect destination

## Next Steps

After testing:
1. If the logs show the correct role but wrong redirect, there's a navigation issue
2. If the logs show the wrong role, there's a storage issue
3. If the logs show null, localStorage isn't persisting
4. Share the console logs with the developer for further debugging

## Remove Logging (Production)

Once the issue is resolved, you can remove the console.log statements by searching for:
- `console.log("🔐`
- `console.log("✅`
- `console.log("🔍`
- `console.log("🆕`
- `console.log("🚀`
- `console.log("→`
- `console.error("❌`

Or keep them for debugging in development and remove them before production deployment.
