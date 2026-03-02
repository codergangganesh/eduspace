import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, MonitorSmartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        // Check if running as standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);


        if (isStandaloneMode) return;

        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Check dismissed status
        const dismissedAt = localStorage.getItem('eduspace_pwa_dismissed');
        if (dismissedAt) {
            const dismissedDate = new Date(parseInt(dismissedAt));
            const now = new Date();
            // Show again after 3 days
            if ((now.getTime() - dismissedDate.getTime()) < 3 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // On iOS, we show the prompt regardless of beforeinstallprompt since it's not supported
        if (isIOSDevice) {
            setShowPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            // Instructions are already in the UI
            return;
        }

        if (!deferredPrompt) {
            // If we don't have the prompt (e.g. testing), just close it
            setShowPrompt(false);
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('eduspace_pwa_dismissed', Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    // Mobile: Top Center, Desktop: Bottom Center (Existing)
    const containerClasses = cn(
        "fixed z-[150] left-4 right-4 flex justify-center pointer-events-none",
        isMobile ? "top-4" : "bottom-4"
    );

    // Mobile animation: Slide from top, Desktop animation: Slide from bottom
    const variants = {
        initial: {
            y: isMobile ? -80 : 80,
            opacity: 0,
            scale: 0.9,
            filter: "blur(8px)"
        },
        animate: {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                type: "spring" as const,
                stiffness: 350,
                damping: 25
            }
        },
        exit: {
            y: isMobile ? -40 : 40,
            opacity: 0,
            scale: 0.95,
            filter: "blur(4px)",
            transition: {
                duration: 0.2
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key="pwa-prompt"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={containerClasses}
            >
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-[340px] border border-white/40 dark:border-slate-800/60 p-3.5 pointer-events-auto flex flex-col gap-3 overflow-hidden relative group">
                    {/* Glass sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-none" />

                    {/* Progress line at top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/20">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-emerald-500"
                        />
                    </div>

                    <div className="flex items-start gap-3 relative z-10">
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-2 rounded-xl shrink-0 border border-emerald-500/20">
                            <img
                                src="/pwa-192x192.png"
                                alt="App Icon"
                                className="w-8 h-8 object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <MonitorSmartphone className="w-8 h-8 text-emerald-600 hidden peer-onError:block" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-[15px] text-slate-900 dark:text-white leading-none">Install EduSpace</h3>
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 leading-tight font-medium">
                                {isIOS
                                    ? "Tap 'Share' > 'Add to Home Screen'"
                                    : "Add to home screen for a better experience."
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 -mt-1 -mr-1 transition-all rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {!isIOS ? (
                        <div className="flex gap-2 relative z-10">
                            <Button
                                onClick={handleInstallClick}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 h-9 text-xs"
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Install Now
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleDismiss}
                                className="flex-1 h-9 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl"
                            >
                                Later
                            </Button>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <Button
                                variant="outline"
                                onClick={handleDismiss}
                                className="w-full h-9 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
                            >
                                Got it
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
