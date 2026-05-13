import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LoadingFrameProps {
  className?: string;
  contentClassName?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  blockInteraction?: boolean;
  label?: string;
  children?: ReactNode;
}

export function LoadingFrame({
  className,
  contentClassName,
  fullScreen = false,
  overlay = false,
  blockInteraction = false,
  label = "Loading content",
  children,
}: LoadingFrameProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen w-full",
        overlay && "absolute inset-0 z-30",
        overlay && (blockInteraction ? "pointer-events-auto" : "pointer-events-none"),
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-[1.75rem] px-6 py-5 text-center transition-all duration-200",
          overlay && "bg-background/72 shadow-lg backdrop-blur-sm",
          contentClassName,
        )}
      >
        {children}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
