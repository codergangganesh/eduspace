import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { StreakService, BadgeType, UserStreak, UserBadge, BADGE_DETAILS } from '@/services/streakService';
import { StreakCelebrationModal } from '@/components/streak/StreakCelebrationModal';
import { StreakUpdateModal } from '@/components/streak/StreakUpdateModal';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface StreakContextType {
    streak: UserStreak | null;
    badges: UserBadge[];
    activityLog: string[];
    loading: boolean;
    recordAcademicAction: () => Promise<void>;
    refreshStreakData: () => Promise<void>;
    fetchActivityRange: (start: string, end: string) => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [streak, setStreak] = useState<UserStreak | null>(null);
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [activityLog, setActivityLog] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlockedBadge, setUnlockedBadge] = useState<BadgeType | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showStreakUpdate, setShowStreakUpdate] = useState(false);
    const [currentStreakCount, setCurrentStreakCount] = useState(0);

    const refreshStreakData = useCallback(async () => {
        if (!user) {
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
            setStreak(streakData);
            setBadges(badgesData);
        } catch (error) {
            console.error('Error refreshing streak data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchActivityRange = useCallback(async (start: string, end: string) => {
        if (!user) return;
        try {
            const logs = await StreakService.getActivityLog(user.id, start, end);
            setActivityLog(logs);
        } catch (error) {
            console.error('Error fetching activity range:', error);
        }
    }, [user]);

    useEffect(() => {
        refreshStreakData();
    }, [refreshStreakData]);

    const recordAcademicAction = useCallback(async () => {
        if (!user) return;

        try {
            const result = await StreakService.recordAction(user.id);

            if (result.updated) {
                // Refresh local state
                await refreshStreakData();

                // Also refresh activity log for today to show the flame
                const today = format(new Date(), 'yyyy-MM-dd');
                setActivityLog(prev => prev.includes(today) ? prev : [...prev, today]);

                if (result.unlockedBadge) {
                    setUnlockedBadge(result.unlockedBadge);
                    setShowCelebration(true);
                } else if (result.isNewDay) {
                    setCurrentStreakCount(result.newStreak);
                    setShowStreakUpdate(true);
                }
            }
        } catch (error) {
            console.error('Error recording academic action:', error);
        }
    }, [user, refreshStreakData]);



    return (
        <StreakContext.Provider value={{
            streak,
            badges,
            activityLog,
            loading,
            recordAcademicAction,
            refreshStreakData,
            fetchActivityRange,
        }}>
            {children}
            {showCelebration && unlockedBadge && (
                <StreakCelebrationModal
                    badgeType={unlockedBadge}
                    streakCount={streak?.current_streak || 0}
                    onClose={() => setShowCelebration(false)}
                />
            )}
            {showStreakUpdate && (
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
