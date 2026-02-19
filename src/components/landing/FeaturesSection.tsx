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
        <section id="features" className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                        <Zap className="size-4" />
                        Powerful Features
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white mb-4">
                        Everything You Need to Succeed
                    </h2>
                    <p className="text-lg text-slate-200 dark:text-slate-400 max-w-2xl mx-auto">
                        A comprehensive platform designed to streamline education management and enhance learning outcomes
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="relative h-full rounded-2xl p-0.5">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative h-full flex flex-col justify-start rounded-[14px] bg-white/10 dark:bg-slate-900/80 backdrop-blur-md p-6 border border-white/10 dark:border-slate-800 shadow-sm overflow-hidden z-20">
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 w-fit mb-4">
                                    <feature.icon className="size-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
