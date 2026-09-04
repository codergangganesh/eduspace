// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CodeChefContestItem {
  name: string;
  code?: string;
  rating: number;
  rank?: number;
  date?: string;
}

interface CodeChefStatsPayload {
  username: string;
  name: string | null;
  avatar: string | null;
  countryName: string | null;
  countryFlag: string | null;
  institution: string | null;
  studentOrProfessional: string | null;
  rating: number;
  maxRating: number;
  stars: string;
  division: string;
  globalRank: number | null;
  countryRank: number | null;
  dsaRating: number | null;
  totalSolved: number;
  fullySolved: number;
  partiallySolved: number;
  contestsParticipated: number;
  badges: Array<{ name: string; description?: string; category?: string; icon?: string }>;
  recentContests: CodeChefContestItem[];
  last_updated: string;
}

function parseCodeChefHtml(html: string, username: string): Partial<CodeChefStatsPayload> | null {
  if (!html || html.length < 100) return null;

  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const cleaned = String(val).replace(/,/g, "").trim();
    if (!cleaned || cleaned.toLowerCase().includes("inactive") || cleaned.toLowerCase().includes("na") || cleaned.toLowerCase().includes("null") || cleaned.toLowerCase().includes("unrated")) {
      return null;
    }
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  };

  const parseNumberDefaultZero = (val: any): number => {
    const p = parseNum(val);
    return p !== null ? p : 0;
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
  const badges: Array<{ name: string; description?: string; category?: string; icon?: string }> = [];
  const recentContests: CodeChefContestItem[] = [];

  // 1. Extract from var all_rating JavaScript variable
  const allRatingMatch = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);\s*(?:var|\n|\r|<)/i) ||
                         html.match(/all_rating\s*=\s*(\[[\s\S]*?\]);/i);
  if (allRatingMatch) {
    try {
      const parsedArray = JSON.parse(allRatingMatch[1]);
      if (Array.isArray(parsedArray)) {
        const valid = parsedArray.filter((c: any) => c.code !== "RATING_SHIFT_TO_ELO_RATING_CODE");
        contestsParticipated = valid.length;
        if (valid.length > 0) {
          const last = valid[valid.length - 1];
          if (last?.rating) rating = parseNumberDefaultZero(last.rating);
          valid.forEach((c: any) => {
            const r = parseNumberDefaultZero(c.rating);
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

  // 2. Extract from Drupal.settings.date_versus_rating
  if (contestsParticipated === 0) {
    try {
      const drupalMatch = html.match(/Drupal\.settings\s*,\s*(\{[\s\S]*?\})\s*\);/i) ||
                          html.match(/date_versus_rating\s*:\s*(\{[\s\S]*?\})\s*,\s*["']user_initial_ratings/i);
      if (drupalMatch) {
        const parsedSettings = JSON.parse(drupalMatch[1]);
        const dateVsRating = parsedSettings.date_versus_rating || parsedSettings;
        const allContests = dateVsRating?.all;
        if (Array.isArray(allContests)) {
          const valid = allContests.filter((c: any) => c.code !== "RATING_SHIFT_TO_ELO_RATING_CODE");
          contestsParticipated = valid.length;
          if (valid.length > 0) {
            const last = valid[valid.length - 1];
            if (last?.rating) rating = parseNumberDefaultZero(last.rating);
            valid.forEach((c: any) => {
              const r = parseNumberDefaultZero(c.rating);
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

  // 3. Fallback DOM Contest Count
  if (contestsParticipated === 0) {
    const contestCountMatch =
      html.match(/class="contest-participated-count"[^>]*>[\s\S]*?<b>\s*(\d+)\s*<\/b>/i) ||
      html.match(/No\.\s*of\s*Contests\s*Participated:\s*<b>\s*(\d+)\s*<\/b>/i) ||
      html.match(/<h3>\s*Contests\s*\(\s*(\d+)\s*\)\s*<\/h3>/i) ||
      html.match(/Contests?\s*Attended\s*:\s*(\d+)/i) ||
      html.match(/class="[^"]*contest-count[^"]*"[^>]*>\s*(\d+)/i);
    if (contestCountMatch) contestsParticipated = parseNumberDefaultZero(contestCountMatch[1]);
  }

  // 4. Rating & Peak Rating
  if (rating === 0) {
    const ratingMatch =
      html.match(/id="rating-block-all"[\s\S]*?class="rating-number"[^>]*>\s*(\d+)/i) ||
      html.match(/class="rating-number"[^>]*>\s*(\d+)/i) ||
      html.match(/rating-header[^>]*>[\s\S]*?(\d{3,4})/i) ||
      html.match(/current-rating[^>]*>(\d+)/i);
    if (ratingMatch) rating = parseNumberDefaultZero(ratingMatch[1]);
  }

  const maxRatingMatch = html.match(/\(Highest Rating\s*(\d+)\)/i) || html.match(/highest-rating[^>]*>(\d+)/i);
  if (maxRatingMatch) maxRating = parseNumberDefaultZero(maxRatingMatch[1]);
  if (maxRating === 0 && rating > 0) maxRating = rating;

  // 5. Stars & Division
  const starsMatch = html.match(/<span[^>]*class=['"]rating['"][^>]*>(\d+)(?:&#9733;|★)<\/span>/i) ||
                     html.match(/(\d+)&#9733;/i) ||
                     html.match(/(\d+★|\d+\s*stars?)/i);
  if (starsMatch) {
    stars = `${starsMatch[1].replace(/[^0-9]/g, "")}★`;
  } else if (rating > 0) {
    if (rating >= 2500) stars = "7★";
    else if (rating >= 2200) stars = "6★";
    else if (rating >= 2000) stars = "5★";
    else if (rating >= 1800) stars = "4★";
    else if (rating >= 1600) stars = "3★";
    else if (rating >= 1400) stars = "2★";
    else stars = "1★";
  } else {
    stars = "1★";
  }

  const divMatch = html.match(/\((Div\s*\d)\)/i) || html.match(/class="user-league-container"[\s\S]*?tooltip">([^<]+)/i);
  if (divMatch) {
    division = divMatch[1].trim();
  } else if (rating >= 2000) {
    division = "Div 1";
  } else if (rating >= 1600) {
    division = "Div 2";
  } else if (rating >= 1400) {
    division = "Div 3";
  } else if (rating > 0) {
    division = "Div 4";
  } else {
    division = "Unrated";
  }

  // 6. Global and Country Ranks (Exact DOM match)
  const ranksBlockMatch = html.match(/class=["']rating-ranks["']([\s\S]*?)<\/ul>/i) ||
                          html.match(/class=["']rating-ranks["']([\s\S]*?)<\/div>/i);
  if (ranksBlockMatch) {
    const block = ranksBlockMatch[1];
    const gItem = block.match(/<li[^>]*>[\s\S]*?<a[^>]*href=["']\/ratings\/all["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>[\s\S]*?Global Rank/i) ||
                  block.match(/<strong>\s*([^<]+)\s*<\/strong>[\s\S]{0,60}Global Rank/i);
    if (gItem) globalRank = parseNum(gItem[1]);

    const cItem = block.match(/<li[^>]*>[\s\S]*?<a[^>]*href=["'][^"']*Country[^"']*["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>[\s\S]*?Country Rank/i) ||
                  block.match(/<strong>\s*([^<]+)\s*<\/strong>[\s\S]{0,60}Country Rank/i);
    if (cItem) countryRank = parseNum(cItem[1]);
  }

  // Fallback rank matches anywhere in HTML
  if (!globalRank) {
    const gm = html.match(/<a[^>]*href=["']\/ratings\/all["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>/i) ||
               html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,60}Global Rank/i) ||
               html.match(/Global Rank[\s\S]{0,60}<strong>\s*([\d,]+)\s*<\/strong>/i);
    if (gm) globalRank = parseNum(gm[1]);
  }

  if (!countryRank) {
    const cm = html.match(/<a[^>]*href=["'][^"']*Country[^"']*["'][^>]*>[\s\S]*?<strong>\s*([^<]+)\s*<\/strong>/i) ||
               html.match(/<strong>\s*([\d,]+)\s*<\/strong>[\s\S]{0,60}Country Rank/i) ||
               html.match(/Country Rank[\s\S]{0,60}<strong>\s*([\d,]+)\s*<\/strong>/i);
    if (cm) countryRank = parseNum(cm[1]);
  }

  // 7. DSA Rating block (Real value from DSA tracks or active CP rating)
  if (!dsaRating) {
    const dsaMatch = html.match(/id=["']rating-block-dsa[^"']*["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/id=["']rating-block-dsa-monday["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/id=["']rating-block-dsa-learning-series["'][\s\S]*?class=["']rating-number["'][^>]*>\s*(\d+)/i) ||
                     html.match(/DSA\s*Rating[\s\S]{0,80}?(\d{3,4})/i);
    if (dsaMatch) {
      const dVal = parseNum(dsaMatch[1]);
      if (dVal && dVal > 0) dsaRating = dVal;
    }
  }

  if (!dsaRating && rating > 0) {
    dsaRating = rating;
  }

  // 8. Solved Problems
  const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) ||
                      html.match(/Total Problems Solved[^>]*>(\d+)/i) ||
                      html.match(/Problems Solved[^>]*>(\d+)/i);
  if (solvedMatch) totalSolved = parseNumberDefaultZero(solvedMatch[1]);

  const fullyMatch = html.match(/Fully Solved\s*\(\s*(\d+)\s*\)/i);
  if (fullyMatch) fullySolved = parseNumberDefaultZero(fullyMatch[1]);
  else fullySolved = totalSolved;

  const partialMatch = html.match(/Partially Solved\s*\(\s*(\d+)\s*\)/i);
  if (partialMatch) partiallySolved = parseNumberDefaultZero(partialMatch[1]);

  // 9. User Details
  const nameMatch = html.match(/<h1[^>]*class="[^"]*h2-style[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                    html.match(/class="user-details-container"[^>]*>[\s\S]*?<h1>([^<]+)<\/h1>/i) ||
                    html.match(/<title>([^|]+)\s*\|\s*CodeChef/i);
  if (nameMatch) {
    const raw = nameMatch[1].trim();
    if (raw && !raw.includes("User Profile") && raw.toLowerCase() !== username.toLowerCase()) {
      name = raw;
    }
  }

  const avatarMatch = html.match(/class=['"]profileImage['"][^>]*src=['"]([^'"]+)['"]/i) ||
                      html.match(/src=['"](https:\/\/cdn\.codechef\.com\/sites\/default\/files\/uploads\/pictures\/[^'"]+)['"]/i);
  if (avatarMatch) avatar = avatarMatch[1];

  const countryNameMatch = html.match(/class="user-country-name"[^>]*>([^<]+)<\/span>/i) ||
                           html.match(/user-country-flag"[^>]*title="([^"]+)"/i);
  if (countryNameMatch) countryName = countryNameMatch[1].trim();

  const flagMatch = html.match(/class="user-country-flag"[^>]*src="([^"]+)"/i);
  if (flagMatch) countryFlag = flagMatch[1];

  const instMatch = html.match(/Institution:<\/label><span>([^<]+)<\/span>/i) ||
                    html.match(/Institution:[^<]*<strong>([^<]+)<\/strong>/i) ||
                    html.match(/student-institution[^>]*>([^<]+)</i);
  if (instMatch) institution = instMatch[1].trim();

  const studentMatch = html.match(/Student\/Professional:<\/label><span>([^<]+)<\/span>/i);
  if (studentMatch) studentOrProfessional = studentMatch[1].trim();

  // 10. Badges
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

  return {
    username,
    name,
    avatar,
    countryName,
    countryFlag,
    institution,
    studentOrProfessional,
    rating,
    maxRating,
    stars,
    division,
    globalRank,
    countryRank,
    dsaRating,
    totalSolved,
    fullySolved,
    partiallySolved,
    contestsParticipated,
    badges,
    recentContests,
    last_updated: new Date().toISOString(),
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
    const profileUrl = `https://www.codechef.com/users/${encodeURIComponent(username)}`;

    // Tier 1: Direct Fetch from CodeChef.com (Server-side fetch is not CORS-restricted)
    try {
      const ccResponse = await fetch(profileUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (ccResponse.ok) {
        const html = await ccResponse.text();
        const parsed = parseCodeChefHtml(html, username);
        if (parsed && (parsed.rating || parsed.totalSolved || parsed.contestsParticipated !== undefined || parsed.name)) {
          return new Response(
            JSON.stringify({ success: true, data: parsed }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (err) {
      console.warn("Direct CodeChef scrape failed:", err);
    }

    // Tier 2: Microservices fallback
    try {
      const [cpRatingRes, codechefApiRes, competeApiRes] = await Promise.allSettled([
        fetch(`https://cp-rating-api.vercel.app/codechef/${encodeURIComponent(username)}?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
        fetch(`https://codechefapi.vercel.app/handle/${encodeURIComponent(username)}?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
        fetch(`https://competeapi.vercel.app/user/codechef/${encodeURIComponent(username)}/?_t=${timestamp}`, {
          signal: AbortSignal.timeout(6000),
        }),
      ]);

      const parseRank = (val: any): number | null => {
        if (val === null || val === undefined) return null;
        const cleaned = String(val).replace(/,/g, "").trim();
        if (!cleaned || cleaned.toLowerCase().includes("inactive") || cleaned.toLowerCase().includes("na") || cleaned.toLowerCase().includes("null") || cleaned.toLowerCase().includes("unrated")) {
          return null;
        }
        const parsed = parseInt(cleaned, 10);
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
      };

      let merged: any = { username, last_updated: new Date().toISOString() };

      if (codechefApiRes.status === "fulfilled" && codechefApiRes.value.ok) {
        const d = await codechefApiRes.value.json();
        if (d && d.success !== false) {
          merged = { ...merged, ...d };
          if (d.numberOfProblemsSolved) merged.totalSolved = d.numberOfProblemsSolved;
          if (d.currentRating) merged.rating = d.currentRating;
          if (d.highestRating) merged.maxRating = d.highestRating;
          if (d.globalRank) merged.globalRank = parseRank(d.globalRank);
          if (d.countryRank) merged.countryRank = parseRank(d.countryRank);
        }
      }

      if (cpRatingRes.status === "fulfilled" && cpRatingRes.value.ok) {
        const d = await cpRatingRes.value.json();
        if (d && !d.error) {
          merged = { ...merged, ...d };
          if (typeof d.participation === "number") {
            merged.contestsParticipated = d.participation;
          }
          if (d.globalRank && !merged.globalRank) merged.globalRank = parseRank(d.globalRank);
          if (d.countryRank && !merged.countryRank) merged.countryRank = parseRank(d.countryRank);
          if (d.puzzleRating) merged.dsaRating = parseRank(d.puzzleRating);
          if (Array.isArray(d.contests) && d.contests.length > 0) {
            merged.recentContests = d.contests;
            if (merged.contestsParticipated === undefined) {
              merged.contestsParticipated = d.contests.length;
            }
          }
        }
      }

      if (competeApiRes.status === "fulfilled" && competeApiRes.value.ok) {
        const d = await competeApiRes.value.json();
        if (d && !d.error) {
          if (!merged.institution && d.institution) merged.institution = d.institution;
          if (!merged.studentOrProfessional && d.user_type) merged.studentOrProfessional = d.user_type;
          if (!merged.maxRating && d.max_rank) merged.maxRating = d.max_rank;
          if (!merged.globalRank && d.global_rank) merged.globalRank = parseRank(d.global_rank);
          if (!merged.countryRank && d.country_rank) merged.countryRank = parseRank(d.country_rank);
        }
      }

      if (!merged.dsaRating && merged.rating) {
        merged.dsaRating = merged.rating;
      }

      if (merged.rating || merged.totalSolved || typeof merged.contestsParticipated === "number") {
        return new Response(
          JSON.stringify({ success: true, data: merged }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.warn("Microservices fallback failed:", err);
    }

    return new Response(
      JSON.stringify({ success: false, error: `Could not fetch CodeChef profile for "${username}"` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
