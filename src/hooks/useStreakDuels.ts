import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StreakDuelService, StreakDuel, ClassGroup } from "@/services/streakDuelService";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useStreakDuels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Queries using TanStack React Query
  const { data: activeDuels = [], isLoading: isActiveLoading } = useQuery({
    queryKey: ["streakDuels", "active", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Sync scores via database RPC on load
      await StreakDuelService.syncActiveDuelsScores(user.id);
      return StreakDuelService.fetchActiveDuels(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Cache is fresh for 2 minutes to allow smooth navigations
  });

  const { data: pendingDuels = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["streakDuels", "pending", user?.id],
    queryFn: () => (user?.id ? StreakDuelService.fetchPendingDuels(user.id) : []),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3,
  });

  const { data: pastDuels = [], isLoading: isPastLoading } = useQuery({
    queryKey: ["streakDuels", "past", user?.id],
    queryFn: () => (user?.id ? StreakDuelService.fetchDuelHistory(user.id) : []),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: classesAndClassmates = [], isLoading: isClassmatesLoading } = useQuery({
    queryKey: ["classesAndClassmates", user?.id],
    queryFn: () => (user?.id ? StreakDuelService.fetchClassesAndClassmates(user.id) : []),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Class roster rarely updates, keep it cached longer
  });

  const isLoading = isActiveLoading || isPendingLoading || isPastLoading || isClassmatesLoading;

  // Helper to invalidate all related queries to force UI refetches
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["streakDuels", "active", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["streakDuels", "pending", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["streakDuels", "past", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["classesAndClassmates", user?.id] });
  };

  // 2. Real-time changes subscription linked with React Query invalidation
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`streak_duels_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_duels'
        },
        async (payload) => {
          console.log("Realtime payload received inside useStreakDuels:", payload);
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // 1. Challenged: INSERT event where current user is defender
          if (payload.eventType === 'INSERT' && newRecord.defender_id === user.id) {
            const { data: profile } = await supabase
              .from('student_profiles')
              .select('full_name')
              .eq('user_id', newRecord.challenger_id)
              .maybeSingle();

            toast.info("⚔️ New Duel Challenge!", {
              description: `${profile?.full_name || "A classmate"} has challenged you to a 7-day Streak Duel! Go to the Streaks tab to respond.`,
              duration: 8000
            });
          }

          // 2. Acceptance: UPDATE event where status changes from pending to active
          if (
            payload.eventType === 'UPDATE' &&
            newRecord.status === 'active' &&
            oldRecord?.status === 'pending'
          ) {
            if (newRecord.challenger_id === user.id) {
              const { data: profile } = await supabase
                .from('student_profiles')
                .select('full_name')
                .eq('user_id', newRecord.defender_id)
                .maybeSingle();

              toast.success("🔥 Duel Accepted!", {
                description: `${profile?.full_name || "Your opponent"} accepted your challenge! Let the consistency duel begin! ⚔️`,
                duration: 8000
              });
            }
          }

          // 3. Duel Concluded: UPDATE event where status changes to completed
          if (
            payload.eventType === 'UPDATE' &&
            newRecord.status === 'completed' &&
            oldRecord?.status !== 'completed'
          ) {
            const isChallenger = newRecord.challenger_id === user.id;
            const isDefender = newRecord.defender_id === user.id;

            if (isChallenger || isDefender) {
              const opponentId = isChallenger ? newRecord.defender_id : newRecord.challenger_id;
              const { data: profile } = await supabase
                .from('student_profiles')
                .select('full_name')
                .eq('user_id', opponentId)
                .maybeSingle();

              const oppName = profile?.full_name || "your opponent";

              if (newRecord.winner_id === user.id) {
                toast.success("🏆 VICTORY!", {
                  description: `You defeated ${oppName} in the Streak Duel! Amazing consistency! +50 XP!`,
                  duration: 10000
                });
              } else if (newRecord.winner_id === null) {
                toast.info("🤝 TIE!", {
                  description: `You and ${oppName} tied in the Streak Duel! Outstanding effort from both of you!`,
                  duration: 8000
                });
              } else {
                toast.error("💀 DEFEAT!", {
                  description: `You were defeated by ${oppName} in the Streak Duel. Keep building your daily habit!`,
                  duration: 8000
                });
              }
            }
          }

          // Invalidate React Query cache to keep UI perfectly synchronized in real-time
          invalidateAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // 3. React Query Mutations for Clean Action Tracking
  const challengeClassmateMutation = useMutation({
    mutationFn: async ({ defenderId, classId }: { defenderId: string; classId: string }) => {
      if (!user?.id) throw new Error("No authenticated user");
      return StreakDuelService.createDuel(user.id, defenderId, classId);
    },
    onSuccess: (duel) => {
      if (duel) {
        toast.success("Challenge Sent! ⚔️", {
          description: `Waiting for ${duel.defender_name} to accept your streak battle.`
        });
        invalidateAll();
      } else {
        toast.error("Could not send challenge.", {
          description: "You might already have a duel pending or active with this peer."
        });
      }
    },
    onError: () => {
      toast.error("Could not send challenge.");
    }
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: (duelId: string) => StreakDuelService.respondToDuel(duelId, true),
    onSuccess: (success) => {
      if (success) {
        toast.success("Duel Accepted! ⚔️", {
          description: "Consistency starts today. Let the battle begin!"
        });
        invalidateAll();
      } else {
        toast.error("Error accepting duel.");
      }
    },
    onError: () => {
      toast.error("Error accepting duel.");
    }
  });

  const declineChallengeMutation = useMutation({
    mutationFn: (duelId: string) => StreakDuelService.respondToDuel(duelId, false),
    onSuccess: (success) => {
      if (success) {
        toast.info("Duel Declined", {
          description: "The challenge request was rejected."
        });
        invalidateAll();
      } else {
        toast.error("Error declining duel.");
      }
    },
    onError: () => {
      toast.error("Error declining duel.");
    }
  });

  const syncScoresMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      return StreakDuelService.syncActiveDuelsScores(user.id);
    },
    onSuccess: () => {
      invalidateAll();
    }
  });

  return {
    activeDuels,
    pendingDuels,
    pastDuels,
    classesAndClassmates,
    isLoading,
    challengeClassmate: async (defenderId: string, classId: string) => {
      challengeClassmateMutation.mutate({ defenderId, classId });
      return true;
    },
    acceptChallenge: async (duelId: string) => {
      acceptChallengeMutation.mutate(duelId);
      return true;
    },
    declineChallenge: async (duelId: string) => {
      declineChallengeMutation.mutate(duelId);
      return true;
    },
    syncScores: async () => {
      syncScoresMutation.mutate();
    },
    refresh: async () => {
      invalidateAll();
    }
  };
}
