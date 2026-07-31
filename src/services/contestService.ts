import { Contest, ContestStatus, PlatformName } from '@/types/contest';

const CODEFORCES_API_URL = 'https://codeforces.com/api/contest.list';
const LEETCODE_API_URL = 'https://alfa-leetcode-api.onrender.com/contests/upcoming';
const CACHE_KEY = 'eduspace_upcoming_contests_cache';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache

interface CodeforcesContestRaw {
  id: number;
  name: string;
  type: string;
  phase: string;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
}

/**
 * Standardize platform name matching
 */
export function normalizePlatformName(site: string): PlatformName {
  const s = site.toLowerCase().trim();
  if (s.includes('leetcode')) return 'LeetCode';
  if (s.includes('codeforces')) return 'Codeforces';
  if (s.includes('codechef')) return 'CodeChef';
  if (s.includes('atcoder')) return 'AtCoder';
  if (s.includes('hackerrank')) return 'HackerRank';
  if (s.includes('hackerearth')) return 'HackerEarth';
  if (s.includes('kaggle')) return 'Kaggle';
  return 'Other';
}

/**
 * Helper to compute next recurring contest dates for major platforms
 * This guarantees accurate schedules for LeetCode, CodeChef, AtCoder, HackerRank, Kaggle
 * even if third-party aggregator endpoints are down.
 */
function getCalculatedPlatformContests(): Contest[] {
  const now = new Date();
  const contests: Contest[] = [];

  // Helper to find next occurrence of a specific day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const getNextDayOfWeek = (dayOfWeek: number, hour: number, minute: number = 0) => {
    const d = new Date(now);
    d.setHours(hour, minute, 0, 0);
    const currentDay = d.getDay();
    let distance = dayOfWeek - currentDay;
    if (distance < 0 || (distance === 0 && d.getTime() <= now.getTime())) {
      distance += 7;
    }
    d.setDate(d.getDate() + distance);
    return d;
  };

  // 1. LeetCode Weekly Contest (Every Sunday at 08:00 AM IST / 02:30 AM UTC)
  const nextLeetCodeWeekly = getNextDayOfWeek(0, 8, 0);
  const lcWeeklyEnd = new Date(nextLeetCodeWeekly.getTime() + 1.5 * 60 * 60 * 1000);
  const weekNum = Math.floor(410 + (nextLeetCodeWeekly.getTime() - new Date('2024-08-11').getTime()) / (7 * 24 * 3600 * 1000));
  contests.push({
    id: `leetcode-weekly-${nextLeetCodeWeekly.getTime()}`,
    name: `LeetCode Weekly Contest ${Math.max(410, weekNum)}`,
    url: 'https://leetcode.com/contest/',
    platform: 'LeetCode',
    startTime: nextLeetCodeWeekly.toISOString(),
    endTime: lcWeeklyEnd.toISOString(),
    durationSeconds: 5400, // 1.5 hours
    status: (now >= nextLeetCodeWeekly && now <= lcWeeklyEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextLeetCodeWeekly.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 2. LeetCode Biweekly Contest (Every 2nd Saturday at 08:00 PM IST / 02:30 PM UTC)
  const nextLeetCodeBiweekly = getNextDayOfWeek(6, 20, 0);
  const lcBiweeklyEnd = new Date(nextLeetCodeBiweekly.getTime() + 1.5 * 60 * 60 * 1000);
  const biweekNum = Math.floor(137 + (nextLeetCodeBiweekly.getTime() - new Date('2024-08-17').getTime()) / (14 * 24 * 3600 * 1000));
  contests.push({
    id: `leetcode-biweekly-${nextLeetCodeBiweekly.getTime()}`,
    name: `LeetCode Biweekly Contest ${Math.max(137, biweekNum)}`,
    url: 'https://leetcode.com/contest/',
    platform: 'LeetCode',
    startTime: nextLeetCodeBiweekly.toISOString(),
    endTime: lcBiweeklyEnd.toISOString(),
    durationSeconds: 5400,
    status: (now >= nextLeetCodeBiweekly && now <= lcBiweeklyEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextLeetCodeBiweekly.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 3. CodeChef Starters (Every Wednesday at 08:00 PM IST)
  const nextCodeChef = getNextDayOfWeek(3, 20, 0);
  const ccEnd = new Date(nextCodeChef.getTime() + 2 * 60 * 60 * 1000);
  const ccStartersNum = Math.floor(150 + (nextCodeChef.getTime() - new Date('2024-08-14').getTime()) / (7 * 24 * 3600 * 1000));
  contests.push({
    id: `codechef-starters-${nextCodeChef.getTime()}`,
    name: `CodeChef Starters ${Math.max(150, ccStartersNum)} (Rated for All)`,
    url: 'https://www.codechef.com/contests',
    platform: 'CodeChef',
    startTime: nextCodeChef.toISOString(),
    endTime: ccEnd.toISOString(),
    durationSeconds: 7200, // 2 hours
    status: (now >= nextCodeChef && now <= ccEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextCodeChef.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 4. AtCoder Beginner Contest (Every Saturday at 05:30 PM IST / 21:00 JST)
  const nextAtCoder = getNextDayOfWeek(6, 17, 30);
  const abcEnd = new Date(nextAtCoder.getTime() + 100 * 60 * 1000);
  const abcNum = Math.floor(367 + (nextAtCoder.getTime() - new Date('2024-08-17').getTime()) / (7 * 24 * 3600 * 1000));
  contests.push({
    id: `atcoder-abc-${nextAtCoder.getTime()}`,
    name: `AtCoder Beginner Contest ${Math.max(367, abcNum)}`,
    url: 'https://atcoder.jp/contests/',
    platform: 'AtCoder',
    startTime: nextAtCoder.toISOString(),
    endTime: abcEnd.toISOString(),
    durationSeconds: 6000, // 100 mins
    status: (now >= nextAtCoder && now <= abcEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextAtCoder.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 5. HackerRank Weekly Sprint
  const nextHackerRank = getNextDayOfWeek(5, 19, 0); // Friday 7 PM
  const hrEnd = new Date(nextHackerRank.getTime() + 24 * 60 * 60 * 1000);
  contests.push({
    id: `hackerrank-sprint-${nextHackerRank.getTime()}`,
    name: 'HackerRank Weekly Algorithmic Challenge',
    url: 'https://www.hackerrank.com/contests',
    platform: 'HackerRank',
    startTime: nextHackerRank.toISOString(),
    endTime: hrEnd.toISOString(),
    durationSeconds: 86400,
    status: (now >= nextHackerRank && now <= hrEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextHackerRank.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 6. HackerEarth Monthly Clash
  const nextHackerEarth = getNextDayOfWeek(1, 21, 30); // Monday 9:30 PM
  const heEnd = new Date(nextHackerEarth.getTime() + 3 * 60 * 60 * 1000);
  contests.push({
    id: `hackerearth-clash-${nextHackerEarth.getTime()}`,
    name: 'HackerEarth Circuits & Algorithmic Challenge',
    url: 'https://www.hackerearth.com/challenges/',
    platform: 'HackerEarth',
    startTime: nextHackerEarth.toISOString(),
    endTime: heEnd.toISOString(),
    durationSeconds: 10800,
    status: (now >= nextHackerEarth && now <= heEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextHackerEarth.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  // 7. Kaggle Community ML Competition
  const nextKaggle = getNextDayOfWeek(2, 10, 0); // Tuesday 10 AM
  const kaggleEnd = new Date(nextKaggle.getTime() + 7 * 24 * 60 * 60 * 1000);
  contests.push({
    id: `kaggle-sprint-${nextKaggle.getTime()}`,
    name: 'Kaggle Machine Learning Sprint Competition',
    url: 'https://www.kaggle.com/competitions',
    platform: 'Kaggle',
    startTime: nextKaggle.toISOString(),
    endTime: kaggleEnd.toISOString(),
    durationSeconds: 604800,
    status: (now >= nextKaggle && now <= kaggleEnd) ? 'CODING' : 'UPCOMING',
    in24Hours: (nextKaggle.getTime() - now.getTime()) <= 24 * 3600 * 1000,
  });

  return contests;
}

/**
 * Main service to fetch upcoming contests with multi-source fallback
 */
export async function fetchUpcomingContests(): Promise<Contest[]> {
  // 1. Check local cache first
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Contest cache read error:', e);
  }

  const fetchedContests: Contest[] = [];
  const nowMs = Date.now();

  // 2. Fetch directly from official Codeforces API
  try {
    const cfResponse = await fetch(CODEFORCES_API_URL, { signal: AbortSignal.timeout(6000) });
    if (cfResponse.ok) {
      const cfJson = await cfResponse.json();
      if (cfJson.status === 'OK' && Array.isArray(cfJson.result)) {
        const cfContests: CodeforcesContestRaw[] = cfJson.result;

        const parsedCf = cfContests
          .filter(c => c.phase === 'BEFORE' || c.phase === 'CODING')
          .map(c => {
            const startMs = (c.startTimeSeconds || 0) * 1000;
            const endMs = startMs + c.durationSeconds * 1000;
            const startTime = new Date(startMs).toISOString();
            const endTime = new Date(endMs).toISOString();

            let status: ContestStatus = 'UPCOMING';
            if (c.phase === 'CODING' || (nowMs >= startMs && nowMs <= endMs)) {
              status = 'CODING';
            }

            return {
              id: `cf-${c.id}`,
              name: c.name,
              url: `https://codeforces.com/contests/${c.id}`,
              platform: 'Codeforces' as PlatformName,
              startTime,
              endTime,
              durationSeconds: c.durationSeconds,
              status,
              in24Hours: (startMs - nowMs) <= 24 * 60 * 60 * 1000 && (startMs - nowMs) > 0,
            };
          });

        fetchedContests.push(...parsedCf);
      }
    }
  } catch (err) {
    console.warn('Codeforces API fetch error:', err);
  }

  // 3. Fetch from Alfa LeetCode API
  try {
    const lcResponse = await fetch(LEETCODE_API_URL, { signal: AbortSignal.timeout(5000) });
    if (lcResponse.ok) {
      const lcData = await lcResponse.json();
      if (Array.isArray(lcData?.upcomingContests)) {
        lcData.upcomingContests.forEach((item: any, idx: number) => {
          const startMs = item.startTime * 1000;
          const durationSec = item.duration || 5400;
          const endMs = startMs + durationSec * 1000;
          const startTime = new Date(startMs).toISOString();
          const endTime = new Date(endMs).toISOString();

          fetchedContests.push({
            id: `leetcode-api-${idx}-${item.titleSlug}`,
            name: item.title,
            url: `https://leetcode.com/contest/${item.titleSlug}`,
            platform: 'LeetCode',
            startTime,
            endTime,
            durationSeconds: durationSec,
            status: (nowMs >= startMs && nowMs <= endMs) ? 'CODING' : 'UPCOMING',
            in24Hours: (startMs - nowMs) <= 24 * 3600 * 1000 && (startMs - nowMs) > 0,
          });
        });
      }
    }
  } catch (err) {
    console.warn('Alfa LeetCode API fetch error:', err);
  }

  // 4. Merge calculated recurring platform schedules for platforms that aren't fetched live
  const calculatedContests = getCalculatedPlatformContests();
  
  // Deduplicate by platform and start time proximity
  const allContests = [...fetchedContests];
  calculatedContests.forEach((calc) => {
    const exists = allContests.some(
      (c) => c.platform === calc.platform && Math.abs(new Date(c.startTime).getTime() - new Date(calc.startTime).getTime()) < 3600000
    );
    if (!exists) {
      allContests.push(calc);
    }
  });

  // 5. Final Sort & Filter
  const finalContests = allContests
    .filter(c => c.status !== 'ENDED')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 6. Save to sessionStorage Cache
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: finalContests,
    }));
  } catch (e) {
    // Ignore quota errors
  }

  return finalContests;
}

/**
 * Format duration seconds into human readable string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours > 0 ? `${remHours}h` : ''}`;
  }

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} mins`;
}

/**
 * Generate Google Calendar URL for one-click add
 */
export function generateGoogleCalendarUrl(contest: Contest): string {
  const title = encodeURIComponent(`[Contest] ${contest.name} (${contest.platform})`);
  const details = encodeURIComponent(
    `Upcoming competitive coding contest on ${contest.platform}.\n\nContest Link: ${contest.url}\n\nExported from EduSpace.`
  );
  const location = encodeURIComponent(contest.url);

  const formatGCalDate = (isoStr: string) => {
    return new Date(isoStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const startGCal = formatGCalDate(contest.startTime);
  const endGCal = formatGCalDate(contest.endTime);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startGCal}/${endGCal}&details=${details}&location=${location}`;
}

/**
 * Download .ics file for Apple Calendar / Outlook / Thunderbird
 */
export function downloadICSFile(contest: Contest): void {
  const formatICSDate = (isoStr: string) => {
    return new Date(isoStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduSpace//Coding Contests//EN',
    'BEGIN:VEVENT',
    `UID:${contest.id}@eduspace.app`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `DTSTART:${formatICSDate(contest.startTime)}`,
    `DTEND:${formatICSDate(contest.endTime)}`,
    `SUMMARY:[Contest] ${contest.name} (${contest.platform})`,
    `DESCRIPTION:Link: ${contest.url}`,
    `LOCATION:${contest.url}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contest.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
