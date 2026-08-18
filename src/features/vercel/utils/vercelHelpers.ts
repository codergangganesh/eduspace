export const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: "Next.js",
  react: "React",
  vite: "Vite",
  vue: "Vue.js",
  nuxtjs: "Nuxt",
  svelte: "Svelte",
  sveltekit: "SvelteKit",
  astro: "Astro",
  remix: "Remix",
  gatsby: "Gatsby",
  angular: "Angular",
  solidstart: "SolidStart",
  qwik: "Qwik",
  hugo: "Hugo",
  eleventy: "11ty",
  jekyll: "Jekyll",
  docusaurus: "Docusaurus",
  storybook: "Storybook",
  vanilla: "HTML/JS",
  other: "Custom",
};

export function formatFrameworkName(framework: string | null | undefined): string {
  if (!framework) return "Web App";
  const lower = framework.toLowerCase().trim();
  return FRAMEWORK_LABELS[lower] || (lower.charAt(0).toUpperCase() + lower.slice(1));
}

export function getDeploymentStatusInfo(state: string | null | undefined): {
  label: string;
  color: "emerald" | "amber" | "rose" | "blue" | "slate";
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  const normalized = (state || "").toUpperCase();

  switch (normalized) {
    case "READY":
    case "ACTIVE":
      return {
        label: "Ready",
        color: "emerald",
        bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
        textClass: "text-emerald-600 dark:text-emerald-400",
        borderClass: "border-emerald-500/30",
      };
    case "BUILDING":
    case "INITIALIZING":
    case "QUEUED":
      return {
        label: "Building",
        color: "amber",
        bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
        textClass: "text-amber-600 dark:text-amber-400",
        borderClass: "border-amber-500/30",
      };
    case "ERROR":
    case "CANCELED":
      return {
        label: "Failed",
        color: "rose",
        bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
        textClass: "text-rose-600 dark:text-rose-400",
        borderClass: "border-rose-500/30",
      };
    default:
      return {
        label: state || "Deployed",
        color: "slate",
        bgClass: "bg-slate-500/10 dark:bg-slate-500/20",
        textClass: "text-muted-foreground",
        borderClass: "border-slate-500/30",
      };
  }
}

export function formatTimeAgo(dateStringOrTimestamp: string | number | null | undefined): string {
  if (!dateStringOrTimestamp) return "Never";
  const date = new Date(dateStringOrTimestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  if (isNaN(diffInMs)) return "Recent";

  const diffInSec = Math.floor(diffInMs / 1000);
  if (diffInSec < 60) return "Just now";
  
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
