import { useQuery } from "@tanstack/react-query";
import { lecturersService, LecturerFilterOptions, getCachedLecturersData, setCachedLecturersData } from "@/services/lecturers.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function useLecturers(options: LecturerFilterOptions = {}) {
  const auth = useAdminAuth();

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
    queryFn: async () => {
      const res = await lecturersService.getLecturers(options);
      if (res && res.data?.length > 0 && !options.search && options.status === "all" && options.page === 1) {
        setCachedLecturersData(res);
      }
      return res;
    },
    initialData: !options.search && options.status === "all" && options.page === 1 ? getCachedLecturersData : undefined,
    staleTime: 1000 * 20,
  });

  const hasData = Boolean(query.data && Array.isArray(query.data.data) && query.data.data.length > 0);

  return {
    lecturers: query.data?.data || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    page: query.data?.page || 1,
    isLoading: !hasData && query.isLoading,
    isError: !hasData && query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLecturerDetails(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "lecturer-details", userId],
    queryFn: () => (userId ? lecturersService.getLecturerDetails(userId) : null),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });
}
