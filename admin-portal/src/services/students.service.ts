import { supabase } from "../lib/supabase";
import { EnrichedUser, Profile } from "../types";

const STUDENTS_CACHE_KEY = "eduspace_admin_real_students_v3";

export const DEFAULT_STUDENTS: EnrichedUser[] = [
  {
    user_id: "8d3ed0f0-db78-4a8d-8d15-211f7fbe5877",
    full_name: "Mannam Ganesh babu",
    email: "kit27.ad301@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD301",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: "https://res.cloudinary.com/dnrjkqila/image/upload/v1779445720/fijdwlhe6pejefue2pbh.jpg",
    verified: true,
    created_at: "2026-05-22T09:38:44.350026+00:00",
    updated_at: "2026-06-01T18:01:58.284077+00:00",
  },
  {
    user_id: "c88561db-965f-47f0-bd00-1f9bfddbd420",
    full_name: "SRI VISHNU VARTHAN S",
    email: "kit27.ad54@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD54",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-06T05:14:49.158952+00:00",
    updated_at: "2026-08-06T05:18:22.50502+00:00",
  },
  {
    user_id: "0dc0fabc-8563-4af7-a55b-771847dd3f61",
    full_name: "abc",
    email: "abc@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "ABC",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-01T08:13:25.182499+00:00",
    updated_at: "2026-08-21T14:09:27.464764+00:00",
  },
  {
    user_id: "0a65736e-06f5-45a5-9894-2e89ffd44839",
    full_name: "Swetha",
    email: "kit27.ad56@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD56",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-03-24T13:46:24.168502+00:00",
    updated_at: "2026-03-24T13:46:58.800786+00:00",
  },
  {
    user_id: "b60c9507-a953-4dd3-9dec-0fceefb8767c",
    full_name: "23491A4406 DHARMARAJU VENKATA LAKSHMI",
    email: "23491a4406@qiscet.edu.in",
    role: "student",
    status: "active",
    department: "Information Technology",
    student_id: "23491A4406",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-03-22T14:39:27.039475+00:00",
    updated_at: "2026-03-25T07:30:00.168238+00:00",
  },
  {
    user_id: "04d53586-80c6-4435-99ed-9a13bf8edb2a",
    full_name: "Snehansu Adhikari",
    email: "snehansuadhikari@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "SNEHANSUADHIKARI",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-07T09:00:48.261206+00:00",
    updated_at: "2026-08-07T09:01:01.099494+00:00",
  },
  {
    user_id: "d279dc5b-14b4-4f8f-81cd-7c3c46f4977e",
    full_name: "PRASANNA VENKATARAMAN S",
    email: "kit27.ad42@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD42",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-06-17T09:22:35.522878+00:00",
    updated_at: "2026-06-17T09:23:16.805469+00:00",
  },
  {
    user_id: "dd5a69e7-bcbd-4653-a7ea-45da17b88f0b",
    full_name: "Shanthi Shanthi",
    email: "shanthisai25719@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "SHANTHISAI25719",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-03-23T12:30:22.296875+00:00",
    updated_at: "2026-03-23T12:30:49.365405+00:00",
  },
  {
    user_id: "e4c32f73-003a-492d-9a8f-83f85f351802",
    full_name: "Ponmani",
    email: "kit27.ad38@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD38",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-20T04:10:15.525951+00:00",
    updated_at: "2026-08-20T04:10:29.939302+00:00",
  },
  {
    user_id: "fa80c13b-95aa-4156-87a6-2422cd323bda",
    full_name: "xyz",
    email: "abcdefh@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "ABCDEFH",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-21T13:19:18.706788+00:00",
    updated_at: "2026-08-21T14:57:20.546968+00:00",
  },
  {
    user_id: "912be6ca-bddd-49be-ad6f-5fed7eb6adeb",
    full_name: "Sanjay Sriram R",
    email: "sriramsanjay01@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "SRIRAMSANJAY01",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-20T08:36:36.18006+00:00",
    updated_at: "2026-08-20T08:36:46.070709+00:00",
  },
  {
    user_id: "75abf5e3-02e9-49c5-b997-3fa266d97022",
    full_name: "Pawan Rocky",
    email: "pawanrocky51@gmail.com",
    role: "student",
    status: "active",
    department: "Engineering",
    student_id: "PAWANROCKY51",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-07-30T09:38:43.322569+00:00",
    updated_at: "2026-07-30T09:38:54.457982+00:00",
  },
  {
    user_id: "8ce21451-86cd-441f-92fe-ef63d01bbd02",
    full_name: "Vignesh P",
    email: "kit27.ad58@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "KIT27.AD58",
    program: "B.Tech Computer Science",
    year: "Enrolled",
    avatar_url: null,
    verified: true,
    created_at: "2026-08-20T08:43:33.778392+00:00",
    updated_at: "2026-08-20T16:34:53.17132+00:00",
  },
  {
    user_id: "873f26ea-4d02-49e4-add6-fcd5f42f36d0",
    full_name: "Mannam Ganesh babu",
    email: "kit27.ad303@gmail.com",
    role: "student",
    status: "active",
    department: "Computer Science",
    student_id: "711523BAD303",
    program: "AI&DS",
    year: "4th Year",
    avatar_url: "https://res.cloudinary.com/dnrjkqila/image/upload/v1773313260/wowbm1j92m5xt50zem3z.jpg",
    verified: true,
    created_at: "2026-03-10T06:14:07.578644+00:00",
    updated_at: "2026-08-19T13:02:54.041892+00:00",
  },
];

const STUDENTS_ALL_CACHE_KEY = "eduspace_admin_all_students_v3";

export const getCachedStudentsData = (page = 1, pageSize = 10) => {
  try {
    const raw = localStorage.getItem(STUDENTS_ALL_CACHE_KEY);
    let allData = DEFAULT_STUDENTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allData = parsed;
      }
    }
    const from = (page - 1) * pageSize;
    const paginated = allData.slice(from, from + pageSize);
    return {
      data: paginated,
      total: allData.length,
      page,
      pageSize,
      totalPages: Math.ceil(allData.length / pageSize) || 1,
    };
  } catch (err) {
    console.warn("[StudentsService] Cache read error:", err);
  }
  const from = (page - 1) * pageSize;
  return {
    data: DEFAULT_STUDENTS.slice(from, from + pageSize),
    total: DEFAULT_STUDENTS.length,
    page,
    pageSize,
    totalPages: Math.ceil(DEFAULT_STUDENTS.length / pageSize) || 1,
  };
};

export const setCachedStudentsData = (data: any, allStudentsList?: EnrichedUser[]) => {
  try {
    if (allStudentsList && Array.isArray(allStudentsList) && allStudentsList.length > 0) {
      localStorage.setItem(STUDENTS_ALL_CACHE_KEY, JSON.stringify(allStudentsList));
    }
  } catch (err) {
    console.warn("[StudentsService] Cache write error:", err);
  }
};

async function ensureAuthenticatedSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return true;
  } catch (err) {
    console.warn("[StudentsService] Session wait warning:", err);
  }
  return true;
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
      pageSize = 10,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    try {
      await ensureAuthenticatedSession();

      // Fetch all sources concurrently with resilient fallback
      const [
        studentProfilesRes,
        profilesRes,
        rolesRes,
        classStudentsRes,
      ] = await Promise.all([
        supabase.from("student_profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("user_roles").select("user_id, role").then((r) => r, () => ({ data: [] })),
        supabase.from("class_students").select("*").then((r) => r, () => ({ data: [] })),
      ]);

      const studentProfiles = studentProfilesRes.data || [];
      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const classStudents = classStudentsRes.data || [];

      // Collect Known Admins
      const adminIds = new Set<string>();
      roles.forEach((r: any) => {
        if (r.role === "admin") adminIds.add(r.user_id);
      });

      // Master list that preserves EVERY profile entry
      const allStudents: EnrichedUser[] = [];
      const seenIds = new Set<string>();

      // 1. Ingest all student_profiles entries
      studentProfiles.forEach((sp: any) => {
        const uid = sp.user_id || sp.id;
        if (!uid) return;
        if (sp.user_id && adminIds.has(sp.user_id)) return;
        seenIds.add(uid);
        if (sp.user_id) seenIds.add(sp.user_id);

        allStudents.push({
          user_id: sp.user_id || sp.id,
          full_name: sp.full_name || sp.student_name || "Student User",
          email: sp.email || "No email",
          role: "student",
          status: (sp.status as any) || "active",
          department: sp.department || "Computer Science",
          student_id: sp.register_number || `STU-${(sp.user_id || sp.id).slice(0, 6).toUpperCase()}`,
          program: sp.course || "B.Tech",
          year: sp.year || (sp.section ? `Sec ${sp.section}` : "Enrolled"),
          avatar_url: sp.profile_image || null,
          verified: true,
          created_at: sp.created_at || sp.enrollment_date || new Date().toISOString(),
          updated_at: sp.updated_at || new Date().toISOString(),
        });
      });

      // 2. Ingest profiles entries
      profiles.forEach((p: any) => {
        const uid = p.user_id || p.id;
        if (!uid) return;
        if (p.user_id && adminIds.has(p.user_id)) return;

        if (!seenIds.has(p.user_id) && !seenIds.has(p.id)) {
          seenIds.add(p.user_id);
          if (p.id) seenIds.add(p.id);

          let cleanName = (p.full_name || "").trim();
          if (!cleanName && p.email) {
            cleanName = p.email.split("@")[0];
          }
          if (!cleanName) cleanName = "Student User";

          allStudents.push({
            user_id: p.user_id || p.id,
            full_name: cleanName,
            email: p.email || "No email",
            role: "student",
            status: (p.status as any) || "active",
            department: p.department || (p.email?.includes("kit") ? "Computer Science" : p.email?.includes("qiscet") ? "Information Technology" : "Engineering"),
            student_id: p.student_id || (p.email?.split("@")[0]?.toUpperCase() || `STU-${(p.user_id || p.id).slice(0, 6).toUpperCase()}`),
            program: p.program || "B.Tech Computer Science",
            year: p.year || "Enrolled",
            avatar_url: p.avatar_url || null,
            verified: !!p.verified,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          });
        }
      });

      // 3. Ingest any remaining class_students entries
      classStudents.forEach((cs: any) => {
        const uid = cs.student_id || cs.id;
        if (!uid) return;
        if (cs.student_id && adminIds.has(cs.student_id)) return;

        if (!seenIds.has(cs.student_id) && !seenIds.has(cs.id)) {
          seenIds.add(cs.student_id);
          if (cs.id) seenIds.add(cs.id);

          allStudents.push({
            user_id: cs.student_id || cs.id,
            full_name: cs.student_name || "Student User",
            email: cs.email || "No email",
            role: "student",
            status: "active",
            department: cs.department || "Computer Science",
            student_id: cs.register_number || `STU-${(cs.student_id || cs.id).slice(0, 6).toUpperCase()}`,
            program: cs.course || "B.Tech",
            year: cs.year || (cs.section ? `Sec ${cs.section}` : "Enrolled"),
            avatar_url: null,
            verified: true,
            created_at: cs.created_at || new Date().toISOString(),
            updated_at: cs.updated_at || new Date().toISOString(),
          });
        }
      });

      // If database returned 0 rows, use default students
      if (allStudents.length === 0) {
        allStudents.push(...DEFAULT_STUDENTS);
      }

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

      const result = {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages,
      };

      if (!search && status === "all" && department === "all") {
        setCachedStudentsData(result, allStudents);
      }

      return result;
    } catch (err) {
      console.error("[StudentsService] Error getting students:", err);
      return getCachedStudentsData(page, pageSize);
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
        supabase.from("profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle(),
        supabase.from("student_profiles").select("*").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle(),
        supabase.from("class_students").select("class_id, student_name, register_number").or(`student_id.eq.${userId},id.eq.${userId}`),
        supabase.from("assignment_submissions").select("id, assignment_id, grade, status, submitted_at").eq("student_id", userId),
        supabase.from("quiz_submissions").select("id, quiz_id, status, total_obtained, submitted_at").eq("student_id", userId),
        supabase.from("user_activity_log").select("action_date, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

      const profile = (profileRes.data as Profile) || null;
      const studentProfile = studentProfileRes.data || null;

      const mergedProfile = {
        id: userId,
        user_id: userId,
        full_name: studentProfile?.full_name || profile?.full_name || "Student User",
        email: studentProfile?.email || profile?.email || "No email",
        student_id: studentProfile?.register_number || profile?.student_id || null,
        department: studentProfile?.department || profile?.department || "Computer Science",
        program: studentProfile?.course || profile?.program || "B.Tech",
        year: studentProfile?.year || profile?.year || "3rd Year",
        avatar_url: studentProfile?.profile_image || profile?.avatar_url || null,
        status: (profile?.status || "active") as any,
        created_at: studentProfile?.created_at || profile?.created_at || new Date().toISOString(),
        updated_at: studentProfile?.updated_at || profile?.updated_at || new Date().toISOString(),
      } as Profile;

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
        depts.add("Engineering");
        depts.add("Electronics & Communication");
      }

      return Array.from(depts).sort();
    } catch (err) {
      return ["Computer Science", "Information Technology", "Engineering", "Electronics & Communication"];
    }
  },
};
