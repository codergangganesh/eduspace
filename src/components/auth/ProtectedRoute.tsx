import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();

  // Wait for both auth loading AND role to be determined
  const isRoleLoading = isAuthenticated && role === null;
  const isFullyLoaded = !isLoading && !isRoleLoading;

  useEffect(() => {
    if (isFullyLoaded && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isFullyLoaded, isAuthenticated, navigate]);

  useEffect(() => {
    if (isFullyLoaded && isAuthenticated && allowedRoles && role && !allowedRoles.includes(role)) {
      // Redirect to appropriate dashboard based on role
      if (role === "lecturer") {
        navigate("/lecturer-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isFullyLoaded, isAuthenticated, role, allowedRoles, navigate]);

  // Show loading while auth is loading OR while role is being fetched
  if (isLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pointer-events-none">
        <div className="size-16 rounded-2xl border border-white/5 animate-pulse bg-slate-900/50 flex items-center justify-center">
          <img src="/favicon.png" alt="Logo" className="size-10 object-contain opacity-30 grayscale" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
