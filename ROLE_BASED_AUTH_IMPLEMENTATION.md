# Role-Based Authentication Implementation

## Overview
Implemented a mandatory role selection dialog that appears before authentication, with separate login and signup pages for Students and Lecturers.

## Changes Made

### 1. New Components Created

#### `src/components/auth/RoleSelectionDialog.tsx`
- A modal dialog component that appears on the landing page
- Allows users to choose between "Student" and "Lecturer" roles
- Features a visually appealing card-based interface with icons
- Redirects to role-specific authentication pages based on selection
- Cannot be dismissed - users must select a role to proceed

### 2. New Pages Created

#### Student Authentication Pages
- **`src/pages/StudentLogin.tsx`** - Login page specifically for students
  - Hardcoded role context: "student"
  - Same UI design as original login page
  - Google OAuth with student role
  - Redirects to `/dashboard` after successful login
  - Link back to role selection dialog

- **`src/pages/StudentRegister.tsx`** - Registration page specifically for students
  - Hardcoded role context: "student"
  - Same UI design as original register page
  - Google OAuth with student role
  - Redirects to `/dashboard` after successful registration
  - Link back to role selection dialog

#### Lecturer Authentication Pages
- **`src/pages/LecturerLogin.tsx`** - Login page specifically for lecturers
  - Hardcoded role context: "lecturer"
  - Same UI design as original login page
  - Google OAuth with lecturer role
  - Redirects to `/lecturer-dashboard` after successful login
  - Link back to role selection dialog

- **`src/pages/LecturerRegister.tsx`** - Registration page specifically for lecturers
  - Hardcoded role context: "lecturer"
  - Same UI design as original register page
  - Google OAuth with lecturer role
  - Redirects to `/lecturer-dashboard` after successful registration
  - Link back to role selection dialog

### 3. Modified Files

#### `src/pages/Index.tsx`
- Updated to display the role selection dialog instead of redirecting to login
- Checks if user is already authenticated and redirects to appropriate dashboard
- Shows role selection dialog for non-authenticated users

#### `src/App.tsx`
- Added imports for new role-specific authentication pages
- Added new routes:
  - `/student/login` → StudentLogin
  - `/student/register` → StudentRegister
  - `/lecturer/login` → LecturerLogin
  - `/lecturer/register` → LecturerRegister
- Kept original `/login` and `/register` routes for backward compatibility

## User Flow

1. **Landing Page (`/`)**
   - User visits the website
   - Role selection dialog appears (mandatory)
   - User selects either "Student" or "Lecturer"
   - User clicks "Continue"

2. **Authentication**
   - User is redirected to role-specific login page:
     - Students → `/student/login`
     - Lecturers → `/lecturer/login`
   - User can either:
     - Sign in with existing credentials
     - Sign up for a new account (redirects to role-specific register page)
     - Use Google OAuth (with role context)
   - User can return to role selection via "Back to role selection" link

3. **Post-Authentication**
   - Students are redirected to `/dashboard`
   - Lecturers are redirected to `/lecturer-dashboard`
   - Role is stored in the authentication context

## Key Features

✅ **Mandatory Role Selection** - Users must choose a role before proceeding
✅ **Separate Authentication Flows** - Distinct pages for students and lecturers
✅ **Consistent UI Design** - All auth pages maintain the original design
✅ **Role Context** - Each page has hardcoded role context (no switcher)
✅ **Proper Redirection** - Users are redirected to role-appropriate dashboards
✅ **Backward Compatibility** - Original `/login` and `/register` routes still work
✅ **OAuth Support** - Google sign-in works with role context
✅ **Easy Navigation** - Users can return to role selection if needed

## Technical Details

- No changes to `AuthContext.tsx` - existing authentication logic is reused
- Role is passed to `signUp()` and `signInWithGoogle()` functions
- Each role-specific page has its own route for clean separation
- Dialog component uses existing UI components from the design system
- All pages use the same `AuthHeader` and `BackgroundDecoration` components

## Testing Recommendations

1. Test role selection dialog appearance on landing page
2. Verify navigation to correct login/register pages based on role selection
3. Test authentication flow for both students and lecturers
4. Verify post-login redirection to appropriate dashboards
5. Test "Back to role selection" functionality
6. Verify Google OAuth works with role context
7. Test that authenticated users are redirected to their dashboards when visiting `/`
