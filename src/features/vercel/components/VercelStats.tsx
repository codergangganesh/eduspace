import React from "react";
import { VercelCachedData } from "../types/vercelTypes";
import { formatFrameworkName } from "../utils/vercelHelpers";
import { FolderGit2, Rocket, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VercelStatsProps {
  cachedData?: VercelCachedData | null;
  className?: string;
}

export function VercelStats({ cachedData, className }: VercelStatsProps) {
  const totalProjects = cachedData?.totalProjects ?? 0;
  const totalDeployments = cachedData?.totalDeployments ?? 0;
  const topFrameworks = cachedData?.topFrameworks || [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* 2-Column Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card/70 dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Hosted Projects</span>
            <FolderGit2 className="size-4 text-foreground/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalProjects}
            </span>
            <span className="text-xs text-muted-foreground">projects</span>
          </div>
        </div>

        <div className="bg-card/70 dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Deployments</span>
            <Rocket className="size-4 text-foreground/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalDeployments}
            </span>
            <span className="text-xs text-muted-foreground">active</span>
          </div>
        </div>
      </div>

      {/* Frameworks Bar */}
      {topFrameworks.length > 0 && (
        <div className="bg-card/50 dark:bg-card/30 border border-border/50 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Layers className="size-3.5" />
            <span>Top Stacks & Frameworks</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topFrameworks.slice(0, 4).map((f) => (
              <Badge
                key={f.framework}
                variant="secondary"
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-background/80 border border-border/50 gap-1 text-foreground"
              >
                <span>{formatFrameworkName(f.framework)}</span>
                <span className="text-[10px] text-muted-foreground">({f.count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
