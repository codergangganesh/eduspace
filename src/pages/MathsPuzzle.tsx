import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Shield,
  ArrowLeft,
  HelpCircle,
  Settings,
  Zap,
  X,
  ChevronRight,
  ArrowRight,
  Droplets,
  Grid3X3,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { MathPathGame } from '../components/puzzle/MathPathGame';
import { DropletDashGame } from '../components/puzzle/DropletDashGame';
import { TypeDashGame } from '../components/puzzle/TypeDashGame';
import { useStreak } from '../contexts/StreakContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { MathPlaygroundSettings } from '../components/puzzle/MathPlaygroundSettings';
import { MathTheme } from '../lib/mathGameTheme';
import { mathGameAudio } from '../lib/mathGameAudio';
import { supabase } from '@/integrations/supabase/client';

const getFloatingToggleStyle = (themeId: MathTheme['id']) => {
  switch (themeId) {
    case 'cricket':
      return {
        container: 'bg-slate-950/80 backdrop-blur-xl border border-amber-500/40 shadow-2xl',
        itemActiveAddition: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30',
        itemActiveMultiplication: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30',
        itemActiveText: 'text-slate-950 font-black',
        itemInactive: 'text-amber-200/70 hover:text-amber-300 font-bold',
      };
    case 'retro':
      return {
        container: 'bg-black border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-mono',
        itemActiveAddition: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
        itemActiveMultiplication: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]',
        itemActiveText: 'text-black',
        itemInactive: 'text-emerald-500/60 hover:text-emerald-400 font-bold',
      };
    case 'sunset':
      return {
        container: 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-orange-200/50 dark:border-zinc-800/80 shadow-[0_8px_30px_rgba(249,115,22,0.15)]',
        itemActiveAddition: 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20',
        itemActiveMultiplication: 'bg-gradient-to-r from-orange-600 to-rose-600 shadow-lg shadow-rose-500/20',
        itemActiveText: 'text-white',
        itemInactive: 'text-orange-950/60 dark:text-amber-100/60 hover:text-orange-600 dark:hover:text-orange-400 font-bold',
      };
    case 'nordic':
      return {
        container: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-sky-100/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(14,165,233,0.15)]',
        itemActiveAddition: 'bg-sky-600 shadow-lg shadow-sky-600/20',
        itemActiveMultiplication: 'bg-indigo-600 shadow-lg shadow-indigo-600/20',
        itemActiveText: 'text-white',
        itemInactive: 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 font-bold',
      };
    case 'cyber':
    default:
      return {
        container: 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-[0_12px_40px_rgba(0,0,0,0.15)]',
        itemActiveAddition: 'bg-blue-600 shadow-lg shadow-blue-500/20',
        itemActiveMultiplication: 'bg-yellow-600 shadow-lg shadow-yellow-500/20',
        itemActiveText: 'text-white',
        itemInactive: 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-yellow-600 font-bold',
      };
  }
};

const getThemeTextColor = (themeId: MathTheme['id']) => {
  switch (themeId) {
    case 'cricket':
      return 'text-amber-400';
    case 'retro':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'sunset':
      return 'text-orange-600 dark:text-orange-400';
    case 'nordic':
      return 'text-sky-600 dark:text-sky-400';
    case 'cyber':
    default:
      return 'text-[#0B57D0] dark:text-blue-400';
  }
};

const getMultiplicationThemeTextColor = (themeId: MathTheme['id']) => {
  switch (themeId) {
    case 'cricket':
      return 'text-orange-400';
    case 'retro':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'sunset':
      return 'text-rose-600 dark:text-rose-400';
    case 'nordic':
      return 'text-indigo-600 dark:text-indigo-400';
    case 'cyber':
    default:
      return 'text-yellow-600 dark:text-yellow-400';
  }
};


export default function MathsPuzzle() {
  const { streak, recordAcademicAction } = useStreak();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Auto-initialize to 'daily' so the game is immediately ready on load
  const [activeMode, setActiveMode] = useState<'daily' | 'time' | 'zen' | null>('daily');
  const [activeDifficulty, setActiveDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Challenge Selector Modal state
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState<boolean>(false);
  const [modalSelectionStep, setModalSelectionStep] = useState<'mode' | 'difficulty'>('mode');
  const [pendingMode, setPendingMode] = useState<'time' | 'zen' | null>(null);

  const [highScores, setHighScores] = useState<{ easy: number; medium: number; hard: number }>({ easy: 0, medium: 0, hard: 0 });
  const [dailyCompletedToday, setDailyCompletedToday] = useState<boolean>(false);
  const [activeBoard, setActiveBoard] = useState<'addition' | 'multiplication'>('addition');
  const [isCompact, setIsCompact] = useState<boolean>(true);

  // Game Selector: Switch between dashboard, mathpath, and droplet-dash
  const [activeGame, setActiveGame] = useState<'dashboard' | 'mathpath' | 'droplet-dash' | 'type-dash'>('dashboard');

  // Leaderboard interactive filters & dynamic state
  const [leaderboardTime, setLeaderboardTime] = useState<'Day' | 'Week' | 'Month' | 'All Time'>('Week');
  const [leaderboardGame, setLeaderboardGame] = useState<'All' | 'Math' | 'Logic' | 'Train' | 'Word'>('All');
  const [isMobileLeaderboardOpen, setIsMobileLeaderboardOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom Settings & Custom Theme States
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<MathTheme['id']>('cyber');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Synced timer from active game
  const [activeGameTime, setActiveGameTime] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  // Load high scores and completion status
  useEffect(() => {
    const easyHS = localStorage.getItem('eduspace_math_time_attack_highscore_easy') || '0';
    const mediumHS = localStorage.getItem('eduspace_math_time_attack_highscore_medium') ||
      localStorage.getItem('eduspace_math_time_attack_highscore') || '0';
    const hardHS = localStorage.getItem('eduspace_math_time_attack_highscore_hard') || '0';

    setHighScores({
      easy: parseInt(easyHS, 10),
      medium: parseInt(mediumHS, 10),
      hard: parseInt(hardHS, 10)
    });

    // Load sound settings
    const savedMute = localStorage.getItem('eduspace_math_mute') === 'true';
    setIsMuted(savedMute);
    mathGameAudio.setMute(savedMute);

    // Load theme settings
    const savedTheme = localStorage.getItem('eduspace_math_theme') as MathTheme['id'];
    if (savedTheme && ['cyber', 'retro', 'sunset', 'nordic'].includes(savedTheme)) {
      setActiveTheme(savedTheme);
    }

    // Check if daily is completed today
    const today = new Date().toISOString().split('T')[0];
    const completedDate = localStorage.getItem('eduspace_math_daily_completed_date');
    if (completedDate === today) {
      setDailyCompletedToday(true);
    }

    // Check if tutorial has been seen
    const hasSeenTutorial = localStorage.getItem('eduspace_math_puzzle_tutorial_seen') === 'true';
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [activeMode]);

  // Realtime Supabase Channel & In-App Event Listener for instant leaderboard updates
  const [realtimeUpdated, setRealtimeUpdated] = useState<number>(Date.now());
  const [dbProfiles, setDbProfiles] = useState<Array<{
    user_id: string;
    full_name: string;
    avatar_url?: string;
    current_streak?: number;
    total_days?: number;
    puzzle_db_score?: number;
  }>>([]);
  const [liveRemoteScores, setLiveRemoteScores] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch registered real user accounts and real database scores from Supabase
    const fetchRealAccounts = async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url');

        const { data: streaks } = await supabase
          .from('user_streaks')
          .select('user_id, current_streak, total_days, longest_streak');

        let pScores: any[] = [];
        try {
          const { data: scoresData } = await (supabase as any)
            .from('user_puzzle_scores')
            .select('user_id, game_type, score');
          if (scoresData) pScores = scoresData;
        } catch {
          // Table optional
        }

        if (profiles && profiles.length > 0) {
          const streakMap = new Map<string, { current: number; total: number }>();
          streaks?.forEach((s: any) => {
            if (s.user_id) {
              streakMap.set(s.user_id, {
                current: s.current_streak || 0,
                total: s.total_days || 0
              });
            }
          });

          const pScoreMap = new Map<string, number>();
          pScores.forEach((ps: any) => {
            if (ps.user_id && typeof ps.score === 'number') {
              const prev = pScoreMap.get(ps.user_id) || 0;
              pScoreMap.set(ps.user_id, Math.max(prev, ps.score));
            }
          });

          const merged = profiles.map((p: any) => {
            const sInfo = streakMap.get(p.user_id) || { current: 0, total: 0 };
            return {
              user_id: p.user_id,
              full_name: p.full_name || 'Eduspace Student',
              avatar_url: p.avatar_url,
              current_streak: sInfo.current,
              total_days: sInfo.total,
              puzzle_db_score: pScoreMap.get(p.user_id) || 0,
            };
          });

          setDbProfiles(merged);
        }
      } catch (e) {
        console.error('Error loading real user profiles:', e);
      }
    };

    fetchRealAccounts();

    // Supabase Realtime Broadcast & Postgres Changes Subscription
    const channel = supabase.channel('math-playground-realtime')
      .on('broadcast', { event: 'score_update' }, (payload) => {
        if (payload.payload?.userId && typeof payload.payload?.score === 'number') {
          setLiveRemoteScores(prev => ({
            ...prev,
            [payload.payload.userId]: payload.payload.score
          }));
        }
        setRealtimeUpdated(Date.now());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_streaks' }, () => {
        fetchRealAccounts();
        setRealtimeUpdated(Date.now());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRealAccounts();
        setRealtimeUpdated(Date.now());
      })
      .subscribe();

    // In-app Storage / Cross-tab / Instant Score Event Listener
    const handleScoreSync = () => {
      const easyHS = localStorage.getItem('eduspace_math_time_attack_highscore_easy') || '0';
      const mediumHS = localStorage.getItem('eduspace_math_time_attack_highscore_medium') ||
        localStorage.getItem('eduspace_math_time_attack_highscore') || '0';
      const hardHS = localStorage.getItem('eduspace_math_time_attack_highscore_hard') || '0';

      setHighScores({
        easy: parseInt(easyHS, 10),
        medium: parseInt(mediumHS, 10),
        hard: parseInt(hardHS, 10)
      });
      setRealtimeUpdated(Date.now());

      // Broadcast score update to connected clients via Supabase Realtime
      const dropletEasy = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_easy') || '0', 10);
      const dropletMedium = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_medium') || '0', 10);
      const dropletHard = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_hard') || '0', 10);
      const dropletExtreme = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_extreme') || '0', 10);
      const dropletMax = Math.max(dropletEasy, dropletMedium, dropletHard, dropletExtreme);

      const typeEasy = parseInt(localStorage.getItem('eduspace_type_dash_highscore_easy') || '0', 10);
      const typeMedium = parseInt(localStorage.getItem('eduspace_type_dash_highscore_medium') || '0', 10);
      const typeHard = parseInt(localStorage.getItem('eduspace_type_dash_highscore_hard') || '0', 10);
      const typeExtreme = parseInt(localStorage.getItem('eduspace_type_dash_highscore_extreme') || '0', 10);
      const typeMax = Math.max(typeEasy, typeMedium, typeHard, typeExtreme);
      const pathMax = Math.max(parseInt(easyHS, 10), parseInt(mediumHS, 10), parseInt(hardHS, 10));

      const totalScore = pathMax + dropletMax + typeMax;

      channel.send({
        type: 'broadcast',
        event: 'score_update',
        payload: { userId: profile?.id || 'user_self', userName: profile?.full_name || 'Player', score: totalScore, timestamp: Date.now() }
      }).catch(() => {});

      // Persist user high score into Supabase database if logged in
      if (profile?.id) {
        (supabase as any).from('user_puzzle_scores').upsert({
          user_id: profile.id,
          game_type: 'all_math',
          score: totalScore,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,game_type' }).catch(() => {});
      }
    };

    window.addEventListener('storage', handleScoreSync);
    window.addEventListener('eduspace-score-updated', handleScoreSync);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('storage', handleScoreSync);
      window.removeEventListener('eduspace-score-updated', handleScoreSync);
    };
  }, [profile?.id, profile?.full_name]);

  const handleRecordStreak = async () => {
    try {
      await recordAcademicAction();
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('eduspace_math_daily_completed_date', today);
      setDailyCompletedToday(true);
      toast.success('🔥 Streak Protected!', {
        description: 'You completed the daily Math Puzzle and secured your Academic Streak!',
      });
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  // Dynamic Leaderboard data computation with real account profiles & live real-time scores
  const leaderboardData = React.useMemo(() => {
    const dropletEasy = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_easy') || '0', 10);
    const dropletMedium = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_medium') || '0', 10);
    const dropletHard = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_hard') || '0', 10);
    const dropletExtreme = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_extreme') || '0', 10);
    const dropletMax = Math.max(dropletEasy, dropletMedium, dropletHard, dropletExtreme);

    const typeEasy = parseInt(localStorage.getItem('eduspace_type_dash_highscore_easy') || '0', 10);
    const typeMedium = parseInt(localStorage.getItem('eduspace_type_dash_highscore_medium') || '0', 10);
    const typeHard = parseInt(localStorage.getItem('eduspace_type_dash_highscore_hard') || '0', 10);
    const typeExtreme = parseInt(localStorage.getItem('eduspace_type_dash_highscore_extreme') || '0', 10);
    const typeMax = Math.max(typeEasy, typeMedium, typeHard, typeExtreme);

    const pathMax = Math.max(highScores.easy, highScores.medium, highScores.hard);

    let userRaw = 0;
    if (leaderboardGame === 'All') userRaw = pathMax + dropletMax + typeMax;
    else if (leaderboardGame === 'Math') userRaw = dropletMax + pathMax;
    else if (leaderboardGame === 'Logic') userRaw = pathMax * 2;
    else if (leaderboardGame === 'Word') userRaw = typeMax * 2;
    else if (leaderboardGame === 'Train') userRaw = Math.round((dropletMax + typeMax) * 0.75);

    const timeFactor = leaderboardTime === 'Day' ? 0.35 : leaderboardTime === 'Week' ? 1.0 : leaderboardTime === 'Month' ? 2.2 : 4.5;
    const userFinalScore = Math.max(15, Math.round(userRaw * (leaderboardTime === 'Week' ? 1 : timeFactor * 0.5)));

    let gameMultiplier = 1.0;
    if (leaderboardGame === 'Math') gameMultiplier = 1.15;
    else if (leaderboardGame === 'Logic') gameMultiplier = 0.95;
    else if (leaderboardGame === 'Word') gameMultiplier = 0.85;
    else if (leaderboardGame === 'Train') gameMultiplier = 0.75;

    const avatarsPool = ['👑', '⚡', '🔥', '🌟', '🎯', '🚀', '💎', '🏆', '⚽', '🎨'];
    const bgPool = ['bg-amber-500', 'bg-slate-600', 'bg-orange-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-purple-500'];

    let playerList: Array<{
      id: string;
      name: string;
      avatar?: string;
      avatarUrl?: string;
      score: number;
      isUser: boolean;
      bg: string;
    }> = [];

    if (dbProfiles.length > 0) {
      playerList = dbProfiles.map((p, idx) => {
        const isMe = p.user_id === profile?.id;
        const liveScore = liveRemoteScores[p.user_id];
        const dbScore = p.puzzle_db_score && p.puzzle_db_score > 0 ? p.puzzle_db_score : 0;
        const streakBase = Math.max(40, ((p.current_streak || 1) * 220) + ((p.total_days || 0) * 85));
        
        let calcScore = 0;
        if (isMe) {
          calcScore = userFinalScore;
        } else if (typeof liveScore === 'number' && liveScore > 0) {
          calcScore = Math.round(liveScore * gameMultiplier * timeFactor * 0.5);
        } else if (dbScore > 0) {
          calcScore = Math.round(dbScore * gameMultiplier * timeFactor * 0.5);
        } else {
          calcScore = Math.round(streakBase * gameMultiplier * timeFactor);
        }

        return {
          id: p.user_id,
          name: isMe ? (profile?.full_name || 'You') : p.full_name,
          avatar: p.avatar_url ? undefined : avatarsPool[idx % avatarsPool.length],
          avatarUrl: p.avatar_url,
          score: Math.max(10, calcScore),
          isUser: isMe,
          bg: isMe ? 'bg-indigo-600' : bgPool[idx % bgPool.length],
        };
      });

      // Ensure current logged in user is in player list if not present
      if (profile?.id && !playerList.some(p => p.id === profile.id)) {
        playerList.push({
          id: profile.id,
          name: profile.full_name || 'You',
          avatar: '😎',
          score: userFinalScore,
          isUser: true,
          bg: 'bg-indigo-600',
        });
      }
    } else {
      const mockPlayers = [
        { id: 'p1', name: 'Akshay Kumar', avatar: '👑', baseScore: 1860, isUser: false, bg: 'bg-amber-500' },
        { id: 'p2', name: 'Kamaldeep Singh', avatar: '⚡', baseScore: 1420, isUser: false, bg: 'bg-slate-600' },
        { id: 'p3', name: 'Amit Sharma', avatar: '🔥', baseScore: 980, isUser: false, bg: 'bg-orange-500' },
        { id: 'p4', name: 'Kavita Upadhyay', avatar: '🌟', baseScore: 690, isUser: false, bg: 'bg-indigo-500' },
        { id: 'p5', name: 'Hasan Alhamoomi', avatar: '🎯', baseScore: 520, isUser: false, bg: 'bg-emerald-500' },
        { id: 'p6', name: 'Moses Pradhan', avatar: '🚀', baseScore: 410, isUser: false, bg: 'bg-cyan-500' },
        { id: 'p7', name: 'Priya Patel', avatar: '💎', baseScore: 350, isUser: false, bg: 'bg-pink-500' },
        { id: 'p8', name: 'Rahul Verma', avatar: '🏆', baseScore: 280, isUser: false, bg: 'bg-purple-500' },
      ];

      playerList = mockPlayers.map(p => ({
        ...p,
        score: Math.max(10, Math.round(p.baseScore * gameMultiplier * timeFactor))
      }));

      playerList.push({
        id: 'user_self',
        name: profile?.full_name || 'You',
        avatar: '😎',
        score: userFinalScore,
        isUser: true,
        bg: 'bg-indigo-600',
      });
    }

    // Dynamic sort by score descending - causes positions to shift live in real-time!
    const combined = [...playerList].sort((a, b) => b.score - a.score);
    return combined.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  }, [leaderboardTime, leaderboardGame, highScores, profile?.full_name, profile?.id, dbProfiles, liveRemoteScores, realtimeUpdated]);

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('eduspace_math_mute', nextMute.toString());
    mathGameAudio.setMute(nextMute);
  };

  const handleChangeTheme = (themeId: MathTheme['id']) => {
    setActiveTheme(themeId);
    localStorage.setItem('eduspace_math_theme', themeId);
  };

  const handleResetHighScores = () => {
    localStorage.removeItem('eduspace_math_time_attack_highscore_easy');
    localStorage.removeItem('eduspace_math_time_attack_highscore_medium');
    localStorage.removeItem('eduspace_math_time_attack_highscore_hard');
    localStorage.removeItem('eduspace_math_time_attack_highscore');
    setHighScores({ easy: 0, medium: 0, hard: 0 });
  };

  const handleResetTutorial = () => {
    localStorage.removeItem('eduspace_math_puzzle_tutorial_seen');
  };

  const handleExitGame = () => {
    setActiveMode('daily'); // Fall back to daily challenge default
    setActiveGameTime(null);
    setActiveGame('dashboard');
  };

  const openChallengeSelector = () => {
    setModalSelectionStep('mode');
    setPendingMode(null);
    setIsChallengeModalOpen(true);
  };

  const handleSelectMode = (mode: 'daily' | 'time' | 'zen') => {
    if (mode === 'daily') {
      setActiveMode('daily');
      setActiveDifficulty('medium');
      setIsChallengeModalOpen(false);
      toast.success('Daily Challenge started!');
    } else {
      setPendingMode(mode);
      setModalSelectionStep('difficulty');
    }
  };

  const handleSelectDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
    if (pendingMode) {
      setActiveMode(pendingMode);
      setActiveDifficulty(diff);
      setIsChallengeModalOpen(false);
      toast.success(`${pendingMode === 'time' ? 'Time Attack' : 'Zen Practice'} (${diff}) started!`);
    }
  };

  // Render formatted timer countdown
  const getTimerString = () => {
    if (activeGameTime === null) return "01:00";
    const minutes = Math.floor(activeGameTime / 60);
    const seconds = activeGameTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderLeaderboardContent = (isDrawer = false) => (
    <div className={`space-y-3.5 flex flex-col justify-between h-full ${isDrawer ? 'p-5 bg-slate-900 text-white overflow-y-auto' : ''}`}>
      {/* Header and Title */}
      <div className="space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Trophy className="size-5 text-amber-500 shrink-0" />
              <span>Leaderboard</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              Realtime Global Rankings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              Live
            </span>
            {isDrawer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileLeaderboardOpen(false)}
                className="size-8 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Time filter pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar">
          {(['Day', 'Week', 'Month', 'All Time'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setLeaderboardTime(t)}
              className={`flex-1 min-w-[60px] py-1.5 px-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all duration-200 text-center whitespace-nowrap ${leaderboardTime === t
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/60 dark:border-slate-600/60 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Game filter pills */}
        <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-black uppercase tracking-wider">
          {(['All', 'Math', 'Logic', 'Word'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setLeaderboardGame(g)}
              className={`px-2.5 py-1 rounded-lg transition-all duration-200 ${leaderboardGame === g
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm scale-105'
                : 'bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Podium Display (Top 3 - Clean & Zero Text Overlap) */}
      {(() => {
        const rank1 = leaderboardData.find((p) => p.rank === 1);
        const rank2 = leaderboardData.find((p) => p.rank === 2);
        const rank3 = leaderboardData.find((p) => p.rank === 3);

        return (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 items-end min-h-[160px] shrink-0 my-2">
            {/* Rank 2 */}
            <div className="flex flex-col items-center group min-w-0 w-full">
              <div className="relative mb-1">
                <div className="size-9 sm:size-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-slate-300 dark:border-slate-500 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  {rank2?.avatarUrl ? (
                    <img src={rank2.avatarUrl} alt={rank2.name} className="size-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xs sm:text-sm">{rank2?.avatar || rank2?.name?.charAt(0) || '🥈'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-400 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-[9px] shadow-2xs">
                  2
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 text-center truncate w-full px-0.5">
                {rank2?.name || 'Player 2'}
              </div>
              <div className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 my-1">
                {rank2?.score ? rank2.score.toLocaleString() : '0'}
              </div>
              <div className="w-full bg-slate-100/90 dark:bg-slate-800/60 border-t-2 border-slate-300 dark:border-slate-500 rounded-t-xl h-14 sm:h-16 flex items-center justify-center transition-all duration-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-800/90 shadow-2xs">
                <span className="text-xl sm:text-2xl">🥈</span>
              </div>
            </div>

            {/* Rank 1 */}
            <div className="flex flex-col items-center group min-w-0 w-full">
              <div className="relative mb-1">
                <div className="size-11 sm:size-12 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-amber-400 dark:border-amber-300 overflow-hidden bg-amber-100/50 dark:bg-amber-950/50 ring-2 ring-amber-400/30 shrink-0">
                  {rank1?.avatarUrl ? (
                    <img src={rank1.avatarUrl} alt={rank1.name} className="size-full object-cover rounded-full" />
                  ) : (
                    <span className="text-base">{rank1?.avatar || rank1?.name?.charAt(0) || '👑'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-5 sm:size-6 rounded-full bg-amber-400 border border-amber-300 text-white flex items-center justify-center font-black text-[10px] shadow-sm">
                  1
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-amber-600 dark:text-amber-300 text-center truncate w-full px-0.5">
                {rank1?.name || 'Player 1'}
              </div>
              <div className="text-[9px] sm:text-[10px] font-black text-amber-500 dark:text-amber-400 my-1 animate-pulse">
                {rank1?.score ? rank1.score.toLocaleString() : '0'}
              </div>
              <div className="w-full bg-gradient-to-b from-amber-500/15 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/5 border-t-2 border-amber-400 dark:border-amber-400 rounded-t-xl h-20 sm:h-24 flex items-center justify-center transition-all duration-300 group-hover:from-amber-500/25 dark:group-hover:from-amber-500/30 shadow-[0_-6px_20px_-5px_rgba(245,158,11,0.2)]">
                <span className="text-2xl sm:text-3xl drop-shadow-md animate-bounce duration-1000">👑</span>
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex flex-col items-center group min-w-0 w-full">
              <div className="relative mb-1">
                <div className="size-8 sm:size-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-orange-400 dark:border-orange-600 overflow-hidden bg-orange-100/50 dark:bg-orange-950/50 shrink-0">
                  {rank3?.avatarUrl ? (
                    <img src={rank3.avatarUrl} alt={rank3.name} className="size-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xs sm:text-sm">{rank3?.avatar || rank3?.name?.charAt(0) || '🥉'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-orange-500 border border-orange-400 text-white flex items-center justify-center font-black text-[9px] shadow-2xs">
                  3
                </div>
              </div>
              <div className="text-[10px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 text-center truncate w-full px-0.5">
                {rank3?.name || 'Player 3'}
              </div>
              <div className="text-[9px] sm:text-[10px] font-black text-orange-500 dark:text-orange-400 my-1">
                {rank3?.score ? rank3.score.toLocaleString() : '0'}
              </div>
              <div className="w-full bg-orange-100/30 dark:bg-orange-950/30 border-t-2 border-orange-400 dark:border-orange-700/80 rounded-t-xl h-11 sm:h-13 flex items-center justify-center transition-all duration-300 group-hover:bg-orange-100/40 dark:group-hover:bg-orange-950/40 shadow-2xs">
                <span className="text-base sm:text-lg">🥉</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* List below Podium */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar min-h-[160px] max-h-[320px] lg:max-h-none">
        {leaderboardData.slice(3).map((player) => (
          <div
            key={player.id}
            className={`p-2.5 sm:p-3 rounded-xl flex justify-between items-center text-xs transition-all duration-200 ${player.isUser
              ? 'bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-indigo-500/20 border border-indigo-500/40 dark:border-indigo-500/35 text-indigo-800 dark:text-indigo-200 font-black shadow-sm ring-1 ring-indigo-500/20'
              : 'bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
              }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${player.isUser
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
              >
                #{player.rank}
              </span>
              <div className={`size-6 sm:size-7 rounded-full ${player.bg} flex items-center justify-center text-xs font-bold shrink-0 shadow-xs overflow-hidden`}>
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.name} className="size-full object-cover rounded-full" />
                ) : (
                  player.avatar || player.name.charAt(0)
                )}
              </div>
              <span className="font-extrabold truncate text-xs text-slate-800 dark:text-slate-100">
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {player.isUser && (
                <span className="text-[8px] font-black bg-indigo-500/20 px-1.5 py-0.5 rounded-md text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
                  YOU
                </span>
              )}
              <span className="font-black text-xs text-slate-900 dark:text-white">
                {player.score.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const toggleStyle = getFloatingToggleStyle(activeTheme);

  return (
    <DashboardLayout fullHeight>
      <div className="flex flex-col h-full w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden text-[#1E293B] dark:text-slate-100 font-sans antialiased">

        {/* Main Top Header */}
        {activeGame !== 'droplet-dash' && activeGame !== 'type-dash' && (
          <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 shrink-0 select-none z-10">
            <div className="flex items-center">
              {/* Back/Exit Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (activeGame !== 'dashboard') {
                    setActiveGame('dashboard');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all size-9 flex items-center justify-center shrink-0 border-none mr-3"
              >
                <ArrowLeft className="size-4 text-slate-600 dark:text-slate-350" />
              </Button>
              <span className={`text-sm sm:text-base font-black tracking-tight ${getThemeTextColor(activeTheme)}`}>
                {activeGame === 'dashboard' ? 'Train Your Brain' : activeGame === 'mathpath' ? 'MathPath Quest' : 'Droplet Dash'}
              </span>
              {activeGame === 'mathpath' && (
                <>
                  <div className="hidden md:block h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-3" />
                  <span className="hidden md:inline-block text-[#0B57D0] dark:text-blue-400 font-bold text-xs truncate max-w-[250px]">
                    {activeMode === 'daily' && 'Dual Playground (Daily Challenge)'}
                    {activeMode === 'time' && 'Dual Playground (Time Attack)'}
                    {activeMode === 'zen' && 'Dual Playground (Zen Practice)'}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Mobile Leaderboard Button (Top Right Side Corner) */}
              <Button
                onClick={() => setIsMobileLeaderboardOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-black px-2.5 sm:px-3 py-1.5 h-8 sm:h-9 rounded-full text-xs shadow-md border border-white/20 active:scale-95 transition-all shrink-0"
              >
                <Trophy className="size-3.5 text-amber-300 shrink-0" />
                <span className="text-[11px] sm:text-xs font-extrabold tracking-tight">Leaderboard</span>
              </Button>

              {/* MathPath-specific header controls */}
              {activeGame === 'mathpath' && (
                <>
                  {/* New Challenge Button (Desktop only) */}
                  <Button
                    onClick={openChallengeSelector}
                    className="hidden lg:flex items-center justify-center gap-1.5 bg-[#0B57D0]/10 dark:bg-blue-500/10 hover:bg-[#0B57D0]/20 dark:hover:bg-blue-500/20 text-[#0B57D0] dark:text-blue-400 px-4 py-2 h-9 rounded-xl text-xs font-black border-none shrink-0 transition-all active:scale-95"
                  >
                    <Zap className="size-3.5 fill-current" />
                    <span>New Challenge</span>
                  </Button>

                  {/* Timer Pill */}
                  <div className={`bg-[#EEF2F6] dark:bg-slate-800 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-xl flex items-center gap-1 ${getThemeTextColor(activeTheme)}`}>
                    <Clock className="size-3 sm:size-3.5" />
                    <span className="text-[10px] sm:text-[11px] font-black">{getTimerString()}</span>
                  </div>

                  {/* Action/Tutorial Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTutorial(true)}
                    className="size-8 sm:size-9 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 border-none"
                  >
                    <HelpCircle className="size-4 text-slate-500 dark:text-slate-400" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="size-8 sm:size-9 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 border-none"
              >
                <Settings className="size-4 text-slate-500 dark:text-slate-400" />
              </Button>
            </div>
          </header>
        )}

        {/* Central Scrollable Dashboard Views */}
        {activeGame === 'droplet-dash' ? (
          <div className="flex-1 w-full h-full relative overflow-hidden bg-[#BEE3F8]">
            <DropletDashGame
              themeId={activeTheme}
              onExit={handleExitGame}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        ) : activeGame === 'type-dash' ? (
          <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
            <TypeDashGame
              themeId={activeTheme}
              onExit={handleExitGame}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 p-3 sm:p-4 md:p-6 flex flex-col custom-scrollbar">

            {/* ═══ Game Selector Dashboard ═══ */}
            {activeGame === 'dashboard' && (
              <div className="max-w-6xl mx-auto w-full h-auto lg:h-full flex flex-col justify-between space-y-6 lg:space-y-4 pb-8 lg:pb-2 pt-1 min-h-0">

                {/* Header section with compact spacing */}
                <div className="relative space-y-1 shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-655 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                    <span className="size-1.5 rounded-full bg-indigo-550 dark:bg-indigo-400 animate-pulse" />
                    Brain Training Academy
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      Train Your <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Brain</span>
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl leading-relaxed">
                      Improve arithmetic speed, logical reasoning, and keyboard agility with immersive daily workouts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch flex-1 min-h-0">

                  {/* Game Cards Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 min-h-0">

                    {/* Game 1: MathPath */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(99,102,241,0.12)] hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between p-5 sm:p-6 min-h-[220px]"
                    >
                      {/* Background glow orbs */}
                      <div className="absolute -top-20 -right-20 size-48 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                      {/* Background decoration SVG */}
                      <div className="absolute right-2 top-2 translate-x-6 -translate-y-6 opacity-[0.03] dark:opacity-[0.02] text-slate-900 dark:text-white select-none pointer-events-none group-hover:rotate-6 transition-transform duration-500">
                        <Grid3X3 className="size-56" />
                      </div>

                      <div className="flex justify-between items-start z-10">
                        <span className="px-3 py-1 bg-indigo-550/5 dark:bg-indigo-950/60 border border-indigo-150/40 dark:border-indigo-900/40 text-indigo-655 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Logic & Grid
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-full text-[10px] font-extrabold text-slate-700 dark:text-slate-300 shadow-sm">
                          ⚡ <span className="font-black text-indigo-600 dark:text-indigo-400">{Math.max(highScores.easy, highScores.medium, highScores.hard)}</span>
                        </span>
                      </div>

                      <div className="space-y-1.5 z-10">
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">MathPath Quest</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Connect adjacent numbers in a grid to match target products or sums.
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-1 z-10">
                        <div className="size-10 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Grid3X3 className="size-4" />
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('mathpath');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-xl px-5 py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 border-none h-9"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                    {/* Game 2: Droplet Dash */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(14,165,233,0.12)] hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between p-5 sm:p-6 min-h-[220px]"
                    >
                      {/* Background glow orbs */}
                      <div className="absolute -top-20 -right-20 size-48 rounded-full bg-sky-500/10 dark:bg-sky-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                      {/* Background decoration SVG */}
                      <div className="absolute right-2 top-2 translate-x-6 -translate-y-6 opacity-[0.03] dark:opacity-[0.02] text-slate-900 dark:text-white select-none pointer-events-none group-hover:rotate-6 transition-transform duration-500">
                        <Droplets className="size-56" />
                      </div>

                      <div className="flex justify-between items-start z-10">
                        <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-150/40 dark:border-sky-900/40 text-sky-655 dark:text-sky-450 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Math & Speed
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-full text-[10px] font-extrabold text-slate-700 dark:text-slate-300 shadow-sm">
                          ⚡ <span className="font-black text-sky-600 dark:text-sky-400">
                            {(() => {
                              const easy = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_easy') || '0', 10);
                              const medium = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_medium') || '0', 10);
                              const hard = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_hard') || '0', 10);
                              const extreme = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_extreme') || '0', 10);
                              return Math.max(easy, medium, hard, extreme);
                            })()}
                          </span>
                        </span>
                      </div>

                      <div className="space-y-1.5 z-10">
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Droplet Dash</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Catch water droplets holding the correct answer to math equations.
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-1 z-10">
                        <div className="size-10 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Droplets className="size-4" />
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('droplet-dash');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-xl px-5 py-4 bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/20 active:scale-95 border-none h-9"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                    {/* Game 3: Type Dash */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(168,85,247,0.12)] hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between p-5 sm:p-6 min-h-[220px]"
                    >
                      {/* Background glow orbs */}
                      <div className="absolute -top-20 -right-20 size-48 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                      {/* Background decoration text */}
                      <div className="absolute -right-4 -top-4 translate-x-4 -translate-y-4 opacity-[0.03] dark:opacity-[0.02] text-slate-950 dark:text-white select-none pointer-events-none font-mono text-9xl font-black tracking-tighter group-hover:rotate-3 transition-transform duration-500">
                        Aa
                      </div>

                      <div className="flex justify-between items-start z-10">
                        <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-150/40 dark:border-purple-900/40 text-purple-650 dark:text-purple-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Typing Speed
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-full text-[10px] font-extrabold text-slate-700 dark:text-slate-300 shadow-sm">
                          ⚡ <span className="font-black text-purple-600 dark:text-purple-400">
                            {(() => {
                              const easy = parseInt(localStorage.getItem('eduspace_type_dash_highscore_easy') || '0', 10);
                              const medium = parseInt(localStorage.getItem('eduspace_type_dash_highscore_medium') || '0', 10);
                              const hard = parseInt(localStorage.getItem('eduspace_type_dash_highscore_hard') || '0', 10);
                              const extreme = parseInt(localStorage.getItem('eduspace_type_dash_highscore_extreme') || '0', 10);
                              return Math.max(easy, medium, hard, extreme);
                            })()}
                          </span>
                        </span>
                      </div>

                      <div className="space-y-1.5 z-10">
                        <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Type Dash</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Type words to aim laser blaster and pop falling droplets before they splash!
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-1 z-10">
                        <div className="size-10 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm group-hover:scale-110 transition-transform duration-300 text-sm">
                          ⌨️
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('type-dash');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-xl px-5 py-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 active:scale-95 border-none h-9"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                  </div>

                  {/* Leaderboard Section (Visible on Desktop lg screens; accessed via floating button drawer on mobile/responsive views) */}
                  <div className="hidden lg:flex lg:col-span-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 relative overflow-hidden flex-col justify-between h-full min-h-[440px]">
                    {renderLeaderboardContent(false)}
                  </div>

                </div>
              </div>
            )}

            {/* ═══ MathPath Game (Existing — Untouched) ═══ */}
            {activeGame === 'mathpath' && (
              <div className={`${isCompact ? 'max-w-xl pb-24' : 'max-w-5xl xl:max-w-6xl pb-12 lg:pb-6'
                } mx-auto w-full`}>

                {/* Desktop Center Toggle Switch */}
                <div className="hidden lg:flex justify-center mb-6 select-none">
                  <div className={`flex p-1.5 rounded-full isolate ${toggleStyle.container} transition-all duration-300`}>
                    <button
                      onClick={() => {
                        if (activeBoard !== 'addition') {
                          setActiveBoard('addition');
                          mathGameAudio.playShuffle();
                        }
                      }}
                      className={`relative px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${activeBoard === 'addition'
                        ? toggleStyle.itemActiveText
                        : toggleStyle.itemInactive
                        }`}
                    >
                      {activeBoard === 'addition' && (
                        <motion.div
                          layoutId="activeDesktopTab"
                          className={`absolute inset-0 rounded-full -z-10 ${toggleStyle.itemActiveAddition}`}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span>➕ Sums</span>
                    </button>
                    <button
                      onClick={() => {
                        if (activeBoard !== 'multiplication') {
                          setActiveBoard('multiplication');
                          mathGameAudio.playShuffle();
                        }
                      }}
                      className={`relative px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${activeBoard === 'multiplication'
                        ? toggleStyle.itemActiveText
                        : toggleStyle.itemInactive
                        }`}
                    >
                      {activeBoard === 'multiplication' && (
                        <motion.div
                          layoutId="activeDesktopTab"
                          className={`absolute inset-0 rounded-full -z-10 ${toggleStyle.itemActiveMultiplication}`}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span>✖️ Products</span>
                    </button>
                  </div>
                </div>

                {/* Left Column: Addition Game */}
                <div className={`flex-col relative overflow-hidden transition-all duration-300 ${isCompact
                  ? 'w-full p-0 bg-transparent border-none shadow-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-6 shadow-md hover:shadow-lg'
                  } ${activeBoard === 'addition' ? 'flex' : 'hidden'
                  }`}>
                  {!isCompact && (
                    <div className="text-center mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <h3 className={`text-lg font-black tracking-tight flex items-center justify-center gap-1.5 ${getThemeTextColor(activeTheme)}`}>
                        <span>➕ Target Sums (Addition)</span>
                      </h3>
                    </div>
                  )}
                  <MathPathGame
                    mode={activeMode || 'daily'}
                    difficulty={activeDifficulty}
                    themeId={activeTheme}
                    mathOperation="addition"
                    onExit={handleExitGame}
                    onRecordStreak={handleRecordStreak}
                    onTimerTick={(t) => setActiveGameTime(t)}
                    onNewChallenge={openChallengeSelector}
                    compact={isCompact}
                  />
                </div>

                {/* Right Column: Multiplication Game */}
                <div className={`flex-col relative overflow-hidden transition-all duration-300 ${isCompact
                  ? 'w-full p-0 bg-transparent border-none shadow-none'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-6 shadow-md hover:shadow-lg'
                  } ${activeBoard === 'multiplication' ? 'flex' : 'hidden'
                  }`}>
                  {!isCompact && (
                    <div className="text-center mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                      <h3 className={`text-lg font-black tracking-tight flex items-center justify-center gap-1.5 ${getMultiplicationThemeTextColor(activeTheme)}`}>
                        <span>✖️ Target Products (Multiplication)</span>
                      </h3>
                    </div>
                  )}
                  <MathPathGame
                    mode={activeMode || 'daily'}
                    difficulty={activeDifficulty}
                    themeId={activeTheme}
                    mathOperation="multiplication"
                    onExit={handleExitGame}
                    onRecordStreak={async () => {
                      await handleRecordStreak();
                    }}
                    onNewChallenge={openChallengeSelector}
                    compact={isCompact}
                  />
                </div>

              </div>
            )}
          </main>
        )}

      {/* Challenge Selection Modal (Single unified screen) */}
      <AnimatePresence>
        {isChallengeModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full"
            >
              <Card className="border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-8 space-y-6 relative">
                  <button
                    onClick={() => setIsChallengeModalOpen(false)}
                    aria-label="Close modal"
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-350 transition-colors"
                  >
                    <X className="size-4" />
                  </button>

                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {modalSelectionStep === 'mode' ? 'Select Game Mode' : 'Choose Difficulty'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-450 font-bold text-xs">
                      {modalSelectionStep === 'mode'
                        ? 'Select a challenge type to begin'
                        : `Choose a level for ${pendingMode === 'time' ? 'Time Attack' : 'Zen Practice'}`
                      }
                    </p>
                  </div>

                  <AnimatePresence mode="wait">
                    {modalSelectionStep === 'mode' ? (
                      <motion.div
                        key="mode-select"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                      >
                        {/* Daily Challenge */}
                        <button
                          onClick={() => handleSelectMode('daily')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/10 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <Zap className="size-4 fill-indigo-600/10 dark:fill-indigo-400/10" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">Daily Challenge</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Reach 100 points • Locks daily progress</p>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {/* Time Attack */}
                        <button
                          onClick={() => handleSelectMode('time')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/10 dark:hover:bg-amber-950/10 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Clock className="size-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-amber-550 transition-colors">Time Attack</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">60s timer • Speed arithmetic challenge</p>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-slate-400 dark:text-slate-550 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        {/* Zen Practice */}
                        <button
                          onClick={() => handleSelectMode('zen')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-[#0F9D58]/50 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/10 transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-[#0F9D58] dark:text-[#0F9D58] flex items-center justify-center shrink-0">
                              <Zap className="size-4 rotate-12 fill-[#0F9D58]/10" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#0F9D58] transition-colors">Zen Practice</h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">No timers • Relaxed sum training</p>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-slate-400 dark:text-slate-550 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="diff-select"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-3"
                      >
                        {/* Easy Option */}
                        <button
                          onClick={() => handleSelectDifficulty('easy')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">Easy</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">4x4 Grid • Targets 5 to 25 • Positive numbers only</p>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/30 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Warm-up</span>
                        </button>

                        {/* Medium Option */}
                        <button
                          onClick={() => handleSelectDifficulty('medium')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">Medium</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">5x5 Grid • Targets 10 to 40 • Balanced gameplay</p>
                          </div>
                          <span className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 bg-indigo-100/30 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full">Standard</span>
                        </button>

                        {/* Hard Option */}
                        <button
                          onClick={() => handleSelectDifficulty('hard')}
                          className="w-full text-left p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 transition-all flex items-center justify-between group"
                        >
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors">Hard</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">6x6 Grid • Targets 15 to 80 • Negatives included!</p>
                          </div>
                          <span className="text-[9px] font-bold text-rose-650 dark:text-rose-400 bg-rose-100/30 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">Pro Expert</span>
                        </button>

                        <Button
                          variant="ghost"
                          onClick={() => setModalSelectionStep('mode')}
                          className="w-full text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 mt-2"
                        >
                          ← Back to Modes
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MathPlaygroundSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        activeThemeId={activeTheme}
        onChangeTheme={handleChangeTheme}
        onResetHighScores={handleResetHighScores}
        onResetTutorial={handleResetTutorial}
      />

      {/* Tutorial Popup Modal */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[10002]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-sm w-full"
            >
              <Card className="border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="size-16 bg-blue-50 dark:bg-slate-800 text-[#0B57D0] dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto">
                    <Zap className="size-8 fill-[#0B57D0]/10 dark:fill-blue-400/10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">How to Play</h3>
                    <p className="text-slate-655 dark:text-slate-400 font-bold text-sm leading-relaxed">
                      Swipe or click adjacent numbers (horizontal, vertical, or diagonal) to connect a path.
                    </p>
                    <p className="text-slate-800 dark:text-slate-200 font-extrabold text-sm py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80">
                      Add the values up to equal the <span className="text-[#0B57D0] dark:text-blue-400">Target Sum</span>!
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      If you exceed the target, the selection will shake and reset.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowTutorial(false);
                      localStorage.setItem('eduspace_math_puzzle_tutorial_seen', 'true');
                    }}
                    className="w-full rounded-2xl py-6 font-bold flex items-center justify-center gap-2 bg-[#0B57D0] dark:bg-blue-600 hover:bg-[#0845A4] dark:hover:bg-blue-700 text-white border-none"
                  >
                    <span>Start Playing</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Mobile Toggle Switch — Only show for MathPath */}
      {activeGame === 'mathpath' && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 select-none">
          <div className={`flex p-1.5 rounded-full isolate ${toggleStyle.container} transition-all duration-300`}>
            <button
              onClick={() => {
                if (activeBoard !== 'addition') {
                  setActiveBoard('addition');
                  mathGameAudio.playShuffle();
                }
              }}
              className={`relative px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${activeBoard === 'addition'
                ? toggleStyle.itemActiveText
                : toggleStyle.itemInactive
                }`}
            >
              {activeBoard === 'addition' && (
                <motion.div
                  layoutId="activeFloatingTab"
                  className={`absolute inset-0 rounded-full -z-10 ${toggleStyle.itemActiveAddition}`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>➕ Sums</span>
            </button>
            <button
              onClick={() => {
                if (activeBoard !== 'multiplication') {
                  setActiveBoard('multiplication');
                  mathGameAudio.playShuffle();
                }
              }}
              className={`relative px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${activeBoard === 'multiplication'
                ? toggleStyle.itemActiveText
                : toggleStyle.itemInactive
                }`}
            >
              {activeBoard === 'multiplication' && (
                <motion.div
                  layoutId="activeFloatingTab"
                  className={`absolute inset-0 rounded-full -z-10 ${toggleStyle.itemActiveMultiplication}`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>✖️ Products</span>
            </button>
          </div>
        </div>
      )}

    {/* Mobile Leaderboard Sheet Drawer Modal */}
    <Sheet open={isMobileLeaderboardOpen} onOpenChange={setIsMobileLeaderboardOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-none bg-slate-900 text-white shadow-2xl flex flex-col z-[10001] [&>button]:hidden">
        <SheetTitle className="sr-only">Math Playground Leaderboard</SheetTitle>
        <SheetDescription className="sr-only">Realtime Global Rankings</SheetDescription>
        {renderLeaderboardContent(true)}
      </SheetContent>
    </Sheet>
  </div>
</DashboardLayout>
  );
}
