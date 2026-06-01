import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { StreakService, BadgeType, UserStreak, UserBadge, BADGE_DETAILS } from '@/services/streakService';
import { supabase } from '@/integrations/supabase/client';
import { CelebrationOverlay } from '@/components/streak/CelebrationOverlay';
import confetti from 'canvas-confetti';
import { StreakUpdateModal } from '@/components/streak/StreakUpdateModal';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

// ── Module-level streak cache ────────────────────────────────────────────────────
let streakCache: UserStreak | null = null;
let badgesCache: UserBadge[] | null = null;

interface StreakContextType {
    streak: UserStreak | null;
    badges: UserBadge[];
    activityLog: string[];
    loading: boolean;
    recordAcademicAction: () => Promise<void>;
    refreshStreakData: () => Promise<void>;
    fetchActivityRange: (start: string, end: string) => Promise<void>;
    setGuideCompleted: (completed: boolean) => void; // Add this to track guide completion
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

const BADGE_XP_VALUES: Record<BadgeType, number> = {
    novice: 100,
    learner: 250,
    scholar: 500,
    prodigy: 750,
    warrior: 1000,
    elite: 2000,
    master: 3000,
    grandmaster: 5000,
    titan: 10000,
    immortal: 25000,
};

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role } = useAuth();
    // Initialise from module-level cache if available so `loading` starts false
    const [streak, setStreak] = useState<UserStreak | null>(streakCache);
    const [badges, setBadges] = useState<UserBadge[]>(badgesCache ?? []);
    const [activityLog, setActivityLog] = useState<string[]>([]);
    const [loading, setLoading] = useState(streakCache === null);
    const [unlockedBadge, setUnlockedBadge] = useState<BadgeType | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showStreakUpdate, setShowStreakUpdate] = useState(false);
    const [currentStreakCount, setCurrentStreakCount] = useState(0);
    const [isGuideCompleted, setIsGuideCompleted] = useState(false); // Track if guide has been shown/completed
    const [pendingStreakData, setPendingStreakData] = useState<{ unlockedBadge?: BadgeType; newStreak?: number; isNewDay?: boolean } | null>(null); // Store pending streak data

    const isStudent = role === 'student';

    const refreshStreakData = useCallback(async () => {
        if (!user || !isStudent) {
            setStreak(null);
            setBadges([]);
            setActivityLog([]);
            setLoading(false);
            return;
        }

        try {
            const [streakData, badgesData] = await Promise.all([
                StreakService.getStreak(user.id),
                StreakService.getBadges(user.id)
            ]);
            // Update module-level cache so next mount starts instantly
            streakCache = streakData;
            badgesCache = badgesData;
            setStreak(streakData);
            setBadges(badgesData);
        } catch (error) {
            console.error('Error refreshing streak data:', error);
        } finally {
            setLoading(false);
        }
    }, [user, isStudent]);

    const fetchActivityRange = useCallback(async (start: string, end: string) => {
        if (!user || !isStudent) return;
        try {
            const logs = await StreakService.getActivityLog(user.id, start, end);
            setActivityLog(logs);
        } catch (error) {
            console.error('Error fetching activity range:', error);
        }
    }, [user, isStudent]);

    useEffect(() => {
        if (!user || !isStudent) return;

        // Fetch initial data
        refreshStreakData();

        // Subscribe to real-time changes on user_badges table for the current user
        const badgesChannel = supabase
            .channel(`realtime-user-badges-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_badges',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newBadge = payload.new as UserBadge;
                    setBadges(prev => {
                        if (prev.some(b => b.id === newBadge.id)) return prev;
                        
                        // Dynamic Sonner Toast & Confetti Notification
                        const details = BADGE_DETAILS[newBadge.badge_type];
                        const badgeXp = BADGE_XP_VALUES[newBadge.badge_type] || 0;
                        if (details) {
                            toast.success(`🎉 Badge Unlocked: ${details.name}!`, {
                                description: `Consistency Level ${details.level} Days • Earned +${badgeXp} XP!`,
                                duration: 8000
                            });
                        }
                        
                        // Particle Confetti Shower
                        try {
                            confetti({
                                particleCount: 100,
                                spread: 80,
                                origin: { y: 0.6 },
                                colors: ['#fbbf24', '#6366f1', '#a855f7', '#10b981']
                            });
                        } catch (err) {
                            console.error('Failed to play confetti:', err);
                        }

                        return [...prev, newBadge];
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'user_badges',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const oldBadge = payload.old as { id: string };
                    setBadges(prev => prev.filter(b => b.id !== oldBadge.id));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_badges',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const updatedBadge = payload.new as UserBadge;
                    setBadges(prev => prev.map(b => b.id === updatedBadge.id ? updatedBadge : b));
                }
            )
            .subscribe();

        // Subscribe to real-time changes on user_streaks table for the current user
        const streakChannel = supabase
            .channel(`realtime-user-streaks-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_streaks',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newStreak = payload.new as UserStreak;
                        setStreak(newStreak);
                    } else if (payload.eventType === 'DELETE') {
                        setStreak(null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(badgesChannel);
            supabase.removeChannel(streakChannel);
        };
    }, [user, isStudent, refreshStreakData]);

    const recordAcademicAction = useCallback(async () => {
        if (!user || !isStudent) return;

        try {
            const result = await StreakService.recordAction(user.id);

            if (result.updated) {
                // Refresh local state
                await refreshStreakData();

                // Also refresh activity log for today to show the flame
                const today = format(new Date(), 'yyyy-MM-dd');
                setActivityLog(prev => prev.includes(today) ? prev : [...prev, today]);

                // If guide hasn't been completed yet, store the streak data as pending
                if (!isGuideCompleted) {
                    if (result.unlockedBadge || result.isNewDay) {
                        setPendingStreakData({
                            unlockedBadge: result.unlockedBadge,
                            newStreak: result.newStreak,
                            isNewDay: result.isNewDay
                        });
                    }
                } else {
                    // Guide already completed, show modals immediately
                    if (result.unlockedBadge) {
                        setUnlockedBadge(result.unlockedBadge);
                        setShowCelebration(true);
                    } else if (result.isNewDay) {
                        setCurrentStreakCount(result.newStreak);
                        setShowStreakUpdate(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error recording academic action:', error);
        }
    }, [user, isStudent, refreshStreakData, isGuideCompleted]);



    const setGuideCompleted = useCallback((completed: boolean) => {
        setIsGuideCompleted(completed);
        
        // If there's pending streak data and guide is now completed, show the modals
        if (completed && pendingStreakData) {
            if (pendingStreakData.unlockedBadge) {
                setUnlockedBadge(pendingStreakData.unlockedBadge);
                setShowCelebration(true);
            } else if (pendingStreakData.isNewDay && pendingStreakData.newStreak) {
                setCurrentStreakCount(pendingStreakData.newStreak);
                setShowStreakUpdate(true);
            }
            // Clear pending data after showing
            setPendingStreakData(null);
        }
    }, [pendingStreakData]);

    return (
        <StreakContext.Provider value={{
            streak,
            badges,
            activityLog,
            loading,
            recordAcademicAction,
            refreshStreakData,
            fetchActivityRange,
            setGuideCompleted, // Add this to the provider value
        }}>
            {children}
            {isStudent && showCelebration && unlockedBadge && (() => {
                const details = BADGE_DETAILS[unlockedBadge];
                const badgeXp = BADGE_XP_VALUES[unlockedBadge] || 0;
                return (
                    <CelebrationOverlay
                        title="STREAK MILESTONE MET!"
                        subtitle="Your dedication has unlocked a new rank"
                        badgeName={details.name}
                        badgeDescription={details.description}
                        imageUrl={details.imageUrl}
                        iconName={details.icon}
                        color={details.color}
                        xpReward={badgeXp}
                        streakCount={streak?.current_streak || details.level}
                        showXp={false}
                        onClose={() => setShowCelebration(false)}
                    />
                );
            })()}
            {isStudent && showStreakUpdate && (
                <StreakUpdateModal
                    streakCount={currentStreakCount}
                    onClose={() => setShowStreakUpdate(false)}
                />
            )}
        </StreakContext.Provider>
    );
};

export const useStreak = () => {
    const context = useContext(StreakContext);
    if (context === undefined) {
        throw new Error('useStreak must be used within a StreakProvider');
    }
    return context;
};
