import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ExternalLink, Calendar, Clock, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { Contest, PlatformName } from '@/types/contest';
import { fetchUpcomingContests, formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORM_COLORS: Record<PlatformName, { bg: string; text: string; border: string }> = {
  LeetCode: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30' },
  Codeforces: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30' },
  CodeChef: { bg: 'bg-amber-700/10 dark:bg-amber-700/20', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-700/30' },
  AtCoder: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
  HackerRank: { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30' },
  HackerEarth: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30' },
  Kaggle: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30' },
  Other: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
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
      setContests(data.slice(0, 4)); // Get top 4 upcoming contests
    } catch (e) {
      console.error('Failed to load contests widget data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="size-4 text-amber-500 animate-pulse" />
            Upcoming Coding Contests
          </CardTitle>
          <CardDescription className="text-xs">
            Live competitive programming schedules
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Refresh Contests"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7 px-2 font-medium">
            <Link to="/contests">
              View All <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm space-y-1">
            <p>No upcoming contests found right now.</p>
            <Button variant="link" size="sm" onClick={() => loadData(true)}>
              Check again
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {contests.map((contest) => {
              const platformStyle = PLATFORM_COLORS[contest.platform] || PLATFORM_COLORS.Other;
              const startDate = new Date(contest.startTime);
              const formattedDate = startDate.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={contest.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-border/50 bg-background/60 hover:bg-accent/40 transition-all duration-200"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${platformStyle.bg} ${platformStyle.text} ${platformStyle.border}`}
                      >
                        {contest.platform}
                      </span>
                      {contest.status === 'CODING' && (
                        <Badge variant="default" className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse">
                          <Zap className="size-2.5 mr-0.5 fill-current" /> Live Now
                        </Badge>
                      )}
                      {contest.in24Hours && contest.status !== 'CODING' && (
                        <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">
                          Starting Soon
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {contest.name}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground/70" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground/70" />
                        {formatDuration(contest.durationSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                      asChild
                      title="Add to Google Calendar"
                    >
                      <a href={generateGoogleCalendarUrl(contest)} target="_blank" rel="noopener noreferrer">
                        <Calendar className="size-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 font-medium bg-background hover:bg-primary hover:text-primary-foreground transition-all"
                      asChild
                    >
                      <a href={contest.url} target="_blank" rel="noopener noreferrer">
                        Join <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
