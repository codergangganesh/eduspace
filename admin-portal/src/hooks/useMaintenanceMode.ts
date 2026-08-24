import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "eduspace_platform_maintenance_mode";
const DISMISS_KEY = "eduspace_maintenance_banner_dismissed";

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Check Supabase on initial load
  useEffect(() => {
    const fetchRemoteStatus = async () => {
      try {
        const { data } = await supabase
          .from("admin_audit_logs")
          .select("details")
          .eq("action", "SET_MAINTENANCE_MODE")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.details && typeof data.details.enabled === "boolean") {
          setIsMaintenanceMode(data.details.enabled);
          localStorage.setItem(STORAGE_KEY, String(data.details.enabled));
        }
      } catch (err) {
        console.warn("[useMaintenanceMode] Failed to fetch remote status:", err);
      }
    };

    fetchRemoteStatus();

    // Subscribe to Realtime maintenance broadcasts
    let channel: any = null;
    try {
      const channelName = `platform_maintenance_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelName)
        .on("broadcast", { event: "maintenance_status" }, (payload) => {
          if (payload?.payload && typeof payload.payload.enabled === "boolean") {
            setIsMaintenanceMode(payload.payload.enabled);
            localStorage.setItem(STORAGE_KEY, String(payload.payload.enabled));
          }
        });
      channel.subscribe();
    } catch (err) {
      console.warn("[useMaintenanceMode] Realtime subscription error:", err);
    }

    const handleStorageChange = () => {
      try {
        setIsMaintenanceMode(localStorage.getItem(STORAGE_KEY) === "true");
      } catch {}
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("eduspace_maintenance_mode_change", handleStorageChange);

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (_) {}
      }
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("eduspace_maintenance_mode_change", handleStorageChange);
    };
  }, []);

  const setMaintenanceMode = async (enabled: boolean) => {
    setIsMaintenanceMode(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled));
      sessionStorage.removeItem(DISMISS_KEY);
      setIsDismissed(false);
      window.dispatchEvent(new Event("eduspace_maintenance_mode_change"));

      // Broadcast globally across all connected clients (Student/Lecturer apps)
      const broadcastChannelName = `platform_maintenance_broadcast_${Date.now()}`;
      const channel = supabase.channel(broadcastChannelName);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "maintenance_status",
        payload: { enabled },
      });
      try {
        supabase.removeChannel(channel);
      } catch (_) {}

      // Persist in audit trail
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("admin_audit_logs").insert({
        admin_id: userData?.user?.id || "00000000-0000-0000-0000-000000000000",
        action: "SET_MAINTENANCE_MODE",
        target_email: "all_users@eduspace.online",
        details: { enabled, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.warn("[useMaintenanceMode] Failed to broadcast maintenance mode:", err);
    }
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  };

  return {
    isMaintenanceMode,
    isDismissed,
    setMaintenanceMode,
    dismissBanner,
  };
}
