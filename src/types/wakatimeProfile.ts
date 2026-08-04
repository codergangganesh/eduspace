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

export interface WakaTimeBestDay {
  date?: string;
  text?: string;
  total_seconds?: number;
}

export interface WakaTimeStats {
  username: string;
  human_readable_total: string;
  daily_average: string;
  total_seconds: number;
  languages: WakaTimeLanguage[];
  editors: WakaTimeEditor[];
  categories: WakaTimeCategory[];
  projects?: WakaTimeProject[];
  operating_systems?: WakaTimeOS[];
  best_day?: WakaTimeBestDay | null;
  daily_breakdown?: WakaTimeDay[];
  range?: string;
  last_updated?: string;
  api_key_used?: boolean;
  status?: string;
}
