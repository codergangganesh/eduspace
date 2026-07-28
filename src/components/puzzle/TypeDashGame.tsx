import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Delete, Heart, Pause, Play, RotateCcw, Settings, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { mathGameAudio } from "../../lib/mathGameAudio";
import { MathTheme } from "../../lib/mathGameTheme";
import { getRandomWord, getDifficultyInfo, type WordDifficulty } from "../../lib/typeDashWords";

interface TypeDashGameProps {
  themeId: MathTheme["id"];
  onExit: () => void;
  onOpenSettings: () => void;
}

interface ActiveWordDroplet {
  id: string;
  x: number; // horizontal percentage (15 to 85)
  y: number; // vertical pixel coordinate
  word: string;
  speed: number;
  size: number; // pill height
  width: number;
  fontSize: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
}

interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  active: boolean;
}

type GameState = "select" | "playing" | "paused" | "gameover";

const MAX_LIVES = 3;
const MAX_DROPLETS = 4;
const BASE_SPAWN_MS = 2500;
const MIN_SPAWN_MS = 1200;

// Sea heights based on mobile/desktop
const SEA_HEIGHT_DESKTOP = 80;
const SEA_HEIGHT_MOBILE = 250;

export function TypeDashGame({ themeId, onExit, onOpenSettings }: TypeDashGameProps) {
  const [gameState, setGameState] = useState<GameState>("select");
  const [difficulty, setDifficulty] = useState<WordDifficulty>("easy");
  const [droplets, setDroplets] = useState<ActiveWordDroplet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [laser, setLaser] = useState<LaserBeam>({ startX: 0, startY: 0, endX: 0, endY: 0, active: false });
  const [gunAngle, setGunAngle] = useState(0); // in degrees
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const [isShaking, setIsShaking] = useState(false); // Game screen shake effect
  const [muzzleFlash, setMuzzleFlash] = useState(false); // Gun muzzle flash toggle

  // Stats
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [streak, setStreak] = useState(0);

  // Key tracking for active target
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  const [typedLength, setTypedLength] = useState(0);
  const [typoActive, setTypoActive] = useState(false);

  // Layout sizing
  const [isMobile, setIsMobile] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);

  // Audio state values to track keystrokes
  const totalKeysPressedRef = useRef(0);
  const correctKeysPressedRef = useRef(0);
  const startTimeRef = useRef(0);

  // Refs for game loop syncing
  const dropletsRef = useRef<ActiveWordDroplet[]>([]);
  const activeTargetIdRef = useRef<string | null>(null);
  const typedLengthRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const difficultyRef = useRef<WordDifficulty>("easy");
  const stateRef = useRef<GameState>("select");

  const syncDroplets = useCallback((next: ActiveWordDroplet[]) => {
    dropletsRef.current = next;
    setDroplets(next);
  }, []);

  // Set sizing
  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Generate word droplet
  const createDroplet = useCallback((): ActiveWordDroplet => {
    const word = getRandomWord(difficultyRef.current);
    const boardWidth = boardRef.current?.clientWidth || window.innerWidth || 800;
    const mobileSideSafeSpace = isMobile ? Math.min(56, Math.max(34, boardWidth * 0.1)) : 10;
    const pillHeight = isMobile ? 38 : 44;
    const horizontalPadding = isMobile ? 28 : 36;
    const maxPillWidth = isMobile ? Math.max(112, boardWidth - mobileSideSafeSpace * 2) : Number.POSITIVE_INFINITY;
    const maxFontSize = isMobile ? 13 : 15;
    const minFontSize = isMobile ? 10 : 15;
    const estimatedTextFactor = 0.66;
    const fittedFontSize = Math.max(
      minFontSize,
      Math.min(maxFontSize, (maxPillWidth - horizontalPadding - 8) / (word.length * estimatedTextFactor))
    );
    const pillWidth = Math.min(
      maxPillWidth,
      Math.ceil(word.length * fittedFontSize * estimatedTextFactor + horizontalPadding + 8)
    );
    const edgePaddingPercent = Math.min(
      46,
      Math.max(isMobile ? 18 : 8, ((pillWidth / 2 + mobileSideSafeSpace) / boardWidth) * 100)
    );
    const usedX = dropletsRef.current.map((d) => d.x);
    const minX = Math.max(isMobile ? 18 : 12, edgePaddingPercent);
    const maxX = Math.min(isMobile ? 82 : 88, 100 - edgePaddingPercent);
    let x = minX + Math.random() * (maxX - minX);

    // Avoid spawn overlaps
    for (let attempt = 0; attempt < 15; attempt++) {
      if (!usedX.some((val) => Math.abs(val - x) < 18)) break;
      x = minX + Math.random() * (maxX - minX);
    }

    const speedBoost = Math.min(scoreRef.current / 300, 1.8);
    const baseSpeed = difficultyRef.current === "easy" ? 0.65
      : difficultyRef.current === "medium" ? 0.85
        : difficultyRef.current === "hard" ? 1.05
          : 1.25;

    return {
      id: `word-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x,
      y: 120, // starts below headers
      word,
      speed: baseSpeed + speedBoost + Math.random() * 0.2,
      size: pillHeight,
      width: pillWidth,
      fontSize: fittedFontSize,
    };
  }, [isMobile]);

  const spawnDroplet = useCallback(() => {
    if (dropletsRef.current.length >= MAX_DROPLETS) return;
    syncDroplets([...dropletsRef.current, createDroplet()]);
  }, [createDroplet, syncDroplets]);

  // Start game
  const startGame = useCallback((nextDifficulty: WordDifficulty) => {
    setDifficulty(nextDifficulty);
    difficultyRef.current = nextDifficulty;
    setScore(0);
    scoreRef.current = 0;
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    setWpm(0);
    setAccuracy(100);
    setStreak(0);
    streakRef.current = 0;

    totalKeysPressedRef.current = 0;
    correctKeysPressedRef.current = 0;
    startTimeRef.current = Date.now();

    setActiveTargetId(null);
    activeTargetIdRef.current = null;
    setTypedLength(0);
    typedLengthRef.current = 0;
    setTypoActive(false);

    syncDroplets([]);
    setParticles([]);
    setLaser({ startX: 0, startY: 0, endX: 0, endY: 0, active: false });

    lastFrameRef.current = null;
    lastSpawnRef.current = 0;
    setGameState("playing");
    stateRef.current = "playing";
  }, [syncDroplets]);

  // End game
  const endGame = useCallback(() => {
    setGameState("gameover");
    stateRef.current = "gameover";
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const key = `eduspace_type_dash_highscore_${difficultyRef.current}`;
    const previous = Number.parseInt(localStorage.getItem(key) || "0", 10);
    if (scoreRef.current > previous) {
      localStorage.setItem(key, String(scoreRef.current));
    }
  }, []);

  // Lose life helper
  const loseLife = useCallback(() => {
    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);

    setStreak(0);
    streakRef.current = 0;

    // reset current typing lock if lost life
    setActiveTargetId(null);
    activeTargetIdRef.current = null;
    setTypedLength(0);
    typedLengthRef.current = 0;
    setTypoActive(false);

    setFlash("bad");
    window.setTimeout(() => setFlash(null), 180);

    // Trigger screen shake on damage
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 250);

    mathGameAudio.playLifeLost();

    if (nextLives <= 0) {
      mathGameAudio.playGameOver();
      endGame();
    }
  }, [endGame]);

  // Laser aiming calculations
  const aimLaserTurret = useCallback((targetDroplet: ActiveWordDroplet, boardWidth: number, boardHeight: number, seaHeight: number) => {
    const gunX = boardWidth / 2;
    const gunY = boardHeight - seaHeight - 20;

    const dropletX = (targetDroplet.x / 100) * boardWidth;
    const dropletY = targetDroplet.y + targetDroplet.size / 2;

    const dx = dropletX - gunX;
    const dy = dropletY - gunY;

    // Angle of gun turret: 0 deg is right, -90 is up
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI) + 90; // Adjust so 0 deg is straight up

    setGunAngle(angleDeg);
  }, []);

  // Process key stroke entry
  const processKeyStroke = useCallback((char: string) => {
    if (stateRef.current !== "playing") return;

    const key = char.toLowerCase();
    if (!/^[a-z]$/.test(key)) return; // Only process alphabetical keys

    totalKeysPressedRef.current += 1;

    const boardWidth = boardRef.current?.clientWidth || 800;
    const boardHeight = boardRef.current?.clientHeight || 600;
    const seaHeight = isMobile ? SEA_HEIGHT_MOBILE : SEA_HEIGHT_DESKTOP;

    // Case 1: No active target selected
    if (activeTargetIdRef.current === null) {
      // Find matching droplets
      const matches = dropletsRef.current
        .filter((d) => d.word.toLowerCase().startsWith(key))
        // Sort by lowest Y value (closest to the sea level) to prioritize threat
        .sort((a, b) => b.y - a.y);

      if (matches.length > 0) {
        const target = matches[0];
        setActiveTargetId(target.id);
        activeTargetIdRef.current = target.id;
        setTypedLength(1);
        typedLengthRef.current = 1;
        setTypoActive(false);
        correctKeysPressedRef.current += 1;
        mathGameAudio.playKeyClick();

        // Aim the gun turret towards target
        aimLaserTurret(target, boardWidth, boardHeight, seaHeight);
      } else {
        // No match at all
        setFlash("bad");
        window.setTimeout(() => setFlash(null), 120);
        mathGameAudio.playError();
      }
    }
    // Case 2: Target is active, match next key
    else {
      const target = dropletsRef.current.find((d) => d.id === activeTargetIdRef.current);
      if (!target) {
        // Safe reset if target is gone
        setActiveTargetId(null);
        activeTargetIdRef.current = null;
        setTypedLength(0);
        typedLengthRef.current = 0;
        return;
      }

      // Re-aim turret as target moves
      aimLaserTurret(target, boardWidth, boardHeight, seaHeight);

      const targetWord = target.word.toLowerCase();
      const nextChar = targetWord[typedLengthRef.current];

      if (key === nextChar) {
        // Correct character typed
        const nextLength = typedLengthRef.current + 1;
        setTypedLength(nextLength);
        typedLengthRef.current = nextLength;
        setTypoActive(false);
        correctKeysPressedRef.current += 1;

        // Check if fully typed
        if (nextLength === targetWord.length) {
          // Trigger Laser and Explosion
          const gunX = boardWidth / 2;
          const gunY = boardHeight - seaHeight - 20;
          const targetPxX = (target.x / 100) * boardWidth;
          const targetPxY = target.y + target.size / 2;

          setLaser({
            startX: gunX,
            startY: gunY - 30, // shoot from nozzle tip
            endX: targetPxX,
            endY: targetPxY,
            active: true
          });

          // Muzzle flare animation
          setMuzzleFlash(true);
          window.setTimeout(() => setMuzzleFlash(false), 120);

          // Screen shake on firing/explosion
          setIsShaking(true);
          window.setTimeout(() => setIsShaking(false), 180);

          // Procedural sound effects
          mathGameAudio.playLaserShot();
          mathGameAudio.playExplosion();

          // Particle blast spark list
          const newParticles: Particle[] = Array.from({ length: 18 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 3;
            return {
              id: `p-${Date.now()}-${i}-${Math.random()}`,
              x: targetPxX,
              y: targetPxY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 1, // slight upward float
              color: i % 2 === 0
                ? (themeId === "retro" ? "#10B981" : themeId === "sunset" ? "#F97316" : themeId === "nordic" ? "#38bdf8" : "#a855f7")
                : "#ffffff", // white spark highlights
              size: Math.random() * 5 + 3,
              opacity: 1
            };
          });

          setParticles((prev) => [...prev, ...newParticles]);

          // Remove target droplet
          const nextDroplets = dropletsRef.current.filter((d) => d.id !== target.id);
          syncDroplets(nextDroplets);

          // Scoring
          const nextStreak = streakRef.current + 1;
          const multiplier = nextStreak >= 10 ? 3 : nextStreak >= 5 ? 2 : 1;
          const scoreGain = 10 * multiplier;
          scoreRef.current += scoreGain;
          setScore(scoreRef.current);
          streakRef.current = nextStreak;
          setStreak(nextStreak);

          // Reset target
          setActiveTargetId(null);
          activeTargetIdRef.current = null;
          setTypedLength(0);
          typedLengthRef.current = 0;

          // Clear laser beam after short blast duration
          window.setTimeout(() => {
            setLaser((prev) => ({ ...prev, active: false }));
          }, 140);

          setFlash("good");
          window.setTimeout(() => setFlash(null), 150);

          if (nextDroplets.length === 0) {
            window.setTimeout(spawnDroplet, 150);
          }
        } else {
          // Play standard letter feedback sound
          mathGameAudio.playKeyClick();
        }
      } else {
        // Typo made - check if key matches the first letter of another active word to switch targets
        const otherMatches = dropletsRef.current
          .filter((d) => d.id !== target.id && d.word.toLowerCase().startsWith(key))
          .sort((a, b) => b.y - a.y); // prioritize closest to sea level

        if (otherMatches.length > 0) {
          const newTarget = otherMatches[0];
          setActiveTargetId(newTarget.id);
          activeTargetIdRef.current = newTarget.id;
          setTypedLength(1);
          typedLengthRef.current = 1;
          setTypoActive(false);
          correctKeysPressedRef.current += 1;
          mathGameAudio.playKeyClick();
          aimLaserTurret(newTarget, boardWidth, boardHeight, seaHeight);
        } else {
          setTypoActive(true);
          mathGameAudio.playError();
        }
      }
    }

    // Live stats update
    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
    const computedWpm = Math.round((correctKeysPressedRef.current / 5) / Math.max(0.1, elapsedMinutes));
    setWpm(computedWpm);

    const computedAccuracy = Math.round((correctKeysPressedRef.current / Math.max(1, totalKeysPressedRef.current)) * 100);
    setAccuracy(computedAccuracy);

  }, [aimLaserTurret, spawnDroplet, syncDroplets, themeId, isMobile]);

  // Handle keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      if (e.key === "Escape" || e.key === " ") return;
      processKeyStroke(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, processKeyStroke]);

  // Main game loop (droplet fall, particles movement, spawner trigger)
  const gameLoop = useCallback((timestamp: number) => {
    if (stateRef.current !== "playing") return;

    const previousFrame = lastFrameRef.current ?? timestamp;
    const delta = Math.min(timestamp - previousFrame, 45); // cap lag frames
    lastFrameRef.current = timestamp;

    const boardWidth = boardRef.current?.clientWidth || 800;
    const boardHeight = boardRef.current?.clientHeight || 640;
    const seaHeight = isMobile ? SEA_HEIGHT_MOBILE : SEA_HEIGHT_DESKTOP;
    const groundY = boardHeight - seaHeight - 30;

    let missedCount = 0;

    // 1. Move droplets
    const nextDroplets = dropletsRef.current
      .map((d) => ({
        ...d,
        y: d.y + d.speed * (delta / 16.67),
      }))
      .filter((d) => {
        const missed = d.y > groundY;
        if (missed) {
          missedCount += 1;
          // If the active target hits the sea, reset typing
          if (activeTargetIdRef.current === d.id) {
            activeTargetIdRef.current = null;
          }
        }
        return !missed;
      });

    // Handle target loss
    if (activeTargetIdRef.current === null && activeTargetId !== null) {
      setActiveTargetId(null);
      setTypedLength(0);
      typedLengthRef.current = 0;
    }

    if (missedCount > 0) {
      syncDroplets(nextDroplets);
      loseLife();
      if (stateRef.current !== "playing") return;
    } else {
      syncDroplets(nextDroplets);
    }

    // 2. Move particles
    setParticles((prev) =>
      prev
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.18, // gravity force
          opacity: p.opacity - 0.04,
        }))
        .filter((p) => p.opacity > 0)
    );

    // 3. Aim laser turret continuously at current target
    if (activeTargetIdRef.current !== null) {
      const activeD = dropletsRef.current.find((d) => d.id === activeTargetIdRef.current);
      if (activeD) {
        aimLaserTurret(activeD, boardWidth, boardHeight, seaHeight);
      }
    } else {
      // Return turret to neutral vertical position (0 degrees)
      setGunAngle((prev) => prev * 0.82);
    }

    // 4. Spawner trigger
    const spawnInterval = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - scoreRef.current * 3);
    if (
      timestamp - lastSpawnRef.current >= spawnInterval &&
      dropletsRef.current.length < MAX_DROPLETS
    ) {
      lastSpawnRef.current = timestamp;
      spawnDroplet();
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isMobile, loseLife, spawnDroplet, syncDroplets, aimLaserTurret, activeTargetId]);

  // Mount/Unmount loops
  useEffect(() => {
    if (gameState !== "playing") return;

    stateRef.current = "playing";
    lastFrameRef.current = null;
    if (dropletsRef.current.length === 0) {
      syncDroplets([createDroplet()]);
      lastSpawnRef.current = performance.now();
    }

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [createDroplet, gameLoop, gameState, syncDroplets]);

  // Game control handlers
  const pauseGame = () => {
    if (gameState !== "playing") return;
    setGameState("paused");
    stateRef.current = "paused";
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const resumeGame = () => {
    if (gameState !== "paused") return;
    setGameState("playing");
    stateRef.current = "playing";
  };

  const exitToSelect = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    syncDroplets([]);
    setParticles([]);
    setLaser({ startX: 0, startY: 0, endX: 0, endY: 0, active: false });
    setGameState("select");
    stateRef.current = "select";
  };

  // Keyboard Layout for Mobile
  const MOBILE_KEYBOARD = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m", "clear"]
  ];

  if (gameState === "select") {
    const difficulties: WordDifficulty[] = ["easy", "medium", "hard", "extreme"];

    return (
      <div className="flex h-full min-h-[560px] w-full items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden">
        {/* Neon cosmic background effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Custom scroll star CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .stars-bg {
            background-image: 
              radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)),
              radial-gradient(2px 2px at 150px 100px, #a855f7, rgba(0,0,0,0)),
              radial-gradient(3px 3px at 80px 220px, #60a5fa, rgba(0,0,0,0));
            background-size: 300px 300px;
            animation: scrollStars 60s linear infinite;
          }
          @keyframes scrollStars {
            from { background-position: 0 0; }
            to { background-position: 300px 600px; }
          }
        `}} />
        <div className="absolute inset-0 stars-bg opacity-40 pointer-events-none" />

        {/* Back and Settings buttons */}
        <div className="absolute inset-x-0 top-0 z-40 px-5 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="rounded-full bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Exit to Dashboard"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="rounded-full bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900/95 backdrop-blur-md">
            <CardContent className="space-y-6 p-8">
              <div className="text-center space-y-2">
                <div className="mx-auto mb-1 flex size-14 items-center justify-center rounded-3xl bg-indigo-950/40 text-indigo-400 shadow-lg border border-indigo-900/30">
                  <Zap className="size-8 fill-indigo-400/20" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">Type Dash</h2>
                <p className="text-indigo-300 font-bold text-xs max-w-xs mx-auto">
                  Aim your laser blaster and blast the falling words before they splash the ocean!
                </p>
              </div>

              <div className="space-y-3">
                {difficulties.map((item) => {
                  const info = getDifficultyInfo(item);
                  const themes = {
                    easy: "hover:border-emerald-500/50 hover:bg-emerald-950/20 border-slate-800 text-emerald-400",
                    medium: "hover:border-indigo-500/50 hover:bg-indigo-950/20 border-slate-800 text-indigo-400",
                    hard: "hover:border-orange-500/50 hover:bg-orange-950/20 border-slate-800 text-orange-400",
                    extreme: "hover:border-rose-500/50 hover:bg-rose-950/20 border-slate-800 text-rose-400"
                  };
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => startGame(item)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group bg-slate-950/65 ${themes[item]}`}
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-white transition-colors">
                          {info.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {info.description}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-slate-900">
                        {item.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }



  return (
    <div
      ref={boardRef}
      className={`relative h-full min-h-[560px] w-full overflow-hidden bg-slate-950 select-none transition-all duration-150 ${isShaking ? "animate-shake" : ""
        } ${flash === "good" ? "ring-4 ring-emerald-500/40" : flash === "bad" ? "ring-4 ring-rose-500/40" : ""
        }`}
    >
      {/* ─── Scrolling animated Starfield background + Parallax Nebulae ─── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .space-stars {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 70px 140px, #60a5fa, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 150px 60px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 220px 210px, #a855f7, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 250px 250px;
          animation: spaceScroll 28s linear infinite;
          opacity: 0.4;
          pointer-events: none;
        }
        .space-stars-layer2 {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(2.5px 2.5px at 40px 80px, #ffffff, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 180px 180px, #a855f7, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 120px 290px, #38bdf8, rgba(0,0,0,0));
          background-repeat: repeat;
          background-size: 320px 320px;
          animation: spaceScroll 14s linear infinite;
          opacity: 0.55;
          pointer-events: none;
        }
        .space-nebula {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 15% 25%, rgba(99, 102, 241, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(236, 72, 153, 0.1) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 55%);
          animation: nebulaPulse 20s ease-in-out infinite alternate;
          pointer-events: none;
        }
        @keyframes spaceScroll {
          from { background-position: 0 0; }
          to { background-position: 0 500px; }
        }
        @keyframes nebulaPulse {
          0% { opacity: 0.7; transform: scale(1.0); }
          100% { opacity: 1; transform: scale(1.08) translate(10px, -10px); }
        }
        .planet-orbit1 {
          animation: floatPlanet1 14s ease-in-out infinite alternate;
        }
        .planet-orbit2 {
          animation: floatPlanet2 18s ease-in-out infinite alternate;
        }
        @keyframes floatPlanet1 {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(20px) rotate(15deg); }
        }
        @keyframes floatPlanet2 {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-25px) rotate(-10deg); }
        }
        /* Screen shake keyframes */
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-3px, 3px) rotate(-0.5deg); }
          30% { transform: translate(3px, -3px) rotate(0.5deg); }
          45% { transform: translate(-3px, -1px) rotate(0deg); }
          60% { transform: translate(3px, 2px) rotate(0.5deg); }
          75% { transform: translate(-1px, 3px) rotate(-0.5deg); }
          90% { transform: translate(2px, -1px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.22s ease-in-out;
        }
        /* Muzzle flash glow */
        @keyframes flashAnim {
          0% { transform: scale(0.2); opacity: 0; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0.4); opacity: 0; }
        }
        .muzzle-glow {
          animation: flashAnim 0.12s ease-out forwards;
        }
        /* Double water wave animation at bottom */
        @keyframes waveMove1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes waveMove2 {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}} />

      <div className="space-stars" />
      <div className="space-stars-layer2" />
      <div className="space-nebula" />

      {/* Floating cartoon planet decoration */}
      <div className="planet-orbit1 absolute top-28 left-[8%] size-16 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-500 opacity-20 filter blur-[1px] border border-pink-400/20 shadow-lg pointer-events-none" />
      <div className="planet-orbit2 absolute top-40 right-[10%] size-20 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 opacity-20 filter blur-[1px] border border-cyan-400/20 shadow-lg pointer-events-none" />

      {/* Sleek transparent game header */}
      <div className="absolute inset-x-0 top-0 z-40 px-5 py-4 flex items-center justify-between">
        {/* Left: Back Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="rounded-full bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
          title="Exit to Dashboard"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* Center: Lives */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2 flex items-center gap-1.5 shadow-lg">
          {Array.from({ length: MAX_LIVES }).map((_, index) => (
            <Heart
              key={index}
              className={`size-5 sm:size-6 transition-all duration-300 ${index < lives ? "fill-rose-500 text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]" : "text-slate-800 scale-95"
                }`}
            />
          ))}
        </div>

        {/* Right Side: Score, WPM, and Settings */}
        <div className="flex items-center gap-2">
          {/* Streak pill */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-3 py-1.5 text-xs font-black shadow-md flex items-center gap-1"
            >
              <span>🔥 {streak}</span>
            </motion.div>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-slate-200 shadow-lg flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Score:</span>
              <span className="text-indigo-400 font-extrabold">{score}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-4">
              <span className="text-slate-500">WPM:</span>
              <span className="text-cyan-400 font-extrabold">{wpm}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-4">
              <span className="text-slate-500">ACC:</span>
              <span className="text-emerald-400 font-extrabold">{accuracy}%</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="rounded-full bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Settings"
          >
            <Settings className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={gameState === "paused" ? resumeGame : pauseGame}
            className="rounded-full bg-slate-900/90 text-slate-200 border border-slate-800 shadow-md hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title={gameState === "paused" ? "Resume game" : "Pause game"}
          >
            {gameState === "paused" ? <Play className="size-5" /> : <Pause className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Floating mini stats for mobile */}
      {isMobile && (
        <div className="absolute left-5 top-20 z-40 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col gap-1 text-[10px] font-black text-slate-350 shadow-md">
          <div>WPM: <span className="text-cyan-400">{wpm}</span></div>
          <div>ACCURACY: <span className="text-emerald-400">{accuracy}%</span></div>
        </div>
      )}

      {/* Desktop typing focus visualizer */}
      {!isMobile && (
        <div className="absolute inset-x-0 top-24 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className={`h-12 px-6 rounded-2xl border bg-slate-900/95 backdrop-blur text-white flex items-center justify-center text-sm font-black shadow-lg transition-all duration-350 ${activeTargetId ? "border-cyan-500/50 shadow-cyan-900/15" : "border-slate-800/70"
              }`}>
              {activeTargetId ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 uppercase tracking-widest mr-1.5">Targeting:</span>
                  {(() => {
                    const target = droplets.find((d) => d.id === activeTargetId);
                    if (!target) return null;
                    const typed = target.word.substring(0, typedLength);
                    const untyped = target.word.substring(typedLength);
                    return (
                      <span className="text-lg">
                        <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)] font-extrabold">{typed}</span>
                        <span className="text-cyan-400 font-normal animate-pulse">|</span>
                        <span className={typoActive ? "text-rose-500 underline decoration-rose-500 font-extrabold" : "text-white"}>{untyped}</span>
                      </span>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-slate-400">Type any letter to lock target...</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pause button is now in the header next to settings */}

      {/* ─── Particles Explosion Layer ─── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none z-40"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}

      {/* ─── Laser Beam Layer (SVG overlays) ─── */}
      {laser.active && (
        <svg className="absolute inset-0 size-full pointer-events-none z-30">
          <defs>
            <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Laser aura */}
          <line
            x1={laser.startX}
            y1={laser.startY}
            x2={laser.endX}
            y2={laser.endY}
            stroke={themeId === "retro" ? "#059669" : themeId === "sunset" ? "#ea580c" : themeId === "nordic" ? "#2563eb" : "#7c3aed"}
            strokeWidth="8"
            opacity="0.5"
            strokeLinecap="round"
            filter="url(#laserGlow)"
          />
          {/* Laser core line */}
          <line
            x1={laser.startX}
            y1={laser.startY}
            x2={laser.endX}
            y2={laser.endY}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Cyan inner flare */}
          <line
            x1={laser.startX}
            y1={laser.startY}
            x2={laser.endX}
            y2={laser.endY}
            stroke="#22d3ee"
            strokeWidth="5"
            opacity="0.8"
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* ─── Word Droplet Bubbles ─── */}
      <AnimatePresence>
        {droplets.map((d) => {
          const isActive = activeTargetId === d.id;
          const typed = d.word.substring(0, typedLength);
          const untyped = d.word.substring(typedLength);
          const mobileCenterInset = Math.ceil(d.width / 2 + 12);

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute z-25 -translate-x-1/2 pointer-events-none"
              style={{
                left: isMobile
                  ? `clamp(${mobileCenterInset}px, ${d.x}%, calc(100% - ${mobileCenterInset}px))`
                  : `${d.x}%`,
                top: d.y,
                width: d.width,
                height: d.size,
              }}
            >
              {/* Target outline when bubble is active */}
              {isActive && (
                <div className="absolute -inset-1.5 rounded-full border border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.35)] pointer-events-none z-10" />
              )}

              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full border text-center shadow-[0_6px_18px_rgba(0,0,0,0.38)] backdrop-blur-sm ${isActive
                  ? "border-cyan-300/80 bg-cyan-950/80"
                  : "border-indigo-300/35 bg-indigo-950/75"
                  } ${isMobile ? "px-3.5" : "px-4"}`}
              >
                <div className="pointer-events-none absolute inset-x-3 top-1 h-2 rounded-full bg-white/15" />
                <span
                  className="relative z-10 block max-w-full whitespace-nowrap font-sans font-semibold leading-none tracking-normal text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
                  style={{ fontSize: d.fontSize }}
                >
                  {isActive ? (
                    <>
                      <span className="text-emerald-400 font-semibold drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]">
                        {typed}
                      </span>
                      <span className="text-cyan-400 font-normal animate-pulse">|</span>
                      <span className={typoActive ? "text-rose-500 underline decoration-rose-500 font-semibold" : "text-white"}>
                        {untyped}
                      </span>
                    </>
                  ) : (
                    d.word
                  )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ─── Animated Dual-Layer Water Wave Sea ─── */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-20 overflow-hidden pointer-events-none">
        {/* Back wave layer */}
        <svg className="absolute bottom-0 w-[200%] h-20 translate-y-3 fill-indigo-950/80" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ animation: 'waveMove1 14s linear infinite' }}>
          <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1350,30 1500,60 L1500,120 L0,120 Z" />
        </svg>
        {/* Front wave layer */}
        <svg className="absolute bottom-0 w-[200%] h-20 translate-y-1.5 fill-cyan-950/60 border-t border-cyan-500/10" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ animation: 'waveMove2 9s linear infinite' }}>
          <path d="M0,50 C200,20 400,80 600,50 C800,20 1000,80 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* ─── Sea Level & SVG Laser Blaster Gun ─── */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-indigo-950/95 to-slate-900/80 backdrop-blur-[2px] border-t border-slate-800 ${isMobile ? "h-[250px] px-2.5 pb-3.5 pt-4" : "h-20"
          }`}
      >
        {/* SVG Laser Gun Blaster Turret */}
        <div
          className="absolute left-1/2 bottom-full translate-y-2 -translate-x-1/2 pointer-events-none"
          style={{ width: "100px", height: "100px" }}
        >
          <svg viewBox="0 0 100 100" className="size-full">
            {/* Blaster Base Ring Dome */}
            <circle cx="50" cy="80" r="18" fill="#1e1b4b" stroke="#312e81" strokeWidth="3" />
            <path d="M 32 80 A 18 18 0 0 1 68 80 Z" fill="#0f172a" stroke="#4f46e5" strokeWidth="1.5" />
            {/* Energy level pulsing core */}
            <circle cx="50" cy="80" r="6" fill="#22d3ee" className="animate-pulse" />

            {/* Rotating Blaster Gun Turret */}
            <g
              transform={`rotate(${gunAngle}, 50, 80)`}
              className="transition-transform duration-75"
              style={{ transformOrigin: "50px 80px" }}
            >
              {/* Detailed metallic side boosters */}
              <path d="M 31 74 L 31 56 L 40 68 Z" fill="#4f46e5" stroke="#312e81" strokeWidth="1.5" />
              <path d="M 69 74 L 69 56 L 60 68 Z" fill="#4f46e5" stroke="#312e81" strokeWidth="1.5" />
              <rect x="33" y="58" width="4" height="12" fill="#22d3ee" opacity="0.7" />
              <rect x="63" y="58" width="4" height="12" fill="#22d3ee" opacity="0.7" />

              {/* Gun Barrel Cannon */}
              <rect x="44" y="28" width="12" height="40" rx="3.5" fill="#1e293b" stroke="#6366f1" strokeWidth="2.5" />
              <rect x="46" y="32" width="8" height="32" fill="#0f172a" />

              {/* Neon power coils wrapping around cannon */}
              <line x1="45" y1="36" x2="55" y2="36" stroke="#22d3ee" strokeWidth="2.5" />
              <line x1="45" y1="46" x2="55" y2="46" stroke="#22d3ee" strokeWidth="2.5" />
              <line x1="45" y1="56" x2="55" y2="56" stroke="#22d3ee" strokeWidth="2.5" />

              {/* Laser Nozzle Core Cap */}
              <rect x="42" y="20" width="16" height="8" rx="2.5" fill="#312e81" stroke="#22d3ee" strokeWidth="1.5" />
              <ellipse cx="50" cy="20" rx="6" ry="2" fill="#ffffff" />
            </g>
          </svg>

          {/* Laser firing muzzle flash animation particle */}
          {muzzleFlash && (
            <div
              className="absolute left-1/2 -top-1 size-10 rounded-full bg-cyan-400 filter blur-xs -translate-x-1/2 -translate-y-1/2 muzzle-glow pointer-events-none z-30"
              style={{
                boxShadow: "0 0 25px #22d3ee, 0 0 50px #818cf8",
              }}
            />
          )}
        </div>

        {/* Mobile virtual keyboard layout view */}
        {isMobile && (
          <div className="mx-auto flex flex-col gap-2 max-w-md pointer-events-auto">
            {/* Target Display */}
            <div className="w-full px-1 animate-in fade-in">
              <div className={`h-9 w-full rounded-xl bg-slate-900/90 border flex items-center justify-center text-xs font-black shadow-inner tracking-wide transition-all ${activeTargetId ? "border-cyan-500/40 text-cyan-300" : "border-slate-800 text-slate-500"
                }`}>
                {activeTargetId ? (
                  (() => {
                    const target = droplets.find((d) => d.id === activeTargetId);
                    if (!target) return null;
                    const typed = target.word.substring(0, typedLength);
                    const untyped = target.word.substring(typedLength);
                    return (
                      <span>
                        <span className="text-emerald-400 font-extrabold">{typed}</span>
                        <span className="text-cyan-400 font-normal">|</span>
                        <span className={typoActive ? "text-rose-555 underline decoration-rose-555 font-extrabold" : ""}>{untyped}</span>
                      </span>
                    );
                  })()
                ) : (
                  <span>No Target Locked</span>
                )}
              </div>
            </div>

            {MOBILE_KEYBOARD.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1.5 w-full">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => {
                      if (char === "clear") {
                        setActiveTargetId(null);
                        activeTargetIdRef.current = null;
                        setTypedLength(0);
                        typedLengthRef.current = 0;
                        setTypoActive(false);
                      } else {
                        processKeyStroke(char);
                      }
                    }}
                    className={`h-11 flex items-center justify-center rounded-xl active:scale-95 transition text-sm font-black shadow-md ${char === "clear"
                      ? "flex-2 max-w-[80px] px-3.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-250 active:bg-rose-900"
                      : "flex-1 max-w-[40px] bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-white"
                      }`}
                  >
                    {char === "clear" ? "CLR" : char.toUpperCase()}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* ─── Pause Overlay Modal ─── */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs"
          >
            <Card className="border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900">
              <CardContent className="space-y-6 p-8 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-indigo-950/40 text-indigo-400 border border-indigo-900/20">
                  <Pause className="size-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">Game Paused</h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Take a breath! Click below to resume your challenge.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 border-none shadow-md shadow-indigo-600/20"
                    onClick={resumeGame}
                  >
                    <Play className="mr-2 size-4 fill-current" />
                    Resume Game
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-6 font-bold border-slate-800 text-slate-400 hover:text-white bg-transparent hover:bg-slate-800/40"
                    onClick={exitToSelect}
                  >
                    Exit to Difficulty Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ─── Game Over Overlay Modal (Arcade-Style Board) ─── */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1.5px] p-4 animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[340px]"
          >
            {/* The Wooden Board */}
            <div
              className="p-6 pb-8 flex flex-col items-center text-center shadow-[0_12px_30px_rgba(0,0,0,0.7)] select-none relative overflow-hidden"
              style={{
                backgroundColor: "#E5C39E",
                border: "8px solid #B45B25",
                borderRadius: "36px",
              }}
            >
              {/* Confetti / Decorative Shapes around Title */}
              <div className="relative w-full py-4 flex justify-center">
                {/* Floating neon shapes */}
                <span className="absolute -top-3 left-4 text-cyan-400 text-lg animate-bounce" style={{ animationDelay: '0.1s' }}>★</span>
                <span className="absolute top-4 left-0 text-pink-500 text-xs rotate-12">◆</span>
                <span className="absolute -top-1 right-3 text-amber-400 text-sm animate-pulse">★</span>
                <span className="absolute top-5 right-0 text-emerald-400 text-sm rotate-45">●</span>
                <span className="absolute -bottom-3 left-8 text-pink-500 text-sm">●</span>
                <span className="absolute -bottom-2 right-8 text-cyan-400 text-lg">★</span>

                {/* Glitch styled Game Over Title */}
                <h2
                  className="text-5xl font-black tracking-tighter text-black leading-none text-center"
                  style={{
                    fontFamily: "Impact, 'Arial Black', sans-serif",
                    textShadow: "3px 3px 0px #00ffff, -3px -3px 0px #ff00ff",
                  }}
                >
                  GAME<br />OVER
                </h2>
              </div>

              {/* LCD Monospaced Score */}
              <div className="mt-4 mb-6 text-center">
                <span
                  className="text-2xl font-bold tracking-widest text-black"
                  style={{ fontFamily: "'Courier New', Courier, monospace" }}
                >
                  SCORE: {score}
                </span>
                <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider mt-1.5">
                  WPM: {wpm} • ACCURACY: {accuracy}%
                </div>
              </div>

              {/* Action buttons (HOME and RETRY side by side) */}
              <div className="flex gap-4 w-full justify-center">
                {/* HOME Button (Blue with yellow border) */}
                <button
                  onClick={onExit}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 text-black border-4 border-yellow-400 px-4 py-3 rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all font-black italic text-xs tracking-wider cursor-pointer"
                >
                  <svg className="size-4 fill-current stroke-current" viewBox="0 0 24 24">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  HOME
                </button>

                {/* RETRY Button (Yellow/Orange with red border) */}
                <button
                  onClick={() => startGame(difficulty)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 text-emerald-800 border-4 border-orange-600 px-4 py-3 rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all font-black italic text-xs tracking-wider cursor-pointer"
                >
                  <svg className="size-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
                  </svg>
                  RETRY
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
