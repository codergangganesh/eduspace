import * as React from "react";
import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    eventId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Admin ErrorBoundary caught an error]:", error, errorInfo);
    
    // Send to Sentry with React component stack
    Sentry.withScope((scope) => {
      scope.setExtra("componentStack", errorInfo.componentStack);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6 select-none">
          <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl text-center space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto ring-8 ring-destructive/5 shadow-inner">
              <ShieldAlert className="h-7 w-7 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">Admin Portal Error</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected administrative application error occurred. The incident has been recorded in Sentry for prompt resolution.
              </p>
            </div>

            {this.state.eventId && (
              <p className="text-[11px] text-muted-foreground/80 font-mono">
                Event ID: <span className="font-semibold text-foreground">{this.state.eventId}</span>
              </p>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null, eventId: null });
                window.location.reload();
              }}
              className="gap-2 text-xs font-semibold w-full"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reload Admin Portal
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

