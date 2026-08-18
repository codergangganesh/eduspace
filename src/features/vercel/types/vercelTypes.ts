export interface VercelDeploymentSummary {
  id?: string;
  uid?: string;
  name: string;
  url: string | null;
  readyState?: "READY" | "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "CANCELED" | string;
  state?: string;
  createdAt?: number | string;
  created?: number | string;
  target?: "production" | "preview" | string | null;
  inspectorUrl?: string | null;
}

export interface VercelProjectLink {
  type: string;
  repo: string;
  org?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  createdAt: number;
  updatedAt: number;
  link?: VercelProjectLink | null;
  targets?: Record<string, any> | null;
  latestDeployments?: VercelDeploymentSummary[];
}

export interface VercelFrameworkStat {
  framework: string;
  count: number;
}

export interface VercelCachedData {
  totalProjects: number;
  totalDeployments: number;
  projects: VercelProject[];
  recentDeployments: VercelDeploymentSummary[];
  topFrameworks: VercelFrameworkStat[];
  lastSynced: string;
}

export interface VercelConnectionData {
  connected: boolean;
  userId?: string;
  vercelUserId?: string;
  vercelUsername?: string;
  vercelName?: string;
  vercelAvatarUrl?: string | null;
  connectedAt?: string;
  lastSyncedAt?: string;
  cachedData?: VercelCachedData | null;
}

export interface VercelOAuthStartResponse {
  success: boolean;
  authUrl?: string;
  state?: string;
  error?: string;
}

export interface VercelActionResponse<T = VercelConnectionData> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
