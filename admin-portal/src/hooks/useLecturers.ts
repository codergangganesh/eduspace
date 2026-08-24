import { useQuery } from "@tanstack/react-query";
import { lecturersService, LecturerFilterOptions } from "@/services/lecturers.service";
import { EnrichedUser } from "@/types";

export function useLecturers(options: LecturerFilterOptions = {}) {
  const query = useQuery({
    queryKey: [
      "admin",
      "lecturers",
      options.page,
      options.pageSize,
      options.search,
      options.status,
      options.department,
      options.sortBy,
      options.sortOrder,
    ],
    queryFn: () => lecturersService.getLecturers(options),
    staleTime: 1000 * 30,
    refetchOnMount: true,
  });

  return {
    lecturers: (query.data?.data as EnrichedUser[]) || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    page: query.data?.page || 1,
    isLoading: query.isPending && !query.data,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLecturerDetails(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "lecturer-details", userId],
    queryFn: () => (userId ? lecturersService.getLecturerDetails(userId) : null),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}
