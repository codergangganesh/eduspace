// Visual Theme Definitions for MathPath Game
export interface MathTheme {
  id: 'cyber' | 'retro' | 'sunset' | 'nordic';
  name: string;
  gridBg: string;         // Game board grid container wrapper style
  cellDefault: string;    // Idle cell style
  cellSelected: string;   // Selected cell within the path (not head)
  cellLastSelected: string; // The head of the selection path
  targetCardBg: string;   // Target sum card styling
  targetText: string;     // Target sum display text style
  targetLabel: string;    // Tiny "Target" label pill
  textColor: string;      // Body text color
  btnPrimary: string;     // Main buttons
  btnSecondary: string;   // Secondary buttons
  accentColor: string;    // Accent icon coloring
  fontClass?: string;     // Custom font modifiers if any (e.g. monospace for retro)
}

export const MATH_THEMES: Record<MathTheme['id'], MathTheme> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    gridBg: 'w-full p-2 relative aspect-square select-none touch-none overflow-hidden',
    cellDefault: 'bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-slate-800/30 text-slate-800 dark:text-slate-200 hover:scale-[1.03] shadow-md transition-all rounded-3xl',
    cellSelected: 'bg-blue-500/10 border-2 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm',
    cellLastSelected: 'bg-blue-500 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/35',
    targetCardBg: 'w-full border border-slate-100/60 dark:border-slate-800/50 shadow-md rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-800 dark:text-white mb-8 relative p-8 text-center space-y-2',
    targetText: 'text-7xl font-semibold tracking-tight text-slate-800 dark:text-white py-4',
    targetLabel: 'absolute top-4 left-6 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider',
    textColor: 'text-slate-600 dark:text-slate-300',
    btnPrimary: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-md',
    btnSecondary: 'border-slate-200/80 dark:border-slate-800/80 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800',
    accentColor: 'text-blue-500',
    fontClass: 'font-sans'
  },
  retro: {
    id: 'retro',
    name: 'Retro Arcade',
    gridBg: 'bg-black border-2 border-emerald-500/30 p-2.5 rounded-[2rem] shadow-[inset_0_0_20px_rgba(16,185,129,0.15)] relative aspect-square select-none touch-none overflow-hidden',
    cellDefault: 'bg-black border border-emerald-500/40 text-emerald-500 hover:bg-emerald-950/20 hover:scale-[1.03] shadow-sm font-mono tracking-tighter',
    cellSelected: 'bg-emerald-950/40 border-emerald-400 text-emerald-400 font-mono',
    cellLastSelected: 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/60 font-mono',
    targetCardBg: 'w-full border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-[2rem] overflow-hidden bg-black text-emerald-500 mb-6',
    targetText: 'text-6xl font-mono font-black tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    targetLabel: 'absolute top-3 left-3 bg-emerald-950 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider text-emerald-400',
    textColor: 'text-emerald-500/90 dark:text-emerald-400/95 font-mono',
    btnPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold shadow-md shadow-emerald-600/20 transition-all border border-emerald-400',
    btnSecondary: 'border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30 font-mono font-bold',
    accentColor: 'text-emerald-400',
    fontClass: 'font-mono'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Burn',
    gridBg: 'bg-amber-50/20 dark:bg-rose-950/5 border border-orange-200/40 dark:border-rose-900/10 p-2.5 rounded-[2.5rem] shadow-inner relative aspect-square select-none touch-none overflow-hidden',
    cellDefault: 'bg-white dark:bg-zinc-900 border-orange-200/70 dark:border-zinc-800/80 text-orange-950 dark:text-amber-100 hover:bg-orange-50/50 dark:hover:bg-zinc-800/80 hover:scale-[1.03] shadow-sm',
    cellSelected: 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-300 text-orange-600 dark:text-orange-400',
    cellLastSelected: 'bg-gradient-to-br from-orange-500 to-rose-600 border-orange-400 text-white shadow-lg shadow-orange-500/30',
    targetCardBg: 'w-full border-none shadow-xl rounded-[2rem] overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white mb-6',
    targetText: 'text-6xl font-black tracking-tight text-white',
    targetLabel: 'absolute top-3 left-3 bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider text-white',
    textColor: 'text-orange-900/80 dark:text-amber-100/95',
    btnPrimary: 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white shadow-lg shadow-orange-500/20 transition-all',
    btnSecondary: 'border-orange-200/80 dark:border-zinc-800/80 text-orange-700 dark:text-orange-400 hover:bg-orange-50/20 dark:hover:bg-zinc-800/20',
    accentColor: 'text-orange-500',
    fontClass: 'font-sans'
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Frost',
    gridBg: 'bg-sky-50/30 dark:bg-slate-950/15 border border-sky-100/60 dark:border-slate-800/30 p-2.5 rounded-[2.5rem] shadow-inner relative aspect-square select-none touch-none overflow-hidden',
    cellDefault: 'bg-white dark:bg-slate-900 border-sky-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-sky-50/30 dark:hover:bg-slate-800/80 hover:scale-[1.03] shadow-sm',
    cellSelected: 'bg-sky-50/60 dark:bg-sky-950/20 border-sky-300 text-sky-600 dark:text-sky-400',
    cellLastSelected: 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-500/20',
    targetCardBg: 'w-full border-none shadow-xl rounded-[2rem] overflow-hidden bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 text-white mb-6',
    targetText: 'text-6xl font-black tracking-tight text-white',
    targetLabel: 'absolute top-3 left-3 bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider text-white',
    textColor: 'text-slate-600 dark:text-slate-300',
    btnPrimary: 'bg-sky-600 hover:bg-sky-505 text-white shadow-lg shadow-sky-600/15 transition-all',
    btnSecondary: 'border-sky-200/80 dark:border-slate-800/80 text-sky-700 dark:text-sky-400 hover:bg-sky-50/25 dark:hover:bg-slate-800/25',
    accentColor: 'text-sky-500',
    fontClass: 'font-sans'
  }
};
