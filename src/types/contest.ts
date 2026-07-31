export type PlatformName = 
  | 'LeetCode'
  | 'Codeforces'
  | 'CodeChef'
  | 'AtCoder'
  | 'HackerRank'
  | 'HackerEarth'
  | 'Kaggle'
  | 'Other';

export type ContestStatus = 'UPCOMING' | 'CODING' | 'ENDED';

export interface Contest {
  id: string;
  name: string;
  url: string;
  platform: PlatformName;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  durationSeconds: number;
  status: ContestStatus;
  in24Hours?: boolean;
}

export interface ContestFilter {
  platform: PlatformName | 'ALL';
  status: ContestStatus | 'ALL';
  searchQuery: string;
  sortBy: 'startTime' | 'duration' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface PlatformConfig {
  name: PlatformName;
  iconName: string;
  color: string; // Tailwind color class or hex
  badgeBg: string;
  badgeText: string;
  website: string;
}
