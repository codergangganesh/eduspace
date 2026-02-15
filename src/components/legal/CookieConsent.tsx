import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";


export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const { user, profile, updateProfile } = useAuth();
    const location = useLocation();

    useEffect(() => {
        // Only trigger the check logic on the landing page
        if (location.pathname !== "/" || !user || !profile) {
            setIsVisible(false);
            return;
        }

        const checkConsent = () => {
            const lastConsentAt = profile.cookie_consent_at;
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const now = new Date().getTime();

            // If never consented OR last consent was more than 7 days ago
            if (!lastConsentAt || (now - new Date(lastConsentAt).getTime() > sevenDaysInMs)) {
                // Show popup after a short delay
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        };

        checkConsent();
    }, [user, profile, location.pathname]);


    const handleConsent = async (allow: boolean) => {
        const choice = allow ? "allow" : "reject";

        // Save to LocalStorage for immediate use in client.ts upon reload
        localStorage.setItem("cookie-consent", choice);

        // Persist to Supabase
        await updateProfile({
            cookie_consent_at: new Date().toISOString(),
            cookie_consent_choice: choice as any
        });

        setIsVisible(false);
        window.location.reload();
    };

    const handleClose = async () => {
        // Save dismissed state to Supabase so it won't show for 7 days
        await updateProfile({
            cookie_consent_at: new Date().toISOString(),
            cookie_consent_choice: 'dismissed' as any
        });

        setIsVisible(false);
    };



    // Only show if user is logged in and we haven't asked yet
    if (!user || !isVisible) return null;


    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
            >
                <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-6 overflow-hidden relative group">
                    {/* Decorative background gradient */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Cookie className="size-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-1">Cookie Settings</h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="size-5" />
                        </button>

                    </div>

                    <div className="mt-6 flex flex-col gap-2 relative z-10">
                        <Button
                            onClick={() => handleConsent(true)}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-lg shadow-primary/20 group/btn"
                        >
                            <Check className="mr-2 size-4 group-hover/btn:scale-125 transition-transform" />
                            Accept Cookies
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleConsent(false)}
                            className="w-full border-border/50 hover:bg-muted font-medium py-6 rounded-xl"
                        >
                            <X className="mr-2 size-4 text-destructive" />
                            Reject Cookies
                        </Button>
                    </div>

                    <div className="mt-4 text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest font-bold">
                        Security Preference
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
