import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GlobePulse } from "@/components/ui/cobe-globe-pulse";

interface CTASectionProps {
    onOpenRoleSelection: (open: boolean) => void;
    onOpenHelp: (open: boolean) => void;
}

export function CTASection({ onOpenRoleSelection, onOpenHelp }: CTASectionProps) {
    return (
        <section className="py-20 lg:py-32">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                <div className="bg-transparent dark:bg-slate-900/50 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-blue-500/10 blur-[100px] -z-10 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[450px] aspect-square -z-10 opacity-30 select-none pointer-events-none">
                        <GlobePulse />
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white dark:text-white">
                        Ready to Transform Your Educational Experience?
                    </h2>
                    <p className="text-xl text-slate-200 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of students and lecturers already using Eduspace to achieve their goals
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        <Button
                            size="lg"
                            onClick={() => onOpenRoleSelection(true)}
                            className="relative bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all gap-2 px-8 shadow-xl shadow-blue-500/20 forced-colors:bg-blue-600 overflow-hidden"
                        >
                            <div
                                className="absolute -inset-px pointer-events-none rounded-[inherit] border-2 border-transparent border-inset [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
                            >
                                <motion.div
                                    className="absolute aspect-square bg-gradient-to-r from-transparent via-white to-blue-200"
                                    animate={{
                                        offsetDistance: ["0%", "100%"],
                                    }}
                                    style={{
                                        width: 30,
                                        offsetPath: "rect(0 auto auto 0 round 8px)",
                                    }}
                                    transition={{
                                        repeat: Number.POSITIVE_INFINITY,
                                        duration: 4,
                                        ease: "linear",
                                    }}
                                />
                            </div>
                            <span className="relative z-10 flex items-center gap-2">
                                Get Started Free
                                <ArrowRight className="size-5" />
                            </span>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => onOpenHelp(true)}
                            className="relative bg-transparent border-white/30 text-white hover:bg-white hover:text-blue-600 hover:scale-105 active:scale-95 transition-all px-8 shadow-lg overflow-hidden"
                        >
                            <div
                                className="absolute -inset-px pointer-events-none rounded-[inherit] border-2 border-transparent border-inset [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
                            >
                                <motion.div
                                    className="absolute aspect-square bg-gradient-to-r from-transparent via-blue-500 to-indigo-400"
                                    animate={{
                                        offsetDistance: ["0%", "100%"],
                                    }}
                                    style={{
                                        width: 30,
                                        offsetPath: "rect(0 auto auto 0 round 8px)",
                                    }}
                                    transition={{
                                        repeat: Number.POSITIVE_INFINITY,
                                        duration: 4,
                                        ease: "linear",
                                    }}
                                />
                            </div>
                            <span className="relative z-10">Learn More</span>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
