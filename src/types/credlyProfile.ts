export interface CredlyBadge {
  id: string;
  name: string;
  image_url: string;
  issuer_name?: string;
  issuer_image_url?: string;
  issued_at?: string;
  expires_at?: string | null;
  badge_url?: string;
  description?: string;
}

export interface CredlyStats {
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  totalBadges: number;
  badges: CredlyBadge[];
  last_updated?: string;
}
