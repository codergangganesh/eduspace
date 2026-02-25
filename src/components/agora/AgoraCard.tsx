
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    Zap,
    Clock,
    FileText,
    Video,
    HelpCircle,
    User,
    ChevronRight,
    Sparkles,
    MoreVertical,
    Edit,
    Trash
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export type AgoraPostType = 'note' | 'question' | 'video' | 'canvas';

export interface AgoraPost {
    id: string;
    title: string;
    content: string;
    summary: string;
    user_id: string;
    author?: {
        name: string;
        image?: string;
        role: string;
    };
    type: AgoraPostType;
    createdAt: string;
    bounty?: number;
    likes: number;
    dislikes: number;
    replies: number;
    tags: string[];
    user_vote?: number;
}

interface AgoraCardProps {
    post: AgoraPost;
    index: number;
    onUpdate?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
    onViewDetails?: () => void;
}

export const AgoraCard: React.FC<AgoraCardProps> = ({ post, index, onUpdate, onDelete, onEdit, onViewDetails }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useAuth();
    const [localVotes, setLocalVotes] = useState({ likes: post.likes, dislikes: post.dislikes, userVote: post.user_vote });

    const handleVote = async (voteType: number) => {
        if (!user) {
            toast.error("Please login to vote");
            return;
        }

        try {
            // If clicking the same vote, we might want to "unvote", but for simplicity let's just upsert
            const { error } = await (supabase as any)
                .from('agora_votes')
                .upsert({
                    post_id: post.id,
                    user_id: user.id,
                    vote_type: voteType
                });

            if (error) throw error;

            // Optimistic update
            setLocalVotes(prev => {
                let newLikes = prev.likes;
                let newDislikes = prev.dislikes;

                if (prev.userVote === voteType) return prev; // No change

                if (voteType === 1) {
                    newLikes++;
                    if (prev.userVote === -1) newDislikes--;
                } else {
                    newDislikes++;
                    if (prev.userVote === 1) newLikes--;
                }

                return { likes: newLikes, dislikes: newDislikes, userVote: voteType };
            });

            toast.success(voteType === 1 ? "Upvoted!" : "Downvoted!");
        } catch (error) {
            console.error("Voting error:", error);
            toast.error("Failed to vote");
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await (supabase as any)
                .from('agora_posts')
                .delete()
                .eq('id', post.id);

            if (error) throw error;

            toast.success("Resource removed from Agora");
            onDelete?.();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete resource");
        }
    };

    const isAuthor = user?.id === post.user_id;

    const getIcon = () => {
        switch (post.type) {
            case 'note': return <FileText className="size-4" />;
            case 'video': return <Video className="size-4" />;
            case 'question': return <HelpCircle className="size-4" />;
            case 'canvas': return <Zap className="size-4" />;
            default: return <FileText className="size-4" />;
        }
    };

    const getTypeColor = () => {
        switch (post.type) {
            case 'note': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'video': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'question': return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
            case 'canvas': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="mb-4 break-inside-avoid"
        >
            <Card className={cn(
                "relative group border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-500",
                "ring-1 ring-slate-200/50 dark:ring-white/5 cursor-pointer"
            )} onClick={onViewDetails}>
                {/* Bounty Glow */}
                {post.bounty && (
                    <div className="absolute top-0 right-0 p-3 z-10">
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-lg shadow-amber-500/30 animate-pulse px-2 py-0.5 text-[9px] font-black italic">
                            {post.bounty} PTS BOUNTY
                        </Badge>
                    </div>
                )}

                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-md px-2 py-0.5 flex items-center gap-1.5 font-bold uppercase tracking-tight text-[10px]", getTypeColor())}>
                                {React.cloneElement(getIcon() as React.ReactElement, { className: "size-3.5" })}
                                {post.type}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="size-3" />
                                {post.createdAt}
                            </span>
                        </div>

                        {isAuthor && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                                            <MoreVertical className="size-3.5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                                        <DropdownMenuItem
                                            onClick={onEdit}
                                            className="flex items-center gap-2 font-bold text-xs p-3 cursor-pointer"
                                        >
                                            <Edit className="size-3.5" />
                                            Edit Post
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                    onSelect={(e) => e.preventDefault()}
                                                    className="flex items-center gap-2 font-bold text-xs p-3 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10"
                                                >
                                                    <Trash className="size-3.5" />
                                                    Delete Post
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl border-none">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-black">Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription className="font-bold">
                                                        This action cannot be undone. This will permanently delete your resource from The Agora.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleDelete}
                                                        className="bg-red-500 hover:bg-red-600 rounded-xl font-bold"
                                                    >
                                                        Delete Permanently
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight transition-colors">
                            {post.title}
                        </h3>
                        <motion.p
                            layout
                            className={cn(
                                "text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed transition-all duration-300 whitespace-pre-wrap",
                                !isExpanded && "line-clamp-3"
                            )}
                        >
                            {post.content}
                        </motion.p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-all group/btn pt-1"
                        >
                            {isExpanded ? "Show Less" : "Read More"}
                            <ChevronRight className={cn("size-3 transition-transform", isExpanded ? "rotate-90" : "group-hover/btn:translate-x-1")} />
                        </button>
                    </div>


                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-white dark:border-white/10 overflow-hidden">
                                {post.author?.image ? (
                                    <img src={post.author.image} alt={post.author.name} className="size-full object-cover" />
                                ) : (
                                    <User className="size-3 text-slate-400" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-900 dark:text-white tracking-tight">{post.author?.name || 'Anonymous'}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{post.author?.role || 'User'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleVote(1)}
                                    className={cn(
                                        "p-0.5 rounded-md transition-all flex items-center gap-1",
                                        localVotes.userVote === 1 ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400"
                                    )}
                                >
                                    <ThumbsUp className="size-3" />
                                    <span className="text-[10px] font-black">{localVotes.likes}</span>
                                </button>
                                <button
                                    onClick={() => handleVote(-1)}
                                    className={cn(
                                        "p-0.5 rounded-md transition-all flex items-center gap-1",
                                        localVotes.userVote === -1 ? "bg-red-500/10 text-red-500" : "text-slate-400"
                                    )}
                                >
                                    <ThumbsDown className="size-3" />
                                    <span className="text-[10px] font-black">{localVotes.dislikes}</span>
                                </button>
                            </div>
                            <div className="w-[1px] h-4 bg-slate-100 dark:bg-white/5 mx-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails?.();
                                }}
                                className="flex items-center gap-1 text-slate-400 py-0.5 px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all"
                            >
                                <MessageSquare className="size-3" />
                                <span className="text-[10px] font-black">{post.replies}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
