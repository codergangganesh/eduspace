import React, { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Trophy, Sparkles, Star, Medal, Award, Zap, Shield, Sword, Gem, GraduationCap, Target, Download, Infinity as InfinityIcon } from 'lucide-react';
import { BadgeType, BADGE_DETAILS } from '@/services/streakService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const IconMap: Record<string, React.ElementType> = {
    Trophy,
    Medal,
    Award,
    Zap,
    GraduationCap,
    Sparkles,
    Shield,
    Sword,
    Gem,
    Target,
    Infinity: InfinityIcon
};

interface StreakBadgeDetailModalProps {
    type: BadgeType | null;
    isOpen: boolean;
    onClose: () => void;
    hideShare?: boolean;
    hideClose?: boolean;
    hideGenerate?: boolean;
    externalProfile?: any;
}

export const StreakBadgeDetailModal: React.FC<StreakBadgeDetailModalProps> = ({
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
    const details = BADGE_DETAILS[type];
    const IconComponent = IconMap[details.icon] || Trophy;


    const handleGenerateCard = () => {
        setView('result');
    };

    const handleDownload = async () => {
        if (!resultCardRef.current) return;
        setIsExporting(true);
        const toastId = toast.loading('Capturing your achievement card...');

        try {
            const dataUrl = await toPng(resultCardRef.current, {
                cacheBust: true,
                quality: 1,
                pixelRatio: 2, // Higher quality for saving
                backgroundColor: '#050b14',
            });

            const link = document.createElement('a');
            link.download = `eduspace-academy-streak-${details.level}-days.png`;
            link.href = dataUrl;
            link.click();

            toast.success('Card downloaded!', { id: toastId });
        } catch (error) {
            console.error('Error downloading card:', error);
            toast.error('Download failed. Try again.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const handleShare = async () => {
        if (!profile?.user_id) {
            toast.error("Profile ID not found. Please refresh and try again.");
            return;
        }

        const shareUrl = `${window.location.origin}/badge/${profile.user_id}?badge=${type}`;
        const shareMessage = `I just reached a ${details.level} Days Academic Streak on Eduspace Academy! Check out my live achievement: ${shareUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Academic Achievement | Eduspace Academy`,
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

    return (
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
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/5 blur-[120px] rounded-full" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-white/10 blur-[80px] rounded-full" />

                        {/* Spotlight Beam */}
                        <div
                            className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[1000px]"
                            style={{
                                background: 'conic-gradient(from 165deg at 50% 0%, transparent 0%, rgba(255,255,255,0.05) 15%, transparent 30%)',
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
                                {/* Internal Close Button - Repositioned for mobile accessibility */}
                                {!hideClose && (
                                    <button
                                        onClick={onClose}
                                        className="absolute top-0 right-0 sm:-top-6 sm:-right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-[110]"
                                    >
                                        <X className="size-6 sm:size-7" />
                                    </button>
                                )}
                                {/* Small Personalized intro instead of full header */}
                                <div className="absolute -top-10 sm:-top-14 left-4 opacity-50">
                                    <span className="text-[10px] sm:text-xs font-medium tracking-widest text-white/60">
                                        Academic Achievement
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
                                            className="text-xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
                                        >
                                            Congratulations
                                        </motion.h2>
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-base sm:text-xl lg:text-2xl font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                        >
                                            {details.level} Days Academic Streak!
                                        </motion.p>
                                    </div>

                                    {/* Central Badge Visualization */}
                                    <div className="relative group mb-12 sm:mb-20">
                                        {/* Glow behind badge */}
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="absolute inset-0 blur-[60px] rounded-full"
                                            style={{ backgroundColor: details.color }}
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
                                                        className="absolute inset-0 bg-[#1a1a1a] shadow-inner"
                                                        style={{
                                                            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                                                            border: '2px solid rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        {/* Texture/Pattern inside */}
                                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' }} />
                                                    </div>

                                                    {/* Metallic Border Overlay */}
                                                    <div
                                                        className="absolute inset-[-4px] bg-gradient-to-tr from-slate-400 via-white to-slate-400 opacity-90 p-[4px]"
                                                        style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                                    >
                                                        <div
                                                            className="w-full h-full bg-[#121212]"
                                                            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                                        />
                                                    </div>

                                                    {/* Large Dynamic Color Section */}
                                                    <div
                                                        className="absolute bottom-[-10%] right-[-10%] size-[120%] opacity-90 transition-colors duration-500"
                                                        style={{
                                                            background: `radial-gradient(circle at 100% 100%, ${details.color}, transparent 70%)`,
                                                            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                                                            filter: `drop-shadow(0 0 30px ${details.color}40)`
                                                        }}
                                                    />

                                                    {/* Center Content */}
                                                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2" style={{ transform: 'translateZ(50px)' }}>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] sm:text-xs font-black tracking-[0.4em] text-white/40 uppercase">Level</span>
                                                            <span className="text-4xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none leading-none">
                                                                {details.level}
                                                            </span>
                                                            <span className="text-[10px] sm:text-xs font-black tracking-[0.5em] text-white/80 uppercase">DAYS</span>
                                                        </div>

                                                        {/* Dynamic Icon */}
                                                        <div className="mt-2 sm:mt-4 p-2 sm:p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                                                            <IconComponent
                                                                className="size-6 sm:size-10 lg:size-12"
                                                                style={{ color: details.color }}
                                                            />
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
                                                        className="absolute inset-0 bg-[#1a1a1a]"
                                                        style={{
                                                            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                                                            border: '2px solid rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        {/* Texture/Pattern inside */}
                                                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '8px 8px' }} />
                                                    </div>

                                                    {/* Metallic Border Overlay */}
                                                    <div
                                                        className="absolute inset-[-4px] bg-gradient-to-tr from-slate-500 via-slate-200 to-slate-500 opacity-90 p-[4px]"
                                                        style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                                    >
                                                        <div
                                                            className="w-full h-full bg-[#121212]"
                                                            style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                                        />
                                                    </div>

                                                    {/* Center Logo Content */}
                                                    <div className="relative z-10 flex flex-col items-center justify-center space-y-2 sm:space-y-6" style={{ transform: 'translateZ(50px)' }}>
                                                        <div className="relative size-16 sm:size-32">
                                                            <motion.div
                                                                animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.2, 1] }}
                                                                transition={{ duration: 4, repeat: Infinity }}
                                                                className="absolute inset-[-20px] sm:inset-[-40px] blur-[60px] bg-white/10 rounded-full"
                                                            />

                                                            {/* Silhouette & Outline Effect using image filters */}
                                                            <div className="relative size-full">
                                                                <img
                                                                    src="/favicon.png"
                                                                    alt="Application Logo"
                                                                    className="size-full object-contain brightness-0 invert opacity-10"
                                                                    style={{
                                                                        filter: 'drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white)'
                                                                    }}
                                                                />
                                                                <img
                                                                    src="/favicon.png"
                                                                    alt="Application Logo Glow"
                                                                    className="absolute inset-0 size-full object-contain brightness-0 invert opacity-10 blur-[6px]"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm sm:text-xl lg:text-2xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 uppercase">
                                                                Eduspace Academy
                                                            </span>
                                                            <div className="h-px w-6 sm:w-12 bg-white/20 mt-1 sm:mt-2" />
                                                            <span className="text-[6px] sm:text-[9px] font-black tracking-[0.4em] text-white/30 uppercase mt-1 sm:mt-2">
                                                                Official Badge
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

                                    <div className="flex flex-col items-center gap-1 opacity-60">
                                        {profile?.full_name && (
                                            <p className="text-sm sm:text-lg font-bold tracking-tight text-white mb-1">
                                                Achievement by {profile.full_name}
                                            </p>
                                        )}
                                        <p className="text-[8px] sm:text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">
                                            ACADEMIC CONSISTENCY • {details.level}+ DAYS STREAK
                                        </p>
                                        <p className="text-[6px] font-medium tracking-[0.2em] text-white/30">
                                            eduspaceacademy.online
                                        </p>
                                    </div>
                                </div>

                                {/* Generate Card and Share buttons */}
                                <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-center">
                                    {!hideGenerate && (
                                        <Button
                                            onClick={handleGenerateCard}
                                            className="flex-1 sm:flex-initial h-10 sm:h-12 px-6 sm:px-12 rounded-full bg-gradient-to-b from-[#d4af37] to-[#b8860b] text-black font-black text-[10px] sm:text-sm hover:scale-105 transition-transform hover:opacity-90 shadow-[0_10px_30px_-5px_rgba(184,134,11,0.5)] border-none"
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
                            /* Premium Result Card View (Based on provided image) */
                            <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto">
                                <div
                                    ref={resultCardRef}
                                    className="relative w-full aspect-[9/16] bg-[#050b14] rounded-[2rem] overflow-hidden flex flex-col border border-white/10 shadow-2xl"
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
                                                <span className="font-black text-lg sm:text-xl tracking-tight text-white/90 leading-none">Eduspace Academy</span>
                                                <span className="text-[8px] font-black tracking-widest text-[#d4af37] uppercase mt-1">Academic Pride</span>
                                            </div>
                                            <div className="size-10 sm:size-12 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-md">
                                                <img src="/favicon.png" alt="Eduspace Academy Logo" className="size-full object-contain" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Text Content */}
                                    <div className="px-8 mt-4 sm:mt-6 text-center space-y-2">
                                        <p className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">ACHIEVEMENT UNLOCKED • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">Great Work,</h2>
                                        <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                                            {profile?.full_name?.split(' ')[0]} {profile?.full_name?.split(' ')[1] || ''}!
                                        </h1>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <Sparkles className="size-3 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[8px] sm:text-[10px] font-black text-yellow-500/80 tracking-widest uppercase italic">STRKL3S UNLOCKED</span>
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
                                            style={{ background: details.color }}
                                        />

                                        <div className="relative size-56 sm:size-64">
                                            {/* Static Hexagon Design */}
                                            <div
                                                className="absolute inset-0 bg-[#0a0a0a] shadow-2xl"
                                                style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                                            />
                                            {/* Inner border glow */}
                                            <div
                                                className="absolute inset-2 opacity-20"
                                                style={{
                                                    background: `linear-gradient(to bottom, ${details.color}, transparent)`,
                                                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                                                }}
                                            />

                                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                                                <span className="text-[9px] font-black tracking-[0.4em] text-cyan-400 uppercase text-center px-4 leading-tight">{details.name}</span>
                                                <span className="text-7xl sm:text-8xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                                    {details.level}
                                                </span>
                                                <span className="text-[9px] font-black tracking-[0.4em] text-white/50 uppercase">DAYS</span>

                                                {/* Cyan Glow Line at bottom */}
                                                <div className="h-1 shadow-[0_0_15px_#22d3ee] w-12 bg-cyan-400 rounded-full mt-2" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Footer Text */}
                                    <div className="px-8 pb-10 text-center">
                                        <p className="text-[10px] sm:text-xs font-bold text-white/40 leading-relaxed uppercase tracking-widest font-sans">
                                            SOLVING CHALLENGES FOR <span className="text-cyan-400">{details.level}+ CONSECUTIVE DAYS</span> IN {new Date().getFullYear()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
