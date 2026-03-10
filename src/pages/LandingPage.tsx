import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Headset, Menu, X, ChevronRight, LayoutGrid, Users, GraduationCap, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { renderCanvas } from "@/components/ui/canvas";
import { HeroSection } from "@/components/landing/HeroSection";
import { MobileOnboarding } from "@/components/landing/MobileOnboarding";

// Lazy load sections (HeroSection is eager loaded for LCP)
const AnoAI = lazy(() => import("@/components/ui/animated-shader-background"));
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(module => ({ default: module.FeaturesSection })));
const TrustedBySection = lazy(() => import("@/components/landing/TrustedBySection").then(module => ({ default: module.TrustedBySection })));
const StreakSection = lazy(() => import("@/components/landing/StreakSection").then(module => ({ default: module.StreakSection })));
const StudentSection = lazy(() => import("@/components/landing/StudentSection").then(module => ({ default: module.StudentSection })));
const LecturerSection = lazy(() => import("@/components/landing/LecturerSection").then(module => ({ default: module.LecturerSection })));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection").then(module => ({ default: module.HowItWorksSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(module => ({ default: module.TestimonialsSection })));
const BenefitsSection = lazy(() => import("@/components/landing/BenefitsSection").then(module => ({ default: module.BenefitsSection })));
const CTASection = lazy(() => import("@/components/landing/CTASection").then(module => ({ default: module.CTASection })));
const FooterSection = lazy(() => import("@/components/landing/FooterSection").then(module => ({ default: module.FooterSection })));

export default function LandingPage() {
    const navigate = useNavigate();
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);

    useEffect(() => {
        const canvas = document.getElementById("canvas");
        if (canvas && !canvas.hasAttribute('data-initialized')) {
            // Defer 2D canvas initialization to let WebGL shader compile and render first
            const timer = setTimeout(() => {
                renderCanvas();
                canvas.setAttribute('data-initialized', 'true');
            }, 150);
            return () => clearTimeout(timer);
        }
    }, []);

    const LoadingFallback = () => (
        <div className="py-20 flex justify-center items-center h-[200px]" />
    );

    return (
        <div className="min-h-screen bg-slate-950 dark:bg-background font-sans text-white dark:text-foreground relative overflow-x-hidden selection:bg-blue-500/30">
            <SEO
                title="Home | Modern Learning Management System"
                description="EduSpace is a powerful learning management system for students and lecturers. Track progress, manage assignments, and enhance your learning journey."
                keywords={["LMS", "Learning Management System", "Education", "Student", "Lecturer", "Assignments", "Grades", "GPA Tracker", "Online Learning", "Eduspace"]}
                structuredData={[
                    {
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Eduspace Academy",
                        "applicationCategory": "EducationalApplication",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        },
                        "description": "Eduspace is a state-of-the-art learning management system designed to empower students and lecturers with AI-driven tools, seamless collaboration, and efficient course management.",
                        "featureList": [
                            "Course Management",
                            "Assignment Tracking",
                            "Advanced Analytics",
                            "Class Collaboration",
                            "Smart Notifications",
                            "Secure & Private"
                        ],
                        "screenshot": "https://eduspaceacademy.online/og-image.png",
                        "author": {
                            "@type": "Organization",
                            "name": "Eduspace Team",
                            "url": "https://eduspaceacademy.online"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Eduspace Academy",
                        "url": "https://eduspaceacademy.online",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://eduspaceacademy.online/search?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Eduspace Academy",
                        "url": "https://eduspaceacademy.online",
                        "logo": "https://eduspaceacademy.online/favicon.png",
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "telephone": "+91-7670895485",
                            "contactType": "customer service",
                            "areaServed": "IN",
                            "availableLanguage": "en"
                        },
                        "sameAs": [
                            "https://x.com/Ganeshbabu_13",
                            "https://www.linkedin.com/in/mannam-ganeshbabu-5a19ab291/",
                            "https://github.com/codergangganesh"
                        ]
                    }
                ]}
            />

            <Suspense fallback={null}>
                <AnoAI />
                <canvas
                    className="pointer-events-none absolute inset-0 mx-auto z-[1]"
                    id="canvas"
                />
            </Suspense>

            {/* Modals outside of hidden containers so they always work */}
            <RoleSelectionDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
            <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
            <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
            <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
            <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

            <div className="block md:hidden relative z-50 transition-all duration-500">
                <MobileOnboarding onComplete={() => setShowRoleDialog(true)} />
            </div>

            <div className="hidden md:block relative z-10 backdrop-blur-[2px]">
                {/* Navigation */}
                <nav className="border-b border-white/10 dark:border-slate-800/50 bg-white/10 dark:bg-slate-950/70 backdrop-blur-xl fixed top-0 w-full z-[100] transition-all duration-300 pt-[var(--safe-top)]">
                    <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                        <div className="flex items-center justify-between min-h-20">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <Link to="/" className="flex items-center gap-2 group">
                                    <div className="size-10 rounded-xl overflow-hidden border border-white/20 group-hover:border-blue-500/50 transition-all duration-300">
                                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                                    </div>
                                    <span className="text-2xl font-bold text-white dark:text-white tracking-tight">
                                        Eduspace
                                    </span>
                                </Link>
                            </div>

                            {/* Mobile Navigation & Actions */}
                            <div className="flex md:hidden items-center gap-2">

                                <Sheet>
                                    <SheetTrigger asChild>
                                        <button className="p-2 text-white dark:text-white hover:bg-white/10 rounded-lg transition-colors outline-none">
                                            <Menu className="size-7" />
                                        </button>
                                    </SheetTrigger>
                                    <SheetContent
                                        side="right"
                                        className="w-full sm:max-w-md bg-slate-950 dark:bg-slate-950 border-white/10 p-0 flex flex-col pt-[calc(1.5rem+var(--safe-top,0px))]"
                                    >
                                        {/* Drawer Branding Header */}
                                        <div className="px-6 pb-6 border-b border-white/5 flex items-center justify-between">
                                            <Link to="/" className="flex items-center gap-2">
                                                <div className="size-8 rounded-lg overflow-hidden border border-white/20">
                                                    <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                                                </div>
                                                <span className="text-xl font-bold text-white tracking-tight">
                                                    Eduspace
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Drawer Body - Navigation Links */}
                                        <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                                            <div className="space-y-2">
                                                <a
                                                    href="#features"
                                                    className="flex items-center gap-4 px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                                                >
                                                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                                        <LayoutGrid className="size-5" />
                                                    </div>
                                                    Features
                                                </a>
                                                <a
                                                    href="#students"
                                                    className="flex items-center gap-4 px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                                                >
                                                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                        <Users className="size-5" />
                                                    </div>
                                                    For Students
                                                </a>
                                                <a
                                                    href="#lecturers"
                                                    className="flex items-center gap-4 px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                                                >
                                                    <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                                        <GraduationCap className="size-5" />
                                                    </div>
                                                    For Lecturers
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        setShowContact(true);
                                                    }}
                                                    className="w-full flex items-center gap-4 px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                                                >
                                                    <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                        <LifeBuoy className="size-5" />
                                                    </div>
                                                    Support Center
                                                </button>

                                                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between px-4">
                                                    <span className="text-sm font-medium text-white/40">Appearance</span>
                                                    <ThemeToggle />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Drawer Footer - Action Buttons */}
                                        <div className="p-6 pb-12 bg-slate-900/50 border-t border-white/5 grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowRoleDialog(true)}
                                                className="w-full h-11 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/5 font-bold transition-all text-xs"
                                            >
                                                Sign in
                                            </Button>
                                            <Button
                                                onClick={() => setShowRoleDialog(true)}
                                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black transition-all shadow-xl shadow-blue-600/20 text-xs px-2"
                                            >
                                                Join Now
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex items-center gap-8">
                                <a href="#features" className="text-sm font-medium text-slate-200 dark:text-slate-400 hover:text-blue-400 transition-colors">
                                    Features
                                </a>
                                <a href="#students" className="text-sm font-medium text-slate-200 dark:text-slate-400 hover:text-blue-400 transition-colors">
                                    Students
                                </a>
                                <a href="#lecturers" className="text-sm font-medium text-slate-200 dark:text-slate-400 hover:text-blue-400 transition-colors">
                                    Lecturers
                                </a>
                                <button
                                    onClick={() => setShowContact(true)}
                                    className="text-sm font-medium text-slate-200 dark:text-slate-400 hover:text-blue-400 transition-colors"
                                >
                                    Support
                                </button>
                                <div className="h-6 w-px bg-white/10 mx-2" />
                                <ThemeToggle />
                                <Button
                                    onClick={() => setShowRoleDialog(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg shadow-blue-600/20"
                                >
                                    Sign In
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>

                <HeroSection onOpenRoleSelection={setShowRoleDialog} />

                <Suspense fallback={<LoadingFallback />}>
                    <FeaturesSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <StreakSection onOpenRoleSelection={setShowRoleDialog} />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <StudentSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <LecturerSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <TrustedBySection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <HowItWorksSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <TestimonialsSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <BenefitsSection />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <CTASection onOpenRoleSelection={setShowRoleDialog} onOpenHelp={setShowHelp} />
                </Suspense>

                <Suspense fallback={<LoadingFallback />}>
                    <FooterSection
                        onOpenPrivacy={setShowPrivacy}
                        onOpenTerms={setShowTerms}
                        onOpenContact={setShowContact}
                        onOpenHelp={setShowHelp}
                    />
                </Suspense>
            </div>
        </div>
    );
}
