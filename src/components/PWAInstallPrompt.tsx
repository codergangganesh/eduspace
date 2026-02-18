import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, MonitorSmartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

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
            // Just show instructions maybe? Or keep the prompt visible with instructions inside.
            // For now, let's assume the user knows, or update the text.
            return;
        }

        if (!deferredPrompt) return;

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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
            >
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-800 p-4 pointer-events-auto flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-xl shrink-0">
                            {/* Assuming icon exists */}
                            <img src="/pwa-192x192.png" alt="App Icon" className="w-8 h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            <MonitorSmartphone className="w-8 h-8 text-emerald-600 hidden peer-onError:block" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Install Eduspace Academy App</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                {isIOS
                                    ? "Install for faster access. Tap 'Share' then 'Add to Home Screen'."
                                    : "Install the app for faster access, offline mode, and real-time updates."
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 -mt-1 -mr-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {!isIOS ? (
                        <div className="flex gap-3 mt-1">
                            <Button
                                onClick={handleInstallClick}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm shadow-emerald-200 dark:shadow-none"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Install Now
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleDismiss}
                                className="px-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Not Now
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <Button
                                variant="outline"
                                onClick={handleDismiss}
                                className="w-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
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
