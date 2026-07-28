import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Delete, Droplets, Heart, Pause, Play, RotateCcw, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { mathGameAudio } from "../../lib/mathGameAudio";
import { MathTheme } from "../../lib/mathGameTheme";
import {
  generateQuestion,
  getDifficultyInfo,
  type DropletDifficulty,
} from "../../lib/dropletDashQuestion";

interface DropletDashGameProps {
  themeId: MathTheme["id"];
  onExit: () => void;
  onOpenSettings: () => void;
}

interface ActiveDroplet {
  id: string;
  x: number;
  y: number;
  expression: string;
  answer: number;
  speed: number;
  size: number;
}

type GameState = "select" | "playing" | "paused" | "gameover";

const getDropletGradientColors = (themeId: MathTheme["id"]) => {
  switch (themeId) {
    case "retro":
      return { start: "#34D399", end: "#059669" };
    case "sunset":
      return { start: "#FDBA74", end: "#DC2626" };
    case "nordic":
      return { start: "#7DD3FC", end: "#4F46E5" };
    case "cyber":
    default:
      return { start: "#38BDF8", end: "#0284C7" };
  }
};

const getThemeTextColor = (themeId: MathTheme['id']) => {
  switch (themeId) {
    case 'retro':
      return 'text-emerald-500 dark:text-emerald-400';
    case 'sunset':
      return 'text-orange-600 dark:text-orange-400';
    case 'nordic':
      return 'text-sky-500 dark:text-sky-400';
    case 'cyber':
    default:
      return 'text-blue-500 dark:text-blue-400';
  }
};

const getThemeFocusRing = (themeId: MathTheme['id']) => {
  switch (themeId) {
    case 'retro':
      return 'focus:ring-emerald-500';
    case 'sunset':
      return 'focus:ring-orange-500';
    case 'nordic':
      return 'focus:ring-sky-500';
    case 'cyber':
    default:
      return 'focus:ring-blue-500';
  }
};

const MAX_LIVES = 3;
const MAX_DROPLETS = 4;
const DESKTOP_START_Y = 154;
const MOBILE_START_Y = 126;
const BASE_SPAWN_MS = 2300;
const MIN_SPAWN_MS = 1100;
const SEA_HEIGHT_DESKTOP = 80;
const SEA_HEIGHT_MOBILE = 240;

function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 64"
      aria-hidden="true"
      className={`pointer-events-none h-16 w-32 select-none fill-white/80 drop-shadow-sm ${className}`}
    >
      <path d="M23 45.5C13.6 45.5 6 38.5 6 29.8 6 21.2 13.6 14.2 23 14.2c2.6 0 5.1.5 7.3 1.5C35.4 6.5 45.6 1 56.8 1c13.2 0 24.5 7.7 28.6 18.6 2.7-1.4 5.8-2.2 9.1-2.2 10.8 0 19.5 8 19.5 17.9s-8.7 17.9-19.5 17.9H23Z" />
    </svg>
  );
}

function DifficultyButton({
  difficulty,
  onClick,
}: {
  difficulty: DropletDifficulty;
  onClick: () => void;
}) {
  const info = getDifficultyInfo(difficulty);

  const themes = {
    easy: {
      border: "hover:border-emerald-550 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10",
      text: "group-hover:text-emerald-500",
      badge: "bg-emerald-100/30 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
      tag: "Warm-up"
    },
    medium: {
      border: "hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10",
      text: "group-hover:text-indigo-550",
      badge: "bg-indigo-100/30 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-450",
      tag: "Standard"
    },
    hard: {
      border: "hover:border-orange-500/50 hover:bg-orange-50/20 dark:hover:bg-orange-950/10",
      text: "group-hover:text-orange-550",
      badge: "bg-orange-100/30 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
      tag: "Advanced"
    },
    extreme: {
      border: "hover:border-rose-500/50 hover:bg-rose-50/20 dark:hover:bg-rose-950/10",
      text: "group-hover:text-rose-550",
      badge: "bg-rose-100/30 dark:bg-rose-950/30 text-rose-650 dark:text-rose-450",
      tag: "Expert"
    }
  };

  const theme = themes[difficulty];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border border-slate-150 dark:border-slate-800 transition-all flex items-center justify-between group bg-white dark:bg-slate-900 ${theme.border}`}
    >
      <div>
        <h4 className={`font-extrabold text-sm text-slate-850 dark:text-slate-200 transition-colors ${theme.text}`}>
          {info.label}
        </h4>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
          {info.description}
        </p>
      </div>
      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${theme.badge}`}>
        {theme.tag}
      </span>
    </button>
  );
}

export function DropletDashGame({ themeId, onExit, onOpenSettings }: DropletDashGameProps) {
  const [gameState, setGameState] = useState<GameState>("select");
  const [difficulty, setDifficulty] = useState<DropletDifficulty>("easy");
  const [droplets, setDroplets] = useState<ActiveDroplet[]>([]);
  const [answer, setAnswer] = useState("");
  const [inputError, setInputError] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isMobile, setIsMobile] = useState(false);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);

  const isPrefixOfAnyAnswer = (val: string, activeDroplets: ActiveDroplet[]) => {
    if (val === "" || val === "-") return true;
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num)) return false;
    return activeDroplets.some((droplet) => {
      const ansStr = droplet.answer.toString();
      return ansStr.startsWith(val);
    });
  };

  const boardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const lastSpawnRef = useRef(0);
  const dropletsRef = useRef<ActiveDroplet[]>([]);
  const livesRef = useRef(MAX_LIVES);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const difficultyRef = useRef<DropletDifficulty>("easy");
  const stateRef = useRef<GameState>("select");

  const syncDroplets = useCallback((next: ActiveDroplet[]) => {
    dropletsRef.current = next;
    setDroplets(next);
  }, []);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (gameState === "playing" && !isMobile) {
      inputRef.current?.focus();
    }
  }, [gameState, isMobile]);

  const createDroplet = useCallback((): ActiveDroplet => {
    const question = generateQuestion(difficultyRef.current);
    const usedX = dropletsRef.current.map((droplet) => droplet.x);
    let x = 14 + Math.random() * 72;

    for (let attempt = 0; attempt < 12; attempt++) {
      if (!usedX.some((value) => Math.abs(value - x) < 17)) break;
      x = 14 + Math.random() * 72;
    }

    const speedBoost = Math.min(scoreRef.current / 250, 2.2);

    return {
      id: `droplet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x,
      y: isMobile ? MOBILE_START_Y : DESKTOP_START_Y,
      expression: question.expression,
      answer: question.correctAnswer,
      speed: 0.85 + speedBoost + Math.random() * 0.35,
      size: question.expression.length > 8 ? 92 : 82,
    };
  }, [isMobile]);

  const spawnDroplet = useCallback(() => {
    if (!boardRef.current || dropletsRef.current.length >= MAX_DROPLETS) return;
    syncDroplets([...dropletsRef.current, createDroplet()]);
  }, [createDroplet, syncDroplets]);

  const startGame = useCallback((nextDifficulty: DropletDifficulty) => {
    setDifficulty(nextDifficulty);
    difficultyRef.current = nextDifficulty;
    setScore(0);
    scoreRef.current = 0;
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    streakRef.current = 0;
    setAnswer("");
    syncDroplets([]);
    lastFrameRef.current = null;
    lastSpawnRef.current = 0;
    setGameState("playing");
    stateRef.current = "playing";
  }, [syncDroplets]);

  const endGame = useCallback(() => {
    setGameState("gameover");
    stateRef.current = "gameover";
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const key = `eduspace_droplet_dash_highscore_${difficultyRef.current}`;
    const previous = Number.parseInt(localStorage.getItem(key) || "0", 10);
    if (scoreRef.current > previous) {
      localStorage.setItem(key, String(scoreRef.current));
    }
  }, []);

  const loseLife = useCallback(() => {
    const nextLives = livesRef.current - 1;
    livesRef.current = nextLives;
    setLives(nextLives);
    streakRef.current = 0;
    setFlash("bad");
    window.setTimeout(() => setFlash(null), 180);
    mathGameAudio.playWaterSplash();

    if (nextLives <= 0) {
      mathGameAudio.playGameOver();
      endGame();
    }
  }, [endGame]);

  const checkAnswer = useCallback((value: string) => {
    const numericValue = Number.parseInt(value, 10);
    if (Number.isNaN(numericValue)) return;

    const matched = dropletsRef.current.find((droplet) => droplet.answer === numericValue);
    if (!matched) return;

    const nextDroplets = dropletsRef.current.filter((droplet) => droplet.id !== matched.id);
    syncDroplets(nextDroplets);

    const nextStreak = streakRef.current + 1;
    const multiplier = nextStreak >= 10 ? 3 : nextStreak >= 5 ? 2 : 1;
    const nextScore = scoreRef.current + 10 * multiplier;

    streakRef.current = nextStreak;
    scoreRef.current = nextScore;
    setScore(nextScore);
    setAnswer("");
    setFlash("good");
    window.setTimeout(() => setFlash(null), 180);
    mathGameAudio.playWaterDrop();

    if (nextDroplets.length === 0) {
      window.setTimeout(spawnDroplet, 120);
    }
  }, [spawnDroplet, syncDroplets]);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d-]/g, "");
    if (isPrefixOfAnyAnswer(value, dropletsRef.current)) {
      setAnswer(value);
      checkAnswer(value);
    } else {
      setInputError(true);
      mathGameAudio.playError();
      window.setTimeout(() => setInputError(false), 200);
    }
  };

  const handleKeypad = (key: string) => {
    if (gameState !== "playing") return;

    let nextValue = answer;
    if (key === "delete") {
      nextValue = answer.slice(0, -1);
    } else if (key === "-") {
      nextValue = answer.startsWith("-") ? answer.slice(1) : `-${answer}`;
    } else {
      nextValue = `${answer}${key}`;
    }

    if (isPrefixOfAnyAnswer(nextValue, dropletsRef.current)) {
      setAnswer(nextValue);
      checkAnswer(nextValue);
    } else {
      setInputError(true);
      mathGameAudio.playError();
      window.setTimeout(() => setInputError(false), 200);
    }
  };

  const handleBoardClick = () => {
    if (gameState === "playing" && !isMobile) {
      inputRef.current?.focus();
    }
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (stateRef.current !== "playing") return;

    const previousFrame = lastFrameRef.current ?? timestamp;
    const delta = Math.min(timestamp - previousFrame, 48);
    lastFrameRef.current = timestamp;

    const boardHeight = boardRef.current?.clientHeight || 640;
    const seaHeight = isMobile ? SEA_HEIGHT_MOBILE : SEA_HEIGHT_DESKTOP;
    const groundY = boardHeight - seaHeight - 36;
    let missedCount = 0;

    const nextDroplets = dropletsRef.current
      .map((droplet) => ({
        ...droplet,
        y: droplet.y + droplet.speed * (delta / 16.67),
      }))
      .filter((droplet) => {
        const missed = droplet.y > groundY;
        if (missed) missedCount += 1;
        return !missed;
      });

    if (missedCount > 0) {
      syncDroplets(nextDroplets);
      loseLife();
      if (stateRef.current !== "playing") return;
    } else {
      syncDroplets(nextDroplets);
    }

    const spawnInterval = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - scoreRef.current * 2);
    if (
      timestamp - lastSpawnRef.current >= spawnInterval &&
      dropletsRef.current.length < MAX_DROPLETS
    ) {
      lastSpawnRef.current = timestamp;
      spawnDroplet();
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isMobile, loseLife, spawnDroplet, syncDroplets]);

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
    setAnswer("");
    setGameState("select");
    stateRef.current = "select";
  };

  if (gameState === "select") {
    const difficulties: DropletDifficulty[] = ["easy", "medium", "hard", "extreme"];

    return (
      <div className="flex h-full min-h-[560px] w-full items-center justify-center bg-[#C7E6FA] dark:bg-slate-950 px-4 py-8 relative">
        {/* Top Header Bar with clean Back arrow in top-left */}
        <div className="absolute inset-x-0 top-0 z-40 px-5 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-slate-800/30 shadow-md hover:bg-white dark:hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Exit to Dashboard"
          >
            <ArrowLeft className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-slate-800/30 shadow-md hover:bg-white dark:hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Settings"
          >
            <Settings className="size-5" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900/95">
            <CardContent className="space-y-6 p-8">
              <div className="text-center space-y-2">
                <div className="mx-auto mb-1 flex size-14 items-center justify-center rounded-3xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-100/50 dark:border-sky-900/20">
                  <Droplets className="size-8" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Droplet Dash</h2>
                <p className="text-slate-500 dark:text-slate-450 font-bold text-xs max-w-xs mx-auto">
                  Type the answer before the water droplets reach the sea.
                </p>
              </div>

              <div className="space-y-3">
                {difficulties.map((item) => (
                  <DifficultyButton
                    key={item}
                    difficulty={item}
                    onClick={() => startGame(item)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="flex h-full min-h-[560px] w-full items-center justify-center bg-[#C7E6FA] dark:bg-slate-950 px-4 py-8">
        <Card className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xl">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-sky-900/20">
              <Droplets className="size-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Game Over</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-455">
                Score <span className="text-yellow-600 dark:text-yellow-400 font-extrabold">{score}</span> • Best streak <span className="text-sky-500 font-black">{streakRef.current}</span>
              </p>
            </div>
            <Button className="w-full rounded-2xl bg-sky-600 py-6 font-black hover:bg-sky-700 text-white border-none shadow-md shadow-sky-600/20" onClick={() => startGame(difficulty)}>
              <RotateCcw className="mr-2 size-4" />
              Play Again
            </Button>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="w-full font-bold text-slate-500" onClick={exitToSelect}>
                Change Difficulty
              </Button>
              <Button variant="ghost" className="w-full font-bold text-slate-500" onClick={onExit}>
                Exit to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      onClick={handleBoardClick}
      className={`relative h-full min-h-[560px] w-full overflow-hidden bg-[#C7E6FA] ${flash === "good" ? "ring-4 ring-emerald-400/50" : flash === "bad" ? "ring-4 ring-rose-400/50" : ""
        }`}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-4px, 0); }
          30% { transform: translate(4px, 0); }
          45% { transform: translate(-4px, 0); }
          60% { transform: translate(4px, 0); }
          75% { transform: translate(-2px, 0); }
          90% { transform: translate(2px, 0); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out;
        }
      `}} />
      <Cloud className="absolute left-[11%] top-[6%]" />
      <Cloud className="absolute left-[31%] top-[14%] scale-110" />
      <Cloud className="absolute right-[36%] top-[9%] scale-90" />
      <Cloud className="absolute right-[14%] top-[7%] scale-105" />

      {/* Sleek transparent game header */}
      <div className="absolute inset-x-0 top-0 z-40 px-5 py-4 flex items-center justify-between">
        {/* Left: Back Arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-slate-800/30 shadow-md hover:bg-white dark:hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
          title="Exit to Dashboard"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* Center: Lives */}
        <div className="bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/30 rounded-full px-4 py-2 flex items-center gap-1.5 shadow-md">
          {Array.from({ length: MAX_LIVES }).map((_, index) => (
            <Heart
              key={index}
              className={`size-5 sm:size-6 transition-all duration-300 ${index < lives ? "fill-rose-500 text-rose-500 scale-100" : "text-slate-300 dark:text-slate-700 scale-95"
                }`}
            />
          ))}
        </div>

        {/* Right Side: Score, Settings, and Pause */}
        <div className="flex items-center gap-2">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800/30 rounded-full px-4 py-2.5 text-xs sm:text-sm font-black uppercase text-slate-750 dark:text-slate-200 shadow-md flex items-center gap-1">
            <span>Score:</span>
            <span className={`font-extrabold ${getThemeTextColor(themeId)}`}>{score}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-slate-800/30 shadow-md hover:bg-white dark:hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Settings"
          >
            <Settings className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={gameState === "paused" ? resumeGame : pauseGame}
            className="rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-slate-800/30 shadow-md hover:bg-white dark:hover:bg-slate-800 size-10 flex items-center justify-center transition-all active:scale-95 shrink-0"
            title={gameState === "paused" ? "Resume game" : "Pause game"}
          >
            {gameState === "paused" ? <Play className="size-5" /> : <Pause className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Centered Input field for Desktop */}
      {!isMobile && (
        <div className="absolute inset-x-0 top-24 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <input
              ref={inputRef}
              value={answer}
              onChange={handleAnswerChange}
              inputMode="numeric"
              disabled={gameState !== "playing" || isMobile}
              placeholder="Type answer..."
              className={`h-14 w-[280px] rounded-2xl border bg-white dark:bg-slate-900 text-slate-850 dark:text-white px-6 text-center text-xl font-black shadow-lg outline-none placeholder:text-slate-400 focus:ring-2 transition-all ${inputError
                ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 focus:ring-rose-500 animate-shake"
                : `${getThemeFocusRing(themeId)} border-transparent`
                }`}
            />
          </div>
        </div>
      )}

      {/* Pause button is now in the header next to settings */}

      <AnimatePresence>
        {droplets.map((droplet) => (
          <motion.div
            key={droplet.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute z-30 -translate-x-1/2 pointer-events-none"
            style={{
              left: `${droplet.x}%`,
              top: droplet.y,
              width: droplet.size,
              height: droplet.size,
            }}
          >
            <svg viewBox="0 0 80 90" className="absolute inset-0 h-full w-full drop-shadow-xl">
              <defs>
                <linearGradient id={`dropGrad-${droplet.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={getDropletGradientColors(themeId).start} />
                  <stop offset="100%" stopColor={getDropletGradientColors(themeId).end} />
                </linearGradient>
                <linearGradient id={`dropHighlight-${droplet.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Outer shadow / background glow */}
              <path
                d="M40 6 C52 24 72 44 72 60 A32 32 0 0 1 8 60 C8 44 28 24 40 6 Z"
                fill={`url(#dropGrad-${droplet.id})`}
              />
              {/* Inner highlight */}
              <path
                d="M40 10 C50 26 66 44 66 58 A26 26 0 0 1 14 58 C14 44 30 26 40 10 Z"
                fill={`url(#dropHighlight-${droplet.id})`}
                opacity="0.25"
              />
              {/* Gloss specular reflection */}
              <ellipse cx="26" cy="48" rx="6" ry="10" fill="white" opacity="0.4" transform="rotate(-15 26 48)" />
            </svg>
            <span className={`absolute inset-x-2 top-[56%] z-10 -translate-y-1/2 text-center text-[12px] font-black leading-tight drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] ${themeId === "retro" ? "font-mono text-emerald-100" : "font-sans text-white"
              }`}>
              {droplet.expression}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-[#238ED4] ${isMobile ? "h-[240px] px-5 pb-4 pt-3" : "h-20"
          }`}
      >
        {isMobile && (
          <div className="mx-auto flex flex-col gap-3 max-w-xs pointer-events-auto">
            {/* Mobile Answer Display */}
            <div className={`h-11 w-full rounded-xl flex items-center justify-center text-xl font-black shadow-inner tracking-wider transition-all duration-150 ${inputError
              ? "bg-rose-500/30 border border-rose-500 text-rose-200 animate-shake"
              : "bg-white/20 border border-white/30 text-white"
              }`}>
              {answer || <span className="text-white/40 text-sm font-bold">Type answer...</span>}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2">
              {["7", "8", "9", "4", "5", "6", "1", "2", "3", "-", "0", "delete"].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypad(key)}
                  className={`flex h-9 items-center justify-center rounded-xl border border-white/20 text-sm font-black text-white shadow-sm transition active:scale-95 ${key === "delete" ? "bg-rose-500" : "bg-white/20"
                    }`}
                >
                  {key === "delete" ? <Delete className="size-4" /> : key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {gameState === "paused" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xs"
          >
            <Card className="border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="space-y-6 p-8 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-sky-900/20">
                  <Pause className="size-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Game Paused</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 font-bold">
                    Take a breath! Click below to resume your challenge.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black py-6 border-none shadow-md shadow-sky-600/20"
                    onClick={resumeGame}
                  >
                    <Play className="mr-2 size-4 fill-current" />
                    Resume Game
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full rounded-2xl py-6 font-bold border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-250 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    onClick={onExit}
                  >
                    Exit to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
