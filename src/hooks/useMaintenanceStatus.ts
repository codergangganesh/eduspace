import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceStatus() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // 1. Initial query via RPC or direct audit trail
    const fetchStatus = async () => {
      try {
        const client = supabase as any;
        
        // Try RPC first (bypasses RLS securely)
        const { data: rpcData, error: rpcError } = await client.rpc("get_maintenance_status");
        if (!rpcError && rpcData && typeof rpcData.enabled === "boolean") {
          setIsMaintenanceMode(rpcData.enabled);
          return;
        }

        // Fallback to direct query
        const res = await client
          .from("admin_audit_logs")
          .select("details")
          .eq("action", "SET_MAINTENANCE_MODE")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const record = res?.data;
        if (record?.details && typeof record.details.enabled === "boolean") {
          setIsMaintenanceMode(record.details.enabled);
        }
      } catch (err) {
        // Safe fallback - keep normal operation if check fails
      }
    };

    fetchStatus();

    // 2. Realtime Broadcast subscription
    const channel = supabase
      .channel("platform_maintenance_channel")
      .on("broadcast", { event: "maintenance_status" }, (payload: any) => {
        if (payload?.payload && typeof payload.payload.enabled === "boolean") {
          setIsMaintenanceMode(payload.payload.enabled);
          setIsDismissed(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    isMaintenanceMode: isMaintenanceMode && !isDismissed,
    dismiss: () => setIsDismissed(true),
  };
}
