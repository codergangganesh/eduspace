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
import { LandingScrollControls } from "@/components/landing/LandingScrollControls";
import { ReadingProgressBar } from "@/components/landing/ReadingProgressBar";

import { FAQSection } from "@/components/landing/FAQSection";

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
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("");
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showOnboarding, setShowOnboarding] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const sections = ["features", "students", "lecturers", "faq"];
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // When the section is in the middle-ish of the view
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

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
            {/* Mouse Spotlight Effect */}
            <ReadingProgressBar />
            <LandingScrollControls />
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

            {showOnboarding && (
                <div className="block md:hidden relative z-[150] transition-all duration-500">
                    <MobileOnboarding onComplete={() => {
                        setShowOnboarding(false);
                        setShowRoleDialog(true);
                    }} />
                </div>
            )}

            {/* Navigation - MOVED OUTSIDE FOR UNIVERSAL VISIBILITY */}
            <nav className={cn(
                "fixed top-0 w-full z-[100] transition-all duration-500 pt-[calc(var(--safe-top)+0.5rem)] pb-2",
                isScrolled
                    ? "border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl py-3"
                    : "bg-transparent py-4"
            )}>
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between min-h-16">
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

                        {/* Mobile Navigation & Actions removed as requested */}
                        <div className="flex md:hidden items-center gap-3">
                        </div>

                        {/* Navigation Links (Desktop) */}
                        <div className="hidden md:flex items-center gap-6">
                            <a
                                href="#features"
                                onClick={() => setActiveSection("features")}
                                className={cn(
                                    "text-xs font-black uppercase tracking-widest transition-all relative py-1",
                                    activeSection === "features" ? "text-blue-500" : "text-slate-200 dark:text-slate-400 hover:text-blue-400"
                                )}
                            >
                                Features
                                {activeSection === "features" && (
                                    <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600" />
                                )}
                            </a>
                            <a
                                href="#students"
                                onClick={() => setActiveSection("students")}
                                className={cn(
                                    "text-xs font-black uppercase tracking-widest transition-all relative py-1",
                                    activeSection === "students" ? "text-blue-500" : "text-slate-200 dark:text-slate-400 hover:text-blue-400"
                                )}
                            >
                                Students
                                {activeSection === "students" && (
                                    <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600" />
                                )}
                            </a>
                            <a
                                href="#lecturers"
                                onClick={() => setActiveSection("lecturers")}
                                className={cn(
                                    "text-xs font-black uppercase tracking-widest transition-all relative py-1",
                                    activeSection === "lecturers" ? "text-blue-500" : "text-slate-200 dark:text-slate-400 hover:text-blue-400"
                                )}
                            >
                                Lecturers
                                {activeSection === "lecturers" && (
                                    <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600" />
                                )}
                            </a>
                            <button
                                onClick={() => setShowContact(true)}
                                className="text-xs font-black uppercase tracking-widest text-slate-200 dark:text-slate-400 hover:text-blue-400 transition-colors"
                            >
                                Support
                            </button>

                            <div className="h-6 w-px bg-white/10 mx-2" />

                            <ThemeToggle />

                            <Button
                                onClick={() => setShowRoleDialog(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg shadow-blue-600/20 font-black uppercase tracking-widest text-[11px] h-10"
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 backdrop-blur-[2px]">
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
                    <FAQSection />
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

