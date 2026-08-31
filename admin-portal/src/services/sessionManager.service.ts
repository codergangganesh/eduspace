import { supabase } from "@/lib/supabase";

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ipAddress?: string;
  location?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

const CURRENT_DEVICE_KEY = "eduspace_admin_device_id";
const LOCAL_SESSIONS_KEY = "eduspace_admin_registered_devices";

export function getOrCreateAdminDeviceId(): string {
  let deviceId = localStorage.getItem(CURRENT_DEVICE_KEY);
  if (!deviceId) {
    deviceId = "adm_dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    localStorage.setItem(CURRENT_DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export function parseAdminDeviceMetadata(): {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
} {
  const ua = navigator.userAgent;

  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = "mobile";
  }

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

  let browser = "Unknown Browser";
  if (/Edg\/(\d+)/i.test(ua)) browser = "Microsoft Edge " + (ua.match(/Edg\/(\d+)/i)?.[1] || "");
  else if (/Chrome\/(\d+)/i.test(ua) && !/Chromium|OPR/i.test(ua)) browser = "Google Chrome " + (ua.match(/Chrome\/(\d+)/i)?.[1] || "");
  else if (/Safari\/(\d+)/i.test(ua) && !/Chrome|Chromium|OPR/i.test(ua)) browser = "Apple Safari " + (ua.match(/Version\/(\d+)/i)?.[1] || "");
  else if (/Firefox\/(\d+)/i.test(ua)) browser = "Mozilla Firefox " + (ua.match(/Firefox\/(\d+)/i)?.[1] || "");
  else if (/OPR\/(\d+)/i.test(ua)) browser = "Opera " + (ua.match(/OPR\/(\d+)/i)?.[1] || "");

  let deviceName = `${os} (Admin Workstation)`;
  if (deviceType === "mobile") deviceName = `${os} (Admin Mobile)`;
  else if (deviceType === "tablet") deviceName = `${os} (Admin Tablet)`;

  return { deviceName, deviceType, browser, os };
}

export async function registerCurrentAdminSession(userId: string): Promise<DeviceSession> {
  const deviceId = getOrCreateAdminDeviceId();
  const meta = parseAdminDeviceMetadata();
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

  try {
    await (supabase as any)
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
  } catch (_e) {}

  syncLocalStore(userId, currentSession);
  return currentSession;
}

function syncLocalStore(userId: string, currentSession: DeviceSession) {
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
    sessions = sessions.slice(0, 10);
    localStorage.setItem(`${LOCAL_SESSIONS_KEY}_${userId}`, JSON.stringify(sessions));
  } catch (_err) {}
}

export async function getActiveAdminSessions(userId: string): Promise<DeviceSession[]> {
  const currentDeviceId = getOrCreateAdminDeviceId();
  const meta = parseAdminDeviceMetadata();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const currentSession: DeviceSession = {
    id: currentDeviceId,
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

  try {
    const { data, error } = await (supabase as any)
      .from("user_active_devices")
      .select("*")
      .eq("user_id", userId)
      .order("last_active_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped = data.map((d: any) => ({
        id: d.device_id,
        userId: d.user_id,
        deviceName: d.device_name || "Admin Device",
        deviceType: d.device_type || "desktop",
        browser: d.browser || "Browser",
        os: d.os || "OS",
        location: d.location || "Current Location",
        lastActiveAt: d.last_active_at || d.updated_at,
        createdAt: d.created_at || d.last_active_at,
        isCurrent: d.device_id === currentDeviceId,
      }));

      const hasCurrent = mapped.some((s: any) => s.isCurrent);
      if (!hasCurrent) {
        mapped.unshift(currentSession);
      }
      return mapped;
    }
  } catch (_e) {}

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

export async function terminateOtherAdminSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentDeviceId = getOrCreateAdminDeviceId();
    await supabase.auth.signOut({ scope: "others" });

    try {
      await (supabase as any)
        .from("user_active_devices")
        .delete()
        .eq("user_id", userId)
        .neq("device_id", currentDeviceId);
    } catch (_e) {}

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
    return { success: false, error: err.message || "Failed to terminate other admin sessions" };
  }
}

export async function terminateSpecificAdminSession(userId: string, deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentDeviceId = getOrCreateAdminDeviceId();
    if (deviceId === currentDeviceId) {
      await supabase.auth.signOut({ scope: "local" });
      return { success: true };
    }

    try {
      await (supabase as any)
        .from("user_active_devices")
        .delete()
        .eq("user_id", userId)
        .eq("device_id", deviceId);
    } catch (_e) {}

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
    return { success: false, error: err.message || "Failed to revoke session" };
  }
}
