import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface MobileSplashScreenProps {
    onComplete: () => void;
}

export function MobileSplashScreen({ onComplete }: MobileSplashScreenProps) {
    const [phase, setPhase] = useState<"logo" | "expand" | "final">("logo");
    const progressValue = phase === "logo" ? 14 : phase === "expand" ? 72 : 100;

    useEffect(() => {
        // Skip initial logo phase and go straight to expand
        const timer1 = setTimeout(() => setPhase("expand"), 100);
        const timer2 = setTimeout(() => setPhase("final"), 1500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[300] flex min-h-[100dvh] flex-col overflow-hidden bg-[#020617] font-sans px-5 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] sm:px-6 sm:pt-[calc(1.5rem+var(--safe-top))] sm:pb-[calc(1.5rem+var(--safe-bottom))]">
            {/* Expanding Circle */}
            <motion.div
                initial={{ scale: 0 }}
                animate={phase !== "logo" ? { scale: 50 } : { scale: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute z-0 h-20 w-20 rounded-full bg-[#0B0F1A]"
            />

            {/* Professional Background Animation Elements: Red, Orange, Blue Combo */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={phase === "final" ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 1 }}
                className="pointer-events-none absolute inset-0 z-0"
            >
                <motion.div
                    animate={{ opacity: [0.18, 0.28, 0.18] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]"
                />

                <motion.div
                    animate={{
                        x: [0, 18, -12, 0],
                        y: [0, -26, 22, 0],
                        scale: [1, 1.12, 0.95, 1],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-[-18%] top-[-10%] h-[38svh] w-[78vw] rounded-full bg-blue-500/30 blur-[64px] sm:left-[-10%] sm:top-[-20%] sm:h-[70%] sm:w-[90%] sm:blur-[120px]"
                />

                <motion.div
                    animate={{
                        x: [0, -16, 24, 0],
                        y: [0, 18, -28, 0],
                        scale: [1, 0.94, 1.1, 1],
                    }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-8%] left-[-24%] h-[32svh] w-[74vw] rounded-full bg-violet-500/24 blur-[68px] sm:bottom-[-10%] sm:left-[-20%] sm:h-[80%] sm:w-[80%] sm:blur-[120px]"
                />

                <motion.div
                    animate={{
                        x: [10, -16, 0, 10],
                        y: [-16, 20, 0, -16],
                        scale: [1.04, 1, 1.12, 1.04],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute right-[-20%] top-[18%] h-[34svh] w-[68vw] rounded-full bg-cyan-400/18 blur-[60px] sm:right-[-10%] sm:top-[20%] sm:h-[70%] sm:w-[70%] sm:blur-[120px]"
                />

                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:22px_22px] sm:bg-[length:24px_24px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_24%,transparent_76%,rgba(255,255,255,0.03))]" />
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-[linear-gradient(180deg,rgba(2,6,23,0.72),transparent)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-40 bg-[linear-gradient(0deg,rgba(2,6,23,0.82),transparent)]" />
            <div className="pointer-events-none absolute left-1/2 top-[32%] z-[1] h-[34svh] w-[130vw] -translate-x-1/2 rounded-full bg-white/[0.05] blur-[90px]" />

            <div className="relative z-10 flex w-full flex-1 flex-col">
                <style>{`
                    @property --logo-angle {
                        syntax: '<angle>';
                        initial-value: 0deg;
                        inherits: false;
                    }
                    @keyframes logo-edge-sweep {
                        0%   { --logo-angle: 0deg; }
                        100% { --logo-angle: 360deg; }
                    }
                    .logo-glow-ring {
                        --logo-angle: 0deg;
                        animation: logo-edge-sweep 2s linear infinite;
                        background: conic-gradient(
                            from var(--logo-angle),
                            transparent 0deg,
                            transparent 55deg,
                            #fb923c 75deg,
                            #ffffff 95deg,
                            #fb923c 115deg,
                            transparent 135deg,
                            transparent 360deg
                        );
                        border-radius: 34px;
                        padding: 3px;
                        position: relative;
                    }
                    .logo-glow-ring::after {
                        content: '';
                        position: absolute;
                        inset: -4px;
                        border-radius: 38px;
                        background: conic-gradient(
                            from var(--logo-angle),
                            transparent 0deg,
                            transparent 55deg,
                            rgba(251,146,60,0.4) 75deg,
                            rgba(255,255,255,0.6) 95deg,
                            rgba(251,146,60,0.4) 115deg,
                            transparent 135deg,
                            transparent 360deg
                        );
                        filter: blur(8px);
                        z-index: -1;
                    }
                    .logo-glow-inner {
                        border-radius: 30px;
                        overflow: hidden;
                        background: white;
                        padding: 6px;
                        width: 100%;
                        height: 100%;
                    }
                `}</style>

                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex items-start"
                >
                    <div className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-2 backdrop-blur-xl">
                        <p className="text-sm font-semibold text-white">
                            Eduspace mobile
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: "easeOut" }}
                    className="relative flex flex-1 flex-col justify-center"
                >
                    <div className="pointer-events-none absolute inset-x-5 top-[14%] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                    <div className="pointer-events-none absolute inset-x-8 bottom-[18%] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: phase === "final" ? 1 : 0.94,
                            color: "#ffffff",
                        }}
                        transition={{ duration: 0.5 }}
                        className="relative flex flex-col items-center text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.82, opacity: 0 }}
                            animate={phase === "final" ? { scale: 1.03, opacity: 1 } : { scale: 0.96, opacity: 1 }}
                            transition={{ duration: 0.7, type: "spring" }}
                            className="relative mb-6"
                            style={{ width: 96, height: 96 }}
                        >
                            <div className="absolute inset-[-18px] rounded-[38px] bg-white/10 blur-2xl" />
                            <div className="logo-glow-ring" style={{ width: 96, height: 96 }}>
                                <div className="logo-glow-inner">
                                    <img src="/favicon.png" alt="Eduspace" className="size-full object-contain rounded-[24px]" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.h1
                            className="flex max-w-full flex-wrap justify-center text-center text-[2.7rem] font-black tracking-[-0.065em] drop-shadow-2xl sm:text-6xl"
                            variants={{
                                visible: { transition: { staggerChildren: 0.1 } }
                            }}
                            initial="hidden"
                            animate={phase === "final" ? "visible" : "hidden"}
                        >
                            {"Eduspace".split("").map((letter, index) => (
                                <motion.span
                                    key={index}
                                    variants={{
                                        hidden: { scale: 0, opacity: 0, y: 50, rotate: -15 },
                                        visible: {
                                            scale: 1,
                                            opacity: 1,
                                            y: 0,
                                            rotate: 0,
                                            transition: {
                                                type: "spring",
                                                damping: 8,
                                                stiffness: 200,
                                            }
                                        }
                                    }}
                                    animate={phase === "final" ? {
                                        y: [0, -10, 0],
                                        scale: [1, 1.05, 1],
                                        transition: {
                                            duration: 3.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.15
                                        }
                                    } : {}}
                                    className="inline-block cursor-default transition-transform"
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </motion.h1>

                        <p className="mt-3 max-w-[18rem] text-sm font-medium leading-6 text-slate-300 sm:max-w-[18rem]">
                            Smart Learning Platform
                            <br />
                            Preparing your personalized experience...
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-2">
                            {[0, 1, 2].map((dot) => (
                                <motion.span
                                    key={dot}
                                    animate={{
                                        scale: [0.8, 1.25, 0.8],
                                        opacity: [0.45, 1, 0.45],
                                    }}
                                    transition={{
                                        duration: 1.4,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: dot * 0.18,
                                    }}
                                    className="h-2.5 w-2.5 rounded-full bg-sky-300"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                <AnimatePresence>
                    {phase === "final" && (
                        <motion.div
                            initial={{ opacity: 0, y: 22 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.45 }}
                            className="w-full pt-4"
                        >
                            <Button
                                onClick={onComplete}
                                className="h-15 w-full rounded-[22px] border border-white/15 bg-white/95 text-lg font-black text-sky-700 shadow-[0_16px_35px_rgba(15,23,42,0.24)] transition-all hover:bg-slate-50 active:scale-[0.98] sm:h-16 sm:text-xl"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
