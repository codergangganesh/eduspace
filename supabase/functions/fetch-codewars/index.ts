// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CodewarsLanguageStat {
  language: string;
  rankName?: string;
  score?: number;
  totalCompleted?: number;
}

interface CodewarsBadge {
  name: string;
  category?: string;
  description?: string;
  icon?: string;
}

interface CodewarsCompletedChallenge {
  id: string;
  name: string;
  slug: string;
  completedAt: string;
  completedLanguages: string[];
}

interface CodewarsStatsPayload {
  username: string;
  name?: string | null;
  clan?: string | null;
  honor: number;
  rank: string;
  rankColor?: string | null;
  score?: number | null;
  leaderboardPosition?: number | null;
  totalSolved: number;
  totalAuthored?: number | null;
  languages?: CodewarsLanguageStat[] | null;
  badges?: CodewarsBadge[] | null;
  recentChallenges?: CodewarsCompletedChallenge[];
  avatar?: string | null;
  profile_url: string;
  last_updated: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
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
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      username = body.username || body.handle || "";
    } else {
      const url = new URL(req.url);
      username = url.searchParams.get("username") || url.searchParams.get("handle") || "";
    }

    const cleanUsername = (username || "")
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?codewars\.com\/users\//i, "")
      .replace(/\/+$/, "")
      .trim();

    if (!cleanUsername) {
      return new Response(
        JSON.stringify({ error: "Codewars username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concurrent fetch from official Codewars APIs
    const [userRes, completedRes, authoredRes] = await Promise.all([
      fetchWithTimeout(`https://www.codewars.com/api/v1/users/${encodeURIComponent(cleanUsername)}`),
      fetchWithTimeout(`https://www.codewars.com/api/v1/users/${encodeURIComponent(cleanUsername)}/code-challenges/completed?page=0`),
      fetchWithTimeout(`https://www.codewars.com/api/v1/users/${encodeURIComponent(cleanUsername)}/code-challenges/authored`),
    ]);

    if (!userRes || (!userRes.username && userRes.honor === undefined && !userRes.ranks)) {
      return new Response(
        JSON.stringify({ error: `Codewars user '${cleanUsername}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = userRes.name || null;
    const clan = userRes.clan || null;
    const honor = typeof userRes.honor === "number" ? userRes.honor : 0;
    const leaderboardPosition = typeof userRes.leaderboardPosition === "number" ? userRes.leaderboardPosition : null;

    const overall = userRes.ranks?.overall || {};
    const rank = overall.name || (userRes.rank ? String(userRes.rank) : "Unranked");
    const rankColor = overall.color || null;
    const score = typeof overall.score === "number" ? overall.score : null;

    const codeChallenges = userRes.codeChallenges || {};
    let totalSolved = typeof codeChallenges.totalCompleted === "number"
      ? codeChallenges.totalCompleted
      : (typeof userRes.totalSolved === "number" ? userRes.totalSolved : 0);

    let totalAuthored = typeof codeChallenges.totalAuthored === "number"
      ? codeChallenges.totalAuthored
      : (Array.isArray(authoredRes?.data) ? authoredRes.data.length : null);

    // Language breakdown
    const languages: CodewarsLanguageStat[] = [];
    const langRanks = userRes.ranks?.languages || {};
    if (langRanks && typeof langRanks === "object") {
      Object.entries(langRanks).forEach(([lang, val]: [string, any]) => {
        if (val) {
          languages.push({
            language: lang,
            rankName: val.name || undefined,
            score: typeof val.score === "number" ? val.score : undefined,
            totalCompleted: typeof val.totalCompleted === "number" ? val.totalCompleted : undefined,
          });
        }
      });
    }

    languages.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Completed challenges history
    const recentChallenges: CodewarsCompletedChallenge[] = [];
    if (completedRes && Array.isArray(completedRes.data)) {
      completedRes.data.slice(0, 10).forEach((c: any) => {
        recentChallenges.push({
          id: c.id,
          name: c.name,
          slug: c.slug,
          completedAt: c.completedAt,
          completedLanguages: Array.isArray(c.completedLanguages) ? c.completedLanguages : [],
        });
      });
    }

    if (totalSolved === 0 && completedRes && typeof completedRes.totalItems === "number") {
      totalSolved = completedRes.totalItems;
    }

    // Dynamic Badges Creation
    const badges: CodewarsBadge[] = [];

    // 1. Rank & Honor Badges
    if (rank.includes("dan")) {
      badges.push({ name: "Dan Master", category: "Tier", description: `Achieved Black Belt ${rank} mastery on Codewars` });
    } else if (rank.includes("1 kyu") || rank.includes("2 kyu")) {
      badges.push({ name: "High Kyu Master", category: "Tier", description: `Reached top tier ${rank} rank` });
    } else if (rank.includes("3 kyu") || rank.includes("4 kyu")) {
      badges.push({ name: "Senior Practitioner", category: "Tier", description: `Attained ${rank} intermediate ranking` });
    } else if (rank !== "Unranked") {
      badges.push({ name: `${rank} Rank`, category: "Tier", description: `Active ${rank} code warrior` });
    }

    if (leaderboardPosition && leaderboardPosition <= 100) {
      badges.push({ name: "Global Top 100", category: "Leaderboard", description: `Ranked #${leaderboardPosition} worldwide on Codewars` });
    } else if (leaderboardPosition && leaderboardPosition <= 1000) {
      badges.push({ name: "Global Top 1,000", category: "Leaderboard", description: `Ranked #${leaderboardPosition} on the global honor board` });
    } else if (leaderboardPosition && leaderboardPosition <= 10000) {
      badges.push({ name: "Top 10,000 Contender", category: "Leaderboard", description: `Ranked #${leaderboardPosition} worldwide` });
    }

    if (honor >= 10000) {
      badges.push({ name: "Honor Legend", category: "Honor", description: `Accumulated ${honor.toLocaleString()}+ honor points` });
    } else if (honor >= 2000) {
      badges.push({ name: "Honor Elite", category: "Honor", description: `Accumulated ${honor.toLocaleString()}+ honor points` });
    } else if (honor >= 500) {
      badges.push({ name: "Honor Contender", category: "Honor", description: `Earned ${honor.toLocaleString()} honor points` });
    }

    // 2. Problem Solving Badges
    if (totalSolved >= 1000) {
      badges.push({ name: "Grandmaster 1,000+ Solved", category: "Problem Solving", description: "Completed 1,000+ algorithmic katas" });
    } else if (totalSolved >= 500) {
      badges.push({ name: "Kata Veteran 500+", category: "Problem Solving", description: "Completed 500+ algorithmic katas" });
    } else if (totalSolved >= 100) {
      badges.push({ name: "Century Solver", category: "Problem Solving", description: "Solved 100+ katas on Codewars" });
    } else if (totalSolved >= 25) {
      badges.push({ name: "Dedicated Solver", category: "Problem Solving", description: `Completed ${totalSolved} algorithmic katas` });
    }

    // 3. Polyglot & Authored Badges
    if (languages.length >= 6) {
      badges.push({ name: "Grand Polyglot", category: "Language", description: `Active in ${languages.length} programming languages` });
    } else if (languages.length >= 3) {
      badges.push({ name: "Polyglot Coder", category: "Language", description: `Trained across ${languages.length} languages` });
    }

    if (totalAuthored && totalAuthored >= 10) {
      badges.push({ name: "Sensei Author", category: "Authoring", description: `Authored ${totalAuthored} community challenges` });
    } else if (totalAuthored && totalAuthored > 0) {
      badges.push({ name: "Kata Author", category: "Authoring", description: `Created ${totalAuthored} community kata` });
    }

    const payload: CodewarsStatsPayload = {
      username: userRes.username || cleanUsername,
      name,
      clan,
      honor,
      rank,
      rankColor,
      score,
      leaderboardPosition,
      totalSolved,
      totalAuthored,
      languages: languages.length > 0 ? languages : null,
      badges: badges.length > 0 ? badges : null,
      recentChallenges,
      avatar: null,
      profile_url: `https://www.codewars.com/users/${encodeURIComponent(cleanUsername)}`,
      last_updated: new Date().toISOString(),
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
      JSON.stringify({ error: err?.message || "Failed to fetch Codewars stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
