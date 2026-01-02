import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AppRole, useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a password recovery callback
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');

        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        // Check if this is a password recovery callback
        // We do this AFTER getting the session to ensure the hash is processed
        if (type === 'recovery') {
          if (session) {
            navigate('/update-password', { replace: true });
            return;
          } else {
            console.error("Recovery flow but no session found");
            setError("Invalid or expired password reset link");
            return;
          }
        }

        if (!session?.user) {
          setError("No session found");
          navigate("/login");
          return;
        }

        // Check if user already has a role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        let userRole: AppRole = "student";

        // Always clean up pending role from storage
        const pendingRole = localStorage.getItem("pendingRole") as AppRole | null;

        // Also check URL query parameter (more reliable across OAuth redirects)
        const roleUrlParams = new URLSearchParams(window.location.search);
        const urlRole = roleUrlParams.get('role') as AppRole | null;

        console.log("🔍 OAuth Callback - Pending Role from localStorage:", pendingRole);
        console.log("🔍 OAuth Callback - Role from URL:", urlRole);

        if (existingRole?.role) {
          // User already has a role, use it
          userRole = existingRole.role as AppRole;
          console.log("✅ Existing user - Using existing role:", userRole);
          localStorage.removeItem("pendingRole");
        } else {
          // New user via OAuth
          // Priority: 1. URL parameter (most reliable), 2. localStorage, 3. metadata, 4. default
          const metadataRole = session.user.user_metadata?.role as AppRole | null;

          userRole = urlRole || pendingRole || metadataRole || "student";
          console.log("🆕 New user - Selected role:", userRole, "| From:",
            urlRole ? "URL" : pendingRole ? "localStorage" : metadataRole ? "metadata" : "default");

          // Clean up localStorage AFTER we've used it
          localStorage.removeItem("pendingRole");

          // Create the role for the new user
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: session.user.id,
              role: userRole,
            });

          if (roleError && !roleError.message.includes("duplicate")) {
            console.error("Error creating role:", roleError);
          } else {
            console.log("✅ Role created successfully:", userRole);
          }

          // Check if profile exists, if not create one
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!existingProfile) {
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                user_id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
              });

            if (profileError) {
              console.error("Error creating profile:", profileError);
            } else {
              console.log("✅ Profile created successfully");
            }
          }
        }

        // Force a refresh of the auth context to ensure the role is updated in the application state
        await refreshProfile(session.user.id);

        // Redirect based on role
        console.log("🚀 Redirecting user based on role:", userRole);
        if (userRole === "lecturer") {
          console.log("→ Redirecting to /lecturer-dashboard");
          navigate("/lecturer-dashboard", { replace: true });
        } else {
          console.log("→ Redirecting to /dashboard");
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An error occurred during authentication");
      }
    };

    handleCallback();
  }, [navigate, refreshProfile]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
