import React, { useState, useEffect } from "react";
import { Star, X, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, message: string) => Promise<void>;
    appName?: string;
    logoSrc?: string;
}

export function FeedbackPrompt({
    isOpen,
    onClose,
    onSubmit,
    appName = "Eduspace",
    logoSrc = "/favicon.png",
}: FeedbackPromptProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await onSubmit(rating, message);
            onClose();
        } catch (error) {
            console.error("Feedback submission failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                    {/* Backdrop for Desktop */}
                    {!isMobile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                        />
                    )}

                    {/* Modal / Bottom Sheet */}
                    <motion.div
                        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "border pointer-events-auto overflow-hidden",
                            "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)]",
                            "dark:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                            isMobile
                                ? "fixed bottom-0 left-0 right-0 rounded-t-[2rem] p-6 pb-10"
                                : "relative w-full max-w-md rounded-[2rem] p-8"
                        )}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted-foreground shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Content */}
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Logo & Header */}
                            <div className="space-y-3">
                                <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto border border-primary/20 shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)]">
                                    <img src={logoSrc} alt={appName} className="size-10 object-contain" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                        Enjoying {appName}?
                                    </h2>
                                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                                        Your feedback helps us make {appName} better for everyone.
                                    </p>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-all active:scale-90 group rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 shadow-[2px_2px_4px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.25),-2px_-2px_4px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]"
                                    >
                                        <Star
                                            className={cn(
                                                "size-10 transition-all duration-200",
                                                (hoverRating || rating) >= star
                                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                                                    : "text-muted-foreground/30"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* Message Box & Submit Button */}
                            <div className="w-full space-y-4">
                                <div className="relative">
                                    <Textarea
                                        placeholder="Tell us what you think (optional)..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className={cn(
                                            "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 focus:ring-primary/20 focus:border-primary resize-none p-4 rounded-xl",
                                            "shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]",
                                            "dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.05)]",
                                            isMobile ? "min-h-[80px]" : "min-h-[100px]"
                                        )}
                                    />
                                    <MessageSquare className="absolute bottom-3 right-3 size-4 text-muted-foreground/30" />
                                </div>

                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || rating === 0}
                                    className="w-full h-12 rounded-xl text-base font-semibold transition-all gap-2 bg-gradient-to-br from-primary to-primary/90 shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.4)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.25)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            Submit Feedback
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Skip Link (Always visible if no rating on mobile, or just as a secondary option) */}
                            {rating === 0 && (
                                <button
                                    onClick={onClose}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Maybe later
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
