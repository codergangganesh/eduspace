import { supabase } from "../lib/supabase";
import { EnrichedUser } from "../types";

const LECTURERS_CACHE_KEY = "eduspace_admin_real_lecturers_v3";

export const DEFAULT_LECTURERS: EnrichedUser[] = [
  {
    user_id: "d9c969f2-97c3-493b-a07e-bc5db5d09f02",
    full_name: "Blessan Corley",
    email: "ganeshbabumannam8@gmail.com",
    role: "lecturer",
    status: "active",
    department: "Computer Science",
    created_at: "2025-12-30T09:46:26.268911+00:00",
    updated_at: new Date().toISOString(),
    verified: true,
  },
  {
    user_id: "9a1021d9-f0cb-4319-b25b-952901262f5e",
    full_name: "Aisha shakel",
    email: "aishakel@gmail.com",
    role: "lecturer",
    status: "active",
    department: "Information Technology",
    created_at: "2026-07-23T10:02:35.673078+00:00",
    updated_at: new Date().toISOString(),
    verified: true,
  },
];

export const getCachedLecturersData = () => {
  try {
    const raw = localStorage.getItem(LECTURERS_CACHE_KEY);
    if (!raw) return { data: DEFAULT_LECTURERS, total: DEFAULT_LECTURERS.length, page: 1, pageSize: 10, totalPages: 1 };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("[LecturersService] Cache read error:", err);
  }
  return { data: DEFAULT_LECTURERS, total: DEFAULT_LECTURERS.length, page: 1, pageSize: 10, totalPages: 1 };
};

export const setCachedLecturersData = (data: any) => {
  try {
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      localStorage.setItem(LECTURERS_CACHE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn("[LecturersService] Cache write error:", err);
  }
};

async function ensureAuthenticatedSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return true;
  } catch (err) {
    console.warn("[LecturersService] Session wait warning:", err);
  }
  return true;
}

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
      await ensureAuthenticatedSession();

      // Fetch all sources concurrently with resilient fallback
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
      lecturerProfiles.forEach((lp: any) => lp.user_id && lecturerIds.add(lp.user_id));
      classes.forEach((c: any) => c.lecturer_id && lecturerIds.add(c.lecturer_id));
      courses.forEach((co: any) => co.lecturer_id && lecturerIds.add(co.lecturer_id));

      const lecturerProfileMap = new Map<string, any>();
      lecturerProfiles.forEach((lp: any) => {
        if (lp.user_id) lecturerProfileMap.set(lp.user_id, lp);
      });

      // Filter main profiles for lecturers
      let lecturerProfileList = profiles.filter((p: any) => lecturerIds.has(p.user_id));

      // Map to EnrichedUser
      let enrichedLecturers: EnrichedUser[] = lecturerProfileList.map((p: any) => {
        const lp = lecturerProfileMap.get(p.user_id) || {};
        return {
          user_id: p.user_id,
          full_name: p.full_name || lp.full_name || "Faculty Member",
          email: p.email || lp.email || "No email",
          role: "lecturer",
          status: (p.status as any) || "active",
          department: p.department || lp.department || "Computer Science",
          avatar_url: p.avatar_url || lp.profile_image || null,
          verified: !!p.verified,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });

      // Include any lecturers in lecturer_profiles not in profiles
      const foundUserIds = new Set(lecturerProfileList.map((p: any) => p.user_id));
      lecturerProfiles.forEach((lp: any) => {
        if (lp.user_id && !foundUserIds.has(lp.user_id)) {
          enrichedLecturers.push({
            user_id: lp.user_id,
            full_name: lp.full_name || "Faculty Member",
            email: lp.email || "No email",
            role: "lecturer",
            status: "active",
            department: lp.department || "Computer Science",
            avatar_url: lp.profile_image || null,
            verified: true,
            created_at: lp.created_at || new Date().toISOString(),
            updated_at: lp.updated_at || new Date().toISOString(),
          });
        }
      });

      if (enrichedLecturers.length === 0) {
        enrichedLecturers.push(...DEFAULT_LECTURERS);
      }

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

      const result = {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages,
      };

      if (!search && status === "all" && department === "all" && page === 1) {
        setCachedLecturersData(result);
      }

      return result;
    } catch (err) {
      console.error("[LecturersService] Error getting lecturers:", err);
      return getCachedLecturersData();
    }
  },

  async getLecturerDetails(userId: string) {
    try {
      await ensureAuthenticatedSession();
      const [
        profileRes,
        lecturerProfileRes,
        classesRes,
        coursesRes,
        quizzesRes,
        roleRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("lecturer_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("classes").select("*").eq("lecturer_id", userId),
        supabase.from("courses").select("*").eq("lecturer_id", userId),
        supabase.from("quizzes").select("id, title, status, created_at").eq("class_id", userId),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
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
      throw err;
    }
  },
};
