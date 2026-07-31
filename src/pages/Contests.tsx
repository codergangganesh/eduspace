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
  BellRing,
  Star
} from 'lucide-react';
import { Contest, PlatformName, ContestStatus } from '@/types/contest';
import { fetchUpcomingContests, formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';

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
      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
        <Zap className="size-3 animate-bounce fill-current" />
        Live Now
      </div>
    );
  }

  if (!timeLeft) {
    return <span className="text-xs text-muted-foreground font-medium">Starts soon...</span>;
  }

  return (
    <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border/60">
      <Clock className="size-3 text-primary mr-0.5" />
      {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
      <span>{String(timeLeft.hours).padStart(2, '0')}h </span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m </span>
      <span className="text-primary">{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
}

{/* Feature 5: Active Contest Progress Bar & Time Remaining Component */}
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
    <div className="space-y-1.5 bg-emerald-500/10 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="flex items-center gap-1">
          <Zap className="size-3.5 animate-bounce fill-current" />
          Live Coding Progress
        </span>
        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">{progressData.timeRemaining}</span>
      </div>
      <div className="h-1.5 w-full bg-emerald-950/20 dark:bg-emerald-900/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000 rounded-full"
          style={{ width: `${progressData.percent}%` }}
        />
      </div>
    </div>
  );
}

export default function Contests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Controls
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformName | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | '24H'>('ALL');
  const [sortBy, setSortBy] = useState<'startTime-asc' | 'startTime-desc' | 'duration-asc' | 'name-asc'>('startTime-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Feature 1: Pre-Contest Reminders state (15m before start)
  const [reminders, setReminders] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eduspace_contest_reminders') || '[]');
    } catch {
      return [];
    }
  });

  // Feature 3: Favorite Platforms state
  const [favoritePlatforms, setFavoritePlatforms] = useState<PlatformName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('eduspace_fav_platforms') || '[]');
    } catch {
      return [];
    }
  });

  const toggleReminder = (contest: Contest) => {
    const exists = reminders.includes(contest.id);
    let updated: string[];

    if (exists) {
      updated = reminders.filter((id) => id !== contest.id);
      toast.info(`Reminder cancelled for ${contest.name}`);
    } else {
      updated = [...reminders, contest.id];
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      toast.success(`Reminder set! You will be alerted 15 minutes before ${contest.name}`);
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

  const loadContests = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      sessionStorage.removeItem('eduspace_upcoming_contests_cache');
      const data = await fetchUpcomingContests();
      setContests(data);
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
  }, []);

  // Filtered & Sorted contest list
  const filteredContests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const filtered = contests.filter((c) => {
      // Platform Filter
      if (selectedPlatform !== 'ALL' && c.platform !== selectedPlatform) {
        return false;
      }
      // Status Filter
      if (statusFilter === 'LIVE' && c.status !== 'CODING') return false;
      if (statusFilter === '24H' && !c.in24Hours) return false;

      // Multi-field Search Query Matching
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
      // Pin favorite platforms to top if platform is ALL
      if (selectedPlatform === 'ALL') {
        const aFav = favoritePlatforms.includes(a.platform);
        const bFav = favoritePlatforms.includes(b.platform);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
      }

      if (sortBy === 'startTime-asc') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (sortBy === 'startTime-desc') return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      if (sortBy === 'duration-asc') return a.durationSeconds - b.durationSeconds;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [contests, selectedPlatform, statusFilter, searchQuery, sortBy, favoritePlatforms]);

  // Statistics
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

      {/* Top Header Navigation with Back Arrow Icon Only - Mobile Only */}
      <div className="flex items-center sm:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="size-9 rounded-xl border-border/80 hover:bg-muted shadow-sm transition-all"
          title="Go back to previous page"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4 text-foreground" />
        </Button>
      </div>

      {/* Header Banner - Light Mode: White background, Dark Mode: Theme Dark Card background */}
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
                Stay updated with real-time contest schedules across LeetCode, Codeforces, CodeChef, AtCoder, and more.
              </p>
            </div>
          </div>

          {/* Quick Stats Boxes with Adaptive Theme Contrast */}
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
          {/* Left: Search Bar (Fills available space) */}
          <div className="relative flex-1 w-full">
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

          {/* Right Group: Status Tabs (Adjacent to Earliest First) + Sort + Filter + Grid/List */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto shrink-0">
            {/* Status Tabs right next to Earliest First */}
            <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)} className="shrink-0">
              <TabsList className="grid grid-cols-3 bg-muted/60 h-9 p-0.5">
                <TabsTrigger value="ALL" className="text-xs px-2.5 h-8 gap-1.5 font-medium">
                  <Globe className="size-3.5 text-primary" />
                  <span>All</span>
                </TabsTrigger>
                <TabsTrigger value="LIVE" className="text-xs px-2.5 h-8 gap-1.5 font-medium">
                  <Zap className="size-3.5 text-emerald-500 fill-current" />
                  <span>Live</span>
                </TabsTrigger>
                <TabsTrigger value="24H" className="text-xs px-2.5 h-8 gap-1.5 font-medium">
                  <Clock className="size-3.5 text-amber-500" />
                  <span>Next 24h</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort Option ("Earliest First") right next to Status Tabs */}
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

            {/* Filter Option Dropdown with Feature 3: Favorite Platforms ⭐ */}
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
                  {selectedPlatform !== 'ALL' ? (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary-foreground text-primary font-bold">
                      1
                    </Badge>
                  ) : (
                    <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
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

            {/* Grid / List Layout Toggle */}
            <div className="flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40 h-9 shrink-0">
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

      {/* Main Content Grid / List */}
      {loading ? (
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContests.map((contest) => {
            const startDate = new Date(contest.startTime);
            const isReminded = reminders.includes(contest.id);
            const isFav = favoritePlatforms.includes(contest.platform);

            return (
              <Card
                key={contest.id}
                className="group relative flex flex-col justify-between overflow-hidden border-border/70 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-card"
              >
                {/* Status bar line top */}
                <div
                  className={`h-1 w-full ${contest.status === 'CODING'
                    ? 'bg-emerald-500 animate-pulse'
                    : contest.in24Hours
                      ? 'bg-amber-500'
                      : 'bg-primary/40'
                    }`}
                />

                <CardHeader className="p-5 pb-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 border-primary/30 bg-primary/5 text-primary flex items-center gap-1">
                      {isFav && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />}
                      <span>{contest.platform}</span>
                    </Badge>
                    <CountdownTimer startTimeIso={contest.startTime} status={contest.status} />
                  </div>

                  <CardTitle className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {contest.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Feature 5: Active Live Progress Bar if coding, else start/duration details */}
                    {contest.status === 'CODING' ? (
                      <ActiveContestProgress startTimeIso={contest.startTime} endTimeIso={contest.endTime} />
                    ) : (
                      <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <CalendarIcon className="size-3.5 text-primary" />
                            Start Time
                          </span>
                          <span className="font-semibold text-foreground">
                            {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                            <Clock className="size-3.5 text-primary" />
                            Duration
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatDuration(contest.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions in a Single Line with Feature 1: Pre-Contest Reminder Toggle */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 text-xs gap-1 font-semibold h-9 px-2 shadow-sm"
                    >
                      <a href={contest.url} target="_blank" rel="noopener noreferrer">
                        <span>{contest.status === 'CODING' ? 'Enter' : 'Register'}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1 h-9 px-2 font-medium"
                      asChild
                      title="Add to Google Calendar"
                    >
                      <a href={generateGoogleCalendarUrl(contest)} target="_blank" rel="noopener noreferrer">
                        <CalendarCheck className="size-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">Add Cal</span>
                      </a>
                    </Button>

                    {/* Feature 1: 15m Pre-Contest Reminder Button */}
                    <Button
                      variant={isReminded ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-9 px-2 text-xs shrink-0"
                      onClick={() => toggleReminder(contest)}
                      title={isReminded ? "15m reminder active! Click to cancel" : "Set 15m pre-contest reminder"}
                    >
                      <Bell className={`size-3.5 ${isReminded ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} />
                    </Button>

                    {/* Share Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2 text-xs shrink-0"
                      onClick={() => handleShare(contest)}
                      title="Share contest link"
                    >
                      <Share2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2.5">
          {filteredContests.map((contest) => {
            const startDate = new Date(contest.startTime);
            const isReminded = reminders.includes(contest.id);
            const isFav = favoritePlatforms.includes(contest.platform);

            return (
              <div
                key={contest.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-accent/30 transition-all gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1">
                      {isFav && <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />}
                      <span>{contest.platform}</span>
                    </Badge>
                    <CountdownTimer startTimeIso={contest.startTime} status={contest.status} />
                  </div>

                  <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                    {contest.name}
                  </h3>

                  {/* Feature 5: Active Contest Live Progress Bar if Coding */}
                  {contest.status === 'CODING' ? (
                    <ActiveContestProgress startTimeIso={contest.startTime} endTimeIso={contest.endTime} />
                  ) : (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3.5 text-primary" />
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} @ {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5 text-primary" />
                        {formatDuration(contest.durationSeconds)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons with Feature 1: Pre-Contest Reminder Button */}
                <div className="flex items-center gap-1.5 shrink-0 pt-2.5 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/50 mt-1 sm:mt-0">
                  <Button size="sm" asChild className="h-8 text-xs gap-1.5 font-semibold flex-1 sm:flex-none">
                    <a href={contest.url} target="_blank" rel="noopener noreferrer">
                      {contest.status === 'CODING' ? 'Enter' : 'Join'} <ExternalLink className="size-3.5" />
                    </a>
                  </Button>

                  <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1 flex-1 sm:flex-none">
                    <a href={generateGoogleCalendarUrl(contest)} target="_blank" rel="noopener noreferrer">
                      <CalendarCheck className="size-3.5 text-amber-500 shrink-0" />
                      <span className="inline sm:hidden lg:inline">Add to Calendar</span>
                      <span className="hidden sm:inline lg:hidden">Add Cal</span>
                    </a>
                  </Button>

                  <Button
                    variant={isReminded ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-8 px-2 text-xs shrink-0"
                    onClick={() => toggleReminder(contest)}
                    title={isReminded ? "15m reminder active! Click to cancel" : "Set 15m pre-contest reminder"}
                  >
                    <Bell className={`size-3.5 ${isReminded ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs shrink-0"
                    onClick={() => handleShare(contest)}
                    title="Share contest link"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

