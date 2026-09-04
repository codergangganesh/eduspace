// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HackerRankBadge {
  badge_name: string;
  stars: number;
  icon?: string;
  category?: string;
  solved?: number;
  total_points?: number;
}

interface HackerRankCertificate {
  heading: string;
  level?: string;
  certificate_url?: string;
  earned_at?: string;
}

interface HackerRankStatsPayload {
  username: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  school?: string | null;
  level?: number | null;
  totalSolved: number;
  badgesCount: number;
  totalStars?: number;
  badges?: HackerRankBadge[];
  certificatesCount: number;
  certificates?: HackerRankCertificate[];
  globalRank?: number | null;
  score?: number | null;
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
      .replace(/^https?:\/\/(www\.)?hackerrank\.com\/(profile\/)?/i, "")
      .replace(/\/+$/, "")
      .trim();

    if (!cleanUsername) {
      return new Response(
        JSON.stringify({ error: "HackerRank username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concurrent multi-tier requests
    const [
      profileApiRes,
      officialBadgesRes,
      tashifProfileRes,
      tashifBadgesRes,
      communityCertsRes,
      officialCertsRes,
      scoresEloRes,
      officialProfileRes,
    ] = await Promise.all([
      fetchWithTimeout(`https://hackerrank-profile-api.vercel.app/${encodeURIComponent(cleanUsername)}`),
      fetchWithTimeout(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}/badges`),
      fetchWithTimeout(`https://hackerrank-stats.tashif.codes/${encodeURIComponent(cleanUsername)}/profile`),
      fetchWithTimeout(`https://hackerrank-stats.tashif.codes/${encodeURIComponent(cleanUsername)}/badges`),
      fetchWithTimeout(`https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=${encodeURIComponent(cleanUsername)}`),
      fetchWithTimeout(`https://www.hackerrank.com/community/v1/hackers/${encodeURIComponent(cleanUsername)}/certificates`),
      fetchWithTimeout(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}/scores_elo`),
      fetchWithTimeout(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}/profile`),
    ]);

    // Check if any source found the user
    const model = profileApiRes?.model || officialProfileRes?.model || officialProfileRes?.hacker || null;
    const tashifProf = tashifProfileRes?.status === "success" ? tashifProfileRes : null;
    const officialBadges = Array.isArray(officialBadgesRes?.models) ? officialBadgesRes.models : [];
    const tashifBadges = Array.isArray(tashifBadgesRes?.badges) ? tashifBadgesRes.badges : [];

    const userExists = Boolean(
      model ||
      tashifProf ||
      officialBadges.length > 0 ||
      tashifBadges.length > 0 ||
      officialBadgesRes?.status === true
    );

    if (!userExists) {
      return new Response(
        JSON.stringify({ error: `HackerRank user '${cleanUsername}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract Identity Info
    let name = model?.name || tashifProf?.profile?.realName || model?.personal_first_name ? `${model.personal_first_name || ""} ${model.personal_last_name || ""}`.trim() : null;
    if (!name || name === cleanUsername) {
      name = null;
    }

    let rawAvatar = model?.avatar || tashifProf?.profile?.avatar || null;
    if (rawAvatar && rawAvatar.startsWith("//")) {
      rawAvatar = `https:${rawAvatar}`;
    }

    const country = model?.country || tashifProf?.profile?.country || null;
    const school = model?.school || tashifProf?.profile?.school || null;
    const level = typeof model?.level === "number" ? model.level : null;

    // Process & Deduplicate Badges
    const badgesMap = new Map<string, HackerRankBadge>();

    // 1. Process official badges
    for (const b of officialBadges) {
      const badgeName = b.badge_name || b.badge_type || b.displayName || b.title || "Domain Badge";
      const key = badgeName.toLowerCase().trim();
      const stars = Math.min(6, Math.max(1, typeof b.total_stars === "number" ? b.total_stars : (typeof b.stars === "number" ? b.stars : 1)));
      const solved = typeof b.solved === "number" ? b.solved : (typeof b.solved_challenges === "number" ? b.solved_challenges : 0);
      const points = typeof b.total_points === "number" ? b.total_points : 0;
      const icon = b.icon_url || b.icon || b.badge_image || undefined;

      badgesMap.set(key, {
        badge_name: badgeName,
        stars,
        icon,
        category: b.category_name || b.badge_category || "Domain Badge",
        solved: solved > 0 ? solved : undefined,
        total_points: points > 0 ? points : undefined,
      });
    }

    // 2. Process tashif badges as complement
    for (const b of tashifBadges) {
      const badgeName = b.displayName || b.name || b.badge_name || "Domain Badge";
      const key = badgeName.toLowerCase().trim();

      let stars = 1;
      if (b.id && typeof b.id === "string") {
        const parts = b.id.split(":");
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > 0) stars = Math.min(6, lastNum);
      }
      if (typeof b.stars === "number") stars = b.stars;

      if (!badgesMap.has(key) || stars > (badgesMap.get(key)?.stars || 0)) {
        badgesMap.set(key, {
          badge_name: badgeName,
          stars,
          icon: b.icon || badgesMap.get(key)?.icon,
          category: "Domain Badge",
        });
      }
    }

    const badges = Array.from(badgesMap.values());
    const totalStars = badges.reduce((acc, curr) => acc + (curr.stars || 1), 0);
    const badgesCount = badges.length;

    // Process & Deduplicate Certificates
    const certsMap = new Map<string, HackerRankCertificate>();

    // From community endpoint
    const communityData = Array.isArray(communityCertsRes?.data) ? communityCertsRes.data : [];
    for (const c of communityData) {
      const heading = c.attributes?.heading || c.heading || c.title || c.certificate_name;
      if (heading) {
        const key = heading.toLowerCase().trim();
        const certId = c.attributes?.certificate_id || c.certificate_id || c.id;
        const certUrl = certId ? `https://www.hackerrank.com/certificates/${certId}` : `https://www.hackerrank.com/profile/${encodeURIComponent(cleanUsername)}`;
        certsMap.set(key, {
          heading: heading.trim(),
          level: c.attributes?.level || c.level || undefined,
          certificate_url: certUrl,
          earned_at: c.attributes?.earned_at || c.earned_at || undefined,
        });
      }
    }

    // From official certificates endpoint
    const officialData = Array.isArray(officialCertsRes?.data) ? officialCertsRes.data : (Array.isArray(officialCertsRes?.models) ? officialCertsRes.models : []);
    for (const c of officialData) {
      const heading = c.heading || c.title || c.certificate_name || c.name;
      if (heading) {
        const key = heading.toLowerCase().trim();
        if (!certsMap.has(key)) {
          const certId = c.id || c.certificate_id || c.hash;
          certsMap.set(key, {
            heading: heading.trim(),
            level: c.level || undefined,
            certificate_url: certId ? `https://www.hackerrank.com/certificates/${certId}` : `https://www.hackerrank.com/profile/${encodeURIComponent(cleanUsername)}`,
            earned_at: c.earned_at || c.created_at || undefined,
          });
        }
      }
    }

    const certificates = Array.from(certsMap.values());
    const certificatesCount = certificates.length;

    // Calculate Total Solved Problems
    let totalSolved = 0;
    if (tashifProf?.contributions?.questionCount) {
      totalSolved = tashifProf.contributions.questionCount;
    }

    let badgeSolvedSum = 0;
    for (const b of badges) {
      if (typeof b.solved === "number" && b.solved > 0) {
        badgeSolvedSum += b.solved;
      }
    }

    if (badgeSolvedSum > 0) {
      totalSolved = Math.max(totalSolved, badgeSolvedSum);
    }

    if (totalSolved === 0 && model?.solved_challenges_count) {
      totalSolved = model.solved_challenges_count;
    }

    // Heuristic estimation if exact count isn't directly reported by API
    if (totalSolved === 0 && badges.length > 0) {
      totalSolved = badges.reduce((acc, curr) => acc + (curr.stars * 12), 0);
    } else if (totalSolved === 0 && level && level > 0) {
      totalSolved = level * 10;
    }

    // Scores & Global Elo
    let globalRank: number | null = null;
    let score: number | null = null;
    if (scoresEloRes && typeof scoresEloRes === "object") {
      if (typeof scoresEloRes.rank === "number") globalRank = scoresEloRes.rank;
      if (typeof scoresEloRes.score === "number") score = scoresEloRes.score;
    }

    const payload: HackerRankStatsPayload = {
      username: model?.username || cleanUsername,
      name,
      avatar: rawAvatar,
      country,
      school,
      level,
      totalSolved,
      badgesCount,
      totalStars,
      badges: badges.length > 0 ? badges : undefined,
      certificatesCount,
      certificates: certificates.length > 0 ? certificates : undefined,
      globalRank,
      score,
      profile_url: `https://www.hackerrank.com/profile/${encodeURIComponent(cleanUsername)}`,
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
      JSON.stringify({ error: err?.message || "Failed to fetch HackerRank stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
