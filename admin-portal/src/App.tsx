import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/sonner";

// Pages
import { Login } from "@/pages/Login";
import { AccessDenied } from "@/pages/AccessDenied";
import { Dashboard } from "@/pages/Dashboard";
import { Students } from "@/pages/Students";
import { Lecturers } from "@/pages/Lecturers";
import { Courses } from "@/pages/Courses";
import { Classes } from "@/pages/Classes";
import { Assignments } from "@/pages/Assignments";
import { Quizzes } from "@/pages/Quizzes";
import { ActivityPage } from "@/pages/Activity";
import { MessagesModeration } from "@/pages/Messages";
import { Announcements } from "@/pages/Announcements";
import { AuditLog } from "@/pages/AuditLog";
import { SystemOverview } from "@/pages/SystemOverview";
import { Settings } from "@/pages/Settings";
import { AdminProfile } from "@/pages/AdminProfile";

// Wipe legacy localStorage caches on boot
try {
  [
    "eduspace_admin_students_list_cache",
    "eduspace_admin_lecturers_list_cache",
    "eduspace_admin_stats_persistent_cache",
    "eduspace_admin_activity_persistent_cache",
    "eduspace_suspended_accounts",
  ].forEach((k) => localStorage.removeItem(k));
} catch (_) {}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 10, // 10 minutes cache
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Protected Administration Routes */}
              <Route
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout />
                  </ProtectedAdminRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/lecturers" element={<Lecturers />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/messages" element={<MessagesModeration />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/audit-logs" element={<AuditLog />} />
                <Route path="/system-overview" element={<SystemOverview />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<AdminProfile />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </AdminAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
