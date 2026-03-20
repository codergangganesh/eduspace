import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    contentMaxWidth?: string;
    noScroll?: boolean;
}

export function AuthLayout({ children, title, subtitle, contentMaxWidth = "max-w-md", noScroll = false }: AuthLayoutProps) {
    const navigate = useNavigate();
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);

    return (
        <div className="h-screen w-full relative flex items-center justify-center overflow-hidden bg-background selection:bg-blue-100 selection:text-blue-900">
            {/* Desktop Fixed Background Animation */}
            <div className="hidden lg:block fixed inset-0 z-0">
                <BackgroundGradientAnimation />
            </div>

            <div className="w-full h-full flex items-center justify-center z-10 relative bg-background lg:bg-transparent transition-colors duration-300 py-0 lg:px-6 overflow-y-auto lg:overflow-hidden scrollbar-hide">
                {/* Mobile Header - Only visible on mobile */}
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

                <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-background lg:bg-white/20 dark:lg:bg-black/20 lg:backdrop-blur-xl lg:rounded-[32px] overflow-hidden lg:shadow-2xl lg:border lg:border-white/20 dark:lg:border-white/10 shrink-0 lg:shadow-blue-500/10 relative min-h-screen lg:min-h-0 lg:max-h-[96vh]">

                    {/* Modals */}
                    <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
                    <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
                    <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
                    <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

                    {/* Branding Panel */}
                    <div className="hidden lg:flex w-full lg:w-[40%] p-8 lg:p-10 flex-col justify-between bg-black/5 dark:bg-black/40 text-white relative lg:min-h-[500px] shrink-0">
                        {/* Decorative background overlay */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-center lg:justify-start">
                            <Link to="/" className="flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
                                <div className="size-9 lg:size-10 rounded-xl overflow-hidden border border-white/20 shadow-xl bg-white p-0.5">
                                    <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                                </div>
                                <span className="text-xl lg:text-xl font-bold text-white tracking-tight">Eduspace</span>
                            </Link>
                        </div>

                        <div className={`relative z-10 hidden lg:block ${noScroll ? 'py-2' : 'py-4'}`}>
                            <h1 className="text-3xl lg:text-3xl font-black mb-4 leading-tight tracking-tight">
                                Welcome to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">Eduspace</span>
                            </h1>
                            <p className="text-sm lg:text-base text-white/80 leading-relaxed font-medium">
                                Your comprehensive academic platform. Connect with your courses, manage assignments, and collaborate effortlessly.
                            </p>
                        </div>

                        <div className="relative z-10 text-[10px] uppercase tracking-widest text-white/40 text-center lg:text-left mt-2 hidden lg:block font-bold">
                            Protected by Eduspace Security
                        </div>
                    </div>

                    {/* Content Panel */}
                    <div className={`flex-1 px-6 lg:px-10 py-6 lg:py-4 bg-background lg:bg-background/80 lg:backdrop-blur-md flex flex-col justify-center lg:justify-start relative pb-safe ${!noScroll ? 'lg:overflow-y-auto custom-scrollbar' : 'lg:overflow-hidden'}`}>
                        <div className="hidden lg:flex justify-end gap-5 text-sm font-bold mb-2 lg:mb-2">
                            <button onClick={() => setShowHelp(true)} className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider text-[10px]">Help</button>
                            <button onClick={() => setShowContact(true)} className="text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider text-[10px]">Support</button>
                        </div>

                        <div className={`w-full ${contentMaxWidth} mx-auto`}>
                            <div className="mb-4 lg:mb-3 text-center lg:text-left hidden lg:block">
                                <h2 className="text-xl lg:text-2xl font-black text-foreground tracking-tight mb-0 uppercase">{title}</h2>
                                <p className="text-xs lg:text-[13px] text-muted-foreground font-medium">{subtitle}</p>
                            </div>

                            <div className="mt-1 lg:mt-0">
                                {children}
                            </div>

                            <div className={`${noScroll ? 'mt-1 lg:mt-2' : 'mt-4 lg:mt-5'} py-1 lg:py-0 border-t border-border/50 lg:border-none text-center text-[10px] text-muted-foreground font-medium`}>
                                By continuing, you agree to our{" "}
                                <Link to="/terms-of-service" className="underline hover:text-primary font-bold">Terms of Service</Link>
                                {" "}and{" "}
                                <Link to="/privacy-policy" className="underline hover:text-primary font-bold">Privacy Policy</Link>.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
