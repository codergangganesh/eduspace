import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, Calendar, RotateCw } from "lucide-react";
import { DashboardStreakWeekly } from "./DashboardStreakWeekly";
import { DashboardDuelCard } from "./DashboardDuelCard";
import { cn } from "@/lib/utils";

interface DashboardStreakCardProps {
  streak?: any;
  className?: string;
}

export function DashboardStreakCard({ streak, className }: DashboardStreakCardProps) {
  const [activeView, setActiveView] = useState<'present' | 'duel'>(() => {
    const saved = localStorage.getItem("eduspace_dashboard_streak_view");
    return saved === "duel" || saved === "present" ? saved : "present";
  });

  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleToggle = () => {
    const nextView = activeView === "present" ? "duel" : "present";
    setActiveView(nextView);
    localStorage.setItem("eduspace_dashboard_streak_view", nextView);
  };

  // Auto-flip cycle: switch to the other side every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleToggle();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeView]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Filter out interactive elements so buttons, cards, and dropdowns still work
    const target = e.target as HTMLElement;
    if (
      target.closest("button") || 
      target.closest("a") || 
      target.closest("input") || 
      target.closest(".interactive-element") ||
      target.closest("[role='menuitem']") ||
      target.closest("[role='combobox']")
    ) {
      return;
    }

    handleToggle();
  };

  // Cursor-tracking 3D tilt effects
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return; // Disable on mobile/tablet viewports
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Cap tilts to a natural maximum of +/- 8 degrees
    setRotateX(-y / 15);
    setRotateY(x / 15);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Determine final visual flip state
  const isFlipped = activeView === "duel";

  return (
    <div 
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative w-full cursor-pointer overflow-visible select-none group [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]", 
        className
      )}
      style={{ perspective: "2000px" }}
    >
      {/* Sleek Glassmorphic 3D Flip Indicator (Fades in, scales up, and spins slowly on hover) */}
      <div className="absolute bottom-5 right-5 z-40 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 pointer-events-none hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 shadow-md">
        <RotateCw className="size-3.5 animate-[spin_4s_linear_infinite] text-indigo-500" />
        <span className="text-[9px] font-black uppercase tracking-wider">Flip</span>
      </div>

      <motion.div
        animate={{ 
          rotateX: rotateX,
          rotateY: isFlipped ? 180 - rotateY : rotateY,
          rotateZ: isFlipped ? [0, -6, 0] : [0, 6, 0],
          scale: isFlipped ? [1, 1.04, 1] : [1, 1.04, 1]
        }}
        transition={{ 
          duration: 0.7, 
          ease: [0.25, 1, 0.5, 1] // Custom easeOutQuart cushion transition
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full relative"
      >
        {/* Front Face: Present Streaks */}
        <div
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(1px)"
          }}
          className={cn(
            "transition-all duration-300",
            isFlipped 
              ? "pointer-events-none opacity-0 invisible absolute top-0 left-0 w-full" 
              : "relative w-full"
          )}
        >
          <DashboardStreakWeekly 
            streak={streak} 
          />
        </div>

        {/* Back Face: Live Streak Duel */}
        <div
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg) translateZ(1px)"
          }}
          className={cn(
            "transition-all duration-300",
            !isFlipped 
              ? "pointer-events-none opacity-0 invisible absolute top-0 left-0 w-full" 
              : "relative w-full"
          )}
        >
          <DashboardDuelCard />
        </div>
      </motion.div>
    </div>
  );
}
