import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary";
  }>;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClear,
  actions,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-card border border-border shadow-2xl rounded-full px-5 py-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 border-r border-border pr-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold text-foreground">Selected</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <Button
              key={i}
              size="sm"
              variant={act.variant || "secondary"}
              onClick={act.onClick}
              className="h-8 text-xs font-medium rounded-full px-3"
            >
              {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
              {act.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
