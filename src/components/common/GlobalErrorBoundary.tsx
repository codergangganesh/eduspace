import React from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FallbackProps {
  error: unknown;
  resetError: () => void;
  eventId: string | null;
}

function ErrorFallback({ error, resetError, eventId }: FallbackProps) {
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected application error occurred.";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-4 sm:p-6 select-none">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5 shadow-inner">
          <AlertTriangle className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EduSpace encountered an unexpected issue. Our engineering team has been automatically notified via Sentry.
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="p-3 rounded-lg bg-muted/60 text-left border border-border text-xs font-mono text-destructive break-all max-h-32 overflow-y-auto">
            {errorMessage}
          </div>
        )}

        {eventId && (
          <p className="text-[11px] text-muted-foreground/80 font-mono">
            Error ID: <span className="font-semibold text-foreground">{eventId}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              resetError();
              window.location.reload();
            }}
            className="flex-1 gap-2 text-xs font-bold"
          >
            <RotateCcw className="h-4 w-4" />
            Reload Page
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetError();
              window.location.href = "/";
            }}
            className="flex-1 gap-2 text-xs font-bold"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError, eventId }) => (
        <ErrorFallback error={error} resetError={resetError} eventId={eventId} />
      )}
      onError={(error, componentStack) => {
        // Can perform optional logging if needed
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
