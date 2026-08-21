import React from "react";
import { FolderOpen, AlertCircle, RefreshCw, Sparkles, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  description = "There are no records found matching this view or filter criteria.",
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80 rounded-2xl bg-card/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border shadow-inner">
          <Icon className="h-8 w-8 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          <Sparkles className="h-3 w-3" />
        </div>
      </div>

      <h3 className="text-base font-bold text-foreground mb-1 tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed font-normal">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
          className="text-xs font-semibold rounded-xl h-9 px-4 shadow-sm border-border hover:bg-secondary"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{
  count?: number;
  message?: string;
  className?: string;
}> = ({
  count = 4,
  message = "Loading platform data...",
  className = "",
}) => {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pb-2 border-b border-border/50">
        <span className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
          {message}
        </span>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card/50 animate-pulse gap-4"
        >
          <div className="flex items-center space-x-3.5 flex-1">
            <div className="h-10 w-10 rounded-full bg-muted/80 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/4 rounded bg-muted/80" />
              <div className="h-3 w-1/2 rounded bg-muted/60" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-lg bg-muted/70 shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Failed to load records",
  message = "An error occurred while communicating with the database. Please try refreshing.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center border border-destructive/20 rounded-2xl bg-destructive/5 animate-in fade-in",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 border border-destructive/20">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-xs font-semibold rounded-xl border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
};
