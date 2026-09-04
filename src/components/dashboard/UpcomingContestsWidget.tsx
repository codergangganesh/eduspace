import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, Clock, RefreshCw, ChevronRight, CheckCircle2, CalendarPlus, ArrowRight } from 'lucide-react';
import { Contest, PlatformName } from '@/types/contest';
import { fetchUpcomingContests, formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformTheme {
  boxBg: string;
  pillBg: string;
  pillText: string;
  renderLogo: () => React.ReactNode;
}

const PLATFORM_THEMES: Record<PlatformName, PlatformTheme> = {
  HackerRank: {
    boxBg: 'bg-[#eafaf1] dark:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/40',
    pillBg: 'bg-[#dcfce7] dark:bg-emerald-900/60',
    pillText: 'text-[#15803d] dark:text-emerald-300',
    renderLogo: () => (
      <svg className="size-6 sm:size-7" viewBox="0 0 24 24" fill="none">
        <path d="M6.5 4.5V19.5M17.5 4.5V19.5M6.5 12H17.5" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  AtCoder: {
    boxBg: 'bg-[#e6f7f2] dark:bg-teal-950/40 border border-teal-100/80 dark:border-teal-900/40',
    pillBg: 'bg-[#ccfbf1] dark:bg-teal-900/60',
    pillText: 'text-[#0f766e] dark:text-teal-300',
    renderLogo: () => (
      <svg className="size-6 sm:size-6.5" viewBox="0 0 28 28" fill="none">
        <path d="M14 3.5L24 24.5H19L14 13.5L9 24.5H4L14 3.5Z" fill="#0f172a" className="dark:fill-slate-200" />
        <path d="M7.5 17L4 24.5H9L11 20L7.5 17Z" fill="#dc2626" />
      </svg>
    ),
  },
  LeetCode: {
    boxBg: 'bg-[#fff7ed] dark:bg-amber-950/40 border border-amber-100/80 dark:border-amber-900/40',
    pillBg: 'bg-[#ffedd5] dark:bg-amber-900/60',
    pillText: 'text-[#c2410c] dark:text-amber-300',
    renderLogo: () => (
      <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7 8 3 12 7 16" />
        <polyline points="17 8 21 12 17 16" />
        <line x1="14" y1="6" x2="10" y2="18" />
      </svg>
    ),
  },
  Codeforces: {
    boxBg: 'bg-[#eff6ff] dark:bg-blue-950/40 border border-blue-100/80 dark:border-blue-900/40',
    pillBg: 'bg-[#dbeafe] dark:bg-blue-900/60',
    pillText: 'text-[#1e40af] dark:text-blue-300',
    renderLogo: () => (
      <svg className="size-6 sm:size-7" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" fill="#2563eb" />
        <path d="M17 10.5C16.2 9.5 15 9 13.8 9 11.4 9 9.5 11.2 9.5 14s1.9 5 4.3 5c1.2 0 2.4-.5 3.2-1.5" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    ),
  },
  CodeChef: {
    boxBg: 'bg-[#fef3c7] dark:bg-amber-950/40 border border-amber-100/80 dark:border-amber-900/40',
    pillBg: 'bg-[#fde68a] dark:bg-amber-900/60',
    pillText: 'text-[#92400e] dark:text-amber-300',
    renderLogo: () => (
      <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 13.8a4.5 4.5 0 0 1-.8-8.9 5.5 5.5 0 0 1 10.6-1.5 4.5 4.5 0 0 1 2.2 8.4" />
        <path d="M6 14h12v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4z" />
      </svg>
    ),
  },
  HackerEarth: {
    boxBg: 'bg-[#eef2ff] dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/40',
    pillBg: 'bg-[#e0e7ff] dark:bg-indigo-900/60',
    pillText: 'text-[#3730a3] dark:text-indigo-300',
    renderLogo: () => (
      <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none">
        <rect width="20" height="20" x="2" y="2" rx="6" fill="#4f46e5" />
        <path d="M7 6.5v11M17 6.5v11M7 12h10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  Kaggle: {
    boxBg: 'bg-[#f0f9ff] dark:bg-sky-950/40 border border-sky-100/80 dark:border-sky-900/40',
    pillBg: 'bg-[#e0f2fe] dark:bg-sky-900/60',
    pillText: 'text-[#0369a1] dark:text-sky-300',
    renderLogo: () => (
      <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none">
        <path d="M7 4.5v15M17 5.5l-7 6.5 7 7.5" stroke="#0284c7" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  Other: {
    boxBg: 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700',
    pillBg: 'bg-slate-200/80 dark:bg-slate-800',
    pillText: 'text-slate-700 dark:text-slate-300',
    renderLogo: () => (
      <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
};

const CALENDAR_ADDED_KEY = 'eduspace_contest_calendar_added';

function formatContestStartLabel(startTimeIso: string) {
  const startDate = new Date(startTimeIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const contestDay = new Date(startDate);
  contestDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((contestDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const time = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Tomorrow, ${time}`;
  if (dayDiff > 1 && dayDiff < 7) {
    return `${startDate.toLocaleDateString(undefined, { weekday: 'short' })}, ${time}`;
  }

  const date = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date}, ${time}`;
}

export function UpcomingContestsWidget() {
  const { t } = useTranslation();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CALENDAR_ADDED_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      sessionStorage.removeItem('eduspace_upcoming_contests_cache');
      const data = await fetchUpcomingContests();
      setContests(data.slice(0, 4));
    } catch (e) {
      console.error('Failed to load contests widget data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const markCalendarAdded = (contestId: string) => {
    setCalendarAdded((current) => {
      if (current.includes(contestId)) return current;
      const updated = [...current, contestId];
      localStorage.setItem(CALENDAR_ADDED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-3 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="size-9 sm:size-10 rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] shadow-sm shadow-blue-500/25 text-white shrink-0">
            <Trophy className="size-4.5 sm:size-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
              {t("dashboard.upcomingContests", "Upcoming Contests")}
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate">
              {t("dashboard.competitiveSchedules", "Live competitive schedules")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title={t("common.refresh", "Refresh")}
            className="size-8 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all disabled:opacity-40"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/contests"
            className="h-8 px-2.5 sm:px-3 rounded-lg border border-blue-100 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/60 font-semibold text-[11px] sm:text-xs flex items-center gap-1 transition-all shrink-0"
          >
            {t("common.viewAll", "View All")} <ChevronRight className="size-3 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* Contest List */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 space-y-2.5">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex flex-col items-center shrink-0 w-[48px] sm:w-[54px]">
                  <Skeleton className="w-11 sm:w-12 h-9 sm:h-10 rounded-lg sm:rounded-xl" />
                  <Skeleton className="-mt-1.5 w-10 h-3 rounded-full" />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/5 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-2.5 w-2/5 rounded-md" />
                    <Skeleton className="h-2.5 w-1/4 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Skeleton className="size-7 sm:size-8 rounded-lg" />
                  <Skeleton className="h-7 sm:h-8 w-12 sm:w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t("dashboard.noContests", "No upcoming contests right now.")}
            </p>
            <Button variant="link" size="sm" onClick={() => loadData(true)} className="text-primary text-xs">
              {t("common.checkAgain", "Check again")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {contests.map((contest) => {
              const theme = PLATFORM_THEMES[contest.platform] || PLATFORM_THEMES.Other;
              const formattedDate = formatContestStartLabel(contest.startTime);
              const isCalendarAdded = calendarAdded.includes(contest.id);

              return (
                <div
                  key={contest.id}
                  className="group flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/85 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-200"
                >
                  {/* Left: Platform Logo Box + Overlapping Pill */}
                  <div className="flex flex-col items-center shrink-0 w-[48px] sm:w-[54px]">
                    <div className={`w-11 sm:w-12 h-9 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${theme.boxBg}`}>
                      {theme.renderLogo()}
                    </div>
                    <span className={`-mt-1.5 sm:-mt-2 px-1.5 sm:px-2 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold tracking-tight shadow-xs whitespace-nowrap z-10 ${theme.pillBg} ${theme.pillText}`}>
                      {contest.platform}
                    </span>
                  </div>

                  {/* Middle: Title & Meta Info */}
                  <div className="min-w-0 flex-1 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {contest.name}
                      </span>
                      {contest.status === 'CODING' && (
                        <span className="shrink-0 text-[8.5px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/70 flex items-center gap-0.5">
                          <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                          {t("dashboard.live", "Live")}
                        </span>
                      )}
                      {contest.in24Hours && contest.status !== 'CODING' && (
                        <span className="shrink-0 text-[8.5px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#ffedd5] dark:bg-amber-950/60 text-[#c2410c] dark:text-amber-300 border border-orange-200/60 dark:border-amber-900/60">
                          {t("dashboard.soon", "Soon")}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-0.5 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-1 min-w-0">
                        <Calendar className="size-2.5 sm:size-3 text-slate-700 dark:text-slate-300 shrink-0 stroke-[1.8]" />
                        <span className="truncate">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock className="size-2.5 sm:size-3 text-slate-700 dark:text-slate-300 shrink-0 stroke-[1.8]" />
                        <span className="truncate">{formatDuration(contest.durationSeconds)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <a
                      href={generateGoogleCalendarUrl(contest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={isCalendarAdded ? t("dashboard.addedToCalendar", "Added to calendar") : t("dashboard.addToCalendar", "Add to Google Calendar")}
                      onClick={() => markCalendarAdded(contest.id)}
                      className={`size-7 sm:size-8 rounded-lg flex items-center justify-center transition-all border shrink-0 ${
                        isCalendarAdded
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/70'
                          : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-slate-300'
                      }`}
                    >
                      {isCalendarAdded ? <CheckCircle2 className="size-3 sm:size-3.5" /> : <CalendarPlus className="size-3 sm:size-3.5 stroke-[1.8]" />}
                    </a>

                    <a
                      href={contest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg font-semibold text-[11px] sm:text-xs text-white flex items-center gap-1 bg-[#1d68f2] hover:bg-[#185adb] shadow-xs hover:shadow-sm hover:shadow-blue-500/25 transition-all shrink-0"
                    >
                      <span>{t("common.join", "Join")}</span>
                      <ArrowRight className="size-3 stroke-[2.5]" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

