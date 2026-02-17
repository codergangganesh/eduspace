import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { AuthProvider } from "@/contexts/AuthContext";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CallProvider } from "@/contexts/CallContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { StreakProvider } from "@/contexts/StreakContext";
import "@/i18n/config"; // Initialize i18n
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { GlobalCallManager } from "@/components/chat/GlobalCallManager";
import { FeedbackPrompt } from "@/components/feedback/FeedbackPrompt";
import { useFeedback } from "@/hooks/useFeedback";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

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
const AssignmentSubmissionsPage = lazy(() => import("./pages/AssignmentSubmissionsPage"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const AllStudents = lazy(() => import("./pages/AllStudents"));
const CreateClass = lazy(() => import("./pages/CreateClass"));
const LecturerTimeTable = lazy(() => import("./pages/LecturerTimeTable"));
const LecturerClassesQuizzes = lazy(() => import("./pages/LecturerClassesQuizzes"));

const ClassQuizzesView = lazy(() => import("./pages/ClassQuizzesView"));
const QuizResultsView = lazy(() => import("./pages/QuizResultsView"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const CreateAIQuiz = lazy(() => import("./pages/CreateAIQuiz"));
const EditQuiz = lazy(() => import("./pages/EditQuiz"));
const StudentQuizzes = lazy(() => import("./pages/StudentQuizzes"));
const TakeQuiz = lazy(() => import("./pages/TakeQuiz"));
const StudentAssignmentDetail = lazy(() => import("./pages/StudentAssignmentDetail"));
const StudentAssignments = lazy(() => import("./pages/StudentAssignments"));
const QuizAttemptDetails = lazy(() => import("./pages/QuizAttemptDetails"));
const AIChat = lazy(() => import("./pages/AIChat"));
const SharedAIChat = lazy(() => import("./pages/SharedAIChat"));
const KnowledgeMap = lazy(() => import("@/pages/KnowledgeMap"));
const StreakPage = lazy(() => import("./pages/StreakPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFail = lazy(() => import("./pages/PaymentFail"));
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <FeedbackProvider>
            <StreakProvider>
              <FeedbackManager />
              <CallProvider>
                <GlobalCallManager />
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <OfflineBanner />
                  <BrowserRouter>
                    <PWAInstallPrompt />
                    <PushNotificationManager />
                    <CookieConsent />
                    <Suspense fallback={<LoadingFallback />}>
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
                        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={["student", "lecturer", "admin"]}><AIChat /></ProtectedRoute>} />
                        <Route path="/ai-chat/share/:token" element={<SharedAIChat />} />
                        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                        <Route path="/payment-fail" element={<ProtectedRoute><PaymentFail /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </CallProvider>
            </StreakProvider>
          </FeedbackProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider >
);

export default App;
