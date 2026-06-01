import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Trophy, Sparkles, Star, Medal, Award, Zap, Shield, Swords, Download, Infinity as InfinityIcon, TrendingUp, Flame, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export type DuelBadgeType =
  | 'first-victory'
  | '5-wins'
  | '10-wins'
  | '25-wins'
  | 'duel-champion'
  | 'top-challenger'
  | 'rank-climber'
  | 'unbeaten-streak'
  | 'elite-competitor'
  | 'duel-veteran'
  | 'fast-challenger'
  | 'grand-master-duelist';

export interface DuelBadgeDetail {
  name: string;
  description: string;
  color: string;
  target: number;
  reward: string;
  unit: string;
  icon: string;
  imageUrl?: string;
}

export const DUEL_BADGE_DETAILS: Record<DuelBadgeType, DuelBadgeDetail> = {
  'first-victory': {
    name: 'First Victory',
    description: '⚔️ Conquered your first Streak Duel challenge! A legendary competitor is born.',
    color: '#CD7F32', // Bronze
    target: 1,
    reward: '+100 XP',
    unit: 'Win',
    icon: 'Trophy',
    imageUrl: '/first_victory.png'
  },
  '5-wins': {
    name: 'Gladiator Rising',
    description: '🛡️ Earned 5 Streak Duel victories. Consistency in competitive battle pays off.',
    color: '#94A3B8', // Silver
    target: 5,
    reward: '+250 XP',
    unit: 'Wins',
    icon: 'Medal',
    imageUrl: '/gladiator_rising.png'
  },
  '10-wins': {
    name: 'Arena Master',
    description: '🏆 10 Streak Duel victories! You have established complete dominance in the classroom.',
    color: '#F59E0B', // Gold
    target: 10,
    reward: '+500 XP',
    unit: 'Wins',
    icon: 'Trophy',
    imageUrl: '/arena_master.png'
  },
  '25-wins': {
    name: 'Streak Overlord',
    description: '👑 25 Streak Duel victories! A true powerhouse of consecutive learning and challenge.',
    color: '#10B981', // Emerald
    target: 25,
    reward: '+1000 XP',
    unit: 'Wins',
    icon: 'Award',
    imageUrl: '/streak_overlord.png'
  },
  'duel-champion': {
    name: 'Duel Champion',
    description: '🔴 50 Streak Duel victories! You are now revered as an absolute learning war hero.',
    color: '#EF4444', // Ruby
    target: 50,
    reward: '+2000 XP',
    unit: 'Wins',
    icon: 'Trophy',
    imageUrl: '/duel_champion.png'
  },
  'top-challenger': {
    name: 'Top Challenger',
    description: '⚡ Initiated 10 Streak Duel challenges. A fearless peer and relentless competitor.',
    color: '#3B82F6', // Blue
    target: 10,
    reward: '+300 XP',
    unit: 'Challenges',
    icon: 'Zap',
    imageUrl: '/top_challenger.png'
  },
  'rank-climber': {
    name: 'Rank Climber',
    description: '📈 Reached Top 3 on the Ranks Podium! A rising star of academic performance.',
    color: '#06B6D4', // Cyan
    target: 3,
    reward: '+400 XP',
    unit: 'Top Ranks',
    icon: 'TrendingUp',
    imageUrl: '/rank_climber.png'
  },
  'unbeaten-streak': {
    name: 'Unbeaten Legend',
    description: '🛡️ Achieved a 5-match unbeaten streak (wins/ties in completed duels). Invincible!',
    color: '#8B5CF6', // Purple
    target: 5,
    reward: '+600 XP',
    unit: 'Matches',
    icon: 'Shield',
    imageUrl: '/unbeaten_legend.png'
  },
  'elite-competitor': {
    name: 'Elite Competitor',
    description: '⚔️ Won 15 Streak Duel battles. Proof of peak academic battle mastery.',
    color: '#EC4899', // Pink
    target: 15,
    reward: '+750 XP',
    unit: 'Wins',
    icon: 'Swords',
    imageUrl: '/elite_competitor.png'
  },
  'duel-veteran': {
    name: 'Duel Veteran',
    description: '♾️ Participated in 30 completed Streak Duels. Experienced, resilient, and unstoppable.',
    color: '#6366F1', // Indigo
    target: 30,
    reward: '+800 XP',
    unit: 'Duels',
    icon: 'Infinity',
    imageUrl: '/duel_veteran.png'
  },
  'fast-challenger': {
    name: 'Fast Challenger',
    description: '✨ Won 3 duels as the challenger! Speed, strategy, and perfect focus.',
    color: '#FBBF24', // Amber
    target: 3,
    reward: '+350 XP',
    unit: 'Wins',
    icon: 'Sparkles',
    imageUrl: '/fast_challenger.png'
  },
  'grand-master-duelist': {
    name: 'Grand Master Duelist',
    description: '🌌 100 Streak Duel victories! The ultimate summit of persistence and intellectual battle.',
    color: '#10B981', // Mint/Cyan
    target: 100,
    reward: '+5000 XP',
    unit: 'Wins',
    icon: 'Crown',
    imageUrl: '/grand_master_duelist.png'
  }
};

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

interface DuelBadgeDetailModalProps {
  type: DuelBadgeType | null;
  isOpen: boolean;
  onClose: () => void;
  hideShare?: boolean;
  hideClose?: boolean;
  hideGenerate?: boolean;
  externalProfile?: any;
}

export const DuelBadgeDetailModal: React.FC<DuelBadgeDetailModalProps> = ({
  type,
  isOpen,
  onClose,
  hideShare = false,
  hideClose = false,
  hideGenerate = false,
  externalProfile
}) => {
  const { profile: authProfile } = useAuth();
  const profile = externalProfile || authProfile;
  const [view, setView] = useState<'interactive' | 'result'>('interactive');
  const [randomStars, setRandomStars] = useState<{ top: string; left: string; size: number; delay: number }[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setView('interactive'); // Reset to interactive when opening
      // Generate some random positions for sparkles
      const stars = Array.from({ length: 12 }).map(() => ({
        top: `${Math.random() * 80 + 10}%`,
        left: `${Math.random() * 80 + 10}%`,
        size: Math.random() * 20 + 10,
        delay: Math.random() * 2
      }));
      setRandomStars(stars);
    }
  }, [isOpen]);

  if (!type) return null;
  const details = DUEL_BADGE_DETAILS[type];
  const IconComponent = IconMap[details.icon] || Trophy;

  const handleGenerateCard = () => {
    setView('result');
  };

  const handleDownload = async () => {
    if (!resultCardRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading('Capturing your duel achievement card...');

    try {
      const dataUrl = await toPng(resultCardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2, // Higher quality for saving
        backgroundColor: '#030712',
      });

      const link = document.createElement('a');
      link.download = `eduspace-duel-${type}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Card downloaded!', { id: toastId });
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error('Direct download failed on this browser. Copying the share link to clipboard instead!', { id: toastId });
      handleShare();
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied share link to clipboard!');
    }).catch((err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleShare = async () => {
    if (!profile?.user_id) {
      toast.error("Profile ID not found. Please refresh and try again.");
      return;
    }

    const shareUrl = `${window.location.origin}/duel-badge/${profile.user_id}?badge=${type}`;
    const shareMessage = `I just unlocked the ${details.name} Badge in the Streak Duel Arena on EduSpace! Check out my achievement: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Streak Duel Achievement | Eduspace`,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 overflow-y-auto cursor-pointer"
        >
          {/* Background Spotlight Effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[80px] rounded-full" />

            {/* Spotlight Beam */}
            <div
              className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[1000px]"
              style={{
                background: 'conic-gradient(from 165deg at 50% 0%, transparent 0%, rgba(99,102,241,0.05) 15%, transparent 30%)',
                transform: 'rotate(0deg)'
              }}
            />
          </div>

          {/* Floating Sparkles */}
          {randomStars.map((star, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0.5, 1, 0],
                opacity: [0, 0.8, 0.3, 0.8, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut"
              }}
              className="absolute pointer-events-none"
              style={{ top: star.top, left: star.left }}
            >
              <Sparkles className="text-white/40" style={{ width: star.size, height: star.size }} />
            </motion.div>
          ))}

          {/* Main Content Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl flex flex-col items-center text-center text-white cursor-default"
          >
            {view === 'interactive' ? (
              <>
                {/* Internal Close Button */}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="absolute top-0 right-0 sm:-top-6 sm:-right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
                  >
                    <X className="size-6 sm:size-7" />
                  </button>
                )}
                {/* Small Personalized intro */}
                <div className="absolute -top-10 sm:-top-14 left-4 opacity-50">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-indigo-400 uppercase">
                    Streak Duel Achievement
                  </span>
                </div>

                {/* Wrap content to capture */}
                <div ref={badgeRef} className="flex flex-col items-center bg-transparent p-4 sm:p-8 w-full max-w-sm sm:max-w-xl">
                  {/* Congratulations Heading */}
                  <div className="space-y-1 mb-10 sm:mb-16 lg:mb-20">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 uppercase tracking-wide"
                    >
                      Congratulations
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-base sm:text-xl lg:text-2xl font-black drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      style={{ color: details.imageUrl ? '#FBBF24' : details.color }}
                    >
                      Unlocked: {details.name} Badge!
                    </motion.p>
                  </div>

                  {/* Central Badge Visualization */}
                  <div className="relative group mb-12 sm:mb-20">
                    {/* Glow behind badge */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 blur-[60px] rounded-full"
                      style={{ backgroundColor: details.imageUrl ? '#D97706' : details.color }}
                    />

                    {/* Rotating Badge Frame */}
                    <motion.div
                      initial={{ rotateY: 180, scale: 0 }}
                      animate={isExporting ? {
                        rotateY: 0,
                        scale: 1
                      } : {
                        rotateY: [0, 360],
                        scale: 1
                      }}
                      transition={isExporting ? { duration: 0.1 } : {
                        rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
                        scale: { type: "spring", damping: 12, stiffness: 100, delay: 0.4 }
                      }}
                      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                      className="relative size-48 sm:size-72 lg:size-80 flex items-center justify-center p-4"
                    >
                      {/* The Hexagon Shape Design with 3D Flip */}
                      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                        {/* Front Side */}
                        <div
                          className="absolute inset-0 w-full h-full flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                          style={{
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden'
                          }}
                        >
                          {/* Main Hexagon Body */}
                          <div
                            className="absolute inset-0 bg-[#0d0f1b] shadow-inner"
                            style={{
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                              border: `2px solid ${details.imageUrl ? '#FBBF24' : details.color}30`
                            }}
                          >
                            {/* Texture/Pattern inside */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' }} />
                          </div>

                          {/* Metallic Border Overlay */}
                          <div
                            className="absolute inset-[-4px] opacity-90 p-[4px]"
                            style={{
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                              background: details.imageUrl 
                                ? 'linear-gradient(135deg, #FBBF24, #FFFFFF, #D97706)' 
                                : `linear-gradient(135deg, ${details.color}, #ffffff, ${details.color})`
                            }}
                          >
                            <div
                              className="w-full h-full bg-[#0a0c16]"
                              style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                            />
                          </div>

                          {/* Large Dynamic Color Section */}
                          <div
                            className="absolute bottom-[-10%] right-[-10%] size-[120%] opacity-90 transition-colors duration-500"
                            style={{
                              background: `radial-gradient(circle at 100% 100%, ${details.imageUrl ? '#D97706' : details.color}, transparent 70%)`,
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                              filter: `drop-shadow(0 0 30px ${details.imageUrl ? '#D97706' : details.color}40)`
                            }}
                          />

                          {/* Center Content */}
                          <div className="relative z-10 flex flex-col items-center justify-center space-y-2" style={{ transform: 'translateZ(50px)' }}>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] sm:text-xs font-black tracking-[0.4em] text-white/40 uppercase">ARENA</span>
                              <span className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none leading-none">
                                {details.target}
                              </span>
                              <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-white/80 uppercase">{details.unit}</span>
                            </div>

                            {/* Dynamic Icon */}
                            <div className="mt-2 sm:mt-4 p-2 sm:p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden">
                              {details.imageUrl ? (
                                <img
                                  src={details.imageUrl}
                                  alt={details.name}
                                  className="size-6 sm:size-10 lg:size-12 object-contain"
                                />
                              ) : (
                                <IconComponent
                                  className="size-6 sm:size-10 lg:size-12"
                                  style={{ color: details.color }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Shine reflection effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                        </div>

                        {/* Back Side */}
                        <div
                          className="absolute inset-0 w-full h-full flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                          style={{
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                          }}
                        >
                          {/* Main Hexagon Body */}
                          <div
                            className="absolute inset-0 bg-[#0d0f1b]"
                            style={{
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                              border: `2px solid ${details.imageUrl ? '#FBBF24' : details.color}30`
                            }}
                          >
                            {/* Texture/Pattern inside */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
                          </div>

                          {/* Metallic Border Overlay */}
                          <div
                            className="absolute inset-[-4px] opacity-90 p-[4px]"
                            style={{
                              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                              background: details.imageUrl 
                                ? 'linear-gradient(135deg, #FBBF24, #FFFFFF, #D97706)' 
                                : `linear-gradient(135deg, ${details.color}, #ffffff, ${details.color})`
                            }}
                          >
                            <div
                              className="w-full h-full bg-[#0a0c16]"
                              style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                            />
                          </div>

                          {/* Center Logo Content */}
                          <div className="relative z-10 flex flex-col items-center justify-center space-y-2 sm:space-y-6" style={{ transform: 'translateZ(50px)' }}>
                            <div className="relative size-16 sm:size-32">
                              <motion.div
                                animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-[-20px] sm:inset-[-40px] blur-[60px] rounded-full"
                                style={{ backgroundColor: `${details.imageUrl ? '#D97706' : details.color}20` }}
                              />

                              {/* Silhouette & Outline Effect using image filters for a grey transparent look */}
                              <div className="relative size-full flex items-center justify-center">
                                <img
                                  src="/favicon.png"
                                  alt="Application Logo"
                                  className="size-full object-contain opacity-25 grayscale contrast-75 brightness-75"
                                  style={{
                                    filter: 'drop-shadow(1px 0 0 rgba(255,255,255,0.15)) drop-shadow(-1px 0 0 rgba(255,255,255,0.15)) drop-shadow(0 1px 0 rgba(255,255,255,0.15)) drop-shadow(0 -1px 0 rgba(255,255,255,0.15))'
                                  }}
                                />
                                <img
                                  src="/favicon.png"
                                  alt="Application Logo Glow"
                                  className="absolute inset-0 size-full object-contain opacity-10 blur-[8px] grayscale contrast-75 brightness-50"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col items-center text-center max-w-[85%] mx-auto">
                              <span className="text-xs sm:text-lg lg:text-xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 uppercase leading-snug drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                                {details.name}
                              </span>
                              <div className="h-px w-6 sm:w-12 bg-white/20 mt-1 sm:mt-2" />
                              <span className="text-[6px] sm:text-[9px] font-black tracking-[0.3em] text-white/30 uppercase mt-1 sm:mt-2">
                                Arena Duel Badge
                              </span>
                              <span className="text-[5px] sm:text-[6px] font-black tracking-[0.2em] text-white/10 uppercase mt-2 sm:mt-4">
                                eduspaceacademy.online
                              </span>
                            </div>
                          </div>

                          {/* Shine reflection effect */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 max-w-md">
                    {profile?.full_name && (
                      <p className="text-sm sm:text-base font-black tracking-wide text-white">
                        Unlocked by {profile.full_name}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">{details.description}</p>
                    <div className="mt-3 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-wider">
                      Reward: {details.reward}
                    </div>
                  </div>
                </div>

                {/* Generate Card and Share buttons */}
                <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-center">
                  {!hideGenerate && (
                    <Button
                      onClick={handleGenerateCard}
                      className="flex-1 sm:flex-initial h-10 sm:h-12 px-6 sm:px-12 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-black text-[10px] sm:text-sm hover:scale-105 transition-transform hover:opacity-90 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.5)] border-none"
                    >
                      Generate Card
                    </Button>
                  )}

                  {!hideShare && (
                    <Button
                      onClick={handleShare}
                      size="icon"
                      variant="ghost"
                      className="size-10 sm:size-12 shrink-0 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Share2 className="size-4 sm:size-5" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              /* Premium Result Card View */
              <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto">
                <div
                  ref={resultCardRef}
                  className="relative w-full aspect-[9/16] bg-[#030712] rounded-[2rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
                >
                  {/* Header: Actions (Left) + Logo (Right) */}
                  <div className="p-6 sm:p-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!isExporting && (
                        <button
                          onClick={() => setView('interactive')}
                          className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"
                          title="Go Back"
                        >
                          <X className="size-5" />
                        </button>
                      )}
                      {!isExporting && (
                        <button
                          onClick={handleDownload}
                          className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"
                          title="Download Achievement"
                        >
                          <Download className="size-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-lg sm:text-xl tracking-tight text-white/90 leading-none">EduSpace</span>
                        <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase mt-1">Duel Arena Pride</span>
                      </div>
                      <div className="size-10 sm:size-12 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md">
                        <img src="/favicon.png" alt="EduSpace Logo" className="size-full object-contain" />
                      </div>
                    </div>
                  </div>

                  {/* Top Text Content */}
                  <div className="px-8 mt-4 sm:mt-6 text-center space-y-2">
                    <p className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">ARENA ACHIEVEMENT UNLOCKED • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Gladiator Ascended,</h2>
                    <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      {profile?.full_name?.split(' ')[0]} {profile?.full_name?.split(' ')[1] || ''}!
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Sparkles className="size-3 text-indigo-400 fill-indigo-400" />
                      <span className="text-[8px] sm:text-[10px] font-black text-indigo-400/80 tracking-widest uppercase italic">ARENA DOMINATION</span>
                    </div>
                    <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <span className="text-[10px] font-bold text-white/60 tracking-wider uppercase">Session {new Date().getFullYear()}</span>
                    </div>
                  </div>

                  {/* Central Badge View (Simplified & High Detail) */}
                  <div className="flex-1 flex items-center justify-center relative p-8">
                    {/* Ambient Glow */}
                    <div
                      className="absolute size-[250px] blur-[100px] opacity-40 rounded-full"
                      style={{ background: details.imageUrl ? '#D97706' : details.color }}
                    />

                    <div className="relative size-56 sm:size-64">
                      {/* Static Hexagon Design */}
                      <div
                        className="absolute inset-0 bg-[#060813] shadow-2xl"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          border: `2px solid ${details.imageUrl ? '#FBBF24' : details.color}50`
                        }}
                      />
                      {/* Inner border glow */}
                      <div
                        className="absolute inset-2 opacity-20"
                        style={{
                          background: `linear-gradient(to bottom, ${details.imageUrl ? '#FBBF24' : details.color}, transparent)`,
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                        }}
                      />

                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                        <span className="text-[9px] font-black tracking-[0.3em] uppercase text-center px-4 leading-tight" style={{ color: details.imageUrl ? '#FBBF24' : details.color }}>
                          {details.name}
                        </span>
                        <span className="text-7xl sm:text-8xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                          {details.target}
                        </span>
                        <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase">{details.unit}</span>

                        {/* Glow Line at bottom */}
                        <div className="h-1 w-12 rounded-full mt-2" style={{ backgroundColor: details.imageUrl ? '#FBBF24' : details.color, boxShadow: `0 0 15px ${details.imageUrl ? '#FBBF24' : details.color}` }} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Text */}
                  <div className="px-8 pb-10 text-center">
                    <p className="text-[10px] sm:text-xs font-bold text-white/40 leading-relaxed uppercase tracking-widest font-sans">
                      DOMINATING 1V1 CLASSROOM DUELS IN <span className="text-indigo-400">{new Date().getFullYear()}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
