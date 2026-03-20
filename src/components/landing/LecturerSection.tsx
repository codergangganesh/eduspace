import { Link } from "react-router-dom";
import {
    Users,
    FileText,
    BarChart3,
    Download,
    BookOpen,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LecturerSection() {
    const lecturerFeatures = [
        {
            icon: Users,
            title: "Manage Classes",
            description: "Create and organize classes, invite students, and manage enrollments effortlessly."
        },
        {
            icon: FileText,
            title: "Create Assignments",
            description: "Design assignments with custom rubrics, deadlines, and point values. Attach resources easily."
        },
        {
            icon: BarChart3,
            title: "Grade Efficiently",
            description: "Grade submissions quickly with our streamlined interface. Provide detailed feedback to students."
        },
        {
            icon: Download,
            title: "Export Reports",
            description: "Generate comprehensive reports on class performance, attendance, and individual student progress."
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
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <section id="lecturers" className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50 relative overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, x: -50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1 relative"
                    >
                        <div className="bg-indigo-500/5 dark:from-indigo-900/10 dark:to-blue-900/10 backdrop-blur-3xl rounded-[40px] p-12 space-y-8 border border-white/10 shadow-3xl">
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-lg font-black text-white dark:text-white uppercase tracking-widest">Class Overview</span>
                                    <Users className="size-6 text-blue-400 dark:text-blue-400" />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-3xl font-black text-white dark:text-white">42</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Students</div>
                                    </div>
                                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-3xl font-black text-white dark:text-white">12</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tasks</div>
                                    </div>
                                    <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-3xl font-black text-white dark:text-white">89%</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Avg Grade</div>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-indigo-500/20">
                                        <BarChart3 className="size-6 text-indigo-400 dark:text-indigo-400" />
                                    </div>
                                    <span className="text-lg font-black text-white dark:text-white uppercase tracking-widest">Performance Trends</span>
                                </div>
                                <div className="flex items-end gap-3 h-24 px-2">
                                    {[65, 72, 68, 85, 78, 89, 92].map((height, i) => (
                                        <motion.div 
                                            key={i} 
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${height}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t-lg opacity-90 shadow-[0_0_15px_rgba(37,99,235,0.3)]" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="order-1 lg:order-2 space-y-8"
                    >
                        <motion.div 
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-widest"
                        >
                            <BookOpen className="size-4" />
                            For Lecturers
                        </motion.div>
                        <motion.h2 
                            variants={itemVariants}
                            className="text-4xl lg:text-7xl font-black text-white dark:text-white leading-tight tracking-tight"
                        >
                            Teach Smarter, Not Harder
                        </motion.h2>
                        <motion.p 
                            variants={itemVariants}
                            className="text-xl text-slate-200 dark:text-slate-400 leading-relaxed font-medium"
                        >
                            Streamline your teaching workflow with powerful tools for class management, grading, and student engagement.
                        </motion.p>
                        <div className="space-y-6">
                            {lecturerFeatures.map((feature, index) => (
                                <motion.div 
                                    key={index} 
                                    variants={itemVariants}
                                    className="flex gap-5 group"
                                >
                                    <div className="flex-shrink-0 p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 h-fit group-hover:bg-indigo-600 transition-all duration-300">
                                        <feature.icon className="size-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
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
                            <Link to="/lecturer/login">
                                <Button
                                    size="lg"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 w-full sm:w-auto px-10 h-14 font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                                >
                                    Get Started as Lecturer
                                    <ArrowRight className="size-5" />
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
