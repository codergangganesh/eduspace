
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search,
    Plus,
    Filter,
    Sparkles,
    TrendingUp,
    Coins,
    MessageCircle,
    LayoutGrid,
    List,
    Trophy
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AgoraCard, AgoraPost } from '@/components/agora/AgoraCard';
import { AgoraPostModal } from '@/components/agora/AgoraPostModal';
import { PostDetailsModal } from '@/components/agora/PostDetailsModal';
import { LeaderboardModal } from '@/components/agora/LeaderboardModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Agora() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<AgoraPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'note' | 'question' | 'video' | 'canvas'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<AgoraPost | undefined>(undefined);
    const [selectedPost, setSelectedPost] = useState<AgoraPost | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('agora_posts')
                .select(`
                    *,
                    author:profiles(full_name, avatar_url),
                    votes:agora_votes(vote_type, user_id),
                    replies:agora_comments(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedPosts = data.map((post: any) => {
                const userVoteDetail = post.votes?.find((v: any) => v.user_id === user?.id);
                const userVote = userVoteDetail ? userVoteDetail.vote_type : undefined;
                const likes = post.votes?.filter((v: any) => v.vote_type === 1).length || 0;
                const dislikes = post.votes?.filter((v: any) => v.vote_type === -1).length || 0;

                return {
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    summary: post.summary,
                    user_id: post.user_id,
                    type: post.post_type,
                    createdAt: formatDistanceToNow(new Date(post.created_at)) + ' ago',
                    bounty: post.bounty,
                    likes,
                    dislikes,
                    replies: post.replies?.[0]?.count || 0,
                    tags: post.tags || [],
                    user_vote: userVote,
                    author: {
                        name: post.author?.full_name || 'Anonymous',
                        image: post.author?.avatar_url,
                        role: 'student'
                    }
                };
            });

            setPosts(formattedPosts);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load The Agora");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [user]);

    const filteredPosts = posts.filter(post => {
        const matchesFilter = activeFilter === 'all' || post.type === activeFilter;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesFilter && matchesSearch;
    });

    const handlePostSubmit = () => {
        fetchPosts();
        setEditingPost(undefined);
    };

    const handleOpenCreateModal = () => {
        setEditingPost(undefined);
        setIsPostModalOpen(true);
    };

    const handleOpenEditModal = (post: AgoraPost) => {
        setEditingPost(post);
        setIsPostModalOpen(true);
    };

    const handleOpenDetails = (post: AgoraPost) => {
        setSelectedPost(post);
        setIsDetailsModalOpen(true);
    };

    return (
        <DashboardLayout fullHeight>
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Modern Header Section */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6 relative">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                        <TrendingUp className="size-48 text-indigo-500" />
                    </div>

                    <div className="max-w-7xl mx-auto space-y-4 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <div className="size-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                        <MessageCircle className="size-5 text-white" />
                                    </div>
                                    The Agora
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-base">
                                    Premium community-driven <span className="text-indigo-500 italic">knowledge hub.</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleOpenCreateModal}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl px-6 py-6 font-black shadow-xl shadow-indigo-500/20 gap-2 transition-all active:scale-95"
                                >
                                    <Plus className="size-5" />
                                    Post Resource
                                </Button>
                                <Button
                                    onClick={() => setIsLeaderboardOpen(true)}
                                    variant="outline"
                                    className="rounded-2xl px-6 py-6 font-black border-slate-200 dark:border-slate-800 gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    <Trophy className="size-5 text-amber-500" />
                                    Leaderboard
                                </Button>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col lg:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                <Input
                                    placeholder="Search notes, questions, or tags (e.g. #Physics)..."
                                    className="pl-12 py-6 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 font-bold focus-visible:ring-indigo-500 transition-all h-auto"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full lg:w-auto overflow-x-auto scrollbar-hide">
                                {[
                                    { id: 'all', label: 'Feeds', icon: '✨' },
                                    { id: 'note', label: 'Notes', icon: '📝' },
                                    { id: 'question', label: 'Bounties', icon: '💎' },
                                    { id: 'video', label: 'Videos', icon: '🎬' },
                                    { id: 'canvas', label: 'Whiteboards', icon: '🎨' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id as any)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2",
                                            activeFilter === filter.id
                                                ? "bg-white dark:bg-slate-900 text-indigo-500 shadow-sm"
                                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <span className="text-sm opacity-70">{filter.icon}</span>
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Masonry Content Area */}
                <ScrollArea className="flex-1">
                    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-32">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredPosts.length > 0 ? (
                            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                                {filteredPosts.map((post, idx) => (
                                    <AgoraCard
                                        key={post.id}
                                        post={post}
                                        index={idx}
                                        onDelete={fetchPosts}
                                        onUpdate={fetchPosts}
                                        onEdit={() => handleOpenEditModal(post)}
                                        onViewDetails={() => handleOpenDetails(post)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                                <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="size-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">No results found</h3>
                                <p className="text-slate-500 font-bold max-w-xs">
                                    Try adjusting your search or filters to find what you are looking for.
                                </p>
                                <Button
                                    variant="link"
                                    className="text-indigo-500 font-black"
                                    onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Fixed Quick Actions */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-3 py-2 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-2xl pointer-events-auto">
                        <div className="flex items-center gap-2 px-3 mr-2 border-r border-slate-200 dark:border-white/10">
                            <TrendingUp className="size-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Activity</span>
                        </div>
                        <div className="flex -space-x-2 mr-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="size-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700" />
                            ))}
                        </div>
                        <Button
                            onClick={handleOpenCreateModal}
                            className="rounded-full size-10 p-0 bg-indigo-500 hover:bg-slate-900 shadow-lg shadow-indigo-500/20 active:scale-90 transition-all"
                        >
                            <Plus className="size-5" />
                        </Button>
                    </div>
                </div>

                {/* Modals */}
                <AgoraPostModal
                    isOpen={isPostModalOpen}
                    onClose={() => setIsPostModalOpen(false)}
                    onSubmit={handlePostSubmit}
                    post={editingPost}
                />
                <PostDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    post={selectedPost}
                />
                <LeaderboardModal
                    isOpen={isLeaderboardOpen}
                    onClose={() => setIsLeaderboardOpen(false)}
                    posts={posts}
                />
            </div>
        </DashboardLayout>
    );
}
