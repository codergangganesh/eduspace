// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeetCodeBadgeItem {
  id?: string;
  name: string;
  shortName?: string;
  displayName?: string;
  icon?: string;
  category?: string;
  creationDate?: string;
  hoverText?: string;
}

interface LeetCodeContestHistoryItem {
  name: string;
  rating: number;
  rank?: number;
  problemsSolved?: number;
  totalProblems?: number;
  date?: string;
  trend?: string;
}

interface LeetCodeStatsPayload {
  username: string;
  name?: string | null;
  avatar?: string | null;
  aboutMe?: string | null;
  countryName?: string | null;
  company?: string | null;
  school?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;

  // Problem Solving Stats
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  totalQuestions: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  acceptanceRate?: number | null;
  ranking?: number | null; // Global Problem Solving Rank
  reputation?: number | null;
  starRating?: number | null;

  // Contest Stats
  contestRating?: number | null;
  contestGlobalRanking?: number | null;
  contestTopPercentage?: number | null;
  contestsAttended?: number | null;
  contestBadge?: string | null;
  recentContests: LeetCodeContestHistoryItem[];

  // Activity & Badges
  streak?: number | null;
  totalActiveDays?: number | null;
  submissionCalendar?: string | null;
  badges: LeetCodeBadgeItem[];
  languageStats?: Array<{ languageName: string; problemsSolved: number }>;
  skillStats?: {
    fundamental?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    intermediate?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
    advanced?: Array<{ tagName: string; tagSlug: string; problemsSolved: number }>;
  };

  profile_url: string;
  last_updated: string;
}

function normalizeIconUrl(iconUrl?: string | null): string | undefined {
  if (!iconUrl) return undefined;
  let url = iconUrl.trim();
  if (url.startsWith("/")) {
    url = `https://leetcode.com${url}`;
  }
  return url;
}

async function queryLeetCodeGraphQL(query: string, variables: Record<string, any>, username: string) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Referer": `https://leetcode.com/u/${encodeURIComponent(username)}/`,
      "Origin": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(9000),
  });

  if (!res.ok) {
    throw new Error(`LeetCode GraphQL HTTP error: ${res.status} ${res.statusText}`);
  }

  return await res.json();
}

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let username = "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        username = body?.username || "";
      } catch {
        // Fallback to URL search params
      }
    }

    if (!username) {
      const url = new URL(req.url);
      username = url.searchParams.get("username") || "";
    }

    // Clean username (strip leading/trailing slashes or full URL)
    username = username
      .replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: "Username parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = Date.now();

    // 1. GraphQL Queries
    const profileQuery = `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          username
          githubUrl
          twitterUrl
          linkedinUrl
          profile {
            realName
            userAvatar
            aboutMe
            school
            countryName
            company
            ranking
            reputation
            starRating
            skillTags
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
            totalSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          badges {
            id
            name
            shortName
            displayName
            icon
            hoverText
            category
            creationDate
          }
          activeBadge {
            id
            name
            displayName
            icon
          }
        }
        allQuestionsCount {
          difficulty
          count
        }
      }
    `;

    const contestQuery = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          attendedContestsCount
          rating
          globalRanking
          totalParticipants
          topPercentage
          badge {
            name
          }
        }
        userContestRankingHistory(username: $username) {
          attended
          trendDirection
          problemsSolved
          totalProblems
          finishTimeInSeconds
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;

    const calendarQuery = `
      query userProfileCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `;

    const skillQuery = `
      query skillStats($username: String!) {
        matchedUser(username: $username) {
          languageProblemCount {
            languageName
            problemsSolved
          }
          tagProblemCounts {
            advanced {
              tagName
              tagSlug
              problemsSolved
            }
            intermediate {
              tagName
              tagSlug
              problemsSolved
            }
            fundamental {
              tagName
              tagSlug
              problemsSolved
            }
          }
        }
      }
    `;

    // Tier 1: Direct official LeetCode GraphQL fetch
    try {
      const [pRes, cRes, calRes, sRes] = await Promise.allSettled([
        queryLeetCodeGraphQL(profileQuery, { username }, username),
        queryLeetCodeGraphQL(contestQuery, { username }, username),
        queryLeetCodeGraphQL(calendarQuery, { username }, username),
        queryLeetCodeGraphQL(skillQuery, { username }, username),
      ]);

      let matchedUser: any = null;
      let allQuestionsCount: any[] = [];

      if (pRes.status === "fulfilled" && pRes.value?.data) {
        matchedUser = pRes.value.data.matchedUser;
        allQuestionsCount = pRes.value.data.allQuestionsCount || [];
      }

      if (matchedUser) {
        // Parse problem stats
        const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];
        const totalSubmissions = matchedUser.submitStats?.totalSubmissionNum || [];

        const getCount = (arr: any[], diff: string) => {
          const item = arr.find((x: any) => x.difficulty?.toLowerCase() === diff.toLowerCase());
          return item ? Number(item.count) || 0 : 0;
        };

        const getSubmissions = (arr: any[], diff: string) => {
          const item = arr.find((x: any) => x.difficulty?.toLowerCase() === diff.toLowerCase());
          return item ? Number(item.submissions) || 0 : 0;
        };

        const totalSolved = getCount(acSubmissions, "all");
        const easy = getCount(acSubmissions, "easy");
        const medium = getCount(acSubmissions, "medium");
        const hard = getCount(acSubmissions, "hard");

        const allTotalSubmissions = getSubmissions(totalSubmissions, "all");
        const allAcSubmissions = getSubmissions(acSubmissions, "all");

        let acceptanceRate: number | null = null;
        if (allTotalSubmissions > 0 && allAcSubmissions > 0) {
          acceptanceRate = Math.round((allAcSubmissions / allTotalSubmissions) * 1000) / 10;
        }

        const totalQuestions = getCount(allQuestionsCount, "all") || 4040;
        const easyTotal = getCount(allQuestionsCount, "easy") || 960;
        const mediumTotal = getCount(allQuestionsCount, "medium") || 2100;
        const hardTotal = getCount(allQuestionsCount, "hard") || 980;

        // Parse contest info
        let contestRating: number | null = null;
        let contestGlobalRanking: number | null = null;
        let contestTopPercentage: number | null = null;
        let contestsAttended: number | null = null;
        let contestBadge: string | null = null;
        const recentContests: LeetCodeContestHistoryItem[] = [];

        if (cRes.status === "fulfilled" && cRes.value?.data) {
          const cData = cRes.value.data;
          const ranking = cData.userContestRanking;
          if (ranking) {
            if (typeof ranking.rating === "number" && ranking.rating > 0) {
              contestRating = Math.round(ranking.rating);
            }
            if (typeof ranking.globalRanking === "number" && ranking.globalRanking > 0) {
              contestGlobalRanking = ranking.globalRanking;
            }
            if (typeof ranking.topPercentage === "number") {
              contestTopPercentage = Math.round(ranking.topPercentage * 10) / 10;
            }
            if (typeof ranking.attendedContestsCount === "number") {
              contestsAttended = ranking.attendedContestsCount;
            }
            if (ranking.badge?.name) {
              contestBadge = ranking.badge.name;
            } else if (contestRating) {
              if (contestRating >= 2200) contestBadge = "Guardian";
              else if (contestRating >= 1850) contestBadge = "Knight";
            }
          }

          const history = cData.userContestRankingHistory;
          if (Array.isArray(history)) {
            const attendedHistory = history.filter((h: any) => h.attended === true || (h.rating && h.rating > 0));
            attendedHistory.forEach((h: any) => {
              const contestDate = h.contest?.startTime ? new Date(h.contest.startTime * 1000).toISOString().split("T")[0] : undefined;
              recentContests.push({
                name: h.contest?.title || "LeetCode Contest",
                rating: Math.round(h.rating || 0),
                rank: typeof h.ranking === "number" ? h.ranking : undefined,
                problemsSolved: typeof h.problemsSolved === "number" ? h.problemsSolved : undefined,
                totalProblems: typeof h.totalProblems === "number" ? h.totalProblems : undefined,
                date: contestDate,
                trend: h.trendDirection,
              });
            });
          }
        }

        // Parse Calendar & Streaks
        let streak: number | null = null;
        let totalActiveDays: number | null = null;
        let submissionCalendar: string | null = null;

        if (calRes.status === "fulfilled" && calRes.value?.data?.matchedUser?.userCalendar) {
          const cal = calRes.value.data.matchedUser.userCalendar;
          if (typeof cal.streak === "number") streak = cal.streak;
          if (typeof cal.totalActiveDays === "number") totalActiveDays = cal.totalActiveDays;
          if (cal.submissionCalendar) {
            submissionCalendar = typeof cal.submissionCalendar === "string" ? cal.submissionCalendar : JSON.stringify(cal.submissionCalendar);
          }
        }

        // Parse Badges
        const rawBadges = matchedUser.badges || [];
        const badges: LeetCodeBadgeItem[] = [];
        const seenBadgeNames = new Set<string>();

        rawBadges.forEach((b: any) => {
          if (!b || !b.name || seenBadgeNames.has(b.name)) return;
          seenBadgeNames.add(b.name);
          badges.push({
            id: b.id,
            name: b.name,
            shortName: b.shortName,
            displayName: b.displayName || b.name,
            icon: normalizeIconUrl(b.icon),
            category: b.category,
            creationDate: b.creationDate,
            hoverText: b.hoverText,
          });
        });

        // Add Contest Badge if not already present
        if (contestBadge && !badges.some(b => b.name.toLowerCase().includes(contestBadge.toLowerCase()))) {
          badges.unshift({
            name: contestBadge,
            displayName: `${contestBadge} Contest Badge`,
            category: "CONTEST",
            icon: contestBadge.toLowerCase() === "guardian"
              ? "https://assets.leetcode.com/static_assets/public/images/badges/guardian.png"
              : "https://assets.leetcode.com/static_assets/public/images/badges/knight.png",
          });
        }

        // Parse Language & Tag stats
        let languageStats: any[] = [];
        let skillStats: any = undefined;

        if (sRes.status === "fulfilled" && sRes.value?.data?.matchedUser) {
          const sData = sRes.value.data.matchedUser;
          if (Array.isArray(sData.languageProblemCount)) {
            languageStats = sData.languageProblemCount;
          }
          if (sData.tagProblemCounts) {
            skillStats = sData.tagProblemCounts;
          }
        }

        const profile = matchedUser.profile || {};

        const payload: LeetCodeStatsPayload = {
          username: matchedUser.username || username,
          name: profile.realName || null,
          avatar: profile.userAvatar || null,
          aboutMe: profile.aboutMe || null,
          countryName: profile.countryName || null,
          company: profile.company || null,
          school: profile.school || null,
          githubUrl: matchedUser.githubUrl || null,
          twitterUrl: matchedUser.twitterUrl || null,
          linkedinUrl: matchedUser.linkedinUrl || null,

          totalSolved,
          easy,
          medium,
          hard,
          totalQuestions,
          easyTotal,
          mediumTotal,
          hardTotal,
          acceptanceRate,
          ranking: profile.ranking || null,
          reputation: profile.reputation || null,
          starRating: profile.starRating || null,

          contestRating,
          contestGlobalRanking,
          contestTopPercentage,
          contestsAttended,
          contestBadge,
          recentContests,

          streak,
          totalActiveDays,
          submissionCalendar,
          badges,
          languageStats: languageStats.length > 0 ? languageStats : undefined,
          skillStats,

          profile_url: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
          last_updated: new Date().toISOString(),
        };

        return new Response(
          JSON.stringify({ success: true, data: payload }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (pRes.status === "fulfilled" && pRes.value?.errors && pRes.value.errors.some((e: any) => e.message?.includes("does not exist"))) {
        return new Response(
          JSON.stringify({ success: false, error: `LeetCode user '${username}' not found.` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (directErr) {
      console.warn("Direct LeetCode GraphQL fetch failed, attempting microservice fallback:", directErr);
    }

    // Tier 2: Microservice Fallback (Faisalshohag API, Alfa API, LeetCode Stats API)
    try {
      const [faisalRes, alfaProfileRes, alfaSolvedRes] = await Promise.allSettled([
        fetch(`https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
        fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
        fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
      ]);

      let merged: any = {
        username,
        profile_url: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
        last_updated: new Date().toISOString(),
      };

      if (faisalRes.status === "fulfilled" && faisalRes.value.ok) {
        const fData = await faisalRes.value.json();
        if (fData && (fData.totalSolved !== undefined || fData.solvedProblem !== undefined)) {
          merged.totalSolved = fData.totalSolved ?? fData.solvedProblem ?? 0;
          merged.easy = fData.easySolved ?? 0;
          merged.medium = fData.mediumSolved ?? 0;
          merged.hard = fData.hardSolved ?? 0;
          if (fData.ranking) merged.ranking = fData.ranking;
          if (fData.reputation) merged.reputation = fData.reputation;
          if (fData.acceptanceRate) merged.acceptanceRate = fData.acceptanceRate;
          if (fData.contributionPoints) merged.reputation = fData.contributionPoints;
          if (fData.name) merged.name = fData.name;
          if (fData.avatar) merged.avatar = fData.avatar;
          if (fData.country) merged.countryName = fData.country;
          if (fData.school) merged.school = fData.school;
          if (fData.company) merged.company = fData.company;
        }
      }

      if (alfaProfileRes.status === "fulfilled" && alfaProfileRes.value.ok) {
        const aData = await alfaProfileRes.value.json();
        if (aData) {
          if (!merged.name && aData.name) merged.name = aData.name;
          if (!merged.avatar && aData.avatar) merged.avatar = aData.avatar;
          if (!merged.countryName && aData.country) merged.countryName = aData.country;
          if (!merged.ranking && aData.ranking) merged.ranking = aData.ranking;
          if (!merged.reputation && aData.reputation) merged.reputation = aData.reputation;
        }
      }

      if (alfaSolvedRes.status === "fulfilled" && alfaSolvedRes.value.ok) {
        const sData = await alfaSolvedRes.value.json();
        if (sData) {
          if (typeof sData.solvedProblem === "number" && !merged.totalSolved) {
            merged.totalSolved = sData.solvedProblem;
            merged.easy = sData.easySolved ?? 0;
            merged.medium = sData.mediumSolved ?? 0;
            merged.hard = sData.hardSolved ?? 0;
          }
        }
      }

      if (merged.totalSolved !== undefined || merged.ranking) {
        return new Response(
          JSON.stringify({ success: true, data: merged }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fallbackErr) {
      console.warn("Microservice fallback failed:", fallbackErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: `Could not fetch LeetCode profile for "${username}".` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
