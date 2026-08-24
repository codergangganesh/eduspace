import React from "react";
import { useMaintenanceStatus } from "@/hooks/useMaintenanceStatus";
import { AlertTriangle } from "lucide-react";

export const MaintenanceBanner: React.FC = () => {
  const { isMaintenanceMode } = useMaintenanceStatus();

  if (!isMaintenanceMode) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/25 text-amber-900 dark:text-amber-200 px-3 py-1 text-[11px] flex items-center justify-center gap-1.5 shadow-2xs z-50 sticky top-0 backdrop-blur-md animate-in slide-in-from-top-1 duration-200 text-center leading-tight">
      <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
      <p className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        <strong className="font-bold text-amber-700 dark:text-amber-300 mr-1">
          Application Under Maintenance:
        </strong>
        System maintenance is currently in progress. Some services may be temporarily limited.
      </p>
    </div>
  );
};
