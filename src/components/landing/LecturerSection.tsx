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

    return (
        <section id="lecturers" className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="bg-gradient-to-br from-blue-100/90 to-indigo-100/90 dark:from-blue-900/30 dark:to-indigo-900/30 backdrop-blur-sm rounded-3xl p-12 space-y-6">
                            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-white dark:text-white">Class Overview</span>
                                    <Users className="size-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-white dark:text-white">42</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Students</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white dark:text-white">12</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Assignments</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white dark:text-white">89%</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Avg Grade</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <BarChart3 className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-sm font-medium text-white dark:text-white">Performance Trends</span>
                                </div>
                                <div className="flex items-end gap-2 h-24">
                                    {[65, 72, 68, 85, 78, 89, 92].map((height, i) => (
                                        <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t" style={{ height: `${height}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                            <BookOpen className="size-4" />
                            For Lecturers
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white">
                            Teach Smarter, Not Harder
                        </h2>
                        <p className="text-lg text-slate-200 dark:text-slate-400">
                            Streamline your teaching workflow with powerful tools for class management, grading, and student engagement.
                        </p>
                        <div className="space-y-4">
                            {lecturerFeatures.map((feature, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 h-fit">
                                        <feature.icon className="size-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white dark:text-white mb-1">
                                            {feature.title}
                                        </h3>
                                        <p className="text-slate-200 dark:text-slate-400 text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/lecturer/login">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full"
                            >
                                Get Started as Lecturer
                                <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
