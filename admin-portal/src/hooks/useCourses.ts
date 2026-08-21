import { useQuery } from "@tanstack/react-query";
import { coursesService } from "@/services/courses.service";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function useCourses(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const auth = useAdminAuth();
  const isReady = Boolean(auth.user && auth.isAdmin && !auth.isLoading);

  return useQuery({
    queryKey: ["admin", "courses", auth.user?.id, options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getCourses(options),
    enabled: isReady,
    staleTime: 1000 * 30,
  });
}

export function useClasses(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const auth = useAdminAuth();
  const isReady = Boolean(auth.user && auth.isAdmin && !auth.isLoading);

  return useQuery({
    queryKey: ["admin", "classes", auth.user?.id, options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getClasses(options),
    enabled: isReady,
    staleTime: 1000 * 30,
  });
}

export function useAssignments(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const auth = useAdminAuth();
  const isReady = Boolean(auth.user && auth.isAdmin && !auth.isLoading);

  return useQuery({
    queryKey: ["admin", "assignments", auth.user?.id, options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getAssignments(options),
    enabled: isReady,
    staleTime: 1000 * 30,
  });
}

export function useQuizzes(options: { search?: string; page?: number; pageSize?: number } = {}) {
  const auth = useAdminAuth();
  const isReady = Boolean(auth.user && auth.isAdmin && !auth.isLoading);

  return useQuery({
    queryKey: ["admin", "quizzes", auth.user?.id, options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getQuizzes(options),
    enabled: isReady,
    staleTime: 1000 * 30,
  });
}
