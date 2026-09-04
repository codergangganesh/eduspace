// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WakaTimeLanguage {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
  color?: string;
}

interface WakaTimeEditor {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

interface WakaTimeCategory {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

interface WakaTimeDay {
  date: string;
  text: string;
  total_seconds: number;
}

interface WakaTimeProject {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

interface WakaTimeOS {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

interface WakaTimeMachine {
  name: string;
  percent: number;
  text: string;
  total_seconds?: number;
}

interface WakaTimeBestDay {
  date?: string;
  text?: string;
  total_seconds?: number;
}

interface WakaTimeBadge {
  name: string;
  category: string;
  description: string;
  icon?: string;
}

interface WakaTimeStatsPayload {
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  location?: string | null;
  timezone?: string | null;
  website?: string | null;
  githubUsername?: string | null;
  twitterUsername?: string | null;
  linkedinUsername?: string | null;
  human_readable_total: string;
  daily_average: string;
  total_seconds: number;
  all_time_total?: string | null;
  badge_url?: string | null;
  languages: WakaTimeLanguage[];
  editors: WakaTimeEditor[];
  categories: WakaTimeCategory[];
  projects?: WakaTimeProject[];
  operating_systems?: WakaTimeOS[];
  machines?: WakaTimeMachine[];
  badges?: WakaTimeBadge[];
  best_day?: WakaTimeBestDay | null;
  daily_breakdown?: WakaTimeDay[];
  range?: string;
  created_at?: string | null;
  last_updated: string;
  api_key_used: boolean;
  status: string;
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
  Solidity: "#aa6746",
  SQL: "#e38c00",
  Lua: "#000080",
  R: "#198ce7",
  Zig: "#ec915c",
};

function getLanguageColor(name: string): string {
  return LANGUAGE_COLORS[name] || "#00e5ff";
}

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}, timeoutMs = 7000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html, */*",
        ...headers,
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      return await res.json();
    }
    return await res.text();
  } catch {
    clearTimeout(id);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let username = "";
    let apiKey = "";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      username = body.username || body.handle || "";
      apiKey = body.apiKey || body.api_key || body.wakatimeApiKey || "";
    } else {
      const url = new URL(req.url);
      username = url.searchParams.get("username") || url.searchParams.get("handle") || "";
      apiKey = url.searchParams.get("apiKey") || url.searchParams.get("api_key") || "";
    }

    const cleanUsername = (username || "")
      .replace(/^@+/, "")
      .replace(/^https?:\/\/(www\.)?wakatime\.com\/@?/i, "")
      .replace(/\/+$/, "")
      .trim();

    const cleanApiKey = (apiKey || "").trim();

    if (!cleanUsername && !cleanApiKey) {
      return new Response(
        JSON.stringify({ error: "WakaTime username or API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userProfileObj: any = null;
    let statsObj: any = null;
    let allTimeStatsObj: any = null;
    let allTimeBadgeSvgText: string | null = null;
    let apiKeyUsed = false;

    // 1. Authenticated Mode: If API Key is provided
    if (cleanApiKey) {
      const authHeader = `Basic ${btoa(cleanApiKey)}`;
      const [currUser, statsLastYear, statsAllTime, stats7Days] = await Promise.all([
        fetchWithTimeout("https://wakatime.com/api/v1/users/current", { Authorization: authHeader }),
        fetchWithTimeout("https://wakatime.com/api/v1/users/current/stats/last_year", { Authorization: authHeader }),
        fetchWithTimeout("https://wakatime.com/api/v1/users/current/stats/all_time", { Authorization: authHeader }),
        fetchWithTimeout("https://wakatime.com/api/v1/users/current/stats/last_7_days", { Authorization: authHeader }),
      ]);

      if (currUser?.data) {
        userProfileObj = currUser.data;
        apiKeyUsed = true;
      }
      if (statsLastYear?.data) {
        statsObj = statsLastYear.data;
      } else if (stats7Days?.data) {
        statsObj = stats7Days.data;
      } else if (statsAllTime?.data) {
        statsObj = statsAllTime.data;
      }

      if (statsAllTime?.data) {
        allTimeStatsObj = statsAllTime.data;
      }
    }

    // 2. Public Mode or Fallback Mode for Username
    if (!statsObj && cleanUsername) {
      // Parallel requests across public profile, public stats (7 days, 30 days, 1 year), and public HTML
      const [userRes, stats7Res, stats30Res, stats1YrRes, statsGenRes, publicHtml] = await Promise.all([
        fetchWithTimeout(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}`),
        fetchWithTimeout(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}/stats/last_7_days`),
        fetchWithTimeout(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}/stats/last_30_days`),
        fetchWithTimeout(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}/stats/last_year`),
        fetchWithTimeout(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}/stats`),
        fetchWithTimeout(`https://wakatime.com/@${encodeURIComponent(cleanUsername)}`),
      ]);

      if (userRes?.data) {
        userProfileObj = userRes.data;
      }

      statsObj = stats7Res?.data || stats30Res?.data || stats1YrRes?.data || statsGenRes?.data;

      // Check for user badge in profile or HTML
      let badgeUserId = userProfileObj?.id;
      if (!badgeUserId && typeof publicHtml === "string") {
        const badgeMatch = publicHtml.match(/\/badge\/user\/([a-zA-Z0-9-]+)\.svg/);
        if (badgeMatch && badgeMatch[1]) {
          badgeUserId = badgeMatch[1];
        }
      }

      if (badgeUserId) {
        const svgRes = await fetchWithTimeout(`https://wakatime.com/badge/user/${badgeUserId}.svg`);
        if (typeof svgRes === "string" && svgRes.includes("<svg")) {
          allTimeBadgeSvgText = svgRes;
        }
      }
    }

    // If still no stats or user profile found, attempt CORS proxy fallback
    if (!statsObj && !userProfileObj && cleanUsername) {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(`https://wakatime.com/api/v1/users/@${encodeURIComponent(cleanUsername)}/stats/last_7_days`)}`;
      const proxyRes = await fetchWithTimeout(proxyUrl);
      if (proxyRes?.data) {
        statsObj = proxyRes.data;
      }
    }

    if (!statsObj && !userProfileObj && !allTimeBadgeSvgText) {
      return new Response(
        JSON.stringify({
          error: `Could not fetch WakaTime profile for @${cleanUsername}. Make sure public profile stats are enabled in WakaTime under Settings -> Display -> Profile Stats, or configure an API Key.`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract all fields
    const resolvedUsername = userProfileObj?.username || statsObj?.username || cleanUsername;
    const displayName = userProfileObj?.display_name || userProfileObj?.full_name || null;
    const bio = userProfileObj?.bio || null;
    const avatar = userProfileObj?.photo || (userProfileObj?.id ? `https://wakatime.com/photo/${userProfileObj.id}` : null);
    const location = userProfileObj?.city?.title || userProfileObj?.city?.name || null;
    const timezone = userProfileObj?.city?.timezone || userProfileObj?.timezone || null;
    const website = userProfileObj?.human_readable_website || userProfileObj?.website || null;
    const githubUsername = userProfileObj?.github_username || null;
    const twitterUsername = userProfileObj?.twitter_username || null;
    const linkedinUsername = userProfileObj?.linkedin_username || null;
    const createdAt = userProfileObj?.created_at || null;

    let humanReadableTotal = statsObj?.human_readable_total_including_other_language ||
      statsObj?.human_readable_total ||
      statsObj?.human_readable_total_with_seconds ||
      "0 hrs";

    const dailyAverage = statsObj?.human_readable_daily_average_including_other_language ||
      statsObj?.human_readable_daily_average ||
      "0 mins";

    const totalSeconds = Number(statsObj?.total_seconds_including_other_language || statsObj?.total_seconds || 0);

    // Extract all-time total from badge SVG if available
    let allTimeTotal: string | null = allTimeStatsObj?.human_readable_total || null;
    let badgeUrl: string | null = userProfileObj?.id ? `https://wakatime.com/badge/user/${userProfileObj.id}.svg` : null;

    if (allTimeBadgeSvgText) {
      const timeMatches = allTimeBadgeSvgText.match(/<text[^>]*>([0-9,]+\s*hrs(?:\s*[0-9]+\s*mins)?)<\/text>/gi);
      if (timeMatches && timeMatches.length > 0) {
        const cleanMatch = timeMatches[timeMatches.length - 1].replace(/<[^>]+>/g, "").trim();
        if (cleanMatch) {
          allTimeTotal = cleanMatch;
        }
      }
    }

    if (humanReadableTotal === "0 hrs" && allTimeTotal) {
      humanReadableTotal = allTimeTotal;
    }

    // Languages
    const languages: WakaTimeLanguage[] = (statsObj?.languages || []).map((l: any) => ({
      name: l.name || "Other",
      percent: Number(l.percent || 0),
      text: l.text || `${l.hours || 0}h`,
      total_seconds: l.total_seconds || 0,
      color: getLanguageColor(l.name),
    })).sort((a, b) => b.percent - a.percent);

    // Editors & IDEs
    const editors: WakaTimeEditor[] = (statsObj?.editors || []).map((e: any) => ({
      name: e.name || "Editor",
      percent: Number(e.percent || 0),
      text: e.text || `${e.hours || 0}h`,
      total_seconds: e.total_seconds || 0,
    })).sort((a, b) => b.percent - a.percent);

    // Categories (Coding, Building, Debugging, etc.)
    const categories: WakaTimeCategory[] = (statsObj?.categories || []).map((c: any) => ({
      name: c.name || "Category",
      percent: Number(c.percent || 0),
      text: c.text || `${c.hours || 0}h`,
      total_seconds: c.total_seconds || 0,
    })).sort((a, b) => b.percent - a.percent);

    // Operating Systems
    const operating_systems: WakaTimeOS[] = (statsObj?.operating_systems || []).map((o: any) => ({
      name: o.name || "OS",
      percent: Number(o.percent || 0),
      text: o.text || `${o.hours || 0}h`,
      total_seconds: o.total_seconds || 0,
    })).sort((a, b) => b.percent - a.percent);

    // Projects
    const projects: WakaTimeProject[] = (statsObj?.projects || []).map((p: any) => ({
      name: p.name || "Project",
      percent: Number(p.percent || 0),
      text: p.text || `${p.hours || 0}h`,
      total_seconds: p.total_seconds || 0,
    })).sort((a, b) => b.percent - a.percent);

    // Machines
    const machines: WakaTimeMachine[] = (statsObj?.machines || []).map((m: any) => ({
      name: m.name || "Machine",
      percent: Number(m.percent || 0),
      text: m.text || `${m.hours || 0}h`,
      total_seconds: m.total_seconds || 0,
    }));

    // Best Day
    const bestDayRaw = statsObj?.best_day;
    const best_day: WakaTimeBestDay | null = bestDayRaw
      ? {
        date: bestDayRaw.date || "",
        text: bestDayRaw.text || `${bestDayRaw.hours || 0}h`,
        total_seconds: bestDayRaw.total_seconds || 0,
      }
      : null;

    // Daily breakdown / days
    const daily_breakdown: WakaTimeDay[] = (statsObj?.days || statsObj?.daily_average_data || statsObj?.data || []).map((d: any) => ({
      date: d.date || d.day || d.range?.date || "",
      text: d.text || `${Math.round((d.total_seconds || 0) / 60)} mins`,
      total_seconds: d.grand_total?.total_seconds || d.total_seconds || 0,
    }));

    // Generate Badges & Milestones
    const badges: WakaTimeBadge[] = [];

    const totalHoursEstimate = totalSeconds > 0
      ? totalSeconds / 3600
      : (allTimeTotal ? parseFloat(allTimeTotal.replace(/,/g, "")) : 0);

    if (totalHoursEstimate >= 1000) {
      badges.push({ name: "Kilo Coder", category: "Dedication", description: "Logged 1,000+ hours of active programming" });
    } else if (totalHoursEstimate >= 500) {
      badges.push({ name: "Master Builder", category: "Dedication", description: "Logged 500+ hours of coding time" });
    } else if (totalHoursEstimate >= 100) {
      badges.push({ name: "Century Coder", category: "Dedication", description: "Logged 100+ hours in IDEs" });
    } else if (totalHoursEstimate >= 25) {
      badges.push({ name: "Active Developer", category: "Dedication", description: "Logged 25+ hours of coding activity" });
    }

    if (languages.length >= 6) {
      badges.push({ name: "Polyglot Architect", category: "Skills", description: `Active across ${languages.length} programming languages` });
    } else if (languages.length >= 3) {
      badges.push({ name: "Multi-Language Dev", category: "Skills", description: `Proficient across ${languages.length} languages` });
    }

    if (editors.length >= 2) {
      badges.push({ name: "Multi-IDE Master", category: "Tools", description: `Versatile across multiple development environments` });
    }

    if (operating_systems.length >= 2) {
      badges.push({ name: "Cross-Platform Coder", category: "Platform", description: `Active across ${operating_systems.map(o => o.name).join(" & ")}` });
    }

    if (projects.length >= 5) {
      badges.push({ name: "Prolific Creator", category: "Projects", description: `Built across ${projects.length} distinct codebases` });
    }

    const payload: WakaTimeStatsPayload = {
      username: resolvedUsername,
      displayName,
      bio,
      avatar,
      location,
      timezone,
      website,
      githubUsername,
      twitterUsername,
      linkedinUsername,
      human_readable_total: humanReadableTotal,
      daily_average: dailyAverage,
      total_seconds: totalSeconds,
      all_time_total: allTimeTotal,
      badge_url: badgeUrl,
      languages,
      editors,
      categories,
      projects: projects.length > 0 ? projects : undefined,
      operating_systems: operating_systems.length > 0 ? operating_systems : undefined,
      machines: machines.length > 0 ? machines : undefined,
      badges: badges.length > 0 ? badges : undefined,
      best_day,
      daily_breakdown,
      range: statsObj?.human_readable_range || "Last 7 Days",
      created_at: createdAt,
      last_updated: new Date().toISOString(),
      api_key_used: apiKeyUsed,
      status: statsObj?.status || "ok",
    };

    return new Response(
      JSON.stringify({ data: payload, success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to fetch WakaTime stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
