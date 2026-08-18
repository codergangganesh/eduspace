import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VercelConnectionStatusProps {
  connected: boolean;
  className?: string;
  error?: string | null;
}

export function VercelConnectionStatus({
  connected,
  className,
  error,
}: VercelConnectionStatusProps) {
  if (error) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-2 py-0.5 rounded-full border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10 font-semibold shrink-0 gap-1",
          className
        )}
      >
        <AlertCircle className="size-3" />
        Connection Issue
      </Badge>
    );
  }

  if (connected) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-2 py-0.5 rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold shrink-0 gap-1",
          className
        )}
      >
        <CheckCircle2 className="size-3" />
        Connected
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full border-muted-foreground/30 text-muted-foreground bg-muted/40 font-medium shrink-0 gap-1",
        className
      )}
    >
      <CircleDashed className="size-3" />
      Not Connected
    </Badge>
  );
}
