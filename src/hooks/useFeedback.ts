import { useFeedbackContext } from "@/contexts/FeedbackContext";

/**
 * Hook to access the global feedback system.
 * Now wraps useFeedbackContext to ensure consistent state across the app.
 */
export function useFeedback() {
    return useFeedbackContext();
}
