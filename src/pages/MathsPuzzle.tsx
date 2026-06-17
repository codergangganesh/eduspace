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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MathPathGame } from '../components/puzzle/MathPathGame';
import { useStreak } from '../contexts/StreakContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { MathPlaygroundSettings } from '../components/puzzle/MathPlaygroundSettings';
import { MathTheme } from '../lib/mathGameTheme';
import { mathGameAudio } from '../lib/mathGameAudio';

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
    toast.info(nextMute ? '🔇 Sound muted' : '🔊 Sound enabled', { duration: 1000 });
  };

  const handleChangeTheme = (themeId: MathTheme['id']) => {
    setActiveTheme(themeId);
    localStorage.setItem('eduspace_math_theme', themeId);
    toast.success(`Theme changed to ${themeId}`, { duration: 1000 });
  };

  const handleResetHighScores = () => {
    localStorage.removeItem('eduspace_math_time_attack_highscore_easy');
    localStorage.removeItem('eduspace_math_time_attack_highscore_medium');
    localStorage.removeItem('eduspace_math_time_attack_highscore_hard');
    localStorage.removeItem('eduspace_math_time_attack_highscore');
    setHighScores({ easy: 0, medium: 0, hard: 0 });
    toast.success('🏆 High scores reset!', { description: 'All records have been cleared.' });
  };

  const handleResetTutorial = () => {
    localStorage.removeItem('eduspace_math_puzzle_tutorial_seen');
    toast.success('💡 Tutorial reset!', { description: 'How to Play will pop up on your next game.' });
  };

  const handleExitGame = () => {
    setActiveMode('daily'); // Fall back to daily challenge default
    setActiveGameTime(null);
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

  return (
    <DashboardLayout fullHeight>
      <div className="flex flex-col h-full w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden text-[#1E293B] dark:text-slate-100 font-sans antialiased">
        
        {/* Main Top Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-6 shrink-0 select-none z-10">
          <div className="flex items-center">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all size-9 flex items-center justify-center shrink-0 border-none mr-3"
            >
              <ArrowLeft className="size-4 text-slate-600 dark:text-slate-350" />
            </Button>
            <span className="text-sm sm:text-base font-black text-[#0B57D0] dark:text-blue-400 tracking-tight">MathPath</span>
            <div className="hidden md:block h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-3" />
            <span className="hidden md:inline-block text-[#0B57D0] dark:text-blue-400 font-bold text-xs truncate max-w-[200px]">
              {activeMode === 'daily' && 'Target Sums (Daily Challenge)'}
              {activeMode === 'time' && 'Target Sums (Time Attack)'}
              {activeMode === 'zen' && 'Target Sums (Zen Practice)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Timer Pill */}
            <div className="bg-[#EEF2F6] dark:bg-slate-800 px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-xl flex items-center gap-1 text-[#0B57D0] dark:text-blue-400">
              <Clock className="size-3 sm:size-3.5" />
              <span className="text-[10px] sm:text-[11px] font-black">{getTimerString()}</span>
            </div>

            {/* Action Buttons */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowTutorial(true)} 
              className="size-8 sm:size-9 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 border-none"
            >
              <HelpCircle className="size-4 text-slate-500 dark:text-slate-400" />
            </Button>
            
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

        {/* Central Scrollable Dashboard Views */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-8">
          <MathPathGame 
            mode={activeMode || 'daily'} 
            difficulty={activeDifficulty}
            themeId={activeTheme}
            onExit={handleExitGame} 
            onRecordStreak={handleRecordStreak}
            onTimerTick={(t) => setActiveGameTime(t)}
            onNewChallenge={openChallengeSelector}
          />
        </main>
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
                          <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
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
                          <ChevronRight className="size-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
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
                    <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">
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
    </DashboardLayout>
  );
}
