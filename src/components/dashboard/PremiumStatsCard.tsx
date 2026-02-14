import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumStatsCardProps {
  title: string;
  value: string | number;
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
        "relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer",
        backgroundColor,
        className
      )}
    >
      {/* Decorative icon in background */}
      <div className="absolute top-2 right-2 p-2 sm:p-3 opacity-10">
        <Icon className="size-8 sm:size-12 text-white" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-4">
        <div className={cn(
          "p-2 sm:p-3 rounded-xl border border-white/20 backdrop-blur-sm flex-shrink-0",
          iconBackgroundColor
        )}>
          <Icon className="size-4 sm:size-5 text-white" />
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