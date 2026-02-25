
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Trophy,
    Medal,
    Award,
    User,
    ArrowUp,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { AgoraPost } from '@/components/agora/AgoraCard';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    posts: AgoraPost[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, posts }) => {
    const { user } = useAuth();

    const { topContributors, userRank } = React.useMemo(() => {
        if (!posts || posts.length === 0) return { topContributors: [], userRank: null };

        const authorMap = new Map();

        posts.forEach(post => {
            if (!post.author) return;
            const authorName = post.author.name || 'Anonymous';
            if (authorName === 'Anonymous') return;

            const isCurrentUser = user && (
                user.id === post.user_id ||
                user.user_metadata?.full_name === authorName
            );

            if (!authorMap.has(authorName)) {
                authorMap.set(authorName, {
                    name: authorName,
                    avatar: post.author.image,
                    role: post.author.role || 'student',
                    contributions: 0,
                    points: 0,
                    isCurrentUser
                });
            }

            const stats = authorMap.get(authorName);
            stats.contributions += 1;
            stats.points += 10 + (post.likes || 0) * 5 + (post.bounty || 0);
        });

        const sorted = Array.from(authorMap.values())
            .sort((a, b) => b.points - a.points)
            .map((c, idx) => ({ ...c, rank: idx + 1 }));

        return {
            topContributors: sorted.slice(0, 5),
            userRank: sorted.find(c => c.isCurrentUser)
        };
    }, [posts, user]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Trophy className="size-32" />
                    </div>

                    <DialogHeader>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            Agora Top Minds
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight">
                            Knowledge <span className="italic">Legends</span>
                        </DialogTitle>
                        <DialogDescription className="text-white/70 font-bold text-sm">
                            The top contributors building the future of EduSpace.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4">
                    {topContributors.map((contributor, idx) => {
                        const isTopThree = contributor.rank <= 3;
                        return (
                            <div
                                key={contributor.name}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl transition-all border",
                                    isTopThree
                                        ? "bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10 shadow-sm"
                                        : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative font-black text-xs text-slate-400 w-4 text-center">
                                        {contributor.rank === 1 ? <Medal className="size-4 text-amber-500" /> :
                                            contributor.rank === 2 ? <Medal className="size-4 text-slate-400" /> :
                                                contributor.rank === 3 ? <Medal className="size-4 text-amber-700" /> :
                                                    contributor.rank}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border-2 border-white dark:border-slate-800 shadow-sm">
                                            <AvatarImage src={contributor.avatar} />
                                            <AvatarFallback className="font-black text-[10px] bg-slate-200 text-slate-600">
                                                {contributor.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                                                {contributor.name}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                {contributor.role} • {contributor.contributions} posts
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-indigo-500 font-black">
                                        <ArrowUp className="size-3" />
                                        <span>{contributor.points}</span>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Points</span>
                                </div>
                            </div>
                        );
                    })}

                    <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-1">
                        View Full Rankings <ChevronRight className="size-3" />
                    </button>

                    <div className="pt-2">
                        <div className={cn(
                            "rounded-2xl p-4 flex items-center gap-4 border transition-all",
                            userRank
                                ? "bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                        )}>
                            <div className="size-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden">
                                {userRank?.avatar ? (
                                    <img src={userRank.avatar} alt="You" className="size-full object-cover" />
                                ) : (
                                    <User className="size-5 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Rank</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {userRank ? `#${userRank.rank} • ${userRank.points} Points` : 'Not Ranked Yet'}
                                </p>
                            </div>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 animate-bounce">
                                <Sparkles className="size-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
