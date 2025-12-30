import { supabase } from "@/integrations/supabase/client";

/**
 * Permanently deletes all user data and resets the profile to default values.
 * This effectively "factory resets" the account while keeping the login credentials.
 */
export const deleteUserAccount = async (userId: string) => {
    try {
        // 1. Delete all notifications
        const { error: notificationsError } = await supabase
            .from("notifications")
            .delete()
            .eq("user_id", userId);

        if (notificationsError) throw new Error(`Notifications deletion failed: ${notificationsError.message}`);

        // 2. Delete all messages (sent by user) & received messages
        // Note: This might leave "ghost" messages for other users if we just delete rows.
        // However, for a full wipe, deleting rows is the cleaner approach for the user.
        // Ideally, we'd replace content with "Message deleted", but user wants "data removed".
        const { error: sentMessagesError } = await supabase
            .from("messages")
            .delete()
            .eq("sender_id", userId);

        if (sentMessagesError) throw new Error(`Sent messages deletion failed: ${sentMessagesError.message}`);

        // We also delete received messages to clear their inbox
        const { error: receivedMessagesError } = await supabase
            .from("messages")
            .delete()
            .eq("receiver_id", userId);

        if (receivedMessagesError) throw new Error(`Received messages deletion failed: ${receivedMessagesError.message}`);

        // 3. Delete course enrollments
        try {
            const { error: enrollmentsError } = await supabase
                .from("course_enrollments" as any) // Cast to any to bypass type check for missing table
                .delete()
                .eq("student_id", userId);

            if (enrollmentsError) {
                // Only throw if it's NOT a "table missing" error
                if (!enrollmentsError.message.includes("Could not find the table") &&
                    !enrollmentsError.message.includes("does not exist")) {
                    throw new Error(`Enrollments deletion failed: ${enrollmentsError.message}`);
                } else {
                    console.warn("Skipping enrollments deletion: Table does not exist.");
                }
            }
        } catch (err) {
            // If the Supabase client throws synchronously (validation), catch it here
            console.warn("Skipping enrollments deletion: Table likely missing.", err);
        }

        // 4. Delete from conversations (participation)
        // This is tricky as it affects others. We'll skip deleting the conversation row itself
        // to avoid breaking the other person's view, but the messages are gone.
        // If we wanted to go further, we could delete conversations where they are the ONLY participant?
        // For now, let's leave conversation rows. They will just show empty history.

        // 5. Reset Profile
        // We update the profile to remove all personal identifiers
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: "User", // Generic name
                phone: null,
                date_of_birth: null,
                bio: null,
                student_id: null,
                program: null,
                year: null,
                department: null,
                gpa: null,
                credits_completed: null,
                credits_required: null,
                advisor: null,
                enrollment_date: null,
                expected_graduation: null,
                avatar_url: null,
                street: null,
                city: null,
                state: null,
                zip_code: null,
                country: null,
                // Reset preferences
                email_notifications: true,
                push_notifications: true,
                sms_notifications: false,
                assignment_reminders: true,
                grade_updates: true,
                course_announcements: true,
                weekly_digest: false,
                language: "en",
                timezone: "America/New_York",
                theme: "system",
            })
            .eq("user_id", userId);

        if (profileError) throw new Error(`Profile reset failed: ${profileError.message}`);

        // 6. Delete User Role?
        // If we delete the role, they will be prompted to select one again on next login (via AuthCallback).
        // This supports the "fresh account" feel.
        const { error: roleError } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", userId);

        if (roleError) throw new Error(`Role deletion failed: ${roleError.message}`);

        return { success: true };

    } catch (error: any) {
        console.error("Delete account error:", error);
        return { success: false, error: error.message };
    }
};
