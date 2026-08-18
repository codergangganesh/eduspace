import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { startVercelOAuth } from "../services/vercelService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VercelConnectButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  onSuccess?: () => void;
  label?: string;
}

export function VercelConnectButton({
  className,
  variant = "default",
  size = "default",
  label = "Connect Vercel Account",
}: VercelConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const res = await startVercelOAuth();

      if (!res.success || !res.authUrl) {
        toast.error(res.error || "Failed to initialize Vercel OAuth flow.");
        setLoading(false);
        return;
      }

      // Redirect to official Vercel OAuth page
      window.location.href = res.authUrl;
    } catch (err: any) {
      toast.error(err?.message || "Could not connect to Vercel. Please check OAuth settings.");
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleConnect}
      disabled={loading}
      className={cn(
        "relative font-semibold shadow-sm transition-all duration-200 gap-2",
        "bg-black hover:bg-neutral-900 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <svg className="size-3.5 fill-current" viewBox="0 0 116 100">
            <polygon points="58 0, 116 100, 0 100" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
