import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart2, Check, MoreVertical, Users } from 'lucide-react';
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PollData {
    id: string;
    question: string;
    options: { text: string; votes: number; percentage: number }[];
    totalVotes: number;
    userVotes: Set<number>;
    createdBy: string;
    allowMultiple: boolean;
}

interface VoterInfo {
    user_id: string;
    full_name: string;
    avatar_url: string;
    option_index: number;
}

export function PollBubble({ pollId }: { pollId: string }) {
    const { user } = useAuth();
    const [poll, setPoll] = useState<PollData | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editQuestion, setEditQuestion] = useState("");
    const [editOptions, setEditOptions] = useState<string[]>([]);
    const [editAllowMultiple, setEditAllowMultiple] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Modal state for viewing votes
    const [showVotesModal, setShowVotesModal] = useState(false);
    const [voterDetails, setVoterDetails] = useState<VoterInfo[]>([]);
    const [isLoadingVotes, setIsLoadingVotes] = useState(false);

    useEffect(() => {
        if (!user || !pollId) return;

        const fetchPoll = async () => {
            try {
                const { data: pollData, error } = await supabase
                    .from('chat_polls')
                    .select('*')
                    .eq('id', pollId)
                    .single();

                if (error || !pollData) throw error;

                const { data: votes } = await supabase
                    .from('chat_poll_votes')
                    .select('*')
                    .eq('poll_id', pollId);

                const isMultiple = pollData.allow_multiple ?? false;
                let processedVotes = votes || [];

                // For single-choice polls, ensure we only count one vote per user
                if (!isMultiple) {
                    const latestUserVotes = new Map();
                    processedVotes.forEach(v => {
                        // We keep the latest vote if somehow duplicates exist
                        latestUserVotes.set(v.user_id, v);
                    });
                    processedVotes = Array.from(latestUserVotes.values());
                }

                const userVotes = new Set<number>(
                    processedVotes.filter(v => v.user_id === user.id).map(v => v.option_index)
                );
                const totalVotes = processedVotes.length;

                const pollOptions = (pollData.options as string[]).map((optionText, index) => {
                    const votesForThisOption = processedVotes.filter(v => v.option_index === index).length;
                    const percentage = totalVotes > 0 ? Math.round((votesForThisOption / totalVotes) * 100) : 0;
                    return {
                        text: optionText,
                        votes: votesForThisOption,
                        percentage: percentage
                    };
                });

                setPoll({
                    id: pollData.id,
                    question: pollData.question,
                    options: pollOptions,
                    totalVotes: totalVotes,
                    userVotes,
                    createdBy: pollData.created_by,
                    allowMultiple: pollData.allow_multiple ?? false
                });
            } catch (err) {
                console.error("Error fetching poll:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPoll();

        const subscription = supabase
            .channel(`poll_${pollId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_poll_votes', filter: `poll_id=eq.${pollId}` },
                () => fetchPoll()
            )
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_polls', filter: `id=eq.${pollId}` },
                () => fetchPoll()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [pollId, user]);

    const handleVote = async (optionIndex: number) => {
        if (!user || !poll || voting || isEditing) return;

        // Restriction: Poll creator cannot vote
        if (user.id === poll.createdBy) {
            toast.info("As the creator, you cannot vote in this poll.", {
                description: "This poll is for gathering student feedback.",
                icon: <BarChart2 className="w-4 h-4 text-emerald-500" />
            });
            return;
        }

        const isAlreadyVoted = poll.userVotes.has(optionIndex);

        // Optimistic UI Update: Instantly move the selection and recalculate percentages
        const newUserVotes = new Set(poll.userVotes);
        let newOptions = [...poll.options];
        let newTotalVotes = poll.totalVotes;

        if (isAlreadyVoted) {
            newUserVotes.delete(optionIndex);
            newTotalVotes = Math.max(0, newTotalVotes - 1);
            newOptions[optionIndex] = {
                ...newOptions[optionIndex],
                votes: Math.max(0, newOptions[optionIndex].votes - 1)
            };
        } else {
            // If single choice, remove previous votes from options counts
            if (!poll.allowMultiple) {
                poll.userVotes.forEach(idx => {
                    if (newOptions[idx]) {
                        newOptions[idx] = {
                            ...newOptions[idx],
                            votes: Math.max(0, newOptions[idx].votes - 1)
                        };
                        newTotalVotes = Math.max(0, newTotalVotes - 1);
                    }
                });
                newUserVotes.clear();
            }
            newUserVotes.add(optionIndex);
            newTotalVotes++;
            newOptions[optionIndex] = {
                ...newOptions[optionIndex],
                votes: newOptions[optionIndex].votes + 1
            };
        }

        // Recalculate percentages for all options based on new total
        newOptions = newOptions.map(opt => ({
            ...opt,
            percentage: newTotalVotes > 0 ? Math.round((opt.votes / newTotalVotes) * 100) : 0
        }));

        // Update local state immediately for 100% visual responsiveness (0% to 100% move)
        setPoll(prev => prev ? {
            ...prev,
            userVotes: newUserVotes,
            options: newOptions,
            totalVotes: newTotalVotes
        } : null);
        setVoting(true);

        try {
            if (isAlreadyVoted) {
                const { error } = await supabase
                    .from('chat_poll_votes')
                    .delete()
                    .eq('poll_id', pollId)
                    .eq('user_id', user.id)
                    .eq('option_index', optionIndex);

                if (error) throw error;
            } else {
                if (!poll.allowMultiple) {
                    // Always clear previous votes for single choice enforcement
                    const { error: deleteError } = await supabase
                        .from('chat_poll_votes')
                        .delete()
                        .eq('poll_id', pollId)
                        .eq('user_id', user.id);

                    if (deleteError) throw deleteError;
                }

                const { error: insertError } = await supabase
                    .from('chat_poll_votes')
                    .insert({
                        poll_id: pollId,
                        user_id: user.id,
                        option_index: optionIndex
                    });

                // If code is 23505 (unique violation), it means the vote already exists, which is fine
                if (insertError && (insertError as any).code !== '23505') throw insertError;
            }
        } catch (err) {
            // Check if it's already caught 23505 (shouldn't reach here if handled above, but double check)
            if ((err as any)?.code === '23505') return;

            console.error("Error voting:", err);
            toast.error("Failed to update vote. Please try again.");
            // Subscription will fix state on error
        } finally {
            setVoting(false);
        }
    };

    const startEditing = () => {
        if (!poll) return;
        setEditQuestion(poll.question);
        setEditOptions(poll.options.map(o => o.text));
        setEditAllowMultiple(poll.allowMultiple);
        setIsEditing(true);
    };

    const handleUpdatePoll = async () => {
        if (!user || !poll || !editQuestion.trim() || editOptions.some(o => !o.trim())) {
            return;
        }

        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('chat_polls')
                .update({
                    question: editQuestion.trim(),
                    options: editOptions.map(o => o.trim()),
                    allow_multiple: editAllowMultiple
                })
                .eq('id', poll.id);

            if (error) throw error;
            setIsEditing(false);
            toast.success("Poll updated successfully!");
        } catch (err) {
            console.error("Error updating poll:", err);
            toast.error("Failed to update poll");
        } finally {
            setIsUpdating(false);
        }
    };

    const fetchVoterDetails = async () => {
        if (!pollId) return;
        setIsLoadingVotes(true);
        try {
            const { data: votesData, error: votesError } = await supabase
                .from('chat_poll_votes')
                .select('user_id, option_index')
                .eq('poll_id', pollId);

            if (votesError) throw votesError;

            if (votesData && votesData.length > 0) {
                const userIds = [...new Set(votesData.map(v => v.user_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, avatar_url')
                    .in('user_id', userIds);

                if (profilesError) throw profilesError;

                const combinedDetails = votesData.map(vote => {
                    const profile = profilesData?.find(p => p.user_id === vote.user_id);
                    return {
                        user_id: vote.user_id,
                        full_name: profile?.full_name || 'Unknown User',
                        avatar_url: profile?.avatar_url || '',
                        option_index: vote.option_index
                    };
                });
                setVoterDetails(combinedDetails);
            } else {
                setVoterDetails([]);
            }
        } catch (err) {
            console.error("Error fetching voter details:", err);
            toast.error("Failed to load voter details");
        } finally {
            setIsLoadingVotes(false);
        }
    };

    if (loading) return <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg animate-pulse w-full h-48" />;
    if (!poll) return null;

    const isCreator = user?.id === poll.createdBy;

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transform transition-all duration-500 hover:shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <BarChart2 className="w-6 h-6" />
                        <span className="text-[12px] uppercase font-black tracking-widest opacity-80">
                            {poll.allowMultiple ? 'Multiple Choice' : 'Interactive Poll'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                    <MoreVertical className="h-4 w-4 text-slate-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem
                                    className="text-sm font-semibold flex items-center gap-2 cursor-pointer"
                                    onClick={() => {
                                        fetchVoterDetails();
                                        setShowVotesModal(true);
                                    }}
                                >
                                    <Users className="w-4 h-4" />
                                    View Votes
                                </DropdownMenuItem>
                                {isCreator && (
                                    <DropdownMenuItem
                                        className="text-sm font-semibold flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                                        onClick={startEditing}
                                    >
                                        <BarChart2 className="w-4 h-4" />
                                        Edit Poll
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-5">
                        <Input
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                            className="h-12 text-lg font-bold bg-white dark:bg-slate-950 border-2 border-emerald-100 dark:border-emerald-900 focus:border-emerald-500 rounded-2xl px-5"
                            placeholder="Type your question..."
                        />
                        <div className="space-y-3">
                            {editOptions.map((option, idx) => (
                                <Input
                                    key={idx}
                                    value={option}
                                    onChange={(e) => {
                                        const newOpts = [...editOptions];
                                        newOpts[idx] = e.target.value;
                                        setEditOptions(newOpts);
                                    }}
                                    className="h-10 text-sm font-semibold border-2 rounded-xl px-5"
                                    placeholder={`Option ${idx + 1}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Allow Multiple Choice</span>
                            <button
                                onClick={() => setEditAllowMultiple(!editAllowMultiple)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${editAllowMultiple ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editAllowMultiple ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" className="rounded-full px-6 h-10 text-sm font-bold" onClick={() => setIsEditing(false)}>
                                CANCEL
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-10 text-sm font-black shadow-lg shadow-emerald-200 dark:shadow-none transition-all" onClick={handleUpdatePoll} disabled={isUpdating}>
                                {isUpdating ? "SAVING..." : "SAVE POLL"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="font-extrabold text-2xl leading-tight text-slate-900 dark:text-slate-50 mb-5 tracking-tight">
                            {poll.question}
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(5, poll.totalVotes))].map((_, i) => (
                                    <div key={i} className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 shadow-sm" />
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">{poll.totalVotes} responses collected</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Options */}
            {!isEditing && (
                <div className="p-6 space-y-8">
                    {poll.options.map((option, index) => {
                        const isSelected = poll.userVotes.has(index);
                        return (
                            <div key={index} className="space-y-3">
                                <button
                                    className={`w-full group text-left relative transition-all duration-300 ${isCreator ? 'cursor-not-allowed' : ''}`}
                                    onClick={() => handleVote(index)}
                                    disabled={voting || isCreator}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`size-5 transition-all flex items-center justify-center border-2 ${poll.allowMultiple ? 'rounded-md' : 'rounded-full'
                                                } ${isSelected ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 group-hover:border-emerald-300'}`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                            </div>
                                            <span className={`text-lg font-bold truncate transition-colors ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 shrink-0">
                                            <span className={`text-lg font-black tabular-nums transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                                {option.percentage}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">%</span>
                                        </div>
                                    </div>

                                    {/* Instant Horizontal Progress Line */}
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ease-out ${isSelected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            style={{ width: `${option.percentage}%` }}
                                        />
                                    </div>

                                    <div className="mt-1 flex justify-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {option.votes} {option.votes === 1 ? 'VOTE' : 'VOTES'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Voter Details Modal */}
            <Dialog open={showVotesModal} onOpenChange={setShowVotesModal}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-emerald-600 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Participants
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
                        {isLoadingVotes ? (
                            <div className="space-y-4 py-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                                            <div className="h-3 bg-slate-50 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : voterDetails.length === 0 ? (
                            <div className="text-center py-10">
                                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No votes yet</p>
                            </div>
                        ) : (
                            poll.options.map((option, optIdx) => {
                                const optionVoters = voterDetails.filter(v => v.option_index === optIdx);
                                if (optionVoters.length === 0) return null;

                                return (
                                    <div key={optIdx} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate pr-4">
                                                {option.text}
                                            </h4>
                                            <span className="shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-black">
                                                {optionVoters.length}
                                            </span>
                                        </div>
                                        <div className="space-y-2 pl-2 border-l-2 border-emerald-50 dark:border-emerald-900/30">
                                            {optionVoters.map((voter, vIdx) => (
                                                <div key={vIdx} className="flex items-center gap-3 group">
                                                    <Avatar className="h-8 w-8 border border-white dark:border-slate-800 shadow-sm">
                                                        <AvatarImage src={voter.avatar_url} />
                                                        <AvatarFallback className="bg-emerald-50 text-emerald-600 text-[10px] font-black">
                                                            {voter.full_name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-400 truncate">
                                                        {voter.full_name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
