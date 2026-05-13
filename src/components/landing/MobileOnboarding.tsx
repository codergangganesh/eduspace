import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, Video, FileText, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSplashScreen } from "./MobileSplashScreen";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
    {
        title: "Welcome to EduSpace",
        subtitle: "Your All-in-One Educational Platform",
        description: "Connect lecturers and students in a seamless learning environment. Everything you need for modern education in one place.",
        icon: GraduationCap,
        color: "bg-indigo-600",
        lightColor: "text-indigo-600",
        image: "/dashboard-icon.png",
    },
    {
        title: "Quizzes & Assignments",
        subtitle: "Interactive Learning Tools",
        description: "Take quizzes, submit assignments, and track your progress. Get instant feedback and improve your performance continuously.",
        icon: FileText,
        color: "bg-emerald-500",
        lightColor: "text-emerald-500",
        image: "/assignment-icon.png",
    },
    {
        title: "Private Video Calls",
        subtitle: "Face-to-Face Learning",
        description: "Schedule one-on-one sessions with instructors. Get personalized attention and clear your doubts through private video calls.",
        icon: Video,
        color: "bg-pink-600",
        lightColor: "text-pink-600",
        image: "/ai-tutor.png",
    },
    {
        title: "Real-Time Messaging",
        subtitle: "Stay Connected Always",
        description: "Chat with classmates and instructors instantly. Share files, discuss topics, and get help whenever you need it.",
        icon: MessageSquare,
        color: "bg-orange-600",
        lightColor: "text-orange-600",
        image: "/messages-icon.png",
    },
    {
        title: "Meeting Management",
        subtitle: "Schedule & Organize",
        description: "Create and manage meetings effortlessly. Set up classes, study groups, and consultation sessions with built-in calendar integration.",
        icon: Calendar,
        color: "bg-blue-500",
        lightColor: "text-blue-500",
        image: "/schedule-icon.png",
    }
];

interface MobileOnboardingProps {
    onComplete: () => void;
}

export function MobileOnboarding({ onComplete }: MobileOnboardingProps) {
    const [showSplash, setShowSplash] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    useEffect(() => {
        slides.forEach((slide) => {
            const image = new Image();
            image.decoding = "async";
            image.src = slide.image;
        });
    }, []);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;

    return (
        <AnimatePresence mode="wait">
            {showSplash ? (
                <motion.div
                    key="mobile-splash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isVisible ? 1 : 0 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <MobileSplashScreen onComplete={() => setShowSplash(false)} />
                </motion.div>
            ) : (
                <motion.div
                    key="mobile-onboarding"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col overflow-hidden bg-white font-sans dark:bg-slate-950"
                >
                    <div className={`relative h-[44dvh] min-h-[300px] max-h-[420px] w-full overflow-hidden transition-colors duration-500 sm:h-[45%] ${slide.color}`}>
                        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-white/10 blur-3xl"></div>
                        <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-white/20 blur-3xl"></div>

                        <div className="absolute left-4 z-30 flex items-center gap-2 top-[calc(1rem+var(--safe-top))]">
                            <div className="size-8 overflow-hidden rounded-lg border border-white/20 shadow-lg">
                                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">
                                Eduspace
                            </span>
                        </div>

                        <div className="absolute right-4 z-30 top-[calc(1rem+var(--safe-top))]">
                            <button
                                onClick={onComplete}
                                className="rounded-full bg-white/20 px-6 py-2 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/30"
                            >
                                Skip
                            </button>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center px-4 pb-5 pt-20 sm:p-8 sm:pt-16">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="relative flex h-full w-full items-center justify-center"
                                >
                                    <div className="relative flex aspect-[1/1] w-full max-w-[min(78vw,320px)] items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-white/12 p-3 shadow-2xl backdrop-blur-[2px] sm:max-w-[280px]">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            loading={currentSlide === 0 ? "eager" : "lazy"}
                                            fetchPriority={currentSlide === 0 ? "high" : "auto"}
                                            decoding="async"
                                            className="h-full w-full rounded-[26px] bg-white/10 object-cover object-center"
                                        />
                                    </div>

                                    <div className="absolute left-1 top-1 rounded-[18px] bg-white p-3 shadow-xl sm:-left-4 sm:-top-4 sm:rounded-[20px] sm:p-4">
                                        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${slide.lightColor}`} />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col items-center bg-white px-5 pt-6 pb-[calc(1.5rem+var(--safe-bottom))] dark:bg-slate-900 sm:px-8 sm:pt-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex w-full flex-col items-center text-center"
                            >
                                <h2 className="mb-2 text-[28px] font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[32px]">
                                    {slide.title}
                                </h2>
                                <h3 className={`mb-4 text-lg font-bold sm:mb-6 sm:text-xl ${slide.lightColor}`}>
                                    {slide.subtitle}
                                </h3>
                                <p className="mb-6 max-w-[320px] text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:mb-8 sm:text-base">
                                    {slide.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mb-8 flex gap-2 sm:mb-10">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                        ? `w-10 ${slide.color}`
                                        : "w-2 bg-slate-200 dark:bg-slate-800"
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="mt-auto flex w-full gap-3 sm:gap-4">
                            {currentSlide > 0 ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        className="h-14 flex-1 rounded-[24px] border-slate-200 text-base font-bold text-slate-900 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 sm:h-16 sm:text-lg"
                                    >
                                        <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                                    </Button>
                                    <Button
                                        onClick={handleNext}
                                        className={`h-14 flex-1 rounded-[24px] border-none text-base font-bold text-white shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95 sm:h-16 sm:text-lg ${slide.color}`}
                                    >
                                        {currentSlide === slides.length - 1 ? "Get Started" : "Next"} <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleNext}
                                    className={`h-14 w-full rounded-[24px] border-none text-base font-bold text-white shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95 sm:h-16 sm:text-lg ${slide.color}`}
                                >
                                    Next <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
