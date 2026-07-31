import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Clock, RefreshCw, Zap, ChevronRight } from 'lucide-react';
import { Contest, PlatformName } from '@/types/contest';
import { fetchUpcomingContests, formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_COLORS: Record<PlatformName, { bg: string; text: string }> = {
  LeetCode: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300' },
  Codeforces: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' },
  CodeChef: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300' },
  AtCoder: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300' },
  HackerRank: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-700 dark:text-green-300' },
  HackerEarth: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300' },
  Kaggle: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300' },
  Other: { bg: 'bg-slate-50 dark:bg-slate-900/60', text: 'text-slate-600 dark:text-slate-400' },
};

export function UpcomingContestsWidget() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="relative flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/70">
            <Trophy className="size-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">
              Upcoming Contests
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              Live competitive schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Refresh"
            className="size-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors disabled:opacity-40 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/contests"
            className="flex items-center gap-0.5 h-8 px-3 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            View All <ChevronRight className="size-3 ml-0.5" />
          </Link>
        </div>
      </div>

      <div className="relative px-5 pb-5 space-y-2">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-3/4 rounded-full" />
                  <Skeleton className="h-2.5 w-1/2 rounded-full" />
                </div>
                <Skeleton className="h-7 w-14 rounded-lg ml-3" />
              </div>
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground font-medium">
              No upcoming contests right now.
            </p>
            <Button variant="link" size="sm" onClick={() => loadData(true)} className="text-primary">
              Check again
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {contests.map((contest) => {
              const p = PLATFORM_COLORS[contest.platform] || PLATFORM_COLORS.Other;
              const startDate = new Date(contest.startTime);
              const formattedDate = startDate.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              });

              return (
                <div
                  key={contest.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
                >
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-current/10 ${p.bg} ${p.text}`}>
                    {contest.platform}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate transition-colors">
                        {contest.name}
                      </span>
                      {contest.status === 'CODING' && (
                        <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/70 flex items-center gap-0.5">
                          <Zap className="size-2.5 fill-current" /> Live
                        </span>
                      )}
                      {contest.in24Hours && contest.status !== 'CODING' && (
                        <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/70">
                          Soon
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="size-2.5" /> {formattedDate}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="size-2.5" /> {formatDuration(contest.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={generateGoogleCalendarUrl(contest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Add to Google Calendar"
                      className="size-7 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Calendar className="size-3.5" />
                    </a>

                    <a
                      href={contest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-3 rounded-lg text-xs font-semibold text-white flex items-center bg-primary hover:bg-primary-hover transition-colors"
                    >
                      Join
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
