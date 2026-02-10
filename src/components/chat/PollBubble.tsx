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
    isClosed: boolean;
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
                    allowMultiple: pollData.allow_multiple ?? false,
                    isClosed: pollData.is_closed ?? false
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

        // Check if poll is closed
        if ((poll as any).isClosed) {
            toast.error("This poll has been closed. Voting is no longer allowed.");
            return;
        }

        const isAlreadyVoted = poll.userVotes.has(optionIndex);
        const hasAnyVote = poll.userVotes.size > 0;

        // Optimistic UI Update: Calculate new state before database operation
        const newUserVotes = new Set(poll.userVotes);
        let newOptions = [...poll.options];
        let newTotalVotes = poll.totalVotes;

        if (isAlreadyVoted && poll.allowMultiple) {
            // Multi-choice: Deselect this option
            newUserVotes.delete(optionIndex);
            newTotalVotes = Math.max(0, newTotalVotes - 1);
            newOptions[optionIndex] = {
                ...newOptions[optionIndex],
                votes: Math.max(0, newOptions[optionIndex].votes - 1)
            };
        } else if (isAlreadyVoted && !poll.allowMultiple) {
            // Single-choice: Clicking same option does nothing (already selected)
            return;
        } else {
            // Selecting a new option
            if (!poll.allowMultiple && hasAnyVote) {
                // Single-choice: Remove previous vote from UI
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

            // Add new vote
            newUserVotes.add(optionIndex);
            newTotalVotes++;
            newOptions[optionIndex] = {
                ...newOptions[optionIndex],
                votes: newOptions[optionIndex].votes + 1
            };
        }

        // Recalculate percentages for all options
        newOptions = newOptions.map(opt => ({
            ...opt,
            percentage: newTotalVotes > 0 ? Math.round((opt.votes / newTotalVotes) * 100) : 0
        }));

        // Update local state immediately for instant feedback
        setPoll(prev => prev ? {
            ...prev,
            userVotes: newUserVotes,
            options: newOptions,
            totalVotes: newTotalVotes
        } : null);
        setVoting(true);

        try {
            // Database operation: Handle vote change atomically
            if (isAlreadyVoted && poll.allowMultiple) {
                // Multi-choice: Delete this specific vote
                const { error } = await supabase
                    .from('chat_poll_votes')
                    .delete()
                    .eq('poll_id', pollId)
                    .eq('user_id', user.id)
                    .eq('option_index', optionIndex);

                if (error) throw error;
            } else if (!isAlreadyVoted) {
                // Adding a new vote
                if (!poll.allowMultiple) {
                    // Single-choice: Delete ALL previous votes first (atomic vote change)
                    const { error: deleteError } = await supabase
                        .from('chat_poll_votes')
                        .delete()
                        .eq('poll_id', pollId)
                        .eq('user_id', user.id);

                    if (deleteError && deleteError.code !== 'PGRST116') {
                        // PGRST116 = no rows to delete, which is fine
                        throw deleteError;
                    }
                }

                // Insert the new vote
                const { error: insertError } = await supabase
                    .from('chat_poll_votes')
                    .insert({
                        poll_id: pollId,
                        user_id: user.id,
                        option_index: optionIndex
                    });

                if (insertError) {
                    // Handle unique constraint violation gracefully
                    if ((insertError as any).code === '23505') {
                        console.warn('Vote already exists, refreshing poll data...');
                        // Let the subscription handle the refresh
                        return;
                    }
                    throw insertError;
                }
            }

            // Success feedback
            if (!poll.allowMultiple && hasAnyVote && !isAlreadyVoted) {
                toast.success("Vote changed successfully!");
            }
        } catch (err) {
            console.error("Error updating vote:", err);
            toast.error("Failed to update vote. Please try again.");

            // Revert optimistic update by triggering a fresh fetch
            // The subscription will handle this automatically
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
        <div className="w-full max-w-sm">
            {/* Poll Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-400 dark:border-emerald-500 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-4 py-3 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="size-5 bg-emerald-500 rounded flex items-center justify-center">
                            <BarChart2 className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            Interactive Poll
                        </span>
                        {poll.isClosed && (
                            <span className="ml-auto px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase rounded">
                                Closed
                            </span>
                        )}
                    </div>

                    {/* Question */}
                    {isEditing ? (
                        <div className="space-y-3">
                            <Input
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                className="text-sm font-semibold"
                                placeholder="Type your question..."
                            />
                            <div className="space-y-2">
                                {editOptions.map((option, idx) => (
                                    <Input
                                        key={idx}
                                        value={option}
                                        onChange={(e) => {
                                            const newOpts = [...editOptions];
                                            newOpts[idx] = e.target.value;
                                            setEditOptions(newOpts);
                                        }}
                                        className="text-sm"
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                <span className="text-xs font-semibold">Allow Multiple</span>
                                <button
                                    onClick={() => setEditAllowMultiple(!editAllowMultiple)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${editAllowMultiple ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${editAllowMultiple ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleUpdatePoll} disabled={isUpdating}>
                                    {isUpdating ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                            {poll.question}
                        </h3>
                    )}
                </div>

                {/* Options */}
                {!isEditing && (
                    <div className="px-4 pb-4 space-y-2">
                        {poll.options.map((option, index) => {
                            const isSelected = poll.userVotes.has(index);
                            return (
                                <button
                                    key={index}
                                    className={`w-full text-left transition-all duration-200 ${isCreator || poll.isClosed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
                                        }`}
                                    onClick={() => handleVote(index)}
                                    disabled={voting || isCreator || poll.isClosed}
                                >
                                    {/* Option Text and Percentage */}
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {isSelected && (
                                                <div className="size-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                                                </div>
                                            )}
                                            <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                            {option.percentage}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isSelected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                            style={{ width: `${option.percentage}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                {!isEditing && (
                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                        <button
                            onClick={() => {
                                fetchVoterDetails();
                                setShowVotesModal(true);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:underline"
                        >
                            View votes
                        </button>
                        {isCreator && (
                            <>
                                <span className="mx-2 text-slate-300">•</span>
                                <button
                                    onClick={startEditing}
                                    className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:underline"
                                >
                                    Edit
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Voter Details Modal */}
            <Dialog open={showVotesModal} onOpenChange={setShowVotesModal}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Poll Votes
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-4">
                        {isLoadingVotes ? (
                            <div className="space-y-3 py-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-8 h-8 bg-slate-100 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                                            <div className="h-2 bg-slate-50 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : voterDetails.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm font-medium">No votes yet</p>
                            </div>
                        ) : (
                            poll.options.map((option, optIdx) => {
                                const optionVoters = voterDetails.filter(v => v.option_index === optIdx);
                                if (optionVoters.length === 0) return null;

                                return (
                                    <div key={optIdx} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                                {option.text}
                                            </h4>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                                                {optionVoters.length}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 pl-3 border-l-2 border-emerald-100 dark:border-emerald-900/30">
                                            {optionVoters.map((voter, vIdx) => (
                                                <div key={vIdx} className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={voter.avatar_url} />
                                                        <AvatarFallback className="bg-emerald-50 text-emerald-600 text-[9px] font-bold">
                                                            {voter.full_name?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
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
