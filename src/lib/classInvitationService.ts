import { supabase } from "@/integrations/supabase/client";
import { notifyAccessRequest, notifyLecturer } from "./notificationService";

export interface InvitationResult {
    success: boolean;
    sent: number;
    skipped: number;
    failed: number;
    message: string;
    errors?: string[];
}

/**
 * Send invitations to all students in a class
 */
export async function sendInvitationsToClass(classId: string): Promise<InvitationResult> {
    try {
        // Get class details
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('course_code, class_name, lecturer_id, lecturer_name, lecturer_department, semester, academic_year')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            throw new Error('Class not found');
        }

        // Get all students in the class
        const { data: students, error: studentsError } = await supabase
            .from('class_students')
            .select('id, student_id, email, student_name, register_number')
            .eq('class_id', classId);

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
            return {
                success: true,
                sent: 0,
                skipped: 0,
                failed: 0,
                message: 'No students found in this class'
            };
        }

        let sent = 0;
        let skipped = 0;
        let failed = 0;
        const errors: string[] = [];

        // 1. Fetch all existing access requests in one batch query
        const studentEmails = students.map(s => s.email).filter(Boolean);
        let existingSet = new Set<string>();

        if (studentEmails.length > 0) {
            const { data: existingRequests } = await supabase
                .from('access_requests')
                .select('student_email')
                .eq('class_id', classId)
                .in('student_email', studentEmails);
            existingSet = new Set((existingRequests || []).map(r => r.student_email));
        }

        // 2. Filter students who need invitations
        const studentsToInvite = students.filter(s => {
            if (existingSet.has(s.email)) {
                skipped++;
                return false;
            }
            return true;
        });

        if (studentsToInvite.length > 0) {
            // 2.5 Verify which student_ids actually exist in profiles
            const studentIdsToCheck = studentsToInvite.map(s => s.student_id).filter(Boolean);
            const validStudentIds = new Set<string>();
            
            if (studentIdsToCheck.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .in('user_id', studentIdsToCheck);
                
                (profiles || []).forEach(p => validStudentIds.add(p.user_id));
            }

            // 3. Batch insert new requests
            const newRequestsData = studentsToInvite.map(student => ({
                class_id: classId,
                lecturer_id: classData.lecturer_id,
                student_id: student.student_id && validStudentIds.has(student.student_id) ? student.student_id : null,
                student_email: student.email,
                status: 'pending',
                invitation_email_sent: false
            }));

            const { data: insertedRequests, error: insertError } = await supabase
                .from('access_requests')
                .insert(newRequestsData)
                .select();

            if (insertError) {
                console.error('Error batch inserting access requests:', insertError);
                throw insertError;
            }

            // 4. Queue notifications/emails with controlled concurrency (chunked processing)
            const PROCESS_BATCH_SIZE = 10;
            const DELAY_MS = 50;

            const processStudent = async (student: any) => {
                const request = (insertedRequests || []).find(r => r.student_email === student.email);
                if (!request) return;

                const hasValidId = student.student_id && validStudentIds.has(student.student_id);

                try {
                    if (hasValidId) {
                        await notifyAccessRequest(
                            student.student_id,
                            classData.lecturer_name || 'A lecturer',
                            classData.course_code,
                            classId,
                            request.id
                        );
                    } else {
                        // Send SMTP email to non-registered students
                        const { error: emailError } = await supabase.functions.invoke('send-class-invitation-email', {
                            body: {
                                studentEmail: student.email,
                                studentName: student.student_name,
                                lecturerName: classData.lecturer_name || 'Your Lecturer',
                                courseCode: classData.course_code,
                                className: classData.class_name || '',
                                semester: classData.semester || '',
                                academicYear: classData.academic_year || ''
                            }
                        });

                        if (!emailError) {
                            // Fire-and-forget: update email sent status
                            supabase
                                .from('access_requests')
                                .update({
                                    invitation_email_sent: true,
                                    invitation_email_sent_at: new Date().toISOString()
                                })
                                .eq('id', request.id)
                                .then(() => {});
                        } else {
                            console.error('Error sending invitation email:', emailError);
                        }
                    }
                    // Since multiple promises resolve in parallel, safely increment counter
                    sent++;
                } catch (err) {
                    console.error('Error processing student notification:', student.email, err);
                    failed++;
                    errors.push(`Failed to process ${student.email}`);
                }
            };

            for (let i = 0; i < studentsToInvite.length; i += PROCESS_BATCH_SIZE) {
                const chunk = studentsToInvite.slice(i, i + PROCESS_BATCH_SIZE);
                await Promise.all(chunk.map(processStudent));
                if (i + PROCESS_BATCH_SIZE < studentsToInvite.length) {
                    await new Promise(res => setTimeout(res, DELAY_MS));
                }
            }
        }

        return {
            success: true,
            sent,
            skipped,
            failed,
            message: `Sent ${sent} invitations, skipped ${skipped} (already sent), failed ${failed}`,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (err) {
        console.error('Error sending invitations:', err);
        return {
            success: false,
            sent: 0,
            skipped: 0,
            failed: 0,
            message: err instanceof Error ? err.message : 'Failed to send invitations',
            errors: [err instanceof Error ? err.message : 'Unknown error']
        };
    }
}

/**
 * Send invitation to a single student
 */
export async function sendInvitationToStudent(classId: string, studentEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get class details
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('course_code, class_name, lecturer_id, lecturer_name')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            throw new Error('Class not found');
        }

        // Get student from class_students
        const { data: student } = await supabase
            .from('class_students')
            .select('id, student_id, email, student_name')
            .eq('class_id', classId)
            .eq('email', studentEmail)
            .single();

        if (!student) {
            throw new Error('Student not found in this class');
        }

        // Check if access request already exists
        const { data: existing } = await supabase
            .from('access_requests')
            .select('id')
            .eq('class_id', classId)
            .eq('student_email', studentEmail)
            .maybeSingle();

        if (existing) {
            throw new Error('Invitation already sent to this student');
        }

        // Verify if student_id still exists in profiles to avoid foreign key violations
        let validStudentId = student.student_id;
        if (validStudentId) {
            const { data: profileCheck } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', validStudentId)
                .maybeSingle();
                
            if (!profileCheck) {
                validStudentId = null;
            }
        }

        // Create access request
        const { data: newRequest, error: requestError } = await supabase
            .from('access_requests')
            .insert({
                class_id: classId,
                lecturer_id: classData.lecturer_id,
                student_id: validStudentId,
                student_email: studentEmail,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) throw requestError;

        // Send notification if student has account
        if (validStudentId) {
            await notifyAccessRequest(
                validStudentId,
                classData.lecturer_name || 'A lecturer',
                classData.course_code,
                classId,
                newRequest.id
            );
        }

        return { success: true };
    } catch (err) {
        console.error('Error sending invitation:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to send invitation'
        };
    }
}

/**
 * Accept a class invitation
 */
export async function acceptInvitation(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get the request details
        const { data: request, error: requestError } = await supabase
            .from('access_requests')
            .select('*, classes(course_code, class_name, lecturer_id)')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            throw new Error('Access request not found');
        }

        // Update access request status
        const { error: updateError } = await supabase
            .from('access_requests')
            .update({
                status: 'accepted',
                student_id: userId,
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Link student to class_students
        const { error: linkError } = await supabase
            .from('class_students')
            .update({ student_id: userId })
            .eq('class_id', request.class_id)
            .eq('email', request.student_email);

        if (linkError) {
            console.error('Error linking student to class:', linkError);
        }

        // Mark related notification as read
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('related_id', requestId)
            .eq('type', 'access_request');

        // Notify lecturer about acceptance
        try {
            // Get student name
            const { data: studentProfile } = await supabase
                .from('student_profiles')
                .select('full_name')
                .eq('user_id', userId)
                .single();

            const studentName = studentProfile?.full_name || request.student_email;

            await notifyLecturer(
                request.classes.lecturer_id,
                'access_request',
                'Class Invitation Accepted',
                `${studentName} has accepted the invitation to join ${request.classes.course_code}${request.classes.class_name ? ` - ${request.classes.class_name}` : ''}`,
                request.class_id,
                userId,
                requestId
            );
        } catch (notifErr) {
            console.error('Failed to notify lecturer about acceptance:', notifErr);
        }

        return { success: true };
    } catch (err) {
        console.error('Error accepting invitation:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to accept invitation'
        };
    }
}

/**
 * Reject a class invitation
 */
export async function rejectInvitation(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get the request details
        const { data: request, error: requestError } = await supabase
            .from('access_requests')
            .select('*, classes(course_code, class_name, lecturer_id, lecturer_name)')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            throw new Error('Access request not found');
        }

        // Update access request status
        const { error: updateError } = await supabase
            .from('access_requests')
            .update({
                status: 'rejected',
                student_id: userId,
                responded_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Get student name
        const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('full_name')
            .eq('user_id', userId)
            .single();

        const studentName = studentProfile?.full_name || request.student_email;

        // Notify lecturer of rejection
        await notifyLecturer(
            request.classes.lecturer_id,
            'access_request',
            'Class Invitation Rejected',
            `${studentName} has declined the invitation to join ${request.classes.course_code}${request.classes.class_name ? ` - ${request.classes.class_name}` : ''}`,
            request.class_id,
            userId,
            requestId
        );

        // Mark related notification as read
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('related_id', requestId)
            .eq('type', 'access_request');

        return { success: true };
    } catch (err) {
        console.error('Error rejecting invitation:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to reject invitation'
        };
    }
}

/**
 * Get all pending invitations for a student email
 */
export async function getStudentPendingInvitations(email: string) {
    try {
        const { data, error } = await supabase
            .from('access_requests')
            .select(`
                *,
                classes (
                    course_code,
                    class_name,
                    semester,
                    academic_year,
                    lecturer_name,
                    lecturer_department
                )
            `)
            .eq('student_email', email)
            .eq('status', 'pending')
            .order('sent_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (err) {
        console.error('Error fetching pending invitations:', err);
        return {
            success: false,
            data: [],
            error: err instanceof Error ? err.message : 'Failed to fetch invitations'
        };
    }
}

/**
 * Resend invitation to a student (for rejected or dismissed pending requests)
 */
export async function resendInvitationToStudent(classId: string, studentEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Get class details
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('course_code, class_name, lecturer_id, lecturer_name')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            throw new Error('Class not found');
        }

        // Get student from class_students
        const { data: student } = await supabase
            .from('class_students')
            .select('id, student_id, email, student_name')
            .eq('class_id', classId)
            .eq('email', studentEmail)
            .single();

        if (!student) {
            throw new Error('Student not found in this class');
        }

        // Check if access request exists
        const { data: existing } = await supabase
            .from('access_requests')
            .select('id, status')
            .eq('class_id', classId)
            .eq('student_email', studentEmail)
            .maybeSingle();

        let requestId: string;

        // Verify if student_id still exists in profiles to avoid foreign key violations
        let validStudentId = student.student_id;
        if (validStudentId) {
            const { data: profileCheck } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', validStudentId)
                .maybeSingle();
                
            if (!profileCheck) {
                validStudentId = null;
            }
        }

        if (existing) {
            // Update existing request to pending
            const { error: updateError } = await supabase
                .from('access_requests')
                .update({
                    status: 'pending',
                    responded_at: null,
                    sent_at: new Date().toISOString(),
                    student_id: validStudentId
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;
            requestId = existing.id;
        } else {
            // Create new access request
            const { data: newRequest, error: requestError } = await supabase
                .from('access_requests')
                .insert({
                    class_id: classId,
                    lecturer_id: classData.lecturer_id,
                    student_id: validStudentId,
                    student_email: studentEmail,
                    status: 'pending'
                })
                .select()
                .single();

            if (requestError) throw requestError;
            requestId = newRequest.id;
        }

        // Send notification if student has account
        if (validStudentId) {
            await notifyAccessRequest(
                validStudentId,
                classData.lecturer_name || 'A lecturer',
                classData.course_code,
                classId,
                requestId
            );
        } else {
            // Send SMTP email to non-registered students
            try {
                const { error: emailError } = await supabase.functions.invoke('send-class-invitation-email', {
                    body: {
                        studentEmail: student.email,
                        studentName: student.student_name,
                        lecturerName: classData.lecturer_name || 'Your Lecturer',
                        courseCode: classData.course_code,
                        className: classData.class_name || '',
                    }
                });

                if (!emailError) {
                    // Mark email as sent
                    await supabase
                        .from('access_requests')
                        .update({
                            invitation_email_sent: true,
                            invitation_email_sent_at: new Date().toISOString()
                        })
                        .eq('id', requestId);
                }
            } catch (emailErr) {
                console.error('Failed to send invitation email:', emailErr);
            }
        }

        return { success: true };
    } catch (err) {
        console.error('Error resending invitation:', err);
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to resend invitation'
        };
    }
}

/**
 * Resend invitations to all non-accepted students in a class
 */
export async function resendInvitationsToAll(classId: string): Promise<InvitationResult> {
    try {
        // Get class details
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('course_code, class_name, lecturer_id, lecturer_name, lecturer_department')
            .eq('id', classId)
            .single();

        if (classError || !classData) {
            throw new Error('Class not found');
        }

        // Get all students in the class
        const { data: students, error: studentsError } = await supabase
            .from('class_students')
            .select('id, student_id, email, student_name, register_number')
            .eq('class_id', classId);

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
            return {
                success: true,
                sent: 0,
                skipped: 0,
                failed: 0,
                message: 'No students found in this class'
            };
        }

        // Get all access requests for this class
        const { data: accessRequests } = await supabase
            .from('access_requests')
            .select('student_email, status')
            .eq('class_id', classId);

        const requestMap = new Map(accessRequests?.map(r => [r.student_email, r.status]) || []);

        let sent = 0;
        let skipped = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const student of students) {
            try {
                const existingStatus = requestMap.get(student.email);

                // Skip if already accepted
                if (existingStatus === 'accepted') {
                    skipped++;
                    continue;
                }

                // Resend to rejected or pending students
                const result = await resendInvitationToStudent(classId, student.email);

                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    errors.push(`Failed to send to ${student.email}: ${result.error}`);
                }
            } catch (err) {
                console.error('Error processing student:', student.email, err);
                failed++;
                errors.push(`Failed to process ${student.email}`);
            }
        }

        return {
            success: true,
            sent,
            skipped,
            failed,
            message: `Sent ${sent} invitations, skipped ${skipped} (already accepted), failed ${failed}`,
            errors: errors.length > 0 ? errors : undefined
        };
    } catch (err) {
        console.error('Error resending invitations:', err);
        return {
            success: false,
            sent: 0,
            skipped: 0,
            failed: 0,
            message: err instanceof Error ? err.message : 'Failed to resend invitations',
            errors: [err instanceof Error ? err.message : 'Unknown error']
        };
    }
}

/**
 * Link email-based records to a new user account
 */
export async function linkEmailToAccount(email: string, userId: string): Promise<{ success: boolean; linkedCount: number }> {
    try {
        let linkedCount = 0;

        // Link student_emails
        const { error: emailLinkError } = await supabase
            .from('student_emails')
            .update({ linked_user_id: userId })
            .eq('email', email)
            .is('linked_user_id', null);

        if (!emailLinkError) linkedCount++;

        // Link class_students
        const { error: classLinkError } = await supabase
            .from('class_students')
            .update({ student_id: userId })
            .eq('email', email)
            .is('student_id', null);

        if (!classLinkError) linkedCount++;

        // Link access_requests
        const { error: requestLinkError } = await supabase
            .from('access_requests')
            .update({ student_id: userId })
            .eq('student_email', email)
            .is('student_id', null);

        if (!requestLinkError) linkedCount++;

        return { success: true, linkedCount };
    } catch (err) {
        console.error('Error linking email to account:', err);
        return { success: false, linkedCount: 0 };
    }
}
