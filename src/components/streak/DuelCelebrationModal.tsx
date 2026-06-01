import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Star, Medal, Award, Zap, Crown, Shield, Swords, TrendingUp, Infinity as InfinityIcon } from 'lucide-react';
import { DuelBadgeType, DUEL_BADGE_DETAILS } from './DuelBadgeDetailModal';
import confetti from 'canvas-confetti';

const IconMap: Record<string, React.ElementType> = {
  Trophy,
  Medal,
  Award,
  Zap,
  Shield,
  Swords,
  TrendingUp,
  Sparkles,
  Crown,
  Infinity: InfinityIcon
};

interface DuelCelebrationModalProps {
  badgeType: DuelBadgeType;
  winsCount: number;
  onClose: () => void;
}

export const DuelCelebrationModal: React.FC<DuelCelebrationModalProps> = ({
  badgeType,
  winsCount,
  onClose
}) => {
  const details = DUEL_BADGE_DETAILS[badgeType];
  const IconComponent = IconMap[details.icon] || Trophy;

  // Trigger high-quality game confetti burst when modal mounts
  useEffect(() => {
    // Play premium 8-bit/high-fidelity victory level-up audio synthesized via Web Audio API
    const playUnlockSound = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.05); // volume ramp up
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration); // smooth decay
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };

        // Play a beautiful, rapid ascending major chord arpeggio (C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6)
        const now = ctx.currentTime;
        playTone(261.63, now, 0.5, 'triangle');        // C4
        playTone(329.63, now + 0.07, 0.5, 'triangle'); // E4
        playTone(392.00, now + 0.14, 0.5, 'triangle'); // G4
        playTone(523.25, now + 0.21, 0.6, 'sine');     // C5
        playTone(659.25, now + 0.28, 0.6, 'sine');     // E5
        playTone(783.99, now + 0.35, 0.7, 'sine');     // G5
        playTone(1046.50, now + 0.42, 1.0, 'sine');    // C6 (Final peak pitch)
      } catch (err) {
        console.warn('AudioContext failed to synthesize unlock sound:', err);
      }
    };

    // 1. Play musical arpeggio sound
    playUnlockSound();

    // 2. Center burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']
    });

    // 3. Trigger premium mobile haptic vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }

    // 4. Side showers
    const end = Date.now() + (2 * 1000);
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#fb7185']
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#3b82f6']
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Deep Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Gamified Dialog Box container */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotate: [0, -2, 1, 0] }}
          exit={{ scale: 0.7, opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 14, stiffness: 100 }}
          className="relative w-full max-w-md flex flex-col items-center justify-center select-none"
        >
          {/* Decorative Sparks and Cosmic Glow in Background */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="absolute size-[350px] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute size-[220px] bg-amber-500/20 rounded-full blur-[80px]" />
          </div>

          {/* ============================================================== */}
          {/* 1. Header Sign - Wooden Style & 3D Yellow stars */}
          {/* ============================================================== */}
          <div className="relative z-20 flex flex-col items-center translate-y-6">
            
            {/* Three Shiny Yellow 3D Game Stars */}
            <div className="flex items-end gap-1 mb-1.5 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}>
                <Star className="size-8 text-yellow-400 fill-yellow-400" />
              </motion.div>
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Star className="size-11 text-yellow-400 fill-yellow-400 -translate-y-1 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
              </motion.div>
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 1 }}>
                <Star className="size-8 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </div>

            {/* Red Ribbon wrapping */}
            <div className="absolute top-[32px] bg-gradient-to-r from-red-700 via-red-600 to-red-700 h-10 w-[95%] rounded-full shadow-lg border-b-4 border-red-800 pointer-events-none" />

            {/* Curved Wooden Sign Plank */}
            <div className="relative px-10 py-3.5 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 border-4 border-amber-950 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_4px_0_rgba(255,255,255,0.15)] flex items-center justify-center">
              <h2 className="text-2xl sm:text-3xl font-black text-yellow-300 tracking-wider uppercase font-sans drop-shadow-[0_3px_0_#78350f,0_5px_10px_rgba(0,0,0,0.5)] italic select-none">
                CONGRATULATIONS
              </h2>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. Main Board Panel - Deep Indigo/Purple Board */}
          {/* ============================================================== */}
          <div className="relative z-10 w-full bg-gradient-to-b from-slate-800 via-slate-900 to-indigo-950 border-4 border-slate-950 rounded-[2.5rem] p-7 pt-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between items-center space-y-6">
            
            {/* Background Board texture */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_80%)]" />

            <div className="space-y-4 w-full">
              {/* Titled Banner */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-yellow-500/80 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  YOUR REWARDS
                </span>
                <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mt-1" />
              </div>

              {/* Slots Container - matching image slots style */}
              <div className="bg-slate-950/80 border-[3px] border-indigo-900/60 rounded-3xl p-5 space-y-4 shadow-[inset_0_6px_10px_rgba(0,0,0,0.6)]">
                
                {/* Reward Item 1: Gold Coin +XP */}
                <div className="flex items-center justify-between bg-indigo-950/30 border border-indigo-900/40 rounded-2xl p-3 shadow-inner hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 border-[3px] border-yellow-200 flex items-center justify-center shadow-lg animate-bounce shrink-0">
                      <Star className="size-5 text-amber-950 fill-amber-950" />
                    </div>
                    <span className="text-slate-300 font-black text-xs sm:text-sm uppercase tracking-wide">Experience XP</span>
                  </div>
                  <div className="text-yellow-400 font-extrabold text-lg sm:text-xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {details.reward}
                  </div>
                </div>

                {/* Reward Item 2: Custom Gem / Locked Badge */}
                <div className="flex items-center justify-between bg-indigo-950/30 border border-indigo-900/40 rounded-2xl p-3 shadow-inner hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-11 rounded-full border-2 flex items-center justify-center shrink-0 shadow-lg overflow-hidden"
                      style={{ backgroundColor: `${details.imageUrl ? '#FBBF24' : details.color}25`, borderColor: details.imageUrl ? '#FBBF24' : details.color }}
                    >
                      {details.imageUrl ? (
                        <img src={details.imageUrl} alt={details.name} className="size-8 shrink-0 object-cover rounded-full" />
                      ) : (
                        <IconComponent className="size-5 shrink-0" style={{ color: details.color }} />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="block text-slate-300 font-black text-[10px] sm:text-xs uppercase tracking-wide">Unlocked Badge</span>
                      <span className="block text-white/95 font-extrabold text-[9px] uppercase tracking-wide truncate max-w-[150px] mt-0.5">{details.name}</span>
                    </div>
                  </div>
                  <div className="text-emerald-400 font-extrabold text-sm sm:text-base tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    +1 unlocked
                  </div>
                </div>

              </div>
            </div>

            {/* Achievement custom description text */}
            <div className="px-3 max-w-sm">
              <p className="text-slate-400 font-bold text-xs leading-normal">
                {details.description}
              </p>
            </div>

            {/* ============================================================== */}
            {/* 3. big Yellow OK Button */}
            {/* ============================================================== */}
            <div className="w-full pt-2">
              <button
                onClick={onClose}
                className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-b from-yellow-400 via-amber-400 to-amber-500 border-b-4 border-amber-700 text-amber-950 font-black tracking-widest text-lg uppercase shadow-[0_8px_16px_rgba(245,158,11,0.2)] hover:from-yellow-300 hover:to-amber-400 active:border-b-0 active:translate-y-[4px] active:shadow-inner transition-all duration-100 flex items-center justify-center border-t border-x border-yellow-300/30"
              >
                OK
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
