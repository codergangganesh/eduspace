import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlatformErrorBoundaryProps {
  platformName: string;
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}

interface PlatformErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PlatformErrorBoundary extends Component<
  PlatformErrorBoundaryProps,
  PlatformErrorBoundaryState
> {
  public state: PlatformErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): PlatformErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PlatformErrorBoundary] Error in ${this.props.platformName}:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "relative rounded-3xl border border-destructive/30 bg-gradient-to-b from-card via-card/95 to-destructive/5 p-6 sm:p-7 shadow-md backdrop-blur-xl flex flex-col justify-between min-h-[300px] w-full max-w-full",
            this.props.className
          )}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-11 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                  {this.props.platformName} Card Unavailable
                </h3>
                <p className="text-xs text-muted-foreground">Display boundary error caught</p>
              </div>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 space-y-2">
              <div className="text-xs text-muted-foreground leading-relaxed">
                An unexpected rendering error occurred inside the{" "}
                <span className="font-bold text-foreground">{this.props.platformName}</span>{" "}
                component. Other platform metrics remain unaffected.
              </div>
              {this.state.error?.message ? (
                <div className="text-[11px] font-mono text-destructive/80 truncate">
                  Details: {this.state.error.message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="rounded-xl border-border/80 hover:bg-accent text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
              Retry Component
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
