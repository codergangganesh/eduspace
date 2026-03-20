import { Link } from "react-router-dom";
import {
    GraduationCap,
    Target,
    Calendar,
    Flame,
    Upload,
    MessageSquare,
    ArrowRight,
    Star,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function StudentSection() {
    const studentFeatures = [
        {
            icon: Target,
            title: "Track Your Progress",
            description: "Monitor your GPA, assignment completion rates, and semester progress in real-time."
        },
        {
            icon: Calendar,
            title: "Never Miss a Deadline",
            description: "Get reminders for upcoming assignments and exams. Stay organized with our calendar integration."
        },
        {
            icon: Flame,
            title: "Maintain Your Streak",
            description: "Stay motivated with daily learning streaks. Earn badges and track your consistency."
        },
        {
            icon: Upload,
            title: "Easy Submissions",
            description: "Submit assignments with drag-and-drop simplicity. Support for multiple file formats."
        },
        {
            icon: MessageSquare,
            title: "Connect with Lecturers",
            description: "Ask questions, get feedback, and collaborate directly with your instructors."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <section id="students" className="py-24 lg:py-40 relative">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <motion.div 
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-widest"
                        >
                            <GraduationCap className="size-4" />
                            For Students
                        </motion.div>
                        <motion.h2 
                            variants={itemVariants}
                            className="text-4xl lg:text-7xl font-black text-white dark:text-white leading-tight tracking-tight"
                        >
                            Your Academic Success, Simplified
                        </motion.h2>
                        <motion.p 
                            variants={itemVariants}
                            className="text-xl text-slate-200 dark:text-slate-400 leading-relaxed font-medium"
                        >
                            Stay organized, track your progress, and achieve your academic goals with tools designed specifically for students.
                        </motion.p>
                        <div className="space-y-6">
                            {studentFeatures.map((feature, index) => (
                                <motion.div 
                                    key={index} 
                                    variants={itemVariants}
                                    className="flex gap-5 group"
                                >
                                    <div className="flex-shrink-0 p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30 h-fit group-hover:bg-blue-600 transition-all duration-300">
                                        <feature.icon className="size-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white dark:text-white mb-1 tracking-tight">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-200 dark:text-slate-400 leading-relaxed font-medium">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.div variants={itemVariants} className="pt-4">
                            <Link to="/student/login">
                                <Button
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto px-10 h-14 font-black uppercase tracking-widest shadow-xl shadow-blue-600/20"
                                >
                                    Get Started as Student
                                    <ArrowRight className="size-5" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, x: 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="bg-blue-500/5 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-3xl rounded-[40px] p-12 space-y-8 border border-white/10 shadow-3xl">
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-yellow-500/20">
                                        <Star className="size-8 text-yellow-500" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-white dark:text-white">4.2 GPA</div>
                                        <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Current Semester</div>
                                    </div>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '84%' }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                                    />
                                </div>
                            </motion.div>
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-lg font-black text-white dark:text-white uppercase tracking-widest">Upcoming Tasks</span>
                                    <Clock className="size-6 text-blue-400 dark:text-blue-400 animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                        <span className="text-white font-bold">Physics Lab Report</span>
                                        <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-tighter">In 2 days</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                        <span className="text-white font-bold">Math Assignment</span>
                                        <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-black uppercase tracking-tighter">In 5 days</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
