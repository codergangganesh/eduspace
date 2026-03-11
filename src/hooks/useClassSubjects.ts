import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createRegisteredMap } from '@/lib/cacheRegistry';

// ── Module-level cache ───────────────────────────────────────────────────────
const subjectsCache = createRegisteredMap<string, Subject[]>();

function getClassSubjectCacheKey(userId?: string, classId?: string | null) {
    if (!userId || !classId) return null;
    return `${userId}_${classId}`;
}

export interface Subject {
    id: string;
    class_id: string;
    name: string;
    code: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateSubjectDTO {
    name: string;
    code?: string;
    description?: string;
}

export function useClassSubjects(classId: string | null) {
    const { user } = useAuth();
    const cacheKey = getClassSubjectCacheKey(user?.id, classId);
    const [subjects, setSubjects] = useState<Subject[]>(() => {
        if (cacheKey && subjectsCache.has(cacheKey)) {
            return subjectsCache.get(cacheKey) || [];
        }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        return cacheKey ? !subjectsCache.has(cacheKey) : false;
    });
    const [error, setError] = useState<Error | null>(null);

    // Update state synchronously if classId changes and we have cached data
    useEffect(() => {
        if (!cacheKey) {
            setSubjects([]);
            setLoading(false);
        } else if (subjectsCache.has(cacheKey)) {
            setSubjects(subjectsCache.get(cacheKey) || []);
            setLoading(false);
        } else {
            setSubjects([]);
            setLoading(true);
        }
    }, [cacheKey]);

    const fetchSubjects = useCallback(async (silentRefresh = false) => {
        if (!classId || !user) {
            setSubjects([]);
            setLoading(false);
            return;
        }

        try {
            if (!cacheKey) {
                setSubjects([]);
                setLoading(false);
                return;
            }

            if (!silentRefresh && !subjectsCache.has(cacheKey)) {
                setLoading(true);
            }
            const { data, error: fetchError } = await supabase
                .from('subjects')
                .select('*')
                .eq('class_id', classId)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            setSubjects(data || []);
            if (data) subjectsCache.set(cacheKey, data);
            setError(null);
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError(err as Error);
            if (cacheKey && !subjectsCache.has(cacheKey)) {
                setSubjects([]);
            }
        } finally {
            setLoading(false);
        }
    }, [cacheKey, classId, user]);

    useEffect(() => {
        fetchSubjects();

        if (!classId || !user) return;

        // Real-time subscription for subjects
        const subscription = supabase
            .channel(`subjects_${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'subjects',
                    filter: `class_id=eq.${classId}`,
                },
                () => {
                    fetchSubjects(true);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [classId, user, fetchSubjects]);

    const createSubject = async (data: CreateSubjectDTO) => {
        if (!user || !classId) throw new Error('User not authenticated or class not selected');

        try {
            const { data: newSubject, error: createError } = await supabase
                .from('subjects')
                .insert({
                    class_id: classId,
                    name: data.name,
                    code: data.code || null,
                    description: data.description || null,
                })
                .select()
                .single();

            if (createError) throw createError;

            toast.success('Subject created successfully');
            await fetchSubjects();
            return newSubject;
        } catch (err) {
            console.error('Error creating subject:', err);
            toast.error('Failed to create subject');
            throw err;
        }
    };

    const updateSubject = async (subjectId: string, data: Partial<CreateSubjectDTO>) => {
        if (!user) throw new Error('User not authenticated');

        try {
            const { error: updateError } = await supabase
                .from('subjects')
                .update({
                    name: data.name,
                    code: data.code,
                    description: data.description,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', subjectId);

            if (updateError) throw updateError;

            toast.success('Subject updated successfully');
            await fetchSubjects();
        } catch (err) {
            console.error('Error updating subject:', err);
            toast.error('Failed to update subject');
            throw err;
        }
    };

    const deleteSubject = async (subjectId: string) => {
        if (!user) throw new Error('User not authenticated');

        try {
            // Check if subject has assignments
            const { count } = await supabase
                .from('assignments')
                .select('*', { count: 'exact', head: true })
                .eq('subject_id', subjectId);

            if (count && count > 0) {
                toast.error(`Cannot delete subject. It has ${count} assignment(s) linked to it.`);
                return;
            }

            const { error: deleteError } = await supabase
                .from('subjects')
                .delete()
                .eq('id', subjectId);

            if (deleteError) throw deleteError;

            toast.success('Subject deleted successfully');
            await fetchSubjects();
        } catch (err) {
            console.error('Error deleting subject:', err);
            toast.error('Failed to delete subject');
            throw err;
        }
    };

    return {
        subjects,
        loading,
        error,
        createSubject,
        updateSubject,
        deleteSubject,
        refreshSubjects: fetchSubjects,
    };
}
