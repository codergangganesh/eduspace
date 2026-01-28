import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, className, onClick }: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border border-border p-5 shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}% from last week
            </span>
          )}
        </div>
        <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
