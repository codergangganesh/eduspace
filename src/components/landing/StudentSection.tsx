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

    return (
        <section id="students" className="py-24 lg:py-40">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium">
                            <GraduationCap className="size-4" />
                            For Students
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white">
                            Your Academic Success, Simplified
                        </h2>
                        <p className="text-lg text-slate-200 dark:text-slate-400">
                            Stay organized, track your progress, and achieve your academic goals with tools designed specifically for students.
                        </p>
                        <div className="space-y-4">
                            {studentFeatures.map((feature, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 h-fit">
                                        <feature.icon className="size-5 text-purple-600 dark:text-purple-400" />
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
                        <Link to="/student/login">
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-white gap-2 w-full"
                            >
                                Get Started as Student
                                <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="bg-gradient-to-br from-purple-100/90 to-blue-100/90 dark:from-purple-900/30 dark:to-blue-900/30 backdrop-blur-sm rounded-3xl p-12 space-y-6">
                            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <Star className="size-6 text-yellow-500" />
                                    <div>
                                        <div className="font-bold text-white dark:text-white">4.2 GPA</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Current Semester</div>
                                    </div>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                                    <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" style={{ width: '84%' }} />
                                </div>
                            </div>
                            <div className="bg-white/10 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-white dark:text-white">Upcoming Deadlines</span>
                                    <Clock className="size-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-200 dark:text-slate-400">Physics Lab Report</span>
                                        <span className="text-orange-600 dark:text-orange-400 font-medium">2 days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-200 dark:text-slate-400">Math Assignment</span>
                                        <span className="text-green-600 dark:text-green-400 font-medium">5 days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
