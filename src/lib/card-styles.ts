import { cn } from "@/lib/utils";

// Palette of soft, professional colors for cards
// Each entry has background, border, and accent styles for light/dark modes
export const CARD_COLORS = [
    {
        bg: "bg-blue-50/80 dark:bg-blue-950/20",
        border: "border-blue-100 dark:border-blue-900/30",
        accent: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
        bg: "bg-emerald-50/80 dark:bg-emerald-950/20",
        border: "border-emerald-100 dark:border-emerald-900/30",
        accent: "text-emerald-600 dark:text-emerald-400",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    },
    {
        bg: "bg-violet-50/80 dark:bg-violet-950/20",
        border: "border-violet-100 dark:border-violet-900/30",
        accent: "text-violet-600 dark:text-violet-400",
        iconBg: "bg-violet-100 dark:bg-violet-900/40",
    },
    {
        bg: "bg-amber-50/80 dark:bg-amber-950/20",
        border: "border-amber-100 dark:border-amber-900/30",
        accent: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
        bg: "bg-rose-50/80 dark:bg-rose-950/20",
        border: "border-rose-100 dark:border-rose-900/30",
        accent: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
    },
    {
        bg: "bg-cyan-50/80 dark:bg-cyan-950/20",
        border: "border-cyan-100 dark:border-cyan-900/30",
        accent: "text-cyan-600 dark:text-cyan-400",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
    },
    {
        bg: "bg-indigo-50/80 dark:bg-indigo-950/20",
        border: "border-indigo-100 dark:border-indigo-900/30",
        accent: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    },
    {
        bg: "bg-teal-50/80 dark:bg-teal-950/20",
        border: "border-teal-100 dark:border-teal-900/30",
        accent: "text-teal-600 dark:text-teal-400",
        iconBg: "bg-teal-100 dark:bg-teal-900/40",
    },
    {
        bg: "bg-fuchsia-50/80 dark:bg-fuchsia-950/20",
        border: "border-fuchsia-100 dark:border-fuchsia-900/30",
        accent: "text-fuchsia-600 dark:text-fuchsia-400",
        iconBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    },
    {
        bg: "bg-sky-50/80 dark:bg-sky-950/20",
        border: "border-sky-100 dark:border-sky-900/30",
        accent: "text-sky-600 dark:text-sky-400",
        iconBg: "bg-sky-100 dark:bg-sky-900/40",
    }
];

// Simple hashing function to get consistent color index from string ID
export function getCardColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CARD_COLORS.length;
    return CARD_COLORS[index];
}

export function getCardColorByIndex(index: number) {
    return CARD_COLORS[index % CARD_COLORS.length];
}

// Helper to get consistent background styling
export function getCardStyle(id: string, className?: string) {
    const colors = getCardColor(id);
    return cn(
        "relative overflow-hidden transition-all duration-300",
        "backdrop-blur-sm",
        colors.bg,
        colors.border,
        className
    );
}
