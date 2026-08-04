import React, { useState } from "react";
import { cn } from "@/lib/utils";

// Official Vector Brand Logos for 100% Offline & Instant Loading Reliability

export const LeetCodeLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.102 17.93a4.522 4.522 0 0 1-1.396 2.372 4.47 4.47 0 0 1-2.991 1.139 4.468 4.468 0 0 1-3.21-1.332L3.109 14.71a4.52 4.52 0 0 1-.954-1.639 4.444 4.444 0 0 1-.035-2.88 4.502 4.502 0 0 1 1.002-1.584l5.378-5.378a4.498 4.498 0 0 1 3.197-1.334c1.201 0 2.331.47 3.178 1.321l.006.006.918.918a.747.747 0 0 1-1.056 1.056l-.918-.918a3.003 3.003 0 0 0-2.128-.885 3.002 3.002 0 0 0-2.134.891L4.21 9.77a3.002 3.002 0 0 0-.668 1.056 2.96 2.96 0 0 0 .023 1.92 3.013 3.013 0 0 0 .637 1.093l5.395 5.397a2.98 2.98 0 0 0 2.14.888 2.98 2.98 0 0 0 1.994-.76 3.015 3.015 0 0 0 .931-1.581.75.75 0 1 1 1.47.337zm2.493-4.577a.75.75 0 0 1-.53-.22L13.111 8.18a.75.75 0 1 1 1.06-1.06l4.954 4.953a.75.75 0 0 1-.53 1.28z" fill="#FFA116" />
  </svg>
);

export const CodeforcesLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.5" y="9" width="5" height="12" rx="1.5" fill="#FFC90E" />
    <rect x="9.5" y="3" width="5" height="18" rx="1.5" fill="#3B5998" />
    <rect x="17.5" y="13.5" width="5" height="7.5" rx="1.5" fill="#CC0000" />
  </svg>
);

export const GitHubLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const HackerRankLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={cn("rounded-md overflow-hidden shrink-0", className)} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#0E141E" />
    <path d="M22 30H38V47H62V30H78V70H62V53H38V70H22V30Z" fill="#FFFFFF" />
    <rect x="52" y="30" width="26" height="40" fill="#00EA64" />
  </svg>
);

export const CredlyLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={cn("shrink-0", className)} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#F05A28" />
    <text x="50" y="58" fill="#FFFFFF" fontSize="25" fontWeight="bold" fontFamily="cursive, 'Brush Script MT', 'Segoe Script', sans-serif" textAnchor="middle">Credly</text>
  </svg>
);

export const CodeChefLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={cn("shrink-0", className)} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 46C25 40 25 24 38 18C43 12 57 12 62 18C75 24 75 40 70 46H30Z" fill="#FAF6F0" stroke="#4A3B32" strokeWidth="3" />
    <path d="M30 46C30 50 36 53 50 53C64 53 70 50 70 46" fill="#EDE4D8" stroke="#4A3B32" strokeWidth="2.5" />
    <path d="M42 20C40 28 42 42 42 46" stroke="#D5C5B5" strokeWidth="2" />
    <path d="M58 20C60 28 58 42 58 46" stroke="#D5C5B5" strokeWidth="2" />
    <text x="18" y="68" fill="#4A3B32" fontSize="22" fontWeight="900" fontFamily="sans-serif">&lt;</text>
    <text x="70" y="68" fill="#4A3B32" fontSize="22" fontWeight="900" fontFamily="sans-serif">&gt;</text>
    <circle cx="42" cy="64" r="3.5" fill="#4A3B32" />
    <circle cx="58" cy="64" r="3.5" fill="#4A3B32" />
    <path d="M36 73C42 71 48 75 50 73C52 75 58 71 64 73C68 77 56 81 50 76C44 81 32 77 36 73Z" fill="#4A3B32" />
  </svg>
);

export const GeeksforGeeksLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 2.3.88l-1.3 1.32A1.66 1.66 0 1 0 10.5 14.3h2.5v1.7h-3.5zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 2.3.88l-1.3 1.32A1.66 1.66 0 1 0 17.5 14.3h2.5v1.7h-3.5z" fill="#2F8D46"/>
  </svg>
);

export const CodewarsLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2zM4.5 9.8l6.75 3.4v6.6L4.5 16.4V9.8zm15 6.6l-6.75 3.4v-6.6l6.75-3.4v6.6z" fill="#B1361E"/>
  </svg>
);

export const AtCoderLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22h4l6-12 6 12h4L12 2zm0 6l-3.5 7h7L12 8z" fill="#222222"/>
  </svg>
);

export const HackerEarthLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#323754"/>
    <path d="M7 6v12h2.5v-4.5h5V18H17V6h-2.5v4.5h-5V6H7z" fill="#2C91D5"/>
  </svg>
);

export const HuggingFaceLogo = ({ className = "size-7" }: { className?: string }) => (
  <span className={cn("inline-flex items-center justify-center select-none text-xl leading-none", className)}>🤗</span>
);

export const ChessLogo = ({ className = "size-7" }: { className?: string }) => (
  <span className={cn("inline-flex items-center justify-center select-none text-xl leading-none", className)}>♟️</span>
);

export const WakaTimeLogo = ({ className = "size-7" }: { className?: string }) => (
  <svg className={cn("shrink-0", className)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#00E5FF" fillOpacity="0.15" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#00E5FF"/>
    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="#00E5FF"/>
  </svg>
);

export const BRAND_IMAGE_URLS: Record<string, string> = {
  leetcode: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/leetcode/leetcode-original.svg",
  codeforces: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeforces/codeforces-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg",
  codewars: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codewars/codewars-original.svg",
  codechef: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codechef/codechef-original.svg",
  geeksforgeeks: "https://media.geeksforgeeks.org/wp-content/cdn-uploads/gfg_200X200.png",
  atcoder: "https://img.atcoder.jp/assets/atcoder.png",
  hackerrank: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/hackerrank/hackerrank-original.svg",
  credly: "https://www.credly.com/assets/apple-touch-icon-180x180.png",
  wakatime: "https://wakatime.com/static/img/wakatime.svg",
};

export const PlatformVectorMap: Record<string, React.ComponentType<{ className?: string }>> = {
  leetcode: LeetCodeLogo,
  codeforces: CodeforcesLogo,
  github: GitHubLogo,
  codewars: CodewarsLogo,
  codechef: CodeChefLogo,
  geeksforgeeks: GeeksforGeeksLogo,
  atcoder: AtCoderLogo,
  hackerrank: HackerRankLogo,
  hackerearth: HackerEarthLogo,
  credly: CredlyLogo,
  wakatime: WakaTimeLogo,
  huggingface: HuggingFaceLogo,
  chess: ChessLogo,
};

export function UnifiedPlatformLogo({ platform, className = "size-7" }: { platform: string; className?: string }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = BRAND_IMAGE_URLS[platform.toLowerCase()];

  if (imageUrl && !hasError) {
    return (
      <img
        src={imageUrl}
        alt={platform}
        className={cn(className, "object-contain shrink-0 transition-transform duration-200")}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }

  const VectorFallback = PlatformVectorMap[platform.toLowerCase()] || LeetCodeLogo;
  return <VectorFallback className={className} />;
}
