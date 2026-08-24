import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { studentsService, StudentFilterOptions } from "@/services/students.service";
import { supabase } from "@/lib/supabase";
import { EnrichedUser } from "@/types";

export function useStudents(options: StudentFilterOptions = {}) {
  const query = useQuery({
    queryKey: [
      "admin",
      "students",
      options.page,
      options.pageSize,
      options.search,
      options.status,
      options.department,
      options.sortBy,
      options.sortOrder,
    ],
    queryFn: () => studentsService.getStudents(options),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  const departmentsQuery = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => studentsService.getAllDepartments(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    students: (query.data?.data as EnrichedUser[]) || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    page: query.data?.page || 1,
    isLoading: query.isPending && !query.data,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    departments: departmentsQuery.data || [],
  };
}

export function useStudentDetails(userId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`admin-student-details-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignment_submissions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "student-details", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_submissions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "student-details", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_students" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "student-details", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_enrollments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "student-details", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_coding_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "student-details", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["admin", "student-details", userId],
    queryFn: () => (userId ? studentsService.getStudentDetails(userId) : null),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}
