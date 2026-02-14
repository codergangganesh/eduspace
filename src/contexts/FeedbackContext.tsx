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
    const { user, profile } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const checkFeedbackStatus = async () => {
        if (!user || hasChecked) return;

        try {
            // 1. Check if it's past the prompt hour (e.g., 6 PM)
            const currentHour = new Date().getHours();
            if (currentHour < PROMPT_HOUR) {
                // Not the right time yet, but don't mark as checked permanently 
                // so we can check again if they refresh later in the day
                return;
            }

            // 2. Check Supabase Profile for last prompt date (cross-device daily logic)
            const lastPromptedAt = profile?.last_feedback_prompt_at;
            const today = new Date().toDateString();

            if (lastPromptedAt && new Date(lastPromptedAt).toDateString() === today) {
                setHasChecked(true);
                return;
            }

            // 3. Check Supabase for previous submission
            const { data, error } = await supabase
                .from("feedbacks")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // User already submitted, never show again
                setHasChecked(true);
                return;
            }

            // Show prompt and update Supabase profile for last prompted date
            setShowPrompt(true);

            // Update profile with current timestamp so it won't show again today on any device
            await supabase
                .from("profiles")
                .update({ last_feedback_prompt_at: new Date().toISOString() })
                .eq("user_id", user.id);

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
