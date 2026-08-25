import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Sun, Moon, HelpCircle, MessageSquare } from "lucide-react";
import { PrivacyPolicyDialog } from "@/components/legal/PrivacyPolicyDialog";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import { useTheme } from "@/contexts/ThemeContext";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    contentMaxWidth?: string;
    noScroll?: boolean;
}

const ROTATING_MESSAGES = [
    "Manage your academic journey effortlessly.",
    "Real-time analytics and performance tracking.",
    "Empower students and educators with AI tools.",
    "Seamless institutional learning experience."
];

export function AuthLayout({ children, title, subtitle, contentMaxWidth = "max-w-md", noScroll = false }: AuthLayoutProps) {
    const navigate = useNavigate();
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const { actualTheme, setTheme } = useTheme();

    // Typing effect for desktop left branding panel
    const [textIndex, setTextIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const currentFullText = ROTATING_MESSAGES[textIndex];

        if (!isDeleting) {
            if (displayText.length < currentFullText.length) {
                timer = setTimeout(() => {
                    setDisplayText(currentFullText.substring(0, displayText.length + 1));
                }, 40);
            } else {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, 3500);
            }
        } else {
            if (displayText.length > 0) {
                timer = setTimeout(() => {
                    setDisplayText(currentFullText.substring(0, displayText.length - 1));
                }, 20);
            } else {
                setIsDeleting(false);
                setTextIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
            }
        }

        return () => clearTimeout(timer);
    }, [displayText, isDeleting, textIndex]);

    const toggleTheme = () => {
        setTheme(actualTheme === "dark" ? "light" : "dark");
    };

    return (
        <>
            {/* Top Right Floating Dark / Light Mode Toggle Button */}
            <button
                type="button"
                onClick={toggleTheme}
                className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 p-2 sm:p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center"
                title={`Switch to ${actualTheme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle dark and light mode"
            >
                {actualTheme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                ) : (
                    <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 dark:text-slate-300" />
                )}
            </button>

            {/* Modals */}
            <PrivacyPolicyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
            <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
            <HelpCenterDialog open={showHelp} onOpenChange={setShowHelp} />
            <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />

            {/* ========================================================================= */}
            {/* 1. MOBILE VIEW (< lg screens - Pronounced Deep Organic Wave Shell)        */}
            {/* ========================================================================= */}
            <div className="flex lg:hidden flex-col min-h-[100dvh] w-full bg-white dark:bg-[#0B0F1A] text-slate-900 dark:text-white font-sans relative overflow-y-auto selection:bg-blue-500/30">

                {/* Top Organic Curved Wave Banner */}
                <div className="relative w-full h-44 sm:h-52 bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#1d4ed8] overflow-hidden flex flex-col justify-between shrink-0">

                    {/* Topographical / Contour Organic Wave SVG Background Patterns */}
                    <svg className="absolute inset-0 w-full h-full opacity-25 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="none">
                        <path d="M-50,60 C80,20 180,140 450,40" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
                        <path d="M-30,110 C100,70 200,190 470,90" fill="none" stroke="white" strokeWidth="2.5" opacity="0.7" />
                        <path d="M-10,160 C120,120 220,240 490,140" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                        <path d="M10,210 C140,170 240,290 510,190" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
                        <circle cx="280" cy="110" r="60" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
                        <circle cx="280" cy="110" r="95" fill="none" stroke="white" strokeWidth="1.8" opacity="0.4" />
                        <circle cx="280" cy="110" r="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
                        <circle cx="100" cy="220" r="70" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
                    </svg>

                    {/* Repeating Favicon Watermark Pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            backgroundImage: "url('/favicon.png')",
                            backgroundRepeat: "repeat",
                            backgroundSize: "48px 48px",
                        }}
                    />

                    {/* Top Header Row with Back Button and Branding */}
                    <div className="relative z-10 px-5 pt-3.5 sm:px-6 sm:pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="p-1.5 -ml-1 text-white/90 hover:text-white bg-white/15 hover:bg-white/25 rounded-xl backdrop-blur-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-white/20 shadow-xs"
                                aria-label="Go back"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <img src="/favicon.png" alt="Eduspace Logo" className="w-7 h-7 rounded-xl shadow-md brightness-110 object-cover border border-white/20" />
                            <span className="text-xl font-black text-white tracking-tight">Eduspace</span>
                        </div>
                    </div>

                    {/* Bottom Pronounced Deep Organic S-Curve Divider */}
                    <div className="relative z-10 w-full">
                        {/* Layered translucent wave accent for extra dimensionality */}
                        <svg
                            className="w-full h-24 sm:h-28 fill-white/20 pointer-events-none absolute bottom-0 inset-x-0"
                            viewBox="0 0 375 120"
                            preserveAspectRatio="none"
                        >
                            <path d="M0,0 C90,-10 140,115 375,116 L375,120 L0,120 Z" />
                        </svg>

                        {/* Main deep organic swooping wave */}
                        <svg
                            className="w-full h-24 sm:h-28 fill-white dark:fill-[#0B0F1A] transition-colors duration-300 -mb-[1px] relative z-10"
                            viewBox="0 0 375 120"
                            preserveAspectRatio="none"
                        >
                            <path d="M0,8 C110,-8 155,120 375,120 L375,120 L0,120 Z" />
                        </svg>
                    </div>
                </div>

                {/* Bottom Form Sheet - Centered in the available middle space */}
                <div className="flex-1 px-6 sm:px-8 py-4 pb-6 relative z-20 flex flex-col overflow-y-auto">
                    <div className="w-full max-w-[420px] mx-auto my-auto flex flex-col">
                        {/* Heading with Signature Accent Pill */}
                        <div className="mb-2.5 sm:mb-3">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight relative inline-block">
                                {title}
                                <span className="absolute -bottom-1.5 left-0 right-0 h-1 bg-[#2563eb] rounded-full" />
                            </h1>
                            {subtitle && (
                                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-tight">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Form Contents */}
                        {children}

                        {/* Mobile Legal Disclaimer */}
                        <div className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-tight font-normal">
                            By continuing you accept all our{" "}
                            <Link to="/terms-of-service" className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline font-medium">
                                terms
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-blue-400 underline font-medium">
                                privacy policy
                            </Link>.
                        </div>
                    </div>

                    {/* Footer branding */}
                    <div className="text-center text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-600 pt-0.5 shrink-0">
                        &copy; {new Date().getFullYear()} Eduspace Institutional Suite
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. DESKTOP VIEW (lg: screens - Balanced 50/50 Elevated Two-Panel Layout)   */}
            {/* ========================================================================= */}
            <div className="hidden lg:flex h-screen overflow-hidden w-full bg-gradient-to-b from-[#e0f2fe] via-[#93c5fd]/50 to-[#1e3a8a]/90 dark:from-[#0B0F1A] dark:via-[#0F172A] dark:to-[#020617] flex-col justify-between items-center p-4 lg:p-6 font-sans selection:bg-blue-500/30 transition-colors duration-300 relative">

                {/* Central Elevated Two-Panel Card */}
                <div className="w-full max-w-[1140px] flex-1 flex flex-col justify-center relative z-10 min-h-0">
                    <div className="w-full grid grid-cols-12 rounded-[36px] overflow-hidden shadow-[0_25px_70px_-15px_rgba(30,58,138,0.45)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border border-white/50 dark:border-slate-800/80 transition-colors duration-300">

                        {/* LEFT SIDE: Brand Pattern, Typing Title, Watermarks */}
                        <div className="col-span-6 relative bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#1d4ed8] text-white p-8 lg:p-10 flex flex-col justify-between overflow-hidden">
                            {/* Repeating Eduspace Favicon Watermark Pattern */}
                            <div
                                className="absolute inset-0 pointer-events-none select-none z-0 opacity-15 dark:opacity-20"
                                style={{
                                    backgroundImage: "url('/favicon.png')",
                                    backgroundRepeat: "repeat",
                                    backgroundSize: "64px 64px",
                                    backgroundPosition: "0 0",
                                    filter: "brightness(1.5) contrast(1.2)",
                                }}
                            />

                            {/* Prominent Large Eduspace Logo Watermark */}
                            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-96 h-96 pointer-events-none select-none z-0 opacity-20 dark:opacity-25 flex items-center justify-center -rotate-12">
                                <img
                                    src="/favicon.png"
                                    alt="Eduspace Watermark"
                                    className="w-full h-full object-contain filter drop-shadow-2xl mix-blend-overlay"
                                />
                            </div>

                            {/* Glowing Ambient Orbs */}
                            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-900/40 blur-3xl pointer-events-none" />

                            {/* Top Header Logo */}
                            <div className="relative z-10 flex items-center gap-3">
                                <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                                    <img src="/favicon.png" alt="Eduspace Logo" className="w-8 h-8 rounded-lg shadow-md brightness-110 object-cover" />
                                    <span className="text-xl font-black text-white tracking-tight">Eduspace</span>
                                </Link>
                            </div>

                            {/* Center Content: Title & Interactive Rotating Subtitle */}
                            <div className="relative z-10 my-auto py-8 pr-14 lg:pr-16 flex flex-col justify-center">
                                <span className="text-xs font-bold tracking-widest text-blue-200 uppercase block mb-1">
                                    Institutional Portal
                                </span>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white uppercase drop-shadow-sm leading-tight">
                                    {title}
                                </h1>

                                <div className="mt-4 flex items-center gap-2 text-xs lg:text-sm text-blue-100/90 font-medium bg-black/15 backdrop-blur-sm px-3.5 py-2 rounded-xl w-fit max-w-full border border-white/10">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <span className="truncate">{displayText}</span>
                                    <span className="animate-pulse text-white font-light">|</span>
                                </div>
                            </div>

                            {/* Bottom branding detail */}
                            <div className="relative z-10 text-[11px] text-blue-200/80 font-medium flex items-center gap-2 mt-auto">
                                <img src="/favicon.png" alt="Eduspace" className="w-4 h-4 rounded object-cover brightness-110" />
                                <span>Eduspace Institutional Suite &copy; {new Date().getFullYear()}</span>
                            </div>

                            {/* SVG Organic Curved Mask on the Right Border (Desktop) */}
                            <div className="absolute -right-0.5 top-0 bottom-0 w-28 lg:w-32 pointer-events-none z-20">
                                <svg
                                    className="h-full w-full fill-[#F1F5FB] dark:fill-[#0f172a] transition-colors duration-300"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >
                                    <path d="M0,0 Q100,50 0,100 L100,100 L100,0 Z" />
                                </svg>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Header, Help/Support, Form, and Legal */}
                        <div className="col-span-6 bg-[#F1F5FB] dark:bg-[#0f172a] p-6 lg:p-8 flex flex-col justify-between overflow-y-auto relative transition-colors duration-300 max-h-[92vh] custom-scrollbar">

                            {/* Top Help & Support Links */}
                            <div className="flex justify-end gap-4 text-xs font-bold mb-2">
                                <button
                                    onClick={() => setShowHelp(true)}
                                    className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>Help</span>
                                </button>
                                <button
                                    onClick={() => setShowContact(true)}
                                    className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Support</span>
                                </button>
                            </div>

                            {/* Central Form Container */}
                            <div className="w-full max-w-[420px] mx-auto my-auto">
                                <div className="text-center mb-3">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                                        {title}
                                    </h2>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                        {subtitle}
                                    </p>
                                </div>

                                <div>
                                    {children}
                                </div>

                                <div className="mt-3 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    By continuing, you agree to our{" "}
                                    <Link to="/terms-of-service" className="underline text-[#2563eb] dark:text-blue-400 font-bold hover:text-blue-700">
                                        Terms
                                    </Link>{" "}
                                    &{" "}
                                    <Link to="/privacy-policy" className="underline text-[#2563eb] dark:text-blue-400 font-bold hover:text-blue-700">
                                        Privacy Policy
                                    </Link>.
                                </div>
                            </div>

                            {/* Bottom Note */}
                            <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 pt-2 shrink-0">
                                Protected by Eduspace Institutional Security
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
