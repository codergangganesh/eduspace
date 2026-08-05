import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  differenceInMinutes,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Bell,
  Zap,
  Globe,
  Check,
  X,
  Info,
  CalendarPlus,
  Share2,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contest, PlatformName } from '@/types/contest';
import { formatDuration, generateGoogleCalendarUrl } from '@/services/contestService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ContestCalendarViewProps {
  contests: Contest[];
  reminders: string[];
  calendarAdded: string[];
  onToggleReminder: (contest: Contest) => void;
  onMarkCalendarAdded: (contestId: string) => void;
  viewType: 'calendar' | 'timeline';
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  LeetCode: {
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  Codeforces: {
    bg: 'bg-blue-500/15 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  CodeChef: {
    bg: 'bg-amber-800/15 dark:bg-amber-700/25',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-700/30',
    dot: 'bg-amber-700',
  },
  AtCoder: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
  },
  HackerRank: {
    bg: 'bg-green-600/15 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-500/30',
    dot: 'bg-green-500',
  },
  HackerEarth: {
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
  Kaggle: {
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
  },
};

function getPlatformStyle(platform: string) {
  return (
    PLATFORM_COLORS[platform] || {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20',
      dot: 'bg-primary',
    }
  );
}

export function ContestCalendarView({
  contests,
  reminders,
  calendarAdded,
  onToggleReminder,
  onMarkCalendarAdded,
  viewType,
}: ContestCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

  // Month View Days Generation
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const startDate = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const endDate = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd]);
  const daysInMonthView = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  // Timeline (7-Day Week View) Days Generation
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 0 }), [weekStart]);
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  // Map contests to days
  const contestsByDay = useMemo(() => {
    const map = new Map<string, Contest[]>();

    contests.forEach((contest) => {
      const contestStart = new Date(contest.startTime);
      const dateKey = format(contestStart, 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, contest]);
    });

    return map;
  }, [contests]);

  // Identify peak contest days (Heatmap density & rush alerts)
  const peakDays = useMemo(() => {
    const peaks: { date: Date; count: number; platforms: string[] }[] = [];
    contestsByDay.forEach((dayContests, key) => {
      if (dayContests.length >= 2) {
        const dateObj = new Date(key + 'T00:00:00');
        const platforms = Array.from(new Set(dayContests.map((c) => c.platform)));
        peaks.push({ date: dateObj, count: dayContests.length, platforms });
      }
    });
    return peaks.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [contestsByDay]);

  const handlePrev = () => {
    if (viewType === 'calendar') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewType === 'calendar') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const selectedDayContests = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return contestsByDay.get(key) || [];
  }, [selectedDay, contestsByDay]);

  const handleShare = (contest: Contest) => {
    if (navigator.share) {
      navigator.share({
        title: contest.name,
        text: `Check out ${contest.name} on ${contest.platform}!`,
        url: contest.url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(contest.url);
      toast.success('Contest link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/70 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {viewType === 'calendar' ? <CalendarIcon className="size-4" /> : <Clock className="size-4" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              {viewType === 'calendar'
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {viewType === 'calendar'
                ? 'Interactive Month Schedule & Heatmap'
                : '7-Day Timeline Gantt View'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Heatmap Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground mr-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/60">
            <span className="font-semibold text-foreground">Density:</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> 1 Contest
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" /> 2 Contests
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" /> 3+ Rush
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-2.5 text-xs font-semibold rounded-lg border-border/80"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="size-8 rounded-lg border-border/80"
              title="Previous"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="size-8 rounded-lg border-border/80"
              title="Next"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Heatmap Legend */}
      <div className="flex lg:hidden items-center justify-around text-[10px] sm:text-xs text-muted-foreground bg-card border border-border/70 px-3 py-2 rounded-xl shadow-sm">
        <span className="font-semibold text-foreground">Density:</span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> 1 Contest
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-500" /> 2 Contests
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-rose-500 animate-pulse" /> 3+ Rush
        </span>
      </div>

      {/* MONTH GRID VIEW */}
      {viewType === 'calendar' && (
        <div className="bg-card border border-border/70 rounded-2xl p-1.5 sm:p-4 shadow-sm overflow-hidden space-y-2">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] sm:text-xs text-muted-foreground pb-2 border-b border-border/60">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-0.5 sm:py-1">
                <span className="sm:hidden">{day.charAt(0)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
            {daysInMonthView.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayContests = contestsByDay.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isDayToday = isToday(day);
              const count = dayContests.length;

              // Heatmap style calculation
              let heatmapBg = '';
              let countBadgeBg = '';
              if (count === 1) {
                heatmapBg = 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25';
                countBadgeBg = 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
              } else if (count === 2) {
                heatmapBg = 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/35';
                countBadgeBg = 'bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold';
              } else if (count >= 3) {
                heatmapBg = 'bg-rose-500/20 dark:bg-rose-500/25 border-rose-500/40 ring-1 ring-rose-500/30';
                countBadgeBg = 'bg-rose-500/30 text-rose-700 dark:text-rose-300 font-extrabold';
              }

              return (
                <div
                  key={dateKey}
                  onClick={() => dayContests.length > 0 && setSelectedDay(day)}
                  className={`min-h-[52px] sm:min-h-[115px] p-1 sm:p-2 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    isCurrentMonth ? 'opacity-100' : 'opacity-40 bg-muted/10'
                  } ${
                    isDayToday
                      ? 'border-primary ring-2 ring-primary/30 font-bold bg-primary/5'
                      : heatmapBg || 'border-border/50 hover:border-border hover:bg-muted/30'
                  } ${
                    dayContests.length > 0 ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                  }`}
                >
                  {/* Top Bar inside day cell */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-semibold rounded-md size-5 sm:size-6 flex items-center justify-center ${
                        isDayToday
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                          : 'text-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {count > 0 && (
                      <span
                        className={`hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-full ${countBadgeBg}`}
                        title={`${count} contest${count > 1 ? 's' : ''} scheduled`}
                      >
                        {count} {count === 1 ? 'Round' : 'Rounds'}
                      </span>
                    )}
                  </div>

                  {/* Mobile Indicator Dots (< sm screen) */}
                  {count > 0 && (
                    <div className="flex sm:hidden items-center justify-center gap-1 my-1">
                      {dayContests.slice(0, 3).map((c) => {
                        const style = getPlatformStyle(c.platform);
                        return (
                          <span
                            key={c.id}
                            className={`size-2 rounded-full ${style.dot} ring-1 ring-background shrink-0`}
                            title={`${c.name} (${c.platform})`}
                          />
                        );
                      })}
                      {count > 3 && (
                        <span className="text-[9px] font-bold text-muted-foreground">
                          +{count - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Desktop Contest Pills list (>= sm screen) */}
                  <div className="hidden sm:block space-y-1 my-1 overflow-hidden">
                    {dayContests.slice(0, 2).map((c) => {
                      const style = getPlatformStyle(c.platform);
                      return (
                        <div
                          key={c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContest(c);
                          }}
                          className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border} truncate hover:opacity-90 flex items-center gap-1 transition-all`}
                          title={`${c.name} (${c.platform})`}
                        >
                          <span className={`size-1.5 rounded-full ${style.dot} shrink-0`} />
                          <span className="truncate">{c.name}</span>
                        </div>
                      );
                    })}
                    {count > 2 && (
                      <div className="text-[10px] font-semibold text-muted-foreground text-center bg-muted/40 rounded py-0.5 hover:bg-muted">
                        +{count - 2} more...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK GANTT TIMELINE VIEW */}
      {viewType === 'timeline' && (
        <div className="bg-card border border-border/70 rounded-2xl p-3 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-3">
            <span className="font-semibold text-foreground">Weekly Timeline Overview</span>
            <span>Click any contest block to view actions</span>
          </div>

          <div className="space-y-3">
            {weekDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayContests = contestsByDay.get(dateKey) || [];
              const isDayToday = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={`p-3 rounded-xl border transition-all ${
                    isDayToday
                      ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/30'
                  }`}
                >
                  {/* Day Label Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isDayToday
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {format(day, 'EEE, MMM d')}
                      </span>
                      {isDayToday && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10">
                          Today
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {dayContests.length} {dayContests.length === 1 ? 'Contest' : 'Contests'}
                    </span>
                  </div>

                  {/* Contest Gantt Bars */}
                  {dayContests.length === 0 ? (
                    <div className="text-xs text-muted-foreground/60 italic py-1 pl-1">
                      No contests scheduled for this day
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {dayContests.map((c) => {
                        const style = getPlatformStyle(c.platform);
                        const startTime = format(new Date(c.startTime), 'HH:mm');
                        const isLive = c.status === 'CODING';
                        const isCalAdded = calendarAdded.includes(c.id);

                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedContest(c)}
                            className={`p-2.5 rounded-xl border ${style.bg} ${style.border} cursor-pointer hover:shadow-md transition-all space-y-1.5 relative overflow-hidden group`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${style.text} bg-background/60 backdrop-blur-sm border ${style.border}`}>
                                {c.platform}
                              </span>
                              <div className="flex items-center gap-1">
                                {isLive && (
                                  <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0 animate-pulse">
                                    <Zap className="size-2.5 mr-0.5 fill-current" /> Live
                                  </Badge>
                                )}
                                {isCalAdded && (
                                  <span title="Added to Calendar">
                                    <CalendarPlus className="size-3.5 text-emerald-500" />
                                  </span>
                                )}
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {c.name}
                            </h4>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="size-3 text-muted-foreground" />
                                {startTime} ({formatDuration(c.durationSeconds)})
                              </span>
                              <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY CONTESTS MODAL / DIALOG */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="size-5 text-primary" />
              Contests for {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : ''}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDayContests.length} contest{selectedDayContests.length > 1 ? 's' : ''} scheduled on this day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {selectedDayContests.map((c) => {
              const style = getPlatformStyle(c.platform);
              const isLive = c.status === 'CODING';
              const isBookmarked = reminders.includes(c.id);
              const isCalAdded = calendarAdded.includes(c.id);

              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border ${style.bg} ${style.border} space-y-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${style.text} bg-background/80 border ${style.border}`}>
                        {c.platform}
                      </span>
                      <h4 className="text-sm font-bold text-foreground mt-1">{c.name}</h4>
                    </div>
                    {isLive && (
                      <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5">
                        <Zap className="size-3 mr-1 fill-current animate-bounce" /> Live
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="size-3.5" />
                      {format(new Date(c.startTime), 'hh:mm a')}
                    </span>
                    <span>•</span>
                    <span>Duration: {formatDuration(c.durationSeconds)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isCalAdded ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => {
                          window.open(generateGoogleCalendarUrl(c), '_blank');
                          onMarkCalendarAdded(c.id);
                        }}
                        className={`h-8 text-xs gap-1 rounded-lg ${
                          isCalAdded ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold' : ''
                        }`}
                      >
                        {isCalAdded ? <Check className="size-3.5 text-emerald-500" /> : <CalendarPlus className="size-3.5 text-amber-500" />}
                        {isCalAdded ? 'Added to Calendar' : 'Add to Calendar'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShare(c)}
                        className="size-8 rounded-lg"
                        title="Share Contest"
                      >
                        <Share2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(c.url, '_blank')}
                        className="h-8 text-xs gap-1 rounded-lg"
                      >
                        Go to Contest
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* SINGLE CONTEST DETAILS DIALOG */}
      <Dialog open={!!selectedContest} onOpenChange={(open) => !open && setSelectedContest(null)}>
        {selectedContest && (
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getPlatformStyle(selectedContest.platform).text} ${getPlatformStyle(selectedContest.platform).bg}`}>
                  {selectedContest.platform}
                </Badge>
                {selectedContest.status === 'CODING' && (
                  <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5">
                    <Zap className="size-3 mr-1 fill-current" /> Live Now
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-bold">{selectedContest.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Starts {format(new Date(selectedContest.startTime), 'EEEE, MMMM d, yyyy @ hh:mm a')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs bg-muted/40 p-3 rounded-xl border border-border/60">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">{formatDuration(selectedContest.durationSeconds)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-semibold">{format(new Date(selectedContest.endTime), 'MMM d, hh:mm a')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-semibold">{selectedContest.platform}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant={calendarAdded.includes(selectedContest.id) ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  window.open(generateGoogleCalendarUrl(selectedContest), '_blank');
                  onMarkCalendarAdded(selectedContest.id);
                }}
                className={`h-9 text-xs gap-1.5 rounded-xl flex-1 ${
                  calendarAdded.includes(selectedContest.id) ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-bold' : ''
                }`}
              >
                {calendarAdded.includes(selectedContest.id) ? <Check className="size-4 text-emerald-500" /> : <CalendarPlus className="size-4 text-amber-500" />}
                {calendarAdded.includes(selectedContest.id) ? 'Added to Calendar' : 'Add to Calendar'}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.open(selectedContest.url, '_blank')}
                className="h-9 text-xs gap-1.5 rounded-xl flex-1"
              >
                Visit Page <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
