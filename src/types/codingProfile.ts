export interface ContributionDay {
  date: string;   // "YYYY-MM-DD"
  count: number;
}

export interface LeetCodeBadge {
  id?: string;
  name: string;
  icon?: string;
  category?: string;
  creationDate?: string;
}

export interface LeetCodeStats {
  username?: string;
  name?: string | null;
  avatar?: string | null;
  countryName?: string | null;
  company?: string | null;
  school?: string | null;

  // Problem Solving Stats
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  totalQuestions?: number;
  easyTotal?: number;
  mediumTotal?: number;
  hardTotal?: number;
  acceptanceRate?: number | null;
  ranking?: number | null; // Global Problem Solving Rank
  reputation?: number | null;
  contributionPoints?: number | null;

  // Contest Stats
  contestRating?: number | null;
  contestGlobalRanking?: number | null;
  contestTopPercentage?: number | null;
  contestsAttended?: number | null;
  contestBadge?: string | null;

  // Badges
  badges?: LeetCodeBadge[];

  last_updated?: string;
}

export interface CodeforcesBadge {
  name: string;
  category?: string;
  description?: string;
}

export interface CodeforcesStats {
  handle: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  city?: string | null;
  organization?: string | null;

  // Rating & Ranking
  rating: number;
  maxRating: number;
  rank: string;
  maxRank?: string | null;
  contribution?: number | null;
  friendOfCount?: number | null;
  registrationDate?: string | null;

  // Problem Solving Stats
  totalSolved: number;
  totalSubmissions?: number | null;
  problemDifficultyBreakdown?: Record<string, number> | null;
  verdictBreakdown?: {
    ok: number;
    wrongAnswer: number;
    timeLimitExceeded: number;
    other: number;
  } | null;
  topTags?: Array<{ name: string; count: number }> | null;

  // Contest Stats
  contestsAttended?: number | null;
  bestRank?: number | null;
  maxRatingGain?: number | null;
  badges?: CodeforcesBadge[];

  last_updated?: string;
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

  // Contribution Heatmap (365 days of day-by-day commit counts)
  contributionData?: ContributionDay[];

  lastFetchedAt?: string;
}

export interface CodeChefBadge {
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  category?: string;
}

export interface CodeChefContestHistory {
  code: string;
  name: string;
  rating: number;
  rank: number;
  date?: string;
}

export interface CodeChefStats {
  username?: string;
  name?: string | null;
  avatar?: string | null;
  countryName?: string | null;
  countryFlag?: string | null;
  institution?: string | null;
  studentOrProfessional?: string | null;
  
  // Ratings & Ranks
  rating: number;
  maxRating?: number;
  stars: string;
  division?: string | null;
  globalRank?: number;
  countryRank?: number;
  dsaRating?: number | null;
  
  // Problem Solving Stats
  totalSolved?: number;
  fullySolved?: number;
  partiallySolved?: number;
  problemDifficultyBreakdown?: {
    school?: number;
    easy?: number;
    medium?: number;
    hard?: number;
    challenge?: number;
  };
  
  // Contests & Badges
  contestsParticipated?: number;
  badges?: CodeChefBadge[];
  recentContests?: CodeChefContestHistory[];
  
  last_updated?: string;
}

export interface CodewarsLanguageStat {
  language: string;
  rankName?: string;
  score?: number;
  totalCompleted?: number;
}

export interface CodewarsBadge {
  name: string;
  category?: string;
  description?: string;
}

export interface CodewarsStats {
  username: string;
  name?: string | null;
  clan?: string | null;
  honor: number;
  rank: string;
  rankColor?: string | null;
  score?: number | null;
  leaderboardPosition?: number | null;
  totalSolved: number;
  totalAuthored?: number | null;
  languages?: CodewarsLanguageStat[] | null;
  badges?: CodewarsBadge[] | null;
  last_updated?: string;
}

export interface GeeksForGeeksStats {
  user_id?: string;
  username?: string;
  gfg_username?: string;
  profile_image?: string | null;
  display_name?: string | null;
  institution?: string | null;
  codingScore: number;
  totalSolved: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  rank?: number | string | null;
  institutionRank?: number | string | null;
  badges?: string[] | number | null;
  streak?: number;
  profile_url?: string;
  last_updated?: string;
}

export interface AtCoderStats {
  username?: string;
  rating: number;
  maxRating: number;
  rank: string;
  totalSolved: number;
  competitionsCount?: number;
  acceptedCountRank?: number | null;
  ratedPointSum?: number;
  ratedPointSumRank?: number | null;
  highestPerformance?: number;
  bestRank?: number;
  last_updated?: string;
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
  codewars?: CodewarsStats | null;
  geeksforgeeks?: GeeksForGeeksStats | null;
  atcoder?: AtCoderStats | null;
  overall: OverallStats;
  lastFetchedAt?: string | null;
  leetcodeError?: string | null;
  codeforcesError?: string | null;
  githubError?: string | null;
  codechefError?: string | null;
  codewarsError?: string | null;
  geeksforgeeksError?: string | null;
  atcoderError?: string | null;
  leetcodeUsername?: string | null;
  codeforcesHandle?: string | null;
  githubUsername?: string | null;
  githubToken?: string | null;
  hackerrankUsername?: string | null;
  codechefUsername?: string | null;
  codewarsUsername?: string | null;
  geeksforgeeksUsername?: string | null;
  atcoderUsername?: string | null;
  codolioUsername?: string | null;
  kaggleUsername?: string | null;
}

export interface GitHubSearchResultItem {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: string;
  score?: number;
}

export interface UserCodingProfilesRecord {
  user_id: string;
  leetcode_username?: string | null;
  codeforces_handle?: string | null;
  github_username?: string | null;
  github_token?: string | null;
  hackerrank_username?: string | null;
  codechef_username?: string | null;
  codewars_username?: string | null;
  geeksforgeeks_username?: string | null;
  atcoder_username?: string | null;
  codolio_username?: string | null;
  kaggle_username?: string | null;
  leetcode_data?: LeetCodeStats | null;
  codeforces_data?: CodeforcesStats | null;
  github_data?: GitHubStats | null;
  codechef_data?: CodeChefStats | null;
  codewars_data?: CodewarsStats | null;
  geeksforgeeks_data?: GeeksForGeeksStats | null;
  atcoder_data?: AtCoderStats | null;
  overall_data?: OverallStats | null;
  leetcode_error?: string | null;
  codeforces_error?: string | null;
  codechef_error?: string | null;
  codewars_error?: string | null;
  geeksforgeeks_error?: string | null;
  atcoder_error?: string | null;
  last_fetched_at?: string | null;
  updated_at?: string | null;
}

