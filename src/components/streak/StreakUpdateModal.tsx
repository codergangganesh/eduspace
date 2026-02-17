import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Flame } from 'lucide-react';
import { getStreakHeat } from '@/services/streakService';

interface StreakUpdateModalProps {
    streakCount: number;
    onClose: () => void;
}

const SLOGANS = [
    "Consistency is the key to mastery!",
    "Every day is a chance to learn something new.",
    "Your future self will thank you for today's effort.",
    "Small steps every day lead to big results.",
    "Focus on progress, not perfection.",
    "The secret of getting ahead is getting started.",
    "Success begins with a single step forward.",
    "Believe in yourself and your potential.",
    "Education is the most powerful weapon.",
    "Keep pushing your boundaries every day.",
    "Stay curious, stay humble, stay consistent.",
    "Knowledge is a treasure that follows its owner.",
    "The more you learn, the more you grow.",
    "Your dedication today builds your legacy tomorrow.",
    "Excellence is not an act, but a habit.",
    "Don't stop until you're proud of your progress.",
    "Learning never exhausts the mind.",
    "Great things never come from comfort zones.",
    "Stay focused on your goals, everything else is noise.",
    "Consistency creates momentum, keep it going!",
    "Make today count in your academic journey.",
    "You are capable of achieving great things.",
    "Hard work beats talent when talent doesn't work hard.",
    "Your potential is limitless, keep exploring.",
    "Every accomplishment starts with the decision to try.",
    "Be stronger than your excuses today.",
    "The only limit to your impact is your imagination.",
    "Discipline is the bridge between goals and accomplishment.",
    "Strive for progress, not just grades.",
    "Your mind is a muscle, keep training it.",
    "Success is the sum of small efforts repeated daily.",
    "Wisdom is not a product of schooling but of life-long learning.",
    "The expert in anything was once a beginner.",
    "Dream big, work hard, stay focused.",
    "Challenge yourself to be better than yesterday.",
    "Your education is an investment in your future.",
    "The roots of education are bitter, but the fruit is sweet.",
    "Commitment is what transforms a promise into reality.",
    "Never stop questioning, never stop learning.",
    "Focus on the journey, the destination will follow.",
    "Your brain is the most powerful tool you own.",
    "The world is changed by your example, not your opinion.",
    "Growth starts at the end of your comfort zone.",
    "Believe you can and you're halfway there.",
    "An investment in knowledge pays the best interest.",
    "Don't watch the clock, do what it does. Keep going.",
    "Success is not final, failure is not fatal.",
    "The hunger for knowledge never fades.",
    "Your streak is a reflection of your discipline.",
    "Keep the fire of learning alive every single day!"
];

export const StreakUpdateModal: React.FC<StreakUpdateModalProps> = ({
    streakCount,
    onClose
}) => {
    const slogan = React.useMemo(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)], []);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    className="relative bg-white dark:bg-slate-900 w-[92%] sm:w-full max-w-[340px] sm:max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-6 sm:p-10 border border-slate-100 dark:border-slate-800"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 sm:mb-12">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div
                                initial={{ rotate: -20, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="flex items-center justify-center size-8 sm:size-10 rounded-full bg-green-500 shadow-lg shadow-green-500/30"
                            >
                                <CheckCircle2 className="size-5 sm:size-6 text-white" />
                            </motion.div>
                            <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight">
                                Goal Met!
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
                        >
                            <X className="size-5 sm:size-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="text-center py-6 flex flex-col items-center">
                        {/* Rotating Gold Coin Logo */}
                        <motion.div
                            initial={{ rotateY: 0 }}
                            animate={{ rotateY: 360 }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="relative size-16 sm:size-24 mb-4 sm:mb-6 perspective-1000"
                        >
                            <div className="size-full rounded-full bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 p-0.5 sm:p-1 shadow-[0_10px_30px_rgba(245,158,11,0.4)] border-2 border-amber-200/50 flex items-center justify-center relative overflow-hidden">
                                {/* Coin Texture/Shine */}
                                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[spin_3s_linear_infinite]" />

                                <div className="size-10 sm:size-16 rounded-xl sm:rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 z-10 p-1.5 sm:p-2">
                                    <img
                                        src="/favicon.png"
                                        alt="Eduspace Logo"
                                        className="size-full object-contain filter drop-shadow-md"
                                    />
                                </div>

                                {/* Inner Rim */}
                                <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-amber-400/30 pointer-events-none" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2 sm:space-y-4"
                        >
                            <h2 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Streak: <span
                                    className="whitespace-nowrap transition-colors duration-500"
                                    style={{ color: getStreakHeat(streakCount).color }}
                                >
                                    {streakCount} Days
                                </span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg font-semibold tracking-wide">
                                {slogan}
                            </p>
                        </motion.div>
                    </div>

                    {/* Gradient Decorative Element */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
