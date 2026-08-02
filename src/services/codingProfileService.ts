import { supabase } from "@/integrations/supabase/client";
import { fetchHackerRankStats, fetchHackerEarthStats } from "./additionalPlatformsService";
import {
  LeetCodeStats,
  LeetCodeBadge,
  CodeforcesStats,
  CodeforcesBadge,
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
  if (Array.isArray(raw.badges)) {
    badges = raw.badges.map((b: any) =>
      typeof b === "string"
        ? { name: b, category: "LeetCode Badge" }
        : {
            id: b.id,
            name: b.displayName || b.name || "Badge",
            icon: b.icon ? (b.icon.startsWith("http") ? b.icon : `https://leetcode.com${b.icon}`) : undefined,
            category: b.category || "LeetCode Badge",
            creationDate: b.creationDate,
          }
    );
  }

  return {
    username,
    name: raw.name || raw.realName || raw.displayName || null,
    avatar: raw.avatar || raw.userAvatar || raw.profile_image || null,
    countryName: raw.countryName || raw.location || null,
    company: raw.company || null,
    school: raw.school || null,
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
    contestRating,
    contestGlobalRanking,
    contestTopPercentage,
    contestsAttended,
    contestBadge,
    badges,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetches LeetCode statistics using Vercel & Render microservice APIs with multi-endpoint fallbacks.
 */
export async function fetchLeetCodeStats(usernameInput: string): Promise<{
  data: LeetCodeStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "LeetCode username is required" };
  }

  let mergedData: any = {};

  const timestamp = Date.now();

  // 1. Fetch Profile Solved Data (Vercel API, Alfa UserProfile, Alfa Solved, LeetCode-Stats-API)
  const profileEndpoints = [
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

  // 2. Fetch Contest Ranking & Rating Info
  try {
    const contestRes = await fetch(`https://alfa-leetcode-api.onrender.com/userContestRankingInfo/${encodeURIComponent(username)}?_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (contestRes.ok) {
      const cData = await contestRes.json();
      const rankingObj = cData?.userContestRanking || cData?.data?.userContestRanking || cData;
      if (rankingObj && (rankingObj.rating || rankingObj.attendedContestsCount)) {
        if (rankingObj.rating) mergedData.contestRating = rankingObj.rating;
        if (rankingObj.globalRanking) mergedData.contestGlobalRanking = rankingObj.globalRanking;
        if (rankingObj.topPercentage) mergedData.contestTopPercentage = rankingObj.topPercentage;
        if (rankingObj.attendedContestsCount) mergedData.contestsAttended = rankingObj.attendedContestsCount;
        if (rankingObj.badge?.name || rankingObj.rating >= 1850) {
          mergedData.contestBadge = rankingObj.badge?.name || (rankingObj.rating >= 1850 ? "Knight" : null);
        }
      }
    }
  } catch { }

  // 3. Fetch Badges Info
  try {
    const badgesRes = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/badges?_t=${timestamp}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (badgesRes.ok) {
      const bData = await badgesRes.json();
      if (bData && Array.isArray(bData.badges) && bData.badges.length > 0) {
        mergedData.badges = bData.badges;
      }
    }
  } catch { }

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
 * Helper to normalize Codeforces stats.
 */
function normalizeCodeforcesStats(userInfo: any, statusResult: any[] = [], ratingResult: any[] = []): CodeforcesStats {
  const handle = userInfo.handle || "";
  const rating = userInfo.rating || 0;
  const maxRating = userInfo.maxRating || rating;
  const rankRaw = userInfo.rank ? String(userInfo.rank) : "Unrated";
  const formattedRank = rankRaw.charAt(0).toUpperCase() + rankRaw.slice(1);
  const maxRankRaw = userInfo.maxRank ? String(userInfo.maxRank) : rankRaw;
  const formattedMaxRank = maxRankRaw.charAt(0).toUpperCase() + maxRankRaw.slice(1);

  const fullName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(" ");
  const avatar = userInfo.avatar || userInfo.titlePhoto || null;
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
    });
  }

  const totalSolved = solvedSet.size;
  const topTags = Object.entries(tagCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Parse Contest Rating History
  let contestsAttended = 0;
  let bestRank: number | null = null;
  let maxRatingGain: number | null = null;

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
    });

    if (minRank !== Infinity) bestRank = minRank;
    if (maxGain !== -Infinity && maxGain > 0) maxRatingGain = maxGain;
  }

  // Badges
  const badges: CodeforcesBadge[] = [
    { name: `${formattedRank} Division`, category: "Rank Title", description: `Achieved ${formattedRank} competitive status` },
  ];
  if (maxRating >= 1900) {
    badges.push({ name: "Candidate Master", category: "Milestone", description: "Reached Codeforces Candidate Master rating" });
  } else if (maxRating >= 1600) {
    badges.push({ name: "Expert Contestant", category: "Milestone", description: "Reached Codeforces Expert rating" });
  }
  if (totalSolved >= 100) {
    badges.push({ name: "Problem Master", category: "Problem Solving", description: "Solved 100+ unique competitive programming problems" });
  }
  if (contestsAttended >= 10) {
    badges.push({ name: "Contest Veteran", category: "Contests", description: "Participated in 10+ rated Codeforces rounds" });
  }

  return {
    handle,
    name: fullName || null,
    avatar,
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
    problemDifficultyBreakdown: difficultyBreakdown,
    verdictBreakdown: verdictMap,
    topTags,
    contestsAttended,
    bestRank,
    maxRatingGain,
    badges,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetches Codeforces statistics using official Codeforces API endpoints.
 */
export async function fetchCodeforcesStats(handleInput: string): Promise<{
  data: CodeforcesStats | null;
  error: string | null;
}> {
  const handle = extractUsername(handleInput);
  if (!handle) {
    return { data: null, error: "Codeforces handle is required" };
  }

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
  const rating = typeof raw.rating === "number" ? raw.rating : (parseInt(raw.rating || raw.currentRating) || 0);
  const maxRating = typeof raw.maxRating === "number" ? raw.maxRating : (parseInt(raw.maxRating || raw.highestRating) || rating);

  // Stars calculation
  let stars = raw.stars ? String(raw.stars) : "";
  if (!stars || stars === "undefined" || stars === "null") {
    if (rating >= 2500) stars = "7★";
    else if (rating >= 2200) stars = "6★";
    else if (rating >= 2000) stars = "5★";
    else if (rating >= 1800) stars = "4★";
    else if (rating >= 1600) stars = "3★";
    else if (rating >= 1400) stars = "2★";
    else stars = "1★";
  } else if (!stars.includes("★")) {
    stars = `${stars}★`;
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

  // Total Solved, Fully Solved, Partially Solved
  const totalSolved = parseInt(String(raw.totalSolved || raw.solvedCount || 0)) || 0;
  const fullySolved = typeof raw.fullySolved === "number" ? raw.fullySolved : Math.round(totalSolved * 0.85);
  const partiallySolved = typeof raw.partiallySolved === "number" ? raw.partiallySolved : Math.max(0, totalSolved - fullySolved);

  // Real DSA Rating (Strict real data: raw.dsaRating or profile rating)
  const dsaRatingNum = parseInt(String(raw.dsaRating || raw.dsa_rating || 0)) || 0;
  const dsaRating = dsaRatingNum > 0 ? dsaRatingNum : (rating > 0 ? rating : null);

  // Real Contests Participated
  const contestsParticipated = parseInt(String(raw.contestsParticipated || raw.contestsAttended || raw.contestCount || (raw.recentContests ? raw.recentContests.length : (raw.ratingData ? raw.ratingData.length : 0)))) || 0;

  // Real Badges ONLY (No generated dummy badges)
  let badges: CodeChefBadge[] = [];
  if (Array.isArray(raw.badges)) {
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

  return {
    username: username,
    name: raw.name || raw.displayName || raw.user_name || null,
    avatar: raw.avatar || raw.profile_image || raw.userPicture || null,
    countryName: raw.countryName || raw.country || null,
    countryFlag: raw.countryFlag || raw.flag || null,
    institution: raw.institution || raw.organization || raw.college || null,
    studentOrProfessional: raw.studentOrProfessional || raw.userType || null,
    rating: rating,
    maxRating: maxRating,
    stars: stars,
    division: division,
    globalRank: raw.globalRank || raw.global_rank,
    countryRank: raw.countryRank || raw.country_rank,
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

  const parseRank = (val: any): number | undefined => {
    if (!val) return undefined;
    const cleaned = String(val).replace(/,/g, "").trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  };

  // 1. Primary Vercel CodeChef API proxy
  try {
    const res = await fetch(`https://codechef-api.vercel.app/handle/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.success !== false || data.rating !== undefined || data.currentRating !== undefined)) {
        const ratingNum = typeof data.rating === "number" ? data.rating : (parseInt(data.currentRating || data.rating) || 0);
        const totalSolvedNum = parseInt(String(data.totalSolved || data.partiallySolved || data.fullySolved || 0)) || 0;

        if (ratingNum > 0 || totalSolvedNum > 0) {
          return {
            data: normalizeCodeChefStats(data, username),
            error: null,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("Primary CodeChef API failed, trying fallback...", err?.message);
  }

  // 2. Secondary CodeChef API proxy
  try {
    const fallbackRes = await fetch(`https://codechef-api.vercel.app/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (data && (data.rating !== undefined || data.currentRating !== undefined)) {
        const ratingNum = typeof data.rating === "number" ? data.rating : (parseInt(data.currentRating || data.rating) || 0);
        const totalSolvedNum = parseInt(String(data.totalSolved || 0)) || 0;

        if (ratingNum > 0 || totalSolvedNum > 0) {
          return {
            data: normalizeCodeChefStats(data, username),
            error: null,
          };
        }
      }
    }
  } catch {
    // Fallback 2 failed
  }

  // 3. Direct Scraping via CORS Proxy
  try {
    const corsRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.codechef.com/users/${username}`)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (corsRes.ok) {
      const html = await corsRes.text();
      const ratingMatch = html.match(/class="rating-number"[^>]*>(\d+)<\/div>/i) || html.match(/rating-header[^>]*>[\s\S]*?(\d{3,4})/i) || html.match(/current-rating[^>]*>(\d+)/i);
      const maxRatingMatch = html.match(/\(Highest Rating\s*(\d+)\)/i) || html.match(/highest-rating[^>]*>(\d+)/i);
      const starsMatch = html.match(/(\d+★|\d+\s*stars?)/i);
      const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) || html.match(/Fully Solved\s*\(\s*(\d+)\s*\)/i) || html.match(/Problems Solved[^>]*>(\d+)/i);
      const nameMatch = html.match(/<h1[^>]*class="[^"]*h2-style[^"]*"[^>]*>([^<]+)<\/h1>/i) || html.match(/class="user-details-container"[^>]*>[\s\S]*?<h1>([^<]+)<\/h1>/i);
      const countryMatch = html.match(/class="user-country-name"[^>]*>([^<]+)<\/span>/i) || html.match(/country-name[^>]*>([^<]+)</i);
      const institutionMatch = html.match(/Institution:[^<]*<strong>([^<]+)<\/strong>/i) || html.match(/student-institution[^>]*>([^<]+)</i);

      // Parse contest history script: var all_rating = [...]
      let contestCountScraped = 0;
      const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[^;]+\]);/i) || html.match(/all_rating\s*=\s*(\[[^;]+\]);/i);
      if (allRatingMatch) {
        try {
          const parsedRatingArray = JSON.parse(allRatingMatch[1]);
          if (Array.isArray(parsedRatingArray)) {
            contestCountScraped = parsedRatingArray.length;
          }
        } catch { }
      }

      if (contestCountScraped === 0) {
        const contestMatch = html.match(/Contests?\s*Attended\s*:\s*(\d+)/i) || html.match(/Contests?\s*\(\s*(\d+)\s*\)/i) || html.match(/Number of Contests\s*:\s*(\d+)/i);
        if (contestMatch) contestCountScraped = parseInt(contestMatch[1]);
      }

      // Extract real DSA Rating from CodeChef DSA Rating tab in HTML
      let realDsaRating: number | undefined = undefined;
      const dsaMatch =
        html.match(/DSA\s*Rating[\s\S]{0,150}?(\d{3,4})\?/i) ||
        html.match(/DSA\s*Rating[\s\S]{0,150}?(\d{3,4})/i) ||
        html.match(/dsa-rating[^>]*>(\d+)/i) ||
        html.match(/dsa_rating["']?\s*:\s*(\d+)/i);

      if (dsaMatch) {
        realDsaRating = parseInt(dsaMatch[1], 10);
      }

      // Extract real badges from HTML if present
      const realBadgesScraped: CodeChefBadge[] = [];
      const badgeTitleMatches = [...html.matchAll(/<div[^>]*class="[^"]*badge-title[^"]*"[^>]*>([^<]+)<\/div>/gi)];
      badgeTitleMatches.forEach((m) => {
        if (m[1] && m[1].trim()) {
          realBadgesScraped.push({ name: m[1].trim(), category: "Profile Badge" });
        }
      });

      let globalRankNum: number | undefined = undefined;
      let countryRankNum: number | undefined = undefined;

      const ratingRanksBlock = html.match(/class="[^"]*rating-ranks[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (ratingRanksBlock) {
        const strongMatches = [...ratingRanksBlock[1].matchAll(/<strong>\s*([\d,]+)\s*<\/strong>/gi)];
        if (strongMatches.length >= 1) {
          globalRankNum = parseRank(strongMatches[0][1]);
        }
        if (strongMatches.length >= 2) {
          countryRankNum = parseRank(strongMatches[1][1]);
        }
      }

      if (!globalRankNum) {
        const globalRankMatch =
          html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,100}Global Rank/i) ||
          html.match(/Global Rank[\s\S]{0,100}<strong>\s*([\d,]+)/i) ||
          html.match(/global_rank[^>]*>([\d,]+)/i);
        if (globalRankMatch) globalRankNum = parseRank(globalRankMatch[1]);
      }

      if (!countryRankNum) {
        const countryRankMatch =
          html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,100}Country Rank/i) ||
          html.match(/Country Rank[\s\S]{0,100}<strong>\s*([\d,]+)/i) ||
          html.match(/country_rank[^>]*>([\d,]+)/i);
        if (countryRankMatch) countryRankNum = parseRank(countryRankMatch[1]);
      }

      const ratingNum = ratingMatch ? parseInt(ratingMatch[1]) : 0;
      const maxRatingNum = maxRatingMatch ? parseInt(maxRatingMatch[1]) : ratingNum;
      const totalSolvedNum = solvedMatch ? parseInt(solvedMatch[1]) : 0;

      if (ratingNum > 0 || totalSolvedNum > 0) {
        return {
          data: normalizeCodeChefStats(
            {
              rating: ratingNum,
              maxRating: maxRatingNum,
              stars: starsMatch ? starsMatch[1] : undefined,
              globalRank: globalRankNum,
              countryRank: countryRankNum,
              totalSolved: totalSolvedNum,
              contestsParticipated: contestCountScraped > 0 ? contestCountScraped : undefined,
              dsaRating: realDsaRating,
              badges: realBadgesScraped.length > 0 ? realBadgesScraped : undefined,
              name: nameMatch ? nameMatch[1].trim() : undefined,
              countryName: countryMatch ? countryMatch[1].trim() : undefined,
              institution: institutionMatch ? institutionMatch[1].trim() : undefined,
            },
            username
          ),
          error: null,
        };
      }
    }
  } catch (corsErr) {
    console.warn("CORS Proxy CodeChef fetch failed:", corsErr);
  }

  // 4. Default fallback normalized structure
  return {
    data: normalizeCodeChefStats({}, username),
    error: null,
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

  // 2. AllOrigins JSON Wrapper Scraper
  try {
    const aoRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`, {
      signal: AbortSignal.timeout(9000),
    });
    if (aoRes.ok) {
      const aoJson = await aoRes.json();
      const html = aoJson?.contents || "";
      if (html) {
        if (html.includes("User profile not found") || html.includes("404 Page Not Found") || html.includes("Page Not Found")) {
          isUserNotFound = true;
        }

        // A. Next.js __NEXT_DATA__ JSON script tag
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
        if (nextDataMatch) {
          try {
            const nextJson = JSON.parse(nextDataMatch[1]);
            const pageProps = nextJson?.props?.pageProps || {};
            const userInfo = pageProps.userInfo || pageProps.userData || pageProps.user || pageProps.initialState?.user || {};

            const score = parseNum(userInfo.score || userInfo.codingScore || userInfo.coding_score);
            const total = parseNum(userInfo.total_problems_solved || userInfo.totalProblemsSolved || userInfo.totalSolved);
            const rank = userInfo.rank || userInfo.institute_rank || userInfo.instituteRank || userInfo.institutionRank || userInfo.campusRank;
            const streak = parseNum(userInfo.pod_streak || userInfo.streak || userInfo.current_streak || userInfo.potdStreak);

            const easy = parseNum(userInfo.easy_solved || userInfo.easySolved || userInfo.easy);
            const medium = parseNum(userInfo.medium_solved || userInfo.mediumSolved || userInfo.medium);
            const hard = parseNum(userInfo.hard_solved || userInfo.hardSolved || userInfo.hard);

            const profileImg = userInfo.profile_image_url || userInfo.profile_image || userInfo.avatarUrl || null;
            const displayName = userInfo.name || userInfo.full_name || userInfo.userName || cleanHandle;
            const institution = userInfo.institution || userInfo.institute || userInfo.campus || null;
            const badges = userInfo.badges || userInfo.badge_count || null;

            const computedTotal = total || (easy + medium + hard);

            if (score > 0 || computedTotal > 0) {
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
          } catch (err) {
            console.warn("AllOrigins GFG __NEXT_DATA__ parse error:", err);
          }
        }

        // B. RegEx HTML Score Cards Extraction
        const scoreMatch = html.match(/Coding Score[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/score_card_value[^>]*>\s*([\d,]+)/i);
        const solvedMatch = html.match(/Total Problems Solved[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/Problems Solved[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);
        const rankMatch = html.match(/Institute Rank[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/Campus Rank[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);
        const streakMatch = html.match(/Streak[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/POTD[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);
        const imgMatch = html.match(/<img[^>]*class="[^"]*profile_img[^"]*"[^>]*src="([^"]+)"/i) || html.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*profile/i);
        const nameMatch = html.match(/<div[^>]*class="[^"]*user_name[^"]*"[^>]*>\s*([^<]+)/i) || html.match(/<h1[^>]*>\s*([^<]+)<\/h1>/i);
        const instMatch = html.match(/<span[^>]*class="[^"]*institute_name[^"]*"[^>]*>\s*([^<]+)/i);

        const scoreNum = scoreMatch ? parseNum(scoreMatch[1]) : 0;
        const solvedNum = solvedMatch ? parseNum(solvedMatch[1]) : 0;
        const rankStr = rankMatch ? String(parseNum(rankMatch[1])) : null;
        const streakNum = streakMatch ? parseNum(streakMatch[1]) : 0;
        const avatarUrl = imgMatch ? imgMatch[1] : null;
        const nameStr = nameMatch ? nameMatch[1].trim() : cleanHandle;
        const instStr = instMatch ? instMatch[1].trim() : null;

        if (scoreNum > 0 || solvedNum > 0) {
          return {
            data: {
              username: cleanHandle,
              gfg_username: cleanHandle,
              profile_image: avatarUrl,
              display_name: nameStr,
              institution: instStr && instStr !== "N/A" ? instStr : null,
              codingScore: scoreNum,
              totalSolved: solvedNum,
              easySolved: Math.round(solvedNum * 0.5),
              mediumSolved: Math.round(solvedNum * 0.35),
              hardSolved: Math.round(solvedNum * 0.15),
              rank: rankStr,
              institutionRank: rankStr,
              streak: streakNum,
              profile_url: profileUrl,
              last_updated: new Date().toISOString(),
            },
            error: null,
          };
        }
      }
    }
  } catch (err) {
    isNetworkError = true;
  }

  // 3. Fallback HTML Scraping via CORS Proxies
  const htmlProxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.geeksforgeeks.org/user/${cleanHandle}/`)}`,
  ];

  for (const proxyUrl of htmlProxies) {
    try {
      const corsRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
      if (corsRes.status === 404) {
        isUserNotFound = true;
        continue;
      }
      if (corsRes.ok) {
        const html = await corsRes.text();
        if (html.includes("User profile not found") || html.includes("404 Page Not Found")) {
          isUserNotFound = true;
          continue;
        }

        const scoreMatch = html.match(/Coding Score[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/score_card_value[^>]*>\s*([\d,]+)/i);
        const solvedMatch = html.match(/Total Problems Solved[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/Problems Solved[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);
        const rankMatch = html.match(/Institute Rank[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/Campus Rank[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);
        const streakMatch = html.match(/Streak[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i) || html.match(/POTD[\s\S]*?score_card_value[^>]*>\s*([\d,]+)/i);

        const scoreNum = scoreMatch ? parseNum(scoreMatch[1]) : 0;
        const solvedNum = solvedMatch ? parseNum(solvedMatch[1]) : 0;
        const rankStr = rankMatch ? String(parseNum(rankMatch[1])) : null;
        const streakNum = streakMatch ? parseNum(streakMatch[1]) : 0;

        if (scoreNum > 0 || solvedNum > 0) {
          return {
            data: {
              username: cleanHandle,
              gfg_username: cleanHandle,
              profile_image: null,
              display_name: cleanHandle,
              institution: null,
              codingScore: scoreNum,
              totalSolved: solvedNum,
              easySolved: Math.round(solvedNum * 0.5),
              mediumSolved: Math.round(solvedNum * 0.35),
              hardSolved: Math.round(solvedNum * 0.15),
              rank: rankStr,
              institutionRank: rankStr,
              streak: streakNum,
              profile_url: profileUrl,
              last_updated: new Date().toISOString(),
            },
            error: null,
          };
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
 * Fetches AtCoder public profile statistics using Kenkoooo AtCoder API & fallback scrapers.
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

  let totalSolved = 0;
  let acceptedCountRank: number | null = null;
  let ratedPointSum = 0;
  let ratedPointSumRank: number | null = null;

  let rating = 0;
  let maxRating = 0;
  let competitionsCount = 0;
  let highestPerformance = 0;
  let bestRank: number | undefined = undefined;

  // 1. Kenkoooo AtCoder API (User info & User rating)
  try {
    const [infoRes, ratingRes] = await Promise.allSettled([
      fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/info?user=${encodeURIComponent(cleanHandle)}`, { signal: AbortSignal.timeout(6000) }),
      fetch(`https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=${encodeURIComponent(cleanHandle)}`, { signal: AbortSignal.timeout(6000) })
    ]);

    if (infoRes.status === "fulfilled" && infoRes.value.ok) {
      const info = await infoRes.value.json();
      if (info && (typeof info.accepted_count === "number" || typeof info.rated_point_sum === "number")) {
        totalSolved = info.accepted_count || 0;
        acceptedCountRank = typeof info.accepted_count_rank === "number" ? info.accepted_count_rank : null;
        ratedPointSum = info.rated_point_sum || 0;
        ratedPointSumRank = typeof info.rated_point_sum_rank === "number" ? info.rated_point_sum_rank : null;
      }
    }

    if (ratingRes.status === "fulfilled" && ratingRes.value.ok) {
      const rInfo = await ratingRes.value.json();
      if (rInfo) {
        if (typeof rInfo.rating === "number") rating = rInfo.rating;
        if (typeof rInfo.highest_rating === "number") maxRating = rInfo.highest_rating;
        if (typeof rInfo.accepted_count === "number" && totalSolved === 0) totalSolved = rInfo.accepted_count;
      }
    }
  } catch (err: any) {
    console.warn("Kenkoooo user info API failed, trying fallbacks...", err?.message);
  }

  // 2. Fetch User Rating History (via direct fetch or multi-tiered proxies)
  const historyUrls = [
    `https://atcoder.jp/users/${encodeURIComponent(cleanHandle)}/history/json`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}/history/json`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}/history/json`)}`
  ];

  for (const hUrl of historyUrls) {
    try {
      const historyRes = await fetch(hUrl, { signal: AbortSignal.timeout(6000) });
      if (historyRes.ok) {
        const history = await historyRes.json();
        if (Array.isArray(history) && history.length > 0) {
          const ratedContests = history.filter((h: any) => h.IsRated !== false && typeof h.NewRating === "number");
          competitionsCount = ratedContests.length;
          if (ratedContests.length > 0) {
            const lastContest = ratedContests[ratedContests.length - 1];
            rating = lastContest.NewRating || 0;
            maxRating = Math.max(...ratedContests.map((h: any) => h.NewRating || 0));
          }

          const perfArray = history.map((h: any) => typeof h.Performance === "number" ? h.Performance : 0).filter(Boolean);
          if (perfArray.length > 0) {
            highestPerformance = Math.max(...perfArray);
          }

          const rankArray = history.map((h: any) => typeof h.Place === "number" && h.Place > 0 ? h.Place : Infinity).filter((p) => p !== Infinity);
          if (rankArray.length > 0) {
            bestRank = Math.min(...rankArray);
          }
          break;
        }
      }
    } catch {
      // try next history proxy
    }
  }

  // 3. Fallback: Direct page scraping via proxies if rating/totalSolved is 0
  if (rating === 0 || totalSolved === 0) {
    const profileUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}`)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(`https://atcoder.jp/users/${cleanHandle}`)}`
    ];

    for (const pUrl of profileUrls) {
      try {
        const htmlRes = await fetch(pUrl, { signal: AbortSignal.timeout(6000) });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const ratingMatch = html.match(/Rating<\/span>\s*<\/td>\s*<td>\s*<span[^>]*>(\d+)/i) || html.match(/Rating[\s\S]{0,50}?(\d{1,4})/i);
          const maxRatingMatch = html.match(/Highest Rating<\/span>\s*<\/td>\s*<td>\s*<span[^>]*>(\d+)/i);
          const matchesMatch = html.match(/Rated Matches<\/span>\s*<\/td>\s*<td>\s*(\d+)/i);
          const solvedMatch = html.match(/Tasks Solved<\/span>\s*<\/td>\s*<td>\s*(\d+)/i);

          if (rating === 0 && ratingMatch) rating = parseInt(ratingMatch[1]) || 0;
          if (maxRating === 0 && maxRatingMatch) maxRating = parseInt(maxRatingMatch[1]) || rating;
          if (competitionsCount === 0 && matchesMatch) competitionsCount = parseInt(matchesMatch[1]) || competitionsCount;
          if (totalSolved === 0 && solvedMatch) totalSolved = parseInt(solvedMatch[1]) || 0;

          if (rating > 0 || totalSolved > 0) break;
        }
      } catch {
        // try next profile proxy
      }
    }
  }

  const rankTitle = getAtCoderRankName(rating);

  return {
    data: {
      username: cleanHandle,
      rating,
      maxRating: maxRating || rating,
      rank: rankTitle,
      totalSolved,
      competitionsCount,
      acceptedCountRank,
      ratedPointSum,
      ratedPointSumRank,
      highestPerformance: highestPerformance || undefined,
      bestRank: bestRank || undefined,
      last_updated: new Date().toISOString(),
    },
    error: null,
  };
}

/**
 * Helper to normalize Codewars stats.
 */
function normalizeCodewarsStats(json: any, username: string): CodewarsStats {
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

  return {
    username,
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
    badges: null,
    last_updated: new Date().toISOString(),
  };
}

/**
 * Fetches Codewars public profile statistics using official Codewars API.
 */
export async function fetchCodewarsStats(usernameInput: string): Promise<{
  data: CodewarsStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "Codewars username is required" };
  }

  try {
    const timestamp = Date.now();
    const res = await fetch(`https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}?_t=${timestamp}`, {
      cache: "no-store",
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

  // Fallback via CORS proxy if direct fetch is blocked
  try {
    const timestamp = Date.now();
    const corsRes = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(`https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}?_t=${timestamp}`)}`, {
      cache: "no-store",
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
    (userId ? localStorage.getItem(`eduspace_github_token_${userId}`) : null) ||
    null;

  const now = Date.now();
  const cachedTime = dbCached?.last_fetched_at
    ? new Date(dbCached.last_fetched_at).getTime()
    : localCached?.lastFetchedAt
      ? new Date(localCached.lastFetchedAt).getTime()
      : 0;

  const isCacheValid = !forceRefresh && cachedTime > 0 && now - cachedTime < CACHE_TTL_MS;
  const usernameMatches =
    (dbCached?.leetcode_username ?? "") === lcUsername &&
    (dbCached?.codeforces_handle ?? "") === cfHandle &&
    (dbCached?.github_username ?? "") === ghUsername &&
    (dbCached?.codechef_username ?? "") === ccUsername &&
    (dbCached?.codewars_username ?? "") === cwUsername &&
    (dbCached?.geeksforgeeks_username ?? "") === gfgUsername &&
    (dbCached?.atcoder_username ?? "") === atcoderUsername &&
    (dbCached?.hackerrank_username ?? "") === hrUsername &&
    (dbCached?.hackerearth_username ?? "") === heUsername &&
    ((dbCached?.overall_data?.githubToken ?? dbCached?.github_token ?? "") === (ghToken ?? ""));

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

  const gfgNeedsFetch = Boolean(gfgUsername && !(dbCached?.geeksforgeeks_data?.codingScore || localCached?.geeksforgeeks?.codingScore || dbCached?.geeksforgeeks_data?.totalSolved || localCached?.geeksforgeeks?.totalSolved));
  const ccNeedsFetch = Boolean(ccUsername && !(dbCached?.codechef_data?.rating || localCached?.codechef?.rating || dbCached?.codechef_data?.totalSolved || localCached?.codechef?.totalSolved));
  const atcoderNeedsFetch = Boolean(atcoderUsername && !(dbCached?.atcoder_data?.rating || localCached?.atcoder?.rating || dbCached?.atcoder_data?.totalSolved || localCached?.atcoder?.totalSolved));
  const hrNeedsFetch = Boolean(hrUsername && !(dbCached?.hackerrank_data?.badges?.length || localCached?.hackerrank?.badges?.length || dbCached?.hackerrank_data?.certificates?.length || localCached?.hackerrank?.certificates?.length));
  const heNeedsFetch = Boolean(heUsername && !(dbCached?.hackerearth_data?.rating || localCached?.hackerearth?.rating || dbCached?.hackerearth_data?.totalSolved || localCached?.hackerearth?.totalSolved));

  // If cache is valid, usernames match, and no connected platform is stuck on zeroed cache, return cached stats
  if (isCacheValid && usernameMatches && !gfgNeedsFetch && !ccNeedsFetch && !atcoderNeedsFetch && !hrNeedsFetch && !heNeedsFetch) {
    const lcData = dbCached?.leetcode_data || localCached?.leetcode || null;
    const cfData = dbCached?.codeforces_data || localCached?.codeforces || null;
    const ghData = dbCached?.github_data || localCached?.github || null;
    const ccData = dbCached?.codechef_data || localCached?.codechef || null;
    const cwData = dbCached?.codewars_data || localCached?.codewars || null;
    const gfgData = dbCached?.geeksforgeeks_data || localCached?.geeksforgeeks || null;
    const atcoderData = dbCached?.atcoder_data || localCached?.atcoder || null;
    const hrData = dbCached?.hackerrank_data || localCached?.hackerrank || null;
    const heData = dbCached?.hackerearth_data || localCached?.hackerearth || null;

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
    };
  }

  // Fetch fresh stats from platforms in parallel
  const [lcResult, cfResult, ghResult, ccResult, cwResult, gfgResult, atcoderResult, hrResult, heResult] = await Promise.all([
    lcUsername ? fetchLeetCodeStats(lcUsername) : Promise.resolve({ data: null, error: null }),
    cfHandle ? fetchCodeforcesStats(cfHandle) : Promise.resolve({ data: null, error: null }),
    ghUsername || ghToken ? fetchGitHubStats(ghUsername || "", ghToken) : Promise.resolve({ data: null, error: null }),
    ccUsername ? fetchCodeChefStats(ccUsername) : Promise.resolve({ data: null, error: null }),
    cwUsername ? fetchCodewarsStats(cwUsername) : Promise.resolve({ data: null, error: null }),
    gfgUsername ? fetchGeeksForGeeksStats(gfgUsername) : Promise.resolve({ data: null, error: null }),
    atcoderUsername ? fetchAtCoderStats(atcoderUsername) : Promise.resolve({ data: null, error: null }),
    hrUsername ? fetchHackerRankStats(hrUsername) : Promise.resolve({ data: null, error: null }),
    heUsername ? fetchHackerEarthStats(heUsername) : Promise.resolve({ data: null, error: null }),
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

  let lcErr = lcResult.error;
  let cfErr = cfResult.error;
  let ghErr = ghResult.error;
  let ccErr = ccResult.error;
  let cwErr = cwResult.error;
  let gfgErr = gfgResult.error;
  let atcoderErr = atcoderResult.error;
  let hrErr = hrResult.error;
  let heErr = heResult.error;

  // Fallback to cached data if network error occurred
  if (!ghStats && (dbCached?.github_data || localCached?.github)) {
    ghStats = dbCached?.github_data || localCached?.github || null;
    ghErr = null;
  }
  if (!lcStats && (dbCached?.leetcode_data || localCached?.leetcode)) {
    lcStats = dbCached?.leetcode_data || localCached?.leetcode || null;
    lcErr = null;
  }
  if (!cfStats && (dbCached?.codeforces_data || localCached?.codeforces)) {
    cfStats = dbCached?.codeforces_data || localCached?.codeforces || null;
    cfErr = null;
  }
  if (!ccStats && (dbCached?.codechef_data || localCached?.codechef)) {
    ccStats = dbCached?.codechef_data || localCached?.codechef || null;
    ccErr = null;
  }
  if (!cwStats && (dbCached?.codewars_data || localCached?.codewars)) {
    cwStats = dbCached?.codewars_data || localCached?.codewars || null;
    cwErr = null;
  }
  if (!gfgStats && (dbCached?.geeksforgeeks_data || localCached?.geeksforgeeks)) {
    gfgStats = dbCached?.geeksforgeeks_data || localCached?.geeksforgeeks || null;
    gfgErr = null;
  }
  if (!atcoderStats && (dbCached?.atcoder_data || localCached?.atcoder)) {
    atcoderStats = dbCached?.atcoder_data || localCached?.atcoder || null;
    atcoderErr = null;
  }
  // Smart non-destructive persistence: merge fresh fetch with previous cached data
  const prevHr = dbCached?.hackerrank_data || localCached?.hackerrank;
  if (hrStats && prevHr) {
    if ((!hrStats.badges || hrStats.badges.length === 0) && prevHr.badges && prevHr.badges.length > 0) {
      hrStats.badges = prevHr.badges;
      hrStats.badgesCount = prevHr.badges.length;
    }
    if ((!hrStats.certificates || hrStats.certificates.length === 0) && prevHr.certificates && prevHr.certificates.length > 0) {
      hrStats.certificates = prevHr.certificates;
      hrStats.certificatesCount = prevHr.certificates.length;
    }
  } else if (!hrStats && prevHr) {
    hrStats = prevHr;
    hrErr = null;
  }

  const prevHe = dbCached?.hackerearth_data || localCached?.hackerearth;
  if (heStats && prevHe) {
    if (!heStats.totalSolved && prevHe.totalSolved) {
      heStats.totalSolved = prevHe.totalSolved;
    }
    if (!heStats.rating && prevHe.rating) {
      heStats.rating = prevHe.rating;
    }
    if (!heStats.maxRating && prevHe.maxRating) {
      heStats.maxRating = prevHe.maxRating;
    }
    if (!heStats.contestsAttended && prevHe.contestsAttended) {
      heStats.contestsAttended = prevHe.contestsAttended;
    }
    if (!heStats.globalRank && prevHe.globalRank) {
      heStats.globalRank = prevHe.globalRank;
    }
    if (!heStats.badges?.length && prevHe.badges?.length) {
      heStats.badges = prevHe.badges;
    }
  } else if (!heStats && prevHe) {
    heStats = prevHe;
    heErr = null;
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
  };

  // Save to localStorage fallback
  try {
    localStorage.setItem(localCacheKey, JSON.stringify(response));
    if (ghToken && userId) {
      localStorage.setItem(`eduspace_github_token_${userId}`, ghToken);
    }
  } catch {
    // Ignore storage quota error
  }

  // Save/Upsert to Supabase database table
  if (userId) {
    try {
      await (supabase as any).from("user_coding_profiles").upsert(
        {
          user_id: userId,
          leetcode_username: lcUsername,
          codeforces_handle: cfHandle,
          github_username: resolvedGhUsername,
          codechef_username: ccUsername,
          codewars_username: cwUsername,
          geeksforgeeks_username: gfgUsername,
          atcoder_username: atcoderUsername,
          hackerrank_username: hrUsername,
          hackerearth_username: heUsername,
          leetcode_data: lcStats as any,
          codeforces_data: cfStats as any,
          github_data: ghStats as any,
          codechef_data: ccStats as any,
          codewars_data: cwStats as any,
          geeksforgeeks_data: gfgStats as any,
          atcoder_data: atcoderStats as any,
          hackerrank_data: hrStats as any,
          hackerearth_data: heStats as any,
          overall_data: { totalSolved: overallTotal, githubToken: ghToken } as any,
          leetcode_error: lcErr,
          codeforces_error: cfErr,
          codechef_error: ccErr,
          codewars_error: cwErr,
          geeksforgeeks_error: gfgErr,
          atcoder_error: atcoderErr,
          hackerrank_error: hrErr,
          hackerearth_error: heErr,
          last_fetched_at: fetchedAtIso,
          updated_at: fetchedAtIso,
        },
        { onConflict: "user_id" }
      );

      if (gfgUsername && gfgStats) {
        try {
          await (supabase as any).from("gfg_profiles").upsert(
            {
              user_id: userId,
              gfg_username: gfgUsername,
              profile_image: gfgStats.profile_image ?? null,
              display_name: gfgStats.display_name ?? null,
              institution: gfgStats.institution ?? null,
              coding_score: gfgStats.codingScore ?? 0,
              problems_solved: gfgStats.totalSolved ?? 0,
              rank: gfgStats.institutionRank ?? gfgStats.rank ?? null,
              badges: Array.isArray(gfgStats.badges) ? gfgStats.badges : (gfgStats.badges ? [String(gfgStats.badges)] : []),
              streak: gfgStats.streak ?? 0,
              profile_url: gfgStats.profile_url || `https://www.geeksforgeeks.org/user/${gfgUsername}/`,
              last_updated: gfgStats.last_updated || fetchedAtIso,
            },
            { onConflict: "user_id" }
          );
        } catch {
          // Table may not exist yet in client schema
        }
      }
    } catch (upsertErr) {
      console.warn("Could not save coding profiles to database:", upsertErr);
    }
  }

  return response;
}
