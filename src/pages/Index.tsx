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
        <div className="size-20 rounded-3xl overflow-hidden border border-white/5 animate-pulse bg-slate-900/50 flex items-center justify-center">
          <img src="/favicon.png" alt="Logo" className="size-12 object-contain opacity-40 grayscale" />
        </div>
      </div>
    );
  }

  return <LandingPage />;
};

export default Index;
