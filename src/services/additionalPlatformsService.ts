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
  let solutionsSubmitted = 0;
  let points = 0;
  let contestsAttended = 0;
  let globalRank: number | null = null;
  let rankTitle: string | null = null;
  let name: string | null = null;
  let avatar: string | null = null;
  let country: string | null = null;
  let location: string | null = null;
  let company: string | null = null;
  let role: string | null = null;
  let education: string | null = null;
  let skills: string[] = [];
  let topPercentiles: { title: string; percentile: string }[] = [];

  const timestamp = Date.now();

  // Query HackerEarth endpoints via proxies and direct APIs
  const urls = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.hackerearth.com/profiles/api/${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`,
    `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(`https://www.hackerearth.com/@${encodeURIComponent(username)}/?_t=${timestamp}`)}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        let text = "";
        try {
          const resJson = await res.json();
          text = resJson?.contents || JSON.stringify(resJson);
        } catch {
          text = await res.text();
        }

        if (!text || text.includes("Access Denied") || text.includes("403 Forbidden") || text.includes("Just a moment...")) {
          continue;
        }
        
        // Try JSON parse first
        try {
          const json = JSON.parse(text);
          if (json && typeof json === "object") {
            const r = parseInt(String(json.rating || json.current_rating || json.rating_number || 0).replace(/,/g, "")) || 0;
            const mr = parseInt(String(json.max_rating || json.peak_rating || json.best_rating || 0).replace(/,/g, "")) || 0;
            const s = parseInt(String(json.total_problems_solved || json.solved || json.problems_solved || 0).replace(/,/g, "")) || 0;
            const sub = parseInt(String(json.solutions_submitted || json.total_submissions || json.submissions || 0).replace(/,/g, "")) || 0;
            const pts = parseInt(String(json.points || json.hacker_points || json.score || 0).replace(/,/g, "")) || 0;
            const c = parseInt(String(json.contests_attended || json.contests || 0).replace(/,/g, "")) || 0;
            const gr = parseInt(String(json.global_rank || json.rank_number || 0).replace(/,/g, "")) || null;

            if (r > 0) rating = r;
            if (mr > 0) maxRating = mr;
            if (s > 0) totalSolved = s;
            if (sub > 0) solutionsSubmitted = sub;
            if (pts > 0) points = pts;
            if (c > 0) contestsAttended = c;
            if (gr) globalRank = gr;
            if (json.rank_title || json.rank) rankTitle = json.rank_title || json.rank;
            if (json.name || json.fullname) name = json.name || json.fullname;
            if (json.avatar || json.profile_picture || json.image) avatar = json.avatar || json.profile_picture || json.image;
            if (json.country) country = json.country;
            if (json.location || json.city) location = json.location || json.city;
            if (json.company || json.organization) company = json.company || json.organization;
            if (json.role || json.designation) role = json.role || json.designation;
            if (json.education || json.degree) education = json.education || json.degree;
            if (Array.isArray(json.skills)) skills = json.skills;

            if (rating > 0 || totalSolved > 0 || points > 0) break;
          }
        } catch {
          // Comprehensive JSON & HTML Regex Extractions
          const ratingMatch = text.match(/"rating"\s*:\s*"?([\d,]+)"?/i) || text.match(/"current_rating"\s*:\s*"?([\d,]+)"?/i) || text.match(/rating-number[^>]*>([\d,]+)/i) || text.match(/Rating:\s*([\d,]+)/i) || text.match(/class="[^"]*rating[^"]*"[^>]*>([\d,]+)/i) || text.match(/([\d,]+)\s*Contest Ratings/i);
          const maxRatingMatch = text.match(/"max_rating"\s*:\s*"?([\d,]+)"?/i) || text.match(/"peak_rating"\s*:\s*"?([\d,]+)"?/i) || text.match(/max-rating[^>]*>([\d,]+)/i) || text.match(/Best Rating:\s*([\d,]+)/i);
          const solvedMatch = text.match(/"total_problems_solved"\s*:\s*"?([\d,]+)"?/i) || text.match(/"problems_solved"\s*:\s*"?([\d,]+)"?/i) || text.match(/"solved"\s*:\s*"?([\d,]+)"?/i) || text.match(/problems-solved[^>]*>([\d,]+)/i) || text.match(/Solved:\s*([\d,]+)/i) || text.match(/Problems Solved[\s\S]{0,100}?([\d,]+)/i) || text.match(/([\d,]+)\s*Problems Solved/i);
          const pointsMatch = text.match(/"points"\s*:\s*"?([\d,]+)"?/i) || text.match(/"hacker_points"\s*:\s*"?([\d,]+)"?/i) || text.match(/Points[\s\S]{0,100}?([\d,]+)/i) || text.match(/([\d,]+)\s*Points/i);
          const submissionsMatch = text.match(/"solutions_submitted"\s*:\s*"?([\d,]+)"?/i) || text.match(/"total_submissions"\s*:\s*"?([\d,]+)"?/i) || text.match(/"submissions"\s*:\s*"?([\d,]+)"?/i) || text.match(/Solutions Submitted[\s\S]{0,100}?([\d,]+)/i) || text.match(/Submissions[\s\S]{0,100}?([\d,]+)/i) || text.match(/([\d,]+)\s*Solutions Submitted/i);
          const contestMatch = text.match(/"contests"\s*:\s*"?([\d,]+)"?/i) || text.match(/contests-attended[^>]*>([\d,]+)/i) || text.match(/Contests:\s*([\d,]+)/i) || text.match(/Contests Attended[\s\S]{0,100}?([\d,]+)/i);
          const rankMatch = text.match(/"global_rank"\s*:\s*"?([\d,]+)"?/i) || text.match(/Global Rank[\s\S]{0,100}?#?([\d,]+)/i) || text.match(/global-rank[^>]*>#?([\d,]+)/i);
          const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/i) || text.match(/class="name"[^>]*>([^<]+)</i) || text.match(/<h1[^>]*>([^<]+)<\/h1>/i) || text.match(/<title>([^<|]+)/i);
          const avatarMatch = text.match(/"avatar"\s*:\s*"([^"]+)"/i) || text.match(/class="profile-pic"[^>]*src="([^"]+)"/i) || text.match(/class="avatar"[^>]*src="([^"]+)"/i);
          const compMatch = text.match(/(?:SWE|Engineer|Developer|Manager|Consultant)\s*@\s*[\w\s]+/i) || text.match(/class="[^"]*company[^"]*"[^>]*>([^<]+)/i);
          const locMatch = text.match(/class="[^"]*location[^"]*"[^>]*>([^<]+)/i) || text.match(/([A-Za-z\s]+,\s*[A-Z]{2},\s*[A-Za-z\s]+)/);

          if (ratingMatch) rating = parseInt(ratingMatch[1].replace(/,/g, "")) || rating;
          if (maxRatingMatch) maxRating = parseInt(maxRatingMatch[1].replace(/,/g, "")) || maxRating;
          if (solvedMatch) totalSolved = parseInt(solvedMatch[1].replace(/,/g, "")) || totalSolved;
          if (pointsMatch) points = parseInt(pointsMatch[1].replace(/,/g, "")) || points;
          if (submissionsMatch) solutionsSubmitted = parseInt(submissionsMatch[1].replace(/,/g, "")) || solutionsSubmitted;
          if (contestMatch) contestsAttended = parseInt(contestMatch[1].replace(/,/g, "")) || contestsAttended;
          if (rankMatch) globalRank = parseInt(rankMatch[1].replace(/,/g, "")) || globalRank;
          if (nameMatch) {
            const rawName = nameMatch[1].replace(/HackerEarth Profile/i, "").replace(/HackerEarth/i, "").trim();
            if (rawName && rawName.toLowerCase() !== username.toLowerCase()) name = rawName;
          }
          if (avatarMatch) avatar = avatarMatch[1];
          if (compMatch) company = compMatch[1] || compMatch[0];
          if (locMatch) location = locMatch[1] || locMatch[0];

          // Top Percentile Matches
          const percentileMatches = [...text.matchAll(/Top\s*(\d+%)\s*in\s*([A-Za-z0-9\s]+)/gi)];
          percentileMatches.forEach((m) => {
            if (m[1] && m[2]) {
              const perc = `Top ${m[1]}`;
              const title = m[2].trim();
              if (!topPercentiles.some((p) => p.title === title)) {
                topPercentiles.push({ title, percentile: perc });
              }
            }
          });

          // Deep Script Tag Embedded JSON Extraction (React / Next.js profile state)
          const scriptJsonMatches = [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
          for (const sMatch of scriptJsonMatches) {
            const sText = sMatch[1];
            if (sText && (sText.includes("rating") || sText.includes("solved") || sText.includes("points") || sText.includes("submissions"))) {
              const r = sText.match(/"rating"\s*:\s*"?([\d,]+)"?/i) || sText.match(/rating\s*:\s*"?([\d,]+)"?/i) || sText.match(/"rating_number"\s*:\s*"?([\d,]+)"?/i);
              const mr = sText.match(/"max_rating"\s*:\s*"?([\d,]+)"?/i) || sText.match(/max_rating\s*:\s*"?([\d,]+)"?/i) || sText.match(/"peak_rating"\s*:\s*"?([\d,]+)"?/i);
              const s = sText.match(/"total_problems_solved"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"problems_solved"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"solved"\s*:\s*"?([\d,]+)"?/i) || sText.match(/solved\s*:\s*"?([\d,]+)"?/i);
              const sub = sText.match(/"solutions_submitted"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"total_submissions"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"submissions"\s*:\s*"?([\d,]+)"?/i);
              const pts = sText.match(/"points"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"hacker_points"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"score"\s*:\s*"?([\d,]+)"?/i);
              const c = sText.match(/"contests"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"contests_attended"\s*:\s*"?([\d,]+)"?/i);
              const gr = sText.match(/"global_rank"\s*:\s*"?([\d,]+)"?/i) || sText.match(/"rank_number"\s*:\s*"?([\d,]+)"?/i);
              const n = sText.match(/"name"\s*:\s*"([^"]+)"/i) || sText.match(/"fullname"\s*:\s*"([^"]+)"/i);

              if (r) rating = parseInt(r[1].replace(/,/g, "")) || rating;
              if (mr) maxRating = parseInt(mr[1].replace(/,/g, "")) || maxRating;
              if (s) totalSolved = parseInt(s[1].replace(/,/g, "")) || totalSolved;
              if (sub) solutionsSubmitted = parseInt(sub[1].replace(/,/g, "")) || solutionsSubmitted;
              if (pts) points = parseInt(pts[1].replace(/,/g, "")) || points;
              if (c) contestsAttended = parseInt(c[1].replace(/,/g, "")) || contestsAttended;
              if (gr) globalRank = parseInt(gr[1].replace(/,/g, "")) || globalRank;
              if (n && n[1] && n[1].toLowerCase() !== username.toLowerCase()) name = n[1];
            }
          }

          if (rating > 0 || totalSolved > 0 || points > 0) break;
        }
      }
    } catch { }
  }

  // Rank title derivation from real live rating
  let finalRankTitle = rankTitle;
  if (!finalRankTitle) {
    if (rating >= 2000) finalRankTitle = "Candidate Master";
    else if (rating >= 1600) finalRankTitle = "Expert";
    else if (rating >= 1400) finalRankTitle = "Specialist";
    else if (rating > 0) finalRankTitle = "Competitive Solver";
    else finalRankTitle = "HackerEarth Developer";
  }

  // Return parsed profile data if at least one key metric was successfully extracted
  if (rating > 0 || totalSolved > 0 || points > 0 || solutionsSubmitted > 0 || contestsAttended > 0 || globalRank !== null) {
    return {
      data: {
        username,
        name: name || username,
        avatar,
        country,
        location,
        company,
        role,
        education,
        skills,
        points,
        rating,
        maxRating: maxRating || rating,
        rank: finalRankTitle,
        globalRank,
        totalSolved,
        solutionsSubmitted,
        contestsAttended,
        topPercentiles,
        badges: [
          { name: finalRankTitle, description: "HackerEarth competitive programming status" }
        ],
        last_updated: new Date().toISOString(),
      },
      error: null,
    };
  }

  return {
    data: null,
    error: `Could not fetch HackerEarth profile metrics for "${username}". HackerEarth protects public profiles against automated third-party CORS proxies and web scrapers. Please verify the handle or try again later.`,
  };
}
