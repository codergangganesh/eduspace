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
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const StudentRegister = lazy(() => import("./pages/StudentRegister"));
const LecturerLogin = lazy(() => import("./pages/LecturerLogin"));
const LecturerRegister = lazy(() => import("./pages/LecturerRegister"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LecturerDashboard = lazy(() => import("./pages/LecturerDashboard"));
const LecturerStudents = lazy(() => import("./pages/LecturerStudents"));
const Assignments = lazy(() => import("./pages/Assignments"));
const AssignmentSubmit = lazy(() => import("./pages/AssignmentSubmit"));
const LecturerClassesAssignments = lazy(() => import("./pages/LecturerClassesAssignments"));
const ClassAssignmentsView = lazy(() => import("./pages/ClassAssignmentsView"));
const SubmissionDetailsPage = lazy(() => import("./pages/SubmissionDetailsPage"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const AllStudents = lazy(() => import("./pages/AllStudents"));
const CreateClass = lazy(() => import("./pages/CreateClass"));
const LecturerTimeTable = lazy(() => import("./pages/LecturerTimeTable"));
const StudentAssignmentDetail = lazy(() => import("./pages/StudentAssignmentDetail"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
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
                  <Route
                    path="/student/assignments"
                    element={
                      <ProtectedRoute allowedRoles={["student", "admin"]}>
                        <StudentAssignments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/assignments/:id"
                    element={
                      <ProtectedRoute allowedRoles={["student", "admin"]}>
                        <StudentAssignmentDetail />
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
                    path="/lecturer/timetable"
                    element={
                      <ProtectedRoute allowedRoles={["lecturer", "admin"]}>
                        <LecturerTimeTable />
                      </ProtectedRoute>
                    }
                  />
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
                  {/* Assignments Route */}
                  <Route
                    path="/assignments"
                    element={
                      <ProtectedRoute>
                        <Assignments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assignments/:id/submit" // Keep legacy route if needed
                    element={
                      <ProtectedRoute>
                        <AssignmentSubmit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student/assignments/:id" // New route matching StudentAssignments.tsx
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
