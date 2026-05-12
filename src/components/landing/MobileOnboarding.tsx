import { useState } from "react";
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
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1000", // Representative image of a child learning
    },
    {
        title: "Quizzes & Assignments",
        subtitle: "Interactive Learning Tools",
        description: "Take quizzes, submit assignments, and track your progress. Get instant feedback and improve your performance continuously.",
        icon: FileText,
        color: "bg-emerald-500",
        lightColor: "text-emerald-500",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=1000", // Person holding phone
    },
    {
        title: "Private Video Calls",
        subtitle: "Face-to-Face Learning",
        description: "Schedule one-on-one sessions with instructors. Get personalized attention and clear your doubts through private video calls.",
        icon: Video,
        color: "bg-pink-600",
        lightColor: "text-pink-600",
        image: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=1000", // Video call screen
    },
    {
        title: "Real-Time Messaging",
        subtitle: "Stay Connected Always",
        description: "Chat with classmates and instructors instantly. Share files, discuss topics, and get help whenever you need it.",
        icon: MessageSquare,
        color: "bg-orange-600",
        lightColor: "text-orange-600",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1000", // Fingers typing on smart phone
    },
    {
        title: "Meeting Management",
        subtitle: "Schedule & Organize",
        description: "Create and manage meetings effortlessly. Set up classes, study groups, and consultation sessions with built-in calendar integration.",
        icon: Calendar,
        color: "bg-blue-500",
        lightColor: "text-blue-500",
        image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1000", // Calendar illustration
    }
];

interface MobileOnboardingProps {
    onComplete: () => void;
}

export function MobileOnboarding({ onComplete }: MobileOnboardingProps) {
    const [showSplash, setShowSplash] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    if (showSplash) {
        return <MobileSplashScreen onComplete={() => setShowSplash(false)} />;
    }

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
        <div className="fixed inset-0 z-[200] flex min-h-[100dvh] flex-col overflow-hidden bg-white font-sans dark:bg-slate-950">
            {/* Top Illustration Area with Gradient Background */}
            <div className={`relative w-full overflow-hidden transition-colors duration-500 h-[42svh] min-h-[280px] max-h-[390px] sm:h-[45%] ${slide.color}`}>
                {/* Background Shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-3xl"></div>

                {/* Branding: Logo and Name */}
                <div className="absolute left-4 z-30 flex items-center gap-2 top-[calc(1rem+var(--safe-top))]">
                    <div className="size-8 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">
                        Eduspace
                    </span>
                </div>

                {/* Skip Button */}
                <div className="absolute right-4 z-30 top-[calc(1rem+var(--safe-top))]">
                    <button
                        onClick={onComplete}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-2 px-6 rounded-full text-sm transition-all"
                    >
                        Skip
                    </button>
                </div>

                {/* Main Image in the center */}
                <div className="absolute inset-0 flex items-center justify-center px-5 pb-6 pt-20 sm:p-8 sm:pt-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="relative flex h-full w-full items-center justify-center"
                        >
                            <div className="relative flex aspect-square w-full max-w-[260px] items-center justify-center overflow-visible rounded-[32px] bg-white/10 p-3 shadow-2xl backdrop-blur-[2px] sm:max-w-[280px]">
                                <img
                                    src={slide.image}
                                    alt={slide.title}
                                    className="h-full w-full rounded-[26px] object-contain object-center bg-white/12"
                                />
                            </div>

                            {/* Overlay Icon */}
                            <div className="absolute left-1 top-1 bg-white p-3 rounded-[18px] shadow-xl sm:-left-4 sm:-top-4 sm:p-4 sm:rounded-[20px]">
                                <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${slide.lightColor}`} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex flex-1 flex-col items-center bg-white px-5 pt-6 pb-[calc(1.5rem+var(--safe-bottom))] dark:bg-slate-900 sm:px-8 sm:pt-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full flex flex-col items-center text-center"
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

                {/* Page Indicator / Steps */}
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

                {/* Navigation Buttons */}
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
        </div>
    );
}
