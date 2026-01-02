import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    CheckCircle2,
    TrendingUp,
    Award,
    BookOpen,
    BarChart3,
    FileText,
    Users,
    MessageSquare,
    Clock,
    Shield,
    Zap,
    Target,
    Bell,
    Calendar,
    Upload,
    Download,
    Star,
    ArrowRight,
    Mail,
    Phone,
    MapPin,
    Github,
    Twitter,
    Linkedin,
    HelpCircle,
    ChevronDown,
    Code,
    Database,
    Cloud,
    Smartphone,
    X,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

import AnoAI from "@/components/ui/animated-shader-background";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function LandingPage() {
    const navigate = useNavigate();
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);



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
        <div className="min-h-screen bg-transparent dark:bg-slate-950 font-sans text-white dark:text-foreground relative overflow-x-hidden selection:bg-blue-500/30">
            <AnoAI />

            <div className="relative z-10 backdrop-blur-[2px]">
                {/* Modals */}
                <RoleSelectionDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
                <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
                <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
                <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
                <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

                {/* Navigation */}
                <nav className="border-b border-white/10 dark:border-slate-800/50 bg-white/10 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-[100] transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-blue-600">
                                    <GraduationCap className="size-5 text-white" />
                                </div>
                                <span className="text-lg font-semibold text-white dark:text-white">
                                    EduSpace
                                </span>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex items-center gap-6">
                                <a href="#features" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors">
                                    Features
                                </a>
                                <a href="#students" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors">
                                    For Students
                                </a>
                                <a href="#lecturers" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors">
                                    For Lecturers
                                </a>
                                <button
                                    onClick={() => setShowContact(true)}
                                    className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors"
                                >
                                    Support
                                </button>
                                <ThemeToggle />
                                <Button
                                    onClick={() => setShowRoleDialog(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Sign In
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <div className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                Real-time Progress Tracking
                            </div>

                            {/* Heading */}
                            <div className="space-y-4">
                                <h1 className="text-5xl lg:text-6xl font-black text-white dark:text-white leading-tight">
                                    Focus on your{" "}
                                    <span className="text-blue-600 dark:text-blue-400">Growth</span>{" "}
                                    & Success
                                </h1>
                                <p className="text-lg text-slate-200 dark:text-slate-400 leading-relaxed max-w-xl">
                                    Experience a workspace designed for achievement. Track grades, manage assignments, and visualize your learning journey with our advanced analytics platform.
                                </p>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => navigate('/student/login')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8"
                                >
                                    <GraduationCap className="size-5" />
                                    I'm a Student
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => navigate('/lecturer/login')}
                                    className="gap-2 px-8 border-slate-300 dark:border-slate-700"
                                >
                                    <BookOpen className="size-5" />
                                    I'm a Lecturer
                                </Button>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-6 pt-4">
                                <div className="flex items-center gap-2 text-sm text-slate-200 dark:text-slate-400">
                                    <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
                                    Grade Analytics
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-200 dark:text-slate-400">
                                    <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />
                                    Goal Setting
                                </div>
                            </div>
                        </div>

                        {/* Right - Dashboard Preview */}
                        <div className="relative">
                            {/* Floating Achievement Badge */}
                            <div className="absolute -top-4 -right-4 z-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                                <Award className="size-8 text-yellow-500" />
                            </div>

                            {/* Dashboard Card */}
                            <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 dark:border-slate-700 p-8 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <div className="size-3 rounded-full bg-red-500" />
                                        <div className="size-3 rounded-full bg-yellow-500" />
                                        <div className="size-3 rounded-full bg-green-500" />
                                    </div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wider">Dashboard</span>
                                </div>

                                {/* Progress Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm text-slate-300 dark:text-slate-400">Semester Progress</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-white dark:text-white">Week 8</span>
                                                <span className="text-sm text-slate-400">of 12</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                            On Track
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/10 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: '67%' }} />
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 dark:bg-blue-900/20 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-3xl font-bold text-white dark:text-white">3.8</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Current GPA</div>
                                    </div>
                                    <div className="bg-white/5 dark:bg-purple-900/20 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="size-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="text-3xl font-bold text-white dark:text-white">92%</div>
                                        <div className="text-xs text-slate-300 dark:text-slate-400">Assignment Rate</div>
                                    </div>
                                </div>

                                {/* Recent Grades */}
                                <div className="space-y-3">
                                    <h4 className="text-xs text-slate-400 uppercase tracking-wider">Recent Grades</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-700/50 rounded-lg">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-green-500" />
                                                    <span className="text-sm font-medium text-white dark:text-white">Computer Science 101</span>
                                                </div>
                                                <span className="text-xs text-slate-300 dark:text-slate-400">Midterm Exam</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                                                A
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-700/50 rounded-lg">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-white/50" />
                                                    <span className="text-sm font-medium text-white dark:text-white">Calculus II</span>
                                                </div>
                                                <span className="text-xs text-slate-300 dark:text-slate-400">Problem Set 4</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">
                                                B+
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Growth Indicator */}
                                <div className="flex items-center gap-2 text-sm">
                                    <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                                    <span className="text-green-600 dark:text-green-400 font-semibold">+13%</span>
                                    <span className="text-slate-300 dark:text-slate-400">improvement this semester</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 lg:py-32 bg-transparent dark:bg-slate-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
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

                {/* For Students Section */}
                <section id="students" className="py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
                                <Button
                                    onClick={() => navigate('/student/login')}
                                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                                >
                                    Get Started as Student
                                    <ArrowRight className="size-4" />
                                </Button>
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

                {/* For Lecturers Section */}
                <section id="lecturers" className="py-20 lg:py-32 bg-transparent dark:bg-slate-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
                                <Button
                                    onClick={() => navigate('/lecturer/login')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                >
                                    Get Started as Lecturer
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                                Trusted by Thousands
                            </h2>
                            <p className="text-xl text-blue-100">
                                Join a growing community of learners and educators
                            </p>
                        </div>
                        <div className="grid md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-5xl lg:text-6xl font-black mb-2">10K+</div>
                                <div className="text-blue-100">Active Users</div>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl lg:text-6xl font-black mb-2">500+</div>
                                <div className="text-blue-100">Courses Created</div>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl lg:text-6xl font-black mb-2">50K+</div>
                                <div className="text-blue-100">Assignments Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-5xl lg:text-6xl font-black mb-2">98%</div>
                                <div className="text-blue-100">Satisfaction Rate</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
                                <Zap className="size-4" />
                                Simple Process
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white mb-4">
                                Get Started in Minutes
                            </h2>
                            <p className="text-lg text-slate-200 dark:text-slate-400 max-w-2xl mx-auto">
                                Three simple steps to transform your educational experience
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Step 1 */}
                            <div className="relative">
                                <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-2xl font-bold mb-6">
                                        1
                                    </div>
                                    <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                                        Create Your Account
                                    </h3>
                                    <p className="text-slate-200 dark:text-slate-400">
                                        Sign up as a student or lecturer in seconds. Choose your role and get started immediately.
                                    </p>
                                </div>
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                            </div>

                            {/* Step 2 */}
                            <div className="relative">
                                <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl font-bold mb-6">
                                        2
                                    </div>
                                    <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                                        Set Up Your Workspace
                                    </h3>
                                    <p className="text-slate-200 dark:text-slate-400">
                                        Join classes, create courses, and customize your dashboard to fit your needs.
                                    </p>
                                </div>
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-green-600" />
                            </div>

                            {/* Step 3 */}
                            <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                                <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-2xl font-bold mb-6">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                                    Start Achieving
                                </h3>
                                <p className="text-slate-200 dark:text-slate-400">
                                    Track progress, submit assignments, and watch your academic success grow.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20 lg:py-32 bg-transparent dark:bg-slate-900/50 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-4">
                                <Star className="size-4" />
                                Testimonials
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white mb-4">
                                What Our Users Say
                            </h2>
                            <p className="text-lg text-slate-200 dark:text-slate-400 max-w-2xl mx-auto">
                                Real experiences from students and lecturers using EduSpace
                            </p>
                        </div>

                        {/* Horizontal Scrolling Container */}
                        <div className="relative w-full overflow-hidden mask-gradient-x">
                            {/* Gradient Masks */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent z-10" />
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent z-10" />

                            <div className="flex w-max gap-6 animate-scroll hover:[animation-play-state:paused]">
                                {[...Array(2)].map((_, setIndex) => (
                                    <div key={setIndex} className="flex gap-6">
                                        {[
                                            { name: "Sarah Kumar", role: "Computer Science Student", initials: "SK", gradient: "from-blue-600 to-purple-600", quote: "This platform has completely transformed how I manage my coursework. The analytics feature helps me identify areas where I need to improve." },
                                            { name: "Dr. Robert Chen", role: "Mathematics Professor", initials: "DR", gradient: "from-green-600 to-blue-600", quote: "As a lecturer, this tool saves me hours every week. Grading and feedback are now streamlined, and I can focus more on teaching." },
                                            { name: "Maria Patel", role: "Engineering Student", initials: "MP", gradient: "from-purple-600 to-pink-600", quote: "The real-time notifications ensure I never miss a deadline. My GPA has improved significantly since I started using this platform!" },
                                            { name: "James Lee", role: "Business Student", initials: "JL", gradient: "from-orange-600 to-red-600", quote: "The assignment submission process is so smooth. I love how I can track all my submissions and grades in one place." },
                                            { name: "Prof. Emily Wilson", role: "History Department", initials: "EW", gradient: "from-teal-600 to-cyan-600", quote: "Creating and managing multiple classes has never been easier. The interface is intuitive and my students love it too!" },
                                            { name: "Alex Nguyen", role: "Design Student", initials: "AN", gradient: "from-indigo-600 to-blue-600", quote: "The collaboration features are fantastic. I can easily communicate with my classmates and work on group projects seamlessly." },
                                            { name: "Dr. Lisa Thompson", role: "Chemistry Professor", initials: "LT", gradient: "from-pink-600 to-rose-600", quote: "The grade export feature is a lifesaver at the end of each semester. Everything is organized and ready to submit to administration." },
                                            { name: "Rachel Kim", role: "Biology Student", initials: "RK", gradient: "from-amber-600 to-yellow-600", quote: "I appreciate how the platform keeps me organized. The calendar integration and deadline reminders are incredibly helpful." },
                                            { name: "Prof. Michael Singh", role: "Physics Department", initials: "MS", gradient: "from-violet-600 to-purple-600", quote: "The analytics dashboard gives me valuable insights into my students' performance. I can identify struggling students early and provide support." },
                                            { name: "David Martinez", role: "Economics Student", initials: "DM", gradient: "from-emerald-600 to-green-600", quote: "Best academic platform I've used! The mobile app works perfectly, so I can check my grades and assignments on the go." }
                                        ].map((testimonial, index) => (
                                            <div key={index} className="flex-shrink-0 w-[350px] bg-white/10 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 dark:border-slate-700 snap-start shadow-sm hover:shadow-md transition-all">
                                                <div className="flex gap-1 mb-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className="size-4 fill-yellow-500 text-yellow-500" />
                                                    ))}
                                                </div>
                                                <p className="text-slate-200 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                                                    "{testimonial.quote}"
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                        {testimonial.initials}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white dark:text-white text-sm">{testimonial.name}</div>
                                                        <div className="text-xs text-slate-300 dark:text-slate-400">{testimonial.role}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-24 lg:py-32 bg-transparent dark:bg-slate-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                            {/* Left - Visual (Matched to Hero Style) */}
                            <div className="w-full lg:w-1/2 relative order-last lg:order-first">
                                <div className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 dark:border-slate-700 p-8">
                                    {/* Stats Header */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-white dark:text-white">Platform Growth</h3>
                                            <p className="text-sm text-slate-300 dark:text-slate-400">Weekly Activity</p>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
                                            <TrendingUp className="size-4" />
                                            +24.5%
                                        </div>
                                    </div>

                                    {/* Custom Graph Visualization */}
                                    <div className="h-48 mb-8 relative w-full group overflow-hidden">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-full h-px bg-slate-100 dark:bg-slate-700/50" />
                                            ))}
                                        </div>

                                        {/* SVG Graph */}
                                        <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 400 200" preserveAspectRatio="none">
                                            <defs>
                                                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            {/* Area Fill */}
                                            <path
                                                d="M0,160 C50,140 80,160 120,100 C160,40 200,80 240,60 C280,40 320,100 400,20 V200 H0 Z"
                                                fill="url(#curveGradient)"
                                                className="transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                            />

                                            {/* Main Line with Glow */}
                                            <path
                                                d="M0,160 C50,140 80,160 120,100 C160,40 200,80 240,60 C280,40 320,100 400,20"
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                className="dark:stroke-blue-400 transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                                filter="url(#glow)"
                                            />

                                            {/* Animated Data Points */}
                                            {[
                                                { cx: 120, cy: 100 },
                                                { cx: 240, cy: 60 },
                                                { cx: 400, cy: 20 }
                                            ].map((point, i) => (
                                                <circle
                                                    key={i}
                                                    cx={point.cx}
                                                    cy={point.cy}
                                                    r="4"
                                                    className="fill-white stroke-blue-600 dark:stroke-blue-400 stroke-2 transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                                />
                                            ))}
                                        </svg>

                                        {/* Hover Indicator Line (Visual Polish) */}
                                        <div className="absolute top-0 bottom-0 w-px bg-blue-500/20 left-[60%] hidden group-hover:block backdrop-blur-sm" />
                                    </div>

                                    {/* Floating Stat Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <Users className="size-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-200 dark:text-slate-400">Users</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white dark:text-white">50k+</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <Shield className="size-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-200 dark:text-slate-400">Security</span>
                                            </div>
                                            <div className="text-2xl font-bold text-white dark:text-white">100%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Blur */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-sm max-h-sm bg-blue-500/20 rounded-full blur-3xl -z-10" />
                            </div>

                            {/* Right - Content */}
                            <div className="w-full lg:w-1/2">
                                <div className="mb-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                                        <Award className="size-4" />
                                        Why EduSpace
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-bold text-white dark:text-white mb-6 leading-tight">
                                        Everything you need to run your institution efficiently
                                    </h2>
                                    <p className="text-lg text-slate-200 dark:text-slate-400 leading-relaxed">
                                        We've streamlined every aspect of educational management so you can focus on teaching and learning.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="flex items-center justify-center size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                                <Clock className="size-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white dark:text-white mb-2">Save Valuable Time</h3>
                                            <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                                Automate attendance, grading, and reporting. Decrease administrative workload by up to 70%.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="flex items-center justify-center size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                                <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white dark:text-white mb-2">Data-Driven Insights</h3>
                                            <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                                Get real-time analytics on student performance and engagement to identify areas for improvement.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="flex items-center justify-center size-12 rounded-xl bg-green-100 dark:bg-green-900/30">
                                                <Zap className="size-6 text-green-600 dark:text-green-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white dark:text-white mb-2">Seamless Experience</h3>
                                            <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                                A modern, lightning-fast interface that works perfectly on any device, anywhere, anytime.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


                {/* CTA Section */}
                <section className="py-20 lg:py-32">
                    <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 lg:p-16 text-white">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                                Ready to Transform Your Educational Experience?
                            </h2>
                            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                                Join thousands of students and lecturers already using EduSpace to achieve their goals
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    onClick={() => setShowRoleDialog(true)}
                                    className="bg-white text-blue-600 hover:bg-blue-50 gap-2 px-8"
                                >
                                    Get Started Free
                                    <ArrowRight className="size-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => setShowHelp(true)}
                                    className="border-white text-white hover:bg-white/10 px-8"
                                >
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white/10 dark:bg-slate-900/90 backdrop-blur-lg border-t border-white/10 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                            {/* Brand Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-600">
                                        <GraduationCap className="size-5 text-white" />
                                    </div>
                                    <span className="text-lg font-semibold text-white dark:text-white">
                                        EduSpace
                                    </span>
                                </div>
                                <p className="text-sm text-slate-200 dark:text-slate-400">
                                    Your comprehensive academic platform for seamless learning and teaching. Empowering education through technology.
                                </p>
                                <div className="flex items-center gap-3">
                                    <ThemeToggle />
                                    <span className="text-xs text-slate-300 dark:text-slate-400">Theme</span>
                                </div>
                            </div>

                            {/* Quick Links Column */}
                            <div>
                                <h3 className="font-semibold text-white dark:text-white mb-4">Quick Links</h3>
                                <ul className="space-y-3">
                                    <li>
                                        <a href="#features" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            Features
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#students" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            For Students
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#lecturers" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            For Lecturers
                                        </a>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setShowHelp(true)}
                                            className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Help Center
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* Legal Column */}
                            <div>
                                <h3 className="font-semibold text-white dark:text-white mb-4">Legal</h3>
                                <ul className="space-y-3">
                                    <li>
                                        <button
                                            onClick={() => setShowPrivacy(true)}
                                            className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Privacy Policy
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setShowTerms(true)}
                                            className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Terms of Service
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => setShowContact(true)}
                                            className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            Contact Support
                                        </button>
                                    </li>
                                    <li>
                                        <a href="#" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            System Status
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Contact Column */}
                            <div>
                                <h3 className="font-semibold text-white dark:text-white mb-4">Contact Us</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                        <Mail className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <a href="mailto:mannamganeshbabu8@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            mannamganeshbabu8@gmail.com
                                        </a>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                        <Phone className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <a href="tel:+917670895485" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                            +91 7670895485
                                        </a>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                        <MapPin className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <span>
                                            1-194, Mannam Bazar, SN Padu Mandal,<br />
                                            Endluru, Prakasam District,<br />
                                            Andhra Pradesh - 523225, India
                                        </span>
                                    </li>
                                </ul>

                                {/* Social Links */}
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold text-white dark:text-white mb-3">Follow Us</h4>
                                    <div className="flex items-center gap-3">
                                        <a
                                            href="https://x.com/Ganeshbabu_13"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                            aria-label="Twitter"
                                        >
                                            <Twitter className="size-4" />
                                        </a>
                                        <a
                                            href="https://www.linkedin.com/in/mannam-ganeshbabu-5a19ab291/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                            aria-label="LinkedIn"
                                        >
                                            <Linkedin className="size-4" />
                                        </a>
                                        <a
                                            href="https://github.com/codergangganesh"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                            aria-label="GitHub"
                                        >
                                            <Github className="size-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-slate-300 dark:text-slate-400">
                                    © 2024 EduSpace. All rights reserved.
                                </p>
                                <p className="text-sm text-slate-300 dark:text-slate-400">
                                    Made with ❤️ for Education
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
