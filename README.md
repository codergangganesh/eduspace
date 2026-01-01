# 🎓 EduSpace - Advanced Learning Management System (LMS)

EduSpace is a modern, comprehensive, and scalable Learning Management System designed to bridge the gap between students, lecturers, and administrators. Built with performance and user experience in mind, it leverages cutting-edge web technologies to provide a seamless educational environment.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20Hyper-blueviolet)

---

## 🌟 Key Features

### 🔐 Authentication & Security
*   **Role-Based Access Control (RBAC):** Distinct environments for **Students**, **Lecturers**, and **Admins**.
*   **Secure Authentication:** Powered by Supabase Auth (Email/Password & Google OAuth).
*   **Row Level Security (RLS):** Database-level security policies ensuring users can only access data they are permitted to see.

### 👨‍🏫 Lecturer Hub
*   **Class Management:** Create, update, and manage multiple sub-courses/subjects.
*   **Student Management:**
    *   **Bulk Import:** Upload student lists via Excel/CSV.
    *   **Email Linking System:** Pre-register students by email before they sign up. The system automatically links their account upon registration.
    *   **Access Requests:** Manage requests from students to join classes.
*   **Curriculum Planning:** Schedule classes, labs, and exams with a built-in calendar.
*   **Assignments & Grading:** Create assignments, upload resource materials, view submissions, and grade student work.

### 👨‍🎓 Student Portal
*   **Interactive Dashboard:** A centralized hub for upcoming classes, pending assignments, and recent notifications.
*   **Course Enrollment:** Browse active courses and request access.
*   **Assignment Submission:** Submit work directly through the portal (text or file attachments).
*   **Academic Progress:** Track grades, attendance, and credits completed.
*   **Profile Management:** customizable profile with avatar upload (Base64 optimized).

### 💬 Communication & Collaboration
*   **Real-time Messaging:** Direct messaging system between students and lecturers.
*   **Notifications:** Real-time alerts for new assignments, grades, and class updates.
*   **Class Feeds:** Stay updated with course-specific announcements.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework:** [React](https://reactjs.org/) (v18) with [Vite](https://vitejs.dev/) for lightning-fast build tooling.
*   **Language:** [TypeScript](https://www.typescriptlang.org/) for robust type safety.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
*   **UI Library:** [shadcn/ui](https://ui.shadcn.com/) for accessible, reusable components.
*   **Icons:** [Lucide React](https://lucide.dev/).
*   **State Management:** React Context API & [TanStack Query](https://tanstack.com/query/latest) for server state.
*   **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation.

### Backend & Database (Serverless)
*   **Platform:** [Supabase](https://supabase.com/).
*   **Database:** PostgreSQL.
*   **Authentication:** Supabase Auth (JWT).
*   **Realtime:** Supabase Realtime (WebSockets) for instant updates.
*   **Storage:** Supabase Storage (optionally used alongside Base64 optimization).

---

## 📂 Project Structure

```text
eduspace/
├── .env                    # Environment variables configuration
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── common/         # Shared components (loaders, errors)
│   │   ├── layout/         # Layout wrappers (Sidebar, Topbar)
│   │   ├── lecturer/       # Lecturer-specific components
│   │   ├── student/        # Student-specific components
│   │   └── ui/             # shadcn/ui primitive components
│   ├── contexts/           # Global sets (AuthContext, ThemeContext)
│   ├── hooks/              # Custom React Hooks (data fetching, logic)
│   ├── integrations/       # Third-party integrations (Supabase types)
│   ├── lib/                # Utility functions and helpers
│   ├── pages/              # Application Routes/Screens
│   │   ├── Dashboard.tsx   # Student Dashboard
│   │   ├── Lecturer.tsx    # Lecturer Dashboard
│   │   └── ...
│   └── App.tsx             # Main Application Entry Component
├── supabase/
│   └── migrations/         # SQL migration files for database schema
└── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** or **yarn**
*   A **Supabase** account (Free tier is sufficient)

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
    Populate the following variables with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # (Optional, use with caution)
    ```

4.  **Database Setup**
    Navigate to the `supabase/migrations` folder and apply the SQL files to your Supabase project's **SQL Editor** in the following order:
    1.  `20251227_create_profiles_and_roles_system.sql` (Core Users & Roles)
    2.  `20251230_create_lms_core_system.sql` (Courses, Assignments, Schedule)
    3.  `20250101_create_email_linking_system.sql` (Student Pre-registration system)
    4.  *(Run any other migration files present)*

5.  **Run the Application**
    ```bash
    npm run dev
    ```
    Open [http://localhost:8082](http://localhost:8082) to view it in the browser.

---

## 🏗️ Database Architecture

The system uses a relational PostgreSQL database schema.

### Core Tables
*   **`profiles`**: Extends the default Supabase `auth.users` with application-specific data (bio, avatar, address, academic details).
*   **`user_roles`**: Maps users to roles (`admin`, `lecturer`, `student`).

### LMS Tables
*   **`courses`**: Main subjects created by lecturers.
*   **`classes`**: Specific instances of a course (e.g., "Mathematics 101 - Fall 2025").
*   **`course_enrollments` / `class_students`**: Junction table linking students to classes.
*   **`assignments`**: Assessment tasks linked to courses.
*   **`assignment_submissions`**: Student work submitted for assignments.
*   **`schedules`**: Timetable events for classes.

### Communication & System
*   **`conversations` & `messages`**: Chat system data.
*   **`notifications`**: Activity alerts.
*   **`student_emails`**: Staging table for invited students who haven't registered yet.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📞 Support & Contact

If you encounter any issues or have questions, please file an issue on the [GitHub Issues](https://github.com/codergangganesh/eduspace/issues) page.

---

**Developed with ❤️ by the EduSpace Team**
