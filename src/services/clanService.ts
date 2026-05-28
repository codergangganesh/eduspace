import { supabase } from "@/integrations/supabase/client";
import { Clan, ClanMember, ClanBattle, BannerStyle } from "@/types/clans";

const db = supabase as any;

export class ClanService {
  /**
   * Fetches all clans enrolled in a specific class
   */
  static async fetchClans(classId: string): Promise<Clan[]> {
    const { data, error } = await db
      .from("clans")
      .select("*")
      .eq("class_id", classId)
      .order("total_cxp", { ascending: false });

    if (error) {
      console.error("Error fetching class clans:", error);
      return [];
    }
    return data || [];
  }

  /**
   * Fetches the active clan membership of a student
   */
  static async fetchMyClan(userId: string): Promise<{ clan: Clan; membership: ClanMember } | null> {
    const { data: memberData, error: memberError } = await db
      .from("clan_members")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (memberError || !memberData) {
      return null;
    }

    const { data: clanData, error: clanError } = await db
      .from("clans")
      .select("*")
      .eq("id", memberData.clan_id)
      .single();

    if (clanError || !clanData) {
      return null;
    }

    return {
      clan: clanData,
      membership: memberData
    };
  }

  /**
   * Fetches members belonging to a clan, enriched with user profiles
   */
  static async fetchClanMembers(clanId: string): Promise<ClanMember[]> {
    const { data: members, error } = await db
      .from("clan_members")
      .select("*")
      .eq("clan_id", clanId);

    if (error || !members) {
      console.error("Error fetching clan members:", error);
      return [];
    }

    const userIds = members.map(m => m.user_id);
    if (userIds.length === 0) return [];

    // Fetch names and avatar details
    const [{ data: studentProfiles }, { data: appProfiles }] = await Promise.all([
      db
        .from("student_profiles")
        .select("user_id, full_name, profile_image, register_number")
        .in("user_id", userIds),
      db
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds)
    ]);

    const profilesMap = new Map<string, { name: string; avatar?: string; regNo?: string }>();
    studentProfiles?.forEach((p: any) => {
      profilesMap.set(p.user_id, {
        name: p.full_name,
        avatar: p.profile_image || undefined,
        regNo: p.register_number || undefined
      });
    });

    appProfiles?.forEach((p: any) => {
      const existing = profilesMap.get(p.user_id);
      profilesMap.set(p.user_id, {
        name: existing?.name || p.full_name,
        avatar: existing?.avatar || p.avatar_url || undefined,
        regNo: existing?.regNo
      });
    });

    return members.map(m => {
      const profile = profilesMap.get(m.user_id);
      return {
        ...m,
        student_name: profile?.name || "Student",
        profile_image: profile?.avatar,
        register_number: profile?.regNo || "N/A"
      };
    });
  }

  /**
   * Creates a new clan and inserts the creator as the 'leader'
   */
  static async createClan(
    name: string,
    tag: string,
    classId: string,
    leaderId: string,
    banner: BannerStyle
  ): Promise<{ clan: Clan; membership: ClanMember } | null> {
    try {
      // 1. Create the clan entry
      const { data: clan, error: clanError } = await db
        .from("clans")
        .insert({
          class_id: classId,
          name,
          tag,
          leader_id: leaderId,
          banner_style: banner as any
        })
        .select()
        .single();

      if (clanError || !clan) {
        console.error("Error creating clan record:", clanError);
        return null;
      }

      // 2. Add the leader to clan_members
      const { data: member, error: memberError } = await db
        .from("clan_members")
        .insert({
          clan_id: clan.id,
          user_id: leaderId,
          role: "leader"
        })
        .select()
        .single();

      if (memberError || !member) {
        console.error("Error adding leader member:", memberError);
        // Rollback clan creation
        await db.from("clans").delete().eq("id", clan.id);
        return null;
      }

      return {
        clan,
        membership: member
      };
    } catch (err) {
      console.error("Failed to create clan transaction:", err);
      return null;
    }
  }

  /**
   * Adds a user to a clan as a regular member
   */
  static async joinClan(clanId: string, userId: string): Promise<ClanMember | null> {
    const { data, error } = await db
      .from("clan_members")
      .insert({
        clan_id: clanId,
        user_id: userId,
        role: "member"
      })
      .select()
      .single();

    if (error) {
      console.error("Error joining clan:", error);
      return null;
    }
    return data || null;
  }

  /**
   * Removes a member from a clan (or disbands if the leader leaves)
   */
  static async leaveClan(clanId: string, userId: string, role: string): Promise<boolean> {
    if (role === "leader") {
      // Disband clan completely
      const { error } = await db
        .from("clans")
        .delete()
        .eq("id", clanId);
      return !error;
    }

    const { error } = await db
      .from("clan_members")
      .delete()
      .eq("clan_id", clanId)
      .eq("user_id", userId);

    return !error;
  }

  /**
   * Updates a clan's banner styling
   */
  static async updateBanner(clanId: string, banner: BannerStyle): Promise<boolean> {
    const { error } = await db
      .from("clans")
      .update({
        banner_style: banner as any,
        updated_at: new Date().toISOString()
      })
      .eq("id", clanId);

    return !error;
  }

  /**
   * Fetches active or completed battles for a class
   */
  static async fetchActiveBattle(classId: string, clanId: string): Promise<ClanBattle | null> {
    const { data: battles, error } = await db
      .from("clan_battles")
      .select("*")
      .eq("class_id", classId)
      .eq("status", "active")
      .or(`clan_a_id.eq.${clanId},clan_b_id.eq.${clanId}`)
      .maybeSingle();

    if (error || !battles) {
      return null;
    }

    // Enrich with competing clan banners and details
    const { data: clans } = await db
      .from("clans")
      .select("id, name, banner_style")
      .in("id", [battles.clan_a_id, battles.clan_b_id]);

    const clanAMetadata = clans?.find(c => c.id === battles.clan_a_id);
    const clanBMetadata = clans?.find(c => c.id === battles.clan_b_id);

    return {
      ...battles,
      clan_a_name: clanAMetadata?.name || "Rival Clan A",
      clan_a_banner: clanAMetadata?.banner_style as any,
      clan_b_name: clanBMetadata?.name || "Rival Clan B",
      clan_b_banner: clanBMetadata?.banner_style as any
    };
  }

  /**
   * Fetches Course ranking leaderboards
   */
  static async fetchLeaderboard(classId: string): Promise<Clan[]> {
    return this.fetchClans(classId);
  }
}
