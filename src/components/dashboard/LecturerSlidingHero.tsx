import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Play, ClipboardList, Sparkles, BarChart2, ChevronRight, ChevronLeft, GraduationCap, Brain } from "lucide-react";
import { InfiniteMarquee } from "@/components/common/InfiniteMarquee";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterName } from "../common/TypewriterName";
import { Button } from "@/components/ui/button";

interface LecturerSlidingHeroProps {
    title?: string;
}

export function LecturerSlidingHero({ title: propTitle }: LecturerSlidingHeroProps) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [[page, direction], setPage] = useState([0, 0]);
    const title = propTitle || profile?.full_name || "Professor";

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = today.toLocaleDateString('en-US', options);

    const SLIDE_DURATION = 8000;
    const slideCount = 4;
    const currentSlide = Math.abs(page % slideCount);

    const paginate = useCallback((newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    }, [page]);

    useEffect(() => {
        const timer = setInterval(() => {
            paginate(1);
        }, SLIDE_DURATION);

        return () => clearInterval(timer);
    }, [paginate]);

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

    const slides = [
        // Slide 1: Welcome message
        (
            <div key="welcome" className="relative h-full w-full p-4 sm:p-8 flex items-center">
                <div className="relative z-10 flex flex-row items-center justify-between w-full gap-3">
                    <div id="tour-welcome" className="space-y-1 sm:space-y-3 flex-1 min-w-0 text-left">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 opacity-80"
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
                            Hi, <TypewriterName name={title} className="text-emerald-600 dark:text-emerald-400" />!
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="hidden sm:flex flex-row items-center gap-4"
                        >
                            <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-base max-w-xl">
                                Check your daily updates and student performance overview.
                            </p>
                        </motion.div>
                        <p className="text-emerald-600 dark:text-emerald-300 sm:hidden text-[10px] font-bold uppercase tracking-tight opacity-70">
                            Lecturer Overview
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button 
                            variant="outline"
                            onClick={() => navigate("/all-students")}
                            className="size-8 sm:size-auto sm:rounded-lg border-slate-200 dark:border-slate-700 flex items-center justify-center sm:gap-2 p-0 sm:px-3 sm:py-2 h-auto"
                            title="Student Directory"
                        >
                            <GraduationCap className="size-4 sm:size-4" />
                            <span className="hidden sm:inline text-xs font-bold">Directory</span>
                        </Button>
                    </div>
                </div>
            </div>
        ),
        // Slide 2: AI Quiz Generation
        (
            <div key="ai-quiz" className="relative h-full w-full p-6 sm:p-8 flex items-center bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-col justify-center -rotate-12 scale-150">
                    <InfiniteMarquee text="AI EDUSPACE AI" speed={25} className="text-4xl" />
                    <InfiniteMarquee text="AI QUIZ GENERATOR" speed={35} className="text-4xl" direction="right" />
                    <InfiniteMarquee text="AI EDUSPACE AI" speed={30} className="text-4xl" />
                </div>
                
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start text-left space-y-0.5 min-w-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[9px] uppercase tracking-widest font-black mb-1 shrink-0">
                                <Sparkles className="size-2 text-emerald-300" />
                                AI Quiz
                            </div>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-heading flex items-center gap-1.5 text-white truncate w-full">
                                <Brain className="size-4 sm:size-7 md:size-8 text-emerald-200 shrink-0" />
                                AI Generator
                            </h3>
                            <p className="text-emerald-50 text-[9px] sm:text-xs md:text-sm max-w-[180px] sm:max-w-sm opacity-80 font-medium italic truncate sm:whitespace-normal">
                                Create comprehensive assessments in seconds.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => navigate("/lecturer/create-ai-quiz")}
                            className="bg-white text-emerald-800 hover:bg-white hover:scale-105 active:scale-95 font-black shadow-lg rounded-full px-4 py-2.5 sm:px-8 sm:py-4.5 h-auto text-[10px] sm:text-sm md:text-base whitespace-nowrap transition-all border-none shrink-0"
                        >
                            Try
                        </Button>
                    </div>
            </div>
        ),
        // Slide 3: Attendance Tracker
        (
            <div key="attendance" className="relative h-full w-full p-6 sm:p-8 flex items-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-900 text-white overflow-hidden">
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start text-left space-y-0.5 min-w-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[9px] uppercase tracking-widest font-black mb-1 shrink-0">
                                <ClipboardList className="size-2 text-indigo-300" />
                                Attendance
                            </div>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-heading text-white truncate w-full">
                                Attendance Tracker
                            </h3>
                            <p className="text-slate-300 text-[9px] sm:text-xs md:text-sm max-w-[180px] sm:max-w-sm opacity-80 font-medium truncate sm:whitespace-normal">
                                Manage your class easily.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => navigate("/lecturer/attendance")}
                            className="bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 font-black shadow-lg rounded-full px-4 py-2.5 sm:px-8 sm:py-4.5 h-auto text-[10px] sm:text-sm md:text-base whitespace-nowrap transition-all border border-indigo-500/30 shrink-0"
                        >
                            Track
                        </Button>
                    </div>
            </div>
        ),
        // Slide 4: Student Analytics
        (
            <div key="analytics" className="relative h-full w-full p-6 sm:p-8 flex items-center bg-gradient-to-br from-slate-800 to-slate-950 text-white overflow-hidden">
                    <div className="flex flex-row items-center justify-between w-full gap-3">
                        <div className="flex flex-col items-start text-left space-y-0.5 min-w-0">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[7px] sm:text-[9px] uppercase tracking-widest font-black mb-1 shrink-0">
                                <BarChart2 className="size-2 text-blue-400" />
                                Analytics
                            </div>
                            <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-heading text-white truncate w-full">
                                Student Analytics
                            </h3>
                            <p className="text-slate-400 text-[9px] sm:text-xs md:text-sm max-w-[180px] sm:max-w-sm opacity-80 hidden sm:block">
                                Identify performance trends.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => document.getElementById('performance-chart')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95 font-black shadow-lg rounded-full px-4 py-2.5 sm:px-8 sm:py-4.5 h-auto text-[10px] sm:text-sm md:text-base whitespace-nowrap transition-all border border-white/20 shrink-0"
                        >
                            View
                        </Button>
                    </div>
            </div>
        )
    ];

    return (
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 min-h-[110px] sm:min-h-[140px] md:min-h-[180px]">
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
