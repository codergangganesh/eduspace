import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/i18n/config"; // Initialize i18n
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import LecturerLogin from "./pages/LecturerLogin";
import LecturerRegister from "./pages/LecturerRegister";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerStudents from "./pages/LecturerStudents";
import Assignments from "./pages/Assignments";
import AssignmentSubmit from "./pages/AssignmentSubmit";
import LecturerClassesAssignments from "./pages/LecturerClassesAssignments";
import ClassAssignmentsView from "./pages/ClassAssignmentsView";
import SubmissionDetailsPage from "./pages/SubmissionDetailsPage";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Schedule from "./pages/Schedule";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import AllStudents from "./pages/AllStudents";
import CreateClass from "./pages/CreateClass";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />

                {/* Role-specific Auth Routes */}
                <Route path="/student/login" element={<StudentLogin />} />
                <Route path="/student/register" element={<StudentRegister />} />
                <Route path="/lecturer/login" element={<LecturerLogin />} />
                <Route path="/lecturer/register" element={<LecturerRegister />} />

                {/* Legacy Auth Routes (for backward compatibility) */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student", "admin"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Lecturer Routes */}
                <Route
                  path="/lecturer-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <LecturerDashboard />
                    </ProtectedRoute>
                  }
                />
                { }
                <Route
                  path="/all-students"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <CreateClass />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/classes/:classId/students"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <AllStudents />
                    </ProtectedRoute>
                  }
                />

                {/* Lecturer Assignment Routes */}
                <Route
                  path="/lecturer/assignments"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <LecturerClassesAssignments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lecturer/assignments/:classId"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <ClassAssignmentsView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lecturer/assignments/:classId/:assignmentId/submissions"
                  element={
                    <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                      <SubmissionDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Common Routes */}
                {/* Assignments Route Removed */}
                <Route
                  path="/assignments/:id/submit"
                  element={
                    <ProtectedRoute>
                      <AssignmentSubmit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <Schedule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
