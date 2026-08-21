import { useQuery } from "@tanstack/react-query";
import { studentsService, StudentFilterOptions, getCachedStudentsData, setCachedStudentsData } from "@/services/students.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";

import { EnrichedUser } from "@/types";

export function useStudents(options: StudentFilterOptions = {}) {
  const auth = useAdminAuth();

  const isReady = Boolean(auth.user && auth.isAdmin && !auth.isLoading);

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
    queryFn: async () => {
      const res = await studentsService.getStudents(options);
      if (res && res.data?.length > 0 && !options.search && options.status === "all" && options.page === 1) {
        setCachedStudentsData(res);
      }
      return res;
    },
    initialData: !options.search && options.status === "all"
      ? () => getCachedStudentsData(options.page || 1, options.pageSize || 10)
      : undefined,
    staleTime: 1000 * 20,
  });

  const departmentsQuery = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => studentsService.getAllDepartments(),
    initialData: () => ["Computer Science", "Information Technology", "Electronics & Communication"],
    staleTime: 1000 * 60 * 10,
  });

  const hasData = Boolean(query.data && Array.isArray(query.data.data) && query.data.data.length > 0);

  return {
    students: (query.data?.data as EnrichedUser[]) || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    page: query.data?.page || 1,
    isLoading: !hasData && query.isLoading,
    isError: !hasData && query.isError,
    error: query.error,
    refetch: query.refetch,
    departments: departmentsQuery.data || ["Computer Science", "Information Technology"],
  };
}

export function useStudentDetails(userId: string | null) {
  const auth = useAdminAuth();
  return useQuery({
    queryKey: ["admin", "student-details", userId],
    queryFn: () => (userId ? studentsService.getStudentDetails(userId) : null),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });
}
