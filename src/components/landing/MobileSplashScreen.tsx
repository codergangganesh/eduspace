import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface MobileSplashScreenProps {
    onComplete: () => void;
}

export function MobileSplashScreen({ onComplete }: MobileSplashScreenProps) {
    const [phase, setPhase] = useState<"logo" | "expand" | "final">("logo");

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
        <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center overflow-hidden font-sans">
            {/* Expanding Circle */}
            <motion.div
                initial={{ scale: 0 }}
                animate={phase !== "logo" ? { scale: 50 } : { scale: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute w-20 h-20 bg-[#0B0F1A] rounded-full z-0"
            />

            {/* Professional Background Animation Elements: Red, Orange, Blue Combo */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={phase === "final" ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-0 pointer-events-none"
            >
                {/* Orange Blob */}
                <motion.div
                    animate={{
                        x: [0, 40, -30, 0],
                        y: [0, -60, 50, 0],
                        scale: [1, 1.3, 0.8, 1],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-20%] left-[-10%] w-[90%] h-[70%] rounded-full bg-orange-500/20 blur-[120px]"
                />

                {/* Red Blob */}
                <motion.div
                    animate={{
                        x: [0, -50, 40, 0],
                        y: [0, 40, -60, 0],
                        scale: [1, 0.9, 1.2, 1],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] left-[-20%] w-[80%] h-[80%] rounded-full bg-red-600/20 blur-[120px]"
                />

                {/* Blue Blob */}
                <motion.div
                    animate={{
                        x: [20, -30, 0, 20],
                        y: [-30, 40, 0, -30],
                        scale: [1.1, 1, 1.2, 1.1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]"
                />

                {/* Subtle Grid Dots or Pattern for depth */}
                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:24px_24px]" />
            </motion.div>

            <div className="relative z-10 flex flex-col items-center">
                {/* App Logo & Name */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: phase === "final" ? 1 : 0,
                        color: "#ffffff",
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={phase === "final" ? { scale: 1.1, opacity: 1 } : {}}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="size-24 rounded-[28px] overflow-hidden shadow-2xl mb-8 bg-white p-1.5"
                    >
                        <img src="/favicon.png" alt="Eduspace" className="size-full object-cover" />
                    </motion.div>

                    <motion.h1
                        className="text-7xl font-black tracking-tighter flex items-baseline drop-shadow-2xl"
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
                                    y: [0, -15, 0],
                                    scale: [1, 1.08, 1],
                                    transition: {
                                        duration: 3.5,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.15
                                    }
                                } : {}}
                                className="inline-block hover:scale-125 transition-transform cursor-default"
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </motion.h1>
                </motion.div>

                {/* Continue Button */}
                <AnimatePresence>
                    {phase === "final" && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="fixed bottom-16 left-0 right-0 px-8"
                        >
                            <Button
                                onClick={onComplete}
                                className="w-full h-18 rounded-[24px] bg-white text-orange-600 hover:bg-slate-50 text-2xl font-black shadow-2xl shadow-black/20 active:scale-95 transition-all"
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
