import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProviders } from "@/components/providers/AppProviders";
import "@/i18n/config"; // Initialize i18n
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { FCMManager } from "@/components/chat/FCMManager";
import { GlobalCallManager } from "@/components/chat/GlobalCallManager";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";
import { useFeedback } from "@/hooks/useFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { RootLayout } from "@/components/layout/RootLayout";
import { AppGuide } from "@/components/onboarding/AppGuide";
import { ProgressBar } from "@/components/common/ProgressBar";

// ── Eager imports: Core pages users navigate between frequently ──────────────
// These load with the main bundle so page transitions are INSTANT.
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import ClassFeed from "./pages/ClassFeed";
import Messages from "./pages/Messages";
import Schedule from "./pages/Schedule";

import StudentAssignments from "./pages/StudentAssignments";
import StudentQuizzes from "./pages/StudentQuizzes";
import AllStudents from "./pages/AllStudents";
import CreateClass from "./pages/CreateClass";
import LecturerTimeTable from "./pages/LecturerTimeTable";
import LecturerClassesAssignments from "./pages/LecturerClassesAssignments";
import LecturerClassesQuizzes from "./pages/LecturerClassesQuizzes";

// ── Lazy imports: Auth pages & one-off pages (visited rarely) ────────────────
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
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Assignments = lazy(() => import("./pages/Assignments"));
const AssignmentSubmit = lazy(() => import("./pages/AssignmentSubmit"));
const ClassAssignmentsView = lazy(() => import("./pages/ClassAssignmentsView"));
const AssignmentSubmissionsPage = lazy(() => import("./pages/AssignmentSubmissionsPage"));
const ClassQuizzesView = lazy(() => import("./pages/ClassQuizzesView"));
const QuizResultsView = lazy(() => import("./pages/QuizResultsView"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const CreateAIQuiz = lazy(() => import("./pages/CreateAIQuiz"));
const EditQuiz = lazy(() => import("./pages/EditQuiz"));
const TakeQuiz = lazy(() => import("./pages/TakeQuiz"));
const StudentAssignmentDetail = lazy(() => import("./pages/StudentAssignmentDetail"));
const QuizAttemptDetails = lazy(() => import("./pages/QuizAttemptDetails"));
const SharedAIChat = lazy(() => import("./pages/SharedAIChat"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Help = lazy(() => import("./pages/Help"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const AIChat = lazy(() => import("./pages/AIChat"));
const CallHistory = lazy(() => import("./pages/CallHistory"));
const StreakPage = lazy(() => import("./pages/StreakPage"));
const KnowledgeMap = lazy(() => import("./pages/KnowledgeMap"));

const LoadingFallback = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn("Loading persists... possible chunk error. Trying to recover.");
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-72 h-full flex-col border-r border-border/50 p-6 space-y-6 shrink-0">
        <Skeleton className="h-10 w-32 rounded-xl mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col p-6 md:p-10 space-y-8 min-w-0">
        <header className="flex justify-between items-center shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg invisible sm:visible" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-3xl" />
            <Skeleton className="h-[200px] w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Global polyfill for chunk errors
window.addEventListener('error', (e: any) => {
  // Defensive check for message to prevent "cannot read properties of undefined (reading 'includes')"
  const message = (e && typeof e.message === 'string') ? e.message : "";
  if (message && (message.includes('Loading chunk') || message.includes('CSS chunk'))) {
    console.warn("Chunk error detected, reloading...");
    window.location.reload();
  }
}, true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

const FeedbackManager = () => {
  const { user, profile } = useAuth();
  const { showPrompt, setShowPrompt, submitFeedback, checkFeedbackStatus } = useFeedback();


  useEffect(() => {
    if (user && profile) {
      checkFeedbackStatus();
    }
  }, [user, profile]);


  return (
    <FeedbackPrompt
      isOpen={showPrompt}
      onClose={() => setShowPrompt(false)}
      onSubmit={submitFeedback}
    />
  );
};

// Guarded wrapper to ensure AppGuide only mounts on protected internal pages
const AuthAppGuide = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const publicPaths = ['/', '/login', '/register', '/student/login', '/student/register', '/lecturer/login', '/lecturer/register', '/auth/callback', '/forgot-password', '/update-password', '/help'];

  // Do not render the guide on public landing or authentication pages
  if (!isAuthenticated || isLoading || publicPaths.includes(location.pathname)) {
    return null;
  }

  return <AppGuide />;
};

const AnimatedRoutes = () => {
  return (
    <Routes>
        <Route path="/p/:id" element={<PublicProfile />} />
        <Route path="/badge/:id" element={<PublicProfile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/share/:id" element={<PublicProfile />} />
        <Route path="/" element={<Index />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/lecturer/login" element={<LecturerLogin />} />
        <Route path="/lecturer/register" element={<LecturerRegister />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Persistent Layout Wrapper */}
        <Route element={
          <ProtectedRoute allowedRoles={["student", "lecturer", "admin"]}>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student", "admin"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/streak" element={<ProtectedRoute allowedRoles={["student"]}><StreakPage /></ProtectedRoute>} />
          <Route path="/achievements" element={<Navigate to="/streak" replace />} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={["student", "admin"]}><StudentAssignments /></ProtectedRoute>} />
          <Route path="/student/assignments/:id" element={<ProtectedRoute allowedRoles={["student", "admin"]}><StudentAssignmentDetail /></ProtectedRoute>} />
          <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={["student", "admin"]}><StudentQuizzes /></ProtectedRoute>} />
          <Route path="/student/quizzes/:quizId" element={<ProtectedRoute allowedRoles={["student", "admin"]}><TakeQuiz /></ProtectedRoute>} />
          <Route path="/student/quizzes/:classId/:quizId/results" element={<ProtectedRoute allowedRoles={["student", "admin"]}><QuizResultsView /></ProtectedRoute>} />
          <Route path="/student/quizzes/:quizId/details" element={<ProtectedRoute allowedRoles={["student", "admin"]}><QuizAttemptDetails /></ProtectedRoute>} />
          <Route path="/student/knowledge-map" element={<ProtectedRoute allowedRoles={["student"]}><KnowledgeMap /></ProtectedRoute>} />
          <Route path="/lecturer-dashboard" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><LecturerDashboard /></ProtectedRoute>} />
          <Route path="/all-students" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><CreateClass /></ProtectedRoute>} />
          <Route path="/classes/:classId/students" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><AllStudents /></ProtectedRoute>} />
          <Route path="/lecturer/timetable" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><LecturerTimeTable /></ProtectedRoute>} />
          <Route path="/lecturer/assignments" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><LecturerClassesAssignments /></ProtectedRoute>} />
          <Route path="/lecturer/assignments/:classId" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><ClassAssignmentsView /></ProtectedRoute>} />
          <Route path="/lecturer/assignments/:classId/:assignmentId/submissions" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><AssignmentSubmissionsPage /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><LecturerClassesQuizzes /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes/:classId/create" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><CreateQuiz /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes/:classId/create-ai" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><CreateAIQuiz /></ProtectedRoute>} />
          <Route path="/lecturer/create-ai-quiz" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><CreateAIQuiz /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes/:classId" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><ClassQuizzesView /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes/:classId/:quizId/edit" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><EditQuiz /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes/:classId/:quizId/results" element={<ProtectedRoute allowedRoles={["lecturer", "admin"]}><QuizResultsView /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
          <Route path="/assignments/:id/submit" element={<ProtectedRoute><AssignmentSubmit /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/call-history" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

          <Route path="/class-feed" element={<ProtectedRoute allowedRoles={["student", "lecturer", "admin"]}><ClassFeed /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={["student", "lecturer", "admin"]}><AIChat /></ProtectedRoute>} />

        </Route>

        <Route path="/ai-chat/share/:token" element={<SharedAIChat />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <AppProviders queryClient={queryClient}>
    <FeedbackManager />
    <GlobalCallManager />
    <Toaster />
    <Sonner />
    <OfflineBanner />
    <PWAInstallPrompt />
    <PushNotificationManager />
    <FCMManager />
    <Suspense fallback={<LoadingFallback />}>
      <ProgressBar />
      <AuthAppGuide />
      <AnimatedRoutes />
    </Suspense>
  </AppProviders>
);

export default App;
