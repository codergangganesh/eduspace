import { supabase } from "../lib/supabase";
import { DashboardStats, UserGrowthPoint, UserGrowthDatasets } from "../types";

interface UnifiedUser {
  id: string;
  role: "student" | "lecturer" | "admin";
  status: "active" | "suspended";
  created_at: Date;
  email?: string;
  full_name?: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      // Query all core tables concurrently
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
        supabase.from("profiles").select("id, user_id, status, created_at, email, full_name, role"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("lecturer_profiles").select("id, user_id, created_at, full_name, email"),
        supabase.from("student_profiles").select("id, user_id, created_at, full_name, email"),
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

      // Categorize User Roles & IDs
      const adminIds = new Set<string>();
      const explicitLecturerIds = new Set<string>();
      const explicitStudentIds = new Set<string>();

      roles.forEach((r) => {
        if (r.role === "admin") adminIds.add(r.user_id);
        else if (r.role === "lecturer") explicitLecturerIds.add(r.user_id);
        else if (r.role === "student") explicitStudentIds.add(r.user_id);
      });

      lecturerProfiles.forEach((lp) => {
        if (lp.user_id) explicitLecturerIds.add(lp.user_id);
        if (lp.id) explicitLecturerIds.add(lp.id);
      });

      studentProfiles.forEach((sp) => {
        if (sp.user_id) explicitStudentIds.add(sp.user_id);
        if (sp.id) explicitStudentIds.add(sp.id);
      });

      classes.forEach((c) => c.lecturer_id && explicitLecturerIds.add(c.lecturer_id));
      courses.forEach((co) => co.lecturer_id && explicitLecturerIds.add(co.lecturer_id));
      classStudents.forEach((cs) => cs.student_id && explicitStudentIds.add(cs.student_id));

      const parseDate = (dateStr?: string | null): Date => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date() : d;
      };

      // Build deduplicated Unified Users list
      const userMap = new Map<string, UnifiedUser>();

      // 1. Process student_profiles
      studentProfiles.forEach((sp) => {
        const uid = sp.user_id || sp.id;
        if (!uid || adminIds.has(uid) || (sp.user_id && adminIds.has(sp.user_id))) return;
        userMap.set(uid, {
          id: uid,
          role: "student",
          status: "active",
          created_at: parseDate(sp.created_at),
          email: sp.email,
          full_name: sp.full_name,
        });
      });

      // 2. Process lecturer_profiles
      lecturerProfiles.forEach((lp) => {
        const uid = lp.user_id || lp.id;
        if (!uid || adminIds.has(uid) || (lp.user_id && adminIds.has(lp.user_id))) return;
        userMap.set(uid, {
          id: uid,
          role: "lecturer",
          status: "active",
          created_at: parseDate(lp.created_at),
          email: lp.email,
          full_name: lp.full_name,
        });
      });

      // 3. Process main profiles
      profiles.forEach((p) => {
        const uid = p.user_id || p.id;
        if (!uid) return;

        const isSuspended = p.status === "suspended";
        const email = p.email || "";
        const isAdmin =
          adminIds.has(uid) ||
          adminIds.has(p.user_id) ||
          p.role === "admin" ||
          email.toLowerCase() === "mannamganeshbabu8@gmail.com";

        const isLecturer =
          !isAdmin &&
          (p.role === "lecturer" || explicitLecturerIds.has(uid) || explicitLecturerIds.has(p.user_id));

        const role: "student" | "lecturer" | "admin" = isAdmin
          ? "admin"
          : isLecturer
          ? "lecturer"
          : "student";

        const existing = userMap.get(uid);
        const createdAt = parseDate(p.created_at);

        if (existing) {
          if (isSuspended) existing.status = "suspended";
          if (existing.created_at > createdAt) existing.created_at = createdAt;
          if (role === "admin" || (role === "lecturer" && existing.role === "student")) {
            existing.role = role;
          }
          if (p.full_name) existing.full_name = p.full_name;
        } else {
          userMap.set(uid, {
            id: uid,
            role,
            status: isSuspended ? "suspended" : "active",
            created_at: createdAt,
            email: p.email,
            full_name: p.full_name,
          });
        }
      });

      const allUsers = Array.from(userMap.values());

      let totalStudents = 0;
      let activeStudents = 0;
      let suspendedStudents = 0;
      let totalLecturers = 0;
      let activeLecturers = 0;
      let totalAdmins = 0;

      allUsers.forEach((u) => {
        if (u.role === "student") {
          totalStudents++;
          if (u.status === "suspended") suspendedStudents++;
          else activeStudents++;
        } else if (u.role === "lecturer") {
          totalLecturers++;
          if (u.status === "suspended") {
            // Suspended lecturer
          } else {
            activeLecturers++;
          }
        } else if (u.role === "admin") {
          totalAdmins++;
        }
      });

      if (totalAdmins === 0) {
        totalAdmins = adminIds.size || 1;
      }

      // New users in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newUsersLast30Days = allUsers.filter(
        (u) => u.created_at >= thirtyDaysAgo
      ).length;

      const totalCourses = coursesRes.count ?? courses.length ?? 0;
      const totalClasses = classesRes.count ?? classes.length ?? 0;
      const totalAssignments = assignmentsRes.count ?? assignments.length ?? 0;
      const totalQuizzes = quizzesRes.count ?? quizzes.length ?? 0;
      const totalMessages = messagesRes.count ?? messages.length ?? 0;

      // Compute multi-timeframe user growth datasets from real user created_at dates
      const userGrowthDatasets = computeGrowthDatasets(allUsers);
      const userGrowth = userGrowthDatasets["6m"];

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
        userGrowthDatasets,
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
      const [
        submissionsRes,
        quizzesRes,
        newUsersRes,
        studentProfilesRes,
        lecturerProfilesRes,
        classesRes,
        coursesRes,
        assignmentsRes,
        auditLogsRes,
      ] = await Promise.all([
        supabase
          .from("assignment_submissions")
          .select("id, submitted_at, student_id")
          .order("submitted_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("quizzes")
          .select("id, title, created_at, class_id")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("profiles")
          .select("id, user_id, full_name, email, created_at, role, department")
          .order("created_at", { ascending: false })
          .limit(10)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("student_profiles")
          .select("id, user_id, full_name, email, department, created_at")
          .order("created_at", { ascending: false })
          .limit(10)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("lecturer_profiles")
          .select("id, user_id, full_name, email, department, created_at")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("classes")
          .select("id, class_name, course_code, created_at")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("courses")
          .select("id, title, course_code, created_at")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("assignments")
          .select("id, title, created_at, max_points, due_date")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
        supabase
          .from("admin_audit_logs")
          .select("id, action, target_email, details, created_at")
          .order("created_at", { ascending: false })
          .limit(8)
          .then((r) => r, () => ({ data: [] })),
      ]);

      const mergedUsers: any[] = [
        ...(studentProfilesRes.data || []).map((s: any) => ({ ...s, userType: "student" })),
        ...(lecturerProfilesRes.data || []).map((l: any) => ({ ...l, userType: "lecturer" })),
        ...(newUsersRes.data || []).map((p: any) => ({ ...p, userType: p.role || "user" })),
      ];

      // Deduplicate recent users by email or ID
      const seenUserIds = new Set<string>();
      const uniqueNewUsers: any[] = [];
      mergedUsers.forEach((u: any) => {
        const key = u.user_id || u.id || u.email;
        if (key && !seenUserIds.has(key)) {
          seenUserIds.add(key);
          uniqueNewUsers.push(u);
        }
      });

      return {
        submissions: submissionsRes.data || [],
        quizzes: quizzesRes.data || [],
        newUsers: uniqueNewUsers.slice(0, 15),
        classes: classesRes.data || [],
        courses: coursesRes.data || [],
        assignments: assignmentsRes.data || [],
        announcements: [],
        auditLogs: auditLogsRes.data || [],
      };
    } catch (err) {
      console.error("[DashboardService] Error fetching recent activity:", err);
      return { submissions: [], quizzes: [], newUsers: [], classes: [], courses: [], assignments: [], announcements: [], auditLogs: [] };
    }
  },
};

/**
 * Computes real-time multi-timeframe growth datasets (7d, 30d, 6m, 12m)
 * directly from database users' actual created_at timestamps.
 */
function computeGrowthDatasets(allUsers: UnifiedUser[]): UserGrowthDatasets {
  const now = new Date();

  const formatShortDate = (d: Date) => {
    return d.toLocaleDateString("default", { month: "short", day: "numeric" });
  };

  const formatMonth = (d: Date) => {
    return d.toLocaleDateString("default", { month: "short" });
  };

  // 1. 7 Days Dataset (Daily)
  const d7Points: UserGrowthPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
    const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : dayStart.toLocaleDateString("default", { weekday: "short" });

    const newStudents = allUsers.filter(
      (u) => u.role === "student" && u.created_at >= dayStart && u.created_at <= dayEnd
    ).length;
    const newLecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at >= dayStart && u.created_at <= dayEnd
    ).length;

    const students = allUsers.filter(
      (u) => u.role === "student" && u.created_at <= dayEnd
    ).length;
    const lecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at <= dayEnd
    ).length;

    d7Points.push({
      date: label,
      timestamp: dayStart.getTime(),
      students,
      lecturers,
      total: students + lecturers,
      newStudents,
      newLecturers,
      newTotal: newStudents + newLecturers,
    });
  }

  // 2. 30 Days Dataset (6 intervals of 5 days)
  const d30Points: UserGrowthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const daysAgoStart = (i + 1) * 5;
    const daysAgoEnd = i * 5;
    const intervalStart = new Date(now.getTime() - daysAgoStart * 24 * 60 * 60 * 1000);
    const intervalEnd = new Date(now.getTime() - daysAgoEnd * 24 * 60 * 60 * 1000);
    const label = i === 0 ? "Today" : formatShortDate(intervalEnd);

    const newStudents = allUsers.filter(
      (u) => u.role === "student" && u.created_at > intervalStart && u.created_at <= intervalEnd
    ).length;
    const newLecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at > intervalStart && u.created_at <= intervalEnd
    ).length;

    const students = allUsers.filter(
      (u) => u.role === "student" && u.created_at <= intervalEnd
    ).length;
    const lecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at <= intervalEnd
    ).length;

    d30Points.push({
      date: label,
      timestamp: intervalEnd.getTime(),
      students,
      lecturers,
      total: students + lecturers,
      newStudents,
      newLecturers,
      newTotal: newStudents + newLecturers,
    });
  }

  // 3. 6 Months Dataset (Monthly)
  const m6Points: UserGrowthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = formatMonth(monthStart);

    const newStudents = allUsers.filter(
      (u) => u.role === "student" && u.created_at >= monthStart && u.created_at <= monthEnd
    ).length;
    const newLecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at >= monthStart && u.created_at <= monthEnd
    ).length;

    const students = allUsers.filter(
      (u) => u.role === "student" && u.created_at <= monthEnd
    ).length;
    const lecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at <= monthEnd
    ).length;

    m6Points.push({
      date: label,
      timestamp: monthEnd.getTime(),
      students,
      lecturers,
      total: students + lecturers,
      newStudents,
      newLecturers,
      newTotal: newStudents + newLecturers,
    });
  }

  // 4. 12 Months Dataset (Monthly)
  const m12Points: UserGrowthPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = formatMonth(monthStart);

    const newStudents = allUsers.filter(
      (u) => u.role === "student" && u.created_at >= monthStart && u.created_at <= monthEnd
    ).length;
    const newLecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at >= monthStart && u.created_at <= monthEnd
    ).length;

    const students = allUsers.filter(
      (u) => u.role === "student" && u.created_at <= monthEnd
    ).length;
    const lecturers = allUsers.filter(
      (u) => u.role === "lecturer" && u.created_at <= monthEnd
    ).length;

    m12Points.push({
      date: label,
      timestamp: monthEnd.getTime(),
      students,
      lecturers,
      total: students + lecturers,
      newStudents,
      newLecturers,
      newTotal: newStudents + newLecturers,
    });
  }

  return {
    "7d": d7Points,
    "30d": d30Points,
    "6m": m6Points,
    "12m": m12Points,
  };
}
