import { supabase } from "@/lib/supabase";
import {
  AtRiskStudent,
  BulkInterventionPayload,
  EarlyWarningSettings,
  EarlyWarningStats,
  InterventionPayload,
  RiskFactor,
  RiskLevel,
  StudentEnrolledClass,
  SubjectPerformance,
} from "@/types";
import { auditService } from "./audit.service";

export const DEFAULT_EARLY_WARNING_SETTINGS: EarlyWarningSettings = {
  missedAssignmentsWeight: 35,
  quizDeclineWeight: 25,
  inactivityWeight: 25,
  failedQuizzesWeight: 15,
  criticalThreshold: 75,
  highThreshold: 60,
  moderateThreshold: 40,
  lowThreshold: 20,
  inactivityDaysThreshold: 14,
};

const SETTINGS_STORAGE_KEY = "eduspace_early_warning_settings";

export const earlyWarningService = {
  /**
   * Retrieves active risk factor weights and thresholds.
   */
  getSettings(): EarlyWarningSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_EARLY_WARNING_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn("[EarlyWarningService] Could not parse stored settings, using defaults");
    }
    return { ...DEFAULT_EARLY_WARNING_SETTINGS };
  },

  /**
   * Persists customized risk factor weights and thresholds.
   */
  async saveSettings(settings: EarlyWarningSettings): Promise<{ success: boolean; settings: EarlyWarningSettings }> {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

      // Also log audit trail
      await auditService.logAction({
        action: "UPDATE_EARLY_WARNING_SETTINGS",
        details: { settings },
      });

      return { success: true, settings };
    } catch (err: any) {
      console.error("[EarlyWarningService] Error saving settings:", err);
      return { success: false, settings: this.getSettings() };
    }
  },

  /**
   * Resets settings back to default institutional policy.
   */
  async resetSettings(): Promise<{ success: boolean; settings: EarlyWarningSettings }> {
    try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      return { success: true, settings: { ...DEFAULT_EARLY_WARNING_SETTINGS } };
    } catch (err) {
      return { success: false, settings: { ...DEFAULT_EARLY_WARNING_SETTINGS } };
    }
  },

  /**
   * Fetches and computes the risk profile for all students across the platform
   * by joining live data across profiles, student_profiles, enrollments, submissions,
   * quizzes, assignments, and platform activity logs.
   */
  async getAtRiskStudents(customSettings?: Partial<EarlyWarningSettings>): Promise<{
    students: AtRiskStudent[];
    stats: EarlyWarningStats;
    settings: EarlyWarningSettings;
  }> {
    const activeSettings: EarlyWarningSettings = {
      ...this.getSettings(),
      ...(customSettings || {}),
    };

    const wMissed = (activeSettings.missedAssignmentsWeight ?? 35) / 100;
    const wDecline = (activeSettings.quizDeclineWeight ?? 25) / 100;
    const wInactivity = (activeSettings.inactivityWeight ?? 25) / 100;
    const wFailed = (activeSettings.failedQuizzesWeight ?? 15) / 100;
    const inactivityThresholdDays = activeSettings.inactivityDaysThreshold ?? 14;
    try {
      // 1. Fetch all core data tables concurrently with safe fallbacks
      const [
        profilesRes,
        studentProfilesRes,
        rolesRes,
        classesRes,
        coursesRes,
        classStudentsRes,
        courseEnrollmentsRes,
        assignmentsRes,
        assignmentSubmissionsRes,
        quizzesRes,
        quizSubmissionsRes,
        activityLogsRes,
        lecturerProfilesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("student_profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("user_roles").select("user_id, role").then((r) => r, () => ({ data: [] })),
        supabase.from("classes").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("courses").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("class_students").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("course_enrollments").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("assignments").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("assignment_submissions").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("quizzes").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("quiz_submissions").select("*").then((r) => r, () => ({ data: [] })),
        supabase
          .from("user_activity_log")
          .select("user_id, created_at, action_date, action")
          .order("created_at", { ascending: false })
          .limit(3000)
          .then((r) => r, () => ({ data: [] })),
        supabase.from("lecturer_profiles").select("*").then((r) => r, () => ({ data: [] })),
      ]);

      const profiles = profilesRes.data || [];
      const studentProfiles = studentProfilesRes.data || [];
      const roles = rolesRes.data || [];
      const classes = classesRes.data || [];
      const courses = coursesRes.data || [];
      const classStudents = classStudentsRes.data || [];
      const courseEnrollments = courseEnrollmentsRes.data || [];
      const assignments = assignmentsRes.data || [];
      const assignmentSubmissions = assignmentSubmissionsRes.data || [];
      const quizzes = quizzesRes.data || [];
      const quizSubmissions = quizSubmissionsRes.data || [];
      const activityLogs = activityLogsRes.data || [];
      const lecturerProfiles = lecturerProfilesRes.data || [];

      // 2. Build quick lookup for Lecturers & Admins to isolate student accounts
      const nonStudentUserIds = new Set<string>();
      roles.forEach((r: any) => {
        if (r.role === "admin" || r.role === "lecturer") {
          if (r.user_id) nonStudentUserIds.add(r.user_id);
        }
      });

      // Map of lecturer details (by user_id and profile id)
      const lecturerMap = new Map<string, { id: string; full_name: string; email: string; department: string }>();

      profiles.forEach((p: any) => {
        if (p.role === "lecturer" || nonStudentUserIds.has(p.user_id) || nonStudentUserIds.has(p.id)) {
          const entry = {
            id: p.user_id || p.id,
            full_name: p.full_name || "Faculty Member",
            email: p.email || "",
            department: p.department || "General",
          };
          if (p.user_id) lecturerMap.set(p.user_id, entry);
          if (p.id) lecturerMap.set(p.id, entry);
        }
      });

      lecturerProfiles.forEach((lp: any) => {
        const entry = {
          id: lp.user_id || lp.id,
          full_name: lp.full_name || "Faculty Member",
          email: lp.email || "",
          department: lp.department || "General",
        };
        if (lp.user_id) lecturerMap.set(lp.user_id, entry);
        if (lp.id) lecturerMap.set(lp.id, entry);
      });

      // 3. Build lookup maps for classes and courses
      const classMap = new Map<string, any>();
      classes.forEach((c: any) => classMap.set(c.id, c));

      const courseMap = new Map<string, any>();
      courses.forEach((c: any) => courseMap.set(c.id, c));

      // Assignments per class_id / course_id
      const classAssignmentsMap = new Map<string, any[]>();
      assignments.forEach((a: any) => {
        const targetId = a.class_id || a.course_id;
        if (!targetId) return;
        const current = classAssignmentsMap.get(targetId) || [];
        current.push(a);
        classAssignmentsMap.set(targetId, current);
      });

      // Quizzes per class_id / course_id
      const classQuizzesMap = new Map<string, any[]>();
      quizzes.forEach((q: any) => {
        const targetId = q.class_id || q.course_id;
        if (!targetId) return;
        const current = classQuizzesMap.get(targetId) || [];
        current.push(q);
        classQuizzesMap.set(targetId, current);
      });

      // 4. Build unified Student Accounts dictionary
      interface StudentRecord {
        primaryId: string;
        userId: string;
        profileId?: string;
        studentProfileId?: string;
        fullName: string;
        email: string;
        department: string;
        studentId: string;
        avatarUrl?: string | null;
        status: "active" | "suspended";
        createdAt: string;
        updatedAt: string;
        aliases: Set<string>;
      }

      const studentRecordsMap = new Map<string, StudentRecord>();
      const aliasToPrimaryIdMap = new Map<string, string>();

      // Ingest from profiles
      profiles.forEach((p: any) => {
        const uid = p.user_id || p.id;
        if (!uid) return;
        if (nonStudentUserIds.has(uid) || nonStudentUserIds.has(p.user_id) || nonStudentUserIds.has(p.id)) return;
        if (p.role === "admin" || p.role === "lecturer") return;

        const email = (p.email || "").toLowerCase().trim();
        if (email.includes("admin") || email === "mannamganeshbabu8@gmail.com") return;

        const aliases = new Set<string>();
        if (p.user_id) aliases.add(p.user_id);
        if (p.id) aliases.add(p.id);
        if (email) aliases.add(email);
        if (p.student_id) aliases.add(p.student_id.toLowerCase().trim());

        const record: StudentRecord = {
          primaryId: uid,
          userId: p.user_id || uid,
          profileId: p.id,
          fullName: p.full_name || (email ? email.split("@")[0] : "Student"),
          email: p.email || "No email",
          department: p.department || "General",
          studentId: p.student_id || `STU-${uid.slice(0, 6).toUpperCase()}`,
          avatarUrl: p.avatar_url,
          status: p.status === "suspended" ? "suspended" : "active",
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || p.created_at || new Date().toISOString(),
          aliases,
        };

        studentRecordsMap.set(uid, record);
        aliases.forEach((alias) => aliasToPrimaryIdMap.set(alias, uid));
      });

      // Enrich with student_profiles
      studentProfiles.forEach((sp: any) => {
        const uid = sp.user_id || sp.id;
        if (!uid) return;
        if (nonStudentUserIds.has(uid) || (sp.user_id && nonStudentUserIds.has(sp.user_id))) return;

        const email = (sp.email || "").toLowerCase().trim();
        if (email.includes("admin") || email === "mannamganeshbabu8@gmail.com") return;

        // Check if student already exists via aliases
        let matchedPrimaryId =
          (sp.user_id && aliasToPrimaryIdMap.get(sp.user_id)) ||
          (sp.id && aliasToPrimaryIdMap.get(sp.id)) ||
          (email && aliasToPrimaryIdMap.get(email)) ||
          (sp.register_number && aliasToPrimaryIdMap.get(sp.register_number.toLowerCase().trim()));

        if (matchedPrimaryId && studentRecordsMap.has(matchedPrimaryId)) {
          const existing = studentRecordsMap.get(matchedPrimaryId)!;
          if (sp.id) {
            existing.studentProfileId = sp.id;
            existing.aliases.add(sp.id);
            aliasToPrimaryIdMap.set(sp.id, matchedPrimaryId);
          }
          if (sp.register_number) {
            existing.studentId = sp.register_number;
            existing.aliases.add(sp.register_number.toLowerCase().trim());
            aliasToPrimaryIdMap.set(sp.register_number.toLowerCase().trim(), matchedPrimaryId);
          }
          if (sp.full_name && (!existing.fullName || existing.fullName === "Student")) {
            existing.fullName = sp.full_name;
          }
          if (sp.department && (!existing.department || existing.department === "General")) {
            existing.department = sp.department;
          }
          if (sp.profile_image && !existing.avatarUrl) {
            existing.avatarUrl = sp.profile_image;
          }
        } else {
          const aliases = new Set<string>();
          if (sp.user_id) aliases.add(sp.user_id);
          if (sp.id) aliases.add(sp.id);
          if (email) aliases.add(email);
          if (sp.register_number) aliases.add(sp.register_number.toLowerCase().trim());

          const record: StudentRecord = {
            primaryId: uid,
            userId: sp.user_id || uid,
            studentProfileId: sp.id,
            fullName: sp.full_name || (email ? email.split("@")[0] : "Student"),
            email: sp.email || "No email",
            department: sp.department || "General",
            studentId: sp.register_number || `STU-${uid.slice(0, 6).toUpperCase()}`,
            avatarUrl: sp.profile_image,
            status: "active",
            createdAt: sp.created_at || new Date().toISOString(),
            updatedAt: sp.created_at || new Date().toISOString(),
            aliases,
          };

          studentRecordsMap.set(uid, record);
          aliases.forEach((alias) => aliasToPrimaryIdMap.set(alias, uid));
        }
      });

      // 5. Index Enrollments per student
      const studentEnrollmentsMap = new Map<string, Map<string, StudentEnrolledClass>>();

      const addEnrollment = (studentKey: string, classObj: any, courseCode?: string) => {
        if (!studentKey || !classObj) return;
        const primaryId = aliasToPrimaryIdMap.get(studentKey) || (studentRecordsMap.has(studentKey) ? studentKey : null);
        if (!primaryId) return;

        let enrollments = studentEnrollmentsMap.get(primaryId);
        if (!enrollments) {
          enrollments = new Map();
          studentEnrollmentsMap.set(primaryId, enrollments);
        }

        const lecturerObj = classObj.lecturer_id ? lecturerMap.get(classObj.lecturer_id) : null;
        const enrolledItem: StudentEnrolledClass = {
          id: classObj.id,
          name: classObj.class_name || classObj.title || "Course",
          courseCode: classObj.course_code || courseCode || "",
          lecturerId: classObj.lecturer_id || undefined,
          lecturerName: lecturerObj?.full_name || classObj.lecturer_name || undefined,
          lecturerEmail: lecturerObj?.email || undefined,
        };

        enrollments.set(classObj.id, enrolledItem);
      };

      // Ingest from class_students
      classStudents.forEach((cs: any) => {
        const classObj = classMap.get(cs.class_id) || { id: cs.class_id, class_name: cs.class_name };
        if (cs.student_id) addEnrollment(cs.student_id, classObj, cs.course_code);
        if (cs.email) addEnrollment(cs.email.toLowerCase().trim(), classObj, cs.course_code);
      });

      // Ingest from course_enrollments
      courseEnrollments.forEach((ce: any) => {
        const courseObj = courseMap.get(ce.course_id) || { id: ce.course_id, title: "Course" };
        if (ce.student_id) addEnrollment(ce.student_id, courseObj, courseObj.course_code);
      });

      // 6. Index Assignment Submissions per student
      const studentAssignmentSubmissionsMap = new Map<string, Map<string, any>>();
      assignmentSubmissions.forEach((sub: any) => {
        const sKey = sub.student_id;
        if (!sKey) return;
        const primaryId = aliasToPrimaryIdMap.get(sKey) || (studentRecordsMap.has(sKey) ? sKey : null);
        if (!primaryId) return;

        let subMap = studentAssignmentSubmissionsMap.get(primaryId);
        if (!subMap) {
          subMap = new Map();
          studentAssignmentSubmissionsMap.set(primaryId, subMap);
        }
        subMap.set(sub.assignment_id, sub);
      });

      // 7. Index Quiz Submissions per student
      const studentQuizSubmissionsMap = new Map<string, any[]>();
      quizSubmissions.forEach((qs: any) => {
        const sKey = qs.student_id;
        if (!sKey) return;
        const primaryId = aliasToPrimaryIdMap.get(sKey) || (studentRecordsMap.has(sKey) ? sKey : null);
        if (!primaryId) return;

        const current = studentQuizSubmissionsMap.get(primaryId) || [];
        current.push(qs);
        studentQuizSubmissionsMap.set(primaryId, current);
      });

      // 8. Index Platform Activity Timestamps
      const latestActivityMap = new Map<string, Date>();
      activityLogs.forEach((log: any) => {
        const uKey = log.user_id;
        if (!uKey) return;
        const dateStr = log.created_at || log.action_date;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;

        const primaryId = aliasToPrimaryIdMap.get(uKey) || (studentRecordsMap.has(uKey) ? uKey : null);
        if (!primaryId) return;

        const existing = latestActivityMap.get(primaryId);
        if (!existing || d > existing) {
          latestActivityMap.set(primaryId, d);
        }
      });

      // 9. Process and score every student
      const now = new Date();
      const atRiskStudents: AtRiskStudent[] = [];

      studentRecordsMap.forEach((student, primaryId) => {
        const enrolledMap = studentEnrollmentsMap.get(primaryId) || new Map<string, StudentEnrolledClass>();
        const enrolledClasses = Array.from(enrolledMap.values());

        // --- Factor 1: Missed Assignments (35% weight) ---
        let pastDueCount = 0;
        let missedCount = 0;
        const studentSubs = studentAssignmentSubmissionsMap.get(primaryId) || new Map<string, any>();

        // Gather assignments for enrolled classes
        enrolledClasses.forEach((cls) => {
          const classAssigns = classAssignmentsMap.get(cls.id) || [];
          classAssigns.forEach((a) => {
            const dueDate = a.due_date ? new Date(a.due_date) : null;
            if (dueDate && dueDate < now) {
              pastDueCount++;
              const sub = studentSubs.get(a.id);
              if (!sub) {
                missedCount++;
              } else if (sub.submitted_at && new Date(sub.submitted_at) > dueDate) {
                missedCount += 0.5; // Partial penalty for late submission
              }
            }
          });
        });

        // Also check if any assignment submitted directly
        studentSubs.forEach((sub, assignId) => {
          const assignObj = assignments.find((a: any) => a.id === assignId);
          if (assignObj?.due_date) {
            const dueDate = new Date(assignObj.due_date);
            if (dueDate < now && !enrolledClasses.some((c) => c.id === assignObj.class_id || c.id === assignObj.course_id)) {
              pastDueCount++;
              if (sub.submitted_at && new Date(sub.submitted_at) > dueDate) {
                missedCount += 0.5;
              }
            }
          }
        });

        let missedAssignmentsScore = 0;
        if (pastDueCount > 0) {
          missedAssignmentsScore = Math.min(100, Math.round((missedCount / pastDueCount) * 100));
        }

        const missedFactor: RiskFactor = {
          type: "missed_assignments",
          label: "Missed Assignments",
          score: missedAssignmentsScore,
          weight: wMissed,
          metricValue: `${missedCount} / ${pastDueCount}`,
          detail:
            pastDueCount === 0
              ? "No past due assignments recorded in enrolled courses."
              : missedCount === 0
              ? `All ${pastDueCount} assignments submitted on time.`
              : `${missedCount} of ${pastDueCount} assignments missed or overdue.`,
          status:
            missedAssignmentsScore >= 60
              ? "critical"
              : missedAssignmentsScore >= 30
              ? "warning"
              : "safe",
        };

        // --- Factor 2: Declining Quiz Performance Trends ---
        const userQuizSubs = studentQuizSubmissionsMap.get(primaryId) || [];
        const sortedQuizSubs = [...userQuizSubs].sort(
          (a, b) =>
            new Date(a.submitted_at || a.created_at || 0).getTime() -
            new Date(b.submitted_at || b.created_at || 0).getTime()
        );

        let quizDeclineScore = 0;
        let recentAvg = 0;
        let overallAvg = 0;
        let declineDetail = "No quiz attempts recorded.";

        if (sortedQuizSubs.length > 0) {
          const scores = sortedQuizSubs.map((qs) => {
            const obtained = qs.total_obtained ?? qs.score ?? 0;
            const quizObj = quizzes.find((q: any) => q.id === qs.quiz_id);
            const total = quizObj?.total_marks || 100;
            return total > 0 ? Math.min(100, (obtained / total) * 100) : 0;
          });

          overallAvg = Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length);

          if (scores.length >= 2) {
            const midpoint = Math.floor(scores.length / 2);
            const earlierScores = scores.slice(0, midpoint);
            const recentScores = scores.slice(midpoint);

            const earlierAvg = Math.round(earlierScores.reduce((acc, s) => acc + s, 0) / earlierScores.length);
            recentAvg = Math.round(recentScores.reduce((acc, s) => acc + s, 0) / recentScores.length);

            const drop = earlierAvg - recentAvg;

            if (drop > 0) {
              quizDeclineScore = Math.min(100, Math.round(drop * 2.5));
              declineDetail = `Recent quiz avg (${recentAvg}%) dropped by ${drop}% from baseline (${earlierAvg}%).`;
            } else if (recentAvg < 50) {
              quizDeclineScore = Math.min(100, Math.round((50 - recentAvg) * 2));
              declineDetail = `Consistently low quiz performance (average: ${recentAvg}%).`;
            } else {
              quizDeclineScore = 0;
              declineDetail = `Quiz scores steady and positive (recent average: ${recentAvg}%).`;
            }
          } else {
            recentAvg = scores[0];
            if (recentAvg < 50) {
              quizDeclineScore = Math.min(100, (50 - recentAvg) * 2);
              declineDetail = `Initial quiz attempt below passing standard (${recentAvg}%).`;
            } else {
              quizDeclineScore = 0;
              declineDetail = `Single quiz attempt recorded: ${recentAvg}%.`;
            }
          }
        }

        const declineFactor: RiskFactor = {
          type: "quiz_decline",
          label: "Quiz Performance Trend",
          score: quizDeclineScore,
          weight: wDecline,
          metricValue: `${recentAvg || overallAvg || 0}%`,
          detail: declineDetail,
          status:
            quizDeclineScore >= 60
              ? "critical"
              : quizDeclineScore >= 30
              ? "warning"
              : "safe",
        };

        // --- Factor 3: Platform Inactivity ---
        let lastActivityDate: Date | null = latestActivityMap.get(primaryId) || null;

        // Fallback checks from submissions or profile timestamps
        sortedQuizSubs.forEach((qs) => {
          const dStr = qs.submitted_at || qs.created_at;
          if (dStr) {
            const subDate = new Date(dStr);
            if (!lastActivityDate || subDate > lastActivityDate) {
              lastActivityDate = subDate;
            }
          }
        });

        studentSubs.forEach((as) => {
          const dStr = as.submitted_at || as.created_at;
          if (dStr) {
            const subDate = new Date(dStr);
            if (!lastActivityDate || subDate > lastActivityDate) {
              lastActivityDate = subDate;
            }
          }
        });

        if (!lastActivityDate && student.updatedAt) {
          const pDate = new Date(student.updatedAt);
          if (!isNaN(pDate.getTime())) lastActivityDate = pDate;
        }

        let daysSinceLastActivity = 21;
        let inactivityScore = 0;
        let inactivityDetail = "No historical activity log detected.";

        if (lastActivityDate && !isNaN(lastActivityDate.getTime())) {
          const diffMs = now.getTime() - lastActivityDate.getTime();
          daysSinceLastActivity = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

          if (daysSinceLastActivity >= inactivityThresholdDays) {
            inactivityScore = Math.min(100, 70 + (daysSinceLastActivity - inactivityThresholdDays) * 2);
            inactivityDetail = `Inactive for ${daysSinceLastActivity} consecutive days (exceeds ${inactivityThresholdDays}d threshold).`;
          } else if (daysSinceLastActivity >= Math.floor(inactivityThresholdDays / 2)) {
            inactivityScore = Math.round((daysSinceLastActivity / inactivityThresholdDays) * 70);
            inactivityDetail = `Inactive for ${daysSinceLastActivity} days. Engagement fading.`;
          } else if (daysSinceLastActivity >= 3) {
            inactivityScore = Math.round((daysSinceLastActivity / inactivityThresholdDays) * 30);
            inactivityDetail = `Active ${daysSinceLastActivity} days ago.`;
          } else {
            inactivityScore = 0;
            inactivityDetail = daysSinceLastActivity === 0 ? "Active today on platform." : `Active ${daysSinceLastActivity} day ago.`;
          }
        } else {
          inactivityScore = 75;
          inactivityDetail = "No user activity records found.";
        }

        const inactivityFactor: RiskFactor = {
          type: "inactivity",
          label: "Platform Inactivity",
          score: inactivityScore,
          weight: wInactivity,
          metricValue: `${daysSinceLastActivity}d`,
          detail: inactivityDetail,
          status:
            inactivityScore >= 60
              ? "critical"
              : inactivityScore >= 30
              ? "warning"
              : "safe",
        };

        // --- Factor 4: Failed Quizzes ---
        let failedQuizzesCount = 0;
        sortedQuizSubs.forEach((qs) => {
          if (qs.status === "failed") {
            failedQuizzesCount++;
          } else {
            const quizObj = quizzes.find((q: any) => q.id === qs.quiz_id);
            const passPercentage = quizObj?.pass_percentage || 40;
            const total = quizObj?.total_marks || 100;
            const obtained = qs.total_obtained ?? qs.score ?? 0;
            const pct = total > 0 ? (obtained / total) * 100 : 0;
            if (pct < passPercentage) {
              failedQuizzesCount++;
            }
          }
        });

        let failedQuizzesScore = 0;
        if (sortedQuizSubs.length > 0) {
          failedQuizzesScore = Math.min(100, Math.round((failedQuizzesCount / sortedQuizSubs.length) * 100));
        }

        const failedQuizzesFactor: RiskFactor = {
          type: "failed_quizzes",
          label: "Failed Quizzes",
          score: failedQuizzesScore,
          weight: wFailed,
          metricValue: `${failedQuizzesCount} / ${sortedQuizSubs.length}`,
          detail:
            sortedQuizSubs.length === 0
              ? "No quizzes attempted yet."
              : failedQuizzesCount === 0
              ? `Passed all ${sortedQuizSubs.length} attempted quizzes.`
              : `${failedQuizzesCount} of ${sortedQuizSubs.length} quizzes failed.`,
          status:
            failedQuizzesScore >= 60
              ? "critical"
              : failedQuizzesScore >= 30
              ? "warning"
              : "safe",
        };

        // --- Calculate Final Weighted Risk Score with Dynamic Weights ---
        const weightedScore =
          missedAssignmentsScore * wMissed +
          quizDeclineScore * wDecline +
          inactivityScore * wInactivity +
          failedQuizzesScore * wFailed;

        const finalRiskScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

        let riskLevel: RiskLevel = "safe";
        if (finalRiskScore >= activeSettings.criticalThreshold) {
          riskLevel = "critical";
        } else if (finalRiskScore >= activeSettings.highThreshold) {
          riskLevel = "high";
        } else if (finalRiskScore >= activeSettings.moderateThreshold) {
          riskLevel = "moderate";
        } else if (finalRiskScore >= activeSettings.lowThreshold) {
          riskLevel = "low";
        } else {
          riskLevel = "safe";
        }

        atRiskStudents.push({
          id: primaryId,
          userId: student.userId,
          fullName: student.fullName,
          email: student.email,
          department: student.department,
          studentId: student.studentId,
          avatarUrl: student.avatarUrl,
          status: student.status,
          riskScore: finalRiskScore,
          riskLevel,
          factors: [missedFactor, declineFactor, inactivityFactor, failedQuizzesFactor],
          missedAssignmentsCount: Math.round(missedCount),
          totalAssignmentsCount: pastDueCount,
          failedQuizzesCount,
          totalQuizzesCount: sortedQuizSubs.length,
          lastActivityDate: lastActivityDate ? lastActivityDate.toISOString() : null,
          daysSinceLastActivity,
          enrolledClasses,
          recentQuizAverage: recentAvg || undefined,
          overallQuizAverage: overallAvg || undefined,
          assignmentCompletionRate:
            pastDueCount > 0 ? Math.round(((pastDueCount - missedCount) / pastDueCount) * 100) : 100,
        });
      });

      // Sort by risk score descending
      atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);

      // 10. Summary aggregates
      const totalStudents = atRiskStudents.length;
      const criticalRisk = atRiskStudents.filter((s) => s.riskLevel === "critical").length;
      const highRisk = atRiskStudents.filter((s) => s.riskLevel === "high").length;
      const moderateRisk = atRiskStudents.filter((s) => s.riskLevel === "moderate").length;
      const lowRisk = atRiskStudents.filter((s) => s.riskLevel === "low").length;
      const safeCount = atRiskStudents.filter((s) => s.riskLevel === "safe").length;
      const totalAtRisk = criticalRisk + highRisk + moderateRisk + lowRisk;

      const sumRisk = atRiskStudents.reduce((acc, s) => acc + s.riskScore, 0);
      const averageRiskScore = totalStudents > 0 ? Math.round(sumRisk / totalStudents) : 0;

      const stats: EarlyWarningStats = {
        totalStudents,
        totalAtRisk,
        criticalRisk,
        highRisk,
        moderateRisk,
        lowRisk,
        safeCount,
        averageRiskScore,
      };

      return { students: atRiskStudents, stats, settings: activeSettings };
    } catch (err) {
      console.error("[EarlyWarningService] Error fetching real Supabase student risk data:", err);
      return {
        students: [],
        stats: {
          totalStudents: 0,
          totalAtRisk: 0,
          criticalRisk: 0,
          highRisk: 0,
          moderateRisk: 0,
          lowRisk: 0,
          safeCount: 0,
          averageRiskScore: 0,
        },
        settings: activeSettings,
      };
    }
  },

  /**
   * Aggregates subject and class performance directly from Supabase tables
   * to build live heatmap and bottleneck dataset.
   */
  async getSubjectPerformanceData(): Promise<SubjectPerformance[]> {
    try {
      const [
        classesRes,
        coursesRes,
        classStudentsRes,
        courseEnrollmentsRes,
        assignmentsRes,
        assignmentSubsRes,
        quizzesRes,
        quizSubsRes,
        lecturerProfilesRes,
        profilesRes,
      ] = await Promise.all([
        supabase.from("classes").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("courses").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("class_students").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("course_enrollments").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("assignments").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("assignment_submissions").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("quizzes").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("quiz_submissions").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("lecturer_profiles").select("*").then((r) => r, () => ({ data: [] })),
        supabase.from("profiles").select("*").then((r) => r, () => ({ data: [] })),
      ]);

      const classes = classesRes.data || [];
      const courses = coursesRes.data || [];
      const classStudents = classStudentsRes.data || [];
      const courseEnrollments = courseEnrollmentsRes.data || [];
      const assignments = assignmentsRes.data || [];
      const assignmentSubs = assignmentSubsRes.data || [];
      const quizzes = quizzesRes.data || [];
      const quizSubs = quizSubsRes.data || [];
      const lecturerProfiles = lecturerProfilesRes.data || [];
      const profiles = profilesRes.data || [];

      // Lecturer lookup
      const lecturerMap = new Map<string, string>();
      lecturerProfiles.forEach((lp: any) => {
        if (lp.user_id) lecturerMap.set(lp.user_id, lp.full_name);
        if (lp.id) lecturerMap.set(lp.id, lp.full_name);
      });
      profiles.forEach((p: any) => {
        if (p.full_name) {
          if (p.user_id && !lecturerMap.has(p.user_id)) lecturerMap.set(p.user_id, p.full_name);
          if (p.id && !lecturerMap.has(p.id)) lecturerMap.set(p.id, p.full_name);
        }
      });

      // Unified class/subject items
      interface SubjectItem {
        id: string;
        name: string;
        code: string;
        lecturerId?: string;
        lecturerName: string;
        studentCount: number;
        assignments: any[];
        quizzes: any[];
      }

      const subjectItemsMap = new Map<string, SubjectItem>();

      // 1. Process classes
      classes.forEach((cls: any) => {
        const lecturerName =
          (cls.lecturer_id && lecturerMap.get(cls.lecturer_id)) || cls.lecturer_name || "Faculty Member";

        const enrolled = classStudents.filter((cs: any) => cs.class_id === cls.id).length;
        const clsAssignments = assignments.filter((a: any) => a.class_id === cls.id || a.course_id === cls.id);
        const clsQuizzes = quizzes.filter((q: any) => q.class_id === cls.id || q.course_id === cls.id);

        subjectItemsMap.set(cls.id, {
          id: cls.id,
          name: cls.class_name || "Class",
          code: cls.course_code || "GEN",
          lecturerId: cls.lecturer_id,
          lecturerName,
          studentCount: enrolled,
          assignments: clsAssignments,
          quizzes: clsQuizzes,
        });
      });

      // 2. Process courses not already in classes
      courses.forEach((crs: any) => {
        if (subjectItemsMap.has(crs.id)) return;

        const lecturerName =
          (crs.lecturer_id && lecturerMap.get(crs.lecturer_id)) || "Faculty Member";

        const enrolled = courseEnrollments.filter((ce: any) => ce.course_id === crs.id).length;
        const crsAssignments = assignments.filter((a: any) => a.course_id === crs.id || a.class_id === crs.id);
        const crsQuizzes = quizzes.filter((q: any) => q.course_id === crs.id || q.class_id === crs.id);

        subjectItemsMap.set(crs.id, {
          id: crs.id,
          name: crs.title || "Course",
          code: crs.course_code || "GEN",
          lecturerId: crs.lecturer_id,
          lecturerName,
          studentCount: enrolled,
          assignments: crsAssignments,
          quizzes: crsQuizzes,
        });
      });

      const heatmapData: SubjectPerformance[] = Array.from(subjectItemsMap.values()).map((subj) => {
        const assignIds = new Set(subj.assignments.map((a) => a.id));
        const quizIds = new Set(subj.quizzes.map((q) => q.id));

        const relevantAssignSubs = assignmentSubs.filter((s: any) => assignIds.has(s.assignment_id));
        const relevantQuizSubs = quizSubs.filter((qs: any) => quizIds.has(qs.quiz_id));

        // Actual Submissions vs Expected
        const expectedCount = (subj.assignments.length + subj.quizzes.length) * Math.max(1, subj.studentCount);
        const actualCount = relevantAssignSubs.length + relevantQuizSubs.length;

        const submissionRate =
          expectedCount > 0
            ? Math.min(100, Math.round((actualCount / expectedCount) * 100))
            : subj.studentCount > 0
            ? 80
            : 0;

        // Quiz pass rate & scores
        let totalQuizScore = 0;
        let passedQuizzes = 0;
        relevantQuizSubs.forEach((qs: any) => {
          const qObj = subj.quizzes.find((q) => q.id === qs.quiz_id);
          const totalMarks = qObj?.total_marks || 100;
          const passPct = qObj?.pass_percentage || 40;
          const obtained = qs.total_obtained ?? qs.score ?? 0;
          const pct = totalMarks > 0 ? (obtained / totalMarks) * 100 : 0;
          totalQuizScore += pct;
          if (qs.status === "passed" || pct >= passPct) {
            passedQuizzes++;
          }
        });

        // Assignment pass rate & scores
        let totalAssignScore = 0;
        let passedAssigns = 0;
        let gradedCount = 0;
        relevantAssignSubs.forEach((as: any) => {
          if (as.grade !== null && as.grade !== undefined) {
            totalAssignScore += as.grade;
            gradedCount++;
            if (as.grade >= 50) {
              passedAssigns++;
            }
          }
        });

        const totalEvaluated = relevantQuizSubs.length + gradedCount;
        const totalPassed = passedQuizzes + passedAssigns;

        const passRate =
          totalEvaluated > 0
            ? Math.min(100, Math.round((totalPassed / totalEvaluated) * 100))
            : subj.studentCount > 0
            ? 75
            : 0;

        const avgScore =
          totalEvaluated > 0
            ? Math.min(100, Math.round((totalQuizScore + totalAssignScore) / totalEvaluated))
            : subj.studentCount > 0
            ? 72
            : 0;

        const isAtRisk = passRate < 50 || avgScore < 50;

        return {
          classId: subj.id,
          className: subj.name,
          courseCode: subj.code,
          lecturerId: subj.lecturerId,
          lecturerName: subj.lecturerName,
          avgScore,
          passRate,
          totalStudents: subj.studentCount,
          submissionRate,
          totalAssignments: subj.assignments.length,
          totalQuizzes: subj.quizzes.length,
          isAtRisk,
        };
      });

      // Sort by passRate ascending (critical first)
      heatmapData.sort((a, b) => a.passRate - b.passRate);

      return heatmapData;
    } catch (err) {
      console.error("[EarlyWarningService] Error computing live heatmap data:", err);
      return [];
    }
  },

  /**
   * Dispatches a real-time intervention nudge directly to Supabase notifications table.
   */
  async sendNudgeNotification(payload: InterventionPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const notificationRow = {
        recipient_id: payload.studentUserId,
        user_id: payload.studentUserId,
        sender_id: user.id,
        title: payload.title,
        message: payload.message,
        type: "academic_warning",
        action_type: "early_warning_nudge",
        metadata: {
          category: "retention_intervention",
          intervention_type: payload.type,
          student_email: payload.studentEmail,
          student_name: payload.studentName,
          timestamp: new Date().toISOString(),
        },
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("notifications").insert(notificationRow);
      if (error) {
        console.warn("[EarlyWarningService] Direct notification insert warning:", error);
      }

      // If email delivery is selected, invoke the Edge Function
      let emailDispatched = false;
      if (payload.sendEmail) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-early-warning-email", {
            body: {
              recipientEmail: payload.studentEmail,
              recipientName: payload.studentName,
              title: payload.title,
              message: payload.message,
              interventionType: payload.type,
            },
          });
          if (!emailError) {
            emailDispatched = true;
          } else {
            console.warn("[EarlyWarningService] Edge email delivery error:", emailError);
          }
        } catch (emailErr) {
          console.warn("[EarlyWarningService] Email dispatch exception:", emailErr);
        }
      }

      // Record in admin audit trail
      await auditService.logAction({
        action: "EARLY_WARNING_INTERVENTION_NUDGE",
        targetUserId: payload.studentUserId,
        targetEmail: payload.studentEmail,
        details: {
          student_name: payload.studentName,
          title: payload.title,
          intervention_type: payload.type,
          email_dispatched: emailDispatched || payload.sendEmail,
        },
      });

      return { success: true };
    } catch (err: any) {
      console.error("[EarlyWarningService] Error sending intervention nudge:", err);
      return { success: false, error: err.message || "Failed to deliver intervention notice" };
    }
  },

  /**
   * Alerts assigned faculty members via Supabase notifications table.
   */
  async alertLecturer(params: {
    student: AtRiskStudent;
    customNote?: string;
    sendEmail?: boolean;
    targetLecturerIds?: string[];
  }): Promise<{ success: boolean; alertedLecturersCount: number; error?: string }> {
    try {
      const { student, customNote, sendEmail = true, targetLecturerIds } = params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const lecturerMap = new Map<string, { id: string; name?: string; email?: string; classNames: string[] }>();

      student.enrolledClasses.forEach((cls) => {
        if (!cls.lecturerId) return;
        if (targetLecturerIds && targetLecturerIds.length > 0 && !targetLecturerIds.includes(cls.lecturerId)) {
          return;
        }
        const existing = lecturerMap.get(cls.lecturerId);
        if (existing) {
          if (!existing.classNames.includes(cls.name)) {
            existing.classNames.push(cls.name);
          }
        } else {
          lecturerMap.set(cls.lecturerId, {
            id: cls.lecturerId,
            name: cls.lecturerName,
            email: cls.lecturerEmail,
            classNames: [cls.name],
          });
        }
      });

      const lecturers = Array.from(lecturerMap.values());

      if (lecturers.length === 0) {
        return {
          success: false,
          alertedLecturersCount: 0,
          error: "No assigned faculty found for this student's courses.",
        };
      }

      // Robust fallback: fetch any missing lecturer emails directly from profiles
      const missingEmailIds = lecturers.filter((l) => !l.email).map((l) => l.id);
      if (missingEmailIds.length > 0) {
        try {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, user_id, email, full_name")
            .in("user_id", missingEmailIds);

          (profs || []).forEach((p: any) => {
            const matched = lecturers.find((l) => l.id === p.id || l.id === p.user_id);
            if (matched && !matched.email && p.email) {
              matched.email = p.email;
              if (p.full_name && (!matched.name || matched.name === "Course Lecturer")) {
                matched.name = p.full_name;
              }
            }
          });
        } catch (e) {
          console.warn("[EarlyWarningService] Could not lookup missing lecturer profiles:", e);
        }
      }

      const factorSummary = student.factors
        .filter((f) => f.score >= 30)
        .map((f) => `${f.label}: ${f.detail}`)
        .join("; ");

      const nowIso = new Date().toISOString();
      const notificationRows = lecturers.map((lecturer) => ({
        recipient_id: lecturer.id,
        user_id: lecturer.id,
        sender_id: user.id,
        title: `Academic Retention Alert: ${student.fullName}`,
        message: `Student ${student.fullName} (${student.email}) in ${lecturer.classNames.join(", ")} has been flagged with a ${student.riskLevel.toUpperCase()} retention risk score (${student.riskScore}/100). Key factors: ${
          factorSummary || "Multiple missed milestones"
        }.${customNote ? ` Note: ${customNote}` : " Please review and consider initiating an academic check-in."}`,
        type: "alert",
        action_type: "lecturer_risk_alert",
        metadata: {
          category: "retention_alert",
          student_user_id: student.userId,
          student_name: student.fullName,
          student_email: student.email,
          risk_score: student.riskScore,
          risk_level: student.riskLevel,
          enrolled_classes: lecturer.classNames,
          email_dispatched: Boolean(sendEmail),
        },
        is_read: false,
        created_at: nowIso,
      }));

      const { error } = await supabase.from("notifications").insert(notificationRows);
      if (error) {
        console.warn("[EarlyWarningService] Lecturer alert insert warning:", error);
      }

      // If email delivery is enabled, dispatch email to lecturers
      if (sendEmail) {
        lecturers.forEach((lecturer) => {
          if (lecturer.email) {
            console.log(`[EarlyWarningService] Sending retention alert email to lecturer: ${lecturer.email}`);
            supabase.functions
              .invoke("send-early-warning-email", {
                body: {
                  recipientEmail: lecturer.email,
                  recipientName: lecturer.name || "Faculty Member",
                  title: `[FACULTY ADVISORY] Academic Retention Notice: ${student.fullName}`,
                  message: `Student ${student.fullName} (${student.email}) enrolled in ${lecturer.classNames.join(
                    ", "
                  )} has been flagged with a ${student.riskLevel.toUpperCase()} retention risk score (${
                    student.riskScore
                  }/100).\n\nKey Milestone Indicators:\n${
                    factorSummary || "Multiple missed milestones"
                  }\n\n${customNote ? `Admin Confidential Note:\n${customNote}\n\n` : ""}Please review their milestone submissions in your lecturer portal and initiate an academic consultation.`,
                  department: student.department,
                  riskLevel: student.riskLevel,
                  riskScore: student.riskScore,
                },
              })
              .then((res) => {
                if (res.error) console.error("[EarlyWarningService] Edge email delivery error:", res.error);
                else console.log("[EarlyWarningService] Edge email response:", res.data);
              })
              .catch((err) => console.warn(`[EarlyWarningService] Lecturer email failed for ${lecturer.email}:`, err));
          } else {
            console.warn(`[EarlyWarningService] Lecturer ${lecturer.name} (${lecturer.id}) has no registered email address.`);
          }
        });
      }

      // Log audit
      await auditService.logAction({
        action: "EARLY_WARNING_LECTURER_ALERT",
        targetUserId: student.userId,
        targetEmail: student.email,
        details: {
          student_name: student.fullName,
          risk_score: student.riskScore,
          risk_level: student.riskLevel,
          email_dispatched: Boolean(sendEmail),
          lecturers_notified: lecturers.map((l) => l.name || l.email || l.id),
        },
      });

      return { success: true, alertedLecturersCount: lecturers.length };
    } catch (err: any) {
      console.error("[EarlyWarningService] Error alerting faculty members:", err);
      return { success: false, alertedLecturersCount: 0, error: err.message || "Failed to alert faculty" };
    }
  },

  /**
   * Dispatches bulk intervention notifications to multiple students concurrently.
   */
  async sendBulkNudge(payload: BulkInterventionPayload): Promise<{
    success: boolean;
    deliveredCount: number;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!payload.students || payload.students.length === 0) {
        return { success: true, deliveredCount: 0 };
      }

      const nowIso = new Date().toISOString();
      const notificationRows = payload.students.map((student) => ({
        recipient_id: student.userId,
        user_id: student.userId,
        sender_id: user.id,
        title: payload.title,
        message: payload.message,
        type: "academic_warning",
        action_type: "early_warning_nudge",
        metadata: {
          category: "retention_intervention",
          intervention_type: payload.type,
          student_email: student.studentEmail,
          student_name: student.studentName,
          timestamp: nowIso,
          bulk_dispatch: true,
          email_dispatched: Boolean(payload.sendEmail),
        },
        is_read: false,
        created_at: nowIso,
      }));

      const { error } = await supabase.from("notifications").insert(notificationRows);
      if (error) {
        console.warn("[EarlyWarningService] Bulk notification insert warning:", error);
      }

      // If email delivery is selected, broadcast email via Edge Function
      if (payload.sendEmail) {
        payload.students.forEach((student) => {
          supabase.functions
            .invoke("send-early-warning-email", {
              body: {
                recipientEmail: student.studentEmail,
                recipientName: student.studentName,
                title: payload.title,
                message: payload.message,
                interventionType: payload.type,
              },
            })
            .catch((err) => console.warn(`[EarlyWarningService] Bulk email failed for ${student.studentEmail}:`, err));
        });
      }

      // Record consolidated audit trail
      await auditService.logAction({
        action: "EARLY_WARNING_BULK_NUDGE",
        details: {
          total_recipients: payload.students.length,
          title: payload.title,
          intervention_type: payload.type,
          email_dispatched: Boolean(payload.sendEmail),
          student_names: payload.students.map((s) => s.studentName).slice(0, 10),
        },
      });

      return { success: true, deliveredCount: payload.students.length };
    } catch (err: any) {
      console.error("[EarlyWarningService] Error sending bulk intervention nudge:", err);
      return { success: false, deliveredCount: 0, error: err.message || "Failed to deliver bulk notices" };
    }
  },

  /**
   * Alerts all assigned faculty members across multiple students in bulk.
   */
  async bulkAlertLecturers(params: {
    students: AtRiskStudent[];
    customNote?: string;
    sendEmail?: boolean;
  }): Promise<{
    success: boolean;
    alertedLecturersCount: number;
    affectedStudentsCount: number;
    error?: string;
  }> {
    try {
      const { students, customNote, sendEmail = true } = params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!students || students.length === 0) {
        return { success: true, alertedLecturersCount: 0, affectedStudentsCount: 0 };
      }

      // Map: lecturerId -> { id, name, email, students: { name, email, riskLevel, riskScore, classes }[] }
      const lecturerAggMap = new Map<
        string,
        {
          id: string;
          name?: string;
          email?: string;
          students: { name: string; email: string; riskLevel: string; riskScore: number; classes: string[] }[];
        }
      >();

      students.forEach((student) => {
        student.enrolledClasses.forEach((cls) => {
          if (!cls.lecturerId) return;
          let entry = lecturerAggMap.get(cls.lecturerId);
          if (!entry) {
            entry = {
              id: cls.lecturerId,
              name: cls.lecturerName,
              email: cls.lecturerEmail,
              students: [],
            };
            lecturerAggMap.set(cls.lecturerId, entry);
          }

          const existingStudent = entry.students.find((s) => s.email === student.email);
          if (existingStudent) {
            if (!existingStudent.classes.includes(cls.name)) {
              existingStudent.classes.push(cls.name);
            }
          } else {
            entry.students.push({
              name: student.fullName,
              email: student.email,
              riskLevel: student.riskLevel,
              riskScore: student.riskScore,
              classes: [cls.name],
            });
          }
        });
      });

      const lecturers = Array.from(lecturerAggMap.values());
      if (lecturers.length === 0) {
        return {
          success: false,
          alertedLecturersCount: 0,
          affectedStudentsCount: 0,
          error: "No assigned faculty members found for the selected students.",
        };
      }

      const nowIso = new Date().toISOString();
      const notificationRows = lecturers.map((lecturer) => {
        const studentSummary = lecturer.students
          .map((s) => `• ${s.name} (${s.riskLevel.toUpperCase()}, Score: ${s.riskScore}) in ${s.classes.join(", ")}`)
          .join("\n");

        return {
          recipient_id: lecturer.id,
          user_id: lecturer.id,
          sender_id: user.id,
          title: `Academic Retention Cohort Advisory (${lecturer.students.length} Students)`,
          message: `The Academic Retention & Early Warning system identified ${
            lecturer.students.length
          } at-risk student(s) enrolled in your courses:\n\n${studentSummary}\n\n${
            customNote ? `Admin Note: ${customNote}\n\n` : ""
          }Please review their milestone submissions and schedule advisement if necessary.`,
          type: "alert",
          action_type: "lecturer_bulk_risk_alert",
          metadata: {
            category: "retention_bulk_alert",
            students_count: lecturer.students.length,
            timestamp: nowIso,
            email_dispatched: Boolean(sendEmail),
          },
          is_read: false,
          created_at: nowIso,
        };
      });

      const { error } = await supabase.from("notifications").insert(notificationRows);
      if (error) {
        console.warn("[EarlyWarningService] Bulk lecturer alert insert warning:", error);
      }

      if (sendEmail) {
        lecturers.forEach((lecturer) => {
          if (lecturer.email) {
            const studentSummary = lecturer.students
              .map((s) => `• ${s.name} (${s.riskLevel.toUpperCase()}, Score: ${s.riskScore}) in ${s.classes.join(", ")}`)
              .join("\n");

            supabase.functions
              .invoke("send-early-warning-email", {
                body: {
                  recipientEmail: lecturer.email,
                  recipientName: lecturer.name || "Faculty Member",
                  title: `[COHORT ADVISORY] Academic Retention Alert (${lecturer.students.length} Students)`,
                  message: `The Academic Retention & Early Warning system has identified ${
                    lecturer.students.length
                  } at-risk student(s) enrolled in your courses:\n\n${studentSummary}\n\n${
                    customNote ? `Admin Confidential Note:\n${customNote}\n\n` : ""
                  }Please review their milestone submissions in your lecturer portal and consider initiating academic check-ins.`,
                },
              })
              .catch((err) => console.warn(`[EarlyWarningService] Bulk lecturer email failed for ${lecturer.email}:`, err));
          }
        });
      }

      await auditService.logAction({
        action: "EARLY_WARNING_BULK_LECTURER_ALERT",
        details: {
          total_lecturers_alerted: lecturers.length,
          total_students_flagged: students.length,
          email_dispatched: Boolean(sendEmail),
        },
      });

      return {
        success: true,
        alertedLecturersCount: lecturers.length,
        affectedStudentsCount: students.length,
      };
    } catch (err: any) {
      console.error("[EarlyWarningService] Error sending bulk faculty alerts:", err);
      return {
        success: false,
        alertedLecturersCount: 0,
        affectedStudentsCount: 0,
        error: err.message || "Failed to alert faculty",
      };
    }
  },
};
