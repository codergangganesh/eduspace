import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, Check, Activity, Key } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
export interface ContributionDay {
  date: string; // "YYYY-MM-DD"
  count: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  count: number;
}

interface GitHubContributionHeatmapProps {
  contributions?: ContributionDay[];
  username?: string | null;
  totalContributions?: number;
  /** Account creation year so we can populate the year dropdown */
  accountCreatedYear?: number;
  /**
   * true  = data came from GraphQL (full multi-year history)
   * false = data came from events API fallback (~90 days only, no token)
   */
  hasFullHistory?: boolean;
  /** Called when the user clicks "Add Token" in the banner */
  onAddToken?: () => void;
  className?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build the full Sun→Sat grid for a given calendar year, padded with empty cells */
function buildYearGrid(contributions: ContributionDay[], year: number): ContributionDay[][] {
  const map = new Map<string, number>();
  contributions.forEach((d) => map.set(d.date, d.count));

  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // Pad back to the nearest Sunday before Jan 1
  const startPad = new Date(jan1);
  startPad.setDate(jan1.getDate() - jan1.getDay()); // 0 = Sunday

  // Pad forward to the nearest Saturday after Dec 31
  const endPad = new Date(dec31);
  const endDow = dec31.getDay();
  if (endDow < 6) endPad.setDate(dec31.getDate() + (6 - endDow));

  const weeks: ContributionDay[][] = [];
  const cur = new Date(startPad);

  while (cur <= endPad) {
    const week: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cur.toISOString().split("T")[0];
      const inYear = cur.getFullYear() === year;
      week.push({ date: key, count: inYear ? (map.get(key) ?? 0) : -1 }); // -1 = padding
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Compute year-scoped stats from the contribution data */
function calcYearStats(contributions: ContributionDay[], year: number) {
  const inYear = contributions.filter((d) => d.date.startsWith(`${year}-`));

  const totalContributions = inYear.reduce((s, d) => s + d.count, 0);
  const activeDays = inYear.filter((d) => d.count > 0).length;

  // Longest + current streak (year-scoped)
  const sorted = [...inYear].sort((a, b) => a.date.localeCompare(b.date));
  let longestStreak = 0;
  let tmpStreak = 0;

  for (const d of sorted) {
    if (d.count > 0) {
      tmpStreak++;
      if (tmpStreak > longestStreak) longestStreak = tmpStreak;
    } else {
      tmpStreak = 0;
    }
  }

  // Current streak: only meaningful for current year
  const todayStr = new Date().toISOString().split("T")[0];
  const ystrdyStr = (() => {
    const x = new Date(); x.setDate(x.getDate() - 1);
    return x.toISOString().split("T")[0];
  })();
  const mapCount = new Map<string, number>();
  inYear.forEach((d) => mapCount.set(d.date, d.count));
  let currentStreak = 0;
  const startDate = mapCount.get(todayStr) ? new Date(todayStr)
    : mapCount.get(ystrdyStr) ? new Date(ystrdyStr) : null;
  if (startDate) {
    const c = new Date(startDate);
    while (true) {
      const k = c.toISOString().split("T")[0];
      if ((mapCount.get(k) ?? 0) > 0) { currentStreak++; c.setDate(c.getDate() - 1); }
      else break;
    }
  }

  return { totalContributions, activeDays, longestStreak, currentStreak };
}

/** Map a count to an intensity level 0–4 */
function getLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || maxCount === 0) return 0;
  const r = count / maxCount;
  if (r < 0.15) return 1;
  if (r < 0.35) return 2;
  if (r < 0.65) return 3;
  return 4;
}

const LEVEL_STYLES: Record<number, string> = {
  0: "bg-[#161b22] dark:bg-[#161b22] bg-muted/30 border border-muted-foreground/10",
  1: "bg-[#0e4429] dark:bg-[#0e4429] border border-[#0e4429]/80",
  2: "bg-[#006d32] dark:bg-[#006d32] border border-[#006d32]/80",
  3: "bg-[#26a641] dark:bg-[#26a641] border border-[#26a641]/80",
  4: "bg-[#39d353] dark:bg-[#39d353] border border-[#39d353]/80 shadow-sm shadow-[#39d353]/30",
};

const LEVEL_STYLES_LIGHT: Record<number, string> = {
  0: "bg-[#ebedf0] border border-[#d0d7de]/60",
  1: "bg-[#9be9a8] border border-[#9be9a8]/80",
  2: "bg-[#40c463] border border-[#40c463]/80",
  3: "bg-[#30a14e] border border-[#30a14e]/80",
  4: "bg-[#216e39] border border-[#216e39]/80 shadow-sm shadow-[#216e39]/30",
};

/** Returns e.g. "Jun 19" */
function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    });
  } catch { return dateStr; }
}

// Per-year cache: { year -> ContributionDay[] }
const yearDataCache = new Map<string, ContributionDay[]>();

// ── Main Component ────────────────────────────────────────────────────────────
export function GitHubContributionHeatmap({
  contributions = [],
  username,
  totalContributions: _totalOverride,
  accountCreatedYear,
  hasFullHistory = false,
  onAddToken,
  className,
}: GitHubContributionHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, date: "", count: 0 });
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();

  // Detect dark mode via class on <html>
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Build list of available years:
  // - With full history (GraphQL): all years from account creation to now
  // - Without (events fallback): current year only
  const availableYears = useMemo(() => {
    if (!hasFullHistory) return [currentYear];
    const firstYear = accountCreatedYear
      ? Math.max(accountCreatedYear, currentYear - 8)
      : currentYear - 4;
    const years: number[] = [];
    for (let y = currentYear; y >= firstYear; y--) years.push(y);
    return years;
  }, [accountCreatedYear, currentYear, hasFullHistory]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Populate cache on first load with incoming contributions
  useEffect(() => {
    if (contributions.length > 0 && username) {
      const key = `${username}-${currentYear}`;
      if (!yearDataCache.has(key)) {
        yearDataCache.set(key, contributions);
      }
    }
  }, [contributions, username, currentYear]);

  // Resolved data for selected year
  const yearData = useMemo<ContributionDay[]>(() => {
    if (selectedYear === currentYear) return contributions;
    const key = `${username}-${selectedYear}`;
    return yearDataCache.get(key) ?? contributions.filter((d) => d.date.startsWith(`${selectedYear}-`));
  }, [selectedYear, currentYear, contributions, username]);

  const weeks = useMemo(() => buildYearGrid(yearData, selectedYear), [yearData, selectedYear]);

  const maxCount = useMemo(
    () => Math.max(...yearData.filter((d) => d.count > 0).map((d) => d.count), 1),
    [yearData]
  );

  const stats = useMemo(() => calcYearStats(yearData, selectedYear), [yearData, selectedYear]);
  const hasData = stats.totalContributions > 0;

  // Month header labels: one per month, placed at the first week of that month
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstValid = week.find((d) => d.count !== -1);
      if (!firstValid) return;
      const month = new Date(firstValid.date + "T12:00:00").getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTHS[month], weekIndex: wi });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const levelStyles = isDark ? LEVEL_STYLES : LEVEL_STYLES_LIGHT;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, date: string, count: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, date, count });
  };

  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-5 shadow-sm w-full", className)}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
          <Calendar className="size-4 text-emerald-500 shrink-0" />
          Contribution Activity
        </h4>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/60 transition-colors text-xs font-bold text-foreground shadow-sm"
              aria-label="Select year"
            >
              <span>{selectedYear}</span>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[100px] rounded-2xl border border-border/80 bg-popover shadow-2xl overflow-hidden py-1 backdrop-blur-sm">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => { setSelectedYear(year); setDropdownOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-bold hover:bg-muted/60 transition-colors",
                      year === selectedYear ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}
                  >
                    <span>{year}</span>
                    {year === selectedYear && <Check className="size-3 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {username && (
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              View on GitHub
            </a>
          )}
        </div>
      </div>

      {/* ── Stats Tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-center space-y-0.5">
          <span className="text-base sm:text-lg font-extrabold text-foreground font-mono block leading-none">
            {stats.totalContributions.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
            Contributions
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-center space-y-0.5">
          <span className="text-base sm:text-lg font-extrabold text-foreground font-mono block leading-none">
            {stats.currentStreak}
          </span>
          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">
            Current Streak
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/15 text-center space-y-0.5">
          <span className="text-base sm:text-lg font-extrabold text-foreground font-mono block leading-none">
            {stats.longestStreak}
          </span>
          <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider block">
            Longest Streak
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/15 text-center space-y-0.5">
          <span className="text-base sm:text-lg font-extrabold text-foreground font-mono block leading-none">
            {stats.activeDays}
          </span>
          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
            Active Days
          </span>
        </div>
      </div>

      {/* ── No-token notice: prompt user to add token for full history ── */}
      {!hasFullHistory && (
        <div className="flex items-start gap-3 px-3.5 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 text-xs">
          <Key className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-600 dark:text-amber-400">
              Full contribution history requires a GitHub token
            </p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Currently showing ~90 days from public events. Add a free token to unlock your complete year-by-year history, exactly like GitHub.
            </p>
          </div>
          {onAddToken && (
            <button
              onClick={onAddToken}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-bold transition-colors whitespace-nowrap"
            >
              Add Token
            </button>
          )}
        </div>
      )}

      {/* ── Heatmap Grid or Empty State ── */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/60 bg-muted/10 gap-3">
          <Activity className="size-8 text-muted-foreground/40" />
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-muted-foreground">No contributions in {selectedYear}</p>
            <p className="text-xs text-muted-foreground/60">
              {selectedYear < currentYear
                ? "No public activity data is available for this year."
                : "Start contributing to see your activity here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          {/* Floating Tooltip */}
          {tooltip.visible && (
            <div
              className="pointer-events-none absolute z-50 px-3 py-1.5 rounded-xl bg-popover/95 border border-border/90 shadow-2xl text-xs font-semibold text-foreground whitespace-nowrap backdrop-blur-sm"
              style={{ left: `${tooltip.x}px`, top: `${tooltip.y - 44}px`, transform: "translateX(-50%)" }}
            >
              <span className="text-emerald-500 font-extrabold font-mono">{tooltip.count}</span>
              <span className="text-muted-foreground ml-1">
                {tooltip.count === 1 ? "contribution" : "contributions"} on {formatShortDate(tooltip.date)}
              </span>
            </div>
          )}

          {/* Scrollable heatmap area */}
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[680px]">
              {/* Month labels row */}
              <div className="flex pl-8 mb-1.5">
                {weeks.map((_, wi) => {
                  const lbl = monthLabels.find((m) => m.weekIndex === wi);
                  return (
                    <div key={wi} style={{ flex: "1 1 0", minWidth: 0 }}>
                      {lbl ? (
                        <span className="text-[10px] font-bold text-muted-foreground/80 select-none leading-none">
                          {lbl.label}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Grid: weekday labels + cells */}
              <div className="flex">
                {/* Weekday Y-axis labels — all 7 days, matching cell height */}
                <div className="flex flex-col pr-2 shrink-0">
                  {WEEKDAYS_SHORT.map((day, i) => (
                    <div
                      key={day}
                      className="flex items-center"
                      style={{ height: "13px", marginBottom: i < 6 ? "3px" : "0" }}
                    >
                      <span className="text-[9px] font-semibold text-muted-foreground/70 select-none leading-none w-7">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Week columns */}
                <div className={cn("flex gap-[3px] transition-opacity duration-700 ease-out", mounted ? "opacity-100" : "opacity-0")}>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((day, di) => {
                        const isPadding = day.count === -1;
                        const level = isPadding ? 0 : getLevel(day.count, maxCount);
                        const isToday = day.date === todayStr;
                        return (
                          <div
                            key={di}
                            className={cn(
                              "w-[12px] h-[12px] sm:w-[13px] sm:h-[13px] rounded-[3px] transition-all duration-100",
                              isPadding ? "opacity-0 pointer-events-none" : "hover:scale-[1.4] hover:z-10 cursor-default",
                              !isPadding && levelStyles[level],
                              isToday && !isPadding && "ring-1 ring-offset-[1px] ring-offset-card ring-blue-400/80"
                            )}
                            onMouseEnter={!isPadding ? (e) => handleMouseEnter(e, day.date, day.count) : undefined}
                            onMouseLeave={!isPadding ? () => setTooltip((p) => ({ ...p, visible: false })) : undefined}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <span className="text-[10px] text-muted-foreground/70 font-semibold select-none">Less</span>
                {([0, 1, 2, 3, 4] as const).map((lvl) => (
                  <div key={lvl} className={cn("w-[12px] h-[12px] rounded-[3px]", levelStyles[lvl])} />
                ))}
                <span className="text-[10px] text-muted-foreground/70 font-semibold select-none">More</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Year summary line ── */}
      <p className="text-[11px] text-muted-foreground/60 text-right font-medium">
        {hasData
          ? `${stats.totalContributions.toLocaleString()} contribution${stats.totalContributions !== 1 ? "s" : ""} in ${selectedYear}`
          : `No activity recorded for ${selectedYear}`}
        {!hasFullHistory && hasData && (
          <span className="ml-1.5 text-[10px] text-amber-500/70">(~90 day snapshot)</span>
        )}
      </p>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
export function GitHubContributionHeatmapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 space-y-5 shadow-sm w-full", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-44 rounded-full bg-muted/50 animate-pulse" />
        <div className="h-7 w-24 rounded-xl bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[60px] rounded-2xl bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[680px] pl-8">
          <div className="flex gap-[3px]">
            {Array.from({ length: 53 }).map((_, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((__, di) => (
                  <div key={di} className="w-[12px] h-[12px] sm:w-[13px] sm:h-[13px] rounded-[3px] bg-muted/40 animate-pulse"
                    style={{ animationDelay: `${(wi * 7 + di) * 2}ms` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
