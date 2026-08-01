import { supabase } from "@/integrations/supabase/client";
import {
  LeetCodeStats,
  CodeforcesStats,
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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
        // e.g. /u/username or /profile/handle or /users/username or /username
        if (parts[0] === "u" || parts[0] === "profile" || parts[0] === "user" || parts[0] === "users") {
          return parts[1] || parts[0];
        }
        return parts[parts.length - 1];
      }
    }
  } catch {
    // If not a valid URL, treat as raw username
  }

  return trimmed;
}

/**
 * Fetches LeetCode statistics using Alfa LeetCode API and official GraphQL endpoint.
 */
export async function fetchLeetCodeStats(usernameInput: string): Promise<{
  data: LeetCodeStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "LeetCode username is required" };
  }

  // 1. Try Vercel LeetCode API (High performance, zero cold-starts)
  try {
    const vercelRes = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (vercelRes.ok) {
      const data = await vercelRes.json();
      if (data && (data.status === "success" || typeof data.totalSolved === "number")) {
        return {
          data: {
            totalSolved: data.totalSolved || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0,
          },
          error: null,
        };
      }
    }
  } catch (vercelErr: any) {
    console.warn("Vercel LeetCode API failed, trying fallbacks...", vercelErr?.message);
  }

  // 2. Try Alfa LeetCode API (Render)
  try {
    const alfaRes = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`, {
      signal: AbortSignal.timeout(8000),
    });

    if (alfaRes.ok) {
      const data = await alfaRes.json();
      if (data && typeof data.solvedProblem === "number") {
        return {
          data: {
            totalSolved: data.solvedProblem || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0,
          },
          error: null,
        };
      }
    }
  } catch (alfaErr: any) {
    console.warn("Alfa LeetCode solved endpoint failed, trying userProfile endpoint...", alfaErr?.message);
  }

  // 1b. Try Alfa LeetCode userProfile endpoint
  try {
    const alfaProfileRes = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (alfaProfileRes.ok) {
      const data = await alfaProfileRes.json();
      if (data && typeof data.totalSolved === "number") {
        return {
          data: {
            totalSolved: data.totalSolved || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0,
          },
          error: null,
        };
      }
    }
  } catch (alfaProfileErr: any) {
    console.warn("Alfa LeetCode userProfile endpoint failed:", alfaProfileErr?.message);
  }

  // 2. Try direct LeetCode GraphQL POST
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: { username },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "LeetCode user not found");
      }

      const matchedUser = json.data?.matchedUser;
      if (matchedUser && matchedUser.submitStats?.acSubmissionNum) {
        const statsMap: Record<string, number> = {};
        matchedUser.submitStats.acSubmissionNum.forEach(
          (item: { difficulty: string; count: number }) => {
            statsMap[item.difficulty] = item.count;
          }
        );

        return {
          data: {
            totalSolved: statsMap["All"] || 0,
            easy: statsMap["Easy"] || 0,
            medium: statsMap["Medium"] || 0,
            hard: statsMap["Hard"] || 0,
          },
          error: null,
        };
      }
    }
  } catch (err: any) {
    console.warn("Direct LeetCode GraphQL fetch failed or blocked:", err?.message);
  }

  // 3. Fallback: LeetCode Stats API
  try {
    const fallback2Res = await fetch(`https://leetcode-stats-api.herokuapp.com/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (fallback2Res.ok) {
      const data = await fallback2Res.json();
      if (data.status === "success" || typeof data.totalSolved === "number") {
        return {
          data: {
            totalSolved: data.totalSolved || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0,
          },
          error: null,
        };
      }
    }
  } catch (fallback2Err: any) {
    console.warn("Fallback LeetCode API 2 failed:", fallback2Err?.message);
  }

  return {
    data: null,
    error: `Could not fetch LeetCode profile for "${username}". Please verify the username.`,
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
    // 1. Fetch user info (rating, maxRating, rank)
    const infoRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!infoRes.ok) {
      throw new Error(`Codeforces API returned status ${infoRes.status}`);
    }

    const infoJson = await infoRes.json();
    if (infoJson.status !== "OK" || !infoJson.result || infoJson.result.length === 0) {
      return {
        data: null,
        error: infoJson.comment || `Codeforces user "${handle}" not found.`,
      };
    }

    const userInfo = infoJson.result[0];

    // 2. Fetch user submissions to compute total unique solved problems
    let totalSolved = 0;
    try {
      const statusRes = await fetch(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson.status === "OK" && Array.isArray(statusJson.result)) {
          const solvedSet = new Set<string>();
          statusJson.result.forEach((sub: any) => {
            if (sub.verdict === "OK" && sub.problem) {
              const problemId = sub.problem.contestId
                ? `${sub.problem.contestId}-${sub.problem.index}`
                : sub.problem.name;
              solvedSet.add(problemId);
            }
          });
          totalSolved = solvedSet.size;
        }
      }
    } catch (statusErr: any) {
      console.warn("Could not fetch Codeforces submission status history:", statusErr?.message);
    }

    const rankRaw = userInfo.rank ? String(userInfo.rank) : "Unrated";
    const formattedRank = rankRaw.charAt(0).toUpperCase() + rankRaw.slice(1);

    return {
      data: {
        totalSolved,
        rating: userInfo.rating || 0,
        maxRating: userInfo.maxRating || 0,
        rank: formattedRank,
      },
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
          const to   = y === currentYear
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
 * Gets coding profiles for a user, using database caching with a 24-hour TTL.
 */
export async function getCodingProfiles(
  userId: string,
  leetcodeUsernameInput?: string | null,
  codeforcesHandleInput?: string | null,
  githubUsernameInput?: string | null,
  githubTokenInput?: string | null,
  forceRefresh = false
): Promise<CodingProfilesResponse> {
  const lcUsername = extractUsername(leetcodeUsernameInput);
  const cfHandle = extractUsername(codeforcesHandleInput);
  const ghUsername = extractUsername(githubUsernameInput);

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
    ((dbCached?.overall_data?.githubToken ?? dbCached?.github_token ?? "") === (ghToken ?? ""));

  let connectedPlatforms = 0;
  if (lcUsername) connectedPlatforms++;
  if (cfHandle) connectedPlatforms++;
  if (ghUsername) connectedPlatforms++;

  // If cache is valid and usernames haven't changed, return cached stats directly
  if (isCacheValid && usernameMatches) {
    const lcData = dbCached?.leetcode_data || localCached?.leetcode || null;
    const cfData = dbCached?.codeforces_data || localCached?.codeforces || null;
    const ghData = dbCached?.github_data || localCached?.github || null;
    const overallTotal = (lcData?.totalSolved || 0) + (cfData?.totalSolved || 0);

    return {
      leetcode: lcData,
      codeforces: cfData,
      github: ghData,
      overall: { totalSolved: overallTotal, platformsConnectedCount: connectedPlatforms },
      lastFetchedAt: dbCached?.last_fetched_at || localCached?.lastFetchedAt || new Date().toISOString(),
      leetcodeError: dbCached?.leetcode_error || localCached?.leetcodeError || null,
      codeforcesError: dbCached?.codeforces_error || localCached?.codeforcesError || null,
      githubError: localCached?.githubError || null,
      leetcodeUsername: lcUsername,
      codeforcesHandle: cfHandle,
      githubUsername: ghUsername,
      githubToken: ghToken,
    };
  }

  // Fetch fresh stats from platforms in parallel
  const [lcResult, cfResult, ghResult] = await Promise.all([
    lcUsername ? fetchLeetCodeStats(lcUsername) : Promise.resolve({ data: null, error: null }),
    cfHandle ? fetchCodeforcesStats(cfHandle) : Promise.resolve({ data: null, error: null }),
    ghUsername || ghToken ? fetchGitHubStats(ghUsername || "", ghToken) : Promise.resolve({ data: null, error: null }),
  ]);

  let lcStats = lcResult.data;
  let cfStats = cfResult.data;
  let ghStats = ghResult.data;
  let lcErr = lcResult.error;
  let cfErr = cfResult.error;
  let ghErr = ghResult.error;

  // Fallback to cached data if network error or API rate limit occurred
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

  const resolvedGhUsername = ghStats?.username || ghUsername;
  const overallTotal = (lcStats?.totalSolved || 0) + (cfStats?.totalSolved || 0);
  const fetchedAtIso = new Date().toISOString();

  const response: CodingProfilesResponse = {
    leetcode: lcStats,
    codeforces: cfStats,
    github: ghStats,
    overall: { totalSolved: overallTotal, platformsConnectedCount: connectedPlatforms },
    lastFetchedAt: fetchedAtIso,
    leetcodeError: lcErr,
    codeforcesError: cfErr,
    githubError: ghErr,
    leetcodeUsername: lcUsername,
    codeforcesHandle: cfHandle,
    githubUsername: resolvedGhUsername,
    githubToken: ghToken,
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
          leetcode_data: lcStats as any,
          codeforces_data: cfStats as any,
          github_data: ghStats as any,
          overall_data: { totalSolved: overallTotal, githubToken: ghToken } as any,
          leetcode_error: lcErr,
          codeforces_error: cfErr,
          last_fetched_at: fetchedAtIso,
          updated_at: fetchedAtIso,
        },
        { onConflict: "user_id" }
      );
    } catch (upsertErr) {
      console.warn("Could not save coding profiles to database:", upsertErr);
    }
  }

  return response;
}
