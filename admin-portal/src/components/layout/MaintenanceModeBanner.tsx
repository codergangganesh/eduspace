import * as React from "react";
import { Link } from "react-router-dom";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { AlertTriangle, PowerOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MaintenanceModeBanner: React.FC = () => {
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenanceMode();

  if (!isMaintenanceMode) return null;

  return (
    <div className="bg-amber-500/15 dark:bg-amber-950/40 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-1.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs z-40 animate-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <div className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <p className="font-medium leading-snug">
          <strong className="font-bold text-amber-700 dark:text-amber-300 mr-1">
            ⚠️ Maintenance Mode Active:
          </strong>
          The platform is in maintenance mode. All student and faculty devices are displaying the notice.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">


        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMaintenanceMode(false)}
          className="h-6 text-[10px] font-semibold hover:bg-amber-500/20 text-amber-800 dark:text-amber-200"
        >
          <PowerOff className="h-3 w-3 mr-1 text-rose-500" />
          Turn Off
        </Button>
      </div>
    </div>
  );
};
