import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Calendar, Play, Mic, Flame, Diamond, Award } from "lucide-react";
import { InfiniteMarquee } from "@/components/common/InfiniteMarquee";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterName } from "../common/TypewriterName";
import { Button } from "@/components/ui/button";
import { getStreakHeat } from "@/services/streakService";

interface DashboardSlidingHeroProps {
    streak?: any;
}

export function DashboardSlidingHero({ streak }: DashboardSlidingHeroProps) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [[page, direction], setPage] = useState([0, 0]);
    const fullName = profile?.full_name || "Student";
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const isSwiping = useRef(false);

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = today.toLocaleDateString('en-US', options);

    const SLIDE_DURATION = 8000; // 8 seconds per slide
    const slideCount = 3;
    const currentSlide = Math.abs(page % slideCount);

    const paginate = useCallback((newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    }, [page]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isSwiping.current) {
                paginate(1);
            }
        }, SLIDE_DURATION);

        return () => clearInterval(timer);
    }, [paginate]);

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        isSwiping.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const swipeThreshold = 50; // Minimum swipe distance in pixels
        const swipeDistance = touchStartX.current - touchEndX.current;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe left - next slide
                paginate(1);
            } else {
                // Swipe right - previous slide
                paginate(-1);
            }
        }
        
        isSwiping.current = false;
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
            scale: 0.95
        })
    };

    const currentStreakCount = streak?.current_streak || 0;
    const streakHeat = getStreakHeat(currentStreakCount);

    const slides = [
        // Slide 1: Welcome message
        (
            <div key="welcome" className="relative h-full w-full p-4 sm:p-8 flex items-center">
                <div className="relative z-10 flex flex-row items-center justify-between w-full gap-3">
                    <div id="tour-welcome" className="space-y-1 sm:space-y-3 flex-1 min-w-0">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 text-violet-600 dark:text-indigo-200 opacity-80"
                        >
                            <CalendarDays className="size-3 sm:size-4 shrink-0" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-medium uppercase tracking-wider truncate">{dateString}</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate"
                        >
                            Hi, <TypewriterName name={fullName} className="text-indigo-600 dark:text-indigo-400" />!
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="hidden sm:flex flex-row items-center gap-4"
                        >
                            <p className="text-slate-500 dark:text-indigo-100/80 font-semibold text-xs sm:text-base max-w-xl">
                                You have a few assignments due this week. Stay focused and keep learning!
                            </p>
                        </motion.div>
                        <p className="text-slate-500 dark:text-indigo-300 sm:hidden text-[10px] font-bold uppercase tracking-tight opacity-70">
                            Academic Overview
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent("open-app-guide"))}
                            className="size-8 sm:size-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50 border border-indigo-200/50 dark:border-indigo-700/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/60 dark:hover:to-indigo-800/60 transition-all shadow-[3px_3px_6px_rgba(0,0,0,0.08),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] active:scale-95 group"
                            title="Start Welcome Tour"
                        >
                            <Play className="size-4 sm:size-5 fill-indigo-600 dark:fill-indigo-400 ml-0.5 group-hover:drop-shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all" />
                        </button>
                        <button
                            onClick={() => navigate("/schedule")}
                            className="size-8 sm:size-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 dark:from-slate-800/80 dark:to-slate-700/80 border border-violet-200/50 dark:border-slate-600/50 flex items-center justify-center text-violet-600 dark:text-violet-400 hover:from-violet-100 hover:to-violet-200 dark:hover:from-slate-700/90 dark:hover:to-slate-600/90 transition-all shadow-[3px_3px_6px_rgba(0,0,0,0.08),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] active:scale-95 group"
                            title="View Schedule"
                        >
                            <Calendar className="size-4 sm:size-5 group-hover:drop-shadow-[0_0_8px_rgba(124,58,237,0.3)] transition-all" />
                        </button>
                    </div>
                </div>
            </div>
        ),
        // Slide 2: AI Voice Tutor
        (
            <div key="voice-tutor" className="relative h-full w-full p-6 sm:p-8 flex items-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1),8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.05),8px_8px_16px_rgba(0,0,0,0.4)]">
                {/* Background Marquee */}
                <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-col justify-center -rotate-12 scale-150">
                    <InfiniteMarquee text="AI EDUSPACE AI" speed={20} className="text-4xl" />
                    <InfiniteMarquee text="EDUSPACE AI TUTOR" speed={30} className="text-4xl" direction="right" />
                    <InfiniteMarquee text="AI EDUSPACE AI" speed={25} className="text-4xl" />
                </div>
                
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start text-left space-y-0.5 min-w-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[9px] uppercase tracking-widest font-black mb-1 shrink-0">
                                <Mic className="size-2 text-indigo-300" />
                                AI Tutor
                            </div>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-heading text-white truncate w-full">
                                AI Voice Tutor
                            </h3>
                            <p className="text-slate-300 text-[9px] sm:text-xs md:text-sm max-w-[180px] sm:max-w-sm opacity-80 font-medium italic truncate sm:whitespace-normal">
                                Master communication with real-time feedback.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => navigate("/student/voice-tutor")}
                            className="bg-white/90 backdrop-blur-sm text-indigo-700 hover:bg-white hover:scale-105 active:scale-95 font-black shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.8)] rounded-full px-4 py-2.5 sm:px-8 sm:py-4.5 h-auto text-[10px] sm:text-sm md:text-base whitespace-nowrap transition-all border-none shrink-0"
                        >
                            Start
                        </Button>
                    </div>
            </div>
        ),
        // Slide 3: Streak System
        (
            <div key="streak" className="relative h-full w-full p-6 sm:p-8 flex items-center bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 text-white overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.15),inset_-4px_-4px_8px_rgba(255,255,255,0.2),8px_8px_16px_rgba(0,0,0,0.12),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.25),inset_-4px_-4px_8px_rgba(255,255,255,0.1),8px_8px_16px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start text-left space-y-0.5 min-w-0">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[7px] sm:text-[9px] uppercase tracking-widest font-black mb-1 shrink-0"
                            >
                                <Award className="size-2 text-amber-300" />
                                Streak
                            </motion.div>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-heading flex items-center gap-1.5 text-white truncate w-full">
                                {streakHeat.iconType === 'diamond' ? (
                                    <Diamond className="size-4 sm:size-7 md:size-8 text-amber-200 fill-amber-200 shrink-0" />
                                ) : (
                                    <Flame className="size-4 sm:size-7 md:size-8 text-amber-300 fill-amber-300 shrink-0" />
                                )}
                                {currentStreakCount} Day Streak
                            </h3>
                            <p className="text-orange-50 text-[9px] sm:text-xs md:text-sm max-w-[180px] sm:max-w-sm opacity-80 font-medium italic truncate sm:whitespace-normal">
                                "{streakHeat.label}" - Keep it up!
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => navigate("/streak")}
                            className="bg-white/90 backdrop-blur-sm text-orange-600 hover:bg-white hover:scale-105 active:scale-95 font-black shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.8)] rounded-full px-4 py-2.5 sm:px-8 sm:py-4.5 h-auto text-[10px] sm:text-sm md:text-base whitespace-nowrap transition-all flex items-center gap-1 border-none shrink-0"
                        >
                            View
                        </Button>
                    </div>
            </div>
        )
    ];

    return (
        <div 
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 min-h-[110px] sm:min-h-[140px] md:min-h-[180px] touch-pan-y transition-all duration-300"
        >
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.3 }
                    }}
                    className="absolute inset-0 h-full w-full"
                >
                    <div className="h-full w-full">
                        {slides[currentSlide]}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
