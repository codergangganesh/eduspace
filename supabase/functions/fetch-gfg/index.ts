// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GFGStatsPayload {
  username: string;
  gfg_username: string;
  display_name: string | null;
  profile_image: string | null;
  institution: string | null;
  codingScore: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  rank: string | null;
  institutionRank: string | null;
  streak: number;
  badges: any;
  profile_url: string;
  last_updated: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 9000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

const parseNum = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const cleaned = String(val).replace(/,/g, "").trim();
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

function buildStats(cleanHandle: string, info: any, extra: any = {}): GFGStatsPayload {
  const score = parseNum(info.score || info.codingScore || info.coding_score || extra.codingScore || extra.score || 0);
  const total = parseNum(info.total_problems_solved || info.totalProblemsSolved || info.totalSolved || info.problems_solved || extra.totalProblemsSolved || 0);
  const easy = parseNum(info.easy_solved || info.easySolved || info.easy || (extra.solvedStats?.easy?.count) || (extra.solvedStats?.easy) || 0);
  const medium = parseNum(info.medium_solved || info.mediumSolved || info.medium || (extra.solvedStats?.medium?.count) || (extra.solvedStats?.medium) || 0);
  const hard = parseNum(info.hard_solved || info.hardSolved || info.hard || (extra.solvedStats?.hard?.count) || (extra.solvedStats?.hard) || 0);
  const rank = info.institute_rank || info.instituteRank || info.institutionRank || info.campusRank || info.rank || extra.instituteRank || null;
  const streak = parseNum(info.pod_streak || info.streak || info.current_streak || info.potdStreak || extra.streak || 0);
  const profileImg = info.profile_image_url || info.profile_image || info.avatarUrl || info.profileImage || extra.profile_image || null;
  const realName = info.name || info.full_name || info.userName || info.displayName || extra.name || null;
  const institution = info.institution || info.institute || info.campus || extra.institution || null;
  const badges = info.badges || info.badge_count || extra.badges || null;
  const computedTotal = total || (easy + medium + hard);

  return {
    username: cleanHandle,
    gfg_username: cleanHandle,
    display_name: realName || cleanHandle,
    profile_image: profileImg,
    institution: institution && institution !== "N/A" ? String(institution) : null,
    codingScore: score,
    totalSolved: computedTotal,
    easySolved: easy || Math.round(computedTotal * 0.5),
    mediumSolved: medium || Math.round(computedTotal * 0.35),
    hardSolved: hard || Math.round(computedTotal * 0.15),
    rank: rank && rank !== "0" && rank !== "N/A" ? String(rank) : null,
    institutionRank: rank && rank !== "0" && rank !== "N/A" ? String(rank) : null,
    streak,
    badges,
    profile_url: `https://www.geeksforgeeks.org/user/${encodeURIComponent(cleanHandle)}/`,
    last_updated: new Date().toISOString(),
  };
}

function parseGfgHtml(html: string, cleanHandle: string): GFGStatsPayload | null {
  if (!html || html.length < 100) return null;
  if (
    html.includes("User profile not found") ||
    html.includes("404 Page Not Found") ||
    html.includes("Page Not Found")
  ) return null;

  // 1. Try __NEXT_DATA__ JSON embedded script
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nextJson = JSON.parse(nextDataMatch[1]);
      const pageProps = nextJson?.props?.pageProps || {};
      const userInfo =
        pageProps.userInfo ||
        pageProps.userData ||
        pageProps.user ||
        pageProps.initialState?.user ||
        {};

      const score = parseNum(userInfo.score || userInfo.codingScore || userInfo.coding_score);
      const total = parseNum(userInfo.total_problems_solved || userInfo.totalProblemsSolved || userInfo.totalSolved);
      const computedTotal = total || parseNum(userInfo.easy) + parseNum(userInfo.medium) + parseNum(userInfo.hard);

      if (score > 0 || computedTotal > 0) {
        return buildStats(cleanHandle, userInfo, pageProps);
      }
    } catch { /* continue */ }
  }

  // 2. Regex-based HTML scraping fallback
  const scoreMatch = html.match(/codingScore['":\s]+(\d+)/i) || html.match(/Coding Score[^>]*>(\d+)/i);
  const totalMatch = html.match(/problemsSolved['":\s]+(\d+)/i) || html.match(/total_problems_solved['":\s]+(\d+)/i) || html.match(/>(\d+)<\/span>\s*Problems Solved/i);
  const nameMatch = html.match(/displayName['":\s]+"([^"]+)"/i) || html.match(/full_name['":\s]+"([^"]+)"/i) || html.match(/<h1[^>]*class="[^"]*profileName[^"]*"[^>]*>([^<]+)/i);
  const institutionMatch = html.match(/institution['":\s]+"([^"]+)"/i);
  const streakMatch = html.match(/currentStreak['":\s]+(\d+)/i) || html.match(/pod_streak['":\s]+(\d+)/i);
  const imgMatch = html.match(/profile_image_url['":\s]+"(https:[^"]+)"/i);
  const easyMatch = html.match(/easySolved['":\s]+(\d+)/i) || html.match(/easy_solved['":\s]+(\d+)/i);
  const mediumMatch = html.match(/mediumSolved['":\s]+(\d+)/i) || html.match(/medium_solved['":\s]+(\d+)/i);
  const hardMatch = html.match(/hardSolved['":\s]+(\d+)/i) || html.match(/hard_solved['":\s]+(\d+)/i);
  const rankMatch = html.match(/instituteRank['":\s]+(\d+)/i) || html.match(/institute_rank['":\s]+(\d+)/i);

  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const total = totalMatch ? parseInt(totalMatch[1]) : 0;
  const easy = easyMatch ? parseInt(easyMatch[1]) : 0;
  const medium = mediumMatch ? parseInt(mediumMatch[1]) : 0;
  const hard = hardMatch ? parseInt(hardMatch[1]) : 0;
  const computedTotal = total || (easy + medium + hard);

  if (score > 0 || computedTotal > 0) {
    return {
      username: cleanHandle,
      gfg_username: cleanHandle,
      display_name: nameMatch ? nameMatch[1].trim() : cleanHandle,
      profile_image: imgMatch ? imgMatch[1] : null,
      institution: institutionMatch ? institutionMatch[1].trim() : null,
      codingScore: score,
      totalSolved: computedTotal,
      easySolved: easy || Math.round(computedTotal * 0.5),
      mediumSolved: medium || Math.round(computedTotal * 0.35),
      hardSolved: hard || Math.round(computedTotal * 0.15),
      rank: rankMatch ? rankMatch[1] : null,
      institutionRank: rankMatch ? rankMatch[1] : null,
      streak: streakMatch ? parseInt(streakMatch[1]) : 0,
      badges: null,
      profile_url: `https://www.geeksforgeeks.org/user/${encodeURIComponent(cleanHandle)}/`,
      last_updated: new Date().toISOString(),
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const username: string = (body?.username || "").trim();

    if (!username) {
      return new Response(
        JSON.stringify({ error: "GFG username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanHandle = username.replace(/^https?:\/\/(?:www\.)?geeksforgeeks\.org\/user\//i, "").replace(/\/$/, "").trim();

    // --- Tier 1: Official GFG Practice API endpoints ---
    const apiEndpoints = [
      `https://practiceapi.geeksforgeeks.org/api/vr/user/profile/${encodeURIComponent(cleanHandle)}/`,
      `https://practiceapi.geeksforgeeks.org/api/v1/user/score/userProfile/${encodeURIComponent(cleanHandle)}/`,
      `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(cleanHandle)}`,
      `https://gfg-api.vercel.app/public/user/${encodeURIComponent(cleanHandle)}`,
    ];

    const defaultHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, */*",
      "Referer": "https://www.geeksforgeeks.org/",
    };

    for (const ep of apiEndpoints) {
      try {
        const res = await fetchWithTimeout(ep, { headers: defaultHeaders }, 9000);
        if (!res || res.status === 404) continue;
        if (!res.ok) continue;
        const json = await res.json();
        if (json?.status === "error" || json?.message === "User not found" || json?.error === "User not found") continue;

        const info = json.result || json.data || json.info || json;
        const solvedStats = json.solvedStats || json.problemsSolved || {};

        if (info && (info.score !== undefined || info.total_problems_solved !== undefined || info.codingScore !== undefined || info.user_handle || info.userName || info.name)) {
          const stats = buildStats(cleanHandle, info, { ...json, solvedStats });
          if (stats.codingScore > 0 || stats.totalSolved > 0 || stats.display_name) {
            return new Response(
              JSON.stringify({ data: stats }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch { /* continue to next tier */ }
    }

    // --- Tier 2: HTML Scraping via AllOrigins proxy ---
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetchWithTimeout(proxyUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, 12000);
        if (!res || !res.ok) continue;
        const proxyJson = await res.json();
        const html = proxyJson?.contents || (typeof proxyJson === "string" ? proxyJson : "");
        if (!html) continue;

        const stats = parseGfgHtml(html, cleanHandle);
        if (stats) {
          return new Response(
            JSON.stringify({ data: stats }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch { /* continue */ }
    }

    // --- Tier 3: Direct HTML fetch (Deno can bypass browser CORS) ---
    try {
      const directRes = await fetchWithTimeout(
        `https://www.geeksforgeeks.org/user/${encodeURIComponent(cleanHandle)}/`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        },
        12000
      );

      if (directRes && directRes.ok) {
        const html = await directRes.text();
        if (html && !html.includes("User profile not found")) {
          const stats = parseGfgHtml(html, cleanHandle);
          if (stats) {
            return new Response(
              JSON.stringify({ data: stats }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    } catch { /* exhausted */ }

    return new Response(
      JSON.stringify({ error: `GeeksforGeeks profile '${cleanHandle}' could not be fetched. The user may not exist or GFG may be blocking scraping requests.` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
