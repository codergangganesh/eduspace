import { supabase } from "@/lib/supabase";
import { DashboardStats } from "@/types";

async function ensureAuthenticatedSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      return true;
    }

    // Wait up to 2 seconds for Supabase client to hydrate stored tokens on cold reload
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const { data: retryData } = await supabase.auth.getSession();
      if (retryData?.session?.access_token) {
        return true;
      }
    }
  } catch (err) {
    console.warn("[DashboardService] Session wait warning:", err);
  }
  return false;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      // 0. Wait for Supabase client to attach session token on cold page refresh
      await ensureAuthenticatedSession();

      // 1. Try fast database-level Security Definer RPC first
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_admin_dashboard_stats");
        if (!rpcError && rpcData && typeof rpcData === "object" && ("totalStudents" in rpcData || "total_students" in rpcData)) {
          return {
            totalStudents: rpcData.totalStudents ?? rpcData.total_students ?? 0,
            activeStudents: rpcData.activeStudents ?? rpcData.active_students ?? 0,
            suspendedStudents: rpcData.suspendedStudents ?? rpcData.suspended_students ?? 0,
            totalLecturers: rpcData.totalLecturers ?? rpcData.total_lecturers ?? 0,
            activeLecturers: rpcData.activeLecturers ?? rpcData.active_lecturers ?? 0,
            totalAdmins: rpcData.totalAdmins ?? rpcData.total_admins ?? 1,
            totalCourses: rpcData.totalCourses ?? rpcData.total_courses ?? 0,
            totalClasses: rpcData.totalClasses ?? rpcData.total_classes ?? 0,
            totalAssignments: rpcData.totalAssignments ?? rpcData.total_assignments ?? 0,
            totalQuizzes: rpcData.totalQuizzes ?? rpcData.total_quizzes ?? 0,
            totalMessages: rpcData.totalMessages ?? rpcData.total_messages ?? 0,
            newUsersLast30Days: rpcData.newUsersLast30Days ?? rpcData.new_users_30d ?? 0,
            userGrowth: rpcData.userGrowth ?? rpcData.user_growth ?? [],
            userDistribution: rpcData.userDistribution ?? rpcData.user_distribution ?? [],
            activitySummary: rpcData.activitySummary ?? rpcData.activity_summary ?? [],
          };
        }
      } catch (rpcErr) {
        console.warn("[DashboardService] RPC attempt notice:", rpcErr);
      }

      // 2. Direct query fallback across all core tables
      const [
        profilesRes,
        rolesRes,
        lecturerProfilesRes,
        studentProfilesRes,
        classesRes,
        coursesRes,
        assignmentsRes,
        quizzesRes,
        messagesRes,
        classStudentsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("user_id, status, created_at, email, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("lecturer_profiles").select("user_id"),
        supabase.from("student_profiles").select("user_id"),
        supabase.from("classes").select("id, lecturer_id", { count: "exact" }),
        supabase.from("courses").select("id, lecturer_id", { count: "exact" }),
        supabase.from("assignments").select("id", { count: "exact" }),
        supabase.from("quizzes").select("id", { count: "exact" }),
        supabase.from("messages").select("id", { count: "exact" }),
        supabase.from("class_students").select("student_id", { count: "exact" }),
      ]);

      const profiles = profilesRes.data || [];
      const roles = rolesRes.data || [];
      const lecturerProfiles = lecturerProfilesRes.data || [];
      const studentProfiles = studentProfilesRes.data || [];
      const classes = classesRes.data || [];
      const courses = coursesRes.data || [];
      const assignments = assignmentsRes.data || [];
      const quizzes = quizzesRes.data || [];
      const messages = messagesRes.data || [];
      const classStudents = classStudentsRes.data || [];

      // Categorize User IDs
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
      classes.forEach((c) => c.lecturer_id && lecturerIds.add(c.lecturer_id));
      courses.forEach((co) => co.lecturer_id && lecturerIds.add(co.lecturer_id));
      classStudents.forEach((cs) => cs.student_id && studentIds.add(cs.student_id));

      profiles.forEach((p) => {
        if (adminIds.has(p.user_id)) return;
        if (lecturerIds.has(p.user_id)) return;
        studentIds.add(p.user_id);
      });

      const totalStudents = studentIds.size;
      const totalLecturers = lecturerIds.size;
      const totalAdmins = adminIds.size > 0 ? adminIds.size : 1;

      let activeStudents = 0;
      let suspendedStudents = 0;
      let activeLecturers = 0;

      profiles.forEach((p) => {
        const isSuspended = p.status === "suspended";
        if (studentIds.has(p.user_id)) {
          if (isSuspended) suspendedStudents++;
          else activeStudents++;
        }
        if (lecturerIds.has(p.user_id)) {
          if (!isSuspended) activeLecturers++;
        }
      });

      if (activeStudents === 0 && suspendedStudents === 0 && totalStudents > 0) {
        activeStudents = totalStudents;
      }
      if (activeLecturers === 0 && totalLecturers > 0) {
        activeLecturers = totalLecturers;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = profiles.filter(
        (p) => new Date(p.created_at) >= thirtyDaysAgo
      ).length;

      const totalCourses = coursesRes.count ?? courses.length;
      const totalClasses = classesRes.count ?? classes.length;
      const totalAssignments = assignmentsRes.count ?? assignments.length;
      const totalQuizzes = quizzesRes.count ?? quizzes.length;
      const totalMessages = messagesRes.count ?? messages.length;

      const userGrowth = computeUserGrowth(profiles, studentIds, lecturerIds);

      const userDistribution = [
        { name: "Students", value: totalStudents, color: "#3b82f6" },
        { name: "Lecturers", value: totalLecturers, color: "#10b981" },
        { name: "Administrators", value: totalAdmins, color: "#8b5cf6" },
        ...(suspendedStudents > 0 ? [{ name: "Suspended", value: suspendedStudents, color: "#ef4444" }] : []),
      ];

      const activitySummary = [
        { name: "Assignments", count: totalAssignments },
        { name: "Quizzes", count: totalQuizzes },
        { name: "Courses", count: totalCourses },
        { name: "Classes", count: totalClasses },
      ];

      return {
        totalStudents,
        activeStudents,
        suspendedStudents,
        totalLecturers,
        activeLecturers,
        totalAdmins,
        totalCourses,
        totalClasses,
        totalAssignments,
        totalQuizzes,
        totalMessages,
        newUsersLast30Days,
        userGrowth,
        userDistribution,
        activitySummary,
      };
    } catch (err) {
      console.error("[DashboardService] Error fetching stats:", err);
      throw err;
    }
  },

  async getRecentActivity() {
    try {
      await ensureAuthenticatedSession();
      const [submissionsRes, quizzesRes, newUsersRes] = await Promise.all([
        supabase
          .from("assignment_submissions")
          .select("id, submitted_at, student_id")
          .order("submitted_at", { ascending: false })
          .limit(5),
        supabase
          .from("quizzes")
          .select("id, title, created_at, class_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("user_id, full_name, email, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        submissions: submissionsRes.data || [],
        quizzes: quizzesRes.data || [],
        newUsers: newUsersRes.data || [],
      };
    } catch (err) {
      console.error("[DashboardService] Error fetching recent activity:", err);
      return { submissions: [], quizzes: [], newUsers: [] };
    }
  },
};

function computeUserGrowth(
  profiles: Array<{ user_id: string; created_at: string }>,
  studentIds: Set<string>,
  lecturerIds: Set<string>
) {
  const months: Record<string, { students: number; lecturers: number; total: number }> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short" });
    months[label] = { students: 0, lecturers: 0, total: 0 };
  }

  profiles.forEach((p) => {
    const pDate = new Date(p.created_at);
    const label = pDate.toLocaleString("default", { month: "short" });
    if (months[label]) {
      months[label].total++;
      if (studentIds.has(p.user_id)) months[label].students++;
      if (lecturerIds.has(p.user_id)) months[label].lecturers++;
    }
  });

  return Object.entries(months).map(([date, counts]) => ({
    date,
    ...counts,
  }));
}
