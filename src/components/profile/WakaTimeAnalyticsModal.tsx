import React, { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WakaTimeStats } from "@/types/wakatimeProfile";
import { fetchWakaTimeStats, extractWakaTimeUsername } from "@/services/wakatimeService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import {
  Clock,
  Code2,
  Cpu,
  Layers,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Sparkles,
  Calendar,
  Search,
  Loader2,
  X,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WakaTimeAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats?: WakaTimeStats | null;
  username: string;
  apiKey?: string | null;
}

interface HeatmapDay {
  date: string;
  count: number;
  text: string;
  intensity: number; // 0 to 4
}

const POPULAR_WAKATIME_SEARCHES = ["alan", "dev_okore", "sindresorhus", "codergangganesh"];

export function WakaTimeAnalyticsModal({
  open,
  onOpenChange,
  stats,
  username,
  apiKey,
}: WakaTimeAnalyticsModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchedStats, setSearchedStats] = useState<WakaTimeStats | null>(null);
  const [searchedUsername, setSearchedUsername] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const currentYearNum = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);

  const availableYears = useMemo(() => {
    return [currentYearNum, currentYearNum - 1, currentYearNum - 2];
  }, [currentYearNum]);

  // Sync active stats & username
  const currentUsername = searchedUsername || username;
  const currentStats = searchedUsername ? searchedStats : stats;
  const profileUrl = currentUsername ? `https://wakatime.com/@${currentUsername}` : "https://wakatime.com";

  // Reset search when modal closes or opens
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchedStats(null);
      setSearchedUsername(null);
      setSearchError(null);
      setSelectedYear(new Date().getFullYear());
    }
  }, [open]);

  const handleSearch = async (handleToSearch?: string) => {
    const target = extractWakaTimeUsername(handleToSearch || searchQuery);
    if (!target) return;

    setIsSearching(true);
    setSearchError(null);

    const result = await fetchWakaTimeStats(target, apiKey);
    setIsSearching(false);

    if (result.data) {
      setSearchedStats(result.data);
      setSearchedUsername(target);
    } else {
      setSearchError(result.error || `Could not fetch profile for @${target}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchedStats(null);
    setSearchedUsername(null);
    setSearchError(null);
  };

  const languages = currentStats?.languages || [];
  const editors = currentStats?.editors || [];
  const categories = currentStats?.categories || [];
  const projects = currentStats?.projects || [];
  const operatingSystems = currentStats?.operating_systems && currentStats.operating_systems.length > 0 ? currentStats.operating_systems : categories;
  const dailyBreakdown = currentStats?.daily_breakdown || [];

  const maxDailySeconds = Math.max(1, ...dailyBreakdown.map((d) => d.total_seconds));

  // Generate 365-day (52 weeks) contribution heatmap data strictly from API lookup for selectedYear
  const heatmapData = useMemo(() => {
    const days: HeatmapDay[] = [];
    const now = new Date();

    const lookup: Record<string, { total_seconds: number; text: string }> = {};
    dailyBreakdown.forEach((d) => {
      if (d.date) {
        lookup[d.date] = { total_seconds: d.total_seconds, text: d.text };
      }
    });

    if (selectedYear === currentYearNum) {
      // 364 days ending today
      for (let i = 363; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isoDate = d.toISOString().split("T")[0];

        const match = lookup[isoDate];
        const total_seconds = match?.total_seconds || 0;
        const text = match?.text || (total_seconds > 0 ? `${Math.round(total_seconds / 60)} mins` : "No activity");

        let intensity = 0;
        if (total_seconds > 0) {
          if (total_seconds < 1800) intensity = 1;      // < 30 mins
          else if (total_seconds < 7200) intensity = 2; // 30m - 2h
          else if (total_seconds < 14400) intensity = 3; // 2h - 4h
          else intensity = 4;                           // > 4h
        }

        days.push({ date: isoDate, count: total_seconds, text, intensity });
      }
    } else {
      // Full calendar year for historical selectedYear
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const isoDate = d.toISOString().split("T")[0];

        const match = lookup[isoDate];
        const total_seconds = match?.total_seconds || 0;
        const text = match?.text || (total_seconds > 0 ? `${Math.round(total_seconds / 60)} mins` : "No activity");

        let intensity = 0;
        if (total_seconds > 0) {
          if (total_seconds < 1800) intensity = 1;      // < 30 mins
          else if (total_seconds < 7200) intensity = 2; // 30m - 2h
          else if (total_seconds < 14400) intensity = 3; // 2h - 4h
          else intensity = 4;                           // > 4h
        }

        days.push({ date: isoDate, count: total_seconds, text, intensity });
      }
    }

    return days;
  }, [dailyBreakdown, selectedYear, currentYearNum]);

  // Group days into 52 weeks (7 days per week: Sun-Sat)
  const weeks = useMemo(() => {
    const result: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === heatmapData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [heatmapData]);

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card/95 backdrop-blur-2xl border-l border-border/60 p-0 overflow-y-auto flex flex-col z-[80]">
        <SheetHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-xl z-10 space-y-3">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-9 sm:size-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
                <UnifiedPlatformLogo platform="wakatime" className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 truncate leading-tight">
                  WakaTime Activity
                  <Badge className="bg-blue-600 text-white border-0 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg shrink-0 shadow-xs">
                    @{currentUsername}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground truncate mt-0.5">
                  Search & view public developer coding stats and 365-day heatmaps.
                </SheetDescription>
              </div>
            </div>

            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap shadow-sm hover:shadow-md"
            >
              Profile <ExternalLink className="size-3" />
            </a>
          </div>

          {/* GitHub-Style Live Profile Search Bar */}
          <div className="space-y-2 pt-1 pr-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search WakaTime profile (e.g. alan, dev_okore)..."
                  className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/30 border-border/60 focus:border-[#00E5FF]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
                className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
              >
                {isSearching ? <Loader2 className="size-3.5 animate-spin" /> : "Search"}
              </Button>

              {searchedUsername && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  size="sm"
                  className="h-9 px-2.5 rounded-xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground shrink-0"
                  title="Return to my profile"
                >
                  <RotateCcw className="size-3" /> Reset
                </Button>
              )}
            </form>

            {/* Quick Popular Search Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
              <span className="text-muted-foreground font-semibold shrink-0">Popular:</span>
              {POPULAR_WAKATIME_SEARCHES.map((userTag) => (
                <button
                  key={userTag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(userTag);
                    handleSearch(userTag);
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-lg border font-mono transition-colors shrink-0",
                    currentUsername === userTag
                      ? "bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF] font-bold"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  @{userTag}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        {searchError ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-destructive font-bold">{searchError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSearch}
              className="text-xs font-semibold rounded-xl"
            >
              Back to My Profile
            </Button>
          </div>
        ) : !currentStats ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No detailed WakaTime activity metrics found for @{currentUsername}.
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Overview Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <Clock className="size-3.5 text-[#00E5FF]" /> Weekly Total
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-foreground truncate">
                  {currentStats.human_readable_total || "0 hrs"}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{currentStats.range || "Last 7 Days"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <TrendingUp className="size-3.5 text-emerald-500" /> Daily Average
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-foreground truncate">
                  {currentStats.daily_average || "0 mins"}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">Active coding / day</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <Code2 className="size-3.5 text-purple-500" /> Top Language
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-foreground truncate">
                  {languages[0]?.name || "N/A"}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  {languages[0] ? `${languages[0].percent}% of total` : "No data"}
                </p>
              </div>
            </div>

            {/* Editors & Operating Systems Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Editors */}
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-2.5">
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Cpu className="size-3.5 text-emerald-500" /> Editors & IDEs
                </h4>
                <div className="space-y-1.5">
                  {editors.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No editor metrics recorded.</p>
                  ) : (
                    editors.map((editor) => (
                      <div key={editor.name} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground truncate max-w-[140px]">{editor.name}</span>
                        <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-2">
                          {editor.text} ({editor.percent}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Operating Systems */}
              <div className="p-3.5 rounded-2xl bg-card/60 border border-border/60 space-y-2.5">
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="size-3.5 text-purple-500" /> Operating Systems
                </h4>
                <div className="space-y-1.5">
                  {operatingSystems.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No OS metrics recorded.</p>
                  ) : (
                    operatingSystems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground truncate max-w-[140px]">{item.name}</span>
                        <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-2">
                          {item.text} ({item.percent}%)
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Languages Breakdown Grid */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Code2 className="size-3.5 text-[#00E5FF]" /> Languages Breakdown
              </h4>

              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.name} className="p-2.5 rounded-xl bg-card/60 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-foreground truncate max-w-[180px]">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: lang.color || "#00E5FF" }}
                        />
                        {lang.name}
                      </span>
                      <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-2">
                        {lang.text} ({lang.percent}%)
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, lang.percent)}%`,
                          backgroundColor: lang.color || "#00E5FF",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Breakdown Grid */}
            {projects.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="size-3.5 text-[#00E5FF]" /> Public Projects Worked On
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {projects.map((proj) => (
                    <div key={proj.name} className="p-2.5 rounded-xl bg-card/60 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground truncate max-w-[140px]">{proj.name}</span>
                        <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-2">
                          {proj.text} ({proj.percent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00E5FF] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(3, proj.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
