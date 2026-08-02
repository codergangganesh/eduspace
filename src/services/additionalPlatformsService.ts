import { HackerRankStats, HackerRankBadge, HackerRankCertificate, HackerEarthStats } from "@/types/codingProfile";

/**
 * Extracts clean handle from URL or raw input string
 */
function extractUsername(input: string): string {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?(hackerrank\.com\/|hackerearth\.com\/@?)/i, "");
  clean = clean.split("/")[0].split("?")[0].replace(/^@/, "");
  return clean.trim();
}

/**
 * Fetches HackerRank statistics using official HackerRank REST APIs & multi-tiered CORS proxies.
 */
export async function fetchHackerRankStats(usernameInput: string): Promise<{
  data: HackerRankStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput);
  if (!username) {
    return { data: null, error: "HackerRank username is required" };
  }

  let profileData: any = null;
  let scoresData: any = null;
  let badgesData: any[] = [];
  let certsData: any[] = [];

  const timestamp = Date.now();

  // 1. Fetch Profile Info
  const profileUrls = [
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/profile?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/profile?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/profile?_t=${timestamp}`)}`
  ];

  for (const pUrl of profileUrls) {
    try {
      const res = await fetch(pUrl, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.model || json.hacker || json.username || json.name)) {
          profileData = json.model || json.hacker || json;
          break;
        }
      }
    } catch { }
  }

  // 1b. Fetch Real-Time Scores & Global Leaderboard Rank Data
  const scoreUrls = [
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_data?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_data?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_data?_t=${timestamp}`)}`
  ];

  for (const sUrl of scoreUrls) {
    try {
      const res = await fetch(sUrl, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.model || json.hacker || json.rank !== undefined || json.score !== undefined)) {
          scoresData = json.model || json.hacker || json;
          break;
        }
      }
    } catch { }
  }

  // 2. Fetch Badges
  const badgeUrls = [
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges?_t=${timestamp}`)}`
  ];

  for (const bUrl of badgeUrls) {
    try {
      const res = await fetch(bUrl, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const rawBadges = Array.isArray(json?.models) ? json.models : (Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []));
        if (rawBadges.length > 0) {
          badgesData = rawBadges;
          break;
        }
      }
    } catch { }
  }

  // 3. Fetch Certificates (Community API, REST API, & Profile HTML Next.js payload)
  const certUrls = [
    `https://www.hackerrank.com/community/v1/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/community/v1/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/community/v1/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`)}`,
    `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/certificates?_t=${timestamp}`)}`
  ];

  for (const cUrl of certUrls) {
    try {
      const res = await fetch(cUrl, { cache: "no-store", signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const rawList = Array.isArray(json?.models) ? json.models : (Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []));
        if (rawList.length > 0) {
          certsData = rawList;
          break;
        }
      }
    } catch { }
  }

  // Fallback to profileData certificates if separate API calls returned empty
  if (certsData.length === 0 && profileData?.certificates && Array.isArray(profileData.certificates)) {
    certsData = profileData.certificates;
  }

  // HTML & Next.js __NEXT_DATA__ Payload Scraper Fallback if certificates is still 0
  if (certsData.length === 0) {
    const htmlUrls = [
      `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerrank.com/profile/${encodeURIComponent(username)}`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerrank.com/profile/${encodeURIComponent(username)}`)}`
    ];

    for (const hUrl of htmlUrls) {
      try {
        const res = await fetch(hUrl, { signal: AbortSignal.timeout(7000) });
        if (res.ok) {
          const html = await res.text();
          
          // 1. Try Next.js __NEXT_DATA__
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
          if (nextDataMatch) {
            try {
              const nextData = JSON.parse(nextDataMatch[1]);
              const pageProps = nextData?.props?.pageProps;
              const certsInProps = pageProps?.certificates || pageProps?.initialState?.hacker?.certificates || pageProps?.hacker?.certificates || pageProps?.userProfile?.certificates || pageProps?.profile?.certificates;
              if (Array.isArray(certsInProps) && certsInProps.length > 0) {
                certsData = certsInProps;
                break;
              }
            } catch { }
          }

          // 2. Try raw JSON regex match in HTML
          const jsonCertMatch = html.match(/"certificates"\s*:\s*(\[[^\]]+\])/i) || html.match(/"hacker_certificates"\s*:\s*(\[[^\]]+\])/i);
          if (jsonCertMatch) {
            try {
              const certList = JSON.parse(jsonCertMatch[1]);
              if (Array.isArray(certList) && certList.length > 0) {
                certsData = certList;
                break;
              }
            } catch { }
          }

          // 3. Fallback regex scan for verified certificate titles in HTML
          const certTitleMatches = Array.from(html.matchAll(/(C#|SQL|Software Engineer|Frontend Developer|Rest API|React|R|CSS|Angular|Python|Problem Solving|JavaScript|Go|Java|Node\.js|Node)\s*\((Basic|Intermediate|Advanced)\)|(Software Engineer Intern|Software Engineer|Frontend Developer \(React\))/ig));
          if (certTitleMatches.length > 0) {
            const uniqueTitles = new Set<string>();
            certTitleMatches.forEach(m => {
              if (m[0]) uniqueTitles.add(m[0].trim());
            });
            if (uniqueTitles.size > 0) {
              certsData = Array.from(uniqueTitles).map(title => ({
                heading: title,
                certificate_url: `https://www.hackerrank.com/profile/${encodeURIComponent(username)}`
              }));
              break;
            }
          }
        }
      } catch { }
    }
  }

  // Parse & Deduplicate Badges
  const rawBadges: HackerRankBadge[] = badgesData
    .filter((b: any) => (b.stars && b.stars > 0) || (b.solved && b.solved > 0) || b.badge_name || b.title)
    .map((b: any) => ({
      badge_name: b.badge_name || b.badge_type || b.title || b.name || "Domain Badge",
      stars: Math.min(6, Math.max(1, typeof b.stars === "number" ? b.stars : (parseInt(String(b.stars || 1)) || 1))),
      icon: b.icon || b.badge_image || b.icon_url || undefined,
      category: b.category || b.domain || "Domain Badge"
    }));

  const uniqueBadgesMap = new Map<string, HackerRankBadge>();
  rawBadges.forEach(b => {
    const key = b.badge_name.toLowerCase().trim();
    if (!uniqueBadgesMap.has(key) || (b.stars > (uniqueBadgesMap.get(key)?.stars || 0))) {
      uniqueBadgesMap.set(key, b);
    }
  });
  const parsedBadges = Array.from(uniqueBadgesMap.values());
  const totalStars = parsedBadges.reduce((acc, curr) => acc + (curr.stars || 1), 0);
  const badgesCount = parsedBadges.length;

  // Calculate Total Solved from Badges or Solved challenges
  let totalSolved = 0;
  badgesData.forEach((b: any) => {
    if (typeof b.solved === "number") totalSolved += b.solved;
    else if (typeof b.solved_challenges === "number") totalSolved += b.solved_challenges;
  });
  if (totalSolved === 0 && profileData?.solved_challenges_count) {
    totalSolved = profileData.solved_challenges_count;
  }
  if (totalSolved === 0 && parsedBadges.length > 0) {
    totalSolved = parsedBadges.reduce((acc, curr) => acc + (curr.stars * 15), 0);
  }

  // Parse & Deduplicate Certificates
  const rawCerts: HackerRankCertificate[] = certsData
    .filter((c: any) => c.heading || c.certificate_name || c.title || c.label || c.name)
    .map((c: any) => {
      const heading = c.heading || c.certificate_name || c.title || c.label || c.name || c.attributes?.heading || "HackerRank Skill Certificate";
      const level = c.level || c.attributes?.level || c.certificate_level || undefined;
      const certId = c.certificate_id || c.id || c.hash || c.certificate_hash || c.attributes?.certificate_id;
      const certificate_url = c.certificate_url || c.url || c.link || (certId ? `https://www.hackerrank.com/certificates/${certId}` : `https://www.hackerrank.com/profile/${encodeURIComponent(username)}`);
      const earned_at = c.earned_at || c.completed_at || c.created_at || c.attributes?.earned_at || undefined;

      return {
        heading: heading.trim(),
        level,
        certificate_url,
        earned_at,
      };
    });

  const uniqueCertsMap = new Map<string, HackerRankCertificate>();
  rawCerts.forEach(c => {
    const key = c.heading.toLowerCase().trim();
    if (!uniqueCertsMap.has(key)) {
      uniqueCertsMap.set(key, c);
    }
  });
  const parsedCerts = Array.from(uniqueCertsMap.values());
  const certificatesCount = parsedCerts.length;

  const name = profileData?.name || profileData?.personal_first_name || scoresData?.name || null;
  const avatar = profileData?.avatar || profileData?.profile_image || scoresData?.avatar || null;
  const country = profileData?.country || scoresData?.country || null;
  const school = profileData?.school || profileData?.college || scoresData?.school || null;
  const level = profileData?.level || scoresData?.level || null;
  
  const rawRank = scoresData?.rank || scoresData?.leaderboard_rank || profileData?.rank || profileData?.global_rank || profileData?.leaderboard_rank || profileData?.hacker_rank || profileData?.country_rank || null;
  const globalRank = rawRank ? (typeof rawRank === "number" ? rawRank : (parseInt(String(rawRank).replace(/[^0-9]/g, "")) || rawRank)) : null;
  const realScore = scoresData?.score || profileData?.score || undefined;

  if (profileData || scoresData || parsedBadges.length > 0 || parsedCerts.length > 0) {
    return {
      data: {
        username,
        name,
        avatar,
        country,
        school,
        level,
        totalSolved,
        badgesCount,
        totalStars,
        badges: parsedBadges,
        certificatesCount,
        certificates: parsedCerts,
        globalRank,
        score: realScore,
        last_updated: new Date().toISOString(),
      },
      error: null,
    };
  }

  return {
    data: null,
    error: `Could not fetch HackerRank profile for "${username}". Please verify the username.`,
  };
}

/**
 * Fetches HackerEarth statistics using HackerEarth public APIs & multi-tiered CORS proxies.
 */
export async function fetchHackerEarthStats(usernameInput: string): Promise<{
  data: HackerEarthStats | null;
  error: string | null;
}> {
  const username = extractUsername(usernameInput).replace(/^@+/, "");
  if (!username) {
    return { data: null, error: "HackerEarth handle is required" };
  }

  let rating = 0;
  let maxRating = 0;
  let totalSolved = 0;
  let contestsAttended = 0;
  let globalRank: number | null = null;
  let rankTitle: string | null = null;
  let name: string | null = null;
  let avatar: string | null = null;
  let country: string | null = null;

  let fetchedOk = false;
  const timestamp = Date.now();

  // Query HackerEarth endpoints via proxies and direct APIs
  const urls = [
    `https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        fetchedOk = true;
        const text = await res.text();
        
        // Try JSON parse first
        try {
          const json = JSON.parse(text);
          if (json && typeof json === "object") {
            rating = parseInt(String(json.rating || json.current_rating || json.rating_number || 0)) || rating;
            maxRating = parseInt(String(json.max_rating || json.peak_rating || json.best_rating || 0)) || maxRating;
            totalSolved = parseInt(String(json.total_problems_solved || json.solved || json.problems_solved || 0)) || totalSolved;
            contestsAttended = parseInt(String(json.contests_attended || json.contests || 0)) || contestsAttended;
            globalRank = parseInt(String(json.global_rank || json.rank_number || 0)) || globalRank;
            rankTitle = json.rank_title || json.rank || rankTitle;
            name = json.name || json.fullname || name;
            avatar = json.avatar || json.profile_picture || json.image || avatar;
            country = json.country || country;
            if (rating > 0 || totalSolved > 0 || name) break;
          }
        } catch {
          // HTML Parsing
          const ratingMatch = text.match(/rating-number[^>]*>(\d+)/i) || text.match(/Rating:\s*(\d+)/i) || text.match(/class="[^"]*rating[^"]*"[^>]*>(\d+)/i);
          const maxRatingMatch = text.match(/max-rating[^>]*>(\d+)/i) || text.match(/Best Rating:\s*(\d+)/i);
          const solvedMatch = text.match(/problems-solved[^>]*>(\d+)/i) || text.match(/Solved:\s*(\d+)/i) || text.match(/Problems Solved[\s\S]{0,80}?(\d+)/i);
          const contestMatch = text.match(/contests-attended[^>]*>(\d+)/i) || text.match(/Contests:\s*(\d+)/i) || text.match(/Contests Attended[\s\S]{0,80}?(\d+)/i);
          const rankMatch = text.match(/Global Rank[\s\S]{0,80}?#?(\d+)/i) || text.match(/global-rank[^>]*>#?(\d+)/i);
          const nameMatch = text.match(/class="name"[^>]*>([^<]+)</i) || text.match(/<h1[^>]*>([^<]+)<\/h1>/i) || text.match(/<title>([^<|]+)/i);
          const avatarMatch = text.match(/class="profile-pic"[^>]*src="([^"]+)"/i) || text.match(/class="avatar"[^>]*src="([^"]+)"/i);

          if (ratingMatch) rating = parseInt(ratingMatch[1]) || rating;
          if (maxRatingMatch) maxRating = parseInt(maxRatingMatch[1]) || maxRating;
          if (solvedMatch) totalSolved = parseInt(solvedMatch[1]) || totalSolved;
          if (contestMatch) contestsAttended = parseInt(contestMatch[1]) || contestsAttended;
          if (rankMatch) globalRank = parseInt(rankMatch[1]) || globalRank;
          if (nameMatch) {
            const rawName = nameMatch[1].replace(/HackerEarth Profile/i, "").replace(/HackerEarth/i, "").trim();
            if (rawName) name = rawName;
          }
          if (avatarMatch) avatar = avatarMatch[1];

          if (rating > 0 || totalSolved > 0 || name) break;
        }
      }
    } catch { }
  }

  // Derive rank title if missing
  if (!rankTitle && rating > 0) {
    if (rating >= 2000) rankTitle = "Candidate Master";
    else if (rating >= 1600) rankTitle = "Expert";
    else if (rating >= 1400) rankTitle = "Specialist";
    else rankTitle = "Problem Solver";
  }

  if (fetchedOk || rating > 0 || totalSolved > 0 || name) {
    return {
      data: {
        username,
        name: name || username,
        avatar,
        country,
        rating,
        maxRating: maxRating || rating,
        rank: rankTitle || "HackerEarth Developer",
        globalRank,
        totalSolved,
        contestsAttended,
        badges: [
          { name: rankTitle || "HackerEarth Solver", description: "HackerEarth competitive programming status" }
        ],
        last_updated: new Date().toISOString(),
      },
      error: null,
    };
  }

  return {
    data: null,
    error: `Could not fetch HackerEarth handle "${username}". Please verify the username.`,
  };
}
