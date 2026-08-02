import { ChessStats, ChessRatingStats, ChessGame, ChessAchievements } from "@/types/chessProfile";

/**
 * Clean and extract Chess.com username handle from direct handle input or URL.
 */
export function extractChessUsername(input: string): string {
  if (!input) return "";
  let clean = input.trim();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?(chess\.com\/member\/|chess\.com\/profile\/)/i, "");
  clean = clean.split("/")[0].split("?")[0].replace(/^@/, "");
  return clean.trim();
}

/**
 * Format timestamp (seconds or ms) to standard ISO string or readable date
 */
function formatUnixTimestamp(ts?: number): string | null {
  if (!ts) return null;
  const ms = ts < 10000000000 ? ts * 1000 : ts;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

/**
 * Helper to safely extract country code from Chess.com country API URL
 * e.g., "https://api.chess.com/pub/country/US" -> "us"
 */
function parseCountryCode(countryUrl?: string): { code: string | null; flagUrl: string | null } {
  if (!countryUrl) return { code: null, flagUrl: null };
  const parts = countryUrl.split("/");
  const code = parts[parts.length - 1]?.toLowerCase() || null;
  if (code && code.length === 2 && code !== "xx") {
    return {
      code: code.toUpperCase(),
      flagUrl: `https://flagcdn.com/w40/${code}.png`,
    };
  }
  return { code: null, flagUrl: null };
}

/**
 * Helper to calculate rating statistics from Chess.com mode block
 */
function parseModeStats(modeData: any): ChessRatingStats | null {
  if (!modeData) return null;

  const currentRating = modeData.last?.rating || modeData.highest?.rating || modeData.rating || 0;
  const highestRating = modeData.best?.rating || modeData.highest?.rating || currentRating;
  const highestDate = formatUnixTimestamp(modeData.best?.date || modeData.highest?.date);

  const wins = modeData.record?.win || 0;
  const losses = modeData.record?.loss || 0;
  const draws = modeData.record?.draw || 0;
  const gamesPlayed = wins + losses + draws;

  const winPercentage = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 1000) / 10 : 0;

  if (currentRating === 0 && gamesPlayed === 0 && !highestRating) {
    return null;
  }

  return {
    currentRating,
    highestRating,
    highestDate,
    gamesPlayed,
    wins,
    losses,
    draws,
    winPercentage,
  };
}

/**
 * Fetches real-time public Chess.com profile data, ratings, statistics, achievements, and recent activity.
 */
export async function fetchChessStats(
  usernameInput: string
): Promise<{ data: ChessStats | null; error: string | null }> {
  const username = extractChessUsername(usernameInput);
  if (!username) {
    return { data: null, error: "Chess.com profile not found." };
  }

  const profileApiUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}`;
  const statsApiUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`;
  const archivesApiUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`;

  try {
    // 1. Fetch Profile Info
    let profileRes: Response | null = null;
    try {
      profileRes = await fetch(profileApiUrl, {
        headers: { "User-Agent": "EduSpace-App/1.0" },
        signal: AbortSignal.timeout(6000),
      });
    } catch {
      // Fallback via CORS proxy if direct fetch is blocked
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(profileApiUrl)}`;
      profileRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
    }

    if (!profileRes || !profileRes.ok) {
      if (profileRes && profileRes.status === 404) {
        return { data: null, error: "Chess.com profile not found." };
      }
      return { data: null, error: "Unable to fetch Chess.com profile. Please try again later." };
    }

    const profileData = await profileRes.json();
    if (!profileData || (!profileData.username && !profileData.player_id)) {
      return { data: null, error: "Chess.com profile not found." };
    }

    // 2. Fetch Ratings & Statistics
    let statsData: any = {};
    try {
      let statsRes: Response | null = null;
      try {
        statsRes = await fetch(statsApiUrl, {
          headers: { "User-Agent": "EduSpace-App/1.0" },
          signal: AbortSignal.timeout(6000),
        });
      } catch {
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(statsApiUrl)}`;
        statsRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
      }

      if (statsRes && statsRes.ok) {
        statsData = await statsRes.json();
      }
    } catch {
      // Non-fatal if stats fail while profile exists
    }

    // 3. Fetch Recent Games (from latest monthly archive)
    let recentGames: ChessGame[] = [];
    let lastPlayedDate: string | null = null;

    try {
      let archivesRes: Response | null = null;
      try {
        archivesRes = await fetch(archivesApiUrl, {
          headers: { "User-Agent": "EduSpace-App/1.0" },
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(archivesApiUrl)}`;
        archivesRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(5000) });
      }

      if (archivesRes && archivesRes.ok) {
        const archivesJson = await archivesRes.json();
        const archives: string[] = archivesJson?.archives || [];
        if (archives.length > 0) {
          const latestArchiveUrl = archives[archives.length - 1];
          let monthGamesRes: Response | null = null;
          try {
            monthGamesRes = await fetch(latestArchiveUrl, {
              headers: { "User-Agent": "EduSpace-App/1.0" },
              signal: AbortSignal.timeout(6000),
            });
          } catch {
            const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(latestArchiveUrl)}`;
            monthGamesRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(6000) });
          }

          if (monthGamesRes && monthGamesRes.ok) {
            const monthData = await monthGamesRes.json();
            const rawGames: any[] = monthData?.games || [];
            const sortedGames = rawGames.sort((a, b) => (b.end_time || 0) - (a.end_time || 0));

            if (sortedGames.length > 0 && sortedGames[0].end_time) {
              lastPlayedDate = formatUnixTimestamp(sortedGames[0].end_time);
            }

            const targetHandle = (profileData.username || username).toLowerCase();

            recentGames = sortedGames.slice(0, 10).map((g) => {
              const isWhite = (g.white?.username || "").toLowerCase() === targetHandle;
              const userColor: 'white' | 'black' = isWhite ? 'white' : 'black';
              const userObj = isWhite ? g.white : g.black;
              const oppObj = isWhite ? g.black : g.white;

              let result: 'win' | 'loss' | 'draw' = 'draw';
              if (userObj?.result === 'win') {
                result = 'win';
              } else if (['agreed', 'repetition', 'stalemate', 'insufficient', '50move'].includes(userObj?.result)) {
                result = 'draw';
              } else {
                result = 'loss';
              }

              return {
                url: g.url || `https://www.chess.com/game/live/${g.time_control}`,
                pgn: g.pgn,
                timeControl: g.time_control || 'Live',
                endTime: g.end_time || Math.floor(Date.now() / 1000),
                timeClass: g.time_class || 'blitz',
                rules: g.rules || 'chess',
                white: { username: g.white?.username || 'White', rating: g.white?.rating || 0, result: g.white?.result || '' },
                black: { username: g.black?.username || 'Black', rating: g.black?.rating || 0, result: g.black?.result || '' },
                userColor,
                opponent: { username: oppObj?.username || 'Opponent', rating: oppObj?.rating || 0 },
                result,
              };
            });
          }
        }
      }
    } catch {
      // Recent games is optional enhancement
    }

    // 4. Parse country & flag
    const countryInfo = parseCountryCode(profileData.country);

    // 5. Parse mode stats
    const bullet = parseModeStats(statsData.chess_bullet);
    const blitz = parseModeStats(statsData.chess_blitz);
    const rapid = parseModeStats(statsData.chess_rapid);
    const daily = parseModeStats(statsData.chess_daily);
    const chess960 = parseModeStats(statsData.chess960_daily || statsData.chess960);

    // Parse tactics / puzzles
    let puzzle: ChessRatingStats | null = null;
    if (statsData.tactics || statsData.puzzle_rush) {
      const highestTactics = statsData.tactics?.highest?.rating || statsData.tactics?.lowest?.rating || 0;
      puzzle = {
        currentRating: highestTactics,
        highestRating: highestTactics,
        highestDate: formatUnixTimestamp(statsData.tactics?.highest?.date),
        gamesPlayed: statsData.tactics?.highest?.date ? 1 : 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winPercentage: 100,
      };
    }

    // 6. Aggregate Overall Statistics
    const allModes = [bullet, blitz, rapid, daily, chess960].filter(Boolean) as ChessRatingStats[];

    const totalWins = allModes.reduce((sum, m) => sum + m.wins, 0);
    const totalLosses = allModes.reduce((sum, m) => sum + m.losses, 0);
    const totalDraws = allModes.reduce((sum, m) => sum + m.draws, 0);
    const totalGamesPlayed = totalWins + totalLosses + totalDraws;

    const overallWinRate = totalGamesPlayed > 0 ? Math.round((totalWins / totalGamesPlayed) * 1000) / 10 : 0;
    const highestRatingAchieved = Math.max(
      ...allModes.map((m) => m.highestRating),
      puzzle?.highestRating || 0,
      0
    );

    // Favorite time control determination (mode with most games played)
    let favoriteTimeControl: string | null = null;
    let maxGames = 0;
    const modeNameMap: Record<string, ChessRatingStats | null> = {
      Bullet: bullet,
      Blitz: blitz,
      Rapid: rapid,
      Daily: daily,
    };
    for (const [modeName, modeObj] of Object.entries(modeNameMap)) {
      if (modeObj && modeObj.gamesPlayed > maxGames) {
        maxGames = modeObj.gamesPlayed;
        favoriteTimeControl = modeName;
      }
    }

    // 7. Extract Achievements & League
    const titles: string[] = [];
    if (profileData.title) {
      titles.push(profileData.title);
    }

    const league = profileData.league || statsData.league || null;
    const isVerified = Boolean(profileData.verified || profileData.status === 'verified' || profileData.title);

    const achievements: ChessAchievements = {
      league,
      titles,
      verified: isVerified,
      highestPuzzleRating: puzzle?.highestRating || statsData.tactics?.highest?.rating || undefined,
      puzzleRushBest: statsData.puzzle_rush?.best?.total_attempts || statsData.puzzle_rush?.best?.score || undefined,
    };

    // Calculate recent results summary
    let recentWins = 0;
    let recentLosses = 0;
    let recentDraws = 0;
    for (const g of recentGames) {
      if (g.result === 'win') recentWins++;
      else if (g.result === 'loss') recentLosses++;
      else recentDraws++;
    }

    const normalizedData: ChessStats = {
      username: profileData.username || username,
      name: profileData.name || null,
      avatar: profileData.avatar || null,
      country: countryInfo.code,
      countryCode: countryInfo.code,
      countryFlagUrl: countryInfo.flagUrl,
      location: profileData.location || null,
      league,
      followers: profileData.followers || 0,
      joinedDate: formatUnixTimestamp(profileData.joined),
      lastOnline: formatUnixTimestamp(profileData.last_online),
      verified: isVerified,
      profileUrl: profileData.url || `https://www.chess.com/member/${profileData.username || username}`,
      title: profileData.title || null,
      status: profileData.status || null,

      bullet,
      blitz,
      rapid,
      daily,
      chess960,
      puzzle,

      totalGamesPlayed,
      totalWins,
      totalLosses,
      totalDraws,
      overallWinRate,
      highestRatingAchieved,
      favoriteTimeControl,
      currentLeague: league,

      achievements,

      lastPlayedDate: lastPlayedDate || formatUnixTimestamp(profileData.last_online),
      recentGames,
      recentResultsSummary: {
        wins: recentWins,
        losses: recentLosses,
        draws: recentDraws,
      },
    };

    return { data: normalizedData, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: "Unable to fetch Chess.com profile. Please try again later.",
    };
  }
}
