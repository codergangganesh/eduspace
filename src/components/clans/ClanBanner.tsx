import React from "react";
import { Shield, Swords, Crown, Star, Flame, Eye } from "lucide-react";
import { BannerStyle } from "@/types/clans";
import { cn } from "@/lib/utils";

interface ClanBannerProps {
  banner?: BannerStyle;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ClanBanner({ banner, size = "md", className }: ClanBannerProps) {
  // Default values
  const style: BannerStyle = banner || {
    bgColor: "#6366f1",
    icon: "shield",
    pattern: "stars"
  };

  const IconMap = {
    shield: Shield,
    swords: Swords,
    crown: Crown,
    star: Star,
    flame: Flame,
    owl: Eye // using Eye as a stylized owl replacement for lucide-react compatibility
  };

  const Icon = IconMap[style.icon] || Shield;

  const bgGradients: Record<string, string> = {
    cosmos: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
    hellfire: "linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #450a0a 100%)",
    forest: "linear-gradient(135deg, #10b981 0%, #065f46 50%, #064e3b 100%)",
    royal: "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 50%, #2e1065 100%)",
    sunrise: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #78350f 100%)",
    cyberpunk: "linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #164e63 100%)"
  };

  const chosenBg = bgGradients[style.bgColor] || style.bgColor;

  const sizeClasses = {
    sm: "size-10 rounded-lg text-xs border-2 rotate-6",
    md: "size-16 rounded-xl text-base border-2 rotate-12",
    lg: "size-28 rounded-2xl text-2xl border-4 rotate-12 shadow-2xl",
    xl: "size-40 rounded-[2rem] text-4xl border-4 rotate-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
  };

  const borderStyles: Record<string, string> = {
    gold: "border-yellow-400 dark:border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]",
    neon: "border-cyan-400 dark:border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]",
    solid: "border-white/40 dark:border-white/20",
    double: "border-double border-slate-300 dark:border-slate-700"
  };

  const chosenBorder = borderStyles[style.borderColor || "solid"] || borderStyles.solid;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden transition-all duration-500 hover:rotate-0 hover:scale-105 shrink-0 select-none",
        sizeClasses[size],
        chosenBorder,
        className
      )}
      style={{
        background: chosenBg,
        clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"
      }}
    >
      {/* Pattern overlays */}
      {style.pattern === "stars" && (
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px]" />
      )}
      {style.pattern === "stripes" && (
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:20px_20px]" />
      )}
      {style.pattern === "waves" && (
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,transparent_20%,#fff_21%,#fff_34%,transparent_35%,transparent)] bg-[size:12px_12px]" />
      )}
      {style.pattern === "cosmos" && (
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.2)_0%,transparent_80%)]" />
      )}

      {/* Hero Icon */}
      <Icon className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] size-[50%] animate-pulse" />
    </div>
  );
}
