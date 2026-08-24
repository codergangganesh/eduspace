import { useQuery } from "@tanstack/react-query";
import { coursesService } from "@/services/courses.service";

export function useCourses(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "courses", options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getCourses(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useClasses(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "classes", options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getClasses(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useAssignments(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "assignments", options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getAssignments(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useQuizzes(options: { search?: string; page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "quizzes", options.search, options.page, options.pageSize],
    queryFn: () => coursesService.getQuizzes(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
