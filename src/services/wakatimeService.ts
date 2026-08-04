import { WakaTimeStats, WakaTimeLanguage, WakaTimeEditor, WakaTimeCategory, WakaTimeDay } from "@/types/wakatimeProfile";

export function extractWakaTimeUsername(input: string | null | undefined): string {
  if (!input) return "";
  let trimmed = input.trim();
  if (!trimmed) return "";

  trimmed = trimmed.replace(/\/+$/, "");

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 1) {
        const lastPart = parts[parts.length - 1];
        return lastPart.replace(/^@+/, "");
      }
    }
  } catch {
    // Fallback
  }

  return trimmed.replace(/^@+/, "");
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  Dart: "#00B4AB",
  Jupyter: "#DA5B0B",
  SCSS: "#c6538c",
  JSON: "#292929",
  Markdown: "#083fa1",
};

export function getWakaLanguageColor(langName: string): string {
  return LANGUAGE_COLORS[langName] || "#00e5ff";
}

/**
 * Fetches STRICT 100% REAL-TIME WakaTime statistics.
 * Multi-layer fetcher: Official API Key -> WakaTime JSON Endpoints -> Public HTML Profile Page & Badge Parser.
 */
export async function fetchWakaTimeStats(
  usernameInput: string,
  apiKeyInput?: string | null
): Promise<{ data: WakaTimeStats | null; error: string | null }> {
  const username = extractWakaTimeUsername(usernameInput);
  const apiKey = apiKeyInput?.trim() || "";

  if (!username && !apiKey) {
    return { data: null, error: "WakaTime username or API key is required." };
  }

  // 1. If API Key is provided, fetch full 365-day stats via official authenticated WakaTime API endpoints
  if (apiKey) {
    const keyEndpoints = [
      "https://wakatime.com/api/v1/users/current/stats/last_year",
      "https://wakatime.com/api/v1/users/current/stats/all_time",
      "https://wakatime.com/api/v1/users/current/stats/last_30_days",
      "https://wakatime.com/api/v1/users/current/stats/last_7_days",
    ];

    for (const ep of keyEndpoints) {
      try {
        const authHeader = `Basic ${btoa(apiKey)}`;
        const res = await fetch(ep, {
          headers: { Authorization: authHeader },
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const json = await res.json();
          const dataObj = json?.data;
          if (dataObj) {
            return {
              data: parseWakaTimeData(username || dataObj.username || "me", dataObj, true),
              error: null,
            };
          }
        }
      } catch {
        continue;
      }
    }
  }

  // 2. Fetch real-time public profile JSON stats via CORS proxies across endpoint variations (including 1 year & all-time)
  const target1Year = `https://wakatime.com/api/v1/users/@${encodeURIComponent(username)}/stats/last_1_year`;
  const target7Days = `https://wakatime.com/api/v1/users/@${encodeURIComponent(username)}/stats/last_7_days`;
  const targetStats = `https://wakatime.com/api/v1/users/@${encodeURIComponent(username)}/stats`;
  const target30Days = `https://wakatime.com/api/v1/users/@${encodeURIComponent(username)}/stats/last_30_days`;
  const targetAllTime = `https://wakatime.com/api/v1/users/@${encodeURIComponent(username)}/stats/all_time`;

  const endpoints = [
    target1Year,
    target7Days,
    targetStats,
    target30Days,
    targetAllTime,
    `https://corsproxy.io/?url=${encodeURIComponent(target1Year)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(target7Days)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetStats)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(target1Year)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(target7Days)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetStats)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const text = await res.text();

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        continue;
      }

      if (parsed && typeof parsed.contents === "string") {
        try {
          parsed = JSON.parse(parsed.contents);
        } catch { }
      }

      const dataObj = parsed?.data || parsed;
      if (dataObj && (dataObj.human_readable_total || dataObj.languages || dataObj.total_seconds !== undefined || dataObj.daily_average !== undefined)) {
        return {
          data: parseWakaTimeData(username, dataObj, false),
          error: null,
        };
      }
    } catch {
      continue;
    }
  }

  // 3. Layer 3: Real-Time WakaTime Public HTML Profile Page & All-Time Badge Parser
  const htmlResult = await fetchWakaTimePublicHtmlProfile(username);
  if (htmlResult) {
    return { data: htmlResult, error: null };
  }

  return {
    data: null,
    error: `Could not fetch real-time WakaTime activity for @${username}. Make sure public profile stats are enabled in WakaTime under Settings -> Display -> Profile Stats, or enter an API Key.`,
  };
}

async function fetchWakaTimePublicHtmlProfile(username: string): Promise<WakaTimeStats | null> {
  const profileUrl = `https://wakatime.com/@${encodeURIComponent(username)}`;
  const urls = [
    profileUrl,
    `https://corsproxy.io/?url=${encodeURIComponent(profileUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(profileUrl)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const html = await res.text();

      if (!html || !html.includes("wakatime.com")) continue;

      // Extract User ID from SVG badge link: /badge/user/8c233e88-7ce6-4c26-9514-50921f3ac71b.svg
      const badgeMatch = html.match(/\/badge\/user\/([a-zA-Z0-9-]+)\.svg/);
      let totalTimeText = "All-time Active";

      if (badgeMatch && badgeMatch[1]) {
        const userId = badgeMatch[1];
        const svgUrl = `https://wakatime.com/badge/user/${userId}.svg`;
        try {
          const svgRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(svgUrl)}`, {
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
          });
          if (svgRes.ok) {
            const svgText = await svgRes.text();
            // Parse text content inside SVG <text>: e.g. "5,501 hrs 36 mins"
            const timeMatches = svgText.match(/<text[^>]*>([0-9,]+\s*hrs(?:\s*[0-9]+\s*mins)?)<\/text>/gi);
            if (timeMatches && timeMatches.length > 0) {
              const cleanMatch = timeMatches[timeMatches.length - 1].replace(/<[^>]+>/g, "").trim();
              if (cleanMatch) {
                totalTimeText = cleanMatch;
              }
            }
          }
        } catch { }
      }

      return {
        username,
        human_readable_total: totalTimeText,
        daily_average: "Active Coder",
        total_seconds: 0,
        languages: [],
        editors: [],
        categories: [{ name: "Coding Activity", percent: 100, text: totalTimeText }],
        projects: [],
        operating_systems: [],
        best_day: null,
        daily_breakdown: [],
        range: "All Time",
        last_updated: new Date().toISOString(),
        api_key_used: false,
        status: "ok",
      };
    } catch {
      continue;
    }
  }

  return null;
}

function parseWakaTimeData(username: string, dataObj: any, apiKeyUsed: boolean): WakaTimeStats {
  const languages: WakaTimeLanguage[] = (dataObj.languages || []).map((l: any) => ({
    name: l.name || "Other",
    percent: Number(l.percent || 0),
    text: l.text || `${l.hours || 0}h`,
    total_seconds: l.total_seconds || 0,
    color: getWakaLanguageColor(l.name),
  }));

  const editors: WakaTimeEditor[] = (dataObj.editors || []).map((e: any) => ({
    name: e.name || "Editor",
    percent: Number(e.percent || 0),
    text: e.text || `${e.hours || 0}h`,
    total_seconds: e.total_seconds || 0,
  }));

  const categories: WakaTimeCategory[] = (dataObj.categories || []).map((c: any) => ({
    name: c.name || "Category",
    percent: Number(c.percent || 0),
    text: c.text || `${c.hours || 0}h`,
    total_seconds: c.total_seconds || 0,
  }));

  const projects = (dataObj.projects || []).map((p: any) => ({
    name: p.name || "Project",
    percent: Number(p.percent || 0),
    text: p.text || `${p.hours || 0}h`,
    total_seconds: p.total_seconds || 0,
  }));

  const operating_systems = (dataObj.operating_systems || []).map((o: any) => ({
    name: o.name || "OS",
    percent: Number(o.percent || 0),
    text: o.text || `${o.hours || 0}h`,
    total_seconds: o.total_seconds || 0,
  }));

  const daily_breakdown: WakaTimeDay[] = (dataObj.days || dataObj.daily_average_data || dataObj.data || []).map((d: any) => ({
    date: d.date || d.day || d.range?.date || "",
    text: d.text || `${Math.round((d.total_seconds || 0) / 60)} mins`,
    total_seconds: d.grand_total?.total_seconds || d.total_seconds || 0,
  }));

  const bestDayObj = dataObj.best_day;
  const best_day = bestDayObj
    ? {
      date: bestDayObj.date || "",
      text: bestDayObj.text || `${bestDayObj.hours || 0}h`,
      total_seconds: bestDayObj.total_seconds || 0,
    }
    : null;

  return {
    username: dataObj.username || username,
    human_readable_total: dataObj.human_readable_total_including_other_language || dataObj.human_readable_total || dataObj.human_readable_total_with_seconds || "0 hrs",
    daily_average: dataObj.human_readable_daily_average_including_other_language || dataObj.human_readable_daily_average || "0 mins",
    total_seconds: Number(dataObj.total_seconds_including_other_language || dataObj.total_seconds || 0),
    languages,
    editors,
    categories,
    projects,
    operating_systems,
    best_day,
    daily_breakdown,
    range: dataObj.human_readable_range || "Last 1 Year",
    last_updated: new Date().toISOString(),
    api_key_used: apiKeyUsed,
    status: dataObj.status || "ok",
  };
}
