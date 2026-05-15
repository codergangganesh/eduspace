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

            // 4. Merge data (Optimized with Maps for O(1) lookups)
            const submissionById = new Map();
            const submissionByRegNum = new Map();
            const submissionByEmail = new Map();

            resolvedSubmissions?.forEach(s => {
                if (s.student_id) submissionById.set(s.student_id, s);
                if (s.register_number) {
                    submissionByRegNum.set(s.register_number.trim().toLowerCase(), s);
                }
                
                const submittedEmail = s.student_id ? submittedEmailsMap[s.student_id] : null;
                if (submittedEmail) {
                    submissionByEmail.set(submittedEmail.trim().toLowerCase(), s);
                }
            });

            const combinedData: AssignmentSubmissionDetail[] = (students || []).map(student => {
                // Find submission using multi-key lookup (O(1))
                let submission = null;
                
                if (student.student_id && submissionById.has(student.student_id)) {
                    submission = submissionById.get(student.student_id);
                } else if (student.register_number && submissionByRegNum.has(student.register_number.trim().toLowerCase())) {
                    submission = submissionByRegNum.get(student.register_number.trim().toLowerCase());
                } else if (student.email && submissionByEmail.has(student.email.trim().toLowerCase())) {
                    submission = submissionByEmail.get(student.email.trim().toLowerCase());
                }

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
