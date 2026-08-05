import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Search,
  ExternalLink,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Sparkles,
  Zap,
  Share2,
  CheckCircle2,
  CalendarCheck,
  Globe,
  Grid,
  List,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  Bell,
  Star,
  BookOpen,
  FileText,
  History,
  Users
} from 'lucide-react';
import { Contest, PlatformName, ContestStatus } from '@/types/contest';
import { fetchUpcomingContests, fetchPastContests, PastContest, formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
import { initNotificationService, scheduleContestNotification, cancelContestNotification, sendTestNotification } from '@/services/notificationService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import { ContestCalendarView } from '@/components/contests/ContestCalendarView';

const PLATFORMS: { name: PlatformName | 'ALL'; label: string; bg: string; text: string }[] = [
  { name: 'ALL', label: 'All Platforms', bg: 'bg-primary/10', text: 'text-primary' },
  { name: 'LeetCode', label: 'LeetCode', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  { name: 'Codeforces', label: 'Codeforces', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  { name: 'CodeChef', label: 'CodeChef', bg: 'bg-amber-700/10', text: 'text-amber-800 dark:text-amber-300' },
  { name: 'AtCoder', label: 'AtCoder', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'HackerRank', label: 'HackerRank', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
  { name: 'HackerEarth', label: 'HackerEarth', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Kaggle', label: 'Kaggle', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
];

const CALENDAR_ADDED_KEY = 'eduspace_contest_calendar_added';

function formatContestStartLabel(startTimeIso: string, includeYear = false) {
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

  const date = startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' as const } : {}),
  });

  return `${date}, ${time}`;
}

function CountdownTimer({ startTimeIso, status }: { startTimeIso: string; status: ContestStatus }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(startTimeIso).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTimeIso]);

  if (status === 'CODING') {
    return (
      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-900/70">
        <Zap className="size-3 animate-bounce fill-current" />
        Live Now
      </div>
    );
  }

  if (!timeLeft) {
    return <span className="text-xs text-muted-foreground font-medium">Starts soon...</span>;
  }

  return (
    <div className="flex items-center gap-1 font-mono text-xs font-semibold text-foreground bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-md border border-border/70">
      <Clock className="size-3 text-muted-foreground mr-0.5" />
      {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
      <span>{String(timeLeft.hours).padStart(2, '0')}h </span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m </span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
}

function ActiveContestProgress({ startTimeIso, endTimeIso }: { startTimeIso: string; endTimeIso: string }) {
  const [progressData, setProgressData] = useState<{ percent: number; timeRemaining: string }>({ percent: 0, timeRemaining: '' });

  useEffect(() => {
    const updateProgress = () => {
      const start = new Date(startTimeIso).getTime();
      const end = new Date(endTimeIso).getTime();
      const now = new Date().getTime();

      const total = end - start;
      const elapsed = now - start;
      const remaining = end - now;

      if (remaining <= 0) {
        setProgressData({ percent: 100, timeRemaining: 'Contest ended' });
        return;
      }

      const percent = Math.min(100, Math.max(0, (elapsed / (total || 1)) * 100));
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const timeStr = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s remaining`;
      setProgressData({ percent, timeRemaining: timeStr });
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [startTimeIso, endTimeIso]);

  return (
    <div className="space-y-1.5 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/70 dark:border-emerald-900/70">
      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="flex items-center gap-1">
          <Zap className="size-3.5 animate-bounce fill-current" />
          Live Coding Progress
        </span>
        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">{progressData.timeRemaining}</span>
      </div>
      <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-950 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000 rounded-full"
          style={{ width: `${progressData.percent}%` }}
        />
      </div>
    </div>
  );
}

export default function Contests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [pastContests, setPastContests] = useState<PastContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTestBanner, setShowTestBanner] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(CALENDAR_ADDED_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // Filters & Controls
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformName | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | '24H' | 'PAST'>('ALL');
  const [sortBy, setSortBy] = useState<'startTime-asc' | 'startTime-desc' | 'duration-asc' | 'name-asc'>('startTime-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar' | 'timeline'>('grid');

  const handleTestNotification = async () => {
    setShowTestBanner(true);
    await sendTestNotification();
  };

  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eduspace_contest_reminders') || '[]');
    } catch {
      return [];
    }
  });

  const [favoritePlatforms, setFavoritePlatforms] = useState<PlatformName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eduspace_fav_platforms') || '[]');
    } catch {
      return [];
    }
  });

  const toggleReminder = async (contest: Contest) => {
    const exists = reminders.includes(contest.id);
    let updated: string[];

    if (exists) {
      updated = reminders.filter((id) => id !== contest.id);
      await cancelContestNotification(contest.id);
      toast.info(`Reminder cancelled for ${contest.name}`);
    } else {
      updated = [...reminders, contest.id];
      const scheduled = await scheduleContestNotification(contest);
      if (scheduled) {
        toast.success(`Background reminder set! You will be alerted 1 hour before ${contest.name}`);
      }
    }

    setReminders(updated);
    localStorage.setItem('eduspace_contest_reminders', JSON.stringify(updated));
  };

  const toggleFavoritePlatform = (platformName: PlatformName) => {
    const exists = favoritePlatforms.includes(platformName);
    let updated: PlatformName[];

    if (exists) {
      updated = favoritePlatforms.filter((p) => p !== platformName);
      toast.info(`${platformName} removed from favorite platforms`);
    } else {
      updated = [...favoritePlatforms, platformName];
      toast.success(`${platformName} pinned to favorite platforms ⭐`);
    }

    setFavoritePlatforms(updated);
    localStorage.setItem('eduspace_fav_platforms', JSON.stringify(updated));
  };

  const markCalendarAdded = (contestId: string) => {
    setCalendarAdded((current) => {
      if (current.includes(contestId)) return current;
      const updated = [...current, contestId];
      localStorage.setItem(CALENDAR_ADDED_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const loadContests = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      sessionStorage.removeItem('eduspace_upcoming_contests_cache');
      const [upcomingData, pastData] = await Promise.all([
        fetchUpcomingContests(),
        fetchPastContests()
      ]);
      setContests(upcomingData);
      setPastContests(pastData);
      if (isManualRefresh) {
        toast.success('Contest schedule updated!');
      }
    } catch (e) {
      console.error('Failed to load contests:', e);
      toast.error('Unable to fetch contest schedule. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContests();
    initNotificationService();
  }, []);

  const filteredContests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = contests.filter((c) => {
      if (selectedPlatform !== 'ALL' && c.platform !== selectedPlatform) {
        return false;
      }
      if (statusFilter === 'LIVE' && c.status !== 'CODING') return false;
      if (statusFilter === '24H' && !c.in24Hours) return false;

      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPlatform = c.platform.toLowerCase().includes(q);
        const matchesStatus = c.status.toLowerCase().includes(q);

        const dateStr = new Date(c.startTime).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        }).toLowerCase();
        const matchesDate = dateStr.includes(q);

        return matchesName || matchesPlatform || matchesStatus || matchesDate;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (selectedPlatform === 'ALL') {
        const aFav = favoritePlatforms.includes(a.platform);
        const bFav = favoritePlatforms.includes(b.platform);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
      }

      if (sortBy === 'startTime-asc') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (sortBy === 'startTime-desc') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (sortBy === 'duration-asc') return a.durationSeconds - b.durationSeconds;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [contests, selectedPlatform, statusFilter, searchQuery, sortBy, favoritePlatforms]);

  const filteredPastContests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return pastContests.filter((c) => {
      if (selectedPlatform !== 'ALL' && c.platform !== selectedPlatform) {
        return false;
      }
      if (q) {
        return c.name.toLowerCase().includes(q) || c.platform.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pastContests, selectedPlatform, searchQuery]);

  const liveCount = useMemo(() => contests.filter((c) => c.status === 'CODING').length, [contests]);
  const next24hCount = useMemo(() => contests.filter((c) => c.in24Hours && c.status !== 'CODING').length, [contests]);

  const handleShare = (contest: Contest) => {
    if (navigator.share) {
      navigator.share({
        title: contest.name,
        text: `Check out ${contest.name} on ${contest.platform}!`,
        url: contest.url,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(contest.url);
      toast.success('Contest link copied to clipboard!');
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <SEO
        title="Upcoming Coding Contests | EduSpace"
        description="Track upcoming and live competitive programming contests across LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, Kaggle and more."
      />

      <div className="flex items-center sm:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-xl border-border/80 hover:bg-muted shadow-sm transition-all"
        >
          <ArrowLeft className="size-4 text-foreground" />
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-card border border-border/70 p-5 sm:p-8 shadow-sm">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-64 rounded-full bg-primary/5 dark:bg-primary/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <Trophy className="size-4 text-amber-500" />
                Global Competitive Programming Hub
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Upcoming Coding Contests
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Stay updated with real-time contest schedules and archives across all major platforms.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-muted/40 dark:bg-muted/30 border border-border/60 rounded-xl p-3">
              <div className="text-xs font-medium text-muted-foreground">Total Contests</div>
              <div className="text-xl font-bold text-foreground">{contests.length}</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                Live Now
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{liveCount}</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Starting in 24h</div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{next24hCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="space-y-3.5">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Left: Search Bar & Mobile-Only Grid/List Toggle */}
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contest name, platform, day..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-background border-border/80 focus-visible:ring-primary h-9 text-xs sm:text-sm w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Layout Toggle - Mobile Only */}
            <div className="flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40 h-9 shrink-0 md:hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('calendar')}
                title="Month Calendar View"
              >
                <CalendarIcon className="size-3.5 text-primary" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('timeline')}
                title="Week Timeline View"
              >
                <Clock className="size-3.5 text-amber-500" />
              </Button>
            </div>
          </div>

          {/* Right Group: Status Tabs + Sort + Filter + Grid/List (Desktop) */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto shrink-0">
            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)} className="shrink-0">
              <TabsList className="grid grid-cols-4 bg-muted/60 h-9 p-0.5">
                <TabsTrigger value="ALL" className="text-xs px-2.5 h-8 gap-1 font-medium">
                  <Globe className="size-3.5 text-primary" />
                  <span>All</span>
                </TabsTrigger>
                <TabsTrigger value="LIVE" className="text-xs px-2.5 h-8 gap-1 font-medium">
                  <Zap className="size-3.5 text-emerald-500 fill-current" />
                  <span>Live</span>
                </TabsTrigger>
                <TabsTrigger value="24H" className="text-xs px-2.5 h-8 gap-1 font-medium">
                  <Clock className="size-3.5 text-amber-500" />
                  <span>24h</span>
                </TabsTrigger>
                <TabsTrigger value="PAST" className="text-xs px-2.5 h-8 gap-1 font-medium">
                  <BookOpen className="size-3.5 text-indigo-500" />
                  <span>Past</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort Option */}
            {statusFilter !== 'PAST' && (
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                <SelectTrigger className="w-[125px] sm:w-[150px] h-9 text-xs gap-1 bg-background border-border/80 shrink-0">
                  <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startTime-asc" className="text-xs">Earliest First</SelectItem>
                  <SelectItem value="startTime-desc" className="text-xs">Latest First</SelectItem>
                  <SelectItem value="duration-asc" className="text-xs">Shortest Duration</SelectItem>
                  <SelectItem value="name-asc" className="text-xs">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedPlatform !== 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs border-border/80 shadow-sm shrink-0"
                  title="Filter by platform"
                >
                  <Filter className="size-3.5" />
                  <span>{selectedPlatform === 'ALL' ? 'Filter' : selectedPlatform}</span>
                  {selectedPlatform !== 'ALL' && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary-foreground text-primary font-bold">
                      1
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-xl border-border/60 shadow-xl bg-popover/95 backdrop-blur-md">
                <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Filter className="size-3.5 text-primary" />
                    Filter by Platform
                  </span>
                  {selectedPlatform !== 'ALL' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlatform('ALL');
                      }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />

                <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar">
                  {PLATFORMS.map((plat) => {
                    const isSelected = selectedPlatform === plat.name;
                    const isFav = plat.name !== 'ALL' && favoritePlatforms.includes(plat.name as PlatformName);
                    const count = plat.name === 'ALL'
                      ? contests.length
                      : contests.filter((c) => c.platform === plat.name).length;

                    return (
                      <DropdownMenuItem
                        key={plat.name}
                        onClick={() => setSelectedPlatform(plat.name)}
                        className="flex items-center justify-between text-xs py-2 px-2 rounded-lg cursor-pointer font-medium group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-4 flex items-center justify-center shrink-0">
                            {isSelected && <Check className="size-3.5 text-primary font-bold" />}
                          </div>
                          <span className={`${plat.text} truncate`}>{plat.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                            {count}
                          </span>
                          {plat.name !== 'ALL' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoritePlatform(plat.name as PlatformName);
                              }}
                              className="p-1 rounded-md hover:bg-amber-500/10 text-amber-400 transition-colors"
                              title={isFav ? "Unpin favorite platform" : "Pin as favorite platform"}
                            >
                              <Star className={`size-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`} />
                            </button>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Layout Toggle - Desktop Only */}
            <div className="hidden md:flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40 h-9 shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('calendar')}
                title="Month Calendar View"
              >
                <CalendarIcon className="size-3.5 text-primary" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                size="icon"
                className="size-7 rounded-md"
                onClick={() => setViewMode('timeline')}
                title="Week Timeline View"
              >
                <Clock className="size-3.5 text-amber-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filter Tag & Pinned Favorites Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          {selectedPlatform !== 'ALL' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Filtered by:</span>
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full"
              >
                <span>{selectedPlatform}</span>
                <button
                  onClick={() => setSelectedPlatform('ALL')}
                  className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                  title="Remove filter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </div>
          )}

          {/* Pinned Favorites Quick Chips */}
          {favoritePlatforms.length > 0 && selectedPlatform === 'ALL' && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                <Star className="size-3 fill-amber-400 text-amber-400" /> Favorites:
              </span>
              {favoritePlatforms.map((fav) => (
                <button
                  key={fav}
                  onClick={() => setSelectedPlatform(fav)}
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all shrink-0"
                >
                  {fav}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Render Past Contests Archive Tab View */}
      {statusFilter === 'PAST' ? (
        <div className="space-y-4">
          {filteredPastContests.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <div className="max-w-md mx-auto space-y-3">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <AlertCircle className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">No past contests found</h3>
              </div>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPastContests.map((past) => (
                <Card key={past.id} className="flex flex-col justify-between border-border/70 hover:border-indigo-500/50 hover:shadow-lg transition-all bg-card p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {past.platform}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground line-clamp-2 leading-snug">{past.name}</h3>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Button asChild className="w-full h-8 text-xs gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                      <a href={past.problemSetUrl} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="size-3.5" /> Solve Problem Set
                      </a>
                    </Button>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs gap-1.5 border-border/80">
                        <a href={past.editorialUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="size-3.5 text-amber-500" /> Solutions
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPastContests.map((past) => (
                <div key={past.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/30 transition-all gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">{past.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" asChild className="h-8 text-xs gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                      <a href={past.problemSetUrl} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="size-3.5" /> Practice
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 w-10 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredContests.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="max-w-md mx-auto space-y-3">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-lg font-semibold">No contests matching criteria</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters or platform selection to see more scheduled events.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setSelectedPlatform('ALL'); setSearchQuery(''); setStatusFilter('ALL'); }}>
                Reset Filters
              </Button>
            </div>
          </Card>
        ) : viewMode === 'calendar' || viewMode === 'timeline' ? (
          <ContestCalendarView
            contests={filteredContests}
            reminders={reminders}
            calendarAdded={calendarAdded}
            onToggleReminder={toggleReminder}
            onMarkCalendarAdded={markCalendarAdded}
            viewType={viewMode}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContests.map((contest) => {
              const isFav = favoritePlatforms.includes(contest.platform);
              const isCalendarAdded = calendarAdded.includes(contest.id);

              return (
                /* Professional grid card */
                <div
                  key={contest.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-card dark:hover:border-slate-700"
                >
                  {/* Status bar line top */}
                  <div
                    className={`h-1 w-full ${contest.status === 'CODING'
                      ? 'bg-emerald-500 animate-pulse'
                      : contest.in24Hours
                        ? 'bg-amber-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                  />

                  <div className="p-5 pb-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${isFav ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/70' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}>
                        {isFav && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0 inline mr-1" />}
                        {contest.platform}
                      </span>
                      <CountdownTimer startTimeIso={contest.startTime} status={contest.status} />
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 transition-colors leading-snug">
                      {contest.name}
                    </h3>
                  </div>

                  <div className="p-5 pt-0 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      {contest.status === 'CODING' ? (
                        <ActiveContestProgress startTimeIso={contest.startTime} endTimeIso={contest.endTime} />
                      ) : (
                        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                              <CalendarIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                              Start Time
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              {formatContestStartLabel(contest.startTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                              <Clock className="size-3.5 text-slate-500 dark:text-slate-400" />
                              Duration
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                              {formatDuration(contest.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <a
                        href={contest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
                      >
                        {contest.status === 'CODING' ? 'Enter' : 'Register'}
                      </a>

                      <a
                        href={generateGoogleCalendarUrl(contest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markCalendarAdded(contest.id)}
                        className={`flex-1 flex items-center justify-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors ${isCalendarAdded
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/70 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                          : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/70 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                          }`}
                      >
                        {isCalendarAdded ? <CheckCircle2 className="size-3.5 shrink-0" /> : <CalendarCheck className="size-3.5 shrink-0" />}
                        {isCalendarAdded ? 'Added' : 'Add Cal'}
                      </a>

                      <button
                        onClick={() => handleShare(contest)}
                        title="Share contest link"
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Share2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2.5">
            {filteredContests.map((contest) => {
              const isFav = favoritePlatforms.includes(contest.platform);
              const isCalendarAdded = calendarAdded.includes(contest.id);

              return (
                /* Professional list card */
                <div
                  key={contest.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-card dark:hover:border-slate-700"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isFav ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/70' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}>
                        {isFav && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0 inline mr-1" />}
                        {contest.platform}
                      </span>
                      <CountdownTimer startTimeIso={contest.startTime} status={contest.status} />
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors">
                      {contest.name}
                    </h3>

                    {contest.status === 'CODING' ? (
                      <ActiveContestProgress startTimeIso={contest.startTime} endTimeIso={contest.endTime} />
                    ) : (
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                          {formatContestStartLabel(contest.startTime, true)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5 text-slate-500 dark:text-slate-400" />
                          {formatDuration(contest.durationSeconds)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-2.5 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-200 dark:border-slate-800 mt-1 sm:mt-0">
                    <a
                      href={contest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
                    >
                      {contest.status === 'CODING' ? 'Enter' : 'Join'}
                    </a>

                    <a
                      href={generateGoogleCalendarUrl(contest)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markCalendarAdded(contest.id)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 h-8 px-3 rounded-lg text-xs font-semibold border transition-colors ${isCalendarAdded
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/70 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/70 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                        }`}
                    >
                      {isCalendarAdded ? <CheckCircle2 className="size-3.5 shrink-0" /> : <CalendarCheck className="size-3.5 shrink-0" />}
                      <span className="inline sm:hidden lg:inline">{isCalendarAdded ? 'Added' : 'Add to Calendar'}</span>
                      <span className="hidden sm:inline lg:hidden">{isCalendarAdded ? 'Added' : 'Add Cal'}</span>
                    </a>

                    <button
                      onClick={() => handleShare(contest)}
                      title="Share contest link"
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Share2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
