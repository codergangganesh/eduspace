import { HuggingFaceStats } from "./huggingFaceProfile";
import { ChessStats } from "./chessProfile";
import { CredlyStats } from "./credlyProfile";
import { WakaTimeStats } from "./wakatimeProfile";

export type { HuggingFaceStats } from "./huggingFaceProfile";
export type { ChessStats } from "./chessProfile";
export type { CredlyStats } from "./credlyProfile";
export type { WakaTimeStats } from "./wakatimeProfile";

export interface ContributionDay {
  date: string;   // "YYYY-MM-DD"
  count: number;
}

export interface LeetCodeBadge {
  id?: string;
  name: string;
  shortName?: string;
  displayName?: string;
  icon?: string;
  category?: string;
  creationDate?: string;
  description?: string;
  hoverText?: string;
}

export interface LeetCodeContestHistoryItem {
  name: string;
  rating: number;
  rank?: number;
  problemsSolved?: number;
  totalProblems?: number;
  date?: string;
  trend?: string;
}

export interface LeetCodeStats {
  username?: string;
  name?: string | null;
  avatar?: string | null;
  aboutMe?: string | null;
  countryName?: string | null;
  company?: string | null;
  school?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;

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
  starRating?: number | null;

  // Contest Stats
  contestRating?: number | null;
  contestGlobalRanking?: number | null;
  contestTopPercentage?: number | null;
  contestsAttended?: number | null;
  contestBadge?: string | null;
  recentContests?: LeetCodeContestHistoryItem[];

  // Activity & Badges
  streak?: number | null;
  totalActiveDays?: number | null;
  submissionCalendar?: string | null;
  badges?: LeetCodeBadge[];
  languageStats?: Array<{ languageName: string; problemsSolved: number }>;
  skillStats?: {
    fundamental?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    intermediate?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    advanced?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  };

  profile_url?: string;
  last_updated?: string;
}

export interface CodeforcesBadge {
  name: string;
  category?: string;
  description?: string;
  icon?: string;
}

export interface CodeforcesContestHistoryItem {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  date?: string;
  ratingUpdateTimeSeconds?: number;
}

export interface CodeforcesStats {
  handle: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  titlePhoto?: string | null;
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
  lastOnlineTime?: string | null;

  // Problem Solving Stats
  totalSolved: number;
  totalSubmissions?: number | null;
  acceptanceRate?: number | null;
  problemDifficultyBreakdown?: Record<string, number> | null;
  verdictBreakdown?: {
    ok: number;
    wrongAnswer: number;
    timeLimitExceeded: number;
    other: number;
  } | null;
  topTags?: Array<{ name: string; count: number }> | null;
  languages?: Array<{ language: string; count: number }> | null;

  // Contest Stats
  contestsAttended?: number | null;
  bestRank?: number | null;
  maxRatingGain?: number | null;
  recentContests?: CodeforcesContestHistoryItem[];
  badges?: CodeforcesBadge[];

  profile_url?: string;
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
  
  profile_url?: string;
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
  avatar?: string | null;
  honor: number;
  rank: string;
  rankColor?: string | null;
  score?: number | null;
  leaderboardPosition?: number | null;
  totalSolved: number;
  totalAuthored?: number | null;
  languages?: CodewarsLanguageStat[] | null;
  badges?: CodewarsBadge[] | null;
  recentChallenges?: Array<{
    id: string;
    name: string;
    slug: string;
    completedAt: string;
    completedLanguages: string[];
  }>;
  profile_url?: string;
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

export interface AtCoderContestHistory {
  name?: string;
  code?: string;
  rating: number;
  rank?: number;
  performance?: number;
  date?: string;
}

export interface AtCoderStats {
  username?: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  countryFlag?: string | null;
  affiliation?: string | null;
  birthYear?: number | string | null;
  wins?: number | null;
  rating: number;
  maxRating: number;
  rank: string;
  globalRank?: number | null;
  totalSolved: number;
  competitionsCount?: number;
  totalCompetitions?: number;
  acceptedCountRank?: number | null;
  ratedPointSum?: number;
  ratedPointSumRank?: number | null;
  highestPerformance?: number;
  bestRank?: number;
  lastCompeted?: string | null;
  recentContests?: AtCoderContestHistory[];
  contestHistory?: AtCoderContestHistory[];

  // Heuristic Statistics
  heuristicRating?: number | null;
  heuristicMaxRating?: number | null;
  heuristicRank?: string | null;
  heuristicCompetitionsCount?: number;
  heuristicTotalCompetitions?: number;
  heuristicHighestPerformance?: number | null;
  heuristicBestRank?: number | null;
  heuristicRecentContests?: AtCoderContestHistory[];

  profile_url?: string;
  last_updated?: string;
}

export interface HackerRankBadge {
  badge_name: string;
  stars: number;
  icon?: string;
  category?: string;
  solved?: number;
}

export interface HackerRankCertificate {
  heading: string;
  level?: string;
  certificate_url?: string;
  earned_at?: string;
}

export interface HackerRankStats {
  username: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  school?: string | null;
  level?: number | null;
  totalSolved: number;
  badgesCount: number;
  totalStars?: number;
  badges?: HackerRankBadge[];
  certificatesCount: number;
  certificates?: HackerRankCertificate[];
  globalRank?: number | null;
  score?: number | null;
  profile_url?: string;
  last_updated?: string;
}

export interface HackerEarthBadge {
  name: string;
  icon?: string;
  description?: string;
}

export interface HackerEarthStats {
  username: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  location?: string | null;
  company?: string | null;
  role?: string | null;
  education?: string | null;
  skills?: string[];
  points?: number;
  rating: number;
  maxRating?: number;
  rank?: string | null;
  globalRank?: number | null;
  totalSolved: number;
  solutionsSubmitted?: number;
  contestsAttended?: number;
  topPercentiles?: { title: string; percentile: string }[];
  badges?: HackerEarthBadge[];
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
  hackerrank?: HackerRankStats | null;
  hackerearth?: HackerEarthStats | null;
  huggingface?: HuggingFaceStats | null;
  chess?: ChessStats | null;
  credly?: CredlyStats | null;
  wakatime?: WakaTimeStats | null;
  overall: OverallStats;
  lastFetchedAt?: string | null;
  leetcodeError?: string | null;
  codeforcesError?: string | null;
  githubError?: string | null;
  codechefError?: string | null;
  codewarsError?: string | null;
  geeksforgeeksError?: string | null;
  atcoderError?: string | null;
  hackerrankError?: string | null;
  hackerearthError?: string | null;
  huggingfaceError?: string | null;
  chessError?: string | null;
  credlyError?: string | null;
  wakatimeError?: string | null;
  leetcodeUsername?: string | null;
  codeforcesHandle?: string | null;
  githubUsername?: string | null;
  githubToken?: string | null;
  hackerrankUsername?: string | null;
  hackerearthUsername?: string | null;
  codechefUsername?: string | null;
  codewarsUsername?: string | null;
  geeksforgeeksUsername?: string | null;
  atcoderUsername?: string | null;
  codolioUsername?: string | null;
  huggingfaceUsername?: string | null;
  chessUsername?: string | null;
  credlyUsername?: string | null;
  wakatimeUsername?: string | null;
  wakatimeApiKey?: string | null;
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
  hackerearth_username?: string | null;
  codechef_username?: string | null;
  codewars_username?: string | null;
  geeksforgeeks_username?: string | null;
  atcoder_username?: string | null;
  codolio_username?: string | null;
  huggingface_username?: string | null;
  chess_username?: string | null;
  linkedin_username?: string | null;
  leetcode_data?: LeetCodeStats | null;
  codeforces_data?: CodeforcesStats | null;
  github_data?: GitHubStats | null;
  codechef_data?: CodeChefStats | null;
  codewars_data?: CodewarsStats | null;
  geeksforgeeks_data?: GeeksForGeeksStats | null;
  atcoder_data?: AtCoderStats | null;
  hackerrank_data?: HackerRankStats | null;
  hackerearth_data?: HackerEarthStats | null;
  huggingface_data?: HuggingFaceStats | null;
  chess_data?: ChessStats | null;
  overall_data?: OverallStats | null;
  linkedin_connected_at?: string | null;
  linkedin_last_synced_at?: string | null;
  linkedin_oauth_state?: string | null;
  linkedin_oauth_state_created_at?: string | null;
  leetcode_error?: string | null;
  codeforces_error?: string | null;
  codechef_error?: string | null;
  codewars_error?: string | null;
  geeksforgeeks_error?: string | null;
  atcoder_error?: string | null;
  hackerrank_error?: string | null;
  hackerearth_error?: string | null;
  huggingface_error?: string | null;
  linkedin_error?: string | null;
  chess_error?: string | null;
  last_fetched_at?: string | null;
  updated_at?: string | null;
}

