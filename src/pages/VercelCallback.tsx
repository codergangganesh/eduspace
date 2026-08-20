import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { completeVercelOAuth, startVercelOAuth } from "@/features/vercel";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VercelCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(errorDescription || "Vercel authorization was cancelled or denied.");
        }
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Missing authorization code or security state from Vercel redirect.");
        }
        return;
      }

      try {
        const res = await completeVercelOAuth(code, state);

        if (!isMounted) return;

        if (res.success && res.data) {
          setStatus("success");
          toast.success("Vercel account connected successfully!");
          setTimeout(() => {
            navigate("/profile", { replace: true });
          }, 1200);
        } else {
          setStatus("error");
          setErrorMessage(res.error || "Failed to complete Vercel authorization.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(err?.message || "An unexpected error occurred during connection.");
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate]);

  const handleRetry = async () => {
    try {
      setRetrying(true);
      const res = await startVercelOAuth();
      if (res.success && res.authUrl) {
        window.location.href = res.authUrl;
      } else {
        toast.error(res.error || "Failed to initialize Vercel connection");
        setRetrying(false);
      }
    } catch {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full p-8 rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl text-center space-y-6">
        <div className="size-16 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-md">
          <svg className="size-8 fill-current" viewBox="0 0 116 100">
            <polygon points="58 0, 116 100, 0 100" />
          </svg>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">
              Connecting Vercel Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Securely verifying authorization and synchronizing your deployed projects...
            </p>
            <div className="pt-4 flex justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Connection Successful!
            </h2>
            <p className="text-xs text-muted-foreground">
              Your Vercel profile and deployments are now linked to EduSpace. Redirecting...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="size-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">
                Connection Failed
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleRetry}
                disabled={retrying}
                className="flex-1 rounded-2xl h-10 text-xs font-semibold bg-black hover:bg-neutral-900 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black gap-1.5"
              >
                {retrying ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Try Again</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/profile", { replace: true })}
                className="flex-1 rounded-2xl h-10 text-xs font-semibold"
              >
                Return to Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
