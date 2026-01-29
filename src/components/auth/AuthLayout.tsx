import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

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
        <BackgroundGradientAnimation>
            <div className="absolute inset-0 z-10 overflow-auto">
                <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
                    <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 my-8">

                        {/* Modals */}
                        <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
                        <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
                        <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
                        <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

                        {/* Branding Panel */}
                        <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between bg-black/5 dark:bg-black/40 text-white relative lg:min-h-[700px]">
                            {/* Decorative background overlay */}
                            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay pointer-events-none" />

                            <div className="relative z-10">
                                <Link to="/" className="flex items-center gap-3 w-fit">
                                    <div className="size-12 rounded-xl overflow-hidden border border-white/20 shadow-xl">
                                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                                    </div>
                                    <span className="text-2xl font-bold text-white tracking-tight">Eduspace</span>
                                </Link>
                            </div>

                            <div className="relative z-10 py-12 lg:py-0">
                                <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight tracking-tight">
                                    Welcome to <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">Eduspace</span>
                                </h1>
                                <p className="text-lg text-white/80 leading-relaxed font-medium">
                                    Your comprehensive academic platform. Connect with your courses, manage assignments, and collaborate effortlessly.
                                </p>
                            </div>

                            <div className="relative z-10 hidden lg:block text-xs text-white/50">
                                Protected by Eduspace Security
                            </div>
                        </div>

                        {/* Content Panel */}
                        <div className="flex-1 p-8 lg:p-12 bg-background/80 backdrop-blur-md flex flex-col justify-center relative">
                            <div className="flex justify-end gap-4 text-sm font-medium mb-8">
                                <button onClick={() => setShowHelp(true)} className="text-muted-foreground hover:text-foreground transition-colors">Help</button>
                                <button onClick={() => setShowContact(true)} className="text-muted-foreground hover:text-foreground transition-colors">Support</button>
                            </div>

                            <div className="w-full max-w-md mx-auto">
                                <div className="mb-8">
                                    <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">{title}</h2>
                                    <p className="text-muted-foreground">{subtitle}</p>
                                </div>

                                {children}

                                <div className="mt-8 text-center text-xs text-muted-foreground">
                                    By continuing, you agree to our{" "}
                                    <button onClick={() => setShowTerms(true)} className="underline hover:text-primary">Terms of Service</button>
                                    {" "}and{" "}
                                    <button onClick={() => setShowPrivacy(true)} className="underline hover:text-primary">Privacy Policy</button>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BackgroundGradientAnimation>
    );
}
