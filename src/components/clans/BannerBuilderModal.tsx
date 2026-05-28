import React, { useState, useEffect } from "react";
import { X, Shield, Swords, Crown, Star, Flame, Eye, Sparkles } from "lucide-react";
import { BannerStyle, HeraldicIcon, BannerPattern } from "@/types/clans";
import { ClanBanner } from "./ClanBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface BannerBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: BannerStyle) => void;
  initialBanner?: BannerStyle;
}

export function BannerBuilderModal({ isOpen, onClose, onSave, initialBanner }: BannerBuilderModalProps) {
  const defaultBanner: BannerStyle = {
    bgColor: "cosmos",
    icon: "shield",
    pattern: "stars",
    borderColor: "solid"
  };

  const [currentStyle, setCurrentStyle] = useState<BannerStyle>(initialBanner || defaultBanner);

  useEffect(() => {
    if (initialBanner) {
      setCurrentStyle(initialBanner);
    }
  }, [initialBanner, isOpen]);

  const ICONS: Array<{ id: HeraldicIcon; label: string; icon: any }> = [
    { id: "shield", label: "Guardian", icon: Shield },
    { id: "swords", label: "PvP Duelist", icon: Swords },
    { id: "crown", label: "Monarch", icon: Crown },
    { id: "star", label: "Starlight", icon: Star },
    { id: "flame", label: "Blaze", icon: Flame },
    { id: "owl", label: "Sage Owl", icon: Eye }
  ];

  const FILLS = [
    { id: "cosmos", label: "Indigo Cosmos", colorClass: "bg-slate-900" },
    { id: "hellfire", label: "Hellfire Red", colorClass: "bg-red-700" },
    { id: "forest", label: "Emerald Woods", colorClass: "bg-emerald-700" },
    { id: "royal", label: "Royal Purple", colorClass: "bg-violet-700" },
    { id: "sunrise", label: "Sunrise Amber", colorClass: "bg-amber-600" },
    { id: "cyberpunk", label: "Cyber Punk", colorClass: "bg-cyan-600" }
  ];

  const PATTERNS: Array<{ id: BannerPattern; label: string }> = [
    { id: "solid", label: "Solid Coat" },
    { id: "stars", label: "Star Shower" },
    { id: "waves", label: "Ocean Waves" },
    { id: "stripes", label: "Valor Stripes" },
    { id: "cosmos", label: "Glow Nebula" }
  ];

  const BORDERS = [
    { id: "solid", label: "Iron Core" },
    { id: "gold", label: "Gold Filigree" },
    { id: "neon", label: "Neon Pulsar" },
    { id: "double", label: "Double Gilded" }
  ];

  const handleSave = () => {
    onSave(currentStyle);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-500" />
            House Heraldry Customizer
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Formulate your clan’s visual banner that classmates will see on the rankings podium.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Preview Panel */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-100/50 dark:border-slate-800/30 relative overflow-hidden h-[300px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05),transparent_70%)]" />
            
            <ClanBanner banner={currentStyle} size="xl" className="relative z-10 animate-bounce duration-1000" />
            
            <span className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 z-10">
              Live Banner Preview
            </span>
          </div>

          {/* Right: Customization Controls */}
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {/* 1. Heraldic Icon */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Select Charge Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((ic) => {
                  const Icon = ic.icon;
                  const isActive = currentStyle.icon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      onClick={() => setCurrentStyle(prev => ({ ...prev, icon: ic.id }))}
                      title={ic.label}
                      className={`size-10 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-md shadow-indigo-500/5"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-500"
                      }`}
                    >
                      <Icon className="size-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color Gradient */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Select Background Coat</label>
              <div className="grid grid-cols-6 gap-2">
                {FILLS.map((f) => {
                  const isActive = currentStyle.bgColor === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setCurrentStyle(prev => ({ ...prev, bgColor: f.id }))}
                      title={f.label}
                      className={`size-10 rounded-xl border-2 transition-all active:scale-90 ${f.colorClass} ${
                        isActive ? "border-indigo-500 scale-105 shadow-md" : "border-white dark:border-slate-800 hover:scale-95"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 3. Banner Pattern */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Select Shield Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map((p) => {
                  const isActive = currentStyle.pattern === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setCurrentStyle(prev => ({ ...prev, pattern: p.id }))}
                      className={`py-2 px-3 text-left rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-500"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Banner Border */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">4. Select Banner Border</label>
              <div className="grid grid-cols-2 gap-2">
                {BORDERS.map((b) => {
                  const isActive = currentStyle.borderColor === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setCurrentStyle(prev => ({ ...prev, borderColor: b.id }))}
                      className={`py-2 px-3 text-left rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-500"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-slate-500"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button onClick={handleSave} className="rounded-xl font-black bg-indigo-600 hover:bg-indigo-700 text-white">
            Unleash Heraldry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
