import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useStreak } from '../../contexts/StreakContext';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { mathGameAudio } from '../../lib/mathGameAudio';
import { MATH_THEMES, MathTheme } from '../../lib/mathGameTheme';

interface Cell {
  id: string;
  val: number;
  row: number;
  col: number;
  effect?: 'multiplier' | 'time' | 'bomb' | null;
}

interface MathPathGameProps {
  mode: 'daily' | 'time' | 'zen';
  difficulty: 'easy' | 'medium' | 'hard';
  themeId: MathTheme['id'];
  onExit: () => void;
  onRecordStreak: () => Promise<void>;
  onTimerTick?: (timeLeft: number) => void;
  onNewChallenge?: () => void; // Prop to switch modes via modal
}

export function MathPathGame({
  mode,
  difficulty,
  themeId,
  onExit,
  onRecordStreak,
  onTimerTick,
  onNewChallenge
}: MathPathGameProps) {
  const DAILY_TARGET_SCORE = 100;

  // GRID_SIZE is dynamic based on difficulty
  const GRID_SIZE = useMemo(() => {
    if (difficulty === 'easy') return 4;
    if (difficulty === 'hard') return 6;
    return 5;
  }, [difficulty]);

  const theme = useMemo(() => {
    return MATH_THEMES[themeId] || MATH_THEMES.cyber;
  }, [themeId]);

  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectedPath, setSelectedPath] = useState<Cell[]>([]);
  const [targetSum, setTargetSum] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(mode === 'time' ? 60 : 0);
  const [dailyCompleted, setDailyCompleted] = useState<boolean>(false);
  const [shakeCells, setShakeCells] = useState<boolean>(false);
  const [isPressed, setIsPressed] = useState<boolean>(false);

  // Particles canvas references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Sync timeLeft back to parent header component
  useEffect(() => {
    if (onTimerTick && mode === 'time') {
      onTimerTick(timeLeft);
    }
  }, [timeLeft, onTimerTick, mode]);

  // Clean class name helper to strip square radiuses and enforce circular cells
  const getCircleClass = (themeClass: string) => {
    return themeClass
      .replace(/rounded-[a-zA-Z0-9-\[\]]+/g, '')
      .replace(/aspect-[a-z]+/g, '')
      + ' rounded-full aspect-square flex items-center justify-center';
  };

  // Spark particles explosion on math match success
  const triggerParticles = (cells: Cell[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSpacingX = canvas.width / GRID_SIZE;
    const cellSpacingY = canvas.height / GRID_SIZE;
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];

    cells.forEach((cell) => {
      const centerX = (cell.col + 0.5) * cellSpacingX;
      const centerY = (cell.row + 0.5) * cellSpacingY;

      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.5;
        particlesRef.current.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 2,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 15 + 15,
        });
      }
    });

    if (!animationFrameIdRef.current) {
      tickParticles();
    }
  };

  const tickParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife || p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(tickParticles);
    } else {
      animationFrameIdRef.current = null;
    }
  };

  // Synchronize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.resetTransform();
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [board]);

  // Generate a random cell
  const createCell = (row: number, col: number): Cell => {
    let effect: 'multiplier' | 'time' | 'bomb' | null = null;
    // 12% chance of special tile
    if (Math.random() < 0.12) {
      const rand = Math.random();
      if (rand < 0.4) {
        effect = 'multiplier';
      } else if (rand < 0.75 && mode === 'time') {
        effect = 'time';
      } else {
        effect = 'bomb';
      }
    }

    const generateRandomVal = () => {
      if (difficulty === 'hard') {
        if (Math.random() < 0.35) { // 35% chance of negative values
          return -(Math.floor(Math.random() * 9) + 1); // -1 to -9
        }
        return Math.floor(Math.random() * 20) + 2; // 2 to 21
      }
      if (difficulty === 'medium') {
        if (Math.random() < 0.15) { // 15% chance of negative values
          return -(Math.floor(Math.random() * 3) + 1); // -1 to -3
        }
        return Math.floor(Math.random() * 12) + 1; // 1 to 12
      }
      return Math.floor(Math.random() * 9) + 1; // 1 to 9 (Easy)
    };

    return {
      id: `${Math.random().toString(36).substring(2, 9)}-${row}-${col}`,
      val: generateRandomVal(),
      row,
      col,
      effect,
    };
  };

  // Initialize board
  const initializeBoard = (keepScore = false) => {
    const newBoard: Cell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const rowCells: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        rowCells.push(createCell(r, c));
      }
      newBoard.push(rowCells);
    }
    setBoard(newBoard);
    generateNewTarget(newBoard);
    setSelectedPath([]);
    if (!keepScore) {
      setScore(0);
      if (mode === 'time') {
        setTimeLeft(60);
      }
    }
  };

  // Generate new target sum based on average possibilities
  const generateNewTarget = (currentBoard: Cell[][]) => {
    if (currentBoard.length === 0) return;

    // Choose a random path length based on difficulty
    let pathLen = 3;
    if (difficulty === 'easy') {
      pathLen = Math.floor(Math.random() * 2) + 2; // 2 to 3 numbers
    } else if (difficulty === 'medium') {
      pathLen = Math.floor(Math.random() * 3) + 3; // 3 to 5 numbers
    } else if (difficulty === 'hard') {
      pathLen = Math.floor(Math.random() * 4) + 4; // 4 to 7 numbers
    }

    let sum = 0;

    // Start at a random cell and make a walk
    let r = Math.floor(Math.random() * GRID_SIZE);
    let c = Math.floor(Math.random() * GRID_SIZE);
    sum += currentBoard[r][c].val;

    const visited = new Set<string>([`${r},${c}`]);

    for (let i = 1; i < pathLen; i++) {
      const neighbors: [number, number][] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited.has(`${nr},${nc}`)) {
            neighbors.push([nr, nc]);
          }
        }
      }
      if (neighbors.length === 0) break;
      const [nextR, nextC] = neighbors[Math.floor(Math.random() * neighbors.length)];
      sum += currentBoard[nextR][nextC].val;
      visited.add(`${nextR},${nextC}`);
      r = nextR;
      c = nextC;
    }

    const minTarget = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5;
    if (sum < minTarget) {
      generateNewTarget(currentBoard);
      return;
    }

    setTargetSum(sum);
  };

  // Start board on load / difficulty change
  useEffect(() => {
    initializeBoard();
  }, [difficulty]);

  // Auto-validate path connections instantly
  useEffect(() => {
    if (selectedPath.length === 0) return;
    const pathSum = selectedPath.reduce((acc, cell) => acc + cell.val, 0);
    if (pathSum === targetSum) {
      handleMatchSuccess();
    } else if (pathSum > targetSum) {
      handleMatchFailure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, targetSum]);

  // Time Attack Timer
  useEffect(() => {
    if (mode !== 'time' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, mode]);

  const handleTimeOver = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#3b82f6', '#10b981', '#f59e0b']
    });
    const scoreKey = `eduspace_math_time_attack_highscore_${difficulty}`;
    const savedHighScore = localStorage.getItem(scoreKey) || '0';
    if (score > parseInt(savedHighScore, 10)) {
      localStorage.setItem(scoreKey, score.toString());
      toast.success('🏆 New High Score!', {
        description: `You set a new record of ${score} points on ${difficulty}!`,
      });
    } else {
      toast.info('Game Over!', {
        description: `You scored ${score} points. Try again to beat your high score of ${savedHighScore} on ${difficulty}!`,
      });
    }
  };

  // Calculate current sum of selected path
  const currentSum = useMemo(() => {
    return selectedPath.reduce((acc, cell) => acc + cell.val, 0);
  }, [selectedPath]);

  // Check adjacency
  const isAdjacent = (cellA: Cell, cellB: Cell) => {
    const rowDiff = Math.abs(cellA.row - cellB.row);
    const colDiff = Math.abs(cellA.col - cellB.col);
    return rowDiff <= 1 && colDiff <= 1;
  };

  // Handle cell touch/click start
  const handleCellSelect = (cell: Cell) => {
    if (shakeCells) return;

    if (selectedPath.length === 0) {
      setSelectedPath([cell]);
      setIsPressed(true);
      mathGameAudio.playSelect(1);
      return;
    }

    const index = selectedPath.findIndex((c) => c.id === cell.id);
    if (index !== -1) {
      if (index === selectedPath.length - 1) {
        setSelectedPath(selectedPath.slice(0, -1));
        mathGameAudio.playSelect(Math.max(1, selectedPath.length - 2));
      }
      return;
    }

    const lastCell = selectedPath[selectedPath.length - 1];
    if (isAdjacent(lastCell, cell)) {
      const nextPath = [...selectedPath, cell];
      setSelectedPath(nextPath);
      mathGameAudio.playSelect(nextPath.length);
    } else {
      setSelectedPath([cell]);
      mathGameAudio.playSelect(1);
    }
  };

  // Handle hover/enter for swipe select
  const handleCellMouseEnter = (cell: Cell) => {
    if (!isPressed || shakeCells || selectedPath.length === 0) return;

    const index = selectedPath.findIndex((c) => c.id === cell.id);
    if (index !== -1) {
      if (index === selectedPath.length - 2) {
        setSelectedPath(selectedPath.slice(0, -1));
        mathGameAudio.playSelect(Math.max(1, selectedPath.length - 2));
      }
      return;
    }

    const lastCell = selectedPath[selectedPath.length - 1];
    if (isAdjacent(lastCell, cell)) {
      const nextPath = [...selectedPath, cell];
      setSelectedPath(nextPath);
      mathGameAudio.playSelect(nextPath.length);
    }
  };

  // Drag release trigger validation
  const validateSelection = () => {
    setIsPressed(false);
    if (selectedPath.length === 0) return;

    if (currentSum === targetSum) {
      handleMatchSuccess();
    } else if (currentSum > targetSum) {
      handleMatchFailure();
    }
  };

  // Explicit Result Verification from mockup button
  const handleCheckResult = () => {
    if (selectedPath.length === 0) {
      toast.error('Select numbers on the grid first!');
      return;
    }
    if (currentSum === targetSum) {
      handleMatchSuccess();
    } else if (currentSum > targetSum) {
      handleMatchFailure();
    } else {
      toast.info(`Sum is ${currentSum}. Target is ${targetSum}. Add more numbers!`);
    }
  };

  const handleMatchSuccess = () => {
    setIsPressed(false);
    const multiplierCount = selectedPath.filter(c => c.effect === 'multiplier').length;
    const timeBonusCount = selectedPath.filter(c => c.effect === 'time').length;
    const hasBomb = selectedPath.some(c => c.effect === 'bomb');

    const scoreMultiplier = Math.pow(2, multiplierCount);
    const basePoints = selectedPath.length * 10;
    const pointsAwarded = basePoints * scoreMultiplier;
    const newScore = score + pointsAwarded;
    setScore(newScore);

    triggerParticles(selectedPath);

    if (hasBomb) {
      mathGameAudio.playBomb();
    } else {
      mathGameAudio.playSuccess();
    }

    if (mode === 'time') {
      const standardTimeBonus = selectedPath.length * 2;
      const extraTimeBonus = timeBonusCount * 5;
      const totalTimeBonus = standardTimeBonus + extraTimeBonus;

      setTimeLeft((prev) => Math.min(prev + totalTimeBonus, 99));

      if (hasBomb) {
        let bonusDesc = `+${pointsAwarded} pts! +${totalTimeBonus}s time bonus`;
        if (multiplierCount > 0) bonusDesc += ` (${scoreMultiplier}x Score!)`;

        toast.success('💥 Bomb Cleared!', {
          description: bonusDesc,
          duration: 2000
        });
      }
    } else {
      if (hasBomb) {
        let matchDesc = `+${pointsAwarded} points`;
        if (multiplierCount > 0) matchDesc += ` (${scoreMultiplier}x Multiplier!)`;
        matchDesc = '💥 Bomb exploded & shuffled board! ' + matchDesc;

        toast.success('💥 Bomb Cleared!', {
          description: matchDesc,
          duration: 2000
        });
      }
    }

    if (mode === 'daily' && newScore >= DAILY_TARGET_SCORE && !dailyCompleted) {
      setDailyCompleted(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      onRecordStreak();
    }

    if (hasBomb) {
      initializeBoard(true);
      return;
    }

    const colsToModify = new Set<number>();
    selectedPath.forEach((c) => colsToModify.add(c.col));

    const nextBoard = board.map((row) => [...row]);

    colsToModify.forEach((colIndex) => {
      const remainingInCol: Cell[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        const cell = board[r][colIndex];
        if (!selectedPath.some((sc) => sc.id === cell.id)) {
          remainingInCol.push(cell);
        }
      }

      let remainingPtr = remainingInCol.length - 1;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (remainingPtr >= 0) {
          const oldCell = remainingInCol[remainingPtr];
          nextBoard[r][colIndex] = {
            ...oldCell,
            row: r,
          };
          remainingPtr--;
        } else {
          nextBoard[r][colIndex] = createCell(r, colIndex);
        }
      }
    });

    setBoard(nextBoard);
    setSelectedPath([]);
    generateNewTarget(nextBoard);
  };

  const handleMatchFailure = () => {
    setIsPressed(false);
    setShakeCells(true);
    mathGameAudio.playError();
    setTimeout(() => {
      setShakeCells(false);
      setSelectedPath([]);
    }, 600);
  };

  const undoLastSelection = () => {
    if (selectedPath.length > 0) {
      setSelectedPath(selectedPath.slice(0, -1));
      mathGameAudio.playSelect(Math.max(1, selectedPath.length - 2));
    }
  };

  const clearSelection = () => {
    setSelectedPath([]);
  };

  // Render connecting lines between selected cells
  const renderSVGPath = () => {
    if (selectedPath.length < 2) return null;

    const cellSpacing = 100 / GRID_SIZE;
    const centerOffset = cellSpacing / 2;

    let pathD = '';
    selectedPath.forEach((cell, idx) => {
      const x = cell.col * cellSpacing + centerOffset;
      const y = cell.row * cellSpacing + centerOffset;
      if (idx === 0) {
        pathD += `M ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
      }
    });

    let defaultStroke = '#0B57D0';
    let defaultGlow = 'rgba(11, 87, 208, 0.15)';
    if (themeId === 'retro') {
      defaultStroke = '#10b981';
      defaultGlow = 'rgba(16, 185, 129, 0.15)';
    } else if (themeId === 'sunset') {
      defaultStroke = '#f97316';
      defaultGlow = 'rgba(249, 115, 22, 0.15)';
    } else if (themeId === 'nordic') {
      defaultStroke = '#0ea5e9';
      defaultGlow = 'rgba(14, 165, 233, 0.15)';
    }

    let strokeColor = defaultStroke;
    let glowColor = defaultGlow;
    if (currentSum === targetSum) {
      strokeColor = '#0F9D58';
      glowColor = 'rgba(15, 157, 88, 0.2)';
    } else if (currentSum > targetSum) {
      strokeColor = '#D93025';
      glowColor = 'rgba(217, 48, 37, 0.2)';
    } else if (currentSum >= targetSum - 3) {
      strokeColor = '#f1c40f';
      glowColor = 'rgba(241, 196, 15, 0.2)';
    }

    return (
      <svg
        className="absolute inset-0 size-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d={pathD}
          fill="none"
          stroke={glowColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </svg>
    );
  };

  // Stats Card data
  const getDailyGoalProgressPercent = () => {
    if (mode === 'daily') {
      return Math.min(100, Math.floor((score / DAILY_TARGET_SCORE) * 100));
    }
    return 75;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full max-w-6xl mx-auto h-full items-start">

      {/* Center/Left Section: Gameplay Board */}
      <div className="xl:col-span-2 flex flex-col items-center space-y-6 w-full">
        {/* Mockup CURRENT TARGET Panel */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-md rounded-[2rem] p-6 text-center relative flex flex-col justify-center min-h-[140px] select-none transition-colors">
          <div className="text-[11px] font-black tracking-widest text-[#0B57D0] dark:text-blue-400 uppercase">
            Current Target
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-[#0B57D0] dark:text-blue-400 tracking-tight mt-1 transition-colors">{targetSum}</h2>
        </div>

        {/* Circular Grid Board Canvas Wrapper */}
        <div
          className="w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-md rounded-[2rem] p-6 relative flex items-center justify-center transition-colors"
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={validateSelection}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={validateSelection}
        >
          <div className="w-full max-w-[420px] aspect-square relative flex items-center justify-center">
            {/* Connection SVG overlay */}
            {renderSVGPath()}

            {/* Spark Canvas overlay */}
            <canvas ref={canvasRef} className="absolute inset-0 size-full pointer-events-none z-30" />

            {/* Board circular cells */}
            <div className={`grid gap-3 size-full relative z-20 ${GRID_SIZE === 4 ? 'grid-cols-4' : GRID_SIZE === 6 ? 'grid-cols-6' : 'grid-cols-5'
              }`}>
              <AnimatePresence mode="popLayout">
                {board.map((row) =>
                  row.map((cell) => {
                    const isSelected = selectedPath.some((c) => c.id === cell.id);
                    const isLastSelected = selectedPath.length > 0 && selectedPath[selectedPath.length - 1].id === cell.id;

                    // Compute dynamic button styling classes
                    let cellClass = '';
                    if (isSelected) {
                      cellClass = isLastSelected
                        ? getCircleClass(theme.cellLastSelected)
                        : getCircleClass(theme.cellSelected);
                    } else if (cell.effect === 'multiplier') {
                      cellClass = 'bg-[#FFF7ED] dark:bg-amber-950/20 border border-[#FFEDD5] dark:border-amber-900/30 text-[#C2410C] dark:text-amber-400 hover:scale-[1.03] transition-all rounded-full aspect-square flex items-center justify-center';
                    } else if (cell.effect === 'time') {
                      cellClass = 'bg-[#F0F9FF] dark:bg-sky-950/20 border border-[#E0F2FE] dark:border-sky-900/30 text-[#0369A1] dark:text-sky-400 hover:scale-[1.03] transition-all rounded-full aspect-square flex items-center justify-center';
                    } else {
                      cellClass = getCircleClass(theme.cellDefault);
                    }

                    return (
                      <motion.button
                        layout
                        key={cell.id}
                        onClick={() => handleCellSelect(cell)}
                        onMouseEnter={() => handleCellMouseEnter(cell)}
                        onTouchMove={(e) => {
                          const touch = e.touches[0];
                          const element = document.elementFromPoint(touch.clientX, touch.clientY);
                          if (!element) return;
                          const cellId = element.getAttribute('data-cell-id');
                          if (cellId) {
                            const targetRow = parseInt(element.getAttribute('data-cell-row') || '0', 10);
                            const targetCol = element.getAttribute('data-cell-col');
                            if (targetCol !== null) {
                              const targetColIdx = parseInt(targetCol, 10);
                              const targetCell = board[targetRow]?.[targetColIdx];
                              if (targetCell) handleCellMouseEnter(targetCell);
                            }
                          }
                        }}
                        data-cell-id={cell.id}
                        data-cell-row={cell.row}
                        data-cell-col={cell.col}
                        animate={
                          shakeCells && isSelected
                            ? { x: [-8, 8, -8, 8, 0], scale: 1.05 }
                            : isSelected
                              ? { scale: 1.08, zIndex: 10 }
                              : { scale: 1, zIndex: 1 }
                        }
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                          x: { type: 'tween', duration: 0.5, ease: 'easeInOut' }
                        }}
                        className={`${cellClass} ${GRID_SIZE === 4
                          ? 'text-3xl sm:text-4xl font-extrabold'
                          : GRID_SIZE === 6
                            ? 'text-xl sm:text-2xl font-extrabold'
                            : 'text-2xl sm:text-3xl font-extrabold'
                          } ${theme.fontClass || ''}`}
                      >
                        <span className="pointer-events-none select-none">{cell.val}</span>
                        {cell.effect && !isSelected && (
                          <>
                            {cell.effect === 'multiplier' && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FFEDD5] border border-[#FED7AA] text-[#C2410C] text-[8px] font-extrabold px-2 py-0.5 rounded-full leading-none select-none uppercase tracking-tighter z-30 shadow-sm whitespace-nowrap">
                                x2
                              </span>
                            )}
                            {cell.effect === 'time' && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] text-[8px] font-extrabold px-2 py-0.5 rounded-full leading-none select-none uppercase tracking-tighter z-30 shadow-sm whitespace-nowrap">
                                +5s
                              </span>
                            )}
                            {cell.effect === 'bomb' && (
                              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse z-30" />
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mockup centered Equation display pill */}
        <div className="w-full flex justify-center">
          <div className={`w-full max-w-[450px] min-h-[50px] flex items-center justify-center px-6 py-3.5 rounded-full border transition-all ${shakeCells
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 dark:border-rose-900/30 text-rose-500 animate-pulse'
            : currentSum === targetSum
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/30 text-emerald-500'
              : selectedPath.length > 0
                ? 'bg-[#E2EDF8] dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-[#0B57D0] dark:text-blue-400 shadow-sm'
                : 'bg-[#EEF2F6] dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500 shadow-sm border-dashed'
            }`}>
            {selectedPath.length > 0 ? (
              <div className="flex items-center gap-2 font-black text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  {selectedPath
                    .map((c) => c.val)
                    .map((v, i) => i === 0 ? v.toString() : (v >= 0 ? `+ ${v}` : `- ${Math.abs(v)}`))
                    .join(' ')}
                </span>
                <span className="text-[#0B57D0]/60 dark:text-blue-400/60 font-medium">=</span>
                <span className={`text-base font-black ${currentSum === targetSum ? 'text-emerald-500' : currentSum > targetSum ? 'text-rose-500' : 'text-[#0B57D0] dark:text-blue-400'}`}>
                  {currentSum}
                </span>
                {currentSum === targetSum && <CheckCircle2 className="size-4 text-emerald-500" />}
                {currentSum > targetSum && <AlertCircle className="size-4 text-[#D93025]" />}
              </div>
            ) : (
              <span className="text-xs font-bold italic text-slate-400 dark:text-slate-500">Drag or click numbers to write an equation</span>
            )}
          </div>
        </div>

        {/* Daily Challenge Complete overlay */}
        <AnimatePresence>
          {mode === 'daily' && dailyCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-[2.5rem] p-6 text-center space-y-4 shadow-sm"
            >
              <div className="size-12 bg-emerald-100 dark:bg-emerald-900 text-[#0F9D58] dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-400">Daily Challenge Completed!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-450 font-bold leading-relaxed">
                  You reached {score} points and secured your daily study progress.
                </p>
              </div>
              <Button onClick={onExit} className="w-full bg-emerald-600 dark:bg-emerald-750 hover:bg-emerald-500 dark:hover:bg-emerald-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-emerald-600/25 border-none">
                Back to Playground
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Attack Finished Overlay */}
        {mode === 'time' && timeLeft === 0 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
            <Card className="max-w-sm border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden w-full bg-white dark:bg-slate-900">
              <CardContent className="p-8 text-center space-y-6">
                <div className="size-16 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                  <Clock className="size-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Time's Up!</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-bold text-sm leading-relaxed">
                    You reached your time. You did not clear the round.
                  </p>
                  <div className="py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block">Final Score</span>
                    <span className="text-4xl font-black text-[#0B57D0] dark:text-blue-400">{score}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => initializeBoard(false)} className="w-full rounded-2xl py-6 font-bold bg-[#0B57D0] dark:bg-blue-600 hover:bg-[#0845A4] dark:hover:bg-blue-700 text-white border-none">
                    Play Again
                  </Button>
                  <Button variant="outline" onClick={onExit} className="w-full rounded-2xl py-6 font-bold border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350">
                    Exit to Playground
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
 
      {/* Right Column Section: Stats, Controls & Banners */}
      <div className="flex flex-col gap-6 w-full select-none">
 
        {/* Prominent New Challenge Button */}
        {onNewChallenge && (
          <Button
            onClick={onNewChallenge}
            className="w-full bg-[#0B57D0] dark:bg-blue-600 hover:bg-[#0845A4] dark:hover:bg-blue-700 text-white py-6 rounded-2xl text-xs font-black tracking-wider uppercase shadow-md shadow-blue-500/10 dark:shadow-blue-500/5 transition-all border-none"
          >
            New Challenge
          </Button>
        )}
 
        {/* Mockup Stats Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-md rounded-[2rem] p-6 space-y-4 transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Stats</h3>
 
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Score */}
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Current Score</span>
              <span className="text-sm font-extrabold text-[#0B57D0] dark:text-blue-400">{score.toLocaleString()}</span>
            </div>
 
            {/* Daily Goal Progress */}
            <div className="py-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Daily Goal</span>
                <span>{getDailyGoalProgressPercent()}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F9D58] h-full rounded-full transition-all duration-300"
                  style={{ width: `${getDailyGoalProgressPercent()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
 
        {/* Mockup Controls Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-md rounded-[2rem] p-6 transition-colors">
          <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight mb-4">Controls</h3>
 
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={undoLastSelection}
              className="flex flex-col items-center justify-center gap-1.5 bg-[#EEF2F6] dark:bg-slate-800 hover:bg-[#E2EDF8] dark:hover:bg-slate-800 text-[#0B57D0] dark:text-blue-400 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-wider shadow-sm"
            >
              <RotateCcw className="size-4" />
              <span>Undo</span>
            </button>
            <button
              onClick={clearSelection}
              className="flex flex-col items-center justify-center gap-1.5 bg-[#EEF2F6] dark:bg-slate-800 hover:bg-[#E2EDF8] dark:hover:bg-slate-800 text-[#0B57D0] dark:text-blue-400 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-wider shadow-sm"
            >
              <RotateCcw className="size-4 rotate-180" />
              <span>Reset</span>
            </button>
          </div>

          <div
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all mt-4 border text-center select-none ${
              selectedPath.length === 0
                ? "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500"
                : currentSum === targetSum
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : currentSum > targetSum
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400"
                    : "bg-[#EEF2F6] dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-[#0B57D0] dark:text-blue-400"
            }`}
          >
            {selectedPath.length === 0 && (
              <>
                <Zap className="size-4 animate-pulse" />
                <span>Auto-Check Active</span>
              </>
            )}
            {selectedPath.length > 0 && currentSum < targetSum && (
              <>
                <HelpCircle className="size-4 animate-pulse" />
                <span>Need {targetSum - currentSum} More</span>
              </>
            )}
            {selectedPath.length > 0 && currentSum === targetSum && (
              <>
                <CheckCircle className="size-4" />
                <span>Target Reached!</span>
              </>
            )}
            {selectedPath.length > 0 && currentSum > targetSum && (
              <>
                <AlertCircle className="size-4" />
                <span>Too High!</span>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
