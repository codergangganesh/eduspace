import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Modals */}
            <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
            <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
            <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
            <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

            {/* Header - Mobile Only */}
            <div className="lg:hidden w-full bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <GraduationCap className="size-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold text-foreground">EduSpace</span>
                </Link>
                <div className="flex items-center gap-4 text-sm">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Help Center
                    </button>
                    <button
                        onClick={() => setShowContact(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <GraduationCap className="size-8 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">EduSpace</span>
                    </Link>
                    <div className="flex items-center gap-6 text-sm">
                        <button
                            onClick={() => setShowHelp(true)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Help Center
                        </button>
                        <button
                            onClick={() => setShowContact(true)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>

                {/* Welcome Content */}
                <div className="space-y-6">
                    <div className="inline-flex p-3 rounded-2xl bg-primary/10">
                        <GraduationCap className="size-16 text-primary" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-foreground leading-tight">
                            Welcome to EduSpace
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                            Your comprehensive academic platform. Connect with your courses, manage assignments, and collaborate effortlessly.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-xs text-muted-foreground/70">
                    Protected by reCAPTCHA and subject to the{" "}
                    <button
                        onClick={() => setShowPrivacy(true)}
                        className="underline hover:text-muted-foreground"
                    >
                        Privacy Policy
                    </button>
                    {" "}and{" "}
                    <button
                        onClick={() => setShowTerms(true)}
                        className="underline hover:text-muted-foreground"
                    >
                        Terms of Service
                    </button>.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-[480px]">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
                        <p className="text-muted-foreground">{subtitle}</p>
                    </div>
                    {children}

                    {/* Mobile Footer */}
                    <div className="lg:hidden mt-8 text-xs text-center text-muted-foreground/70">
                        Protected by reCAPTCHA and subject to the{" "}
                        <button
                            onClick={() => setShowPrivacy(true)}
                            className="underline hover:text-muted-foreground"
                        >
                            Privacy Policy
                        </button>
                        {" "}and{" "}
                        <button
                            onClick={() => setShowTerms(true)}
                            className="underline hover:text-muted-foreground"
                        >
                            Terms of Service
                        </button>.
                    </div>
                </div>
            </div>
        </div>
    );
}
