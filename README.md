# EduSpace - Advanced Learning Management System (LMS)

EduSpace is a modern, comprehensive, and scalable Learning Management System designed to bridge the gap between students, lecturers, and administrators. Built with performance and user experience in mind, it leverages cutting-edge web technologies to provide a seamless educational environment.

----

<img width="1918" height="866" alt="image" src="https://github.com/user-attachments/assets/d7780a60-71c1-44de-9d55-28745701ac57" />

### Demonstration
[Watch Demo Video on YouTube](https://www.youtube.com/watch?v=TMe3jbI36OY&t=10s)

> **Note:** A full video demonstration is available via the link above.

[![EduSpace Demo](https://img.youtube.com/vi/TMe3jbI36OY/maxresdefault.jpg)](https://www.youtube.com/watch?v=TMe3jbI36OY&t=10s)

---

## Key Features

### Authentication and Security
*   **Role-Based Access Control (RBAC):** Specialized environments for Students, Lecturers, and Administrators.
    *   **Administrators:** System-wide oversight and management.
    *   **Lecturers:** Course creation, curriculum management, and grading.
    *   **Students:** Content consumption, assignment submissions, and progress tracking.
*   **Secure Authentication:** Managed by Supabase Auth with support for Email/Password and Google OAuth.
*   **Row Level Security (RLS):** Strict database-level policies ensuring users only access data they are explicitly permitted to view.

### Lecturer Hub
*   **Class Management:** Create and manage multiple courses and academic subjects.
*   **Student Administration:**
    *   **Bulk Import:** Efficiently upload student lists using Excel or CSV files.
    *   **Email Linking System:** Pre-register students by email to automatically link their accounts upon sign-up.
    *   **Access Requests:** Review and manage student requests to join specific classes.
*   **Curriculum Planning:** Built-in calendar for scheduling lectures, labs, and examinations.
*   **Assignments and Grading:** Create tasks, distribute materials, and provide feedback-driven grading for student work.

### Student Portal
*   **Interactive Dashboard:** A centralized view of upcoming classes, pending tasks, and recent system alerts.
*   **Course Enrollment:** Browse the active course catalog and submit enrollment requests.
*   **Digital Submissions:** Submit assignments directly through the portal via text or file attachments.
*   **Academic Progress:** Real-time tracking of grades, attendance records, and credit completion.
*   **Profile Management:** Personalized academic profiles with optimized avatar management and history.

### Communication and Collaboration
*   **Real-time Messaging:** Direct communication channel between students and faculty.
*   **System Notifications:** Instant alerts for assignment postings, grade releases, and class updates.
*   **Class Feeds:** Course-specific newsfeeds for announcements and discussion.

---

## Technology Stack

### Frontend
*   **Framework:** React 18 with Vite for high-performance development and bundling.
*   **Language:** TypeScript for robust type safety and maintainability.
*   **Styling:** Tailwind CSS for utility-first responsive design.
*   **UI Library:** shadcn/ui for accessible and modular components.
*   **State Management:** React Context API and TanStack Query for efficient server-state caching.
*   **Forms:** React Hook Form with Zod for strict schema validation.

### Backend and Database
*   **Platform:** Supabase (Serverless infrastructure).
*   **Database:** PostgreSQL for relational data management.
*   **Authentication:** JWT-based Supabase Auth.
*   **Real-time:** WebSockets via Supabase Realtime for instant UI updates.
*   **Edge Functions:** Deno-based serverless logic for complex backend operations.

---

## Project Structure

```text
eduspace/
├── .env                    # Environment variables configuration
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific modules
│   │   ├── common/         # Shared UI components
│   │   ├── layout/         # Shell and navigation
│   │   ├── lecturer/       # Lecturer-specific modules
│   │   ├── student/        # Student-specific modules
│   │   └── ui/             # shadcn/ui primitives
│   ├── contexts/           # Global state (Auth, Theme)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Backend client and types
│   ├── pages/              # Application routes and screens
│   └── types/              # TypeScript definitions
├── supabase/
│   ├── functions/          # Serverless Edge Functions
│   └── migrations/         # SQL schema migrations
└── vite.config.ts          # Vite build configuration
```

---

## Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   Supabase Account
*   Google Cloud Console Account (Optional for OAuth)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/codergangganesh/eduspace.git
    cd eduspace
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and populate it with your credentials:
    ```env
    # Supabase
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_ANON_KEY=your_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_key
    
    # Cloudinary
    VITE_CLOUDINARY_CLOUD_NAME=your_name
    VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
    
    # Application
    APP_URL=http://localhost:8080
    
    # Email
    RESEND_API_KEY=your_api_key
    SMTP_USER=your_email
    SMTP_PASS=your_password
    ```

4.  **Database Setup**
    Apply the migrations in your Supabase SQL Editor in the following order:
    1. `20251227_create_profiles_and_roles_system.sql`
    2. `20251230_create_lms_core_system.sql`
    3. `20250101_create_email_linking_system.sql`

5.  **Run the Application**
    ```bash
    npm run dev
    ```

---

## Advanced Configuration

### Cloudflare Pages Deployment
This repository maps cleanly to Cloudflare Pages because the frontend is a client-rendered Vite SPA and the backend already lives in Supabase.

1.  **Install Wrangler locally**
    ```bash
    npm install -D wrangler@latest
    ```

2.  **Authenticate with Cloudflare**
    ```bash
    npx wrangler login
    ```

3.  **Build and preview the Pages output locally**
    ```bash
    npm run cf:preview
    ```

4.  **Deploy directly from the CLI**
    ```bash
    npm run cf:deploy
    ```

Cloudflare-specific project files included here:
*   `wrangler.jsonc` configures the Pages output directory and compatibility date.
*   `public/_headers` preserves the security headers that were previously declared in `vercel.json`.
*   `public/_redirects` keeps SPA routes resolving to `index.html`.

### Email Linking System
Lecturers can pre-register students by adding their emails to the system. A database trigger (`trigger_auto_link_student`) automatically runs when a new user signs up. It checks the `student_emails` table and links the new account to their assigned classes upon registration.

### Google OAuth Setup
Enable "Continue with Google" by configuring a Web Application in the Google Cloud Console. Set the Authorized Redirect URI to `https://<your-project-id>.supabase.co/auth/v1/callback` and enter the credentials into the Supabase Authentication dashboard.

---

## Troubleshooting

*   **File Uploads:** The system uses Base64 encoding for profile images stored directly in the database to avoid bucket configuration issues.
*   **Authentication Loops:** Ensure your `.env` variables are correct and clear your browser's local storage if you encounter redirection issues.
*   **RLS Violations:** If access is denied, verify that your account has been assigned the correct role (Student, Lecturer, or Admin).

---

## Project Roadmap

*   Development of native mobile applications for iOS and Android.
*   Direct integration with video conferencing tools for virtual classrooms.
*   Expansion of AI-driven student assistance and tutoring.
*   Advanced academic analytics for institutional reporting.

---

**Developed by Mannam Ganesh Babu**
