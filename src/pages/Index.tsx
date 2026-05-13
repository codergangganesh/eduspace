import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";
import { Helmet } from "react-helmet-async";
import { LoadingFrame } from "@/components/ui/app-loader";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    // If we land on root with a recovery hash (Fallback), redirect to update-password
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
      navigate('/update-password', { replace: true });
      return;
    }

    // If user is already authenticated and has a role, redirect to their dashboard
    // Only redirect if NOT loading to prevent flickering
    if (isAuthenticated && role && !isLoading) {
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, role, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>

        <LoadingFrame
          fullScreen
          className="bg-background px-6"
          contentClassName="max-w-xs"
          label="Loading Eduspace"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Loading Eduspace...
          </p>
        </LoadingFrame>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>

      <LandingPage deferMobileOnboarding={false} />
    </div>
  );
};

export default Index;
