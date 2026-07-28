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
import { MathPathGame } from '../components/puzzle/MathPathGame';
import { DropletDashGame } from '../components/puzzle/DropletDashGame';
import { TypeDashGame } from '../components/puzzle/TypeDashGame';
import { useStreak } from '../contexts/StreakContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { MathPlaygroundSettings } from '../components/puzzle/MathPlaygroundSettings';
import { MathTheme } from '../lib/mathGameTheme';
import { mathGameAudio } from '../lib/mathGameAudio';

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
          <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 p-4 md:p-8 lg:p-6 custom-scrollbar">

            {/* ═══ Game Selector Dashboard ═══ */}
            {activeGame === 'dashboard' && (
              <div className="max-w-6xl mx-auto w-full space-y-10 pb-16 pt-2">

                {/* Header section with proper spacing */}
                <div className="relative space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-655 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                    <span className="size-1.5 rounded-full bg-indigo-550 dark:bg-indigo-400 animate-pulse" />
                    Brain Training Academy
                  </div>
                  <div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                      Train Your <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">Brain</span>
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                      Improve arithmetic speed, logical reasoning, and keyboard agility with immersive daily workouts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                  {/* Game Cards Grid */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Game 1: MathPath */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(99,102,241,0.12)] hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between p-7 h-[280px]"
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

                      <div className="space-y-2.5 z-10">
                        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">MathPath Quest</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Connect adjacent numbers in a grid to match the target products or sums.
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2 z-10">
                        <div className="size-11 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Grid3X3 className="size-5" />
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('mathpath');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-2xl px-6 py-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 border-none"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                    {/* Game 2: Droplet Dash */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(14,165,233,0.12)] hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between p-7 h-[280px]"
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

                      <div className="space-y-2.5 z-10">
                        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Droplet Dash</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Catch water droplets holding the correct answer to mathematical equations.
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2 z-10">
                        <div className="size-11 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Droplets className="size-5" />
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('droplet-dash');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-2xl px-6 py-5 bg-sky-600 hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/20 active:scale-95 border-none"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                    {/* Game 3: Type Dash */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.015 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 shadow-md hover:shadow-[0_20px_40px_rgba(168,85,247,0.12)] hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between p-7 h-[280px]"
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

                      <div className="space-y-2.5 z-10">
                        <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Type Dash</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[240px]">
                          Type words to aim your laser gun blaster and pop falling droplets before they splash!
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2 z-10">
                        <div className="size-11 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/40 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm group-hover:scale-110 transition-transform duration-300 text-lg">
                          ⌨️
                        </div>
                        <Button
                          onClick={() => {
                            setActiveGame('type-dash');
                            mathGameAudio.playShuffle();
                          }}
                          className="rounded-2xl px-6 py-5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 active:scale-95 border-none"
                        >
                          Play Now
                        </Button>
                      </div>
                    </motion.div>

                    {/* Game 4: Train Fiesta (Coming Soon) */}
                    <div className="relative overflow-hidden rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-550 flex flex-col justify-between p-7 h-[280px] opacity-70">
                      <div className="flex justify-between items-start">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-700/20 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-550 dark:text-slate-400">
                          Attention
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full text-[10px] font-extrabold text-slate-500 dark:text-slate-455">
                          🔒 Locked
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <h3 className="text-xl font-black tracking-tight text-slate-400 dark:text-slate-500">Train Fiesta</h3>
                        <p className="text-xs text-slate-455 dark:text-slate-555 font-medium leading-relaxed max-w-[240px]">
                          Manage switching tracks and boost rapid sorting logic rules.
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="size-11 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center text-lg">
                          🚂
                        </div>
                        <Button
                          disabled
                          className="rounded-2xl px-6 py-5 bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-550 border-none font-bold text-xs"
                        >
                          Coming Soon
                        </Button>
                      </div>
                    </div>

                  </div>

                  {/* Leaderboard Section */}
                  <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/70 shadow-lg rounded-[2rem] p-6 space-y-6 relative overflow-hidden">

                    {/* Title and Filters */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Trophy className="size-4.5 text-amber-500" />
                          <span>Leaderboard</span>
                        </h3>
                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-655 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-indigo-100/30 dark:border-indigo-900/30">
                          Weekly
                        </span>
                      </div>

                      {/* Filter pills */}
                      <div className="flex gap-1 p-1 rounded-xl bg-slate-100/85 dark:bg-slate-800/60 text-[10px] font-bold border border-slate-200/10 dark:border-slate-700/10">
                        {['Day', 'Week', 'Month', 'All Time'].map((f) => (
                          <button
                            key={f}
                            className={`flex-1 py-1 rounded-lg transition-all duration-200 ${f === 'Week'
                              ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-850 dark:text-white font-extrabold'
                              : 'text-slate-400 hover:text-slate-755 dark:hover:text-slate-300'
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* Game pills */}
                      <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-black uppercase tracking-wider">
                        {['All', 'Math', 'Logic', 'Train', 'Word'].map((g) => (
                          <button
                            key={g}
                            className={`px-2.5 py-1 rounded-md transition-all duration-200 ${g === 'All'
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-700'
                              }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Podium Display */}
                    <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-100 dark:border-slate-800/80 items-end">

                      {/* Rank 2 */}
                      <div className="flex flex-col items-center group">
                        <div className="text-[10px] font-extrabold text-slate-655 dark:text-slate-300 text-center truncate max-w-[70px]">
                          Kamaldeep
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 mt-0.5 mb-1.5">
                          1,090
                        </div>
                        <div className="w-full bg-slate-50/70 dark:bg-slate-800/40 border-t-2 border-slate-300 dark:border-slate-600 rounded-t-xl h-14 flex flex-col items-center justify-end pb-3 relative transition-all duration-300 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/60 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.03)]">
                          <div className="absolute -top-3.5 size-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-350 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-xs shadow-sm">
                            2
                          </div>
                          <span className="text-xl">🥈</span>
                        </div>
                      </div>

                      {/* Rank 1 */}
                      <div className="flex flex-col items-center group">
                        <div className="text-[10px] font-black text-slate-855 dark:text-white text-center truncate max-w-[80px]">
                          Akshay
                        </div>
                        <div className="text-[9px] font-extrabold text-amber-555 dark:text-amber-400 mt-0.5 mb-1.5 animate-pulse">
                          1,860
                        </div>
                        <div className="w-full bg-amber-500/5 dark:bg-amber-500/5 border-t-2 border-amber-400 rounded-t-2xl h-20 flex flex-col items-center justify-end pb-3 relative transition-all duration-300 group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/10 shadow-[0_-8px_20px_-5px_rgba(245,158,11,0.12)]">
                          <div className="absolute -top-4.5 size-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-amber-305">
                            1
                          </div>
                          <span className="text-2xl drop-shadow-md animate-bounce duration-1000">👑</span>
                        </div>
                      </div>

                      {/* Rank 3 */}
                      <div className="flex flex-col items-center group">
                        <div className="text-[10px] font-extrabold text-slate-655 dark:text-slate-300 text-center truncate max-w-[70px]">
                          Amit
                        </div>
                        <div className="text-[9px] font-bold text-orange-500 dark:text-orange-400 mt-0.5 mb-1.5">
                          610
                        </div>
                        <div className="w-full bg-orange-100/10 dark:bg-orange-950/5 border-t-2 border-orange-350 dark:border-orange-900/60 rounded-t-xl h-11 flex flex-col items-center justify-end pb-2 relative transition-all duration-300 group-hover:bg-orange-100/20 dark:group-hover:bg-orange-950/10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.03)]">
                          <div className="absolute -top-3 size-6 rounded-full bg-orange-100 dark:bg-orange-900 border-2 border-orange-400 text-orange-650 dark:text-orange-400 flex items-center justify-center font-black text-[10px] shadow-sm">
                            3
                          </div>
                          <span className="text-base">🥉</span>
                        </div>
                      </div>

                    </div>

                    {/* List below Podium */}
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">

                      {/* User Card Highlight */}
                      <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/25 dark:border-indigo-500/15 text-indigo-650 dark:text-indigo-400 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-indigo-500/20 px-2 py-0.5 rounded-full">
                            #14
                          </span>
                          <span className="text-xs font-black truncate max-w-[110px] text-slate-800 dark:text-slate-200">
                            {profile?.full_name || 'You'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-650 dark:text-indigo-455 uppercase tracking-wide">You</span>
                          <span className="text-xs font-black text-slate-855 dark:text-slate-100">
                            {(() => {
                              const dropletEasy = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_easy') || '0', 10);
                              const dropletMedium = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_medium') || '0', 10);
                              const dropletHard = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_hard') || '0', 10);
                              const dropletExtreme = parseInt(localStorage.getItem('eduspace_droplet_dash_highscore_extreme') || '0', 10);
                              const dropletMax = Math.max(dropletEasy, dropletMedium, dropletHard, dropletExtreme);
                              const pathMax = Math.max(highScores.easy, highScores.medium, highScores.hard);
                              return Math.max(10, dropletMax + pathMax);
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Rank 4 */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex justify-between items-center text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <span className="font-extrabold text-slate-450 text-[10px]">#4</span>
                          <span className="font-bold truncate max-w-[130px] text-slate-700 dark:text-slate-300">कविताएं उपेन्द्र कुमार Poems in hi</span>
                        </div>
                        <span className="font-black text-slate-855 dark:text-white">395</span>
                      </div>

                      {/* Rank 5 */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex justify-between items-center text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <span className="font-extrabold text-slate-455 text-[10px]">#5</span>
                          <span className="font-bold truncate max-w-[130px] text-slate-700 dark:text-slate-300">Hasan Alhamoomi</span>
                        </div>
                        <span className="font-black text-slate-855 dark:text-white">320</span>
                      </div>

                      {/* Rank 6 */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/40 rounded-xl flex justify-between items-center text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <span className="font-extrabold text-slate-455 text-[10px]">#6</span>
                          <span className="font-bold truncate max-w-[130px] text-slate-700 dark:text-slate-300">MOSES PRADHAN</span>
                        </div>
                        <span className="font-black text-slate-855 dark:text-white">300</span>
                      </div>

                    </div>

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
      </div>

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
    </DashboardLayout>
  );
}
