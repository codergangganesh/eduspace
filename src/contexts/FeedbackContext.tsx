import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FEEDBACK_LAST_PROMPTED_KEY = "eduspace_feedback_last_prompted";
const PROMPT_HOUR = 18; // 6:00 PM

interface FeedbackContextType {
    showPrompt: boolean;
    setShowPrompt: (show: boolean) => void;
    checkFeedbackStatus: () => Promise<void>;
    submitFeedback: (rating: number, message: string) => Promise<void>;
    triggerTestPrompt: () => void;
    sendTestEmail: () => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const { user, profile, updateProfile, refreshProfile } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const checkFeedbackStatus = async () => {
        if (!user || !profile || hasChecked) return;

        try {
            // 1. Check if it's past the prompt hour (e.g., 6 PM)
            const currentHour = new Date().getHours();
            if (currentHour < PROMPT_HOUR) {
                return;
            }

            // 2. Check Supabase Profile for last prompt date (7-day logic)
            const lastPromptedAt = profile.last_feedback_prompt_at;
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const now = new Date().getTime();

            if (lastPromptedAt && (now - new Date(lastPromptedAt).getTime() < sevenDaysInMs)) {
                setHasChecked(true);
                return;
            }

            // Show prompt
            setShowPrompt(true);

            // Update profile with current timestamp so it won't show again for 7 days
            await updateProfile({
                last_feedback_prompt_at: new Date().toISOString()
            });

            setHasChecked(true);


        } catch (error) {
            console.error("Error checking feedback status:", error);
        }
    };

    const submitFeedback = async (rating: number, message: string) => {
        if (!user) return;

        try {
            const { error: dbError } = await supabase
                .from("feedbacks")
                .insert({
                    user_id: user.id,
                    rating,
                    message,
                });

            if (dbError) throw dbError;

            const { error: emailError } = await supabase.functions.invoke(
                "send-feedback-email",
                {
                    body: {
                        rating,
                        message,
                        userName: profile?.full_name || user.email || "User",
                        userEmail: user.email || "No Email",
                    },
                }
            );

            if (emailError) throw emailError;

            toast.success("Thank you for your feedback!", {
                description: "Your rating helps us improve Eduspace.",
            });

            setShowPrompt(false);
        } catch (error: any) {
            console.error("Error submitting feedback:", error);
            toast.error("Failed to submit feedback", {
                description: error.message || "Please try again later.",
            });
            throw error;
        }
    };

    const triggerTestPrompt = () => {
        setShowPrompt(true);
    };

    const sendTestEmail = async () => {
        try {
            const { error } = await supabase.functions.invoke("send-feedback-email", {
                body: {
                    rating: 5,
                    message: "This is a test feedback message to verify the email system.",
                    userName: profile?.full_name || user?.email || "Tester",
                    userEmail: user?.email || "test@example.com",
                },
            });
            if (error) throw error;
            toast.success("Test email sent successfully!");
        } catch (error: any) {
            toast.error("Failed to send test email: " + error.message);
        }
    };

    return (
        <FeedbackContext.Provider
            value={{
                showPrompt,
                setShowPrompt,
                checkFeedbackStatus,
                submitFeedback,
                triggerTestPrompt,
                sendTestEmail,
            }}
        >
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedbackContext() {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error("useFeedbackContext must be used within a FeedbackProvider");
    }
    return context;
}
