# 🎓 EduSpace - Advanced Learning Management System (LMS)

EduSpace is a modern, comprehensive, and scalable Learning Management System designed to bridge the gap between students, lecturers, and administrators. Built with performance and user experience in mind, it leverages cutting-edge web technologies to provide a seamless educational environment.

<img width="1918" height="866" alt="image" src="https://github.com/user-attachments/assets/d7780a60-71c1-44de-9d55-28745701ac57" />

![Project Status](https://img.shields.io/badge/Status-Active-success)


---


## 🌟 Key Features

### 🔐 Authentication & Security
*   **Role-Based Access Control (RBAC):** Distinct environments for **Students**, **Lecturers**, and **Admins**.
    *   *Admins*: System oversight.
    *   *Lecturers*: Course creation, grading, student management.
    *   *Students*: Learning, submissions, progress tracking.
*   **Secure Authentication:** Powered by Supabase Auth (Email/Password & Google OAuth).
*   **Row Level Security (RLS):** Database-level security policies ensuring users can only access data they are permitted to see.

### 👨‍🏫 Lecturer Hub
*   **Class Management:** Create, update, and manage multiple sub-courses/subjects.
*   **Student Management:**
    *   **Bulk Import:** Upload student lists via Excel/CSV.
    *   **Email Linking System:** Pre-register students by email before they sign up. The system automatically links their account upon registration.
    *   **Access Requests:** Manage requests from students to join classes.
*   **Curriculum Planning:** Schedule classes, labs, and exams with a built-in calendar.
*   **Assignments & Grading:** Create assignments, upload resource materials, view submissions, and grade student work with feedback.

### 👨‍🎓 Student Portal
*   **Interactive Dashboard:** A centralized hub for upcoming classes, pending assignments, and recent notifications.
*   **Course Enrollment:** Browse active courses and request access.
*   **Assignment Submission:** Submit work directly through the portal (text or file attachments).
*   **Academic Progress:** Track grades, attendance, and credits completed.
*   **Profile Management:** Customizable profile with avatar upload (Base64 optimized) and academic history.

### 💬 Communication & Collaboration
*   **Real-time Messaging:** Direct messaging system between students and lecturers.
*   **Notifications:** Real-time system alerts for new assignments, grades, and class updates.
*   **Class Feeds:** Stay updated with course-specific announcements.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework:** [React](https://reactjs.org/) (v18) with [Vite](https://vitejs.dev/) for lightning-fast build tooling.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for robust type safety.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
*   **UI Library:** [shadcn/ui](https://ui.shadcn.com/) for accessible, reusable components.
*   **State Management:** React Context API & [TanStack Query](https://tanstack.com/query/latest) for server state caching.
*   **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation.
*   **Routing:** [React Router](https://reactrouter.com/) for client-side routing.

### Backend & Database (Serverless)
*   **Platform:** [Supabase](https://supabase.com/).
*   **Database:** PostgreSQL (Relation Database).
*   **Authentication:** Supabase Auth (JWT).
*   **Realtime:** Supabase Realtime (WebSockets) for instant updates.
*   **Edge Functions:** (Optional) For server-side logic like sending emails.

---

## 📂 Project Structure

```text
eduspace/
├── .env                    # Environment variables configuration
├── public/                 # Static assets (images, icons)
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   ├── common/         # Shared components (loaders, errors)
│   │   ├── layout/         # Layout wrappers (Sidebar, Topbar)
│   │   ├── lecturer/       # Lecturer-specific components
│   │   ├── student/        # Student-specific components
│   │   └── ui/             # shadcn/ui primitive components
│   ├── contexts/           # Global State (AuthContext, ThemeContext)
│   ├── hooks/              # Custom React Hooks
│   ├── i18n/               # i18n configuration
│   ├── integrations/       # Supabase client & DB types
│   ├── lib/                # Utility functions & libraries
│   ├── locales/            # Translation files
│   ├── pages/              # Application Routes/Screens
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # General utility functions
│   ├── App.tsx             # Main App Component
│   └── main.tsx            # Entry Point
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   └── migrations/         # SQL migration files
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** or **yarn**
*   A **Supabase** account (Free tier is sufficient)
*   A **Google Cloud Console** account (for OAuth - optional)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/codergangganesh/eduspace.git
    cd eduspace
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory by copying the example:
    ```bash
    cp .env.example .env
    ```
    Populate the variables:
    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # (Optional, caution advised)
    ```

4.  **Database Setup**
    Navigate to the `supabase/migrations` folder and apply the SQL files to your Supabase project's **SQL Editor** in this specific order:
    1.  `20251227_create_profiles_and_roles_system.sql`
    2.  `20251230_create_lms_core_system.sql`
    3.  `20250101_create_email_linking_system.sql`
    4.  `20250101_fix_access_requests_nullable.sql`
    5.  `20250101_fix_class_students_nullable.sql`
    *(Tip: You can copy-paste the content of these files directly into the Supabase SQL editor)*

5.  **Run the Application**
    ```bash
    npm run dev
    ```
    Open [http://localhost:8082](http://localhost:8082) to view it.

---

## 🔧 Advanced Configuration

### Setting up Email Linking System
The system allows lecturers to add student emails before they register.
1.  **Lecturer Side:** In the class management view, click "Import Students". Upload an Excel file or add manually.
2.  **Backend Logic:** A trigger (`trigger_auto_link_student`) automatically runs when a new user signs up. It checks the `student_emails` table and links the new account to the class if a match is found.

### Google OAuth Setup
To enable "Continue with Google":
1.  **Google Cloud Console:** Create credentials for a Web Application.
    *   Authorized Origin: `http://localhost:8082` (and your production URL)
    *   Redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`
2.  **Supabase:** Go to Authentication -> Providers -> Google.
    *   Enable it.
    *   Enter Client ID and Client Secret.

---

## 🐛 Troubleshooting

### Common Issues

**1. "Bucket not found" error**
*   **Cause:** The application tries to upload images to Supabase Storage but buckets aren't configured.
*   **Fix:** We have migrated to base64 encoding for profile images. Ensure you are using the latest version of the code which handles image strings directly in the database.

**2. Auth Loop / Blank Page**
*   **Cause:** Invalid environment variables or stale local storage.
*   **Fix:** Check `.env` values. Clear Application Storage (Local Storage) in DevTools.

**3. Row Level Security Policy Violation**
*   **Cause:** Trying to access data belonging to another user.
*   **Fix:** Ensure you are logged in with the correct role. Check the SQL migration files to understand the RLS policies in place.

---

## 🗺️ Roadmap

*   [ ] **Mobile App:** React Native version for iOS/Android.
*   [ ] **Video Conferencing:** Integration with Zoom or WebRTC for live classes.
*   [ ] **AI Tutor:** Integration with OpenAI for student assistance.
*   [ ] **Analytics Dashboard:** Advanced reporting for Admin/Lectures.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.


---

**Developed by the EduSpace Team**
