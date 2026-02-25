import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    // If user is already authenticated and has a role, redirect to their dashboard
    if (isAuthenticated && role && !isLoading) {
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  // Don't show landing page while auth is loading
  // Reduced loading flickering by checking isLoading explicitly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-slate-400 font-medium animate-pulse">Syncing with EduSpace...</p>
        </div>
      </div>
    );
  }

  return <LandingPage />;
};

export default Index;
