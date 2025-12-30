import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/lib/notificationService";

/**
 * TEST FUNCTION: Create a sample assignment notification for the current user
 * This respects the assignment_reminders preference
 */
export async function createTestAssignmentNotificationWithPreference() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user logged in");
        return { success: false, error: "No user logged in" };
    }

    // Check if user has assignment_reminders enabled
    const { data: profile } = await supabase
        .from("profiles")
        .select("assignment_reminders")
        .eq("user_id", user.id)
        .single();

    if (!profile?.assignment_reminders) {
        console.log("Assignment reminders are disabled for this user");
        return {
            success: true,
            message: "Notification not sent - assignment reminders disabled",
            reminderStatus: false
        };
    }

    // User has reminders enabled, send notification
    const result = await createNotification({
        userId: user.id,
        title: "New Assignment Posted",
        message: "Introduction to React Hooks - Due December 31, 2025",
        type: "assignment",
    });

    return {
        ...result,
        reminderStatus: true,
        message: "Notification sent - assignment reminders enabled"
    };
}

/**
 * TEST FUNCTION: Toggle assignment reminders and test notification
 */
export async function testAssignmentReminderToggle() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "No user logged in" };
    }

    // Get current setting
    const { data: profile } = await supabase
        .from("profiles")
        .select("assignment_reminders")
        .eq("user_id", user.id)
        .single();

    const currentSetting = profile?.assignment_reminders ?? false;

    console.log(`Current assignment_reminders setting: ${currentSetting}`);
    console.log(`If you create an assignment notification now, it will ${currentSetting ? 'BE SENT' : 'NOT BE SENT'}`);

    return {
        success: true,
        currentSetting,
        willReceiveNotifications: currentSetting
    };
}
