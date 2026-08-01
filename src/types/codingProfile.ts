export interface LeetCodeStats {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface CodeforcesStats {
  totalSolved: number;
  rating: number;
  maxRating: number;
  rank: string;
}

export interface GitHubRepoItem {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  url: string;
  updatedAt: string;
  isFork?: boolean;
}

export interface GitHubLanguageShare {
  language: string;
  count: number;
  percentage: number;
}

export interface GitHubOrg {
  login: string;
  avatarUrl: string;
  description?: string | null;
  url: string;
}

export interface GitHubActivityEvent {
  id: string;
  type: string;
  repoName: string;
  repoUrl: string;
  action?: string;
  message?: string;
  createdAt: string;
}

export interface GitHubAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface GitHubStreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface GitHubStats {
  username?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
  email?: string | null;
  twitterUsername?: string | null;
  hireable?: boolean | null;
  publicRepos: number;
  publicGists?: number;
  followers: number;
  following?: number;
  createdAt?: string;
  updatedAt?: string;
  htmlUrl?: string;

  // Aggregated Repo & Dev Stats
  totalStars?: number;
  totalForks?: number;
  totalWatchers?: number;
  totalOpenIssues?: number;

  // Languages, Repos & Orgs
  topLanguages?: GitHubLanguageShare[];
  topRepos?: GitHubRepoItem[];
  organizations?: GitHubOrg[];

  // Activity Highlights
  recentEvents?: GitHubActivityEvent[];
  recentCommitsCount?: number;
  recentPrsCount?: number;
  recentIssuesCount?: number;

  // Streak Tracker
  streak?: GitHubStreakInfo;

  // Achievements
  achievements?: GitHubAchievement[];

  lastFetchedAt?: string;
}

export interface CodeChefStats {
  rating: number;
  stars: string;
  totalSolved?: number;
}

export interface OverallStats {
  totalSolved: number;
  platformsConnectedCount?: number;
  githubToken?: string | null;
}

export interface CodingProfilesResponse {
  leetcode: LeetCodeStats | null;
  codeforces: CodeforcesStats | null;
  github?: GitHubStats | null;
  codechef?: CodeChefStats | null;
  overall: OverallStats;
  lastFetchedAt?: string | null;
  leetcodeError?: string | null;
  codeforcesError?: string | null;
  githubError?: string | null;
  codechefError?: string | null;
  leetcodeUsername?: string | null;
  codeforcesHandle?: string | null;
  githubUsername?: string | null;
  githubToken?: string | null;
  hackerrankUsername?: string | null;
  codechefUsername?: string | null;
  codolioUsername?: string | null;
  kaggleUsername?: string | null;
}

export interface UserCodingProfilesRecord {
  user_id: string;
  leetcode_username?: string | null;
  codeforces_handle?: string | null;
  github_username?: string | null;
  github_token?: string | null;
  hackerrank_username?: string | null;
  codechef_username?: string | null;
  codolio_username?: string | null;
  kaggle_username?: string | null;
  leetcode_data?: LeetCodeStats | null;
  codeforces_data?: CodeforcesStats | null;
  github_data?: GitHubStats | null;
  codechef_data?: CodeChefStats | null;
  overall_data?: OverallStats | null;
  leetcode_error?: string | null;
  codeforces_error?: string | null;
  last_fetched_at?: string | null;
  updated_at?: string | null;
}

