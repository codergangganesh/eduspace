import {
    Flame,
    Trophy,
    Zap,
    Lock,
    Award,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreakSectionProps {
    onOpenRoleSelection: (open: boolean) => void;
}

export function StreakSection({ onOpenRoleSelection }: StreakSectionProps) {
    return (
        <section className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50 relative overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Visual Side */}
                    <div className="relative order-2 lg:order-1">
                        {/* Main Streak Card */}
                        <div className="relative z-10 bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-white/10 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-12">
                                <div className="space-y-1">
                                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Your Momentum</h3>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Consistency is Key</p>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                                    <Flame className="size-6 sm:size-8 text-orange-500" fill="currentColor" />
                                    <span className="text-2xl sm:text-4xl font-black text-white">12</span>
                                </div>
                            </div>

                            {/* Mini Calendar Visualization */}
                            <div className="grid grid-cols-7 gap-3 sm:gap-4 mb-12">
                                {[...Array(21)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "aspect-square rounded-xl border flex items-center justify-center transition-all duration-500",
                                            i < 12
                                                ? "bg-orange-500/20 border-orange-500/40"
                                                : "bg-white/5 border-white/10"
                                        )}
                                    >
                                        {i < 12 && <Flame className="size-4 sm:size-5 text-orange-500" fill="currentColor" />}

                                    </div>
                                ))}
                            </div>

                            {/* Badges Preview */}
                            <div className="flex gap-4">
                                <div className="flex-1 p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 group/badge hover:bg-white/10 transition-colors">
                                    <div className="size-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 group-hover/badge:scale-110 transition-transform">
                                        <Trophy className="size-7 text-purple-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Early Bird</span>
                                </div>
                                <div className="flex-1 p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 group/badge hover:bg-white/10 transition-colors">
                                    <div className="size-14 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover/badge:scale-110 transition-transform">
                                        <Zap className="size-7 text-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fast Learner</span>
                                </div>
                                <div className="flex-1 p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 opacity-30 grayscale group/badge">
                                    <div className="size-14 rounded-2xl bg-slate-500/20 flex items-center justify-center border border-slate-500/30">
                                        <Lock className="size-7 text-slate-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">God Mode</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-6 -right-6 z-20 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-bounce transition-all duration-1000">
                            <Trophy className="size-8 text-yellow-500" />
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="space-y-10 order-1 lg:order-2">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-bold border border-orange-200 dark:border-orange-500/20 uppercase tracking-wider">
                                <Flame className="size-4" />
                                Hot New Feature
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-black text-white dark:text-white leading-[1.1] tracking-tight">
                                Ignite Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                                    Growth Streak
                                </span>
                            </h2>
                            <p className="text-xl text-slate-200 dark:text-slate-400 leading-relaxed max-w-xl">
                                Consistency is the bridge between goals and accomplishment. Our new Streak system rewards your daily dedication, helping you build powerful learning habits.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-4 group">
                                <div className="size-14 rounded-2xl bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center border border-orange-200 dark:border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <Flame className="size-7 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Daily Momentum</h3>
                                <p className="text-slate-200 dark:text-slate-400 text-sm leading-relaxed">Each day you log in and learn, your streak grows. Stay active to keep the flame alive.</p>
                            </div>
                            <div className="space-y-4 group">
                                <div className="size-14 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 group-hover:scale-110 transition-transform">
                                    <Award className="size-7 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Milestone Medals</h3>
                                <p className="text-slate-200 dark:text-slate-400 text-sm leading-relaxed">Reach significant milestones to unlock exclusive profile badges and special rewards.</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                size="lg"
                                onClick={() => onOpenRoleSelection(true)}
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white gap-3 px-10 h-16 rounded-2xl text-lg font-bold shadow-xl border border-white/10 group"
                            >
                                Start Your Streak
                                <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
