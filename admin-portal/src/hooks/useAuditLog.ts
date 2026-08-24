import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/audit.service";

export function useAuditLog(options: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "audit-logs", options.page, options.pageSize, options.search],
    queryFn: () => auditService.getAuditLogs(options),
    staleTime: 0,
    refetchOnMount: "always",
  });
}
