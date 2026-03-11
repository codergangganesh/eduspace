import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEnrolledClassIds } from '@/lib/studentUtils';
import { notifyClassStudents, sendClassEmail, getLecturerName } from '@/lib/notificationService';
import { createRegisteredMap } from '@/lib/cacheRegistry';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FeedPost {
    id: string;
    class_id: string;
    author_id: string;
    content: string;
    attachment_url: string | null;
    attachment_name: string | null;
    attachment_type: string | null;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    // Joined / enriched
    author_name: string;
    author_avatar: string | null;
    author_role: string;
    class_name: string;
    course_code: string;
    reactions: FeedReaction[];
    seen_count: number;
    total_students: number;
}

export interface FeedReaction {
    id: string;
    post_id: string;
    user_id: string;
    emoji: string;
    user_name?: string;
}

export interface ClassOption {
    id: string;
    class_name: string | null;
    course_code: string;
}

// ── Untyped Supabase client for new tables ───────────────────────────────────
// These tables (class_feed_posts, class_feed_reactions, class_feed_seen) are
// not yet in the auto-generated Supabase types. We use `any` to bypass type
// checking for .from() calls targeting these tables.

const db = supabase as any;

// ── Module-level cache ───────────────────────────────────────────────────────
// Persists across component mounts so navigating away and back shows data instantly.
const postsCache = createRegisteredMap<string, FeedPost[]>();
const classesCache = createRegisteredMap<string, ClassOption[]>();
const selectedClassCache = createRegisteredMap<string, string | null>();

function getClassFeedCacheKey(userId?: string, classId?: string | null) {
    if (!userId || !classId) return null;
    return `${userId}_${classId}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useClassFeed() {
    const { user, role } = useAuth();
    const [posts, setPosts] = useState<FeedPost[]>(() => {
        const cachedSelectedClassId = user ? selectedClassCache.get(user.id) || null : null;
        const cacheKey = getClassFeedCacheKey(user?.id, cachedSelectedClassId);
        if (cacheKey && postsCache.has(cacheKey)) {
            return postsCache.get(cacheKey) || [];
        }
        return [];
    });
    const [classes, setClasses] = useState<ClassOption[]>(() => {
        if (user && classesCache.has(user.id)) {
            return classesCache.get(user.id) || [];
        }
        return [];
    });
    const [selectedClassId, setSelectedClassId] = useState<string | null>(() => {
        if (user && selectedClassCache.has(user.id)) {
            return selectedClassCache.get(user.id) || null;
        }
        return null;
    });
    const [loading, setLoading] = useState(() => {
        if (!user) return false;
        const cachedSelectedClassId = selectedClassCache.get(user.id) || null;
        const cacheKey = getClassFeedCacheKey(user.id, cachedSelectedClassId);
        return cacheKey ? !postsCache.has(cacheKey) : true;
    });
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (!user) {
            setPosts([]);
            setClasses([]);
            setSelectedClassId(null);
            setLoading(false);
            return;
        }

        const cachedClasses = classesCache.get(user.id) || [];
        const cachedSelectedClassId = selectedClassCache.get(user.id) || null;
        const cacheKey = getClassFeedCacheKey(user.id, cachedSelectedClassId);

        setClasses(cachedClasses);
        setSelectedClassId(cachedSelectedClassId);
        setPosts(cacheKey && postsCache.has(cacheKey) ? postsCache.get(cacheKey) || [] : []);
        setLoading(cacheKey ? !postsCache.has(cacheKey) : true);
    }, [user?.id]);

    // ── Fetch user's classes ─────────────────────────────────────────────

    const fetchClasses = useCallback(async () => {
        if (!user) return;

        try {
            if (role === 'student') {
                const enrolledIds = await getEnrolledClassIds(user.id);
                if (enrolledIds.length === 0) {
                    setClasses([]);
                    classesCache.set(user.id, []);
                    selectedClassCache.set(user.id, null);
                    setSelectedClassId(null);
                    setPosts([]);
                    return;
                }
                const { data } = await supabase
                    .from('classes')
                    .select('id, class_name, course_code')
                    .in('id', enrolledIds)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                setClasses(data || []);
                classesCache.set(user.id, data || []);
                if (!data || data.length === 0) {
                    selectedClassCache.set(user.id, null);
                    setSelectedClassId(null);
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                if (selectedClassId && !data.some(cls => cls.id === selectedClassId)) {
                    setSelectedClassId(data[0].id);
                    selectedClassCache.set(user.id, data[0].id);
                    return;
                }

                if (data && data.length > 0 && !selectedClassId) {
                    setSelectedClassId(data[0].id);
                    selectedClassCache.set(user.id, data[0].id);
                }
            } else {
                const { data } = await supabase
                    .from('classes')
                    .select('id, class_name, course_code')
                    .eq('lecturer_id', user.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                setClasses(data || []);
                classesCache.set(user.id, data || []);
                if (!data || data.length === 0) {
                    selectedClassCache.set(user.id, null);
                    setSelectedClassId(null);
                    setPosts([]);
                    setLoading(false);
                    return;
                }

                if (selectedClassId && !data.some(cls => cls.id === selectedClassId)) {
                    setSelectedClassId(data[0].id);
                    selectedClassCache.set(user.id, data[0].id);
                    return;
                }

                if (data && data.length > 0 && !selectedClassId) {
                    setSelectedClassId(data[0].id);
                    selectedClassCache.set(user.id, data[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching classes for feed:', err);
        }
    }, [user, role, selectedClassId]);

    // ── Fetch feed posts for selected class ──────────────────────────────

    const fetchPosts = useCallback(async () => {
        if (!user || !selectedClassId) {
            setPosts([]);
            setLoading(false);
            return;
        }

        const cacheKey = getClassFeedCacheKey(user.id, selectedClassId);
        if (!cacheKey) {
            setPosts([]);
            setLoading(false);
            return;
        }

        // Cache the selected class ID for next mount
        selectedClassCache.set(user.id, selectedClassId);

        try {
            // Only show loading skeleton if there's NO cached data for this class
            const hasCachedPosts = postsCache.has(cacheKey);
            if (!hasCachedPosts) {
                setLoading(true);
            }
            // If we have cache, show it immediately (already set in state init or previous fetch)

            // 1. Fetch posts
            const { data: postsData, error: postsError } = await db
                .from('class_feed_posts')
                .select('*')
                .eq('class_id', selectedClassId)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;
            if (!postsData || postsData.length === 0) {
                setPosts([]);
                postsCache.set(cacheKey, []);
                setLoading(false);
                return;
            }

            const postIds = postsData.map((p: any) => p.id);
            const authorIds = [...new Set(postsData.map((p: any) => p.author_id))] as string[];

            // 2. Fetch author profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url')
                .in('user_id', authorIds);

            const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
            profiles?.forEach(p => profileMap.set(p.user_id, { full_name: p.full_name || 'Unknown', avatar_url: p.avatar_url }));

            // 3. Fetch author roles
            const { data: roles } = await supabase
                .from('user_roles')
                .select('user_id, role')
                .in('user_id', authorIds);
            const roleMap = new Map<string, string>();
            roles?.forEach(r => roleMap.set(r.user_id, r.role));

            // 4. Fetch reactions
            const { data: reactions } = await db
                .from('class_feed_reactions')
                .select('*')
                .in('post_id', postIds);

            const reactionsByPost = new Map<string, FeedReaction[]>();
            (reactions || []).forEach((r: any) => {
                const arr = reactionsByPost.get(r.post_id) || [];
                const authorProfile = profileMap.get(r.user_id);
                arr.push({
                    id: r.id,
                    post_id: r.post_id,
                    user_id: r.user_id,
                    emoji: r.emoji,
                    user_name: authorProfile?.full_name || 'Unknown',
                });
                reactionsByPost.set(r.post_id, arr);
            });

            // 5. Fetch seen counts
            const { data: seenData } = await db
                .from('class_feed_seen')
                .select('post_id')
                .in('post_id', postIds);

            const seenCountMap = new Map<string, number>();
            (seenData || []).forEach((s: any) => {
                seenCountMap.set(s.post_id, (seenCountMap.get(s.post_id) || 0) + 1);
            });

            // 6. Total students in class
            const { count: totalStudents } = await supabase
                .from('class_students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', selectedClassId);

            // 7. Get class info
            const { data: classInfo } = await supabase
                .from('classes')
                .select('class_name, course_code')
                .eq('id', selectedClassId)
                .single();

            // 8. Enrich posts
            const enrichedPosts: FeedPost[] = postsData.map((post: any) => {
                const author = profileMap.get(post.author_id);
                return {
                    id: post.id,
                    class_id: post.class_id,
                    author_id: post.author_id,
                    content: post.content,
                    attachment_url: post.attachment_url,
                    attachment_name: post.attachment_name,
                    attachment_type: post.attachment_type,
                    is_pinned: post.is_pinned,
                    created_at: post.created_at,
                    updated_at: post.updated_at,
                    author_name: author?.full_name || 'Unknown',
                    author_avatar: author?.avatar_url || null,
                    author_role: roleMap.get(post.author_id) || 'student',
                    class_name: classInfo?.class_name || '',
                    course_code: classInfo?.course_code || '',
                    reactions: reactionsByPost.get(post.id) || [],
                    seen_count: seenCountMap.get(post.id) || 0,
                    total_students: totalStudents || 0,
                };
            });

            setPosts(enrichedPosts);
            // Update cache
            postsCache.set(cacheKey, enrichedPosts);

            // 9. Mark all posts as seen by the current user
            if (postIds.length > 0) {
                const seenRecords = postIds.map((post_id: string) => ({
                    post_id,
                    user_id: user.id,
                }));

                await db
                    .from('class_feed_seen')
                    .upsert(seenRecords, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
            }

        } catch (err) {
            console.error('Error fetching feed posts:', err);
        } finally {
            setLoading(false);
        }
    }, [user, selectedClassId]);

    // ── Create announcement ──────────────────────────────────────────────

    const createPost = useCallback(async (
        content: string,
        attachment?: { url: string; name: string; type: string } | null
    ) => {
        if (!user || !selectedClassId) return false;
        // Require either content or attachment
        if (!content.trim() && !attachment) return false;

        try {
            setPosting(true);

            const postContent = content.trim() || (attachment ? '📎 Shared a file' : '');

            const { data: newPost, error } = await db
                .from('class_feed_posts')
                .insert({
                    class_id: selectedClassId,
                    author_id: user.id,
                    content: postContent,
                    attachment_url: attachment?.url || null,
                    attachment_name: attachment?.name || null,
                    attachment_type: attachment?.type || null,
                    is_pinned: false,
                })
                .select()
                .single();

            if (error) throw error;

            // Send notifications to all class students
            const { data: classInfo } = await supabase
                .from('classes')
                .select('class_name, course_code')
                .eq('id', selectedClassId)
                .single();

            const preview = postContent.length > 80 ? postContent.substring(0, 80) + '...' : postContent;

            await notifyClassStudents(
                selectedClassId,
                'announcement',
                `📢 New Announcement — ${classInfo?.course_code || 'Class'}`,
                preview,
                user.id,
                newPost?.id
            );

            // Send class email
            try {
                const lecturerName = await getLecturerName(user.id);
                sendClassEmail({
                    classId: selectedClassId,
                    type: 'update',
                    title: `New Announcement in ${classInfo?.course_code || 'your class'}`,
                    body: preview,
                    link: `https://eduspaceacademy.online/class-feed`,
                    lecturerName,
                });
            } catch (emailErr) {
                console.warn('Email notification failed (non-critical):', emailErr);
            }

            await fetchPosts();
            return true;
        } catch (err) {
            console.error('Error creating announcement:', err);
            return false;
        } finally {
            setPosting(false);
        }
    }, [user, selectedClassId, fetchPosts]);

    // ── Toggle pin ───────────────────────────────────────────────────────

    const togglePin = useCallback(async (postId: string, currentlyPinned: boolean) => {
        if (!user) return;

        try {
            const { error } = await db
                .from('class_feed_posts')
                .update({ is_pinned: !currentlyPinned, updated_at: new Date().toISOString() })
                .eq('id', postId);

            if (error) throw error;
            await fetchPosts();
        } catch (err) {
            console.error('Error toggling pin:', err);
        }
    }, [user, fetchPosts]);

    // ── Delete post ──────────────────────────────────────────────────────

    const deletePost = useCallback(async (postId: string) => {
        if (!user) return;

        try {
            const { error } = await db
                .from('class_feed_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            await fetchPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    }, [user, fetchPosts]);

    // ── Toggle reaction ──────────────────────────────────────────────────

    const toggleReaction = useCallback(async (postId: string, emoji: string) => {
        if (!user) return;

        try {
            // Check if user already reacted with this emoji
            const { data: existing } = await db
                .from('class_feed_reactions')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.id)
                .eq('emoji', emoji)
                .maybeSingle();

            if (existing) {
                // Remove reaction
                await db
                    .from('class_feed_reactions')
                    .delete()
                    .eq('id', existing.id);
            } else {
                // Add reaction
                await db
                    .from('class_feed_reactions')
                    .insert({
                        post_id: postId,
                        user_id: user.id,
                        emoji,
                    });
            }

            await fetchPosts();
        } catch (err) {
            console.error('Error toggling reaction:', err);
        }
    }, [user, fetchPosts]);

    // ── Real-time subscription ───────────────────────────────────────────

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        fetchPosts();

        if (!selectedClassId) return;

        // Subscribe to changes on posts for this class
        const channel = supabase
            .channel(`class_feed_${selectedClassId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_feed_posts',
                    filter: `class_id=eq.${selectedClassId}`,
                },
                () => fetchPosts()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_feed_reactions',
                },
                () => fetchPosts()
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [selectedClassId, fetchPosts]);

    // ── Wrapped setSelectedClassId — loads cached posts instantly ─────────

    const handleSetSelectedClassId = useCallback((classId: string) => {
        if (!user) return;
        selectedClassCache.set(user.id, classId);
        setSelectedClassId(classId);
        // Instantly load cached posts for the new class (if available)
        const cacheKey = getClassFeedCacheKey(user.id, classId);
        if (cacheKey && postsCache.has(cacheKey)) {
            setPosts(postsCache.get(cacheKey) || []);
        }
    }, [user]);

    return {
        posts,
        classes,
        selectedClassId,
        setSelectedClassId: handleSetSelectedClassId,
        loading,
        posting,
        createPost,
        togglePin,
        deletePost,
        toggleReaction,
        refreshPosts: fetchPosts,
    };
}
