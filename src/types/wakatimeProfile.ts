export interface WakaTimeLanguage {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
  color?: string;
}

export interface WakaTimeEditor {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

export interface WakaTimeCategory {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

export interface WakaTimeDay {
  date: string;
  text: string;
  total_seconds: number;
}

export interface WakaTimeProject {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

export interface WakaTimeOS {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

export interface WakaTimeMachine {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

export interface WakaTimeBestDay {
  date?: string;
  text?: string;
  total_seconds?: number;
}

export interface WakaTimeBadge {
  name: string;
  category: string;
  description: string;
  icon?: string;
}

export interface WakaTimeStats {
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  location?: string | null;
  timezone?: string | null;
  website?: string | null;
  githubUsername?: string | null;
  twitterUsername?: string | null;
  linkedinUsername?: string | null;
  human_readable_total: string;
  daily_average: string;
  total_seconds: number;
  all_time_total?: string | null;
  badge_url?: string | null;
  languages: WakaTimeLanguage[];
  editors: WakaTimeEditor[];
  categories: WakaTimeCategory[];
  projects?: WakaTimeProject[];
  operating_systems?: WakaTimeOS[];
  machines?: WakaTimeMachine[];
  badges?: WakaTimeBadge[];
  best_day?: WakaTimeBestDay | null;
  daily_breakdown?: WakaTimeDay[];
  range?: string;
  created_at?: string | null;
  last_updated?: string;
  api_key_used?: boolean;
  status?: string;
}
