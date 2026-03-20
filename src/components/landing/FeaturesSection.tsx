import {
    BookOpen,
    FileText,
    BarChart3,
    Users,
    Bell,
    Shield,
    Zap
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { motion } from "framer-motion";

export function FeaturesSection() {
    const features = [
        {
            icon: BookOpen,
            title: "Course Management",
            description: "Create, organize, and manage courses with ease. Upload materials, set schedules, and track progress all in one place."
        },
        {
            icon: FileText,
            title: "Assignment Tracking",
            description: "Seamlessly assign, submit, and grade assignments. Set deadlines, provide feedback, and monitor completion rates."
        },
        {
            icon: BarChart3,
            title: "Advanced Analytics",
            description: "Visualize performance with comprehensive analytics. Track grades, identify trends, and make data-driven decisions."
        },
        {
            icon: Users,
            title: "Class Collaboration",
            description: "Foster engagement with integrated messaging, discussions, and real-time collaboration tools."
        },
        {
            icon: Bell,
            title: "Smart Notifications",
            description: "Stay updated with instant notifications for assignments, grades, announcements, and important deadlines."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your data is protected with industry-standard encryption, secure authentication, and privacy controls."
        }
    ];

    return (
        <section id="features" className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50 relative overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
                <div className="text-center mb-16">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-widest mb-4"
                    >
                        <Zap className="size-4" />
                        Powerful Features
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-6xl font-black text-white dark:text-white mb-6 tracking-tight"
                    >
                        Everything You Need to Succeed
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-xl text-slate-200 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        A comprehensive platform designed to streamline education management and enhance learning outcomes
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div 
                            key={index} 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative h-full rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-transparent group"
                        >
                            <div className="relative h-full flex flex-col justify-start rounded-[23px] bg-slate-900/90 backdrop-blur-xl p-8 border border-white/5 shadow-2xl overflow-hidden z-20 transition-all duration-300 group-hover:border-blue-500/50">
                                <div className="p-4 rounded-2xl bg-blue-600/10 w-fit mb-6 group-hover:bg-blue-600 transition-all duration-300">
                                    <feature.icon className="size-6 text-blue-500 group-hover:text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-400 leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
