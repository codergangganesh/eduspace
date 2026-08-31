import { supabase } from "@/integrations/supabase/client";

export interface DeviceSession {
  id: string; // Unique session or device identifier
  userId: string;
  deviceName: string; // e.g. "Windows 11 PC", "iPhone 15", "MacBook Pro"
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string; // e.g. "Chrome 124", "Safari 17", "Firefox"
  os: string; // e.g. "Windows 11", "macOS Sonoma", "iOS 17", "Android 14"
  ipAddress?: string;
  location?: string; // e.g. "India", "United States"
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

const CURRENT_DEVICE_KEY = "eduspace_device_id";
const LOCAL_SESSIONS_KEY = "eduspace_registered_devices";

/**
 * Generate or retrieve persistent local device ID
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(CURRENT_DEVICE_KEY);
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    localStorage.setItem(CURRENT_DEVICE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Parse user agent to extract clean device, OS, and browser metadata
 */
export function parseDeviceMetadata(): {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
} {
  const ua = navigator.userAgent;

  // 1. Detect Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = "mobile";
  }

  // 2. Detect OS
  let os = "Unknown OS";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/i.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Mac OS X 10[._]\d+/i.test(ua) || /Macintosh/i.test(ua)) os = "macOS";
  else if (/iPhone OS (\d+[._]\d+)/i.test(ua)) os = "iOS " + (ua.match(/iPhone OS (\d+[._]\d+)/i)?.[1]?.replace(/_/g, ".") || "");
  else if (/iPad.*OS (\d+[._]\d+)/i.test(ua)) os = "iPadOS " + (ua.match(/OS (\d+[._]\d+)/i)?.[1]?.replace(/_/g, ".") || "");
  else if (/Android (\d+(\.\d+)?)/i.test(ua)) os = "Android " + (ua.match(/Android (\d+(\.\d+)?)/i)?.[1] || "");
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  // 3. Detect Browser
  let browser = "Unknown Browser";
  if (/Edg\/(\d+)/i.test(ua)) browser = "Microsoft Edge " + (ua.match(/Edg\/(\d+)/i)?.[1] || "");
  else if (/Chrome\/(\d+)/i.test(ua) && !/Chromium|OPR/i.test(ua)) browser = "Google Chrome " + (ua.match(/Chrome\/(\d+)/i)?.[1] || "");
  else if (/Safari\/(\d+)/i.test(ua) && !/Chrome|Chromium|OPR/i.test(ua)) browser = "Apple Safari " + (ua.match(/Version\/(\d+)/i)?.[1] || "");
  else if (/Firefox\/(\d+)/i.test(ua)) browser = "Mozilla Firefox " + (ua.match(/Firefox\/(\d+)/i)?.[1] || "");
  else if (/OPR\/(\d+)/i.test(ua)) browser = "Opera " + (ua.match(/OPR\/(\d+)/i)?.[1] || "");

  // 4. Construct Device Name
  let deviceName = `${os} (${deviceType === "mobile" ? "Phone" : deviceType === "tablet" ? "Tablet" : "Computer"})`;
  if (deviceType === "mobile" && /iPhone/i.test(ua)) deviceName = "Apple iPhone";
  else if (deviceType === "tablet" && /iPad/i.test(ua)) deviceName = "Apple iPad";
  else if (/Macintosh/i.test(ua)) deviceName = "Mac Computer";
  else if (/Windows/i.test(ua)) deviceName = "Windows PC";

  return { deviceName, deviceType, browser, os };
}

/**
 * Register or update the current device session
 */
export async function registerCurrentDeviceSession(userId: string): Promise<DeviceSession> {
  const deviceId = getOrCreateDeviceId();
  const meta = parseDeviceMetadata();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const currentSession: DeviceSession = {
    id: deviceId,
    userId,
    deviceName: meta.deviceName,
    deviceType: meta.deviceType,
    browser: meta.browser,
    os: meta.os,
    location: timeZone.replace(/_/g, " "),
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isCurrent: true,
  };

  // 1. Try persisting to Supabase `user_active_devices` if table exists
  try {
    const { error } = await (supabase as any)
      .from("user_active_devices")
      .upsert(
        {
          device_id: deviceId,
          user_id: userId,
          device_name: currentSession.deviceName,
          device_type: currentSession.deviceType,
          browser: currentSession.browser,
          os: currentSession.os,
          location: currentSession.location,
          last_active_at: currentSession.lastActiveAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id,user_id" }
      );

    if (error) {
      // Table might not exist or RLS not yet set; fallback to resilient storage
      syncLocalDeviceStore(userId, currentSession);
    }
  } catch (_e) {
    syncLocalDeviceStore(userId, currentSession);
  }

  // Always update local cache for instant zero-latency UI
  syncLocalDeviceStore(userId, currentSession);

  return currentSession;
}

/**
 * Internal helper to keep local device registry up to date
 */
function syncLocalDeviceStore(userId: string, currentSession: DeviceSession) {
  try {
    const raw = localStorage.getItem(`${LOCAL_SESSIONS_KEY}_${userId}`);
    let sessions: DeviceSession[] = raw ? JSON.parse(raw) : [];

    const existingIdx = sessions.findIndex((s) => s.id === currentSession.id);
    if (existingIdx >= 0) {
      sessions[existingIdx] = {
        ...sessions[existingIdx],
        ...currentSession,
        createdAt: sessions[existingIdx].createdAt || currentSession.createdAt,
      };
    } else {
      sessions.unshift(currentSession);
    }

    // Keep max 10 most recent devices
    sessions = sessions.slice(0, 10);
    localStorage.setItem(`${LOCAL_SESSIONS_KEY}_${userId}`, JSON.stringify(sessions));
  } catch (_err) {
    // Ignore storage quota
  }
}

/**
 * Fetch all registered active device sessions for the user
 */
export async function getActiveDeviceSessions(userId: string): Promise<DeviceSession[]> {
  const currentDeviceId = getOrCreateDeviceId();
  const currentMeta = parseDeviceMetadata();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Current session baseline
  const currentSession: DeviceSession = {
    id: currentDeviceId,
    userId,
    deviceName: currentMeta.deviceName,
    deviceType: currentMeta.deviceType,
    browser: currentMeta.browser,
    os: currentMeta.os,
    location: timeZone.replace(/_/g, " "),
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isCurrent: true,
  };

  try {
    const { data, error } = await (supabase as any)
      .from("user_active_devices")
      .select("*")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.device_id,
        userId: d.user_id,
        deviceName: d.device_name || "Unknown Device",
        deviceType: d.device_type || "desktop",
        browser: d.browser || "Web Browser",
        os: d.os || "Unknown OS",
        ipAddress: d.ip_address,
        location: d.location || "Current Location",
        lastActiveAt: d.last_active_at || d.updated_at,
        createdAt: d.created_at || d.last_active_at,
        isCurrent: d.device_id === currentDeviceId,
      }));
    }
  } catch (_e) {
    // Fallback to local store
  }

  // Load from resilient local storage
  try {
    const raw = localStorage.getItem(`${LOCAL_SESSIONS_KEY}_${userId}`);
    if (raw) {
      const sessions: DeviceSession[] = JSON.parse(raw);
      if (sessions.length > 0) {
        return sessions.map((s) => ({
          ...s,
          isCurrent: s.id === currentDeviceId,
        }));
      }
    }
  } catch (_e) {}

  return [currentSession];
}

/**
 * Revoke/terminate all other active sessions (Log out everywhere else)
 */
export async function terminateOtherSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentDeviceId = getOrCreateDeviceId();

    // 1. Supabase Auth global sign out of other sessions
    // Using scope: 'others' revokes all refresh tokens EXCEPT current session
    await supabase.auth.signOut({ scope: "others" });

    // 2. Remove other devices from Supabase table if it exists
    try {
      await (supabase as any)
        .from("user_active_devices")
        .delete()
        .eq("user_id", userId)
        .neq("device_id", currentDeviceId);
    } catch (_e) {}

    // 3. Clear local storage records for other devices
    try {
      const raw = localStorage.getItem(`${LOCAL_SESSIONS_KEY}_${userId}`);
      if (raw) {
        const sessions: DeviceSession[] = JSON.parse(raw);
        const kept = sessions.filter((s) => s.id === currentDeviceId);
        localStorage.setItem(`${LOCAL_SESSIONS_KEY}_${userId}`, JSON.stringify(kept));
      }
    } catch (_e) {}

    return { success: true };
  } catch (err: any) {
    console.error("Error terminating other sessions:", err);
    return { success: false, error: err.message || "Failed to terminate other sessions" };
  }
}

/**
 * Revoke a single specific device session
 */
export async function terminateSpecificSession(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentDeviceId = getOrCreateDeviceId();

    if (deviceId === currentDeviceId) {
      // If terminating current session, perform full local sign out
      await supabase.auth.signOut({ scope: "local" });
      return { success: true };
    }

    // Delete from Supabase DB
    try {
      await (supabase as any)
        .from("user_active_devices")
        .delete()
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    } catch (_e) {}

    // Remove from local cache
    try {
      const raw = localStorage.getItem(`${LOCAL_SESSIONS_KEY}_${userId}`);
      if (raw) {
        const sessions: DeviceSession[] = JSON.parse(raw);
        const filtered = sessions.filter((s) => s.id !== deviceId);
        localStorage.setItem(`${LOCAL_SESSIONS_KEY}_${userId}`, JSON.stringify(filtered));
      }
    } catch (_e) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to terminate device session" };
  }
}
