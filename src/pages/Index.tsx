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

  return (
    <div className="relative min-h-screen">
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>

      <LandingPage deferMobileOnboarding={isLoading} />

      {isLoading && (
        <LoadingFrame
          overlay
          blockInteraction
          loaderSize="lg"
          className="fixed inset-0 z-[400] bg-background/92 px-6 backdrop-blur-sm"
          contentClassName="max-w-xs"
          label="Loading Eduspace"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Loading Eduspace...
          </p>
        </LoadingFrame>
      )}
    </div>
  );
};

export default Index;
