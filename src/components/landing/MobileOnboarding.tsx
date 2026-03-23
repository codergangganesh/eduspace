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
        <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
            {/* Top Illustration Area with Gradient Background */}
            <div className={`relative h-[45%] w-full overflow-hidden transition-colors duration-500 ${slide.color}`}>
                {/* Background Shapes */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-3xl"></div>

                {/* Branding: Logo and Name */}
                <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                    <div className="size-8 rounded-lg overflow-hidden border border-white/20 shadow-lg">
                        <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">
                        Eduspace
                    </span>
                </div>

                {/* Skip Button */}
                <div className="absolute top-4 right-4 z-30">
                    <button
                        onClick={onComplete}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-2 px-6 rounded-full text-sm transition-all"
                    >
                        Skip
                    </button>
                </div>

                {/* Main Image in the center */}
                <div className="absolute inset-0 flex items-center justify-center p-8 pt-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="relative w-full h-full max-w-[280px] max-h-[280px]"
                        >
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover rounded-[32px] shadow-2xl"
                            />

                            {/* Overlay Icon */}
                            <div className="absolute -top-4 -left-4 bg-white p-4 rounded-[20px] shadow-xl">
                                <Icon className={`w-8 h-8 ${slide.lightColor}`} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-900 px-8 pt-10 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full flex flex-col items-center text-center"
                    >
                        <h2 className="text-[32px] font-black text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">
                            {slide.title}
                        </h2>
                        <h3 className={`text-xl font-bold ${slide.lightColor} mb-6`}>
                            {slide.subtitle}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8 max-w-[320px]">
                            {slide.description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Page Indicator / Steps */}
                <div className="flex gap-2 mb-10">
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
                <div className="w-full flex gap-4 mt-auto mb-10">
                    {currentSlide > 0 ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1 h-16 rounded-[24px] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                            </Button>
                            <Button
                                onClick={handleNext}
                                className={`flex-1 h-16 rounded-[24px] font-bold text-lg text-white shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all ${slide.color} border-none`}
                            >
                                {currentSlide === slides.length - 1 ? "Get Started" : "Next"} <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleNext}
                            className={`w-full h-16 rounded-[24px] font-bold text-lg text-white shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all ${slide.color} border-none`}
                        >
                            Next <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
