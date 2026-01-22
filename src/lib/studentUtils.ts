import { supabase } from "@/integrations/supabase/client";

/**
 * Helper to reliably fetch enrolled/accepted class IDs for a student.
 * 
 * Logic:
 * 1. Checks `access_requests` for status='accepted'.
 * 2. Fallback: Checks `class_students` but excludes any classes that have a 'pending' or 'rejected' request.
 * 
 * This ensures strict adherence to the rule: "Students receive notifications only after accepting".
 */
export async function getEnrolledClassIds(userId: string): Promise<string[]> {
    try {
        // Fetch accepted classes from access_requests
        const { data: acceptedRequests } = await supabase
            .from('access_requests')
            .select('class_id')
            .eq('student_id', userId)
            .eq('status', 'accepted');

        let enrolledClassIds: string[] = [];

        if (acceptedRequests && acceptedRequests.length > 0) {
            enrolledClassIds = acceptedRequests.map(r => r.class_id);
        }

        // Fallback logic for legacy/direct enrollments without access requests
        // OR to be robust against mixed states

        // 1. Start with accepted requests
        const acceptedIds = new Set(enrolledClassIds);

        // 2. Check class_students (potential enrollments)
        const { data: directEnrollments } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', userId);

        // 3. Check pending/rejected to exclude
        const { data: excludedRequests } = await supabase
            .from('access_requests')
            .select('class_id')
            .eq('student_id', userId)
            .neq('status', 'accepted'); // Exclude anything not accepted

        const excludedIds = new Set(excludedRequests?.map(r => r.class_id) || []);

        directEnrollments?.forEach(e => {
            if (!excludedIds.has(e.class_id)) {
                acceptedIds.add(e.class_id);
            }
        });

        return Array.from(acceptedIds);
    } catch (err) {
        console.error('Error fetching enrolled class IDs:', err);
        return [];
    }
}
