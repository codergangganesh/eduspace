import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { resolveAnyStorageUrl } from '@/lib/supabaseStorage';

export interface AssignmentSubmissionDetail {
    student_id: string;
    student_name: string;
    register_number: string;
    email: string;
    status: 'submitted' | 'pending' | 'graded' | 'returned';
    submitted_at?: string;
    file_url?: string;
    file_path?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    submission_id?: string;
    submission_text?: string;
    grade?: string | null;
    feedback?: string | null;
    profile_image?: string | null;
}

export function useAssignmentSubmissions(assignmentId: string, classId: string) {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<AssignmentSubmissionDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const cacheKey = user && assignmentId && classId
        ? `assignment-submissions:${user.id}:${classId}:${assignmentId}`
        : null;

    const fetchData = async (background = false) => {
        if (!user || !assignmentId || !classId) return;

        try {
            if (!background) {
                setLoading(true);
            }

            const [
                { data: students, error: studentsError },
                { data: submitted, error: submissionsError }
            ] = await Promise.all([
                supabase
                    .from('class_students')
                    .select('*')
                    .eq('class_id', classId),
                supabase
                    .from('assignment_submissions')
                    .select('*')
                    .eq('assignment_id', assignmentId)
            ]);

            if (submissionsError) {
                console.error('Error fetching submissions directly:', submissionsError);
                throw submissionsError;
            }
            if (studentsError) throw studentsError;

            // 2.5 Fetch student emails and profiles
            const allSubmissionUserIds = [...new Set((submitted || []).map(s => s.student_id).filter(Boolean))] as string[];
            const submittedEmailsMap: Record<string, string> = {}; // user_id -> email
            const studentIds = (students || []).map(s => s.student_id);

            const [profileEmailsResponse, studentProfilesResponse, resolvedSubmissions] = await Promise.all([
                allSubmissionUserIds.length > 0
                    ? supabase
                        .from('profiles')
                        .select('user_id, email')
                        .in('user_id', allSubmissionUserIds)
                    : Promise.resolve({ data: [], error: null }),
                studentIds.length > 0
                    ? supabase
                        .from('student_profiles')
                        .select('user_id, profile_image')
                        .in('user_id', studentIds)
                    : Promise.resolve({ data: [], error: null }),
                Promise.all((submitted || []).map(async (s) => {
                const finalUrl = await resolveAnyStorageUrl(s.attachment_url);
                return { ...s, resolved_url: finalUrl };
                }))
            ]);

            if (profileEmailsResponse.data) {
                profileEmailsResponse.data.forEach(p => {
                    if (p.email) submittedEmailsMap[p.user_id] = p.email;
                });
            }

            const profileMap: Record<string, string> = {};
            if (studentProfilesResponse.data) {
                studentProfilesResponse.data.forEach(p => {
                    if (p.profile_image) {
                        profileMap[p.user_id] = p.profile_image;
                    }
                });
            }

            // 4. Merge data
            const combinedData: AssignmentSubmissionDetail[] = (students || []).map(student => {
                const submission = resolvedSubmissions?.find(s => {
                    // Match by student_id
                    const matchId = (s.student_id && student.student_id && s.student_id === student.student_id);

                    // Match by register_number
                    const matchReg = (s.register_number && student.register_number &&
                        s.register_number.trim().toLowerCase() === student.register_number.trim().toLowerCase());

                    // Match by email fallback
                    const submittedEmail = s.student_id ? submittedEmailsMap[s.student_id] : null;
                    const matchEmail = (submittedEmail && student.email &&
                        submittedEmail.trim().toLowerCase() === student.email.trim().toLowerCase());

                    return matchId || matchReg || matchEmail;
                });

                return {
                    student_id: student.student_id || student.id,
                    student_name: student.student_name,
                    register_number: student.register_number || 'N/A',
                    email: student.email,
                    status: submission ? (submission.status as any) : 'pending',
                    submitted_at: submission?.submitted_at,
                    file_url: submission?.resolved_url || submission?.attachment_url,
                    file_path: submission?.attachment_url,
                    file_name: submission?.attachment_name,
                    file_type: submission?.file_type,
                    file_size: submission?.file_size,
                    submission_id: submission?.id,
                    submission_text: submission?.submission_text,
                    grade: submission?.grade?.toString(),
                    feedback: submission?.feedback,
                    profile_image: profileMap[student.student_id] || null
                };
            });

            setSubmissions(combinedData);
            if (cacheKey) {
                sessionStorage.setItem(cacheKey, JSON.stringify(combinedData));
            }

        } catch (error) {
            console.error('Error fetching assignment details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user || !assignmentId || !classId) {
            setLoading(false);
            return;
        }

        if (cacheKey) {
            const cachedSubmissions = sessionStorage.getItem(cacheKey);
            if (cachedSubmissions) {
                try {
                    setSubmissions(JSON.parse(cachedSubmissions) as AssignmentSubmissionDetail[]);
                    setLoading(false);
                } catch (error) {
                    console.warn('[useAssignmentSubmissions] Failed to read cached submissions:', error);
                }
            }
        }

        fetchData(Boolean(cacheKey && sessionStorage.getItem(cacheKey)));

        const subscription = supabase
            .channel(`assignment_subs_${assignmentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignment_submissions',
                    filter: `assignment_id=eq.${assignmentId}`
                },
                () => {
                    fetchData(true);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, assignmentId, classId, cacheKey]);

    return {
        submissions,
        loading,
        refetch: fetchData
    };
}
