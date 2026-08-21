import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: "blue" | "emerald" | "purple" | "amber" | "rose";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}) => {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  return (
    <Card className="overflow-hidden hover:border-border transition-all duration-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {trend && (
          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-1.5 text-xs">
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trend.value}
            </span>
            <span className="text-muted-foreground text-[11px]">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
