// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CodeforcesBadgeItem {
  name: string;
  category?: string;
  description?: string;
  icon?: string;
}

interface CodeforcesContestHistoryItem {
  contestId: number;
  contestName: string;
  rank: number;
  oldRating: number;
  newRating: number;
  ratingChange: number;
  date?: string;
  ratingUpdateTimeSeconds?: number;
}

interface CodeforcesStatsPayload {
  handle: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  titlePhoto?: string | null;
  country?: string | null;
  city?: string | null;
  organization?: string | null;

  // Rating & Ranking
  rating: number;
  maxRating: number;
  rank: string;
  maxRank?: string | null;
  contribution?: number | null;
  friendOfCount?: number | null;
  registrationDate?: string | null;
  lastOnlineTime?: string | null;

  // Problem Solving Stats
  totalSolved: number;
  totalSubmissions?: number | null;
  acceptanceRate?: number | null;
  problemDifficultyBreakdown?: Record<string, number> | null;
  verdictBreakdown?: {
    ok: number;
    wrongAnswer: number;
    timeLimitExceeded: number;
    other: number;
  } | null;
  topTags?: Array<{ name: string; count: number }> | null;
  languages?: Array<{ language: string; count: number }> | null;

  // Contest Stats
  contestsAttended?: number | null;
  bestRank?: number | null;
  maxRatingGain?: number | null;
  recentContests?: CodeforcesContestHistoryItem[];
  badges?: CodeforcesBadgeItem[];

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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let handle = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      handle = body.handle || body.username || "";
    } else {
      const url = new URL(req.url);
      handle = url.searchParams.get("handle") || url.searchParams.get("username") || "";
    }

    const cleanHandle = (handle || "")
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?codeforces\.com\/profile\//i, "")
      .replace(/\/+$/, "")
      .trim();

    if (!cleanHandle) {
      return new Response(
        JSON.stringify({ error: "Codeforces handle is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Concurrent fetch from official Codeforces APIs
    const [userInfoRes, userRatingRes, userStatusRes] = await Promise.all([
      fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanHandle)}`),
      fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(cleanHandle)}`),
      fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanHandle)}&from=1&count=10000`),
    ]);

    if (!userInfoRes || userInfoRes.status !== "OK" || !userInfoRes.result || userInfoRes.result.length === 0) {
      return new Response(
        JSON.stringify({ error: `Codeforces user '${cleanHandle}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const u = userInfoRes.result[0];

    // Compute display name
    const firstName = u.firstName || null;
    const lastName = u.lastName || null;
    let fullName: string | null = null;
    if (firstName && lastName) fullName = `${firstName} ${lastName}`;
    else if (firstName) fullName = firstName;
    else if (lastName) fullName = lastName;

    const rating = typeof u.rating === "number" ? u.rating : 0;
    const maxRating = typeof u.maxRating === "number" ? u.maxRating : rating;
    const rank = u.rank || (rating > 0 ? "pupil" : "unrated");
    const maxRank = u.maxRank || rank;

    // Process Contest Ratings
    let contestsAttended = 0;
    let bestRank: number | null = null;
    let maxRatingGain: number | null = null;
    const recentContests: CodeforcesContestHistoryItem[] = [];

    if (userRatingRes && userRatingRes.status === "OK" && Array.isArray(userRatingRes.result)) {
      const contestList = userRatingRes.result;
      contestsAttended = contestList.length;

      for (const c of contestList) {
        if (typeof c.rank === "number") {
          if (bestRank === null || c.rank < bestRank) {
            bestRank = c.rank;
          }
        }

        const gain = (c.newRating || 0) - (c.oldRating || 0);
        if (gain > 0) {
          if (maxRatingGain === null || gain > maxRatingGain) {
            maxRatingGain = gain;
          }
        }

        let dateStr = "";
        if (c.ratingUpdateTimeSeconds) {
          try {
            dateStr = new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          } catch {
            dateStr = "";
          }
        }

        recentContests.push({
          contestId: c.contestId,
          contestName: c.contestName,
          rank: c.rank,
          oldRating: c.oldRating,
          newRating: c.newRating,
          ratingChange: gain,
          date: dateStr,
          ratingUpdateTimeSeconds: c.ratingUpdateTimeSeconds,
        });
      }
    }

    // Process Submissions & Problems
    let totalSolved = 0;
    let totalSubmissions = 0;
    const problemDifficultyBreakdown: Record<string, number> = {};
    const topTagsMap: Record<string, number> = {};
    const languagesMap: Record<string, number> = {};
    const verdictBreakdown = {
      ok: 0,
      wrongAnswer: 0,
      timeLimitExceeded: 0,
      other: 0,
    };

    if (userStatusRes && userStatusRes.status === "OK" && Array.isArray(userStatusRes.result)) {
      const submissions = userStatusRes.result;
      totalSubmissions = submissions.length;

      const solvedProblemKeys = new Set<string>();

      for (const sub of submissions) {
        // Verdict counts
        if (sub.verdict === "OK") {
          verdictBreakdown.ok++;
          const p = sub.problem;
          if (p) {
            const problemKey = `${p.contestId || 0}-${p.index || ""}-${p.name || ""}`;
            if (!solvedProblemKeys.has(problemKey)) {
              solvedProblemKeys.add(problemKey);

              // Rating breakdown
              if (typeof p.rating === "number" && p.rating > 0) {
                const rStr = p.rating.toString();
                problemDifficultyBreakdown[rStr] = (problemDifficultyBreakdown[rStr] || 0) + 1;
              }

              // Tags breakdown
              if (Array.isArray(p.tags)) {
                for (const t of p.tags) {
                  const cleanTag = t.trim();
                  if (cleanTag) {
                    topTagsMap[cleanTag] = (topTagsMap[cleanTag] || 0) + 1;
                  }
                }
              }
            }
          }
        } else if (sub.verdict === "WRONG_ANSWER") {
          verdictBreakdown.wrongAnswer++;
        } else if (sub.verdict === "TIME_LIMIT_EXCEEDED") {
          verdictBreakdown.timeLimitExceeded++;
        } else {
          verdictBreakdown.other++;
        }

        // Language tracking
        if (sub.programmingLanguage) {
          const lang = sub.programmingLanguage.trim();
          languagesMap[lang] = (languagesMap[lang] || 0) + 1;
        }
      }

      totalSolved = solvedProblemKeys.size;
    }

    const acceptanceRate = totalSubmissions > 0
      ? Math.round((verdictBreakdown.ok / totalSubmissions) * 100)
      : null;

    const topTags = Object.entries(topTagsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const languages = Object.entries(languagesMap)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Format registration & last online dates
    let registrationDate: string | null = null;
    if (u.registrationTimeSeconds) {
      try {
        registrationDate = new Date(u.registrationTimeSeconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        registrationDate = null;
      }
    }

    let lastOnlineTime: string | null = null;
    if (u.lastOnlineTimeSeconds) {
      try {
        lastOnlineTime = new Date(u.lastOnlineTimeSeconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        lastOnlineTime = null;
      }
    }

    // Dynamic Badges Creation
    const badges: CodeforcesBadgeItem[] = [];

    if (maxRating >= 2400) {
      badges.push({ name: "Grandmaster", category: "Tier", description: "Reached 2400+ Grandmaster rank on Codeforces" });
    } else if (maxRating >= 2100) {
      badges.push({ name: "Master", category: "Tier", description: "Reached 2100+ Master rank on Codeforces" });
    } else if (maxRating >= 1900) {
      badges.push({ name: "Candidate Master", category: "Tier", description: "Reached 1900+ Candidate Master rank" });
    } else if (maxRating >= 1600) {
      badges.push({ name: "Expert Peak", category: "Tier", description: "Reached 1600+ Expert division rank" });
    } else if (maxRating >= 1400) {
      badges.push({ name: "Specialist", category: "Tier", description: "Reached 1400+ Specialist rating" });
    } else if (maxRating >= 1200) {
      badges.push({ name: "Pupil", category: "Tier", description: "Rated active Pupil solver" });
    }

    if (bestRank && bestRank <= 100) {
      badges.push({ name: "Top 100 Finisher", category: "Standing", description: `Achieved global Rank #${bestRank} in a rated contest` });
    } else if (bestRank && bestRank <= 1000) {
      badges.push({ name: "Top 1000 Standing", category: "Standing", description: `Achieved global Rank #${bestRank} in a rated contest` });
    }

    if (maxRatingGain && maxRatingGain >= 200) {
      badges.push({ name: "Rating Surge", category: "Growth", description: `Single round increase of +${maxRatingGain} rating points` });
    }

    if (contestsAttended >= 25) {
      badges.push({ name: "Contest Veteran", category: "Activity", description: `Participated in ${contestsAttended} rated Codeforces contests` });
    } else if (contestsAttended >= 5) {
      badges.push({ name: "Rated Competitor", category: "Activity", description: `Active participant in ${contestsAttended} rated rounds` });
    }

    if (totalSolved >= 100) {
      badges.push({ name: "Centurion", category: "Problems", description: "Solved 100+ unique algorithmic problems" });
    } else if (totalSolved >= 20) {
      badges.push({ name: "Algorithm Solver", category: "Problems", description: `Solved ${totalSolved} unique problems on Codeforces` });
    }

    if (topTags.length > 0 && topTags[0].count >= 10) {
      badges.push({ name: `${topTags[0].name.charAt(0).toUpperCase() + topTags[0].name.slice(1)} Specialist`, category: "Topic", description: `Solved ${topTags[0].count}+ problems in ${topTags[0].name}` });
    }

    let avatarUrl = u.avatar || null;
    if (avatarUrl && avatarUrl.startsWith("//")) {
      avatarUrl = `https:${avatarUrl}`;
    }
    let titlePhotoUrl = u.titlePhoto || null;
    if (titlePhotoUrl && titlePhotoUrl.startsWith("//")) {
      titlePhotoUrl = `https:${titlePhotoUrl}`;
    }

    const payload: CodeforcesStatsPayload = {
      handle: u.handle || cleanHandle,
      name: fullName,
      firstName,
      lastName,
      avatar: avatarUrl,
      titlePhoto: titlePhotoUrl,
      country: u.country || null,
      city: u.city || null,
      organization: u.organization || null,

      rating,
      maxRating,
      rank,
      maxRank,
      contribution: typeof u.contribution === "number" ? u.contribution : 0,
      friendOfCount: typeof u.friendOfCount === "number" ? u.friendOfCount : 0,
      registrationDate,
      lastOnlineTime,

      totalSolved,
      totalSubmissions,
      acceptanceRate,
      problemDifficultyBreakdown,
      verdictBreakdown,
      topTags,
      languages,

      contestsAttended,
      bestRank,
      maxRatingGain,
      recentContests,
      badges,

      profile_url: `https://codeforces.com/profile/${encodeURIComponent(cleanHandle)}`,
      last_updated: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ data: payload, success: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to fetch Codeforces profile" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
