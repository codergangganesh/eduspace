import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserGrowthPoint, UserGrowthDatasets } from "@/types";
import { TrendingUp, Users, GraduationCap, Calendar, BarChart3, LineChart } from "lucide-react";

interface UserGrowthChartProps {
  data?: UserGrowthPoint[];
  datasets?: UserGrowthDatasets;
  isLoading?: boolean;
}

type TimeframeKey = "7d" | "30d" | "6m" | "12m";
type ViewMode = "cumulative" | "new";
type RoleFilter = "all" | "students" | "lecturers";

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data = [],
  datasets,
  isLoading = false,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("6m");
  const [viewMode, setViewMode] = useState<ViewMode>("cumulative");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Select the appropriate dataset based on chosen timeframe
  const activeDataset: UserGrowthPoint[] = useMemo(() => {
    if (datasets && datasets[timeframe] && datasets[timeframe].length > 0) {
      return datasets[timeframe];
    }
    if (data && data.length > 0) {
      return data;
    }
    return [];
  }, [datasets, timeframe, data]);

  // Compute summary stats for the current view
  const summary = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) {
      return { total: 0, students: 0, lecturers: 0, newInPeriod: 0, growthRate: 0 };
    }

    const latest = activeDataset[activeDataset.length - 1];
    const earliest = activeDataset[0];

    const currentTotal = latest?.total || 0;
    const currentStudents = latest?.students || 0;
    const currentLecturers = latest?.lecturers || 0;

    const totalNew = activeDataset.reduce((acc, curr) => acc + (curr.newTotal ?? 0), 0);
    const startVal = earliest?.total || 0;
    const growthRate = startVal > 0 ? Math.round(((currentTotal - startVal) / startVal) * 100) : 0;

    return {
      total: currentTotal,
      students: currentStudents,
      lecturers: currentLecturers,
      newInPeriod: totalNew,
      growthRate,
    };
  }, [activeDataset]);

  const timeframeLabels: Record<TimeframeKey, string> = {
    "7d": "Last 7 Days (Daily)",
    "30d": "Last 30 Days (5-Day Intervals)",
    "6m": "Last 6 Months (Monthly)",
    "12m": "Past Year (12 Months)",
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const p = payload[0]?.payload as UserGrowthPoint;
    if (!p) return null;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-2 min-w-[190px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
          <span className="font-bold text-foreground">{p.date}</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
            {timeframe.toUpperCase()}
          </Badge>
        </div>

        {viewMode === "cumulative" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Total Students:
              </span>
              <strong className="text-foreground font-mono">{p.students}</strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Total Lecturers:
              </span>
              <strong className="text-foreground font-mono">{p.lecturers}</strong>
            </div>
            <div className="pt-1 border-t border-border/50 flex items-center justify-between font-semibold">
              <span className="text-foreground">Cumulative Total:</span>
              <span className="text-primary font-bold font-mono">{p.total}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                New Students:
              </span>
              <strong className="text-foreground font-mono">+{p.newStudents ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                New Lecturers:
              </span>
              <strong className="text-foreground font-mono">+{p.newLecturers ?? 0}</strong>
            </div>
            <div className="pt-1 border-t border-border/50 flex items-center justify-between font-semibold">
              <span className="text-foreground">New Registrations:</span>
              <span className="text-emerald-500 font-bold font-mono">+{p.newTotal ?? 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="lg:col-span-2 border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                User Enrollment & Growth Trends
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                Live Data
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              {timeframeLabels[timeframe]} • Historical student and faculty expansion
            </CardDescription>
          </div>

          {/* Timeframe Controls (7d, 30d, 6m, 12m) */}
          <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
            {(["7d", "30d", "6m", "12m"] as TimeframeKey[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                  timeframe === tf
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-toolbar: Cumulative vs New Bar + Role Filter + KPI Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1">
          {/* View Mode Toggle: Cumulative Area vs New Volume Bars */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("cumulative")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  viewMode === "cumulative"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LineChart className="h-3 w-3" />
                Cumulative
              </button>
              <button
                type="button"
                onClick={() => setViewMode("new")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  viewMode === "new"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="h-3 w-3" />
                New Users
              </button>
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRoleFilter("all")}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                  roleFilter === "all"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("students")}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                  roleFilter === "students"
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Students
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter("lecturers")}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                  roleFilter === "lecturers"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Lecturers
              </button>
            </div>
          </div>

          {/* Mini KPI Indicators */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Students:</span>
              <span className="font-bold text-foreground">{summary.students}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Faculty:</span>
              <span className="font-bold text-foreground">{summary.lecturers}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-2">
        <div className="h-[270px] w-full">
          {viewMode === "cumulative" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeDataset}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="growthStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="growthLecturers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.6}
                />

                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  dy={6}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {(roleFilter === "all" || roleFilter === "students") && (
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthStudents)"
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                )}

                {(roleFilter === "all" || roleFilter === "lecturers") && (
                  <Area
                    type="monotone"
                    dataKey="lecturers"
                    name="Lecturers"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthLecturers)"
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeDataset}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  dy={6}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {(roleFilter === "all" || roleFilter === "students") && (
                  <Bar
                    dataKey="newStudents"
                    name="New Students"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}

                {(roleFilter === "all" || roleFilter === "lecturers") && (
                  <Bar
                    dataKey="newLecturers"
                    name="New Lecturers"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
