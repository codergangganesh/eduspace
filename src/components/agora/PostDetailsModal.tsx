
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    MessageSquare,
    Send,
    User,
    Clock,
    ThumbsUp,
    ThumbsDown,
    MoreVertical,
    Trash
} from 'lucide-react';
import { AgoraPost } from './AgoraCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    author: {
        full_name: string;
        avatar_url: string;
    };
}

interface PostDetailsModalProps {
    post: AgoraPost | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ post, isOpen, onClose }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        if (!post) return;
        try {
            setIsLoading(true);
            const { data, error } = await (supabase as any)
                .from('agora_comments')
                .select(`
                    *,
                    author:profiles(full_name, avatar_url)
                `)
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && post) {
            fetchComments();
        }
    }, [isOpen, post]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to comment');
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await (supabase as any)
                .from('agora_comments')
                .insert({
                    post_id: post?.id,
                    user_id: user.id,
                    content: newComment.trim()
                });

            if (error) throw error;

            setNewComment('');
            fetchComments();
            toast.success('Comment added!');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('agora_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;
            setComments(comments.filter(c => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    if (!post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-none shadow-2xl rounded-[2.5rem] flex flex-col">
                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        {/* Post Content Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-10">
                                    <AvatarImage src={post.author?.image} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                                        {post.author?.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
                                        {post.author?.role} • {post.createdAt}
                                    </p>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {post.title}
                            </h2>

                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

                        {/* Comments Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="size-5 text-indigo-500" />
                                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                                    Replies <span className="text-indigo-500">({comments.length})</span>
                                </h3>
                            </div>

                            <div className="space-y-6 pb-4">
                                {isLoading ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin size-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    </div>
                                ) : comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="group relative flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                                            <Avatar className="size-8">
                                                <AvatarImage src={comment.author?.avatar_url} />
                                                <AvatarFallback><User /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {comment.author?.full_name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {formatDistanceToNow(new Date(comment.created_at))} ago
                                                        </span>
                                                        {user?.id === comment.user_id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash className="size-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl text-center space-y-2 border-2 border-dashed border-slate-100 dark:border-slate-800">
                                        <MessageSquare className="size-8 text-slate-300 mx-auto" />
                                        <p className="text-sm font-bold text-slate-400">No replies yet. Be the first to spark the conversation!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Comment Form */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-[2.5rem]">
                    <form onSubmit={handleAddComment} className="relative">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a thoughtful reply..."
                            className="bg-white dark:bg-slate-900 border-none rounded-2xl p-4 pr-12 font-bold min-h-[60px] max-h-[150px] resize-none focus-visible:ring-indigo-500 shadow-xl shadow-slate-200/50 dark:shadow-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="absolute right-3 bottom-3 size-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white p-0 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Send className="size-4" />
                            )}
                        </Button>
                    </form>
                    <p className="mt-2 text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                        Press Enter to send reply
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
