import { supabase } from "../lib/supabase";
import { EnrichedUser } from "../types";

export interface LecturerFilterOptions {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const lecturersService = {
  async getLecturers(options: LecturerFilterOptions = {}) {
    const {
      search = "",
      status = "all",
      department = "all",
      page = 1,
      pageSize = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    try {
      // Fetch all sources concurrently from Supabase
      const [
        rolesRes,
        lecturerProfilesRes,
        classesRes,
        coursesRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").then((r) => r, () => ({ data: [] })),
        supabase.from("lecturer_profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("classes").select("lecturer_id").then((r) => r, () => ({ data: [] })),
        supabase.from("courses").select("lecturer_id").then((r) => r, () => ({ data: [] })),
        supabase.from("profiles").select("*").then((r) => r, () => ({ data: [] })),
      ]);

      const roles = rolesRes.data || [];
      const lecturerProfiles = lecturerProfilesRes.data || [];
      const classes = classesRes.data || [];
      const courses = coursesRes.data || [];
      const profiles = profilesRes.data || [];

      // Collect all verified lecturer IDs
      const lecturerIds = new Set<string>();
      roles.filter((r: any) => r.role === "lecturer").forEach((r: any) => lecturerIds.add(r.user_id));
      profiles.filter((p: any) => p.role === "lecturer").forEach((p: any) => lecturerIds.add(p.user_id || p.id));
      lecturerProfiles.forEach((lp: any) => lp.user_id && lecturerIds.add(lp.user_id));
      classes.forEach((c: any) => c.lecturer_id && lecturerIds.add(c.lecturer_id));
      courses.forEach((co: any) => co.lecturer_id && lecturerIds.add(co.lecturer_id));

      const lecturerProfileMap = new Map<string, any>();
      lecturerProfiles.forEach((lp: any) => {
        if (lp.user_id) lecturerProfileMap.set(lp.user_id, lp);
        if (lp.id) lecturerProfileMap.set(lp.id, lp);
        if (lp.email) lecturerProfileMap.set(lp.email.toLowerCase().trim(), lp);
      });

      // Filter main profiles for lecturers
      let lecturerProfileList = profiles.filter((p: any) => lecturerIds.has(p.user_id) || lecturerIds.has(p.id));

      // Map to EnrichedUser
      let enrichedLecturers: EnrichedUser[] = lecturerProfileList.map((p: any) => {
        const emailKey = p.email ? p.email.toLowerCase().trim() : "";
        const lp = lecturerProfileMap.get(p.user_id) || lecturerProfileMap.get(p.id) || (emailKey ? lecturerProfileMap.get(emailKey) : null) || {} as any;
        return {
          user_id: p.user_id || p.id,
          full_name: p.full_name || lp.full_name || (p.email ? p.email.split("@")[0] : "Faculty Member"),
          email: p.email || lp.email || "No email",
          role: "lecturer",
          status: (p.status as any) || (lp.status as any) || "active",
          department: p.department || lp.department || "General",
          avatar_url: p.avatar_url || lp.profile_image || null,
          verified: Boolean(p.verified ?? lp.verified ?? true),
          created_at: p.created_at || lp.created_at || new Date().toISOString(),
          updated_at: p.updated_at || lp.updated_at || new Date().toISOString(),
        };
      });

      // Include any lecturers in lecturer_profiles not in profiles
      const foundUserIds = new Set(lecturerProfileList.map((p: any) => p.user_id || p.id));
      lecturerProfiles.forEach((lp: any) => {
        const uid = lp.user_id || lp.id;
        if (uid && !foundUserIds.has(uid) && !foundUserIds.has(lp.user_id)) {
          foundUserIds.add(uid);
          enrichedLecturers.push({
            user_id: uid,
            full_name: lp.full_name || (lp.email ? lp.email.split("@")[0] : "Faculty Member"),
            email: lp.email || "No email",
            role: "lecturer",
            status: (lp.status as any) || "active",
            department: lp.department || "General",
            avatar_url: lp.profile_image || null,
            verified: true,
            created_at: lp.created_at || new Date().toISOString(),
            updated_at: lp.updated_at || new Date().toISOString(),
          });
        }
      });

      // Apply Search Filter
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        enrichedLecturers = enrichedLecturers.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.department?.toLowerCase().includes(s)
        );
      }

      // Apply Status Filter
      if (status !== "all") {
        enrichedLecturers = enrichedLecturers.filter((u) => u.status === status);
      }

      // Apply Department Filter
      if (department !== "all") {
        enrichedLecturers = enrichedLecturers.filter((u) => u.department === department);
      }

      // Sort
      enrichedLecturers.sort((a: any, b: any) => {
        const aVal = a[sortBy] || "";
        const bVal = b[sortBy] || "";
        if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });

      const total = enrichedLecturers.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const from = (page - 1) * pageSize;
      const paginatedData = enrichedLecturers.slice(from, from + pageSize);

      return {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (err) {
      console.error("[LecturersService] Error getting lecturers:", err);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },

  async getLecturerDetails(userId: string) {
    try {
      const [
        profileRes,
        lecturerProfileRes,
        classesRes,
        coursesRes,
        quizzesRes,
        roleRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle().then((r) => r, () => ({ data: null })),
        supabase.from("lecturer_profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle().then((r) => r, () => ({ data: null })),
        supabase.from("classes").select("*").eq("lecturer_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("courses").select("*").eq("lecturer_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("quizzes").select("id, title, status, created_at").eq("class_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle().then((r) => r, () => ({ data: null })),
      ]);

      return {
        profile: profileRes.data || null,
        lecturerProfile: lecturerProfileRes.data || null,
        role: roleRes.data?.role || "lecturer",
        classes: classesRes.data || [],
        courses: coursesRes.data || [],
        quizzes: quizzesRes.data || [],
      };
    } catch (err) {
      console.error("[LecturersService] Error getting lecturer details:", err);
      return {
        profile: null,
        lecturerProfile: null,
        role: "lecturer",
        classes: [],
        courses: [],
        quizzes: [],
      };
    }
  },
};
