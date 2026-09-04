// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AtCoderContestHistoryItem {
  name?: string;
  code?: string;
  rating: number;
  rank?: number;
  performance?: number;
  date?: string;
}

interface AtCoderStatsPayload {
  username: string;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  countryFlag?: string | null;
  affiliation?: string | null;
  birthYear?: number | string | null;
  wins?: number | null;
  rating: number;
  maxRating: number;
  rank: string;
  globalRank?: number | null;
  totalSolved: number;
  competitionsCount: number;
  totalCompetitions?: number;
  acceptedCountRank?: number | null;
  ratedPointSum?: number;
  ratedPointSumRank?: number | null;
  highestPerformance?: number;
  bestRank?: number;
  lastCompeted?: string | null;
  recentContests: AtCoderContestHistoryItem[];
  contestHistory?: AtCoderContestHistoryItem[];

  // Heuristic Statistics
  heuristicRating?: number | null;
  heuristicMaxRating?: number | null;
  heuristicRank?: string | null;
  heuristicCompetitionsCount?: number;
  heuristicTotalCompetitions?: number;
  heuristicHighestPerformance?: number | null;
  heuristicBestRank?: number | null;
  heuristicRecentContests?: AtCoderContestHistoryItem[];

  profile_url: string;
  last_updated: string;
}

function getAtCoderRankName(rating: number): string {
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

function parseAtCoderHtml(html: string, username: string): Partial<AtCoderStatsPayload> | null {
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
  let birthYear: string | null = null;
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
    html.match(/(?:https?:)?\/\/img\.atcoder\.jp\/icons\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif|webp)/i) ||
    html.match(/class=["']avatar["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/src=["'](https:\/\/img\.atcoder\.jp\/icons\/[^"']+)["']/i);
  if (avatarMatch) {
    const rawAvatar = (avatarMatch[1] || avatarMatch[0]).trim();
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: "Username is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = Date.now();
    const profileUrl = `https://atcoder.jp/users/${encodeURIComponent(username)}`;
    const historyUrl = `https://atcoder.jp/users/${encodeURIComponent(username)}/history/json`;
    const heuristicHistoryUrl = `https://atcoder.jp/users/${encodeURIComponent(username)}/history/json?contestType=heuristic`;
    const kenkooooUrl = `https://kenkoooo.com/atcoder/atcoder-api/v2/user_info?user=${encodeURIComponent(username)}`;

    let stats: AtCoderStatsPayload = {
      username,
      name: null,
      avatar: null,
      country: null,
      countryFlag: null,
      affiliation: null,
      birthYear: null,
      wins: null,
      rating: 0,
      maxRating: 0,
      rank: "Unrated",
      globalRank: null,
      totalSolved: 0,
      competitionsCount: 0,
      totalCompetitions: 0,
      acceptedCountRank: null,
      ratedPointSum: 0,
      ratedPointSumRank: null,
      highestPerformance: 0,
      bestRank: undefined,
      lastCompeted: null,
      recentContests: [],

      // Heuristic Stats
      heuristicRating: null,
      heuristicMaxRating: null,
      heuristicRank: null,
      heuristicCompetitionsCount: 0,
      heuristicTotalCompetitions: 0,
      heuristicHighestPerformance: null,
      heuristicBestRank: null,
      heuristicRecentContests: [],

      profile_url: profileUrl,
      last_updated: new Date().toISOString(),
    };

    let userFound = false;

    // 1. Fetch HTML Profile, Algorithm History, Heuristic History, and Kenkoooo API concurrently
    const [profileRes, historyRes, heuristicHistoryRes, kenkooooRes] = await Promise.allSettled([
      fetch(profileUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(historyUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(heuristicHistoryUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(kenkooooUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    // A. Parse HTML Profile
    if (profileRes.status === "fulfilled" && profileRes.value.ok) {
      const html = await profileRes.value.text();
      const parsed = parseAtCoderHtml(html, username);
      if (parsed) {
        userFound = true;
        stats = { ...stats, ...parsed };
      }
    }

    // B. Parse Algorithm History JSON
    if (historyRes.status === "fulfilled" && historyRes.value.ok) {
      try {
        const historyData = await historyRes.value.json();
        if (Array.isArray(historyData)) {
          userFound = true;
          stats.totalCompetitions = historyData.length;

          const rated = historyData.filter(
            (h: any) => h.IsRated !== false && typeof h.NewRating === "number"
          );

          if (rated.length > 0) {
            stats.competitionsCount = rated.length;
            const last = rated[rated.length - 1];
            if (last?.NewRating && !stats.rating) {
              stats.rating = last.NewRating;
            }

            const highestHistory = Math.max(...rated.map((h: any) => h.NewRating || 0));
            if (highestHistory > stats.maxRating) {
              stats.maxRating = highestHistory;
            }

            const bestRankInHistory = Math.min(
              ...rated.map((h: any) => (typeof h.Place === "number" && h.Place > 0 ? h.Place : Infinity))
            );
            if (bestRankInHistory !== Infinity) {
              stats.bestRank = bestRankInHistory;
            }

            const perfValues = historyData
              .map((h: any) => (typeof h.Performance === "number" ? h.Performance : 0))
              .filter(Boolean);
            if (perfValues.length > 0) {
              stats.highestPerformance = Math.max(...perfValues);
            }

            // Extract all rated algorithm contests in chronological order for graphs
            stats.contestHistory = rated.map((h: any) => ({
              name: h.ContestName || h.ContestNameEn || h.ContestScreenName || "AtCoder Contest",
              code: h.ContestScreenName || undefined,
              rating: typeof h.NewRating === "number" ? h.NewRating : (typeof h.OldRating === "number" ? h.OldRating : 0),
              rank: typeof h.Place === "number" ? h.Place : undefined,
              performance: typeof h.Performance === "number" ? h.Performance : undefined,
              date: h.EndTime ? h.EndTime.split("T")[0] : undefined,
            }));

            // Extract formatted recent contests (newest first for profile card preview)
            stats.recentContests = historyData.slice(-15).reverse().map((h: any) => ({
              name: h.ContestName || h.ContestNameEn || h.ContestScreenName || "AtCoder Contest",
              code: h.ContestScreenName || undefined,
              rating: typeof h.NewRating === "number" ? h.NewRating : (typeof h.OldRating === "number" ? h.OldRating : 0),
              rank: typeof h.Place === "number" ? h.Place : undefined,
              performance: typeof h.Performance === "number" ? h.Performance : undefined,
              date: h.EndTime ? h.EndTime.split("T")[0] : undefined,
            }));
          }
        }
      } catch (err) {
        console.warn("Error parsing AtCoder algorithm history JSON:", err);
      }
    }

    // C. Parse Heuristic History JSON
    if (heuristicHistoryRes.status === "fulfilled" && heuristicHistoryRes.value.ok) {
      try {
        const hHistoryData = await heuristicHistoryRes.value.json();
        if (Array.isArray(hHistoryData) && hHistoryData.length > 0) {
          stats.heuristicTotalCompetitions = hHistoryData.length;

          const ratedH = hHistoryData.filter(
            (h: any) => h.IsRated !== false && typeof h.NewRating === "number"
          );
          stats.heuristicCompetitionsCount = ratedH.length;

          if (ratedH.length > 0) {
            const lastH = ratedH[ratedH.length - 1];
            if (lastH?.NewRating) {
              stats.heuristicRating = lastH.NewRating;
              stats.heuristicRank = getAtCoderRankName(lastH.NewRating);
            }
            stats.heuristicMaxRating = Math.max(...ratedH.map((h: any) => h.NewRating || 0));

            const bestPlaceH = Math.min(
              ...ratedH.map((h: any) => (typeof h.Place === "number" && h.Place > 0 ? h.Place : Infinity))
            );
            if (bestPlaceH !== Infinity) {
              stats.heuristicBestRank = bestPlaceH;
            }
          }

          const perfValuesH = hHistoryData
            .map((h: any) => (typeof h.Performance === "number" ? h.Performance : 0))
            .filter(Boolean);
          if (perfValuesH.length > 0) {
            stats.heuristicHighestPerformance = Math.max(...perfValuesH);
          }

          stats.heuristicRecentContests = hHistoryData.slice(-10).reverse().map((h: any) => ({
            name: h.ContestName || h.ContestNameEn || h.ContestScreenName || "Heuristic Contest",
            code: h.ContestScreenName || undefined,
            rating: typeof h.NewRating === "number" ? h.NewRating : (typeof h.OldRating === "number" ? h.OldRating : 0),
            rank: typeof h.Place === "number" ? h.Place : undefined,
            performance: typeof h.Performance === "number" ? h.Performance : undefined,
            date: h.EndTime ? h.EndTime.split("T")[0] : undefined,
          }));
        }
      } catch (err) {
        console.warn("Error parsing AtCoder heuristic history JSON:", err);
      }
    }

    // D. Parse Kenkoooo API
    if (kenkooooRes.status === "fulfilled" && kenkooooRes.value.ok) {
      try {
        const kInfo = await kenkooooRes.value.json();
        if (kInfo && typeof kInfo === "object") {
          if (typeof kInfo.accepted_count === "number") {
            stats.totalSolved = kInfo.accepted_count;
            userFound = true;
          }
          if (typeof kInfo.accepted_count_rank === "number") {
            stats.acceptedCountRank = kInfo.accepted_count_rank;
          }
          if (typeof kInfo.rated_point_sum === "number") {
            stats.ratedPointSum = kInfo.rated_point_sum;
          }
          if (typeof kInfo.rated_point_sum_rank === "number") {
            stats.ratedPointSumRank = kInfo.rated_point_sum_rank;
          }
        }
      } catch (err) {
        console.warn("Error parsing Kenkoooo data:", err);
      }
    }

    // Tier 2 Fallbacks: Badge APIs if rating is still 0
    if (stats.rating === 0) {
      try {
        const [badgeRes, svgRes] = await Promise.allSettled([
          fetch(`https://atcoder-badges.now.sh/api/atcoder/json/${encodeURIComponent(username)}?_t=${timestamp}`, {
            signal: AbortSignal.timeout(5000),
          }),
          fetch(`https://atrating.baoshuo.dev/rating?username=${encodeURIComponent(username)}?_t=${timestamp}`, {
            signal: AbortSignal.timeout(5000),
          }),
        ]);

        if (badgeRes.status === "fulfilled" && badgeRes.value.ok) {
          const badgeJson = await badgeRes.value.json();
          if (badgeJson && typeof badgeJson.message === "string") {
            const parsedRating = parseInt(badgeJson.message, 10);
            if (!isNaN(parsedRating) && parsedRating > 0) {
              stats.rating = parsedRating;
              if (parsedRating > stats.maxRating) stats.maxRating = parsedRating;
              userFound = true;
            }
          }
        }

        if (stats.rating === 0 && svgRes.status === "fulfilled" && svgRes.value.ok) {
          const svgText = await svgRes.value.text();
          const ariaMatch =
            svgText.match(/aria-label="[^:]+:\s*([^0-9\n\r]*?)\s*(\d+)"/i) ||
            svgText.match(/<title>[^:]+:\s*([^0-9\n\r]*?)\s*(\d+)<\/title>/i);
          if (ariaMatch && ariaMatch[2]) {
            const parsedRating = parseInt(ariaMatch[2], 10);
            if (!isNaN(parsedRating) && parsedRating > 0) {
              stats.rating = parsedRating;
              if (parsedRating > stats.maxRating) stats.maxRating = parsedRating;
              userFound = true;
            }
          }
        }
      } catch { }
    }

    if (stats.maxRating < stats.rating) {
      stats.maxRating = stats.rating;
    }

    if (!stats.rank || stats.rank === "Unrated") {
      stats.rank = getAtCoderRankName(stats.rating);
    }

    if (userFound || stats.rating > 0 || stats.totalSolved > 0 || stats.competitionsCount > 0 || (stats.heuristicRating && stats.heuristicRating > 0)) {
      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Could not find AtCoder profile for "${username}"` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
