export interface ChessRatingStats {
  currentRating: number;
  highestRating: number;
  highestDate?: string | null;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
}

export interface ChessGame {
  url: string;
  pgn?: string;
  timeControl: string;
  endTime: number; // Unix timestamp
  timeClass: 'bullet' | 'blitz' | 'rapid' | 'daily' | string;
  rules: string;
  white: { username: string; rating: number; result: string };
  black: { username: string; rating: number; result: string };
  userColor: 'white' | 'black';
  opponent: { username: string; rating: number };
  result: 'win' | 'loss' | 'draw';
}

export interface ChessAchievements {
  league?: string | null;
  titles?: string[];
  awardsCount?: number;
  verified: boolean;
  highestPuzzleRating?: number;
  puzzleRushBest?: number;
}

export interface ChessStats {
  username: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  countryCode?: string | null;
  countryFlagUrl?: string | null;
  location?: string | null;
  league?: string | null;
  followers?: number;
  joinedDate?: string | null;
  lastOnline?: string | null;
  verified: boolean;
  profileUrl: string;
  title?: string | null; // e.g. GM, IM, FM, CM, NM, WGM
  status?: string | null;

  // Mode Ratings
  bullet?: ChessRatingStats | null;
  blitz?: ChessRatingStats | null;
  rapid?: ChessRatingStats | null;
  daily?: ChessRatingStats | null;
  chess960?: ChessRatingStats | null;
  puzzle?: ChessRatingStats | null;

  // Overall Statistics
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  overallWinRate: number;
  highestRatingAchieved: number;
  favoriteTimeControl?: string | null;
  currentLeague?: string | null;

  // Achievements
  achievements?: ChessAchievements;

  // Recent Activity
  lastPlayedDate?: string | null;
  recentGames?: ChessGame[];
  recentResultsSummary?: {
    wins: number;
    losses: number;
    draws: number;
  };
}
