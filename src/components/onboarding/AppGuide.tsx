import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/contexts/StreakContext'; // Add this import
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLayout } from '@/contexts/LayoutContext';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface TourStep {
    selector: string;
    title: string;
    description: string;
    howToUse: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    path?: string;
}

export function AppGuide() {
    const { profile, updateProfile, role } = useAuth();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const isMobile = useIsMobile();
    const { isMobileMenuOpen, setIsMobileMenuOpen, isMobileSidebarCollapsed, setIsMobileSidebarCollapsed, setTourActiveStepId, sidebarMode } = useLayout();
    const requestRef = useRef<number>(0);
    const { setGuideCompleted } = useStreak(); // Add this to track guide completion

    const studentSteps: TourStep[] = [
        {
            selector: '#tour-welcome',
            title: "Welcome",
            description: "Your academic command center.",
            howToUse: "Track your schedule and assignments here.",
            position: 'bottom',
            path: '/dashboard'
        },
        {
            selector: '#tour-nav-assignments',
            title: "Assignments",
            description: "Submit and manage coursework.",
            howToUse: "Upload work and check deadlines here.",
            position: 'right',
            path: '/student/assignments'
        },
        {
            selector: '#tour-nav-ai',
            title: "Eduspace AI",
            description: "Your 24/7 study buddy.",
            howToUse: "Ask AI to summarize notes or explain topics.",
            position: 'right',
            path: '/ai-chat'
        },
        {
            selector: '#tour-nav-feed',
            title: "Class Feed",
            description: "Stay in the loop.",
            howToUse: "Join peer discussions and check announcements.",
            position: 'right',
            path: '/class-feed'
        },
        {
            selector: '#tour-nav-streak',
            title: "Streak",
            description: "Consistency is key.",
            howToUse: "Log in daily to build your academic streak.",
            position: 'right',
            path: '/streak'
        },
        {
            selector: '#tour-nav-messages',
            title: "Messages",
            description: "Direct academic chat.",
            howToUse: "Collaborate with peers and lecturers.",
            position: 'right',
            path: '/messages'
        },
        {
            selector: '#tour-nav-notes',
            title: "Quick Notes",
            description: "Jot down ideas instantly.",
            howToUse: "Open your notepad for lecture reminders.",
            position: 'bottom'
        },
        {
            selector: '#tour-btn-invite',
            title: "Invite",
            description: "Grow your network.",
            howToUse: "Invite classmates to collaborate.",
            position: 'bottom',
            path: '/dashboard'
        }
    ];

    const lecturerSteps: TourStep[] = [
        {
            selector: '#tour-welcome',
            title: "Dashboard",
            description: "Manage teaching with ease.",
            howToUse: "View participation and pending grading.",
            position: 'bottom',
            path: '/lecturer-dashboard'
        },
        {
            selector: '#tour-nav-students',
            title: "Students",
            description: "Your digital classroom.",
            howToUse: "Monitor real-time student progress.",
            position: 'right',
            path: '/all-students'
        },
        {
            selector: '#tour-nav-ai-gen',
            title: "AI Generator",
            description: "Quizzes in seconds.",
            howToUse: "Auto-draft assessments from materials.",
            position: 'right',
            path: '/lecturer/create-ai-quiz'
        },
        {
            selector: '#tour-nav-assignments',
            title: "Assignments",
            description: "Grade efficiently.",
            howToUse: "Provide feedback and release grades.",
            position: 'right',
            path: '/lecturer/assignments'
        },
        {
            selector: '#tour-nav-notes',
            title: "Teaching Notes",
            description: "Your personal space.",
            howToUse: "Perfect for research and lecture ideas.",
            position: 'bottom'
        },
        {
            selector: '#tour-nav-messages',
            title: "Messaging",
            description: "Stay connected.",
            howToUse: "Handle inquiries and send updates.",
            position: 'right',
            path: '/messages'
        },
        {
            selector: '#tour-btn-invite',
            title: "Invite",
            description: "Onboard your class.",
            howToUse: "Add colleagues or students easily.",
            position: 'bottom',
            path: '/lecturer-dashboard'
        }
    ];

    const steps = role === 'lecturer' ? lecturerSteps : studentSteps;
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        // Reset state if user logs out
        if (!profile) {
            setHasInitialized(false);
            setIsVisible(false);
            return;
        }

        // Wait for both profile and role to be fully loaded to prevent redirect loops between dashboards
        if (!role || hasInitialized) return;

        const hasSeenTour = profile.has_seen_guide === true; // Explicit check for true
        const forcedTest = new URLSearchParams(window.location.search).get("test_tour") === "true";

        // Show guide if user hasn't seen it (false or null) OR if forced test
        if (!hasSeenTour || forcedTest) {
            const initialStep = Math.min(Math.max(profile.tour_current_step || 0, 0), steps.length - 1);
            setCurrentStep(initialStep);
            setIsVisible(true);
            setGuideCompleted(false); // Explicitly ensure streak popups wait
            document.body.setAttribute('data-tour-active', 'true');
            if (forcedTest) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } else {
            // User has seen tour, allow streak popups to show immediately
            setGuideCompleted(true);
        }
        setHasInitialized(true);
    }, [profile, role, hasInitialized, steps.length, setCurrentStep, setIsVisible, setGuideCompleted]);

    useEffect(() => {
        if (!isVisible) {
            setTourActiveStepId(null);
            return;
        }

        const step = steps[currentStep];

        // Smart navigation to ensure target is mounted
        if (step.path && window.location.pathname !== step.path) {
            navigate(step.path);
        }

        const currentSelector = step.selector;
        setTourActiveStepId(currentSelector.startsWith('#') ? currentSelector.slice(1) : null);

        if (isMobile) {
            // Critically: lock the sidebar to its 80px slim width securely throughout the entire guide.
            // Keeping the menu open whenever the guide is active on mobile prevents the flickering 
            // open/close animation between steps. Fixed properly as requested.
            setIsMobileSidebarCollapsed(true);
            if (!isMobileMenuOpen) setIsMobileMenuOpen(true);
        }
    }, [isVisible, currentStep, isMobile, steps, setIsMobileMenuOpen, setIsMobileSidebarCollapsed, setTourActiveStepId, navigate]);

    useLayoutEffect(() => {
        if (!isVisible) return;
        const updatePosition = () => {
            const els = document.querySelectorAll(steps[currentStep].selector);
            let el: HTMLElement | null = null;

            // Find the visible element matching the selector (vital for mobile vs desktop sidebars)
            for (let i = 0; i < els.length; i++) {
                if (els[i].getBoundingClientRect().width > 0) {
                    el = els[i] as HTMLElement;
                    break;
                }
            }

            if (el) {
                if (el.getAttribute('data-tour-focused') !== 'true') {
                    document.querySelectorAll('[data-tour-focused]').forEach(e => e.removeAttribute('data-tour-focused'));
                    el.setAttribute('data-tour-focused', 'true');
                }
                const rect = el.getBoundingClientRect();
                setTargetRect(prev => {
                    if (prev && Math.abs(prev.x - rect.x) < 0.1 && Math.abs(prev.y - rect.y) < 0.1) return prev;
                    return rect;
                });
            }
            requestRef.current = requestAnimationFrame(updatePosition);
        };
        requestRef.current = requestAnimationFrame(updatePosition);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            cancelAnimationFrame(requestRef.current);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isVisible, currentStep, steps, sidebarMode, isMobileMenuOpen]);

    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            if (profile) void updateProfile({ tour_current_step: nextStep } as any);
        } else {
            handleComplete();
        }
    }, [currentStep, steps.length, profile, updateProfile]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            if (profile) void updateProfile({ tour_current_step: prevStep } as any);
        }
    }, [currentStep, profile, updateProfile]);

    const handleComplete = useCallback(async () => {
        if (currentStep === steps.length - 1) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: ['#4f46e5', '#7c3aed', '#2563eb']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: ['#ec4899', '#f43f5e', '#f59e0b']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            // Initial center burst
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981']
            });

            // Start side cannons
            frame();
        }

        setIsVisible(false);
        document.body.removeAttribute('data-tour-active');
        document.querySelectorAll('[data-tour-focused]').forEach(e => e.removeAttribute('data-tour-focused'));
        setCurrentStep(0);
        if (profile) {
            await updateProfile({ has_seen_guide: true, tour_current_step: 0 } as any).catch(() => { });
        }

        if (isMobile) {
            setIsMobileMenuOpen(false);
            setIsMobileSidebarCollapsed(false);
        }

        // Delay the streak modal popup to ensure the AppGuide exit animations fully complete
        // This prevents the streak popup from rendering "backside" beneath the fading guide
        setTimeout(() => {
            setGuideCompleted(true);
        }, 500);
    }, [currentStep, steps.length, profile, updateProfile, isMobile, setIsMobileMenuOpen, setIsMobileSidebarCollapsed, setGuideCompleted]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;
            if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
            if (e.key === 'ArrowLeft') handleBack();
            if (e.key === 'Escape') handleComplete();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, handleNext, handleBack, handleComplete]);

    return createPortal(
        <>
            <AnimatePresence>
                {isVisible && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] pointer-events-none">
                        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] pointer-events-auto" />
                        <svg className="absolute inset-0 size-full">
                            <defs>
                                <mask id="spotlight-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    {targetRect && (
                                        <motion.rect
                                            initial={false}
                                            animate={{ x: targetRect.x - 4, y: targetRect.y - 4, width: targetRect.width + 8, height: targetRect.height + 8, rx: 8 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                            fill="black"
                                        />
                                    )}
                                </mask>
                            </defs>
                            <rect x="0" y="0" width="100%" height="100%" fill="rgba(2, 6, 23, 0.7)" mask="url(#spotlight-mask)" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isVisible && targetRect && (
                    <div className="fixed inset-0 z-[10001] pointer-events-none">
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ layout: { type: 'spring', damping: 25, stiffness: 200 } }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden pointer-events-auto w-[280px]"
                            style={{
                                position: 'absolute',
                                left: (
                                    steps[currentStep].position === 'right' ?
                                        Math.min(window.innerWidth - 292, targetRect.right + 12) :
                                        steps[currentStep].position === 'left' ?
                                            Math.max(12, targetRect.left - 292) :
                                            Math.max(12, Math.min(window.innerWidth - 292, targetRect.left + (targetRect.width / 2) - 140))
                                ),
                                top: (
                                    steps[currentStep].position === 'bottom' ?
                                        Math.min(window.innerHeight - 200, targetRect.bottom + 12) :
                                        steps[currentStep].position === 'top' ?
                                            Math.max(12, targetRect.top - 200) :
                                            Math.max(12, Math.min(window.innerHeight - 200, targetRect.top + (targetRect.height / 2) - 80))
                                )
                            }}
                        >
                            <div className="h-1 bg-slate-100 dark:bg-slate-800">
                                <motion.div className="h-full bg-primary" animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{steps[currentStep].title}</h3>
                                        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">{steps[currentStep].description}</p>
                                    </div>
                                    <button onClick={handleComplete} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                                        <X className="size-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                    <div className="size-5 shrink-0 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <img src="/favicon.png" alt="App Logo" className="size-full object-cover" />
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-normal">{steps[currentStep].howToUse}</p>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {currentStep + 1}/{steps.length}</span>
                                    <div className="flex gap-1.5">
                                        {currentStep > 0 && (
                                            <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 px-2.5 text-[11px] font-bold">Back</Button>
                                        )}
                                        <Button size="sm" onClick={handleNext} className="h-8 px-4 rounded-lg text-[11px] font-bold bg-primary text-white">
                                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
