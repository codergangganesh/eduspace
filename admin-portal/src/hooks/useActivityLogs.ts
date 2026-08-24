import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activity.service";

export function useActivityLogs(options: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "activity-logs", options.page, options.pageSize],
    queryFn: () => activityService.getActivityLogs(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
