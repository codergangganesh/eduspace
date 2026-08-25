import * as React from "react";
import { EarlyWarningStats } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  TrendingDown,
  UserCheck,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RiskScoreCardProps {
  stats: EarlyWarningStats;
  isLoading?: boolean;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/60 bg-card/40">
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                <Skeleton className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl" />
              </div>
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2 sm:mt-3" />
              <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-32 mt-1.5 sm:mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const atRiskPct =
    stats.totalStudents > 0
      ? Math.round((stats.totalAtRisk / stats.totalStudents) * 100)
      : 0;

  const cards = [
    {
      title: "Total At-Risk",
      value: stats.totalAtRisk,
      subValue: `${atRiskPct}% of ${stats.totalStudents}`,
      description: "Students requiring retention tracking",
      icon: ShieldAlert,
      iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
      accentBorder: "hover:border-rose-500/40",
      glowColor: "from-rose-500/10 to-transparent",
      badgeText: atRiskPct > 20 ? "Action" : "Monitored",
      badgeColor: atRiskPct > 20 ? "bg-rose-500/20 text-rose-500" : "bg-primary/15 text-primary",
    },
    {
      title: "Critical Priority",
      value: stats.criticalRisk,
      subValue: `Score 75–100`,
      description: "Immediate milestone action required",
      icon: Flame,
      iconBg: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20",
      accentBorder: "hover:border-red-500/40",
      glowColor: "from-red-500/10 to-transparent",
      badgeText: stats.criticalRisk > 0 ? "Urgent" : "Zero",
      badgeColor: stats.criticalRisk > 0 ? "bg-red-500/20 text-red-500 font-bold" : "bg-emerald-500/15 text-emerald-500",
    },
    {
      title: "High & Moderate",
      value: stats.highRisk + stats.moderateRisk,
      subValue: `${stats.highRisk} High · ${stats.moderateRisk} Mod`,
      description: "Declining quiz scores & missed work",
      icon: TrendingDown,
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      accentBorder: "hover:border-amber-500/40",
      glowColor: "from-amber-500/10 to-transparent",
      badgeText: "Review",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Safe Cohort",
      value: stats.safeCount,
      subValue: `Avg Index: ${stats.averageRiskScore}/100`,
      description: "Meeting academic milestones",
      icon: UserCheck,
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      accentBorder: "hover:border-emerald-500/40",
      glowColor: "from-emerald-500/10 to-transparent",
      badgeText: "Stable",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={cn(
              "relative overflow-hidden bg-card/60 backdrop-blur-sm border-border/80 transition-all duration-300 hover:shadow-md group",
              card.accentBorder
            )}
          >
            {/* Ambient Background Glow */}
            <div
              className={cn(
                "absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br opacity-20 group-hover:opacity-40 blur-2xl transition-opacity pointer-events-none",
                card.glowColor
              )}
            />

            <CardContent className="p-3.5 sm:p-5 relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {card.title}
                  </p>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground block">
                    {card.value}
                  </span>
                </div>

                <div
                  className={cn(
                    "p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 transition-transform group-hover:scale-105",
                    card.iconBg
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>

              <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-between gap-1.5">
                <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
                  {card.subValue}
                </p>
                <span
                  className={cn(
                    "text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                    card.badgeColor
                  )}
                >
                  {card.badgeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
