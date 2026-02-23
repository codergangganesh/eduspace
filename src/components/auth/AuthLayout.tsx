import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ChevronLeft } from "lucide-react";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { Capacitor } from "@capacitor/core";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    contentMaxWidth?: string;
}

export function AuthLayout({ children, title, subtitle, contentMaxWidth = "max-w-md" }: AuthLayoutProps) {
    const navigate = useNavigate();
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const isNative = Capacitor.isNativePlatform();

    return (
        <div className={`min-h-screen ${isNative ? 'h-screen' : 'lg:h-screen'} w-full relative flex items-start justify-center overflow-y-auto ${isNative ? 'overflow-y-auto' : 'lg:overflow-hidden'} bg-background selection:bg-blue-100 selection:text-blue-900`}>
            {/* Background Animation - Visible on Desktop or Native App */}
            <div className={`${isNative ? 'block' : 'hidden lg:block'} absolute inset-0 z-0`}>
                <BackgroundGradientAnimation />
            </div>

            <div className={`w-full flex items-start justify-center ${isNative ? 'p-4' : 'lg:p-6'} z-10 relative ${isNative ? 'bg-transparent' : 'bg-background lg:bg-transparent'} transition-colors duration-300`}>
                {/* Mobile Header - Only visible on mobile web (not needed in native app usually, or different) */}
                {!isNative && (
                    <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-b border-border/50 -z-10" />
                        <div className="flex flex-col pt-safe">
                            <div className="min-h-[64px] flex items-center px-4">
                                <div className="flex items-center gap-2 w-full">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="p-2 -ml-2 text-foreground hover:bg-accent rounded-full transition-colors active:scale-90"
                                    >
                                        <ChevronLeft className="size-6" />
                                    </button>

                                    <div className="flex items-center gap-2.5 ml-1">
                                        <div className="size-8 rounded-lg overflow-hidden border border-border/50 shadow-sm bg-white p-0.5">
                                            <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                                        </div>
                                        <span className="text-xl font-bold text-foreground tracking-tight">Eduspace</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`w-full max-w-6xl flex flex-col lg:flex-row ${isNative ? 'bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl' : 'bg-background lg:bg-white/20 dark:lg:bg-black/20 lg:backdrop-blur-xl lg:rounded-3xl'} overflow-hidden shadow-2xl ${isNative ? 'border border-white/20 dark:border-white/10' : 'lg:border lg:border-white/20 dark:lg:border-white/10'} lg:my-auto shrink-0 shadow-blue-500/10 min-h-screen lg:min-h-0 pt-4 lg:pt-0`}>

                    {/* Modals */}
                    <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
                    <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
                    <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
                    <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

                    {/* Branding Panel */}
                    <div className={`${isNative ? 'flex pt-safe' : 'hidden lg:flex'} w-full lg:w-5/12 p-6 lg:p-10 flex-col justify-between bg-black/5 dark:bg-black/40 text-white relative lg:min-h-[550px] shrink-0`}>
                        {/* Decorative background overlay */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-center lg:justify-start">
                            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
                                <div className="size-10 lg:size-12 rounded-xl overflow-hidden border border-white/20 shadow-xl">
                                    <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                                </div>
                                <span className="text-xl lg:text-2xl font-bold text-white tracking-tight">Eduspace</span>
                            </Link>
                        </div>

                        <div className={`relative z-10 ${isNative ? 'block' : 'hidden lg:block'} py-12 lg:py-0`}>
                            <h1 className={`${isNative ? 'text-3xl' : 'text-4xl'} lg:text-5xl font-black mb-6 leading-tight tracking-tight`}>
                                Welcome to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">Eduspace</span>
                            </h1>
                            <p className="text-lg text-white/80 leading-relaxed font-medium">
                                Your comprehensive academic platform. Connect with your courses, manage assignments, and collaborate effortlessly.
                            </p>
                        </div>

                        <div className={`relative z-10 text-xs text-white/50 text-center lg:text-left mt-4 lg:mt-0 ${isNative ? 'block' : 'hidden lg:block'}`}>
                            Protected by Eduspace Security
                        </div>
                    </div>

                    {/* Content Panel */}
                    <div className={`flex-1 p-5 lg:p-10 ${isNative ? 'bg-background/80 backdrop-blur-md' : 'bg-background lg:bg-background/80 lg:backdrop-blur-md'} flex flex-col justify-center relative py-12 lg:py-10 pb-safe`}>
                        <div className={`${isNative ? 'flex' : 'hidden lg:flex'} justify-end gap-4 text-sm font-medium mb-4 lg:mb-6`}>
                            <button onClick={() => setShowHelp(true)} className="text-muted-foreground hover:text-foreground transition-colors">Help</button>
                            <button onClick={() => setShowContact(true)} className="text-muted-foreground hover:text-foreground transition-colors">Support</button>
                        </div>

                        <div className={`w-full ${contentMaxWidth} mx-auto`}>
                            <div className={`mb-6 lg:mb-8 text-center lg:text-left ${isNative ? 'block' : 'hidden lg:block'}`}>
                                <h2 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-1">{title}</h2>
                                <p className="text-sm lg:text-base text-muted-foreground">{subtitle}</p>
                            </div>

                            <div className="mt-2 lg:mt-0">
                                {children}
                            </div>

                            <div className="mt-8 lg:mt-10 py-6 border-t border-border/50 lg:border-none text-center text-xs text-muted-foreground">
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
    );
}
