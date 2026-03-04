import { useEffect, useRef, useState } from "react";
import { useInView, animate, motion } from "framer-motion";

function Counter({ start = false, from = 0, to, duration = 2.5, suffix = "" }: { start?: boolean; from?: number; to: number; duration?: number; suffix?: string }) {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (start && nodeRef.current) {
            const controls = animate(from, to, {
                duration: duration,
                ease: "easeOut",
                onUpdate(value) {
                    if (nodeRef.current) {
                        nodeRef.current.textContent = Math.round(value).toLocaleString() + suffix;
                    }
                },
            });
            return () => controls.stop();
        }
    }, [start, from, to, duration, suffix]);

    return <span ref={nodeRef}>{from}{suffix}</span>;
}

export function TrustedBySection() {
    const [startCount, setStartCount] = useState(false);

    return (
        <section className="py-16 md:py-24 bg-transparent dark:bg-slate-900/60 relative z-10 w-full overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="text-center mb-12">
                    <h2 className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Trusted By Thousands of Students & Educators
                    </h2>
                </div>

                <motion.div
                    onViewportEnter={() => setStartCount(true)}
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 text-center divide-x-0 lg:divide-x divide-slate-200 dark:divide-white/5"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="space-y-3"
                    >
                        <div className="text-4xl md:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 drop-shadow-sm">
                            <Counter start={startCount} to={5000} suffix="+" />
                        </div>
                        <div className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400">Active Students</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-3"
                    >
                        <div className="text-4xl md:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 dark:from-indigo-500 dark:to-purple-500 drop-shadow-sm">
                            <Counter start={startCount} to={250} suffix="+" />
                        </div>
                        <div className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400">Expert Lecturers</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="space-y-3"
                    >
                        <div className="text-4xl md:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 drop-shadow-sm">
                            <Counter start={startCount} to={1200} suffix="+" />
                        </div>
                        <div className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400">Live Classes</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="space-y-3"
                    >
                        <div className="text-4xl md:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400 dark:from-pink-500 dark:to-rose-500 drop-shadow-sm">
                            <Counter start={startCount} to={98} suffix="%" />
                        </div>
                        <div className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400">Satisfaction Rate</div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
