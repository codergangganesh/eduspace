import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading } = useAuth();
  const [showRoleDialog, setShowRoleDialog] = useState(true);

  useEffect(() => {
    // If user is already authenticated, redirect to their dashboard
    if (isAuthenticated && role) {
      setShowRoleDialog(false);
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  // Don't show dialog while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <RoleSelectionDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
    </div>
  );
};

export default Index;
