import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

import { renderCanvas } from "@/components/ui/canvas";
import { HeroSection } from "@/components/landing/HeroSection";

// Lazy load sections (HeroSection is eager loaded for LCP)
const AnoAI = lazy(() => import("@/components/ui/animated-shader-background"));

const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(module => ({ default: module.FeaturesSection })));
const StreakSection = lazy(() => import("@/components/landing/StreakSection").then(module => ({ default: module.StreakSection })));
const StudentSection = lazy(() => import("@/components/landing/StudentSection").then(module => ({ default: module.StudentSection })));
const LecturerSection = lazy(() => import("@/components/landing/LecturerSection").then(module => ({ default: module.LecturerSection })));
const StatsSection = lazy(() => import("@/components/landing/StatsSection").then(module => ({ default: module.StatsSection })));
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
    const [loadHeavyVisuals, setLoadHeavyVisuals] = useState(false);

    // Defer heavy visuals to avoid blocking LCP
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadHeavyVisuals(true);
        }, 2000); // Wait 2s before loading heavy background effects
        return () => clearTimeout(timer);
    }, []);

    // Initialize canvas only after visuals are allowed to load
    useEffect(() => {
        if (!loadHeavyVisuals) return;

        const canvas = document.getElementById("canvas");
        if (canvas && !canvas.hasAttribute('data-initialized')) {
            renderCanvas();
            canvas.setAttribute('data-initialized', 'true');
        }
    }, [loadHeavyVisuals]);

    const LoadingFallback = () => (
        <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent dark:bg-background font-sans text-white dark:text-foreground relative overflow-x-hidden selection:bg-blue-500/30">
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

            {loadHeavyVisuals && (
                <Suspense fallback={null}>
                    <AnoAI />
                    <canvas
                        className="pointer-events-none absolute inset-0 mx-auto z-[1]"
                        id="canvas"
                    />
                </Suspense>
            )}

            <div className="relative z-10 backdrop-blur-[2px]">
                {/* Modals */}
                <RoleSelectionDialog open={showRoleDialog} onOpenChange={setShowRoleDialog} />
                <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
                <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
                <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
                <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

                {/* Navigation */}
                <nav className="border-b border-white/10 dark:border-slate-800/50 bg-white/10 dark:bg-slate-950/70 backdrop-blur-xl fixed top-0 w-full z-[100] transition-all duration-300">
                    <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                        <div className="flex items-center justify-between h-20">
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

                            {/* Mobile Navigation Actions */}
                            <div className="flex md:hidden items-center gap-2 sm:gap-3">
                                <ThemeToggle />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowContact(true)}
                                    className="text-white hover:bg-white/10 size-5 sm:size-10"
                                >
                                    <Headset className="size-5" />
                                </Button>
                                <Button
                                    onClick={() => setShowRoleDialog(true)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 text-xs sm:text-sm px-3 sm:px-2"
                                >
                                    Sign In / Up
                                </Button>
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
                    <StatsSection />
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
