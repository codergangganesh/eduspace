import { supabase } from "@/lib/supabase";
import { CourseItem, ClassItem, AssignmentItem, QuizItem } from "@/types";

export const coursesService = {
  async getCourses(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 10 } = options;

    try {
      let query = supabase.from("courses").select("*", { count: "exact" });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(`title.ilike.%${s}%,course_code.ilike.%${s}%,department.ilike.%${s}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.warn("[CoursesService] getCourses error:", error.message);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }

      const courseList = (data || []) as CourseItem[];

      // Optional enrollment counts
      if (courseList.length > 0) {
        const courseIds = courseList.map((c) => c.id).filter(Boolean);
        try {
          const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select("course_id")
            .in("course_id", courseIds);

          if (enrollments && enrollments.length > 0) {
            const countMap: Record<string, number> = {};
            enrollments.forEach((e: any) => {
              countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
            });
            courseList.forEach((c) => {
              c.enrollment_count = countMap[c.id] || 0;
            });
          }
        } catch (_) {}
      }

      return {
        data: courseList,
        total: count || courseList.length,
        page,
        pageSize,
        totalPages: Math.ceil((count || courseList.length) / pageSize) || 0,
      };
    } catch (err) {
      console.error("[CoursesService] Error getting courses:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getClasses(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 10 } = options;

    try {
      let query = supabase.from("classes").select("*", { count: "exact" });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(
          `class_name.ilike.%${s}%,course_code.ilike.%${s}%,semester.ilike.%${s}%,academic_year.ilike.%${s}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.warn("[CoursesService] getClasses error:", error.message);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }

      const rawClasses = data || [];
      const lecturerIds = Array.from(
        new Set(rawClasses.map((c) => c.lecturer_id).filter(Boolean))
      );
      const classIds = rawClasses.map((c) => c.id).filter(Boolean);

      // Fetch instructor details
      const lecturerMap = new Map<string, { name: string; department: string }>();
      if (lecturerIds.length > 0) {
        const [profilesRes, lecturerProfilesRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, id, full_name, department")
            .or(`user_id.in.(${lecturerIds.join(",")}),id.in.(${lecturerIds.join(",")})`),
          supabase
            .from("lecturer_profiles")
            .select("user_id, id, full_name, department")
            .or(`user_id.in.(${lecturerIds.join(",")}),id.in.(${lecturerIds.join(",")})`),
        ]);

        (profilesRes.data || []).forEach((p: any) => {
          const entry = { name: p.full_name || "Faculty Member", department: p.department || "General" };
          if (p.user_id) lecturerMap.set(p.user_id, entry);
          if (p.id) lecturerMap.set(p.id, entry);
        });

        (lecturerProfilesRes.data || []).forEach((lp: any) => {
          const entry = { name: lp.full_name || "Faculty Member", department: lp.department || "General" };
          if (lp.user_id && !lecturerMap.has(lp.user_id)) lecturerMap.set(lp.user_id, entry);
          if (lp.id && !lecturerMap.has(lp.id)) lecturerMap.set(lp.id, entry);
        });
      }

      // Fetch enrolled student counts per class
      const studentCountMap: Record<string, number> = {};
      if (classIds.length > 0) {
        try {
          const { data: enrolledStudents } = await supabase
            .from("class_students")
            .select("class_id")
            .in("class_id", classIds);

          (enrolledStudents || []).forEach((cs: any) => {
            if (cs.class_id) {
              studentCountMap[cs.class_id] = (studentCountMap[cs.class_id] || 0) + 1;
            }
          });
        } catch (_) {}
      }

      const enrichedClasses: ClassItem[] = rawClasses.map((cls: any) => {
        const lecturer = lecturerMap.get(cls.lecturer_id) || {
          name: "Faculty Instructor",
          department: "General",
        };

        return {
          id: cls.id,
          class_name: cls.class_name || cls.name || "Lecture Section",
          course_code: cls.course_code || "GEN101",
          academic_year: cls.academic_year || "2026",
          semester: cls.semester || "1",
          lecturer_id: cls.lecturer_id,
          lecturer_name: lecturer.name,
          lecturer_department: lecturer.department,
          is_active: cls.is_active ?? true,
          created_at: cls.created_at || new Date().toISOString(),
          student_count: studentCountMap[cls.id] || 0,
        };
      });

      return {
        data: enrichedClasses,
        total: count || enrichedClasses.length,
        page,
        pageSize,
        totalPages: Math.ceil((count || enrichedClasses.length) / pageSize) || 0,
      };
    } catch (err) {
      console.error("[CoursesService] Error getting classes:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getAssignments(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 10 } = options;

    try {
      let query = supabase.from("assignments").select("*", { count: "exact" });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.warn("[CoursesService] getAssignments error:", error.message);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }

      const rawAssignments = data || [];
      const classIds = Array.from(
        new Set(rawAssignments.map((a) => a.class_id).filter(Boolean))
      );
      const assignmentIds = rawAssignments.map((a) => a.id).filter(Boolean);

      // Fetch class names
      const classMap = new Map<string, string>();
      if (classIds.length > 0) {
        try {
          const { data: classes } = await supabase
            .from("classes")
            .select("id, class_name, course_code")
            .in("id", classIds);

          (classes || []).forEach((c: any) => {
            classMap.set(c.id, c.class_name || c.course_code || "Course Section");
          });
        } catch (_) {}
      }

      // Fetch submission counts
      const submissionCountMap: Record<string, number> = {};
      if (assignmentIds.length > 0) {
        try {
          const { data: submissions } = await supabase
            .from("assignment_submissions")
            .select("assignment_id")
            .in("assignment_id", assignmentIds);

          (submissions || []).forEach((sub: any) => {
            if (sub.assignment_id) {
              submissionCountMap[sub.assignment_id] = (submissionCountMap[sub.assignment_id] || 0) + 1;
            }
          });
        } catch (_) {}
      }

      const enrichedAssignments: AssignmentItem[] = rawAssignments.map((asg: any) => ({
        id: asg.id,
        title: asg.title || "Coursework Task",
        topic: asg.topic || null,
        description: asg.description || null,
        class_id: asg.class_id,
        course_name: classMap.get(asg.class_id) || "General Coursework",
        lecturer_id: asg.lecturer_id || null,
        max_points: asg.max_points ?? 100,
        status: asg.status || "active",
        due_date: asg.due_date,
        created_at: asg.created_at || new Date().toISOString(),
        submissions_count: submissionCountMap[asg.id] || 0,
      }));

      return {
        data: enrichedAssignments,
        total: count || enrichedAssignments.length,
        page,
        pageSize,
        totalPages: Math.ceil((count || enrichedAssignments.length) / pageSize) || 0,
      };
    } catch (err) {
      console.error("[CoursesService] Error getting assignments:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getQuizzes(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 10 } = options;

    try {
      let query = supabase.from("quizzes").select("*", { count: "exact" });

      if (search.trim()) {
        const s = search.trim();
        query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.warn("[CoursesService] getQuizzes error:", error.message);
        return { data: [], total: 0, page, pageSize, totalPages: 0 };
      }

      const rawQuizzes = data || [];
      const quizIds = rawQuizzes.map((q) => q.id).filter(Boolean);

      // Fetch quiz submission counts
      const quizSubmissionsMap: Record<string, number> = {};
      if (quizIds.length > 0) {
        try {
          const { data: submissions } = await supabase
            .from("quiz_submissions")
            .select("quiz_id")
            .in("quiz_id", quizIds);

          (submissions || []).forEach((sub: any) => {
            if (sub.quiz_id) {
              quizSubmissionsMap[sub.quiz_id] = (quizSubmissionsMap[sub.quiz_id] || 0) + 1;
            }
          });
        } catch (_) {}
      }

      const enrichedQuizzes: QuizItem[] = rawQuizzes.map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title || "Evaluation Quiz",
        description: quiz.instructions || quiz.description || null,
        class_id: quiz.class_id,
        total_marks: quiz.total_marks ?? 100,
        pass_percentage: quiz.pass_percentage ?? 40,
        status: quiz.status || "published",
        due_date: quiz.due_date,
        created_at: quiz.created_at || new Date().toISOString(),
        created_by: quiz.created_by || null,
        submissions_count: quizSubmissionsMap[quiz.id] || 0,
      }));

      return {
        data: enrichedQuizzes,
        total: count || enrichedQuizzes.length,
        page,
        pageSize,
        totalPages: Math.ceil((count || enrichedQuizzes.length) / pageSize) || 0,
      };
    } catch (err) {
      console.error("[CoursesService] Error getting quizzes:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },
};
