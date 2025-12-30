import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notificationService";

/**
 * TEST FUNCTION: Create a sample notification for the current user
 * This is for testing purposes to see notifications working
 */
export async function createTestNotification() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user logged in");
        return { success: false, error: "No user logged in" };
    }

    return createNotification({
        userId: user.id,
        title: "Welcome to EduSpace!",
        message: "Your notification system is working perfectly. You'll receive updates about assignments, grades, and announcements here.",
        type: "announcement",
    });
}

/**
 * TEST FUNCTION: Create a sample assignment notification
 */
export async function createTestAssignmentNotification() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user logged in");
        return { success: false, error: "No user logged in" };
    }

    return createNotification({
        userId: user.id,
        title: "New Assignment Posted",
        message: "Introduction to React Hooks - Due December 31, 2025",
        type: "assignment",
    });
}

/**
 * TEST FUNCTION: Create a sample grade notification
 */
export async function createTestGradeNotification() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user logged in");
        return { success: false, error: "No user logged in" };
    }

    return createNotification({
        userId: user.id,
        title: "Grade Posted",
        message: "Your grade for 'Database Design Project' is A (95/100)",
        type: "grade",
    });
}
