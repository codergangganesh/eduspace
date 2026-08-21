import { supabase } from "@/lib/supabase";
import { CourseItem, ClassItem, AssignmentItem, QuizItem } from "@/types";

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
};

export const coursesService = {
  async getCourses(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 15 } = options;

    try {
      const queryPromise = (async () => {
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
          console.warn("[CoursesService] getCourses error:", error);
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
          data: (data || []) as CourseItem[],
          total: count || (data || []).length,
          page,
          pageSize,
          totalPages: Math.ceil((count || (data || []).length) / pageSize),
        };
      })();

      return await withTimeout(queryPromise, 3500, { data: [], total: 0, page, pageSize, totalPages: 0 });
    } catch (err) {
      console.error("[CoursesService] Error getting courses:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getClasses(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 15 } = options;

    try {
      const queryPromise = (async () => {
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
          console.warn("[CoursesService] getClasses error:", error);
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
          data: (data || []) as ClassItem[],
          total: count || (data || []).length,
          page,
          pageSize,
          totalPages: Math.ceil((count || (data || []).length) / pageSize),
        };
      })();

      return await withTimeout(queryPromise, 3500, { data: [], total: 0, page, pageSize, totalPages: 0 });
    } catch (err) {
      console.error("[CoursesService] Error getting classes:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getAssignments(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 15 } = options;

    try {
      const queryPromise = (async () => {
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
          console.warn("[CoursesService] getAssignments error:", error);
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
          data: (data || []) as AssignmentItem[],
          total: count || (data || []).length,
          page,
          pageSize,
          totalPages: Math.ceil((count || (data || []).length) / pageSize),
        };
      })();

      return await withTimeout(queryPromise, 3500, { data: [], total: 0, page, pageSize, totalPages: 0 });
    } catch (err) {
      console.error("[CoursesService] Error getting assignments:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  async getQuizzes(options: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search = "", page = 1, pageSize = 15 } = options;

    try {
      const queryPromise = (async () => {
        let query = supabase.from("quizzes").select("*", { count: "exact" });

        if (search.trim()) {
          const s = search.trim();
          query = query.or(`title.ilike.%${s}%,instructions.ilike.%${s}%`);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, count, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.warn("[CoursesService] getQuizzes error:", error);
          return { data: [], total: 0, page, pageSize, totalPages: 0 };
        }

        return {
          data: (data || []) as QuizItem[],
          total: count || (data || []).length,
          page,
          pageSize,
          totalPages: Math.ceil((count || (data || []).length) / pageSize),
        };
      })();

      return await withTimeout(queryPromise, 3500, { data: [], total: 0, page, pageSize, totalPages: 0 });
    } catch (err) {
      console.error("[CoursesService] Error getting quizzes:", err);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },
};
