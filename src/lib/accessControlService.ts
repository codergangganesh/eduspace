import { supabase } from "@/integrations/supabase/client";

/**
 * Validate if a lecturer has access to a specific class
 */
export async function validateLecturerAccess(userId: string, classId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('id')
            .eq('id', classId)
            .eq('lecturer_id', userId)
            .single();

        return !error && !!data;
    } catch (err) {
        console.error('Error validating lecturer access:', err);
        return false;
    }
}

/**
 * Validate if a student is enrolled in a class (has accepted invitation)
 */
export async function validateStudentEnrollment(userId: string, classId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('class_students')
            .select('id')
            .eq('class_id', classId)
            .eq('student_id', userId)
            .single();

        return !error && !!data;
    } catch (err) {
        console.error('Error validating student enrollment:', err);
        return false;
    }
}

/**
 * Prevent students from self-joining classes
 * Returns true if action is allowed, false if blocked
 */
export async function preventSelfJoin(userId: string): Promise<{ allowed: boolean; message?: string }> {
    try {
        // Check if user is a student
        const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (studentProfile) {
            return {
                allowed: false,
                message: 'Students cannot join classes directly. You must be invited by a lecturer.'
            };
        }

        return { allowed: true };
    } catch (err) {
        console.error('Error checking self-join prevention:', err);
        return { allowed: false, message: 'Unable to verify access permissions' };
    }
}

/**
 * Validate if a user can perform a specific action based on their role
 */
export async function validateRoleAction(
    userId: string,
    action: 'create_class' | 'invite_students' | 'manage_assignments' | 'join_class' | 'submit_assignment'
): Promise<{ allowed: boolean; message?: string }> {
    try {
        // Get user role
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

        if (!userRole) {
            return { allowed: false, message: 'User role not found' };
        }

        const role = userRole.role;

        // Define role-based permissions
        const permissions: Record<string, string[]> = {
            lecturer: ['create_class', 'invite_students', 'manage_assignments'],
            student: ['join_class', 'submit_assignment']
        };

        const allowedActions = permissions[role] || [];

        if (!allowedActions.includes(action)) {
            return {
                allowed: false,
                message: `${role}s are not allowed to perform this action`
            };
        }

        return { allowed: true };
    } catch (err) {
        console.error('Error validating role action:', err);
        return { allowed: false, message: 'Unable to verify permissions' };
    }
}

/**
 * Check if a student has pending invitations
 */
export async function checkPendingInvitations(email: string): Promise<{ hasPending: boolean; count: number }> {
    try {
        const { data, error } = await supabase
            .from('access_requests')
            .select('id')
            .eq('student_email', email)
            .eq('status', 'pending');

        if (error) throw error;

        return {
            hasPending: (data?.length || 0) > 0,
            count: data?.length || 0
        };
    } catch (err) {
        console.error('Error checking pending invitations:', err);
        return { hasPending: false, count: 0 };
    }
}

/**
 * Verify that only enrolled students can access class resources
 */
export async function validateClassResourceAccess(
    userId: string,
    classId: string,
    resourceType: 'assignment' | 'schedule' | 'message' | 'notification'
): Promise<{ allowed: boolean; message?: string }> {
    try {
        // Check if user is the lecturer
        const isLecturer = await validateLecturerAccess(userId, classId);
        if (isLecturer) {
            return { allowed: true };
        }

        // Check if user is an enrolled student
        const isEnrolled = await validateStudentEnrollment(userId, classId);
        if (isEnrolled) {
            return { allowed: true };
        }

        return {
            allowed: false,
            message: `You must be enrolled in this class to access ${resourceType}s`
        };
    } catch (err) {
        console.error('Error validating resource access:', err);
        return { allowed: false, message: 'Unable to verify access permissions' };
    }
}
