import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface PremiumStatsCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  backgroundColor: string;
  iconBackgroundColor: string;
  className?: string;
  onClick?: () => void;
}

export function PremiumStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  backgroundColor,
  iconBackgroundColor,
  className,
  onClick
}: PremiumStatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer",
        "shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.05)]",
        "dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)]",
        "hover:shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.08),inset_2px_2px_4px_rgba(255,255,255,0.12),inset_-2px_-2px_4px_rgba(0,0,0,0.18)]",
        "active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.2)]",
        "dark:active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3),inset_-3px_-3px_6px_rgba(255,255,255,0.05)]",
        backgroundColor,
        className
      )}
    >
      {/* Decorative icon in background */}
      <div className="absolute top-1 right-1 p-2 sm:p-3 opacity-20">
        <Icon className="size-12 sm:size-16 text-white" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <div className={cn(
          "p-2 sm:p-3.5 rounded-xl border border-white/20 backdrop-blur-sm flex-shrink-0",
          "shadow-[3px_3px_6px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.4)]",
          "dark:shadow-[3px_3px_6px_rgba(0,0,0,0.25),inset_2px_2px_4px_rgba(255,255,255,0.1)]",
          "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]",
          iconBackgroundColor
        )}>
          <Icon className="size-6 sm:size-8 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[8px] sm:text-[10px] text-white/80 font-semibold uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-lg sm:text-xl font-black text-white mt-0.5 sm:mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-[8px] sm:text-[10px] text-white/60 mt-0.5 hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}