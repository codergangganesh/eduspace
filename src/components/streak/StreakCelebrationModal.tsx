import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Star, Medal, Award, Zap, Crown, Shield, Sword, Gem, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BadgeType, BADGE_DETAILS } from '@/services/streakService';

const IconMap: Record<string, React.ElementType> = {
    Trophy,
    Medal,
    Award,
    Zap,
    Crown,
    Sparkles,
    Shield,
    Sword,
    Gem,
    Infinity: InfinityIcon
};

interface StreakCelebrationModalProps {
    badgeType: BadgeType;
    streakCount: number;
    onClose: () => void;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
    badgeType,
    streakCount,
    onClose
}) => {
    const details = BADGE_DETAILS[badgeType];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {/* Backdrop Blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-primary/20 p-8 sm:p-12 text-center overflow-hidden"
                >
                    {/* Decorative Sparks */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-20 -left-20 opacity-5"
                        >
                            <Sparkles className="size-64 text-primary" />
                        </motion.div>
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-20 -right-20 opacity-5"
                        >
                            <Star className="size-64 text-primary" />
                        </motion.div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X className="size-5" />
                    </button>

                    <div className="relative z-10 space-y-8">
                        <motion.div
                            initial={{ rotate: -10, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="flex justify-center"
                        >
                            <div className="relative">
                                <div
                                    className="size-32 sm:size-40 rounded-full flex items-center justify-center shadow-inner"
                                    style={{ backgroundColor: `${details.color}20`, border: `4px solid ${details.color}` }}
                                >
                                    {(() => {
                                        const IconComponent = IconMap[details.icon] || Trophy;
                                        return <IconComponent className="size-16 sm:size-20" style={{ color: details.color }} />;
                                    })()}
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-full border-4 border-white dark:border-slate-900"
                                >
                                    {streakCount} DAYS
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Congratulations!
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mt-2">
                                    You've unlocked the <span className="text-primary font-black px-2 py-0.5 rounded-lg bg-primary/5">{details.name} Badge</span>!
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-sm uppercase tracking-widest"
                            >
                                <Sparkles className="size-4 text-amber-500" />
                                {details.description}
                                <Sparkles className="size-4 text-amber-500" />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="pt-4"
                        >
                            <Button
                                onClick={onClose}
                                size="lg"
                                className="w-full h-14 sm:h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                Awesome! Continue
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
