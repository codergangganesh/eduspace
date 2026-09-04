import { supabase } from "@/integrations/supabase/client";
import { fetchHackerRankStats, fetchHackerEarthStats } from "./additionalPlatformsService";
import { fetchHuggingFaceStats } from "./huggingFaceService";
import { fetchChessStats } from "./chessService";
import { fetchCredlyStats, extractCredlyUsername } from "./credlyService";
import { fetchWakaTimeStats, extractWakaTimeUsername } from "./wakatimeService";
import {
  LeetCodeStats,
  LeetCodeBadge,
  CodeforcesStats,
  CodeforcesBadge,
  CodeforcesContestHistoryItem,
  CodeChefStats,
  CodeChefBadge,
  CodewarsStats,
  CodewarsLanguageStat,
  CodewarsBadge,
  GeeksForGeeksStats,
  AtCoderStats,
  OverallStats,
  CodingProfilesResponse,
  UserCodingProfilesRecord,
  GitHubStats,
  GitHubLanguageShare,
  GitHubRepoItem,
  GitHubOrg,
  GitHubActivityEvent,
  GitHubAchievement,
  GitHubSearchResultItem,
  ContributionDay,
} from "@/types/codingProfile";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes real-time cache TTL

/**
 * Extracts a clean username/handle from either a full profile URL or raw username.
 * e.g. "https://leetcode.com/u/john_doe/" -> "john_doe"
 * e.g. "https://codeforces.com/profile/tourist" -> "tourist"
 * e.g. "  john_doe  " -> "john_doe"
 */
export function extractUsername(input: string | null | undefined): string {
  if (!input) return "";
  let trimmed = input.trim();
  if (!trimmed) return "";

  // Remove trailing slashes
  trimmed = trimmed.replace(/\/+$/, "");

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length > 0) {
        let last = parts[parts.length - 1];
        if ((parts[0] === "u" || parts[0] === "profile" || parts[0] === "user" || parts[0] === "users") && parts[1]) {
          last = parts[1];
        }
        trimmed = last;
      }
    }
  } catch {
    // If not a valid URL, treat as raw username
  }

  // Remove leading @ if present e.g. "@lboris" -> "lboris"
  trimmed = trimmed.replace(/^@+/, "");

  return trimmed;
}



/**
 * Helper to normalize LeetCode stats.
 */
function normalizeLeetCodeStats(raw: any, username: string): LeetCodeStats {
  const totalSolved = parseInt(String(raw.totalSolved || raw.solvedProblem || raw.allSolved || 0)) || 0;
  const easy = parseInt(String(raw.easySolved || raw.easy || 0)) || 0;
  const medium = parseInt(String(raw.mediumSolved || raw.medium || 0)) || 0;
  const hard = parseInt(String(raw.hardSolved || raw.hard || 0)) || 0;

  const totalQuestions = parseInt(String(raw.totalQuestions || raw.totalProblems || 0)) || undefined;
  const easyTotal = parseInt(String(raw.totalEasy || raw.easyTotal || 0)) || undefined;
  const mediumTotal = parseInt(String(raw.totalMedium || raw.mediumTotal || 0)) || undefined;
  const hardTotal = parseInt(String(raw.totalHard || raw.hardTotal || 0)) || undefined;

  const acceptanceRate = typeof raw.acceptanceRate === "number" ? raw.acceptanceRate : (parseFloat(raw.acceptanceRate) || null);
  const ranking = parseInt(String(raw.ranking || raw.globalRanking || 0)) || null;
  const reputation = parseInt(String(raw.reputation || 0)) || null;
  const contributionPoints = parseInt(String(raw.contributionPoints || raw.contributionPoint || 0)) || null;
  const starRating = typeof raw.starRating === "number" ? raw.starRating : null;

  const rawRating = raw.contestRating || raw.rating || raw.userContestRanking?.rating;
  const contestRating = typeof rawRating === "number" ? Math.round(rawRating) : (parseInt(rawRating) || null);

  const contestGlobalRanking = parseInt(String(raw.contestGlobalRanking || raw.globalRankingContest || raw.userContestRanking?.globalRanking || 0)) || null;
  const contestTopPercentage = typeof raw.contestTopPercentage === "number" ? raw.contestTopPercentage : (typeof raw.topPercentage === "number" ? raw.topPercentage : (parseFloat(raw.topPercentage) || null));
  const contestsAttended = parseInt(String(raw.contestsAttended || raw.attendedContestsCount || raw.userContestRanking?.attendedContestsCount || 0)) || null;

  let contestBadge = raw.contestBadge || raw.badge?.name || raw.userContestRanking?.badge?.name || null;
  if (!contestBadge && contestRating) {
    if (contestRating >= 2200) contestBadge = "Guardian";
    else if (contestRating >= 1850) contestBadge = "Knight";
  }

  let badges: LeetCodeBadge[] = [];
  if (Array.isArray(raw.badges) && raw.badges.length > 0) {
    badges = raw.badges.map((b: any) => {
      let iconUrl = b.icon || b.badge?.icon || b.iconUrl;
      if (iconUrl && typeof iconUrl === "string") {
        if (!iconUrl.startsWith("http")) {
          const cleanPath = iconUrl.startsWith("/") ? iconUrl : `/${iconUrl}`;
          iconUrl = `https://leetcode.com${cleanPath}`;
        }
      }
      return {
        id: b.id || b.badge?.id,
        name: b.displayName || b.name || b.badge?.displayName || "LeetCode Badge",
        shortName: b.shortName || b.badge?.shortName,
        displayName: b.displayName || b.name,
        icon: typeof iconUrl === "string" ? iconUrl : undefined,
        category: b.category || b.badge?.category || "LeetCode Badge",
        creationDate: b.creationDate || b.earnedDate || undefined,
        description: b.hoverText || b.description || b.badge?.hoverText || b.badge?.description || undefined,
        hoverText: b.hoverText || b.badge?.hoverText || undefined,
      };
    });
  }

  return {
    username,
    name: raw.name || raw.realName || raw.displayName || null,
    avatar: raw.avatar || raw.userAvatar || raw.profile_image || null,
    aboutMe: raw.aboutMe || null,
    countryName: raw.countryName || raw.country || raw.location || null,
    company: raw.company || null,
    school: raw.school || null,
    githubUrl: raw.githubUrl || null,
    twitterUrl: raw.twitterUrl || null,
    linkedinUrl: raw.linkedinUrl || null,

    totalSolved,
    easy,
    medium,
    hard,
    totalQuestions,
    easyTotal,
    mediumTotal,
    hardTotal,
    acceptanceRate,
    ranking,
    reputation,
    contributionPoints,
    starRating,

    contestRating,
    contestGlobalRanking,
    contestTopPercentage,
    contestsAttended,
    contestBadge,
    recentContests: Array.isArray(raw.recentContests) ? raw.recentContests : undefined,

    streak: typeof raw.streak === "number" ? raw.streak : null,
    totalActiveDays: typeof raw.totalActiveDays === "number" ? raw.totalActiveDays : null,
    submissionCalendar: raw.submissionCalendar || null,
    badges,
    languageStats: Array.isArray(raw.languageStats) ? raw.languageStats : undefined,
    skillStats: raw.skillStats || undefined,

    profile_url: raw.profile_url || `https://leetcode.com/u/${encodeURIComponent(username)}/`,
    last_updated: raw.last_updated || new Date().toISOString(),
  };
}

/**
 * Fetches LeetCode statistics using Supabase Edge Function with multi-tier fallbacks.
 */
export async function fetchLeetCodeStats(usernameInput: string): Promise<{
  data: LeetCodeStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "LeetCode username is required" };
  }

  // Tier 0: Direct Supabase Edge Function (Serverless direct GraphQL query, no CORS limits, complete badges & contest timeline)
  try {
    const edgeRes = await supabase.functions.invoke("fetch-leetcode", {
      body: { username },
    });
    if (!edgeRes.error && edgeRes.data && edgeRes.data.success && edgeRes.data.data) {
      const stats = normalizeLeetCodeStats(edgeRes.data.data, username);
      if (stats.totalSolved > 0 || stats.easy > 0 || stats.contestRating || stats.ranking || stats.name) {
        return { data: stats, error: null };
      }
    } else if (edgeRes.data && edgeRes.data.success === false && edgeRes.data.error?.includes("not found")) {
      return { data: null, error: edgeRes.data.error };
    }
  } catch {
    // Edge function not deployed or unreachable, seamlessly continue to Tier 1
  }

  let mergedData: any = {};

  const timestamp = Date.now();

  // 1. Fetch Profile Solved Data (Vercel API, Alfa UserProfile, Alfa Solved, LeetCode-Stats-API)
  const profileEndpoints = [
    `https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}`,
    `https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}`,
    `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`,
    `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`,
    `https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}?_t=${timestamp}`,
    `https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}?_t=${timestamp}`,
    `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved?_t=${timestamp}`,
    `https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}?_t=${timestamp}`,
  ];

  for (const url of profileEndpoints) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.status === "success" || typeof json.totalSolved === "number" || typeof json.solvedProblem === "number" || typeof json.easySolved === "number")) {
          mergedData = { ...mergedData, ...json };
          if (mergedData.totalSolved || mergedData.solvedProblem || mergedData.easySolved) {
            break;
          }
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  // 2. Fetch Live Contest Ranking & Rating Info (LeetCode Official GraphQL via CORS Proxies + Alfa + Vercel)
  let contestDataFetched = false;

  const contestGraphQLQuery = {
    query: `
      query getUserContestRanking($username: String!) {
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
      }
    `,
    variables: { username },
  };

  const contestCorsProxies = [
    `https://corsproxy.io/?url=${encodeURIComponent("https://leetcode.com/graphql")}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://leetcode.com/graphql")}`,
  ];

  for (const proxyUrl of contestCorsProxies) {
    try {
      const cRes = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contestGraphQLQuery),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (cRes.ok) {
        const cJson = await cRes.json();
        const rankingObj = cJson?.data?.userContestRanking;
        if (rankingObj && (rankingObj.rating || typeof rankingObj.attendedContestsCount === "number")) {
          if (rankingObj.rating) mergedData.contestRating = Math.round(rankingObj.rating);
          if (rankingObj.globalRanking) mergedData.contestGlobalRanking = rankingObj.globalRanking;
          if (typeof rankingObj.topPercentage === "number") mergedData.contestTopPercentage = rankingObj.topPercentage;
          if (typeof rankingObj.attendedContestsCount === "number") mergedData.contestsAttended = rankingObj.attendedContestsCount;
          if (rankingObj.badge?.name || rankingObj.rating >= 1850) {
            mergedData.contestBadge = rankingObj.badge?.name || (rankingObj.rating >= 2200 ? "Guardian" : rankingObj.rating >= 1850 ? "Knight" : null);
          }
          contestDataFetched = true;
          break;
        }
      }
    } catch {
      // Try next proxy
    }
  }

  // Fallback to Alfa or Vercel if GraphQL proxy timed out
  if (!contestDataFetched) {
    const contestEndpoints = [
      `https://alfa-leetcode-api.onrender.com/userContestRankingInfo/${encodeURIComponent(username)}?_t=${timestamp}`,
      `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/contest?_t=${timestamp}`,
      `https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}?_t=${timestamp}`,
    ];

    for (const url of contestEndpoints) {
      try {
        const contestRes = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (contestRes.ok) {
          const cData = await contestRes.json();
          const rankingObj = cData?.userContestRanking || cData?.data?.userContestRanking || cData;
          if (rankingObj && (rankingObj.rating || rankingObj.attendedContestsCount || rankingObj.contestRating)) {
            const ratingVal = rankingObj.rating || rankingObj.contestRating;
            if (ratingVal) mergedData.contestRating = Math.round(ratingVal);
            if (rankingObj.globalRanking || rankingObj.contestGlobalRanking) {
              mergedData.contestGlobalRanking = rankingObj.globalRanking || rankingObj.contestGlobalRanking;
            }
            if (rankingObj.topPercentage || rankingObj.contestTopPercentage) {
              mergedData.contestTopPercentage = rankingObj.topPercentage || rankingObj.contestTopPercentage;
            }
            if (rankingObj.attendedContestsCount || rankingObj.contestsAttended) {
              mergedData.contestsAttended = rankingObj.attendedContestsCount || rankingObj.contestsAttended;
            }
            if (rankingObj.badge?.name || rankingObj.contestBadge || (ratingVal && ratingVal >= 1850)) {
              mergedData.contestBadge = rankingObj.badge?.name || rankingObj.contestBadge || (ratingVal >= 2200 ? "Guardian" : ratingVal >= 1850 ? "Knight" : null);
            }
            break;
          }
        }
      } catch { }
    }
  }

  // 3. Fetch Live Badges Info (LeetCode Official GraphQL via CORS Proxies + Alfa)
  const badgesGraphQLQuery = {
    query: `
      query getUserBadges($username: String!) {
        matchedUser(username: $username) {
          badges {
            id
            name
            displayName
            icon
            category
            creationDate
          }
          activeBadge {
            id
            displayName
            icon
          }
        }
      }
    `,
    variables: { username },
  };

  const badgeCorsProxies = [
    `https://corsproxy.io/?url=${encodeURIComponent("https://leetcode.com/graphql")}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://leetcode.com/graphql")}`,
  ];

  let badgesFetched = false;

  for (const proxyUrl of badgeCorsProxies) {
    try {
      const bRes = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgesGraphQLQuery),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (bRes.ok) {
        const bJson = await bRes.json();
        const rawBadges = bJson?.data?.matchedUser?.badges;
        if (Array.isArray(rawBadges) && rawBadges.length > 0) {
          mergedData.badges = rawBadges;
          badgesFetched = true;
          break;
        }
      }
    } catch {
      // try next proxy
    }
  }

  if (!badgesFetched) {
    try {
      const badgesRes = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/badges?_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (badgesRes.ok) {
        const bData = await badgesRes.json();
        const badgeList = bData?.badges || bData?.data?.badges;
        if (Array.isArray(badgeList) && badgeList.length > 0) {
          mergedData.badges = badgeList;
        }
      }
    } catch { }
  }

  const totalSolvedNum = parseInt(String(mergedData.totalSolved || mergedData.solvedProblem || mergedData.allSolved || 0)) || 0;
  const easyNum = parseInt(String(mergedData.easySolved || mergedData.easy || 0)) || 0;

  if (totalSolvedNum > 0 || easyNum > 0 || mergedData.contestRating) {
    return {
      data: normalizeLeetCodeStats(mergedData, username),
      error: null,
    };
  }

  return {
    data: null,
    error: `Could not fetch LeetCode profile for "${username}". Please verify the username.`,
  };
}

/**
 * Helper to normalize Codeforces stats from Edge Function or direct API payload.
 */
function normalizeCodeforcesStats(raw: any, statusResult: any[] = [], ratingResult: any[] = []): CodeforcesStats {
  // If already processed by Edge Function
  if (raw && typeof raw === "object" && "recentContests" in raw && "totalSolved" in raw && "rating" in raw) {
    return {
      handle: raw.handle || "",
      name: raw.name || [raw.firstName, raw.lastName].filter(Boolean).join(" ") || null,
      firstName: raw.firstName || null,
      lastName: raw.lastName || null,
      avatar: raw.avatar || raw.titlePhoto || null,
      titlePhoto: raw.titlePhoto || null,
      country: raw.country || null,
      city: raw.city || null,
      organization: raw.organization || null,
      rating: typeof raw.rating === "number" ? raw.rating : 0,
      maxRating: typeof raw.maxRating === "number" ? raw.maxRating : (raw.rating || 0),
      rank: raw.rank ? (raw.rank.charAt(0).toUpperCase() + raw.rank.slice(1)) : "Unrated",
      maxRank: raw.maxRank ? (raw.maxRank.charAt(0).toUpperCase() + raw.maxRank.slice(1)) : (raw.rank || "Unrated"),
      contribution: typeof raw.contribution === "number" ? raw.contribution : 0,
      friendOfCount: typeof raw.friendOfCount === "number" ? raw.friendOfCount : 0,
      registrationDate: raw.registrationDate || null,
      lastOnlineTime: raw.lastOnlineTime || null,
      totalSolved: typeof raw.totalSolved === "number" ? raw.totalSolved : 0,
      totalSubmissions: raw.totalSubmissions || 0,
      acceptanceRate: typeof raw.acceptanceRate === "number" ? raw.acceptanceRate : null,
      problemDifficultyBreakdown: raw.problemDifficultyBreakdown || null,
      verdictBreakdown: raw.verdictBreakdown || null,
      topTags: raw.topTags || [],
      languages: raw.languages || [],
      contestsAttended: typeof raw.contestsAttended === "number" ? raw.contestsAttended : (raw.recentContests?.length || 0),
      bestRank: raw.bestRank || null,
      maxRatingGain: raw.maxRatingGain || null,
      recentContests: raw.recentContests || [],
      badges: raw.badges || [],
      profile_url: raw.profile_url || `https://codeforces.com/profile/${encodeURIComponent(raw.handle || "")}`,
      last_updated: raw.last_updated || new Date().toISOString(),
    };
  }

  const userInfo = raw || {};
  const handle = userInfo.handle || "";
  const rating = userInfo.rating || 0;
  const maxRating = userInfo.maxRating || rating;
  const rankRaw = userInfo.rank ? String(userInfo.rank) : "Unrated";
  const formattedRank = rankRaw.charAt(0).toUpperCase() + rankRaw.slice(1);
  const maxRankRaw = userInfo.maxRank ? String(userInfo.maxRank) : rankRaw;
  const formattedMaxRank = maxRankRaw.charAt(0).toUpperCase() + maxRankRaw.slice(1);

  const fullName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ");
  let avatar = userInfo.avatar || userInfo.titlePhoto || null;
  if (avatar && typeof avatar === "string" && avatar.startsWith("//")) {
    avatar = `https:${avatar}`;
  }
  let titlePhoto = userInfo.titlePhoto || null;
  if (titlePhoto && typeof titlePhoto === "string" && titlePhoto.startsWith("//")) {
    titlePhoto = `https:${titlePhoto}`;
  }
  const country = userInfo.country || null;
  const city = userInfo.city || null;
  const organization = userInfo.organization || null;
  const contribution = typeof userInfo.contribution === "number" ? userInfo.contribution : null;
  const friendOfCount = typeof userInfo.friendOfCount === "number" ? userInfo.friendOfCount : null;

  let registrationDate: string | null = null;
  if (userInfo.registrationTimeSeconds) {
    try {
      registrationDate = new Date(userInfo.registrationTimeSeconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { }
  }

  // Parse Submissions & Difficulty Breakdown
  const solvedSet = new Set<string>();
  const difficultyBreakdown: Record<string, number> = {
    "800-1000": 0,
    "1100-1300": 0,
    "1400-1600": 0,
    "1700-1900": 0,
    "2000+": 0,
  };
  const verdictMap = { ok: 0, wrongAnswer: 0, timeLimitExceeded: 0, other: 0 };
  const tagCountMap: Record<string, number> = {};
  const languagesMap: Record<string, number> = {};

  if (Array.isArray(statusResult)) {
    statusResult.forEach((sub: any) => {
      const v = sub.verdict;
      if (v === "OK") verdictMap.ok++;
      else if (v === "WRONG_ANSWER") verdictMap.wrongAnswer++;
      else if (v === "TIME_LIMIT_EXCEEDED") verdictMap.timeLimitExceeded++;
      else verdictMap.other++;

      if (v === "OK" && sub.problem) {
        const problemId = sub.problem.contestId
          ? `${sub.problem.contestId}-${sub.problem.index}`
          : sub.problem.name;

        if (!solvedSet.has(problemId)) {
          solvedSet.add(problemId);

          const r = sub.problem.rating;
          if (typeof r === "number") {
            if (r <= 1000) difficultyBreakdown["800-1000"]++;
            else if (r <= 1300) difficultyBreakdown["1100-1300"]++;
            else if (r <= 1600) difficultyBreakdown["1400-1600"]++;
            else if (r <= 1900) difficultyBreakdown["1700-1900"]++;
            else difficultyBreakdown["2000+"]++;
          }

          if (Array.isArray(sub.problem.tags)) {
            sub.problem.tags.forEach((tag: string) => {
              tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
            });
          }
        }
      }

      if (sub.programmingLanguage) {
        const l = sub.programmingLanguage.trim();
        languagesMap[l] = (languagesMap[l] || 0) + 1;
      }
    });
  }

  const totalSolved = solvedSet.size;
  const topTags = Object.entries(tagCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const languages = Object.entries(languagesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, count]) => ({ language, count }));

  const acceptanceRate = statusResult.length > 0
    ? Math.round((verdictMap.ok / statusResult.length) * 100)
    : null;

  // Parse Contest Rating History
  let contestsAttended = 0;
  let bestRank: number | null = null;
  let maxRatingGain: number | null = null;
  const recentContests: CodeforcesContestHistoryItem[] = [];

  if (Array.isArray(ratingResult) && ratingResult.length > 0) {
    contestsAttended = ratingResult.length;
    let minRank = Infinity;
    let maxGain = -Infinity;

    ratingResult.forEach((c: any) => {
      if (typeof c.rank === "number" && c.rank > 0 && c.rank < minRank) {
        minRank = c.rank;
      }
      if (typeof c.oldRating === "number" && typeof c.newRating === "number") {
        const gain = c.newRating - c.oldRating;
        if (gain > maxGain) maxGain = gain;
      }

      let dateStr = "";
      if (c.ratingUpdateTimeSeconds) {
        try {
          dateStr = new Date(c.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        } catch { }
      }

      recentContests.push({
        contestId: c.contestId,
        contestName: c.contestName || `Codeforces Round #${c.contestId}`,
        rank: c.rank,
        oldRating: c.oldRating,
        newRating: c.newRating,
        ratingChange: (c.newRating || 0) - (c.oldRating || 0),
        date: dateStr,
        ratingUpdateTimeSeconds: c.ratingUpdateTimeSeconds,
      });
    });

    if (minRank !== Infinity) bestRank = minRank;
    if (maxGain !== -Infinity && maxGain > 0) maxRatingGain = maxGain;
  }

  // Badges
  const badges: CodeforcesBadge[] = [
    { name: `${formattedRank} Division`, category: "Rank Title", description: `Achieved ${formattedRank} competitive status` },
  ];
  if (maxRating >= 2400) {
    badges.push({ name: "Grandmaster", category: "Tier", description: "Reached 2400+ Grandmaster rating on Codeforces" });
  } else if (maxRating >= 2100) {
    badges.push({ name: "Master", category: "Tier", description: "Reached 2100+ Master rating on Codeforces" });
  } else if (maxRating >= 1900) {
    badges.push({ name: "Candidate Master", category: "Tier", description: "Reached 1900+ Candidate Master rating" });
  } else if (maxRating >= 1600) {
    badges.push({ name: "Expert Peak", category: "Tier", description: "Reached 1600+ Expert division rating" });
  } else if (maxRating >= 1400) {
    badges.push({ name: "Specialist", category: "Tier", description: "Reached 1400+ Specialist rating" });
  } else if (maxRating >= 1200) {
    badges.push({ name: "Pupil Solver", category: "Tier", description: "Active rated Pupil solver" });
  }

  if (bestRank && bestRank <= 1000) {
    badges.push({ name: "Top 1000 Standing", category: "Standing", description: `Achieved global Rank #${bestRank} in a rated contest` });
  }
  if (maxRatingGain && maxRatingGain >= 150) {
    badges.push({ name: "Rating Surge", category: "Growth", description: `Single round increase of +${maxRatingGain} rating points` });
  }
  if (totalSolved >= 100) {
    badges.push({ name: "Problem Master", category: "Problem Solving", description: "Solved 100+ unique competitive programming problems" });
  } else if (totalSolved >= 20) {
    badges.push({ name: "Algorithm Solver", category: "Problem Solving", description: `Solved ${totalSolved} unique problems on Codeforces` });
  }
  if (contestsAttended >= 10) {
    badges.push({ name: "Contest Veteran", category: "Contests", description: "Participated in 10+ rated Codeforces rounds" });
  } else if (contestsAttended >= 5) {
    badges.push({ name: "Rated Competitor", category: "Contests", description: `Participated in ${contestsAttended} rated Codeforces rounds` });
  }

  return {
    handle,
    name: fullName || null,
    firstName: userInfo.firstName || null,
    lastName: userInfo.lastName || null,
    avatar,
    titlePhoto: userInfo.titlePhoto || null,
    country,
    city,
    organization,
    rating,
    maxRating,
    rank: formattedRank,
    maxRank: formattedMaxRank,
    contribution,
    friendOfCount,
    registrationDate,
    totalSolved,
    totalSubmissions: statusResult.length,
    acceptanceRate,
    problemDifficultyBreakdown: difficultyBreakdown,
    verdictBreakdown: verdictMap,
    topTags,
    languages,
    contestsAttended,
    bestRank,
    maxRatingGain,
    recentContests,
    badges,
    profile_url: `https://codeforces.com/profile/${encodeURIComponent(handle)}`,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetches Codeforces statistics using Supabase Edge Function with resilient direct fallback.
 */
export async function fetchCodeforcesStats(handleInput: string): Promise<{
  data: CodeforcesStats | null;
  error: string | null;
}> {
  const handle = extractUsername(handleInput);
  if (!handle) {
    return { data: null, error: "Codeforces handle is required" };
  }

  // 1. Tier 0: Supabase Edge Function `fetch-codeforces`
  try {
    const edgeRes = await supabase.functions.invoke("fetch-codeforces", {
      body: { handle },
    });

    if (!edgeRes.error && edgeRes.data?.data) {
      const stats = normalizeCodeforcesStats(edgeRes.data.data);
      return { data: stats, error: null };
    }
  } catch (edgeErr) {
    console.warn("[CodingProfileService] fetch-codeforces Edge Function fallback:", edgeErr);
  }

  // 2. Direct API Fallback
  try {
    const timestamp = Date.now();
    const [infoRes, statusRes, ratingRes] = await Promise.allSettled([
      fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}&_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }),
      fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(10000) }),
      fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}&_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }),
    ]);

    let userInfo: any = null;
    let statusResult: any[] = [];
    let ratingResult: any[] = [];

    if (infoRes.status === "fulfilled" && infoRes.value.ok) {
      const infoJson = await infoRes.value.json();
      if (infoJson.status === "OK" && Array.isArray(infoJson.result) && infoJson.result.length > 0) {
        userInfo = infoJson.result[0];
      }
    }

    if (!userInfo) {
      throw new Error(`Codeforces handle "${handle}" not found`);
    }

    if (statusRes.status === "fulfilled" && statusRes.value.ok) {
      const statusJson = await statusRes.value.json();
      if (statusJson.status === "OK" && Array.isArray(statusJson.result)) {
        statusResult = statusJson.result;
      }
    }

    if (ratingRes.status === "fulfilled" && ratingRes.value.ok) {
      const ratingJson = await ratingRes.value.json();
      if (ratingJson.status === "OK" && Array.isArray(ratingJson.result)) {
        ratingResult = ratingJson.result;
      }
    }

    return {
      data: normalizeCodeforcesStats(userInfo, statusResult, ratingResult),
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: `Failed to fetch Codeforces handle "${handle}".`,
    };
  }
}

export function calculateGitHubStreak(events?: GitHubActivityEvent[]): { currentStreak: number; longestStreak: number } {
  if (!events || events.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const activeDates = new Set<string>();
  events.forEach((evt) => {
    if (evt.createdAt) {
      const d = new Date(evt.createdAt).toISOString().split("T")[0];
      activeDates.add(d);
    }
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  let checkDate = new Date();

  if (activeDates.has(todayStr)) {
    checkDate = new Date();
  } else if (activeDates.has(yesterdayStr)) {
    checkDate = new Date(Date.now() - 86400000);
  } else {
    currentStreak = 0;
  }

  if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (activeDates.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const longestStreak = Math.max(currentStreak, activeDates.size);
  return { currentStreak, longestStreak };
}

/**
 * Fetches comprehensive GitHub statistics using official GitHub REST API endpoints.
 */
export async function fetchGitHubStats(
  usernameInput: string,
  userTokenInput?: string | null
): Promise<{
  data: GitHubStats | null;
  error: string | null;
}> {
  let username = extractUsername(usernameInput);

  try {
    // 1. Prepare Authorization Headers (User PAT Token > VITE_GITHUB_TOKEN > Unauthenticated)
    const ghToken = userTokenInput?.trim() || import.meta.env.VITE_GITHUB_TOKEN;
    const ghHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (ghToken) {
      ghHeaders.Authorization = `Bearer ${ghToken}`;
    }

    // Auto-discover username from authenticated user token if usernameInput is blank
    if (!username && userTokenInput?.trim()) {
      try {
        const userRes = await fetch("https://api.github.com/user", {
          headers: ghHeaders,
          signal: AbortSignal.timeout(6000),
        });
        if (userRes.ok) {
          const uData = await userRes.json();
          if (uData && uData.login) {
            username = uData.login;
          }
        }
      } catch (err) {
        console.warn("Could not auto-resolve username from token:", err);
      }
    }

    if (!username) {
      return { data: null, error: "GitHub token or username is required." };
    }

    // Primary profile request
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: ghHeaders,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: `GitHub user "${username}" not found.` };
      }
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const userData = await res.json();

    // 2. Secondary requests in parallel (repos, orgs, events, contribution heatmap)
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let totalOpenIssues = 0;
    let topLanguages: GitHubLanguageShare[] = [];
    let topRepos: GitHubRepoItem[] = [];
    let organizations: GitHubOrg[] = [];
    let recentEvents: GitHubActivityEvent[] = [];
    let recentCommitsCount = 0;
    let recentPrsCount = 0;
    let recentIssuesCount = 0;
    let contributionData: ContributionDay[] = [];

    // Fetch up to 3 pages of events for heatmap (300 total events ≈ 90 days coverage)
    const eventPages = [1, 2, 3].map((page) =>
      fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
        { headers: ghHeaders, signal: AbortSignal.timeout(8000) }
      ).catch(() => null)
    );

    const [reposResult, orgsResult, eventsResult, ...heatmapEventResults] = await Promise.allSettled([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, {
        headers: ghHeaders,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/orgs`, {
        headers: ghHeaders,
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`, {
        headers: ghHeaders,
        signal: AbortSignal.timeout(6000),
      }),
      ...eventPages,
    ]);

    // Parse Repositories
    if (reposResult.status === "fulfilled" && reposResult.value.ok) {
      try {
        const reposData: any[] = await reposResult.value.json();
        if (Array.isArray(reposData)) {
          const langMap: Record<string, number> = {};

          reposData.forEach((repo) => {
            if (!repo.fork) {
              totalStars += repo.stargazers_count || 0;
              totalForks += repo.forks_count || 0;
              totalWatchers += repo.watchers_count || 0;
              totalOpenIssues += repo.open_issues_count || 0;
            }
            if (repo.language) {
              langMap[repo.language] = (langMap[repo.language] || 0) + 1;
            }
          });

          const totalLangCount = Object.values(langMap).reduce((a, b) => a + b, 0);
          if (totalLangCount > 0) {
            topLanguages = Object.entries(langMap)
              .map(([lang, count]) => ({
                language: lang,
                count,
                percentage: Math.round((count / totalLangCount) * 100),
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 6);
          }

          topRepos = reposData
            .filter((r) => !r.fork)
            .sort(
              (a, b) =>
                (b.stargazers_count || 0) - (a.stargazers_count || 0) ||
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 6)
            .map((r) => ({
              name: r.name,
              description: r.description || null,
              language: r.language || null,
              stars: r.stargazers_count || 0,
              forks: r.forks_count || 0,
              watchers: r.watchers_count || 0,
              openIssues: r.open_issues_count || 0,
              url: r.html_url,
              updatedAt: r.updated_at,
              isFork: r.fork,
            }));
        }
      } catch (err) {
        console.warn("Failed to parse repos:", err);
      }
    }

    // Parse Organizations
    if (orgsResult.status === "fulfilled" && orgsResult.value.ok) {
      try {
        const orgsData: any[] = await orgsResult.value.json();
        if (Array.isArray(orgsData)) {
          organizations = orgsData.slice(0, 6).map((org) => ({
            login: org.login,
            avatarUrl: org.avatar_url,
            description: org.description || null,
            url: `https://github.com/${org.login}`,
          }));
        }
      } catch (err) {
        console.warn("Failed to parse orgs:", err);
      }
    }

    // Parse Events & Activities
    if (eventsResult.status === "fulfilled" && eventsResult.value.ok) {
      try {
        const eventsData: any[] = await eventsResult.value.json();
        if (Array.isArray(eventsData)) {
          recentEvents = eventsData.slice(0, 8).map((evt) => {
            let message = "";
            if (evt.type === "PushEvent") {
              recentCommitsCount += evt.payload?.commits?.length || 1;
              message = evt.payload?.commits?.[0]?.message || "Pushed new commits";
            } else if (evt.type === "PullRequestEvent") {
              recentPrsCount++;
              message = `${evt.payload?.action || "opened"} a pull request`;
            } else if (evt.type === "IssuesEvent") {
              recentIssuesCount++;
              message = `${evt.payload?.action || "opened"} an issue`;
            } else if (evt.type === "CreateEvent") {
              message = `Created ${evt.payload?.ref_type || "repository"} ${evt.payload?.ref || ""}`;
            } else if (evt.type === "WatchEvent") {
              message = "Starred a repository";
            } else {
              message = `Activity in ${evt.repo?.name}`;
            }

            return {
              id: evt.id,
              type: evt.type,
              repoName: evt.repo?.name || "Repository",
              repoUrl: `https://github.com/${evt.repo?.name}`,
              action: evt.payload?.action,
              message,
              createdAt: evt.created_at,
            };
          });
        }
      } catch (err) {
        console.warn("Failed to parse events:", err);
      }
    }

    // Build contribution heatmap:
    // Strategy 1 (token present): GitHub GraphQL contributionCalendar — full history for ALL years
    // Strategy 2 (fallback):      Events API — last ~300 events, ~90 days only
    if (ghToken) {
      try {
        const accountCreatedYear = userData.created_at
          ? new Date(userData.created_at).getFullYear()
          : new Date().getFullYear();
        const currentYear = new Date().getFullYear();

        // Build one GraphQL query that fetches every year from account creation → now
        // Each year is a separate contributionsCollection alias
        const yearAliases = [];
        for (let y = accountCreatedYear; y <= currentYear; y++) {
          const from = `${y}-01-01T00:00:00Z`;
          const to = y === currentYear
            ? new Date().toISOString()
            : `${y}-12-31T23:59:59Z`;
          yearAliases.push(`
            y${y}: contributionsCollection(from: "${from}", to: "${to}") {
              contributionCalendar {
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          `);
        }

        const graphqlQuery = `
          query {
            user(login: ${JSON.stringify(username)}) {
              ${yearAliases.join("\n")}
            }
          }
        `;

        const gqlRes = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            ...ghHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: graphqlQuery }),
          signal: AbortSignal.timeout(12000),
        });

        if (gqlRes.ok) {
          const gqlData = await gqlRes.json();
          const user = gqlData?.data?.user;
          if (user && !gqlData.errors) {
            const dayCountMap = new Map<string, number>();

            // Flatten all years' contribution days into a single map
            for (let y = accountCreatedYear; y <= currentYear; y++) {
              const collection = user[`y${y}`];
              const weeks = collection?.contributionCalendar?.weeks ?? [];
              for (const week of weeks) {
                for (const day of week.contributionDays ?? []) {
                  if (day.date && typeof day.contributionCount === "number") {
                    dayCountMap.set(day.date, day.contributionCount);
                  }
                }
              }
            }

            contributionData = Array.from(dayCountMap.entries())
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date));
          }
        }
      } catch (gqlErr) {
        console.warn("GitHub GraphQL contribution fetch failed, falling back to events API:", gqlErr);
      }
    }

    // Fallback: build heatmap from events pages if GraphQL didn't populate data
    if (contributionData.length === 0) {
      const dayCountMap = new Map<string, number>();
      // Pre-fill last 365 days with 0
      const today = new Date();
      for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dayCountMap.set(d.toISOString().split("T")[0], 0);
      }

      // Count events per day across all pages
      for (const pageResult of heatmapEventResults) {
        if (pageResult.status !== "fulfilled" || !pageResult.value) continue;
        try {
          const resp = pageResult.value as Response;
          if (!resp.ok) continue;
          const pageEvents: any[] = await resp.json();
          if (!Array.isArray(pageEvents)) continue;
          pageEvents.forEach((evt) => {
            if (!evt.created_at) return;
            const dateKey = evt.created_at.split("T")[0];
            if (dayCountMap.has(dateKey)) {
              let weight = 1;
              if (evt.type === "PushEvent") {
                weight = Math.max(1, evt.payload?.commits?.length || 1);
              }
              dayCountMap.set(dateKey, (dayCountMap.get(dateKey) || 0) + weight);
            }
          });
        } catch {
          // silently ignore parse errors for individual pages
        }
      }

      contributionData = Array.from(dayCountMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const streak = calculateGitHubStreak(recentEvents);

    // Dynamic Achievements Calculation
    const achievements: GitHubAchievement[] = [];
    if (totalStars > 0) {
      achievements.push({
        id: "stars",
        title: "Star Collector",
        description: `Earned ${totalStars} stars across public projects`,
        icon: "star",
        color: "amber",
      });
    }
    if (topLanguages.length >= 3) {
      achievements.push({
        id: "polyglot",
        title: "Polyglot Developer",
        description: `Active in ${topLanguages.length} different programming languages`,
        icon: "code",
        color: "purple",
      });
    }
    if ((userData.public_repos ?? 0) >= 10) {
      achievements.push({
        id: "creator",
        title: "Open Source Creator",
        description: `Authored ${userData.public_repos} public repositories`,
        icon: "git",
        color: "emerald",
      });
    }
    if ((userData.followers ?? 0) >= 10) {
      achievements.push({
        id: "community",
        title: "Community Figure",
        description: `Followed by ${userData.followers} developers on GitHub`,
        icon: "users",
        color: "blue",
      });
    }
    if (userData.hireable) {
      achievements.push({
        id: "hireable",
        title: "Available for Hire",
        description: "Open to employment & freelance opportunities",
        icon: "briefcase",
        color: "teal",
      });
    }
    if (organizations.length > 0) {
      achievements.push({
        id: "org_member",
        title: "Org Contributor",
        description: `Member of ${organizations.length} public organization${organizations.length > 1 ? "s" : ""}`,
        icon: "building",
        color: "rose",
      });
    }

    return {
      data: {
        username: userData.login || username,
        name: userData.name || userData.login || username,
        avatarUrl: userData.avatar_url,
        bio: userData.bio || null,
        company: userData.company || null,
        location: userData.location || null,
        blog: userData.blog || null,
        email: userData.email || null,
        twitterUsername: userData.twitter_username || null,
        hireable: userData.hireable ?? null,
        publicRepos: userData.public_repos ?? 0,
        publicGists: userData.public_gists ?? 0,
        followers: userData.followers ?? 0,
        following: userData.following ?? 0,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        htmlUrl: userData.html_url || `https://github.com/${username}`,
        totalStars,
        totalForks,
        totalWatchers,
        totalOpenIssues,
        topLanguages,
        topRepos,
        organizations,
        recentEvents,
        recentCommitsCount,
        recentPrsCount,
        recentIssuesCount,
        streak,
        achievements,
        contributionData,
        lastFetchedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (err: any) {
    console.warn("Primary GitHub API fetch failed or rate limited, attempting UNGH fallback...", err?.message);
  }

  // 3. Fallback: Use UNGH open API (zero rate limits, high availability)
  try {
    const unghUserRes = await fetch(`https://ungh.cc/users/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (unghUserRes.ok) {
      const unghJson = await unghUserRes.json();
      if (unghJson && unghJson.user) {
        const u = unghJson.user;
        let totalStars = 0;
        let totalForks = 0;
        let topLanguages: GitHubLanguageShare[] = [];
        let topRepos: GitHubRepoItem[] = [];

        try {
          const unghReposRes = await fetch(`https://ungh.cc/users/${encodeURIComponent(username)}/repos`, {
            signal: AbortSignal.timeout(6000),
          });
          if (unghReposRes.ok) {
            const reposJson = await unghReposRes.json();
            if (reposJson && Array.isArray(reposJson.repos)) {
              const langMap: Record<string, number> = {};
              reposJson.repos.forEach((r: any) => {
                totalStars += r.stars || 0;
                totalForks += r.forks || 0;
                if (r.language) {
                  langMap[r.language] = (langMap[r.language] || 0) + 1;
                }
              });

              const totalLangCount = Object.values(langMap).reduce((a, b) => a + b, 0);
              if (totalLangCount > 0) {
                topLanguages = Object.entries(langMap)
                  .map(([lang, count]) => ({
                    language: lang,
                    count,
                    percentage: Math.round((count / totalLangCount) * 100),
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6);
              }

              topRepos = reposJson.repos
                .sort((a: any, b: any) => (b.stars || 0) - (a.stars || 0))
                .slice(0, 6)
                .map((r: any) => ({
                  name: r.name,
                  description: r.description || null,
                  language: r.language || null,
                  stars: r.stars || 0,
                  forks: r.forks || 0,
                  watchers: r.stars || 0,
                  openIssues: 0,
                  url: `https://github.com/${username}/${r.name}`,
                  updatedAt: new Date().toISOString(),
                  isFork: false,
                }));
            }
          }
        } catch (unghReposErr) {
          console.warn("UNGH repos fetch failed:", unghReposErr);
        }

        return {
          data: {
            username: u.username || username,
            name: u.name || u.username || username,
            avatarUrl: u.avatar || `https://github.com/${username}.png`,
            bio: u.bio || null,
            company: u.company || null,
            location: u.location || null,
            blog: u.blog || null,
            email: u.email || null,
            twitterUsername: u.twitter || null,
            hireable: null,
            publicRepos: u.publicRepos ?? 0,
            publicGists: u.publicGists ?? 0,
            followers: u.followers ?? 0,
            following: u.following ?? 0,
            createdAt: u.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            htmlUrl: `https://github.com/${username}`,
            totalStars,
            totalForks,
            totalWatchers: totalStars,
            totalOpenIssues: 0,
            topLanguages,
            topRepos,
            organizations: [],
            recentEvents: [],
            recentCommitsCount: 0,
            recentPrsCount: 0,
            recentIssuesCount: 0,
            streak: { currentStreak: 1, longestStreak: 1 },
            achievements: [],
            lastFetchedAt: new Date().toISOString(),
          },
          error: null,
        };
      }
    }
  } catch (unghErr: any) {
    console.warn("UNGH API fallback failed:", unghErr?.message);
  }

  return {
    data: null,
    error: `Could not fetch GitHub profile for "${username}".`,
  };
}

/**
 * Searches GitHub users across the web using GitHub's User Search REST API.
 * Supports pagination via the `page` parameter (1-indexed, 16 results per page).
 */
export async function searchGitHubUsers(
  query: string,
  userTokenInput?: string | null,
  page: number = 1
): Promise<{
  items: GitHubSearchResultItem[];
  totalCount: number;
  error: string | null;
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [], totalCount: 0, error: null };
  }

  try {
    const ghToken = userTokenInput?.trim() || import.meta.env.VITE_GITHUB_TOKEN;
    const ghHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (ghToken) {
      ghHeaders.Authorization = `Bearer ${ghToken}`;
    }

    const res = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(trimmed)}&per_page=16&page=${page}`,
      {
        headers: ghHeaders,
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        return {
          items: [],
          totalCount: 0,
          error: "GitHub API rate limit reached. Add a free GitHub token in settings to expand your limit to 5,000 req/hr.",
        };
      }
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const data = await res.json();
    const items: GitHubSearchResultItem[] = Array.isArray(data.items)
      ? data.items.map((item: any) => ({
        login: item.login,
        avatarUrl: item.avatar_url,
        htmlUrl: item.html_url,
        type: item.type || "User",
        score: item.score,
      }))
      : [];

    return {
      items,
      totalCount: data.total_count || items.length,
      error: null,
    };
  } catch (err: any) {
    console.warn("GitHub user search error:", err);
    return {
      items: [],
      totalCount: 0,
      error: err?.message || "Failed to search GitHub profiles across the web.",
    };
  }
}

/**
 * Normalizes and enriches raw CodeChef data into a full CodeChefStats object.
 */
function normalizeCodeChefStats(raw: any, username: string): CodeChefStats {
  const rating =
    typeof raw.rating_number === "number"
      ? raw.rating_number
      : typeof raw.currentRating === "number"
        ? raw.currentRating
        : typeof raw.rating === "number"
          ? raw.rating
          : parseInt(String(raw.rating_number || raw.currentRating || raw.rating || 0).replace(/[^0-9]/g, "")) || 0;

  const maxRating =
    typeof raw.max_rank === "number"
      ? raw.max_rank
      : typeof raw.highestRating === "number"
        ? raw.highestRating
        : typeof raw.maxRating === "number"
          ? raw.maxRating
          : parseInt(String(raw.max_rank || raw.highestRating || raw.maxRating || 0).replace(/[^0-9]/g, "")) || rating;

  // Stars calculation
  let stars = raw.stars ? String(raw.stars) : (typeof raw.rating === "string" && raw.rating.includes("★") ? raw.rating : "");
  if (!stars || stars === "undefined" || stars === "null") {
    if (rating >= 2500) stars = "7★";
    else if (rating >= 2200) stars = "6★";
    else if (rating >= 2000) stars = "5★";
    else if (rating >= 1800) stars = "4★";
    else if (rating >= 1600) stars = "3★";
    else if (rating >= 1400) stars = "2★";
    else if (rating > 0) stars = "1★";
    else stars = "1★";
  } else if (!stars.includes("★")) {
    stars = `${stars.replace(/&#9733;|\*/g, "")}★`;
  }

  // Division calculation
  let division = raw.division || raw.div || null;
  if (!division) {
    if (rating >= 2000) division = "Div 1";
    else if (rating >= 1600) division = "Div 2";
    else if (rating >= 1400) division = "Div 3";
    else if (rating > 0) division = "Div 4";
    else division = "Unrated";
  }

  const parseRank = (val: any): number | null => {
    if (!val) return null;
    const cleaned = String(val).replace(/,/g, "").trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  };

  const globalRank = parseRank(raw.globalRank || raw.global_rank);
  const countryRank = parseRank(raw.countryRank || raw.country_rank);

  // Total Solved, Fully Solved, Partially Solved
  let totalSolved = parseInt(String(raw.numberOfProblemsSolved || raw.totalSolved || raw.solvedCount || raw.problemsSolved || 0)) || 0;
  const fullySolved = typeof raw.fullySolved === "number" ? raw.fullySolved : (typeof raw.numberOfProblemsSolved === "number" ? raw.numberOfProblemsSolved : totalSolved);
  const partiallySolved = typeof raw.partiallySolved === "number" ? raw.partiallySolved : Math.max(0, totalSolved - fullySolved);

  // Real DSA Rating (Accurately retrieved from DSA tracks or active CP rating)
  const dsaRatingNum = parseInt(String(raw.dsaRating || raw.dsa_rating || raw.dsaRatingNum || raw.dsa_monday_rating || 0)) || 0;
  const dsaRating = dsaRatingNum > 0 ? dsaRatingNum : (rating > 0 ? rating : null);

  // Real Contests Participated (Exact count only, directly from APIs or HTML scraper)
  let contestsParticipated = typeof raw.contestsParticipated === "number"
    ? raw.contestsParticipated
    : typeof raw.participation === "number"
      ? raw.participation
      : typeof raw.contestsAttended === "number"
        ? raw.contestsAttended
        : typeof raw.contestCount === "number"
          ? raw.contestCount
          : (Array.isArray(raw.recentContests) && raw.recentContests.length > 0
            ? raw.recentContests.length
            : (Array.isArray(raw.all_rating) && raw.all_rating.length > 0
              ? raw.all_rating.length
              : (Array.isArray(raw.contests) && raw.contests.length > 0
                ? raw.contests.length
                : (raw.contestsParticipated !== undefined && raw.contestsParticipated !== null && String(raw.contestsParticipated).trim() !== ""
                  ? parseInt(String(raw.contestsParticipated), 10) || 0
                  : (raw.participation !== undefined && raw.participation !== null && String(raw.participation).trim() !== ""
                    ? parseInt(String(raw.participation), 10) || 0
                    : 0)))));

  if (isNaN(contestsParticipated) || contestsParticipated < 0) {
    contestsParticipated = 0;
  }

  // Real Badges - only actual badges earned
  let badges: CodeChefBadge[] = [];
  if (Array.isArray(raw.badges) && raw.badges.length > 0) {
    badges = raw.badges.map((b: any) =>
      typeof b === "string"
        ? { name: b, category: "Profile Badge" }
        : {
          name: b.name || b.title || "Badge",
          description: b.description || b.desc || undefined,
          category: b.category || b.type || "Profile Badge",
          icon: b.icon || b.imageUrl || undefined,
        }
    );
  }

  let rawName = raw.name || raw.displayName || raw.user_name || (raw.username && raw.username.toLowerCase() !== username.toLowerCase() ? raw.username : null);
  if (rawName && (rawName.includes("Learn ") || rawName.includes("%") || rawName.toLowerCase() === username.toLowerCase())) {
    rawName = null;
  }

  const avatar = raw.profile || raw.avatar || raw.profile_image || raw.userPicture || null;
  const countryName = raw.countryName || raw.country || null;
  const countryFlag = raw.countryFlag || raw.flag || null;
  const institution = raw.institution || raw.organization || raw.college || null;
  const studentOrProfessional = raw.studentOrProfessional || raw.user_type || raw.userType || null;

  return {
    username: username,
    name: rawName,
    avatar: avatar,
    countryName: countryName,
    countryFlag: countryFlag,
    institution: institution,
    studentOrProfessional: studentOrProfessional,
    rating: rating,
    maxRating: maxRating,
    stars: stars,
    division: division,
    globalRank: globalRank,
    countryRank: countryRank,
    dsaRating: dsaRating,
    totalSolved: totalSolved,
    fullySolved: fullySolved,
    partiallySolved: partiallySolved,
    problemDifficultyBreakdown: raw.problemDifficultyBreakdown || raw.difficultyBreakdown || null,
    contestsParticipated: contestsParticipated,
    badges: badges,
    recentContests: raw.recentContests || raw.contestHistory || [],
    last_updated: raw.last_updated || new Date().toISOString(),
  };
}

/**
 * Parses raw HTML string from CodeChef profile page into CodeChefStats data object.
 */
function parseCodeChefHtml(html: string, username: string): CodeChefStats | null {
  if (!html || html.length < 100) return null;

  const parseNum = (val: any): number => {
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, "").trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  let rating = 0;
  let maxRating = 0;
  let stars = "";
  let division = "";
  let globalRank: number | null = null;
  let countryRank: number | null = null;
  let dsaRating: number | null = null;
  let contestsParticipated = 0;
  let totalSolved = 0;
  let fullySolved = 0;
  let partiallySolved = 0;
  let name: string | null = null;
  let avatar: string | null = null;
  let countryName: string | null = null;
  let countryFlag: string | null = null;
  let institution: string | null = null;
  let studentOrProfessional: string | null = null;
  const badges: CodeChefBadge[] = [];
  const recentContests: any[] = [];

  // 1. Deep Extraction from var all_rating array
  const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);\s*(?:var|\n|\r|<)/i) ||
                         html.match(/all_rating\s*=\s*(\[[\s\S]*?\]);/i);
  if (allRatingMatch) {
    try {
      const parsedArray = JSON.parse(allRatingMatch[1]);
      if (Array.isArray(parsedArray)) {
        const validContests = parsedArray.filter((c: any) => c.code !== "RATING_SHIFT_TO_ELO_RATING_CODE");
        contestsParticipated = validContests.length;
        if (validContests.length > 0) {
          const lastContest = validContests[validContests.length - 1];
          if (lastContest?.rating) {
            rating = parseNum(lastContest.rating);
          }
          validContests.forEach((c: any) => {
            const r = parseNum(c.rating);
            if (r > maxRating) maxRating = r;
            if (c.name || c.code) {
              recentContests.push({
                name: c.name || c.code || "CodeChef Contest",
                code: c.code,
                rating: r,
                rank: parseNum(c.rank) || undefined,
                date: c.end_date ? c.end_date.split(" ")[0] : `${c.getyear}-${String(c.getmonth).padStart(2, "0")}-${String(c.getday).padStart(2, "0")}`,
              });
            }
          });
        }
      }
    } catch { }
  }

  // 2. Deep Extraction from Drupal.settings.date_versus_rating
  if (contestsParticipated === 0) {
    try {
      const drupalMatch = html.match(/Drupal\.settings\s*,\s*(\{[\s\S]*?\})\s*\);/i) || html.match(/date_versus_rating\s*:\s*(\{[\s\S]*?\})\s*,\s*["']user_initial_ratings/i);
      if (drupalMatch) {
        const parsedSettings = JSON.parse(drupalMatch[1]);
        const dateVsRating = parsedSettings.date_versus_rating || parsedSettings;
        const allContests = dateVsRating?.all;
        if (Array.isArray(allContests) && allContests.length > 0) {
          const validContests = allContests.filter((c: any) => c.code !== "RATING_SHIFT_TO_ELO_RATING_CODE");
          contestsParticipated = validContests.length;
          if (validContests.length > 0) {
            const lastContest = validContests[validContests.length - 1];
            if (lastContest?.rating) {
              rating = parseNum(lastContest.rating);
            }
          }
          allContests.forEach((c: any) => {
            const r = parseNum(c.rating);
            if (r > maxRating) maxRating = r;
            if (c.name || c.code) {
              recentContests.push({
                name: c.name || c.code || "CodeChef Contest",
                code: c.code,
                rating: r,
                rank: parseNum(c.rank) || undefined,
                date: c.end_date ? c.end_date.split(" ")[0] : `${c.getyear}-${String(c.getmonth).padStart(2, "0")}-${String(c.getday).padStart(2, "0")}`,
              });
            }
          });
        }

        const dsaContests = dateVsRating?.dsa_monday || dateVsRating?.dsa_learning_series;
        if (Array.isArray(dsaContests) && dsaContests.length > 0) {
          const lastDsa = dsaContests[dsaContests.length - 1];
          if (lastDsa?.rating) {
            dsaRating = parseNum(lastDsa.rating);
          }
        }
      }
    } catch { }
  }

  // 3. Fallback DOM Contest Count extraction
  if (contestsParticipated === 0) {
    const contestCountMatch =
      html.match(/class="contest-participated-count"[^>]*>[\s\S]*?<b>\s*(\d+)\s*<\/b>/i) ||
      html.match(/No\.\s*of\s*Contests\s*Participated:\s*<b>\s*(\d+)\s*<\/b>/i) ||
      html.match(/<h3>\s*Contests\s*\(\s*(\d+)\s*\)\s*<\/h3>/i) ||
      html.match(/Contests?\s*Attended\s*:\s*(\d+)/i) ||
      html.match(/class="[^"]*contest-count[^"]*"[^>]*>\s*(\d+)/i);
    if (contestCountMatch) contestsParticipated = parseNum(contestCountMatch[1]);
  }

  // 4. Rating & Highest Rating
  if (rating === 0) {
    const ratingMatch = html.match(/id="rating-block-all"[\s\S]*?class="rating-number"[^>]*>\s*(\d+)/i) ||
                        html.match(/class="rating-number"[^>]*>\s*(\d+)/i) ||
                        html.match(/rating-header[^>]*>[\s\S]*?(\d{3,4})/i) ||
                        html.match(/current-rating[^>]*>(\d+)/i);
    if (ratingMatch) rating = parseNum(ratingMatch[1]);
  }

  const maxRatingMatch = html.match(/\(Highest Rating\s*(\d+)\)/i) || html.match(/highest-rating[^>]*>(\d+)/i);
  if (maxRatingMatch) maxRating = parseNum(maxRatingMatch[1]);
  if (maxRating === 0 && rating > 0) maxRating = rating;

  // 5. Stars & Division
  const starsMatch = html.match(/<span[^>]*class=['"]rating['"][^>]*>(\d+)(?:&#9733;|★)<\/span>/i) || html.match(/(\d+)&#9733;/i) || html.match(/(\d+★|\d+\s*stars?)/i);
  if (starsMatch) {
    stars = `${starsMatch[1].replace(/[^0-9]/g, "")}★`;
  }

  const divMatch = html.match(/\((Div\s*\d)\)/i) || html.match(/class="user-league-container"[\s\S]*?tooltip">([^<]+)/i);
  if (divMatch) division = divMatch[1].trim();

  // 6. Rating ranks (Exact DOM matching)
  const ranksBlockMatch = html.match(/class=["']rating-ranks["']([\s\S]*?)<\/ul>/i) ||
                          html.match(/class=["']rating-ranks["']([\s\S]*?)<\/div>/i);
  if (ranksBlockMatch) {
    const block = ranksBlockMatch[1];
    const gItem = block.match(/<li[^>]*>[\s\S]*?<a[^>]*href=["']\/ratings\/all["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>[\s\S]*?Global Rank/i) ||
                  block.match(/<strong>\s*([^<]+)\s*<\/strong>[\s\S]{0,60}Global Rank/i);
    if (gItem) {
      const gClean = gItem[1].replace(/,/g, "").trim();
      if (!gClean.toLowerCase().includes("inactive") && !gClean.toLowerCase().includes("na")) {
        const parsedG = parseInt(gClean, 10);
        if (!isNaN(parsedG) && parsedG > 0) globalRank = parsedG;
      }
    }

    const cItem = block.match(/<li[^>]*>[\s\S]*?<a[^>]*href=["'][^"']*Country[^"']*["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>[\s\S]*?Country Rank/i) ||
                  block.match(/<strong>\s*([^<]+)\s*<\/strong>[\s\S]{0,60}Country Rank/i);
    if (cItem) {
      const cClean = cItem[1].replace(/,/g, "").trim();
      if (!cClean.toLowerCase().includes("inactive") && !cClean.toLowerCase().includes("na")) {
        const parsedC = parseInt(cClean, 10);
        if (!isNaN(parsedC) && parsedC > 0) countryRank = parsedC;
      }
    }
  }

  if (!globalRank) {
    const globalMatch = html.match(/<a[^>]*href=["']\/ratings\/all["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>/i) ||
                        html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,60}Global Rank/i) ||
                        html.match(/Global Rank[\s\S]{0,60}<strong>\s*([\d,]+)\s*<\/strong>/i);
    if (globalMatch) {
      const gClean = globalMatch[1].replace(/,/g, "").trim();
      if (!gClean.toLowerCase().includes("inactive") && !gClean.toLowerCase().includes("na")) {
        const parsedG = parseInt(gClean, 10);
        if (!isNaN(parsedG) && parsedG > 0) globalRank = parsedG;
      }
    }
  }

  if (!countryRank) {
    const countryMatch = html.match(/<a[^>]*href=["'][^"']*Country[^"']*["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>/i) ||
                         html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,60}Country Rank/i) ||
                         html.match(/Country Rank[\s\S]{0,60}<strong>\s*([\d,]+)\s*<\/strong>/i);
    if (countryMatch) {
      const cClean = countryMatch[1].replace(/,/g, "").trim();
      if (!cClean.toLowerCase().includes("inactive") && !cClean.toLowerCase().includes("na")) {
        const parsedC = parseInt(cClean, 10);
        if (!isNaN(parsedC) && parsedC > 0) countryRank = parsedC;
      }
    }
  }

  // 7. DSA Rating block
  if (!dsaRating) {
    const dsaMatch = html.match(/id=["']rating-block-dsa[^"']*["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/id=["']rating-block-dsa-monday["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/id=["']rating-block-dsa-learning-series["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/DSA\s*Rating[\s\S]{0,150}?(\d{3,4})/i) ||
                     html.match(/dsa-rating[^>]*>(\d+)/i);
    if (dsaMatch) {
      const dsaVal = parseNum(dsaMatch[1]);
      if (dsaVal > 0) dsaRating = dsaVal;
    }
  }

  if (!dsaRating && rating > 0) {
    dsaRating = rating;
  }

  // 8. Solved count
  const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) || html.match(/Total Problems Solved[^>]*>(\d+)/i) || html.match(/Problems Solved[^>]*>(\d+)/i);
  if (solvedMatch) totalSolved = parseNum(solvedMatch[1]);

  const fullyMatch = html.match(/Fully Solved\s*\(\s*(\d+)\s*\)/i);
  if (fullyMatch) fullySolved = parseNum(fullyMatch[1]);
  else fullySolved = totalSolved;

  const partialMatch = html.match(/Partially Solved\s*\(\s*(\d+)\s*\)/i);
  if (partialMatch) partiallySolved = parseNum(partialMatch[1]);

  // 9. User details
  const nameMatch = html.match(/<h1[^>]*class="[^"]*h2-style[^"]*"[^>]*>([^<]+)<\/h1>/i) || html.match(/class="user-details-container"[^>]*>[\s\S]*?<h1>([^<]+)<\/h1>/i) || html.match(/<title>([^|]+)\s*\|\s*CodeChef/i);
  if (nameMatch) {
    const raw = nameMatch[1].trim();
    if (raw && !raw.includes("User Profile") && raw.toLowerCase() !== username.toLowerCase()) {
      name = raw;
    }
  }

  const avatarMatch =
    html.match(/class=['"]profileImage['"][^>]*src=['"]([^'"]+)['"]/i) ||
    html.match(/src=['"](https:\/\/cdn\.codechef\.com\/sites\/default\/files\/uploads\/pictures\/[^'"]+)['"]/i) ||
    html.match(/<div[^>]*class=['"][^'"]*user-details-container[^'"]*[\s\S]*?<img[^>]*src=['"]([^'"]+)['"]/i) ||
    html.match(/<img[^>]*class=['"][^'"]*profileImage[^'"]*['"][^>]*src=['"]([^'"]+)['"]/i);
  if (avatarMatch) {
    let rawAv = (avatarMatch[1] || avatarMatch[0]).trim();
    if (rawAv.startsWith("//")) rawAv = `https:${rawAv}`;
    avatar = rawAv;
  }

  const countryNameMatch = html.match(/class="user-country-name"[^>]*>([^<]+)<\/span>/i) || html.match(/user-country-flag"[^>]*title="([^"]+)"/i);
  if (countryNameMatch) countryName = countryNameMatch[1].trim();

  const flagMatch = html.match(/class="user-country-flag"[^>]*src="([^"]+)"/i);
  if (flagMatch) countryFlag = flagMatch[1];

  const instMatch = html.match(/Institution:<\/label><span>([^<]+)<\/span>/i) || html.match(/Institution:[^<]*<strong>([^<]+)<\/strong>/i) || html.match(/student-institution[^>]*>([^<]+)</i);
  if (instMatch) institution = instMatch[1].trim();

  const studentMatch = html.match(/Student\/Professional:<\/label><span>([^<]+)<\/span>/i);
  if (studentMatch) studentOrProfessional = studentMatch[1].trim();

  // 10. Badges parsing
  const badgeBlocks = [...html.matchAll(/<div class=['"]badge['"]>([\s\S]*?)<\/div>\s*<\/div>/gi)];
  badgeBlocks.forEach((bMatch) => {
    const bHtml = bMatch[1];
    const bTitle = bHtml.match(/class=['"]badge__title['"][^>]*>([^<]+)</i);
    const bDesc = bHtml.match(/class=['"]badge__description['"][^>]*>([\s\S]*?)<\/p>/i);
    const bImg = bHtml.match(/src=['"]([^'"]+)['"]/i);
    if (bTitle) {
      badges.push({
        name: bTitle[1].trim(),
        description: bDesc ? bDesc[1].replace(/<[^>]+>/g, "").trim() : undefined,
        icon: bImg ? bImg[1] : undefined,
        category: "Achievement Badge",
      });
    }
  });

  // 11. Skill tests parsing
  const skillBlocks = [...html.matchAll(/<div class="skill-tests__block">([\s\S]*?)<\/div>\s*<\/div>/gi)];
  skillBlocks.forEach((sMatch) => {
    const sHtml = sMatch[1];
    const sTitle = sHtml.match(/class="skill-tests__title">([^<]+)</i);
    const sScore = sHtml.match(/class="score__percentage">([^<]+)</i);
    const sDesc = sHtml.match(/class="skill-tests__description">([^<]+)</i);
    if (sTitle) {
      badges.push({
        name: sTitle[1].trim(),
        description: `${sScore ? `Score: ${sScore[1].trim()} - ` : ""}${sDesc ? sDesc[1].trim() : "Skill Test"}`,
        category: "Skill Test",
      });
    }
  });

  if (rating > 0 || totalSolved > 0 || contestsParticipated > 0 || name || globalRank !== null) {
    return normalizeCodeChefStats(
      {
        rating,
        maxRating,
        stars: stars || undefined,
        division: division || undefined,
        globalRank,
        countryRank,
        dsaRating,
        totalSolved,
        fullySolved,
        partiallySolved,
        contestsParticipated,
        name,
        avatar,
        countryName,
        countryFlag,
        institution,
        studentOrProfessional,
        badges: badges.length > 0 ? badges : undefined,
        recentContests: recentContests.length > 0 ? recentContests : undefined,
      },
      username
    );
  }

  return null;
}

/**
 * Fetches CodeChef public profile statistics using robust multi-tiered microservices & scrapers.
 */
export async function fetchCodeChefStats(usernameInput: string): Promise<{
  data: CodeChefStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "CodeChef username is required" };
  }

  const cleanUser = username.trim();
  const timestamp = Date.now();
  const profileUrl = `https://www.codechef.com/users/${encodeURIComponent(cleanUser)}`;

  // Tier 0: Direct Supabase Edge Function (Server-side fetch with full DOM/all_rating script parsing, no CORS limits)
  try {
    const edgeRes = await supabase.functions.invoke("fetch-codechef", {
      body: { username: cleanUser },
    });
    if (!edgeRes.error && edgeRes.data && edgeRes.data.success && edgeRes.data.data) {
      const stats = normalizeCodeChefStats(edgeRes.data.data, cleanUser);
      if (stats.rating > 0 || stats.totalSolved > 0 || stats.contestsParticipated > 0 || stats.name) {
        return { data: stats, error: null };
      }
    }
  } catch {
    // Edge function not deployed or unreachable, seamlessly continue to Tier 1 & 2
  }

  let mergedJsonData: any = null;

  // Tier 1: Dedicated Competitive Programming JSON APIs (Fast & High Availability with CORS support)
  try {
    const [cpRatingRes, codechefApiRes, competeApiRes] = await Promise.allSettled([
      fetch(`https://cp-rating-api.vercel.app/codechef/${encodeURIComponent(cleanUser)}?_t=${timestamp}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`https://codechefapi.vercel.app/handle/${encodeURIComponent(cleanUser)}?_t=${timestamp}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`https://competeapi.vercel.app/user/codechef/${encodeURIComponent(cleanUser)}/?_t=${timestamp}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (cpRatingRes.status === "fulfilled" && cpRatingRes.value.ok) {
      const json = await cpRatingRes.value.json();
      if (json && !json.error) {
        mergedJsonData = { ...(mergedJsonData || {}), ...json };
        if (typeof json.participation === "number") {
          mergedJsonData.contestsParticipated = json.participation;
          mergedJsonData.participation = json.participation;
        }
        if (json.globalRank && !mergedJsonData.globalRank) mergedJsonData.globalRank = json.globalRank;
        if (json.countryRank && !mergedJsonData.countryRank) mergedJsonData.countryRank = json.countryRank;
        if (json.puzzleRating && !mergedJsonData.dsaRating) mergedJsonData.dsaRating = json.puzzleRating;
        if (Array.isArray(json.contests) && json.contests.length > 0) {
          mergedJsonData.recentContests = json.contests;
          if (mergedJsonData.contestsParticipated === undefined) {
            mergedJsonData.contestsParticipated = json.contests.length;
          }
        }
      }
    }

    if (codechefApiRes.status === "fulfilled" && codechefApiRes.value.ok) {
      const json = await codechefApiRes.value.json();
      if (json && json.success !== false && (json.currentRating || json.rating || json.numberOfProblemsSolved || json.stars)) {
        mergedJsonData = { ...(mergedJsonData || {}), ...json };
        if (json.numberOfProblemsSolved) {
          mergedJsonData.totalSolved = json.numberOfProblemsSolved;
        }
        if (json.currentRating) {
          mergedJsonData.rating = json.currentRating;
        }
        if (json.highestRating) {
          mergedJsonData.maxRating = json.highestRating;
        }
        if (json.globalRank) mergedJsonData.globalRank = json.globalRank;
        if (json.countryRank) mergedJsonData.countryRank = json.countryRank;
      }
    }

    if (competeApiRes.status === "fulfilled" && competeApiRes.value.ok) {
      const json = await competeApiRes.value.json();
      if (json && !json.error && (json.rating_number || json.rating || json.stars || json.global_rank)) {
        mergedJsonData = { ...(mergedJsonData || {}), ...json };
        if (!mergedJsonData.institution && json.institution) mergedJsonData.institution = json.institution;
        if (!mergedJsonData.studentOrProfessional && json.user_type) mergedJsonData.studentOrProfessional = json.user_type;
        if (!mergedJsonData.globalRank && json.global_rank) mergedJsonData.globalRank = json.global_rank;
        if (!mergedJsonData.countryRank && json.country_rank) mergedJsonData.countryRank = json.country_rank;
        if (Array.isArray(json.all_rating) && json.all_rating.length > 0) {
          mergedJsonData.recentContests = json.all_rating;
          if (mergedJsonData.contestsParticipated === undefined) {
            mergedJsonData.contestsParticipated = json.all_rating.length;
          }
        }
      }
    }
  } catch { }

  // Check if Tier 1 already has full profile data including exact contest participation count
  if (
    mergedJsonData &&
    (mergedJsonData.rating_number || mergedJsonData.currentRating || mergedJsonData.rating || mergedJsonData.numberOfProblemsSolved || mergedJsonData.stars) &&
    typeof mergedJsonData.contestsParticipated === "number"
  ) {
    return {
      data: normalizeCodeChefStats(mergedJsonData, cleanUser),
      error: null,
    };
  }

  // Tier 2: Multi-tiered CORS Proxies & Direct HTML Scrapers for comprehensive DOM/script data
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://corsproxy.org/?url=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://proxy.cors.sh/${profileUrl}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(profileUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(profileUrl)}`,
  ];

  for (const url of proxyEndpoints) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        let text = "";
        try {
          const json = await res.json();
          text = json?.contents || json?.data || JSON.stringify(json);
        } catch {
          text = await res.text();
        }

        if (!text || text.includes("Access Denied") || text.includes("403 Forbidden") || text.includes("Just a moment...")) {
          continue;
        }

        // Parse HTML document with deep DOM & script extractors
        const parsedData = parseCodeChefHtml(text, cleanUser);
        if (parsedData && (parsedData.rating > 0 || (parsedData.totalSolved && parsedData.totalSolved > 0) || parsedData.contestsParticipated > 0 || parsedData.name)) {
          if (mergedJsonData) {
            if (!parsedData.totalSolved && mergedJsonData.numberOfProblemsSolved) {
              parsedData.totalSolved = mergedJsonData.numberOfProblemsSolved;
            }
            if (!parsedData.avatar && mergedJsonData.profile) {
              parsedData.avatar = mergedJsonData.profile;
            }
            if (!parsedData.countryName && mergedJsonData.countryName) {
              parsedData.countryName = mergedJsonData.countryName;
            }
            if (parsedData.contestsParticipated === 0 && typeof mergedJsonData.contestsParticipated === "number") {
              parsedData.contestsParticipated = mergedJsonData.contestsParticipated;
            }
          }
          return {
            data: parsedData,
            error: null,
          };
        }
      }
    } catch {
      // Try next endpoint in pipeline
    }
  }

  // Fallback: If proxy HTML scraping timed out but Tier 1 had basic stats, return normalized Tier 1 data
  if (mergedJsonData && (mergedJsonData.rating_number || mergedJsonData.currentRating || mergedJsonData.rating || mergedJsonData.numberOfProblemsSolved || mergedJsonData.stars)) {
    return {
      data: normalizeCodeChefStats(mergedJsonData, cleanUser),
      error: null,
    };
  }

  // Return error instead of empty zeroed object to prevent cache corruption
  return {
    data: null,
    error: `Could not fetch CodeChef profile for "${cleanUser}". CodeChef might be rate-limiting proxy requests or the handle might be incorrect.`,
  };
}

/**
 * Fetches GeeksforGeeks (GFG) public profile statistics using robust multi-tiered microservices & scrapers.
 */
export async function fetchGeeksForGeeksStats(usernameInput: string): Promise<{
  data: GeeksForGeeksStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "GeeksforGeeks username is required" };
  }

  const cleanHandle = username.trim();
  const lowerHandle = cleanHandle.toLowerCase();
  const profileUrl = `https://www.geeksforgeeks.org/user/${encodeURIComponent(cleanHandle)}/`;

  // Tier 0: Supabase Edge Function fetch-gfg (server-side, bypasses browser CORS)
  try {
    const edgeRes = await supabase.functions.invoke("fetch-gfg", {
      body: { username: cleanHandle },
    });
    if (!edgeRes.error && edgeRes.data?.data) {
      return { data: edgeRes.data.data as GeeksForGeeksStats, error: null };
    }
  } catch (edgeErr) {
    console.warn("[GFG] Edge Function fallback:", edgeErr);
  }

  const parseNum = (val: any): number => {
    if (val === undefined || val === null) return 0;
    const cleaned = String(val).replace(/,/g, "").trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  let isNetworkError = false;
  let isUserNotFound = false;

  // 1. Primary microservice endpoints & official GFG practice APIs
  const endpoints = [
    `https://practiceapi.geeksforgeeks.org/api/vr/user/profile/${encodeURIComponent(cleanHandle)}/`,
    `https://practiceapi.geeksforgeeks.org/api/v1/user/score/userProfile/${encodeURIComponent(cleanHandle)}/`,
    `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(cleanHandle)}`,
    `https://geeks-for-geeks-api.vercel.app/${encodeURIComponent(lowerHandle)}`,
    `https://gfg-api.vercel.app/public/user/${encodeURIComponent(cleanHandle)}`,
    `https://gfg-api.vercel.app/public/user/${encodeURIComponent(lowerHandle)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://practiceapi.geeksforgeeks.org/api/vr/user/profile/${cleanHandle}/`)}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, { signal: AbortSignal.timeout(6000) });
      if (res.status === 404) {
        isUserNotFound = true;
        continue;
      }
      if (res.ok) {
        const json = await res.json();
        if (json?.status === "error" || json?.message === "User not found" || json?.error === "User not found") {
          isUserNotFound = true;
          continue;
        }

        const info = json.result || json.data || json.info || json;
        if (info && (info.score !== undefined || info.total_problems_solved !== undefined || info.codingScore !== undefined || info.user_handle || info.userName || info.userProfile || info.name)) {
          const solvedStats = json.solvedStats || json.problemsSolved || {};

          const score = parseNum(info.score || info.codingScore || info.coding_score || json.codingScore || json.score);
          const total = parseNum(info.total_problems_solved || info.totalProblemsSolved || info.totalSolved || info.problems_solved || json.totalProblemsSolved);

          const easy = parseNum(info.easy_solved || solvedStats.easy?.count || solvedStats.easy || info.easySolved || info.easy || json.easySolved);
          const medium = parseNum(info.medium_solved || solvedStats.medium?.count || solvedStats.medium || info.mediumSolved || info.medium || json.mediumSolved);
          const hard = parseNum(info.hard_solved || solvedStats.hard?.count || solvedStats.hard || info.hardSolved || info.hard || json.hardSolved);
          const rank = info.institute_rank || info.instituteRank || info.institutionRank || info.campusRank || info.rank || json.instituteRank;
          const streak = parseNum(info.pod_streak || info.streak || info.current_streak || info.potdStreak || json.streak);

          const profileImg = info.profile_image_url || info.profile_image || info.avatarUrl || info.profileImage || json.profile_image || null;
          const realName = info.name || info.full_name || info.userName || info.displayName || null;
          const displayName = realName || cleanHandle;
          const institution = info.institution || info.institute || info.campus || json.institution || null;
          const badges = info.badges || json.badges || info.badge_count || null;

          const computedTotal = total || (easy + medium + hard);

          if (score > 0 || computedTotal > 0 || realName || profileImg) {
            return {
              data: {
                username: cleanHandle,
                gfg_username: cleanHandle,
                profile_image: profileImg,
                display_name: displayName,
                institution: institution && institution !== "N/A" ? String(institution) : null,
                codingScore: score,
                totalSolved: computedTotal,
                easySolved: easy || Math.round(computedTotal * 0.5),
                mediumSolved: medium || Math.round(computedTotal * 0.35),
                hardSolved: hard || Math.round(computedTotal * 0.15),
                rank: rank && rank !== "0" && rank !== "N/A" ? String(rank) : null,
                institutionRank: rank && rank !== "0" && rank !== "N/A" ? String(rank) : null,
                badges: badges,
                streak: streak,
                profile_url: profileUrl,
                last_updated: new Date().toISOString(),
              },
              error: null,
            };
          }
        }
      }
    } catch (err: any) {
      isNetworkError = true;
    }
  }

  // 2. AllOrigins JSON Wrapper Scraper & Proxies
  const htmlProxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.geeksforgeeks.org/profile/${cleanHandle}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.geeksforgeeks.org/profile/${cleanHandle}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.geeksforgeeks.org/profile/${cleanHandle}`)}`,
  ];

  for (const proxyUrl of htmlProxies) {
    try {
      const aoRes = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(9000),
      });
      if (aoRes.ok) {
        let html = "";
        if (proxyUrl.includes("allorigins")) {
          const aoJson = await aoRes.json();
          html = aoJson?.contents || "";
        } else {
          html = await aoRes.text();
        }

        if (html && html.length > 100) {
          if (html.includes("User profile not found") || html.includes("404 Page Not Found")) {
            isUserNotFound = true;
            continue;
          }

          const unescaped = html
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, " ");

          // A. RSC / Next.js Data Extract
          let displayName = cleanHandle;
          const mentorNameMatch =
            unescaped.match(new RegExp(`"handle":"${cleanHandle}"[\\s\\S]*?"name":"([^"]+)"`, "i")) ||
            unescaped.match(/"mentor":\s*\{[^}]*?"name":"([^"]+)"/i) ||
            unescaped.match(/"articleCount":\s*\{[^}]*?"name":"([^"]+)"/i) ||
            unescaped.match(/"title",null,\{"children":"([^"|\-_]+)/i);

          if (mentorNameMatch && mentorNameMatch[1] && mentorNameMatch[1].trim().length < 60) {
            const candidate = mentorNameMatch[1].trim();
            if (!candidate.toLowerCase().includes("geeksforgeeks") && !candidate.toLowerCase().includes("page not found")) {
              displayName = candidate;
            }
          }

          const mentorImgMatch =
            unescaped.match(new RegExp(`"handle":"${cleanHandle}"[\\s\\S]*?"profile_image_url":"(https?:\\/\\/[^"]+)"`, "i")) ||
            unescaped.match(/"mentor":\s*\{[^}]*?"profile_image_url":"(https?:\/\/[^"]+)"/i) ||
            unescaped.match(/"articleCount":\s*\{[^}]*?"profile_image_url":"(https?:\/\/[^"]+)"/i) ||
            unescaped.match(/"profile_image_url":\s*"(https?:\/\/[^"]+)"/i) ||
            html.match(/profile_image_url['":\s]+"(https:[^"]+)"/i);

          const scoreMatch =
            unescaped.match(/"score":\s*(\d+)/i) ||
            unescaped.match(/codingScore['":\s]+(\d+)/i) ||
            unescaped.match(/Coding Score[^>]*>(\d+)/i);
          const totalMatch =
            unescaped.match(/"total_problems_solved":\s*(\d+)/i) ||
            unescaped.match(/problemsSolved['":\s]+(\d+)/i) ||
            unescaped.match(/>(\d+)<\/span>\s*Problems Solved/i);
          const rankMatch =
            unescaped.match(/"institute_rank":\s*(\d+)/i) ||
            unescaped.match(/instituteRank['":\s]+(\d+)/i);
          const streakMatch =
            unescaped.match(/"pod_solved_longest_streak":\s*(\d+)/i) ||
            unescaped.match(/"pod_solved_current_streak":\s*(\d+)/i) ||
            unescaped.match(/currentStreak['":\s]+(\d+)/i);
          const institutionMatch =
            unescaped.match(/"institution":\s*"([^"]+)"/i) ||
            unescaped.match(/"institute_name":\s*"([^"]+)"/i);

          const easyMatch = unescaped.match(/"easy(?:_solved)?":\s*(\d+)/i) || unescaped.match(/easySolved['":\s]+(\d+)/i);
          const mediumMatch = unescaped.match(/"medium(?:_solved)?":\s*(\d+)/i) || unescaped.match(/mediumSolved['":\s]+(\d+)/i);
          const hardMatch = unescaped.match(/"hard(?:_solved)?":\s*(\d+)/i) || unescaped.match(/hardSolved['":\s]+(\d+)/i);

          const scoreNum = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
          const totalNum = totalMatch ? parseInt(totalMatch[1], 10) : 0;
          const easyNum = easyMatch ? parseInt(easyMatch[1], 10) : 0;
          const mediumNum = mediumMatch ? parseInt(mediumMatch[1], 10) : 0;
          const hardNum = hardMatch ? parseInt(hardMatch[1], 10) : 0;
          const computedTotal = totalNum || (easyNum + mediumNum + hardNum);

          if (scoreNum > 0 || computedTotal > 0 || (displayName && displayName !== cleanHandle)) {
            return {
              data: {
                username: cleanHandle,
                gfg_username: cleanHandle,
                profile_image: mentorImgMatch ? mentorImgMatch[1] : null,
                display_name: displayName,
                institution: institutionMatch ? institutionMatch[1].trim() : null,
                codingScore: scoreNum,
                totalSolved: computedTotal,
                easySolved: easyNum || Math.round(computedTotal * 0.5),
                mediumSolved: mediumNum || Math.round(computedTotal * 0.35),
                hardSolved: hardNum || Math.max(0, computedTotal - (easyNum || Math.round(computedTotal * 0.5)) - (mediumNum || Math.round(computedTotal * 0.35))),
                rank: rankMatch ? rankMatch[1] : null,
                institutionRank: rankMatch ? rankMatch[1] : null,
                streak: streakMatch ? parseInt(streakMatch[1], 10) : 0,
                badges: null,
                profile_url: profileUrl,
                last_updated: new Date().toISOString(),
              },
              error: null,
            };
          }
        }
      }
    } catch {
      isNetworkError = true;
    }
  }

  if (isUserNotFound) {
    return {
      data: null,
      error: "GeeksforGeeks profile not found.",
    };
  }

  if (isNetworkError) {
    return {
      data: null,
      error: "Unable to fetch profile. Please try again later.",
    };
  }

  return {
    data: null,
    error: "GeeksforGeeks profile not found.",
  };
}

/**
 * Computes AtCoder rank title based on rating standard
 */
export function getAtCoderRankName(rating: number): string {
  if (rating >= 2800) return "Red";
  if (rating >= 2400) return "Orange";
  if (rating >= 2000) return "Yellow";
  if (rating >= 1600) return "Blue";
  if (rating >= 1200) return "Cyan";
  if (rating >= 800) return "Green";
  if (rating >= 400) return "Brown";
  if (rating > 0) return "Gray";
  return "Unrated";
}

/**
 * Normalizes AtCoder stats from raw JSON payload.
 */
function normalizeAtCoderStats(raw: any, username: string): AtCoderStats {
  const rating = typeof raw.rating === "number" ? raw.rating : parseInt(String(raw.rating || 0), 10) || 0;
  const maxRating = typeof raw.maxRating === "number" ? raw.maxRating : parseInt(String(raw.maxRating || rating), 10) || rating;
  const rank = raw.rank || getAtCoderRankName(rating);

  const globalRank = typeof raw.globalRank === "number" ? raw.globalRank : (raw.globalRank ? parseInt(String(raw.globalRank), 10) || null : null);
  const totalSolved = typeof raw.totalSolved === "number" ? raw.totalSolved : (typeof raw.accepted_count === "number" ? raw.accepted_count : parseInt(String(raw.totalSolved || 0), 10) || 0);
  const competitionsCount = typeof raw.competitionsCount === "number" ? raw.competitionsCount : (typeof raw.rated_matches === "number" ? raw.rated_matches : parseInt(String(raw.competitionsCount || 0), 10) || 0);

  const heuristicRating = typeof raw.heuristicRating === "number" ? raw.heuristicRating : (raw.heuristicRating ? parseInt(String(raw.heuristicRating), 10) || null : null);
  const heuristicMaxRating = typeof raw.heuristicMaxRating === "number" ? raw.heuristicMaxRating : (raw.heuristicMaxRating ? parseInt(String(raw.heuristicMaxRating), 10) || null : null);
  const heuristicRank = raw.heuristicRank || (heuristicRating ? getAtCoderRankName(heuristicRating) : null);
  const heuristicCompetitionsCount = typeof raw.heuristicCompetitionsCount === "number" ? raw.heuristicCompetitionsCount : (raw.heuristicCompetitionsCount ? parseInt(String(raw.heuristicCompetitionsCount), 10) || 0 : 0);

  return {
    username: username,
    name: raw.name || null,
    avatar: raw.avatar || null,
    country: raw.country || null,
    countryFlag: raw.countryFlag || null,
    affiliation: raw.affiliation || null,
    birthYear: raw.birthYear || null,
    wins: typeof raw.wins === "number" ? raw.wins : (raw.wins ? parseInt(String(raw.wins), 10) || null : null),
    rating: rating,
    maxRating: maxRating > 0 ? maxRating : rating,
    rank: rank,
    globalRank: globalRank,
    totalSolved: totalSolved,
    competitionsCount: competitionsCount,
    totalCompetitions: typeof raw.totalCompetitions === "number" ? raw.totalCompetitions : undefined,
    acceptedCountRank: typeof raw.acceptedCountRank === "number" ? raw.acceptedCountRank : (typeof raw.accepted_count_rank === "number" ? raw.accepted_count_rank : null),
    ratedPointSum: typeof raw.ratedPointSum === "number" ? raw.ratedPointSum : (typeof raw.rated_point_sum === "number" ? raw.rated_point_sum : undefined),
    ratedPointSumRank: typeof raw.ratedPointSumRank === "number" ? raw.ratedPointSumRank : (typeof raw.rated_point_sum_rank === "number" ? raw.rated_point_sum_rank : null),
    highestPerformance: typeof raw.highestPerformance === "number" ? raw.highestPerformance : undefined,
    bestRank: typeof raw.bestRank === "number" ? raw.bestRank : undefined,
    lastCompeted: raw.lastCompeted || null,
    recentContests: Array.isArray(raw.recentContests) ? raw.recentContests : [],
    contestHistory: Array.isArray(raw.contestHistory) ? raw.contestHistory : (Array.isArray(raw.recentContests) ? raw.recentContests : []),

    // Heuristic Stats
    heuristicRating,
    heuristicMaxRating,
    heuristicRank,
    heuristicCompetitionsCount,
    heuristicTotalCompetitions: typeof raw.heuristicTotalCompetitions === "number" ? raw.heuristicTotalCompetitions : undefined,
    heuristicHighestPerformance: typeof raw.heuristicHighestPerformance === "number" ? raw.heuristicHighestPerformance : undefined,
    heuristicBestRank: typeof raw.heuristicBestRank === "number" ? raw.heuristicBestRank : undefined,
    heuristicRecentContests: Array.isArray(raw.heuristicRecentContests) ? raw.heuristicRecentContests : undefined,

    profile_url: raw.profile_url || `https://atcoder.jp/users/${encodeURIComponent(username)}`,
    last_updated: raw.last_updated || new Date().toISOString(),
  };
}

/**
 * Parses raw HTML string from AtCoder user profile.
 */
function parseAtCoderProfileHtml(html: string, username: string): Partial<AtCoderStats> | null {
  if (!html || html.length < 100) return null;

  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const cleaned = String(val).replace(/,/g, "").trim();
    if (!cleaned || cleaned.toLowerCase().includes("inactive") || cleaned.toLowerCase().includes("na") || cleaned.toLowerCase().includes("null") || cleaned.toLowerCase().includes("unrated")) {
      return null;
    }
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed < 0 ? null : parsed;
  };

  let globalRank: number | null = null;
  let rating = 0;
  let maxRating = 0;
  let titleTier = "";
  let competitionsCount = 0;
  let lastCompeted: string | null = null;
  let country: string | null = null;
  let countryFlag: string | null = null;
  let affiliation: string | null = null;
  let birthYear: number | string | null = null;
  let wins: number | null = null;
  let avatar: string | null = null;

  // 1. Global Rank
  const rankMatch =
    html.match(/<th[^>]*>Rank<\/th>\s*<td[^>]*>\s*(\d+)(?:st|nd|rd|th)?/i) ||
    html.match(/Rank<\/span>\s*<\/td>\s*<td>\s*(\d+)/i) ||
    html.match(/Rank[\s\S]*?<td>\s*([0-9]+(?:st|nd|rd|th)?)/i);
  if (rankMatch) {
    globalRank = parseNum(rankMatch[1]);
  }

  // 2. Rating & Rank Color
  const ratingMatch =
    html.match(/<th[^>]*>Rating<\/th>\s*<td[^>]*>[\s\S]*?<span[^>]*>(\d+)<\/span>/i) ||
    html.match(/Rating<\/span>\s*<\/td>\s*<td>\s*<span[^>]*>(\d+)/i) ||
    html.match(/Rating[\s\S]{0,50}?(\d{1,4})/i);
  if (ratingMatch) {
    rating = parseNum(ratingMatch[1]) || 0;
  }

  // 3. Highest Rating & Title
  const highestMatch =
    html.match(/<th[^>]*>Highest Rating<\/th>\s*<td[^>]*>[\s\S]*?<span[^>]*>(\d+)<\/span>/i) ||
    html.match(/Highest Rating<\/span>\s*<\/td>\s*<td>\s*<span[^>]*>(\d+)/i);
  if (highestMatch) {
    maxRating = parseNum(highestMatch[1]) || rating;
  }

  const titleMatch =
    html.match(/<th[^>]*>Highest Rating<\/th>\s*<td[^>]*>[\s\S]*?<span class="bold">([^<]+)<\/span>/i) ||
    html.match(/Highest Rating[\s\S]*?<span class="bold">([^<]+)<\/span>/i);
  if (titleMatch) {
    titleTier = titleMatch[1].trim();
  }

  // 4. Rated Matches (Contests attended)
  const matchesMatch =
    html.match(/<th[^>]*>Rated Matches[\s\S]*?<\/th>\s*<td[^>]*>\s*(\d+)/i) ||
    html.match(/Rated Matches<\/span>\s*<\/td>\s*<td>\s*(\d+)/i);
  if (matchesMatch) {
    competitionsCount = parseNum(matchesMatch[1]) || 0;
  }

  // 5. Last Competed
  const lastMatch =
    html.match(/<th[^>]*>Last Competed<\/th>\s*<td[^>]*>\s*([^<]+)/i) ||
    html.match(/Last Competed<\/span>\s*<\/td>\s*<td>\s*([^<]+)/i);
  if (lastMatch) {
    lastCompeted = lastMatch[1].trim();
  }

  // 6. Country & Flag
  const countryMatch =
    html.match(/<th[^>]*>Country\/Region<\/th>\s*<td[^>]*>(?:<img[^>]*src=["']([^"']+)["'][^>]*>)?\s*([^<]+)<\/td>/i) ||
    html.match(/Country\/Region[\s\S]*?<td>(?:<img[^>]*src=["']([^"']+)["'][^>]*>)?\s*([^<]+)<\/td>/i);
  if (countryMatch) {
    if (countryMatch[1]) {
      const rawFlag = countryMatch[1].trim();
      countryFlag = rawFlag.startsWith("//") ? `https:${rawFlag}` : rawFlag;
    }
    if (countryMatch[2]) {
      country = countryMatch[2].trim();
    }
  }

  // 7. Affiliation
  const affMatch =
    html.match(/<th[^>]*>Affiliation<\/th>\s*<td[^>]*>\s*([^<]+)/i) ||
    html.match(/Affiliation<\/span>\s*<\/td>\s*<td>\s*([^<]+)/i);
  if (affMatch) {
    const rawAff = affMatch[1].trim();
    if (rawAff && rawAff !== "-" && rawAff.toLowerCase() !== "none") {
      affiliation = rawAff;
    }
  }

  // 8. Birth Year
  const birthMatch =
    html.match(/<th[^>]*>Birth Year<\/th>\s*<td[^>]*>\s*(\d+)/i) ||
    html.match(/Birth Year<\/span>\s*<\/td>\s*<td>\s*(\d+)/i);
  if (birthMatch) {
    birthYear = birthMatch[1].trim();
  }

  // 9. Wins
  const winsMatch =
    html.match(/<b>Win<\/b>[\s\S]*?(\d+)<\/p>/i) ||
    html.match(/Win[\s\S]{0,80}?(\d+)/i);
  if (winsMatch) {
    wins = parseNum(winsMatch[1]);
  }

  // 10. Avatar
  const avatarMatch =
    html.match(/class=["']avatar["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/src=["'](https:\/\/img\.atcoder\.jp\/icons\/[^"']+)["']/i);
  if (avatarMatch) {
    const rawAvatar = avatarMatch[1].trim();
    avatar = rawAvatar.startsWith("//") ? `https:${rawAvatar}` : rawAvatar;
  }

  if (maxRating === 0 && rating > 0) maxRating = rating;

  const rankTier = titleTier || getAtCoderRankName(rating);

  return {
    username,
    rating,
    maxRating,
    rank: rankTier,
    globalRank,
    competitionsCount,
    lastCompeted,
    country,
    countryFlag,
    affiliation,
    birthYear,
    wins,
    avatar,
  };
}

/**
 * Fetches AtCoder public profile statistics using Supabase Edge Function, Kenkoooo AtCoder API, rating badges & resilient history fallbacks.
 */
export async function fetchAtCoderStats(usernameInput: string): Promise<{
  data: AtCoderStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "AtCoder username is required" };
  }

  const cleanHandle = username.trim();
  const timestamp = Date.now();
  const profileUrl = `https://atcoder.jp/users/${encodeURIComponent(cleanHandle)}`;

  // Tier 0: Direct Supabase Edge Function (Server-side fetch with full DOM & JSON parsing, no CORS limits)
  try {
    const edgeRes = await supabase.functions.invoke("fetch-atcoder", {
      body: { username: cleanHandle },
    });
    if (!edgeRes.error && edgeRes.data && edgeRes.data.success && edgeRes.data.data) {
      const stats = normalizeAtCoderStats(edgeRes.data.data, cleanHandle);
      if (stats.rating > 0 || stats.totalSolved > 0 || (stats.competitionsCount && stats.competitionsCount > 0) || stats.rank !== "Unrated") {
        return { data: stats, error: null };
      }
    }
  } catch {
    // Edge function unreachable or not yet deployed, fallback seamlessly to client microservices & proxies
  }

  let totalSolved = 0;
  let acceptedCountRank: number | null = null;
  let ratedPointSum = 0;
  let ratedPointSumRank: number | null = null;

  let rating = 0;
  let maxRating = 0;
  let competitionsCount = 0;
  let highestPerformance = 0;
  let bestRank: number | undefined = undefined;
  let rankTier = "Unrated";
  let globalRank: number | null = null;
  let lastCompeted: string | null = null;
  let country: string | null = null;
  let countryFlag: string | null = null;
  let affiliation: string | null = null;
  let birthYear: number | string | null = null;
  let wins: number | null = null;
  let avatar: string | null = null;
  let recentContests: any[] = [];
  let contestHistory: any[] = [];
  let userFound = false;

  // 1. Kenkoooo AtCoder API (v2 user_info: accepted_count, rated_point_sum, ranks)
  try {
    const kenkooooRes = await fetch(
      `https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=${encodeURIComponent(cleanHandle)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (kenkooooRes.ok) {
      const info = await kenkooooRes.json();
      if (info && typeof info === "object") {
        if (typeof info.accepted_count === "number") totalSolved = info.accepted_count;
        if (typeof info.accepted_count_rank === "number") acceptedCountRank = info.accepted_count_rank;
        if (typeof info.rated_point_sum === "number") ratedPointSum = info.rated_point_sum;
        if (typeof info.rated_point_sum_rank === "number") ratedPointSumRank = info.rated_point_sum_rank;
        if (info.user_id) userFound = true;
      }
    }
  } catch (err: any) {
    console.warn("Kenkoooo user info API fetch error:", err?.message);
  }

  // 2. Fetch User Rating from high-availability AtCoder badge APIs
  try {
    const [badgeRes, svgRes] = await Promise.allSettled([
      fetch(`https://atcoder-badges.now.sh/api/atcoder/json/${encodeURIComponent(cleanHandle)}?_t=${timestamp}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://atrating.baoshuo.dev/rating?username=${encodeURIComponent(cleanHandle)}&_t=${timestamp}`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    // Check JSON Badge API
    if (badgeRes.status === "fulfilled" && badgeRes.value.ok) {
      try {
        const badgeJson = await badgeRes.value.json();
        if (badgeJson && typeof badgeJson.message === "string") {
          const parsedRating = parseInt(badgeJson.message, 10);
          if (!isNaN(parsedRating) && parsedRating > 0) {
            rating = parsedRating;
            if (parsedRating > maxRating) maxRating = parsedRating;
            userFound = true;
          }
        }
      } catch { }
    }

    // Check SVG Rating API if rating is still 0
    if (rating === 0 && svgRes.status === "fulfilled" && svgRes.value.ok) {
      try {
        const svgText = await svgRes.value.text();
        const ariaMatch =
          svgText.match(/aria-label="[^:]+:\s*([^0-9\n\r]*?)\s*(\d+)"/i) ||
          svgText.match(/<title>[^:]+:\s*([^0-9\n\r]*?)\s*(\d+)<\/title>/i) ||
          svgText.match(/font-weight="bold"[^>]*>([^0-9\n\r]*?)\s*(\d+)<\/text>/i);
        if (ariaMatch && ariaMatch[2]) {
          const parsedRating = parseInt(ariaMatch[2], 10);
          if (!isNaN(parsedRating) && parsedRating > 0) {
            rating = parsedRating;
            if (parsedRating > maxRating) maxRating = parsedRating;
            userFound = true;
          }
        }
      } catch { }
    }
  } catch (err: any) {
    console.warn("AtCoder rating badge fetch error:", err?.message);
  }

  // 3. Fetch User Rating & Contest History (via direct fetch or multi-tiered CORS proxies)
  const historyUrls = [
    `https://atcoder.jp/users/${encodeURIComponent(cleanHandle)}/history/json`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}/history/json?_t=${timestamp}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}/history/json?_t=${timestamp}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}/history/json?_t=${timestamp}`)}`,
  ];

  for (const hUrl of historyUrls) {
    try {
      const historyRes = await fetch(hUrl, { signal: AbortSignal.timeout(6000) });
      if (historyRes.ok) {
        let historyData: any = null;
        if (hUrl.includes("api.allorigins.win/get")) {
          const wrapper = await historyRes.json();
          if (wrapper?.contents) {
            historyData = typeof wrapper.contents === "string" ? JSON.parse(wrapper.contents) : wrapper.contents;
          }
        } else {
          historyData = await historyRes.json();
        }

        if (Array.isArray(historyData) && historyData.length > 0) {
          userFound = true;
          const ratedContests = historyData.filter((h: any) => h.IsRated !== false && typeof h.NewRating === "number");
          competitionsCount = ratedContests.length;
          if (ratedContests.length > 0) {
            const lastContest = ratedContests[ratedContests.length - 1];
            if (lastContest.NewRating) {
              rating = lastContest.NewRating;
            }
            const highestRatingInHistory = Math.max(...ratedContests.map((h: any) => h.NewRating || 0));
            if (highestRatingInHistory > maxRating) {
              maxRating = highestRatingInHistory;
            }
          }

          const perfArray = historyData
            .map((h: any) => (typeof h.Performance === "number" ? h.Performance : 0))
            .filter(Boolean);
          if (perfArray.length > 0) {
            highestPerformance = Math.max(...perfArray);
          }

          const rankArray = historyData
            .map((h: any) => (typeof h.Place === "number" && h.Place > 0 ? h.Place : Infinity))
            .filter((p) => p !== Infinity);
          if (rankArray.length > 0) {
            bestRank = Math.min(...rankArray);
          }

          contestHistory = ratedContests.map((h: any) => ({
            name: h.ContestName || h.ContestNameEn || h.ContestScreenName || "AtCoder Contest",
            code: h.ContestScreenName || undefined,
            rating: typeof h.NewRating === "number" ? h.NewRating : 0,
            rank: typeof h.Place === "number" ? h.Place : undefined,
            performance: typeof h.Performance === "number" ? h.Performance : undefined,
            date: h.EndTime ? h.EndTime.split("T")[0] : undefined,
          }));

          recentContests = historyData.slice(-10).reverse().map((h: any) => ({
            name: h.ContestName || h.ContestNameEn || h.ContestScreenName || "AtCoder Contest",
            code: h.ContestScreenName || undefined,
            rating: typeof h.NewRating === "number" ? h.NewRating : 0,
            rank: typeof h.Place === "number" ? h.Place : undefined,
            performance: typeof h.Performance === "number" ? h.Performance : undefined,
            date: h.EndTime ? h.EndTime.split("T")[0] : undefined,
          }));

          break;
        } else if (Array.isArray(historyData) && historyData.length === 0) {
          userFound = true;
          break;
        }
      }
    } catch { }
  }

  // 4. Scrape Full Profile HTML via proxies
  const profileUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`${profileUrl}?_t=${timestamp}`)}`,
  ];

  for (const pUrl of profileUrls) {
    try {
      const htmlRes = await fetch(pUrl, { signal: AbortSignal.timeout(6000) });
      if (htmlRes.ok) {
        let html = "";
        if (pUrl.includes("api.allorigins.win/get")) {
          const wrapper = await htmlRes.json();
          html = wrapper?.contents || "";
        } else {
          html = await htmlRes.text();
        }

        if (html && (html.includes("User Profile") || html.includes("atcoder.jp") || html.includes("Rating"))) {
          userFound = true;
          const parsed = parseAtCoderProfileHtml(html, cleanHandle);
          if (parsed) {
            if (parsed.rating && !rating) rating = parsed.rating;
            if (parsed.maxRating && parsed.maxRating > maxRating) maxRating = parsed.maxRating;
            if (parsed.globalRank) globalRank = parsed.globalRank;
            if (parsed.competitionsCount && !competitionsCount) competitionsCount = parsed.competitionsCount;
            if (parsed.rank && parsed.rank !== "Unrated") rankTier = parsed.rank;
            if (parsed.lastCompeted) lastCompeted = parsed.lastCompeted;
            if (parsed.country) country = parsed.country;
            if (parsed.countryFlag) countryFlag = parsed.countryFlag;
            if (parsed.affiliation) affiliation = parsed.affiliation;
            if (parsed.birthYear) birthYear = parsed.birthYear;
            if (parsed.wins) wins = parsed.wins;
            if (parsed.avatar) avatar = parsed.avatar;
            break;
          }
        }
      }
    } catch { }
  }

  if (maxRating < rating) {
    maxRating = rating;
  }

  if (!rankTier || rankTier === "Unrated") {
    rankTier = getAtCoderRankName(rating);
  }

  if (userFound || rating > 0 || totalSolved > 0 || competitionsCount > 0) {
    return {
      data: {
        username: cleanHandle,
        rating,
        maxRating: maxRating || rating,
        rank: rankTier,
        globalRank,
        totalSolved,
        competitionsCount,
        acceptedCountRank,
        ratedPointSum,
        ratedPointSumRank,
        highestPerformance: highestPerformance || undefined,
        bestRank: bestRank || undefined,
        lastCompeted: lastCompeted || undefined,
        country: country || undefined,
        countryFlag: countryFlag || undefined,
        affiliation: affiliation || undefined,
        birthYear: birthYear || undefined,
        wins: wins || undefined,
        avatar: avatar || undefined,
        recentContests: recentContests.length > 0 ? recentContests : undefined,
        contestHistory: contestHistory.length > 0 ? contestHistory : undefined,
        last_updated: new Date().toISOString(),
      },
      error: null,
    };
  }

  return {
    data: null,
    error: `Could not find AtCoder profile for "${cleanHandle}".`,
  };
}

/**
 * Helper to normalize Codewars stats.
 */
function normalizeCodewarsStats(json: any, username: string): CodewarsStats {
  let rawAvatar = json?.avatar || (json?.id ? `https://www.codewars.com/avatars/${json.id}` : null);
  if (rawAvatar && typeof rawAvatar === "string" && rawAvatar.startsWith("//")) {
    rawAvatar = `https:${rawAvatar}`;
  }

  if (json && typeof json === "object" && "honor" in json && "totalSolved" in json && "rank" in json) {
    return {
      username: json.username || username,
      name: json.name || null,
      clan: json.clan || null,
      avatar: rawAvatar || json.avatar || null,
      honor: typeof json.honor === "number" ? json.honor : 0,
      rank: json.rank || "Unranked",
      rankColor: json.rankColor || null,
      score: typeof json.score === "number" ? json.score : null,
      leaderboardPosition: typeof json.leaderboardPosition === "number" ? json.leaderboardPosition : null,
      totalSolved: typeof json.totalSolved === "number" ? json.totalSolved : 0,
      totalAuthored: typeof json.totalAuthored === "number" ? json.totalAuthored : null,
      languages: Array.isArray(json.languages) ? json.languages : null,
      badges: Array.isArray(json.badges) ? json.badges : null,
      recentChallenges: Array.isArray(json.recentChallenges) ? json.recentChallenges : undefined,
      profile_url: json.profile_url || `https://www.codewars.com/users/${encodeURIComponent(username)}`,
      last_updated: json.last_updated || new Date().toISOString(),
    };
  }

  const name = json?.name || null;
  const clan = json?.clan || null;
  const honor = typeof json?.honor === "number" ? json.honor : 0;
  const leaderboardPosition = typeof json?.leaderboardPosition === "number" ? json.leaderboardPosition : null;

  const overall = json?.ranks?.overall || {};
  const rank = overall.name || (json?.rank ? String(json.rank) : "Unranked");
  const rankColor = overall.color || null;
  const score = typeof overall.score === "number" ? overall.score : null;

  const codeChallenges = json?.codeChallenges || {};
  const totalSolved = typeof codeChallenges.totalCompleted === "number"
    ? codeChallenges.totalCompleted
    : (typeof json?.totalSolved === "number" ? json.totalSolved : 0);
  const totalAuthored = typeof codeChallenges.totalAuthored === "number" ? codeChallenges.totalAuthored : null;

  // Language Breakdown
  const languages: CodewarsLanguageStat[] = [];
  const langRanks = json?.ranks?.languages || {};
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

  return {
    username,
    name,
    clan,
    avatar: rawAvatar,
    honor,
    rank,
    rankColor,
    score,
    leaderboardPosition,
    totalSolved,
    totalAuthored,
    languages: languages.length > 0 ? languages : null,
    badges: null,
    profile_url: `https://www.codewars.com/users/${encodeURIComponent(username)}`,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetches Codewars public profile statistics using Supabase Edge Function with resilient direct fallbacks.
 */
export async function fetchCodewarsStats(usernameInput: string): Promise<{
  data: CodewarsStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "Codewars username is required" };
  }

  // Tier 0: Direct Supabase Edge Function `fetch-codewars`
  try {
    const edgeRes = await supabase.functions.invoke("fetch-codewars", {
      body: { username },
    });
    if (!edgeRes.error && edgeRes.data?.data) {
      const stats = normalizeCodewarsStats(edgeRes.data.data, username);
      return { data: stats, error: null };
    }
  } catch (edgeErr) {
    console.warn("[CodingProfileService] fetch-codewars Edge Function fallback:", edgeErr);
  }

  // Tier 1: Direct Codewars API
  try {
    const res = await fetch(`https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && (json.username || json.honor !== undefined || json.ranks)) {
        return {
          data: normalizeCodewarsStats(json, username),
          error: null,
        };
      }
    }
  } catch (err: any) {
    console.warn("Codewars API fetch error:", err?.message);
  }

  // Tier 2: Fallback via CORS proxy if direct fetch is blocked
  try {
    const corsRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}`)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (corsRes.ok) {
      const json = await corsRes.json();
      if (json && (json.username || json.honor !== undefined)) {
        return {
          data: normalizeCodewarsStats(json, username),
          error: null,
        };
      }
    }
  } catch { }

  return {
    data: null,
    error: `Could not fetch Codewars user "${username}". Please check the handle.`,
  };
}

/**
 * Gets coding profiles for a user, using database caching with a 24-hour TTL.
 */
export async function getCodingProfiles(
  userId: string,
  leetcodeUsernameInput?: string | null,
  codeforcesHandleInput?: string | null,
  githubUsernameInput?: string | null,
  githubTokenInput?: string | null,
  codechefUsernameInput?: string | null,
  codewarsUsernameInput?: string | null,
  geeksforgeeksUsernameInput?: string | null,
  atcoderUsernameInput?: string | null,
  hackerrankUsernameInput?: string | null,
  hackerearthUsernameInput?: string | null,
  huggingfaceUsernameInput?: string | null,
  chessUsernameInput?: string | null,
  credlyUsernameInput?: string | null,
  wakatimeUsernameInput?: string | null,
  wakatimeApiKeyInput?: string | null,
  forceRefresh = false
): Promise<CodingProfilesResponse> {
  const lcUsername = extractUsername(leetcodeUsernameInput);
  const cfHandle = extractUsername(codeforcesHandleInput);
  const ghUsername = extractUsername(githubUsernameInput);
  const ccUsername = extractUsername(codechefUsernameInput);
  const cwUsername = extractUsername(codewarsUsernameInput);
  const gfgUsername = extractUsername(geeksforgeeksUsernameInput);
  const atcoderUsername = extractUsername(atcoderUsernameInput);
  const hrUsername = extractUsername(hackerrankUsernameInput);
  const heUsername = extractUsername(hackerearthUsernameInput);
  const hfUsername = extractUsername(huggingfaceUsernameInput);
  const chessUsername = extractUsername(chessUsernameInput);
  const credlyUsername = extractCredlyUsername(credlyUsernameInput);
  const wakatimeUsername = extractWakaTimeUsername(wakatimeUsernameInput);

  const localCacheKey = `eduspace_coding_profile_cache_${userId}`;

  // Check Supabase database cache first (if user is authenticated)
  let dbCached: UserCodingProfilesRecord | null = null;
  if (userId) {
    try {
      const { data, error } = await (supabase as any)
        .from("user_coding_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        dbCached = data as UserCodingProfilesRecord;
      }
    } catch (err) {
      console.warn("Error reading user_coding_profiles from DB:", err);
    }
  }

  // Also check localStorage fallback cache
  let localCached: CodingProfilesResponse | null = null;
  try {
    const raw = localStorage.getItem(localCacheKey);
    if (raw) {
      localCached = JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }

  const ghToken =
    githubTokenInput?.trim() ||
    dbCached?.overall_data?.githubToken ||
    dbCached?.github_token ||
    localCached?.githubToken ||
    null;

  const now = Date.now();
  const cachedTime = dbCached?.last_fetched_at
    ? new Date(dbCached.last_fetched_at).getTime()
    : localCached?.lastFetchedAt
      ? new Date(localCached.lastFetchedAt).getTime()
      : 0;

  const isCacheValid = !forceRefresh && cachedTime > 0 && now - cachedTime < CACHE_TTL_MS;
  const cachedLc = dbCached?.leetcode_username || localCached?.leetcodeUsername || "";
  const cachedCf = dbCached?.codeforces_handle || localCached?.codeforcesHandle || "";
  const cachedGh = dbCached?.github_username || (dbCached?.overall_data as any)?.social_links?.github || localCached?.githubUsername || "";
  const cachedCc = dbCached?.codechef_username || (dbCached?.overall_data as any)?.social_links?.codechef || localCached?.codechefUsername || "";
  const cachedCw = dbCached?.codewars_username || (dbCached?.overall_data as any)?.social_links?.codewars || localCached?.codewarsUsername || "";
  const cachedGfg = dbCached?.geeksforgeeks_username || (dbCached?.overall_data as any)?.social_links?.geeksforgeeks || localCached?.geeksforgeeksUsername || "";
  const cachedAtcoder = dbCached?.atcoder_username || (dbCached?.overall_data as any)?.social_links?.atcoder || localCached?.atcoderUsername || "";
  const cachedHr = dbCached?.hackerrank_username || (dbCached?.overall_data as any)?.social_links?.hackerrank || localCached?.hackerrankUsername || "";
  const cachedHe = dbCached?.hackerearth_username || (dbCached?.overall_data as any)?.social_links?.hackerearth || localCached?.hackerearthUsername || "";
  const cachedHf = dbCached?.huggingface_username || localCached?.huggingfaceUsername || "";
  const cachedChess = dbCached?.chess_username || localCached?.chessUsername || "";
  const cachedCredly = (dbCached as any)?.credly_username || localCached?.credlyUsername || "";
  const cachedWakatime = (dbCached as any)?.wakatime_username || localCached?.wakatimeUsername || "";

  const usernameMatches =
    extractUsername(cachedLc).toLowerCase() === extractUsername(lcUsername).toLowerCase() &&
    extractUsername(cachedCf).toLowerCase() === extractUsername(cfHandle).toLowerCase() &&
    extractUsername(cachedGh).toLowerCase() === extractUsername(ghUsername).toLowerCase() &&
    extractUsername(cachedCc).toLowerCase() === extractUsername(ccUsername).toLowerCase() &&
    extractUsername(cachedCw).toLowerCase() === extractUsername(cwUsername).toLowerCase() &&
    extractUsername(cachedGfg).toLowerCase() === extractUsername(gfgUsername).toLowerCase() &&
    extractUsername(cachedAtcoder).toLowerCase() === extractUsername(atcoderUsername).toLowerCase() &&
    extractUsername(cachedHr).toLowerCase() === extractUsername(hrUsername).toLowerCase() &&
    extractUsername(cachedHe).toLowerCase() === extractUsername(heUsername).toLowerCase() &&
    extractUsername(cachedHf).toLowerCase() === extractUsername(hfUsername).toLowerCase() &&
    extractUsername(cachedChess).toLowerCase() === extractUsername(chessUsername).toLowerCase() &&
    extractCredlyUsername(cachedCredly).toLowerCase() === extractCredlyUsername(credlyUsername).toLowerCase() &&
    extractWakaTimeUsername(cachedWakatime).toLowerCase() === extractWakaTimeUsername(wakatimeUsername).toLowerCase();

  let connectedPlatforms = 0;
  if (lcUsername) connectedPlatforms++;
  if (cfHandle) connectedPlatforms++;
  if (ghUsername) connectedPlatforms++;
  if (ccUsername) connectedPlatforms++;
  if (cwUsername) connectedPlatforms++;
  if (gfgUsername) connectedPlatforms++;
  if (atcoderUsername) connectedPlatforms++;
  if (hrUsername) connectedPlatforms++;
  if (heUsername) connectedPlatforms++;
  if (hfUsername) connectedPlatforms++;
  if (chessUsername) connectedPlatforms++;
  if (credlyUsername) connectedPlatforms++;
  if (wakatimeUsername) connectedPlatforms++;

  const gfgNeedsFetch = Boolean(gfgUsername && !(dbCached?.geeksforgeeks_data?.codingScore || localCached?.geeksforgeeks?.codingScore || dbCached?.geeksforgeeks_data?.totalSolved || localCached?.geeksforgeeks?.totalSolved));
  const ccNeedsFetch = Boolean(ccUsername && !(dbCached?.codechef_data?.rating || localCached?.codechef?.rating || dbCached?.codechef_data?.totalSolved || localCached?.codechef?.totalSolved));
  const atcoderNeedsFetch = Boolean(atcoderUsername && !(dbCached?.atcoder_data?.rating || localCached?.atcoder?.rating || dbCached?.atcoder_data?.totalSolved || localCached?.atcoder?.totalSolved));
  const hrNeedsFetch = Boolean(hrUsername && !(dbCached?.hackerrank_data?.badges?.length || localCached?.hackerrank?.badges?.length || dbCached?.hackerrank_data?.certificates?.length || localCached?.hackerrank?.certificates?.length));
  const heNeedsFetch = Boolean(heUsername && !(dbCached?.hackerearth_data?.rating || localCached?.hackerearth?.rating || dbCached?.hackerearth_data?.totalSolved || localCached?.hackerearth?.totalSolved));

  // If cache is valid, usernames match, and no connected platform is stuck on zeroed cache, return cached stats
  if (isCacheValid && usernameMatches && !gfgNeedsFetch && !ccNeedsFetch && !atcoderNeedsFetch && !hrNeedsFetch && !heNeedsFetch) {
    const lcData = dbCached?.leetcode_data || localCached?.leetcode || null;
    let cfData = dbCached?.codeforces_data || localCached?.codeforces || null;
    if (cfData) {
      cfData = normalizeCodeforcesStats(cfData);
    }
    const ghData = dbCached?.github_data || localCached?.github || null;
    let ccData = dbCached?.codechef_data || localCached?.codechef || null;
    if (ccData) {
      ccData = normalizeCodeChefStats(ccData, ccUsername);
    }
    let cwData = dbCached?.codewars_data || localCached?.codewars || null;
    if (cwData) {
      cwData = normalizeCodewarsStats(cwData, cwUsername);
    }
    const gfgData = dbCached?.geeksforgeeks_data || localCached?.geeksforgeeks || null;
    const atcoderData = dbCached?.atcoder_data || localCached?.atcoder || null;
    const hrData = dbCached?.hackerrank_data || localCached?.hackerrank || null;
    const heData = dbCached?.hackerearth_data || localCached?.hackerearth || null;
    const hfData = dbCached?.huggingface_data || localCached?.huggingface || null;
    const chessData = dbCached?.chess_data || localCached?.chess || null;
    const credlyData = (dbCached as any)?.credly_data || localCached?.credly || null;
    const wakatimeData = (dbCached as any)?.wakatime_data || localCached?.wakatime || null;
    const overallTotal =
      (lcData?.totalSolved || 0) +
      (cfData?.totalSolved || 0) +
      (ccData?.totalSolved || 0) +
      (cwData?.totalSolved || 0) +
      (gfgData?.totalSolved || 0) +
      (atcoderData?.totalSolved || 0) +
      (hrData?.totalSolved || 0) +
      (heData?.totalSolved || 0);

    return {
      leetcode: lcData,
      codeforces: cfData,
      github: ghData,
      codechef: ccData,
      codewars: cwData,
      geeksforgeeks: gfgData,
      atcoder: atcoderData,
      hackerrank: hrData,
      hackerearth: heData,
      huggingface: hfData,
      chess: chessData,
      credly: credlyData,
      wakatime: wakatimeData,
      overall: { totalSolved: overallTotal, platformsConnectedCount: connectedPlatforms },
      lastFetchedAt: dbCached?.last_fetched_at || localCached?.lastFetchedAt || new Date().toISOString(),
      leetcodeError: dbCached?.leetcode_error || localCached?.leetcodeError || null,
      codeforcesError: dbCached?.codeforces_error || localCached?.codeforcesError || null,
      githubError: localCached?.githubError || null,
      codechefError: dbCached?.codechef_error || localCached?.codechefError || null,
      codewarsError: dbCached?.codewars_error || localCached?.codewarsError || null,
      geeksforgeeksError: dbCached?.geeksforgeeks_error || localCached?.geeksforgeeksError || null,
      atcoderError: dbCached?.atcoder_error || localCached?.atcoderError || null,
      hackerrankError: dbCached?.hackerrank_error || localCached?.hackerrankError || null,
      hackerearthError: dbCached?.hackerearth_error || localCached?.hackerearthError || null,
      huggingfaceError: dbCached?.huggingface_error || localCached?.huggingfaceError || null,
      chessError: dbCached?.chess_error || localCached?.chessError || null,
      credlyError: (dbCached as any)?.credly_error || localCached?.credlyError || null,
      wakatimeError: (dbCached as any)?.wakatime_error || localCached?.wakatimeError || null,
      leetcodeUsername: lcUsername,
      codeforcesHandle: cfHandle,
      githubUsername: ghUsername,
      githubToken: ghToken,
      codechefUsername: ccUsername,
      codewarsUsername: cwUsername,
      geeksforgeeksUsername: gfgUsername,
      atcoderUsername: atcoderUsername,
      hackerrankUsername: hrUsername,
      hackerearthUsername: heUsername,
      huggingfaceUsername: hfUsername,
      chessUsername: chessUsername,
      credlyUsername: credlyUsername,
      wakatimeUsername: wakatimeUsername,
      wakatimeApiKey: wakatimeApiKeyInput || null,
    };
  }

  // Fetch fresh stats from platforms in parallel
  const [lcResult, cfResult, ghResult, ccResult, cwResult, gfgResult, atcoderResult, hrResult, heResult, hfResult, chessResult, credlyResult, wakatimeResult] = await Promise.all([
    lcUsername ? fetchLeetCodeStats(lcUsername) : Promise.resolve({ data: null, error: null }),
    cfHandle ? fetchCodeforcesStats(cfHandle) : Promise.resolve({ data: null, error: null }),
    ghUsername || ghToken ? fetchGitHubStats(ghUsername || "", ghToken) : Promise.resolve({ data: null, error: null }),
    ccUsername ? fetchCodeChefStats(ccUsername) : Promise.resolve({ data: null, error: null }),
    cwUsername ? fetchCodewarsStats(cwUsername) : Promise.resolve({ data: null, error: null }),
    gfgUsername ? fetchGeeksForGeeksStats(gfgUsername) : Promise.resolve({ data: null, error: null }),
    atcoderUsername ? fetchAtCoderStats(atcoderUsername) : Promise.resolve({ data: null, error: null }),
    hrUsername ? fetchHackerRankStats(hrUsername) : Promise.resolve({ data: null, error: null }),
    heUsername ? fetchHackerEarthStats(heUsername) : Promise.resolve({ data: null, error: null }),
    hfUsername ? fetchHuggingFaceStats(hfUsername) : Promise.resolve({ data: null, error: null }),
    chessUsername ? fetchChessStats(chessUsername) : Promise.resolve({ data: null, error: null }),
    credlyUsername ? fetchCredlyStats(credlyUsername) : Promise.resolve({ data: null, error: null }),
    wakatimeUsername || wakatimeApiKeyInput ? fetchWakaTimeStats(wakatimeUsername, wakatimeApiKeyInput) : Promise.resolve({ data: null, error: null }),
  ]);

  let lcStats = lcResult.data;
  let cfStats = cfResult.data;
  let ghStats = ghResult.data;
  let ccStats = ccResult.data;
  let cwStats = cwResult.data;
  let gfgStats = gfgResult.data;
  let atcoderStats = atcoderResult.data;
  let hrStats = hrResult.data;
  let heStats = heResult.data;
  let hfStats = hfResult.data;
  let chessStats = chessResult.data;
  let credlyStats = credlyResult.data;
  let wakatimeStats = wakatimeResult.data;

  let lcErr = lcResult.error;
  let cfErr = cfResult.error;
  let ghErr = ghResult.error;
  let ccErr = ccResult.error;
  let cwErr = cwResult.error;
  let gfgErr = gfgResult.error;
  let atcoderErr = atcoderResult.error;
  let hrErr = hrResult.error;
  let heErr = heResult.error;
  let hfErr = hfResult.error;
  let chessErr = chessResult.error;
  let credlyErr = credlyResult.error;
  let wakatimeErr = wakatimeResult.error;

  // Fallback to cached data if network error occurred AND username matches
  const prevGh = dbCached?.github_data || localCached?.github;
  if (!ghStats && prevGh && extractUsername(prevGh.username) === ghUsername) {
    ghStats = prevGh;
    ghErr = null;
  }
  const prevLc = dbCached?.leetcode_data || localCached?.leetcode;
  if (!lcStats && prevLc && extractUsername(prevLc.username) === lcUsername) {
    lcStats = prevLc;
    lcErr = null;
  }
  const prevCf = dbCached?.codeforces_data || localCached?.codeforces;
  if (!cfStats && prevCf && extractUsername(prevCf.handle) === cfHandle) {
    cfStats = prevCf;
    cfErr = null;
  }
  const prevCc = dbCached?.codechef_data || localCached?.codechef;
  if (ccStats && prevCc && extractUsername(prevCc.username) === ccUsername) {
    if (!ccStats.avatar && prevCc.avatar) ccStats.avatar = prevCc.avatar;
    if (!ccStats.institution && prevCc.institution) ccStats.institution = prevCc.institution;
    if (!ccStats.studentOrProfessional && prevCc.studentOrProfessional) ccStats.studentOrProfessional = prevCc.studentOrProfessional;
    if ((!ccStats.contestsParticipated || ccStats.contestsParticipated === 0) && prevCc.contestsParticipated && prevCc.contestsParticipated > 0) {
      ccStats.contestsParticipated = prevCc.contestsParticipated;
    }
    if (!ccStats.dsaRating && prevCc.dsaRating) {
      ccStats.dsaRating = prevCc.dsaRating;
    }
    if ((!ccStats.badges || ccStats.badges.length === 0) && prevCc.badges && prevCc.badges.length > 0) {
      ccStats.badges = prevCc.badges;
    }
    if ((!ccStats.recentContests || ccStats.recentContests.length === 0) && prevCc.recentContests && prevCc.recentContests.length > 0) {
      ccStats.recentContests = prevCc.recentContests;
    }
  } else if (!ccStats && prevCc && extractUsername(prevCc.username) === ccUsername) {
    ccStats = prevCc;
    ccErr = null;
  }
  const prevCw = dbCached?.codewars_data || localCached?.codewars;
  if (!cwStats && prevCw && extractUsername(prevCw.username) === cwUsername) {
    cwStats = prevCw;
    cwErr = null;
  }
  const prevGfg = dbCached?.geeksforgeeks_data || localCached?.geeksforgeeks;
  if (!gfgStats && prevGfg && extractUsername(prevGfg.username) === gfgUsername) {
    gfgStats = prevGfg;
    gfgErr = null;
  }
  const prevAtcoder = dbCached?.atcoder_data || localCached?.atcoder;
  if (!atcoderStats && prevAtcoder && extractUsername(prevAtcoder.username) === atcoderUsername) {
    atcoderStats = prevAtcoder;
    atcoderErr = null;
  }
  const prevHr = dbCached?.hackerrank_data || localCached?.hackerrank;
  if (hrStats && prevHr && extractUsername(prevHr.username) === hrUsername) {
    if ((!hrStats.badges || hrStats.badges.length === 0) && prevHr.badges && prevHr.badges.length > 0) {
      hrStats.badges = prevHr.badges;
      hrStats.badgesCount = prevHr.badges.length;
    }
    if ((!hrStats.certificates || hrStats.certificates.length === 0) && prevHr.certificates && prevHr.certificates.length > 0) {
      hrStats.certificates = prevHr.certificates;
      hrStats.certificatesCount = prevHr.certificates.length;
    }
  } else if (!hrStats && prevHr && extractUsername(prevHr.username) === hrUsername) {
    hrStats = prevHr;
    hrErr = null;
  }

  const prevHe = dbCached?.hackerearth_data || localCached?.hackerearth;
  if (heStats && prevHe && extractUsername(prevHe.username) === heUsername) {
    if (!heStats.totalSolved && prevHe.totalSolved) heStats.totalSolved = prevHe.totalSolved;
    if (!heStats.solutionsSubmitted && prevHe.solutionsSubmitted) heStats.solutionsSubmitted = prevHe.solutionsSubmitted;
    if (!heStats.points && prevHe.points) heStats.points = prevHe.points;
    if (!heStats.rating && prevHe.rating) heStats.rating = prevHe.rating;
    if (!heStats.maxRating && prevHe.maxRating) heStats.maxRating = prevHe.maxRating;
    if (!heStats.contestsAttended && prevHe.contestsAttended) heStats.contestsAttended = prevHe.contestsAttended;
    if (!heStats.globalRank && prevHe.globalRank) heStats.globalRank = prevHe.globalRank;
    if (!heStats.company && prevHe.company) heStats.company = prevHe.company;
    if (!heStats.location && prevHe.location) heStats.location = prevHe.location;
    if (!heStats.skills?.length && prevHe.skills?.length) heStats.skills = prevHe.skills;
    if (!heStats.topPercentiles?.length && prevHe.topPercentiles?.length) heStats.topPercentiles = prevHe.topPercentiles;
    if (!heStats.badges?.length && prevHe.badges?.length) heStats.badges = prevHe.badges;
  } else if (!heStats && prevHe && extractUsername(prevHe.username) === heUsername) {
    heStats = prevHe;
    heErr = null;
  }

  const prevHf = dbCached?.huggingface_data || localCached?.huggingface;
  if (!hfStats && prevHf && extractUsername(prevHf.username) === hfUsername) {
    hfStats = prevHf;
    hfErr = null;
  }



  const prevChess = dbCached?.chess_data || localCached?.chess;
  if (!chessStats && prevChess && extractUsername(prevChess.username) === chessUsername) {
    chessStats = prevChess;
    chessErr = null;
  }

  const prevCredly = (dbCached as any)?.credly_data || localCached?.credly;
  if (!credlyStats && prevCredly && extractCredlyUsername(prevCredly.username) === credlyUsername) {
    credlyStats = prevCredly;
    credlyErr = null;
  }

  const prevWakatime = (dbCached as any)?.wakatime_data || localCached?.wakatime;
  if (!wakatimeStats && prevWakatime && extractWakaTimeUsername(prevWakatime.username) === wakatimeUsername) {
    wakatimeStats = prevWakatime;
    wakatimeErr = null;
  }

  const resolvedGhUsername = ghStats?.username || ghUsername;
  const overallTotal =
    (lcStats?.totalSolved || 0) +
    (cfStats?.totalSolved || 0) +
    (ccStats?.totalSolved || 0) +
    (cwStats?.totalSolved || 0) +
    (gfgStats?.totalSolved || 0) +
    (atcoderStats?.totalSolved || 0) +
    (hrStats?.totalSolved || 0) +
    (heStats?.totalSolved || 0);

  const fetchedAtIso = new Date().toISOString();

  const response: CodingProfilesResponse = {
    leetcode: lcStats,
    codeforces: cfStats,
    github: ghStats,
    codechef: ccStats,
    codewars: cwStats,
    geeksforgeeks: gfgStats,
    atcoder: atcoderStats,
    hackerrank: hrStats,
    hackerearth: heStats,
    huggingface: hfStats,
    chess: chessStats,
    credly: credlyStats,
    wakatime: wakatimeStats,
    overall: { totalSolved: overallTotal, platformsConnectedCount: connectedPlatforms },
    lastFetchedAt: fetchedAtIso,
    leetcodeError: lcErr,
    codeforcesError: cfErr,
    githubError: ghErr,
    codechefError: ccErr,
    codewarsError: cwErr,
    geeksforgeeksError: gfgErr,
    atcoderError: atcoderErr,
    hackerrankError: hrErr,
    hackerearthError: heErr,
    huggingfaceError: hfErr,
    chessError: chessErr,
    credlyError: credlyErr,
    wakatimeError: wakatimeErr,
    leetcodeUsername: lcUsername,
    codeforcesHandle: cfHandle,
    githubUsername: resolvedGhUsername,
    githubToken: ghToken,
    codechefUsername: ccUsername,
    codewarsUsername: cwUsername,
    geeksforgeeksUsername: gfgUsername,
    atcoderUsername: atcoderUsername,
    hackerrankUsername: hrUsername,
    hackerearthUsername: heUsername,
    huggingfaceUsername: hfUsername,
    chessUsername: chessUsername,
    credlyUsername: credlyUsername,
    wakatimeUsername: wakatimeUsername,
    wakatimeApiKey: wakatimeApiKeyInput || null,
  };

  if (userId) {
    await saveCodingProfilesCache(userId, response);
  }

  return response;
}

/**
 * Persists coding profiles data to localStorage and the Supabase database cache.
 */
export async function saveCodingProfilesCache(
  userId: string,
  profiles: CodingProfilesResponse
): Promise<void> {
  if (!userId || !profiles) return;

  const localCacheKey = `eduspace_coding_profile_cache_${userId}`;

  // Save to localStorage fallback
  try {
    localStorage.setItem(localCacheKey, JSON.stringify(profiles));
    localStorage.removeItem(`eduspace_github_token_${userId}`);
  } catch {
    // Ignore storage quota error
  }

  // Save/Upsert to Supabase database table
  const fetchedAtIso = new Date().toISOString();
  try {
    await (supabase as any).from("user_coding_profiles").upsert(
      {
        user_id: userId,
        leetcode_username: profiles.leetcodeUsername || null,
        codeforces_handle: profiles.codeforcesHandle || null,
        github_username: profiles.githubUsername || null,
        codechef_username: profiles.codechefUsername || null,
        codewars_username: profiles.codewarsUsername || null,
        geeksforgeeks_username: profiles.geeksforgeeksUsername || null,
        atcoder_username: profiles.atcoderUsername || null,
        hackerrank_username: profiles.hackerrankUsername || null,
        hackerearth_username: profiles.hackerearthUsername || null,
        huggingface_username: profiles.huggingfaceUsername || null,
        chess_username: profiles.chessUsername || null,
        credly_username: profiles.credlyUsername || null,
        wakatime_username: profiles.wakatimeUsername || null,
        leetcode_data: profiles.leetcode as any,
        codeforces_data: profiles.codeforces as any,
        github_data: profiles.github as any,
        codechef_data: profiles.codechef as any,
        codewars_data: profiles.codewars as any,
        geeksforgeeks_data: profiles.geeksforgeeks as any,
        atcoder_data: profiles.atcoder as any,
        hackerrank_data: profiles.hackerrank as any,
        hackerearth_data: profiles.hackerearth as any,
        huggingface_data: profiles.huggingface as any,
        chess_data: profiles.chess as any,
        credly_data: profiles.credly as any,
        wakatime_data: profiles.wakatime as any,
        overall_data: profiles.overall as any,
        leetcode_error: profiles.leetcodeError || null,
        codeforces_error: profiles.codeforcesError || null,
        codechef_error: profiles.codechefError || null,
        codewars_error: profiles.codewarsError || null,
        geeksforgeeks_error: profiles.geeksforgeeksError || null,
        atcoder_error: profiles.atcoderError || null,
        hackerrank_error: profiles.hackerrankError || null,
        hackerearth_error: profiles.hackerearthError || null,
        huggingface_error: profiles.huggingfaceError || null,
        chess_error: profiles.chessError || null,
        credly_error: profiles.credlyError || null,
        wakatime_error: profiles.wakatimeError || null,
        last_fetched_at: fetchedAtIso,
        updated_at: fetchedAtIso,
      },
      { onConflict: "user_id" }
    );
  } catch (upsertErr) {
    console.warn("Could not save coding profiles to database:", upsertErr);
  }
}
