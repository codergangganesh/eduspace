import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export type BadgeType = 'novice' | 'learner' | 'scholar' | 'prodigy' | 'warrior' | 'elite' | 'master' | 'grandmaster' | 'titan' | 'immortal';

export interface UserStreak {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    total_days: number;
    last_action_date: string | null;
    updated_at: string;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_type: BadgeType;
    unlocked_at: string;
    streak_count: number;
}

export const STREAK_LEVELS: Record<number, BadgeType> = {
    3: 'novice',
    7: 'learner',
    14: 'scholar',
    21: 'prodigy',
    30: 'warrior',
    60: 'elite',
    100: 'master',
    180: 'grandmaster',
    365: 'titan',
    730: 'immortal',
};

export interface StreakHeat {
    color: string;
    label: string;
    glow: string;
    fill: string;
    className: string;
    iconType: 'flame' | 'diamond';
}

export const getStreakHeat = (days: number): StreakHeat => {
    if (days > 100) {
        return {
            color: '#EF4444',
            label: 'Crimson Legend',
            glow: 'rgba(239, 68, 68, 0.6)',
            fill: '#EF4444',
            className: 'text-red-500 fill-red-500 shadow-red-500/50',
            iconType: 'flame'
        };
    } else if (days >= 30) {
        return {
            color: '#FBBF24',
            label: 'Golden Diamond',
            glow: 'rgba(251, 191, 36, 0.6)',
            fill: '#FBBF24',
            className: 'text-amber-400 fill-amber-400 shadow-amber-400/50',
            iconType: 'diamond'
        };
    } else if (days >= 7) {
        return {
            color: '#F97316',
            label: 'Orange Blaze',
            glow: 'rgba(249, 115, 22, 0.4)',
            fill: '#F97316',
            className: 'text-orange-500 fill-orange-500 shadow-orange-500/50',
            iconType: 'flame'
        };
    } else {
        return {
            color: '#3B82F6',
            label: 'Blue Flare',
            glow: 'rgba(59, 130, 246, 0.4)',
            fill: '#3B82F6',
            className: 'text-blue-500 fill-blue-500 shadow-blue-500/50',
            iconType: 'flame'
        };
    }
};

export const BADGE_DETAILS: Record<BadgeType, { name: string; description: string; color: string; level: number; icon: string }> = {
    novice: {
        name: 'Novice Learner',
        description: '🎯 The journey of a thousand miles begins with 3 days.',
        color: '#94A3B8',
        level: 3,
        icon: 'Target'
    },
    learner: {
        name: 'Consistent Learner',
        description: '🥈 7 days of dedication. You are building a powerful habit.',
        color: '#CD7F32',
        level: 7,
        icon: 'Award'
    },
    scholar: {
        name: 'Dedicated Scholar',
        description: '🥇 14 days! Your academic discipline is truly showing.',
        color: '#F59E0B',
        level: 14,
        icon: 'Medal'
    },
    prodigy: {
        name: 'Academic Prodigy',
        description: '🎓 21 days! Your brilliance is shining brighter every day.',
        color: '#10B981',
        level: 21,
        icon: 'GraduationCap'
    },
    warrior: {
        name: 'Academic Warrior',
        description: '⚡ 30 days of excellence. A full month of peak performance.',
        color: '#06B6D4',
        level: 30,
        icon: 'Zap'
    },
    elite: {
        name: 'Eduspace Elite',
        description: '🛡️ 60 days! You are among the top 1% of consistent students.',
        color: '#8B5CF6',
        level: 60,
        icon: 'Shield'
    },
    master: {
        name: 'Academic Master',
        description: '🏆 100 days of absolute consistency. A true master of your craft.',
        color: '#EF4444',
        level: 100,
        icon: 'Trophy'
    },
    grandmaster: {
        name: 'Grandmaster',
        description: '⚔️ 180 days! Half a year of relentless academic pursuit.',
        color: '#6366F1',
        level: 180,
        icon: 'Sword'
    },
    titan: {
        name: 'Yearling Titan',
        description: '💎 365 days of Eduspace! A whole year of transformation.',
        color: '#FBBF24',
        level: 365,
        icon: 'Gem'
    },
    immortal: {
        name: 'Academic Immortal',
        description: '🌌 730 days. 2 years of perfection. You are now academic legend.',
        color: '#10B981',
        level: 730,
        icon: 'Infinity'
    }
};

export class StreakService {
    /**
     * Records an academic action and updates the user's streak.
     * Returns information about whether a new streak was started or a badge was unlocked.
     */
    static async recordAction(userId: string): Promise<{
        updated: boolean;
        newStreak: number;
        unlockedBadge?: BadgeType;
        isNewDay: boolean;
    }> {
        const today = format(new Date(), 'yyyy-MM-dd');

        // 1. Get current streak data
        const { data: streak, error: fetchError } = await (supabase as any)
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching streak:', fetchError);
            return { updated: false, newStreak: 0, isNewDay: false };
        }

        // 2. Determine if we should update
        if (streak && streak.last_action_date === today) {
            // Already recorded an action today
            return { updated: false, newStreak: streak.current_streak, isNewDay: false };
        }

        let newCurrentStreak = 1;
        let newTotalDays = (streak?.total_days || 0) + 1;
        let newLongestStreak = streak?.longest_streak || 0;

        if (streak && streak.last_action_date) {
            const lastDate = new Date(streak.last_action_date);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');

            if (streak.last_action_date === yesterdayFormatted) {
                // Continuous streak
                newCurrentStreak = streak.current_streak + 1;
            } else {
                // Streak broken
                newCurrentStreak = 1;
            }
        }

        if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
        }

        // 3. Update or Insert streak
        const streakUpdate = {
            user_id: userId,
            current_streak: newCurrentStreak,
            longest_streak: newLongestStreak,
            total_days: newTotalDays,
            last_action_date: today,
        };

        const { error: upsertError } = await (supabase as any)
            .from('user_streaks')
            .upsert(streakUpdate);

        if (upsertError) {
            console.error('Error updating streak:', upsertError);
            return { updated: false, newStreak: 0, isNewDay: true };
        }

        // 4. Check for badge unlock
        let unlockedBadge: BadgeType | undefined;
        if (STREAK_LEVELS[newCurrentStreak]) {
            unlockedBadge = STREAK_LEVELS[newCurrentStreak];

            // Save badge unlock to DB
            const { error: badgeError } = await (supabase as any)
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_type: unlockedBadge,
                    streak_count: newCurrentStreak,
                    unlocked_at: new Date().toISOString()
                })
                .select();

            if (badgeError && badgeError.code !== '23505') { // Ignore unique constraint errors
                console.error('Error unlocking badge:', badgeError);
            }
        }

        // 5. Log activity permanently
        const { error: logError } = await (supabase as any)
            .from('user_activity_log')
            .upsert({
                user_id: userId,
                action_date: today
            }, { onConflict: 'user_id,action_date' });

        if (logError && logError.code !== '23505') {
            console.error('Error logging activity:', logError);
        } else if (newCurrentStreak > 60 && newCurrentStreak % 30 === 0) {
            // For streaks > 60, maybe every 30 days we can trigger something or just re-reward elite?
            // But prompt says 60+ is "Eduspace Elite". 
        }

        return {
            updated: true,
            newStreak: newCurrentStreak,
            unlockedBadge,
            isNewDay: true
        };
    }

    static async getStreak(userId: string): Promise<UserStreak | null> {
        const { data, error } = await (supabase as any)
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            console.error('Error fetching streak:', error);
            return null;
        }
        return data;
    }

    static async getBadges(userId: string): Promise<UserBadge[]> {
        const { data, error } = await (supabase as any)
            .from('user_badges')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching badges:', error);
            return [];
        }
        return data || [];
    }

    static async getActivityLog(userId: string, start: string, end: string): Promise<string[]> {
        const { data, error } = await (supabase as any)
            .from('user_activity_log')
            .select('action_date')
            .eq('user_id', userId)
            .gte('action_date', start)
            .lte('action_date', end);

        if (error) {
            console.error('Error fetching activity log:', error);
            return [];
        }
        return (data || []).map((row: any) => row.action_date);
    }


}
