import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { X, Trophy, Sparkles, Star, Award, Zap, Shield, Swords, Sword, Crown, Gem, Infinity as InfinityIcon, Target, Medal, GraduationCap, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

const IconMap: Record<string, React.ElementType> = {
  Trophy,
  Award,
  Zap,
  Shield,
  Swords,
  Sword,
  Crown,
  Gem,
  Target,
  Medal,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Infinity: InfinityIcon
};

interface CelebrationOverlayProps {
  title?: string;
  subtitle?: string;
  badgeName: string;
  badgeDescription: string;
  imageUrl?: string;
  iconName?: string;
  color?: string;
  xpReward?: number;
  streakCount?: number;
  showXp?: boolean;
  onClose: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  title = "ACHIEVEMENT UNLOCKED!",
  subtitle = "You've earned a milestone badge",
  badgeName,
  badgeDescription,
  imageUrl,
  iconName = 'Trophy',
  color = '#4f46e5',
  xpReward = 100,
  streakCount,
  showXp = true,
  onClose
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 1. Framer Motion values for 3D card tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring animations for ultra smooth tilt transition
  const rotateXSpring = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 120, damping: 20 });
  const rotateYSpring = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 120, damping: 20 });

  // Shine glow translation
  const shineX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  // Handle cursor hover movements inside the 3D card wrapper
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Normalize to range [-0.5, 0.5]
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    // Reset back to center
    x.set(0);
    y.set(0);
  };

  // 2. Play beautiful victory chimes synthesized dynamically via Web Audio API on mount
  useEffect(() => {
    setIsMounted(true);

    const playTriumphSound = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        const playSynthTone = (freq: number, start: number, duration: number, type: OscillatorType = 'sine') => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(freq, start);
          
          // Smooth amplitude envelope to avoid sharp pop sounds
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };

        const now = ctx.currentTime;
        // Synthesize a gorgeous C major arpeggio chords progression
        playSynthTone(261.63, now, 0.55, 'triangle');        // C4
        playSynthTone(329.63, now + 0.08, 0.55, 'triangle'); // E4
        playSynthTone(392.00, now + 0.16, 0.55, 'triangle'); // G4
        playSynthTone(523.25, now + 0.24, 0.7, 'sine');      // C5
        playSynthTone(659.25, now + 0.32, 0.7, 'sine');      // E5
        playSynthTone(783.99, now + 0.40, 0.8, 'sine');      // G5
        playSynthTone(1046.50, now + 0.48, 1.2, 'sine');     // C6 (Triumphant Peak)
        
        // Add a subtle high-frequency spark tone in background
        playSynthTone(1318.51, now + 0.56, 0.6, 'sine');     // E6
        playSynthTone(1567.98, now + 0.64, 0.8, 'sine');     // G6
      } catch (err) {
        console.warn('Synthesizer audio blocked or unsupported:', err);
      }
    };

    // 1. Play synthesized arpeggio victory fanfare
    playTriumphSound();

    // 2. Play native mobile haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 80, 250]);
    }

    // 3. Trigger center cascade confetti burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: [color, '#fbbf24', '#f59e0b', '#3b82f6', '#a855f7', '#10b981']
    });

    // 4. Trigger premium continuous left and right corner stream showers
    const end = Date.now() + 2500;
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      
      confetti({
        particleCount: 35,
        angle: 55,
        spread: 60,
        origin: { x: 0, y: 0.85 },
        colors: [color, '#fbbf24', '#f43f5e']
      });
      confetti({
        particleCount: 35,
        angle: 125,
        spread: 60,
        origin: { x: 1, y: 0.85 },
        colors: [color, '#3b82f6', '#10b981']
      });
    }, 200);

    return () => clearInterval(interval);
  }, [color]);

  const IconComponent = IconMap[iconName] || Trophy;

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Immersive Deep Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xl"
        />

        {/* Ambient Cosmic Neon Radial Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 animate-pulse"
            style={{ backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
          />
          <div className="absolute -bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-15 bg-amber-500/30" />
        </div>

        {/* Reusable Celebration Wrapper with 3D Perspective */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 80 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.75, opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 15, stiffness: 90 }}
          className="relative w-full max-w-md flex flex-col items-center justify-center z-10 perspective-[1000px] select-none"
        >
          {/* Decorative Stars Arc above Card */}
          <div className="flex items-end gap-1 mb-5 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] z-20">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.2 }}>
              <Star className="size-8 text-yellow-400 fill-yellow-400 opacity-80" />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}>
              <Star className="size-12 text-yellow-400 fill-yellow-400 -translate-y-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
            </motion.div>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, delay: 0.8 }}>
              <Star className="size-8 text-yellow-400 fill-yellow-400 opacity-80" />
            </motion.div>
          </div>

          {/* Interactive 3D Physics Card Container */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX: rotateXSpring,
              rotateY: rotateYSpring,
              transformStyle: 'preserve-3d',
            }}
            className="w-full relative bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/98 border border-white/10 rounded-[3rem] p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center gap-7 transition-all duration-300"
          >
            {/* Glossy Reflective Card Glint Overlay */}
            <motion.div 
              style={{
                background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.06) 0%, transparent 60%)`,
                transform: 'translateZ(1px)'
              }}
              className="absolute inset-0 pointer-events-none" 
            />

            {/* Glowing Accent Border Ring inside */}
            <div 
              className="absolute -inset-px opacity-30 rounded-[3rem] border-2 border-transparent"
              style={{ 
                backgroundImage: `linear-gradient(to bottom, ${color}, transparent)`, 
                maskImage: 'linear-gradient(white, white) content-box, linear-gradient(white, white)',
                maskComposite: 'exclude'
              }}
            />


            {/* Section A: Banner Title & Subtitle */}
            <div className="space-y-1.5 z-20" style={{ transform: 'translateZ(30px)' }}>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 animate-pulse block">
                {title}
              </span>
              <h2 className="text-xl font-bold text-slate-300 leading-tight">
                {subtitle}
              </h2>
            </div>

            {/* Section B: Dynamic Badge Showcase */}
            <div className="relative flex items-center justify-center z-10 py-2" style={{ transform: 'translateZ(60px)' }}>
              {/* Outer Pulsing Glow Rings */}
              <div 
                className="absolute size-48 rounded-full blur-2xl opacity-20 animate-pulse"
                style={{ backgroundColor: color }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute size-44 rounded-full border border-white/5 opacity-5"
              />

              {/* Holographic Badge Card Base */}
              <div 
                className="size-36 sm:size-40 rounded-full flex items-center justify-center border-4 relative overflow-hidden bg-slate-950/80 shadow-2xl"
                style={{ borderColor: color, boxShadow: `0 0 30px ${color}35` }}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={badgeName} 
                    className="size-28 sm:size-32 object-cover object-center rounded-full scale-105 group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <IconComponent className="size-16 sm:size-20" style={{ color: color }} />
                )}

                {/* Day Count Overlay (if applicable) */}
                {streakCount && (
                  <div className="absolute -bottom-1 inset-x-0 bg-gradient-to-t from-black via-black/90 to-transparent py-1 text-center border-t border-white/5">
                    <span className="text-[10px] font-black tracking-widest text-white">{streakCount} DAYS</span>
                  </div>
                )}
              </div>

              {/* Dynamic Sparkles Floating */}
              <div className="absolute inset-0 pointer-events-none">
                <Sparkles className="absolute top-2 left-2 size-5 text-yellow-400 animate-bounce" />
                <Sparkles className="absolute bottom-2 right-2 size-5 text-yellow-400 animate-ping delay-75" />
              </div>
            </div>

            {/* Section C: Title and Description of Badge */}
            <div className="space-y-2.5 z-20 w-full px-2" style={{ transform: 'translateZ(40px)' }}>
              <h3 
                className="text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r"
                style={{ backgroundImage: `linear-gradient(to right, #ffffff, ${color}, #ffffff)` }}
              >
                {badgeName}
              </h3>
              <p className="text-slate-400 font-semibold text-xs max-w-sm leading-relaxed mx-auto">
                {badgeDescription.replace(/^[^\s]+\s/, '')}
              </p>
            </div>

            {/* Section D: XP Points Award Card — only shown when showXp is true */}
            {showXp && (
              <div className="z-20 w-full" style={{ transform: 'translateZ(30px)' }}>
                <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-slate-950 border border-white/10 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]">
                  <div className="size-5 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 border border-yellow-200 flex items-center justify-center shadow-lg shrink-0">
                    <Star className="size-3 text-amber-950 fill-amber-950" />
                  </div>
                  <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Rewards Claimed</span>
                  <div className="h-3 w-[1px] bg-white/15" />
                  <span className="text-yellow-400 font-extrabold text-sm tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    +{xpReward} XP
                  </span>
                </div>
              </div>
            )}

            {/* Section E: Glowing OK Continue Button */}
            <div className="w-full pt-1.5 z-20" style={{ transform: 'translateZ(50px)' }}>
              <button
                onClick={onClose}
                style={{ 
                  boxShadow: `0 8px 24px -6px ${color}50`,
                  backgroundColor: color
                }}
                className="w-full h-14 sm:h-16 rounded-2xl text-white hover:brightness-110 font-black tracking-widest text-sm uppercase transition-all duration-300 flex items-center justify-center border border-white/20 active:scale-[0.98]"
              >
                Awesome! Continue
              </button>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
