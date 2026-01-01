# EduSpace - Educational Management Platform

EduSpace is a comprehensive Learning Management System (LMS) designed for students, lecturers, and administrators. It features a modern, responsive UI built with React/Vite and powered by Supabase for backend services (Auth, Database, Realtime).

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm
- Supabase Account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd eduspace
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    # Optional: For email features if implemented via Edge Functions
    GMAIL_USER=your_email
    GMAIL_APP_PASSWORD=your_app_password
    ```

4.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:8082/`

## 🛠 Tech Stack

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
-   **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage/Edge Functions)
-   **State Management:** React Context (AuthContext), TanStack Query (optional)
-   **Routing:** React Router DOM

## 🗄️ Database Setup (Supabase)

The project relies on a specific database schema. Migrations are located in `supabase/migrations/`.

### Applying Migrations

You can apply migrations using the Supabase Dashboard's SQL Editor or the CLI.

**Notable Migration Files:**
*   `20251227_create_profiles_and_roles_system.sql`: Sets up `profiles` and `user_roles`.
*   `20251230_create_lms_core_system.sql`: Sets up core LMS tables (`courses`, `assignments`, `schedules`, etc.).
*   `20250101_create_email_linking_system.sql`: (If present) Sets up student email pre-registration linking.

**Recommended Setup (Dashboard):**
1.  Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **SQL Editor**.
3.  Copy/Paste the content of the migration files in chronological order and run them.

### Google OAuth Configuration

To enable "Continue with Google":
1.  **Google Cloud Console:** Create credentials for a Web Application.
    *   Authorized Origin: `http://localhost:8082` (and your production URL)
    *   Redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`
2.  **Supabase:** Go to Authentication -> Providers -> Google.
    *   Enable it.
    *   Enter Client ID and Client Secret.

## 🏗️ Project Structure

```text
eduspace/
├── .env                  # Env vars (GITIGNORED)
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Contexts (Auth, etc.)
│   ├── hooks/            # Custom React Hooks
│   ├── integrations/     # Supabase client & types
│   ├── pages/            # Main route pages (Dashboard, Login, etc.)
│   └── main.tsx          # App entry point
├── supabase/
│   └── migrations/       # SQL migration files
└── vite.config.ts        # Vite config
```

## ✅ Features & Status

*   **Authentication:** Email/Password & Google OAuth.
*   **Role-Based Access:** Distinct dashboards for Students (`/dashboard`) and Lecturers (`/lecturer-dashboard`).
*   **Profile Management:** Base64 image upload, profile editing.
*   **Academics:**
    *   Course Enrollment & Management.
    *   Assignment Submission & Grading.
    *   Schedule Management.
*   **Communication:**
    *   Real-time Messaging.
    *   Notifications System.
    *   Email Linking System (for pre-registered student access).

## 🧪 Development Commands

*   `npm run dev`: Start dev server.
*   `npm run build`: Build for production.
*   `npm run lint`: Run ESLint.
*   `npx tsc --noEmit`: Run TypeScript type checking.
*   `node verify-project.mjs`: Run a custom health check script (if available).

## 🐛 Troubleshooting

*   **Blank Page/Auth Loop:** Check `.env` vars and clear browser storage.
*   **"Bucket not found":** We use Base64 for profiles now, so storage buckets are less critical for avatars, but ensure Supabase is reachable.
*   **Import Errors:** Ensure you are using the correct `Import Students` template if bulk uploading.

---
**Happy Coding!** 🚀
