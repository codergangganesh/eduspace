import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { AppRole } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
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

        if (existingRole?.role) {
          // User already has a role, use it
          userRole = existingRole.role as AppRole;
        } else {
          // New user via OAuth
          // 1. Try localStorage (most immediate user intent)
          const pendingRole = localStorage.getItem("pendingRole") as AppRole | null;

          // 2. Fallback to metadata (passed during OAuth init - robust for mobile/cross-device)
          const metadataRole = session.user.user_metadata?.role as AppRole | null;

          // 3. Default to student
          userRole = pendingRole || metadataRole || "student";

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
            }
          }
        }

        // Redirect based on role
        if (userRole === "lecturer") {
          navigate("/lecturer-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An error occurred during authentication");
      }
    };

    handleCallback();
  }, [navigate]);

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
