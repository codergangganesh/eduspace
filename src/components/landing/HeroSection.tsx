import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Award,
    BarChart3,
    TrendingUp
} from "lucide-react";

interface HeroSectionProps {
    onOpenRoleSelection: (open: boolean) => void;
}

const words = ["Growth", "Success", "Future", "Results", "Potential"];

export function HeroSection({ onOpenRoleSelection }: HeroSectionProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    void onOpenRoleSelection;
    return (
        <section className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-28 pb-24 lg:pt-56 lg:pb-40 min-h-[90vh] flex flex-col justify-center relative z-10">
            <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-20 items-center">
                {/* Left Content */}
                <div className="space-y-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <div className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        Real-time Progress Tracking
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black text-white dark:text-white leading-[1.1] tracking-tight">
                            Focus on your{" "}
                            <span className="relative inline-block min-w-[200px] lg:min-w-[300px]">
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={words[index]}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400"
                                    >
                                        {words[index]}
                                    </motion.span>
                                </AnimatePresence>
                            </span>
                        </h1>
                        <p className="text-xl text-slate-200 dark:text-slate-400 leading-relaxed max-w-2xl">
                            Experience a workspace designed for achievement. Track grades, manage assignments, and visualize your learning journey with our advanced analytics platform.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/student/login">
                            <Button
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 w-full"
                            >
                                <GraduationCap className="size-5" />
                                I'm a Student
                            </Button>
                        </Link>
                        <Link to="/lecturer/login">
                            <Button
                                size="lg"
                                variant="outline"
                                className="gap-2 px-8 border-slate-300 dark:border-slate-700 w-full"
                            >
                                <BookOpen className="size-5" />
                                I'm a Lecturer
                            </Button>
                        </Link>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-6 pt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-200 dark:text-slate-400">
                            <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
                            Grade Analytics
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-200 dark:text-slate-400">
                            <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
                            Goal Setting
                        </div>
                    </div>
                </div>

                {/* Right - Dashboard Preview */}
                <div className="relative aspect-square lg:aspect-auto">
                    {/* Floating Achievement Badge */}
                    <motion.div 
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 10, scale: 1 }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                        className="absolute -top-4 -right-4 z-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
                    >
                        <Award className="size-8 text-yellow-500" />
                    </motion.div>

                    {/* Dashboard Card */}
                    <motion.div 
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 dark:border-slate-700 p-8 space-y-6 cursor-default"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                                <div className="size-3 rounded-full bg-yellow-500 animate-pulse [animation-delay:0.2s]" />
                                <div className="size-3 rounded-full bg-green-500 animate-pulse [animation-delay:0.4s]" />
                            </div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Dashboard</span>
                        </div>

                        {/* Progress Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm text-slate-300 dark:text-slate-400">Semester Progress</h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-white dark:text-white">Week 8</span>
                                        <span className="text-sm text-slate-400">of 12</span>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                    On Track
                                </div>
                            </div>
                            <div className="h-2 bg-white/10 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '67%' }}
                                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                                    className="h-full bg-blue-600 rounded-full" 
                                />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 dark:bg-blue-900/20 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="text-3xl font-bold text-white dark:text-white group-hover:text-blue-400 transition-colors">3.8</div>
                                <div className="text-xs text-slate-300 dark:text-slate-400 uppercase tracking-tight">Current GPA</div>
                            </div>
                            <div className="bg-white/5 dark:bg-purple-900/20 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="size-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-white dark:text-white group-hover:text-purple-400 transition-colors">92%</div>
                                <div className="text-xs text-slate-300 dark:text-slate-400 uppercase tracking-tight">Assignment Rate</div>
                            </div>
                        </div>

                        {/* Recent Grades */}
                        <div className="space-y-3">
                            <h4 className="text-xs text-slate-400 uppercase tracking-wider">Recent Grades</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-700/50 rounded-lg group hover:bg-white/10 transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-green-500" />
                                            <span className="text-sm font-medium text-white dark:text-white">Computer Science 101</span>
                                        </div>
                                        <span className="text-xs text-slate-300 dark:text-slate-400">Midterm Exam</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold shadow-inner">
                                        A
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-700/50 rounded-lg group hover:bg-white/10 transition-all">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2 rounded-full bg-white/50" />
                                            <span className="text-sm font-medium text-white dark:text-white">Calculus II</span>
                                        </div>
                                        <span className="text-xs text-slate-300 dark:text-slate-400">Problem Set 4</span>
                                    </div>
                                    <div className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold shadow-inner">
                                        B+
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Growth Indicator */}
                        <div className="flex items-center gap-2 text-sm pt-2 bg-green-500/5 p-2 rounded-xl">
                            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-black">+13%</span>
                            <span className="text-slate-300 dark:text-slate-400">growth this month</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
