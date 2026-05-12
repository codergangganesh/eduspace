import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const loaderSizes = {
  sm: 28,
  md: 40,
  lg: 56,
} as const;

type AppLoaderSize = keyof typeof loaderSizes;

interface AppLoaderProps {
  size?: AppLoaderSize;
  className?: string;
}

interface LoadingFrameProps {
  className?: string;
  contentClassName?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  blockInteraction?: boolean;
  label?: string;
  loaderSize?: AppLoaderSize;
  children?: ReactNode;
}

export function AppLoader({ size = "md", className }: AppLoaderProps) {
  return (
    <div
      className={cn("loader shrink-0", className)}
      style={{ width: `${loaderSizes[size]}px` }}
      aria-hidden="true"
    />
  );
}

export function LoadingFrame({
  className,
  contentClassName,
  fullScreen = false,
  overlay = false,
  blockInteraction = false,
  label = "Loading content",
  loaderSize = "md",
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
        <AppLoader size={loaderSize} />
        {children}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
