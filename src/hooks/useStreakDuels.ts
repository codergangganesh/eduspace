import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StreakDuelService, StreakDuel, ClassGroup } from "@/services/streakDuelService";
import { toast } from "sonner";

// High-performance module-level cache for instant visual load
let cachedUserId = "";
let cachedActiveDuels: StreakDuel[] = [];
let cachedPendingDuels: StreakDuel[] = [];
let cachedPastDuels: StreakDuel[] = [];
let cachedClassesAndClassmates: ClassGroup[] = [];
let hasCachedData = false;
let cachedIsLoading = false;

type DuelStoreSnapshot = {
  activeDuels: StreakDuel[];
  pendingDuels: StreakDuel[];
  pastDuels: StreakDuel[];
  classesAndClassmates: ClassGroup[];
  isLoading: boolean;
};

const subscribers = new Set<(snapshot: DuelStoreSnapshot) => void>();

const getSnapshot = (): DuelStoreSnapshot => ({
  activeDuels: cachedActiveDuels,
  pendingDuels: cachedPendingDuels,
  pastDuels: cachedPastDuels,
  classesAndClassmates: cachedClassesAndClassmates,
  isLoading: cachedIsLoading,
});

const broadcastSnapshot = () => {
  const snapshot = getSnapshot();
  subscribers.forEach((listener) => listener(snapshot));
};

const subscribeToSnapshot = (listener: (snapshot: DuelStoreSnapshot) => void) => {
  subscribers.add(listener);
  listener(getSnapshot());
  return () => {
    subscribers.delete(listener);
  };
};

export function useStreakDuels() {
  const { user } = useAuth();

  // Safe cache eviction & sync when user login state changes
  if (user?.id && cachedUserId !== user.id) {
    cachedUserId = user.id;
    cachedActiveDuels = [];
    cachedPendingDuels = [];
    cachedPastDuels = [];
    cachedClassesAndClassmates = [];
    hasCachedData = false;
    cachedIsLoading = false;
    broadcastSnapshot();
  }

  const [activeDuels, setActiveDuels] = useState<StreakDuel[]>(cachedActiveDuels);
  const [pendingDuels, setPendingDuels] = useState<StreakDuel[]>(cachedPendingDuels);
  const [pastDuels, setPastDuels] = useState<StreakDuel[]>(cachedPastDuels);
  const [classesAndClassmates, setClassesAndClassmates] = useState<ClassGroup[]>(cachedClassesAndClassmates);
  const [isLoading, setIsLoading] = useState<boolean>(!hasCachedData);

  useEffect(() => {
    return subscribeToSnapshot((snapshot) => {
      setActiveDuels(snapshot.activeDuels);
      setPendingDuels(snapshot.pendingDuels);
      setPastDuels(snapshot.pastDuels);
      setClassesAndClassmates(snapshot.classesAndClassmates);
      setIsLoading(snapshot.isLoading);
    });
  }, []);

  const fetchAllData = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) {
      cachedIsLoading = true;
      broadcastSnapshot();
    }
    try {
      // Sync scores and check expirations first
      await StreakDuelService.syncActiveDuelsScores(user.id);

      // Fetch all categories
      const [active, pending, past, classmates] = await Promise.all([
        StreakDuelService.fetchActiveDuels(user.id),
        StreakDuelService.fetchPendingDuels(user.id),
        StreakDuelService.fetchDuelHistory(user.id),
        StreakDuelService.fetchClassesAndClassmates(user.id),
      ]);

      setActiveDuels(active);
      setPendingDuels(pending);
      setPastDuels(past);
      setClassesAndClassmates(classmates);

      // Update module-level cache for next instant mounts
      cachedActiveDuels = active;
      cachedPendingDuels = pending;
      cachedPastDuels = past;
      cachedClassesAndClassmates = classmates;
      hasCachedData = true;
      cachedIsLoading = false;
      broadcastSnapshot();
    } catch (error) {
      console.error("Failed to load duel data:", error);
      toast.error("Failed to load duels and classmates list.");
    } finally {
      cachedIsLoading = false;
      broadcastSnapshot();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    // If there is cached data, perform a silent refresh in background; otherwise, show full loader.
    fetchAllData(hasCachedData);
  }, [user?.id, fetchAllData]);

  // Real-time subscription
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
            // Fetch challenger name
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

          // Refetch state to keep in sync
          fetchAllData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAllData]);

  // Actions
  const challengeClassmate = async (defenderId: string, classId: string) => {
    if (!user?.id) return false;
    const duel = await StreakDuelService.createDuel(user.id, defenderId, classId);
    if (duel) {
      toast.success("Challenge Sent! ⚔️", {
        description: `Waiting for ${duel.defender_name} to accept your streak battle.`
      });
      fetchAllData(true);
      return true;
    } else {
      toast.error("Could not send challenge.", {
        description: "You might already have a duel pending or active with this peer."
      });
      return false;
    }
  };

  const acceptChallenge = async (duelId: string) => {
    const success = await StreakDuelService.respondToDuel(duelId, true);
    if (success) {
      toast.success("Duel Accepted! ⚔️", {
        description: "Consistency starts today. Let the battle begin!"
      });
      fetchAllData(true);
    } else {
      toast.error("Error accepting duel.");
    }
    return success;
  };

  const declineChallenge = async (duelId: string) => {
    const success = await StreakDuelService.respondToDuel(duelId, false);
    if (success) {
      toast.info("Duel Declined", {
        description: "The challenge request was rejected."
      });
      fetchAllData(true);
    } else {
      toast.error("Error declining duel.");
    }
    return success;
  };

  const syncScores = async () => {
    if (!user?.id) return;
    await StreakDuelService.syncActiveDuelsScores(user.id);
    fetchAllData(true);
  };

  return {
    activeDuels,
    pendingDuels,
    pastDuels,
    classesAndClassmates,
    isLoading,
    challengeClassmate,
    acceptChallenge,
    declineChallenge,
    syncScores,
    refresh: fetchAllData
  };
}
