import { supabase } from "../lib/supabase";
import { EnrichedUser, Profile } from "../types";

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
      pageSize = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    try {
      // Fetch all sources concurrently from Supabase
      const [
        profilesRes,
        studentProfilesRes,
        rolesRes,
        classStudentsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("student_profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("user_roles").select("user_id, role").then((r) => r, () => ({ data: [] })),
        supabase.from("class_students").select("*").then((r) => r, () => ({ data: [] })),
      ]);

      const profiles = profilesRes.data || [];
      const studentProfiles = studentProfilesRes.data || [];
      const roles = rolesRes.data || [];
      const classStudents = classStudentsRes.data || [];

      // Collect Known Lecturers & Admins to exclude from student list
      const nonStudentIds = new Set<string>();
      roles.forEach((r: any) => {
        if (r.role === "admin" || r.role === "lecturer") {
          nonStudentIds.add(r.user_id);
        }
      });

      // Build maps for fast O(1) enrichment lookup
      const studentProfileMap = new Map<string, any>();
      studentProfiles.forEach((sp: any) => {
        if (sp.user_id) studentProfileMap.set(sp.user_id, sp);
        if (sp.id) studentProfileMap.set(sp.id, sp);
        if (sp.email) studentProfileMap.set(sp.email.toLowerCase().trim(), sp);
      });

      const classStudentsMap = new Map<string, any>();
      classStudents.forEach((cs: any) => {
        if (cs.student_id) classStudentsMap.set(cs.student_id, cs);
        if (cs.email) classStudentsMap.set(cs.email.toLowerCase().trim(), cs);
      });

      const allStudents: EnrichedUser[] = [];
      const seenIds = new Set<string>();

      // 1. Ingest from master profiles table
      profiles.forEach((p: any) => {
        const uid = p.user_id || p.id;
        if (!uid) return;
        if (nonStudentIds.has(uid) || nonStudentIds.has(p.user_id) || nonStudentIds.has(p.id)) return;
        if (p.role === "lecturer" || p.role === "admin") return;

        const email = (p.email || "").toLowerCase().trim();
        if (email === "mannamganeshbabu8@gmail.com") return;

        seenIds.add(uid);
        if (p.user_id) seenIds.add(p.user_id);
        if (p.id) seenIds.add(p.id);

        const sp = studentProfileMap.get(p.user_id) || studentProfileMap.get(p.id) || (email ? studentProfileMap.get(email) : null);
        const cs = classStudentsMap.get(p.user_id) || (email ? classStudentsMap.get(email) : null);

        let cleanName = (p.full_name || sp?.full_name || sp?.student_name || cs?.student_name || "").trim();
        if (!cleanName && p.email) {
          cleanName = p.email.split("@")[0];
        }
        if (!cleanName) cleanName = "Student User";

        allStudents.push({
          user_id: p.user_id || p.id,
          full_name: cleanName,
          email: p.email || sp?.email || cs?.email || "No email",
          role: "student",
          status: (p.status as any) || (sp?.status as any) || "active",
          department: sp?.department || p.department || cs?.department || "General",
          student_id: sp?.register_number || p.student_id || cs?.register_number || (p.email?.split("@")[0]?.toUpperCase() || `STU-${uid.slice(0, 6).toUpperCase()}`),
          program: sp?.course || p.program || cs?.course || "Student Account",
          year: sp?.year || (sp?.section ? `Sec ${sp.section}` : null) || p.year || (cs?.section ? `Sec ${cs.section}` : "Enrolled"),
          avatar_url: p.avatar_url || sp?.profile_image || null,
          verified: Boolean(p.verified ?? sp?.verified ?? true),
          created_at: p.created_at || sp?.created_at || new Date().toISOString(),
          updated_at: p.updated_at || sp?.updated_at || new Date().toISOString(),
        });
      });

      // 2. Ingest any remaining student_profiles entries not present in profiles
      studentProfiles.forEach((sp: any) => {
        const uid = sp.user_id || sp.id;
        if (!uid) return;
        if (nonStudentIds.has(uid) || nonStudentIds.has(sp.user_id)) return;
        if (seenIds.has(uid) || (sp.user_id && seenIds.has(sp.user_id)) || (sp.id && seenIds.has(sp.id))) return;

        seenIds.add(uid);
        if (sp.user_id) seenIds.add(sp.user_id);
        if (sp.id) seenIds.add(sp.id);

        allStudents.push({
          user_id: sp.user_id || sp.id,
          full_name: sp.full_name || sp.student_name || (sp.email ? sp.email.split("@")[0] : "Student User"),
          email: sp.email || "No email",
          role: "student",
          status: (sp.status as any) || "active",
          department: sp.department || "General",
          student_id: sp.register_number || `STU-${uid.slice(0, 6).toUpperCase()}`,
          program: sp.course || "Student Account",
          year: sp.year || (sp.section ? `Sec ${sp.section}` : "Enrolled"),
          avatar_url: sp.profile_image || null,
          verified: true,
          created_at: sp.created_at || sp.enrollment_date || new Date().toISOString(),
          updated_at: sp.updated_at || new Date().toISOString(),
        });
      });

      // 3. Ingest any remaining class_students entries not in profiles or student_profiles
      classStudents.forEach((cs: any) => {
        const uid = cs.student_id || cs.id;
        if (!uid) return;
        if (nonStudentIds.has(uid) || (cs.student_id && nonStudentIds.has(cs.student_id))) return;
        if (seenIds.has(uid) || (cs.student_id && seenIds.has(cs.student_id)) || (cs.id && seenIds.has(cs.id))) return;

        seenIds.add(uid);
        if (cs.student_id) seenIds.add(cs.student_id);
        if (cs.id) seenIds.add(cs.id);

        allStudents.push({
          user_id: cs.student_id || cs.id,
          full_name: cs.student_name || (cs.email ? cs.email.split("@")[0] : "Student User"),
          email: cs.email || "No email",
          role: "student",
          status: (cs.status as any) || "active",
          department: cs.department || "General",
          student_id: cs.register_number || `STU-${uid.slice(0, 6).toUpperCase()}`,
          program: cs.course || "Student Account",
          year: cs.year || (cs.section ? `Sec ${cs.section}` : "Enrolled"),
          avatar_url: null,
          verified: true,
          created_at: cs.created_at || new Date().toISOString(),
          updated_at: cs.updated_at || new Date().toISOString(),
        });
      });

      let enrichedStudents = allStudents;

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

      return {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (err) {
      console.error("[StudentsService] Error getting students:", err);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  },

  async getStudentDetails(userId: string) {
    try {
      const [
        profileRes,
        studentProfileRes,
        classesRes,
        courseEnrollmentsRes,
        submissionsRes,
        quizSubmissionsRes,
        activityRes,
        roleRes,
        codingProfileRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle().then((r) => r, () => ({ data: null })),
        supabase.from("student_profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle().then((r) => r, () => ({ data: null })),
        supabase.from("class_students").select("class_id, student_name, register_number").or(`student_id.eq.${userId},id.eq.${userId}`).then((r) => r, () => ({ data: [] })),
        supabase.from("course_enrollments").select("*, courses(*)").eq("student_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("assignment_submissions").select("id, assignment_id, grade, status, submitted_at").eq("student_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("quiz_submissions").select("id, quiz_id, status, total_obtained, score, submitted_at").eq("student_id", userId).then((r) => r, () => ({ data: [] })),
        supabase.from("user_activity_log").select("action_date, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30).then((r) => r, () => ({ data: [] })),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle().then((r) => r, () => ({ data: null })),
        supabase.from("user_coding_profiles").select("*").eq("user_id", userId).maybeSingle().then((r) => r, () => ({ data: null })),
      ]);

      const profile = (profileRes.data as Profile) || null;
      const studentProfile = studentProfileRes.data || null;

      const mergedProfile = {
        id: userId,
        user_id: userId,
        full_name: studentProfile?.full_name || profile?.full_name || "Student User",
        email: studentProfile?.email || profile?.email || "No email",
        student_id: studentProfile?.register_number || profile?.student_id || null,
        department: studentProfile?.department || profile?.department || "General",
        program: studentProfile?.course || profile?.program || "Student Account",
        year: studentProfile?.year || profile?.year || "Enrolled",
        avatar_url: studentProfile?.profile_image || profile?.avatar_url || null,
        status: (profile?.status || "active") as any,
        gpa: (profile as any)?.gpa || null,
        credits_completed: (profile as any)?.credits_completed || 0,
        credits_required: (profile as any)?.credits_required || 120,
        bio: (profile as any)?.bio || null,
        created_at: studentProfile?.created_at || profile?.created_at || new Date().toISOString(),
        updated_at: studentProfile?.updated_at || profile?.updated_at || new Date().toISOString(),
      } as Profile;

      const enrolledClasses = [
        ...(classesRes.data || []),
        ...(courseEnrollmentsRes.data || []).map((ce: any) => ({
          class_id: ce.course_id || ce.id,
          student_name: mergedProfile.full_name,
          register_number: ce.courses?.title || "Enrolled Course",
        })),
      ];

      return {
        profile: mergedProfile,
        studentProfile: studentProfileRes.data || null,
        role: roleRes.data?.role || "student",
        classes: enrolledClasses,
        assignmentSubmissions: submissionsRes.data || [],
        quizSubmissions: quizSubmissionsRes.data || [],
        activityLog: activityRes.data || [],
        codingProfile: codingProfileRes.data || null,
      };
    } catch (err) {
      console.error("[StudentsService] Error getting student details:", err);
      return {
        profile: null,
        studentProfile: null,
        role: "student",
        classes: [],
        assignmentSubmissions: [],
        quizSubmissions: [],
        activityLog: [],
        codingProfile: null,
      };
    }
  },

  async getAllDepartments(): Promise<string[]> {
    try {
      const [profilesRes, studentProfilesRes] = await Promise.all([
        supabase.from("profiles").select("department").not("department", "is", null),
        supabase.from("student_profiles").select("department").not("department", "is", null),
      ]);

      const depts = new Set<string>();
      (profilesRes.data || []).forEach((p: any) => {
        if (p.department && p.department.trim()) depts.add(p.department.trim());
      });
      (studentProfilesRes.data || []).forEach((sp: any) => {
        if (sp.department && sp.department.trim()) depts.add(sp.department.trim());
      });

      return Array.from(depts);
    } catch (err) {
      console.error("[StudentsService] Error fetching departments:", err);
      return [];
    }
  },
};
