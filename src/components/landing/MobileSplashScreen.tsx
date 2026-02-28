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
                className="absolute w-20 h-20 bg-blue-600 rounded-full z-0"
            />

            {/* Professional Background Animation Elements */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={phase === "final" ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-0 pointer-events-none"
            >
                <motion.div
                    animate={{
                        x: [0, 30, -20, 0],
                        y: [0, -50, 40, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] left-[-10%] w-[80%] h-[60%] rounded-full bg-blue-400/20 blur-[100px]"
                />
                <motion.div
                    animate={{
                        x: [0, -40, 30, 0],
                        y: [0, 60, -30, 0],
                        scale: [1, 0.8, 1.1, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-400/20 blur-[100px]"
                />

                {/* Subtle Grid Dots or Pattern for depth */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:30px_30px]" />
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
                        className="size-20 rounded-[24px] overflow-hidden shadow-2xl mb-6 bg-white p-1"
                    >
                        <img src="/favicon.png" alt="Eduspace" className="size-full object-cover" />
                    </motion.div>

                    <motion.h1
                        className="text-6xl font-black tracking-tighter flex items-baseline"
                        variants={{
                            visible: { transition: { staggerChildren: 0.08 } }
                        }}
                        initial="hidden"
                        animate={phase === "final" ? "visible" : "hidden"}
                    >
                        {"Eduspace".split("").map((letter, index) => (
                            <motion.span
                                key={index}
                                variants={{
                                    hidden: { scale: 0, opacity: 0, y: 40 },
                                    visible: {
                                        scale: 1,
                                        opacity: 1,
                                        y: 0,
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
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.1
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="fixed bottom-20 left-0 right-0 px-10"
                        >
                            <Button
                                onClick={onComplete}
                                className="w-full h-16 rounded-2xl bg-white text-blue-600 hover:bg-white/90 text-xl font-bold shadow-xl active:scale-95 transition-all"
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
