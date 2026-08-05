import { motion } from "framer-motion";
import { GlobalStudentGlobe } from "@/components/common/GlobalStudentGlobe";
import { Globe as GlobeIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GlobalActivitySection() {
    return (
        <section id="global-network" className="py-20 lg:py-28 relative overflow-hidden">
            {/* Background Glow Orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none -z-10 rounded-full" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Section Title & Header */}
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2"
                    >
                        <Badge variant="outline" className="px-3 py-1 border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-md">
                            <GlobeIcon className="size-3.5 mr-1.5 animate-spin-slow text-blue-400" />
                            Live Global Network
                        </Badge>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight"
                    >
                        Connected Learning <br />
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                            Empowering Students Worldwide
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto"
                    >
                        Explore real-time study sessions, active clans, voice practice rooms, and live quiz battles happening right now around the globe.
                    </motion.p>
                </div>

                {/* 3D Interactive Cobe Globe Component */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <GlobalStudentGlobe showStatsHeader={true} />
                </motion.div>
            </div>
        </section>
    );
}
