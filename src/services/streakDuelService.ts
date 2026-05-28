import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface StreakDuel {
  id: string;
  challenger_id: string;
  defender_id: string;
  class_id: string;
  status: 'pending' | 'active' | 'rejected' | 'completed';
  challenger_start_streak: number;
  defender_start_streak: number;
  challenger_current_streak: number;
  defender_current_streak: number;
  challenger_score: number;
  defender_score: number;
  winner_id: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined metadata
  challenger_name?: string;
  challenger_avatar?: string;
  defender_name?: string;
  defender_avatar?: string;
  class_name?: string;
  course_code?: string;
}

export interface Classmate {
  student_id: string;
  student_name: string;
  register_number: string;
  email: string;
  class_id: string;
  class_name: string;
  course_code: string;
  profile_image?: string;
  bio?: string;
  current_streak?: number;
}

type DuelIdentity = {
  name?: string;
  avatar?: string;
  bio?: string;
};

export interface ClassGroup {
  class_id: string;
  class_name: string;
  course_code: string;
  classmates: Classmate[];
}

export class StreakDuelService {
  /**
   * Fetches classes the user is in and lists enrolled classmates for each class.
   */
  static async fetchClassesAndClassmates(userId: string): Promise<ClassGroup[]> {
    try {
      // 1. Get all enrollments for the student
      const { data: myEnrollments, error: enrollError } = await supabase
        .from('class_students')
        .select(`
          class_id,
          classes (
            id,
            class_name,
            course_code
          )
        `)
        .eq('student_id', userId);

      if (enrollError) {
        console.error("Error fetching my enrollments:", enrollError);
        return [];
      }

      if (!myEnrollments || myEnrollments.length === 0) return [];

      // Extract class details and IDs
      const classesMap = new Map<string, { class_name: string; course_code: string }>();
      const classIds: string[] = [];

      myEnrollments.forEach((e: any) => {
        if (e.class_id && e.classes) {
          classIds.push(e.class_id);
          classesMap.set(e.class_id, {
            class_name: e.classes.class_name || "Untitled Class",
            course_code: e.classes.course_code || "N/A"
          });
        }
      });

      if (classIds.length === 0) return [];

      // 2. Fetch all other students enrolled in these classes
      const { data: peers, error: peersError } = await supabase
        .from('class_students')
        .select('*')
        .in('class_id', classIds)
        .neq('student_id', userId);

      if (peersError) {
        console.error("Error fetching classmates:", peersError);
        return [];
      }

      if (!peers || peers.length === 0) {
        return classIds.map(cid => ({
          class_id: cid,
          class_name: classesMap.get(cid)?.class_name || "",
          course_code: classesMap.get(cid)?.course_code || "",
          classmates: []
        }));
      }

      // 3. Extract classmate student_ids to fetch profiles and streaks
      const peerStudentIds = peers.map((p: any) => p.student_id).filter(Boolean);

      // Fetch profiles and streaks in parallel
      let profilesMap = new Map<string, DuelIdentity>();
      let streaksMap = new Map<string, number>();

      if (peerStudentIds.length > 0) {
        const [{ data: studentProfiles }, { data: appProfiles }, { data: streaks }] = await Promise.all([
          supabase
            .from('student_profiles')
            .select('user_id, full_name, profile_image, bio')
            .in('user_id', peerStudentIds),
          supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, bio')
            .in('user_id', peerStudentIds),
          supabase
            .from('user_streaks')
            .select('user_id, current_streak')
            .in('user_id', peerStudentIds)
        ]);

        studentProfiles?.forEach((p: any) => {
          profilesMap.set(p.user_id, {
            name: p.full_name || undefined,
            avatar: p.profile_image || undefined,
            bio: p.bio || undefined
          });
        });

        appProfiles?.forEach((p: any) => {
          const existing = profilesMap.get(p.user_id);
          profilesMap.set(p.user_id, {
            name: existing?.name || p.full_name || undefined,
            avatar: existing?.avatar || p.avatar_url || undefined,
            bio: existing?.bio || p.bio || undefined
          });
        });

        streaks?.forEach((s: any) => {
          streaksMap.set(s.user_id, s.current_streak || 0);
        });
      }

      // 4. Construct Classmates details
      const classmatesList: Classmate[] = peers.map((p: any) => {
        const classDetails = classesMap.get(p.class_id);
        const profile = profilesMap.get(p.student_id);
        const streak = streaksMap.get(p.student_id);

        return {
          student_id: p.student_id,
          student_name: profile?.name || p.student_name,
          register_number: p.register_number,
          email: p.email,
          class_id: p.class_id,
          class_name: classDetails?.class_name || "",
          course_code: classDetails?.course_code || "",
          profile_image: profile?.avatar || undefined,
          bio: profile?.bio || undefined,
          current_streak: streak || 0
        };
      });

      // 5. Group classmates by class_id
      return classIds.map(cid => {
        const details = classesMap.get(cid);
        return {
          class_id: cid,
          class_name: details?.class_name || "",
          course_code: details?.course_code || "",
          classmates: classmatesList.filter(c => c.class_id === cid)
        };
      });
    } catch (err) {
      console.error("Failed to fetch classes and classmates:", err);
      return [];
    }
  }

  /**
   * Helper to enrich duel records with classmate profiles and class metadata
   */
  private static async enrichDuels(duels: any[]): Promise<StreakDuel[]> {
    if (!duels || duels.length === 0) return [];

    const userIds = new Set<string>();
    const classIds = new Set<string>();

    duels.forEach(d => {
      userIds.add(d.challenger_id);
      userIds.add(d.defender_id);
      classIds.add(d.class_id);
    });

    const userIdsArr = Array.from(userIds);
    const classIdsArr = Array.from(classIds);

    // Fetch student/app profile names and avatars
    const [{ data: studentProfiles }, { data: appProfiles }] = await Promise.all([
      supabase
        .from('student_profiles')
        .select('user_id, full_name, profile_image')
        .in('user_id', userIdsArr),
      supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIdsArr)
    ]);

    const profilesMap = new Map<string, DuelIdentity>();
    studentProfiles?.forEach((p: any) => {
      profilesMap.set(p.user_id, {
        name: p.full_name || undefined,
        avatar: p.profile_image || undefined
      });
    });

    appProfiles?.forEach((p: any) => {
      const existing = profilesMap.get(p.user_id);
      profilesMap.set(p.user_id, {
        name: existing?.name || p.full_name || undefined,
        avatar: existing?.avatar || p.avatar_url || undefined
      });
    });

    // Fetch classes names
    const { data: classes } = await supabase
      .from('classes')
      .select('id, class_name, course_code')
      .in('id', classIdsArr);

    const classesMap = new Map<string, { class_name: string; course_code: string }>();
    classes?.forEach((c: any) => {
      classesMap.set(c.id, {
        class_name: c.class_name || "Untitled Class",
        course_code: c.course_code || ""
      });
    });

    return duels.map(d => {
      const challengerProfile = profilesMap.get(d.challenger_id);
      const defenderProfile = profilesMap.get(d.defender_id);
      const classInfo = classesMap.get(d.class_id);

      return {
        ...d,
        challenger_name: challengerProfile?.name || "Challenger",
        challenger_avatar: challengerProfile?.avatar,
        defender_name: defenderProfile?.name || "Defender",
        defender_avatar: defenderProfile?.avatar,
        class_name: classInfo?.class_name,
        course_code: classInfo?.course_code
      };
    });
  }

  /**
   * Fetches active duels for a student
   */
  static async fetchActiveDuels(userId: string): Promise<StreakDuel[]> {
    const { data, error } = await supabase
      .from('streak_duels')
      .select('*')
      .eq('status', 'active')
      .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`);

    if (error) {
      console.error("Error fetching active duels:", error);
      return [];
    }
    return this.enrichDuels(data || []);
  }

  /**
   * Fetches pending invitations for a student (both sent and received)
   */
  static async fetchPendingDuels(userId: string): Promise<StreakDuel[]> {
    const { data, error } = await supabase
      .from('streak_duels')
      .select('*')
      .eq('status', 'pending')
      .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`);

    if (error) {
      console.error("Error fetching pending duels:", error);
      return [];
    }
    return this.enrichDuels(data || []);
  }

  /**
   * Fetches duel history (completed and rejected duels)
   */
  static async fetchDuelHistory(userId: string): Promise<StreakDuel[]> {
    const { data, error } = await supabase
      .from('streak_duels')
      .select('*')
      .in('status', ['completed', 'rejected'])
      .or(`challenger_id.eq.${userId},defender_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching duel history:", error);
      return [];
    }
    return this.enrichDuels(data || []);
  }

  /**
   * Creates a new pending streak duel challenge
   */
  static async createDuel(challengerId: string, defenderId: string, classId: string): Promise<StreakDuel | null> {
    try {
      // Prevent duplicate active/pending duels with the same peer in the same class
      const { data: existing } = await supabase
        .from('streak_duels')
        .select('id')
        .eq('class_id', classId)
        .in('status', ['pending', 'active'])
        .or(`and(challenger_id.eq.${challengerId},defender_id.eq.${defenderId}),and(challenger_id.eq.${defenderId},defender_id.eq.${challengerId})`)
        .maybeSingle();

      if (existing) {
        console.warn("A duel is already active or pending with this student in this class.");
        return null;
      }

      const { data, error } = await supabase
        .from('streak_duels')
        .insert({
          challenger_id: challengerId,
          defender_id: defenderId,
          class_id: classId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting duel:", error);
        return null;
      }

      const enriched = await this.enrichDuels([data]);
      return enriched[0] || null;
    } catch (err) {
      console.error("Failed to create duel:", err);
      return null;
    }
  }

  /**
   * Action response to a pending duel invitation
   */
  static async respondToDuel(duelId: string, accept: boolean): Promise<boolean> {
    try {
      if (!accept) {
        const { error } = await supabase
          .from('streak_duels')
          .update({ status: 'rejected' })
          .eq('id', duelId);
        return !error;
      }

      // Accept: Set statuses, starting streaks, active period dates
      // First, get the duel details
      const { data: duel } = await supabase
        .from('streak_duels')
        .select('*')
        .eq('id', duelId)
        .single();

      if (!duel) return false;

      // Get current streaks of both users
      const { data: chStreak } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', duel.challenger_id)
        .maybeSingle();

      const { data: defStreak } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', duel.defender_id)
        .maybeSingle();

      const challengerStreak = chStreak?.current_streak || 0;
      const defenderStreak = defStreak?.current_streak || 0;

      const startedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Exactly a 7-day duel

      const { error } = await supabase
        .from('streak_duels')
        .update({
          status: 'active',
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          challenger_start_streak: challengerStreak,
          defender_start_streak: defenderStreak,
          challenger_current_streak: challengerStreak,
          defender_current_streak: defenderStreak,
          challenger_score: 0,
          defender_score: 0
        })
        .eq('id', duelId);

      return !error;
    } catch (err) {
      console.error("Failed to respond to duel:", err);
      return false;
    }
  }

  /**
   * Synchronizes scores and checks if any active duels have expired
   */
  static async syncActiveDuelsScores(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('sync_user_active_duels', {
        p_user_id: userId
      });

      if (error) {
        console.error("RPC Error syncing active duels:", error);
      }
    } catch (err) {
      console.error("Failed to sync duel scores:", err);
    }
  }
}
