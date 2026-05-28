export type HeraldicIcon = 'shield' | 'swords' | 'crown' | 'star' | 'flame' | 'owl';
export type BannerPattern = 'solid' | 'stars' | 'waves' | 'stripes' | 'cosmos';

export interface BannerStyle {
    bgColor: string;       // hex or theme class, e.g. '#6366f1' or 'cosmos'
    icon: HeraldicIcon;
    pattern: BannerPattern;
    borderColor?: string;
}

export type ClanMemberRole = 'leader' | 'officer' | 'member';

export interface Clan {
    id: string;
    class_id: string;
    name: string;
    tag: string;
    banner_style: BannerStyle;
    leader_id: string | null;
    level: number;
    total_cxp: number;
    trophies_count: number;
    created_at: string;
    updated_at: string;
}

export interface ClanMember {
    id: string;
    clan_id: string;
    user_id: string;
    role: ClanMemberRole;
    joined_at: string;
    // Enhanced joined fields
    student_name?: string;
    register_number?: string;
    profile_image?: string;
    email?: string;
}

export interface ClanBattle {
    id: string;
    class_id: string;
    clan_a_id: string;
    clan_b_id: string;
    clan_a_score: number;
    clan_b_score: number;
    started_at: string;
    expires_at: string;
    status: 'active' | 'completed';
    winner_id: string | null;
    created_at: string;
    updated_at: string;
    // Enhanced joined fields
    clan_a_name?: string;
    clan_a_banner?: BannerStyle;
    clan_b_name?: string;
    clan_b_banner?: BannerStyle;
}
