import { supabase } from "@/lib/supabase";
import { EnrichedUser, Profile } from "@/types";

const STUDENTS_CACHE_KEY = "eduspace_admin_students_list_cache";

export const getCachedStudentsData = (): { data: EnrichedUser[]; total: number; totalPages: number; page: number; pageSize: number } | undefined => {
  try {
    const raw = localStorage.getItem(STUDENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return undefined;
};

export const setCachedStudentsData = (data: any) => {
  try {
    if (data && Array.isArray(data.data) && data.data.length > 0) {
      localStorage.setItem(STUDENTS_CACHE_KEY, JSON.stringify(data));
    }
  } catch {}
};

async function ensureAuthenticatedSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return true;

    for (let i = 0; i < 15; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const { data: retryData } = await supabase.auth.getSession();
      if (retryData?.session?.access_token) return true;
    }
  } catch (err) {
    console.warn("[StudentsService] Session wait warning:", err);
  }
  return false;
}

export interface StudentFilterOptions {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const studentsService = {
  async getStudents(options: StudentFilterOptions = {}) {
    const {
      search = "",
      status = "all",
      department = "all",
      page = 1,
      pageSize = 15,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    try {
      await ensureAuthenticatedSession();

      // Fetch all sources concurrently
      const [
        profilesRes,
        rolesRes,
        studentProfilesRes,
        classStudentsRes,
        lecturerProfilesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("student_profiles").select("*"),
        supabase.from("class_students").select("*"),
        supabase.from("lecturer_profiles").select("user_id"),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const studentProfiles = studentProfilesRes.data || [];
      const classStudents = classStudentsRes.data || [];
      const lecturerProfiles = lecturerProfilesRes.data || [];

      // Categorize Roles
      const adminIds = new Set<string>();
      const lecturerIds = new Set<string>();
      const studentIds = new Set<string>();

      roles.forEach((r) => {
        if (r.role === "admin") adminIds.add(r.user_id);
        else if (r.role === "lecturer") lecturerIds.add(r.user_id);
        else if (r.role === "student") studentIds.add(r.user_id);
      });

      lecturerProfiles.forEach((lp) => lp.user_id && lecturerIds.add(lp.user_id));
      studentProfiles.forEach((sp) => sp.user_id && studentIds.add(sp.user_id));
      classStudents.forEach((cs) => cs.student_id && studentIds.add(cs.student_id));

      // Extra metadata map
      const metaMap = new Map<string, any>();
      studentProfiles.forEach((sp) => {
        if (sp.user_id) metaMap.set(sp.user_id, sp);
      });
      classStudents.forEach((cs) => {
        if (cs.student_id && !metaMap.has(cs.student_id)) metaMap.set(cs.student_id, cs);
      });

      // Filter to student profiles
      const studentProfileList = profiles.filter((p) => {
        // Exclude confirmed admins and lecturers
        if (adminIds.has(p.user_id)) return false;
        if (lecturerIds.has(p.user_id)) return false;
        return true;
      });

      // Map to EnrichedUser
      let enrichedStudents: EnrichedUser[] = studentProfileList.map((p) => {
        const extra = metaMap.get(p.user_id) || {};
        return {
          user_id: p.user_id,
          full_name: p.full_name || extra.student_name || "Student User",
          email: p.email || extra.email || "No email",
          role: "student",
          status: (p.status as any) || "active",
          department: p.department || extra.department || "Computer Science",
          student_id: p.student_id || extra.register_number || `STU-${p.user_id?.slice(0, 6)?.toUpperCase()}`,
          program: p.program || extra.course || "B.Tech",
          year: p.year || extra.year || "3rd Year",
          avatar_url: p.avatar_url || null,
          verified: !!p.verified,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });

      // Include any students from student_profiles/class_students missing from profiles
      const foundUserIds = new Set(studentProfileList.map((p) => p.user_id));
      studentProfiles.forEach((sp) => {
        if (sp.user_id && !foundUserIds.has(sp.user_id) && !adminIds.has(sp.user_id) && !lecturerIds.has(sp.user_id)) {
          enrichedStudents.push({
            user_id: sp.user_id,
            full_name: sp.student_name || "Student User",
            email: sp.email || "No email",
            role: "student",
            status: "active",
            department: sp.department || "Computer Science",
            student_id: sp.register_number || `STU-${sp.user_id?.slice(0, 6)?.toUpperCase()}`,
            program: sp.course || "B.Tech",
            year: sp.year || "3rd Year",
            avatar_url: null,
            verified: true,
            created_at: sp.created_at || new Date().toISOString(),
            updated_at: sp.updated_at || new Date().toISOString(),
          });
        }
      });

      // Apply Search Filter
      if (search.trim()) {
        const s = search.toLowerCase().trim();
        enrichedStudents = enrichedStudents.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.student_id?.toLowerCase().includes(s) ||
            u.department?.toLowerCase().includes(s)
        );
      }

      // Apply Status Filter
      if (status !== "all") {
        enrichedStudents = enrichedStudents.filter((u) => u.status === status);
      }

      // Apply Department Filter
      if (department !== "all") {
        enrichedStudents = enrichedStudents.filter((u) => u.department === department);
      }

      // Sort
      enrichedStudents.sort((a: any, b: any) => {
        const aVal = a[sortBy] || "";
        const bVal = b[sortBy] || "";
        if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });

      const total = enrichedStudents.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const from = (page - 1) * pageSize;
      const paginatedData = enrichedStudents.slice(from, from + pageSize);

      const result = {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages,
      };

      if (!search && status === "all" && department === "all" && page === 1) {
        setCachedStudentsData(result);
      }

      return result;
    } catch (err) {
      console.error("[StudentsService] Error getting students:", err);
      return getCachedStudentsData() || { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getStudentDetails(userId: string) {
    try {
      await ensureAuthenticatedSession();
      const [
        profileRes,
        studentProfileRes,
        classesRes,
        submissionsRes,
        quizSubmissionsRes,
        activityRes,
        roleRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("class_students").select("class_id, student_name, register_number").eq("student_id", userId),
        supabase.from("assignment_submissions").select("id, assignment_id, grade, status, submitted_at").eq("student_id", userId),
        supabase.from("quiz_submissions").select("id, quiz_id, status, total_obtained, submitted_at").eq("student_id", userId),
        supabase.from("user_activity_log").select("action_date, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

      const profile = (profileRes.data as Profile) || null;
      const studentProfile = studentProfileRes.data || null;

      const mergedProfile = profile ? {
        ...profile,
        student_id: profile.student_id || studentProfile?.register_number || null,
        department: profile.department || studentProfile?.department || null,
        program: profile.program || studentProfile?.course || null,
        year: profile.year || studentProfile?.year || null,
      } : null;

      return {
        profile: mergedProfile,
        role: roleRes.data?.role || "student",
        classes: classesRes.data || [],
        assignmentSubmissions: submissionsRes.data || [],
        quizSubmissions: quizSubmissionsRes.data || [],
        activityLog: activityRes.data || [],
      };
    } catch (err) {
      console.error("[StudentsService] Error getting student details:", err);
      throw err;
    }
  },

  async getAllDepartments(): Promise<string[]> {
    try {
      await ensureAuthenticatedSession();
      const [profilesRes, studentProfilesRes] = await Promise.all([
        supabase.from("profiles").select("department").not("department", "is", null),
        supabase.from("student_profiles").select("department").not("department", "is", null),
      ]);

      const depts = new Set<string>();
      (profilesRes.data || []).forEach((d) => {
        if (d.department?.trim()) depts.add(d.department.trim());
      });
      (studentProfilesRes.data || []).forEach((d) => {
        if (d.department?.trim()) depts.add(d.department.trim());
      });

      if (depts.size === 0) {
        depts.add("Computer Science");
        depts.add("Information Technology");
        depts.add("Electronics & Communication");
        depts.add("Mechanical Engineering");
      }

      return Array.from(depts).sort();
    } catch (err) {
      return ["Computer Science", "Information Technology", "Electronics & Communication"];
    }
  },
};
