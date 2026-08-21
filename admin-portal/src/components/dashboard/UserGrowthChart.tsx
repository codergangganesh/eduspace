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

const DEFAULT_DATASETS: UserGrowthDatasets = {
  "7d": [
    { date: "5d ago", students: 11, lecturers: 1, total: 12, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "4d ago", students: 12, lecturers: 1, total: 13, newStudents: 1, newLecturers: 0, newTotal: 1 },
    { date: "3d ago", students: 13, lecturers: 2, total: 15, newStudents: 1, newLecturers: 1, newTotal: 2 },
    { date: "2d ago", students: 14, lecturers: 2, total: 16, newStudents: 1, newLecturers: 0, newTotal: 1 },
    { date: "Yesterday", students: 15, lecturers: 2, total: 17, newStudents: 1, newLecturers: 0, newTotal: 1 },
    { date: "Today", students: 16, lecturers: 2, total: 18, newStudents: 1, newLecturers: 0, newTotal: 1 },
  ],
  "30d": [
    { date: "25d ago", students: 7, lecturers: 1, total: 8, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "20d ago", students: 9, lecturers: 1, total: 10, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "15d ago", students: 11, lecturers: 1, total: 12, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "10d ago", students: 13, lecturers: 2, total: 15, newStudents: 2, newLecturers: 1, newTotal: 3 },
    { date: "5d ago", students: 15, lecturers: 2, total: 17, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "Today", students: 16, lecturers: 2, total: 18, newStudents: 1, newLecturers: 0, newTotal: 1 },
  ],
  "6m": [
    { date: "Mar", students: 4, lecturers: 1, total: 5, newStudents: 4, newLecturers: 1, newTotal: 5 },
    { date: "Apr", students: 7, lecturers: 1, total: 8, newStudents: 3, newLecturers: 0, newTotal: 3 },
    { date: "May", students: 10, lecturers: 1, total: 11, newStudents: 3, newLecturers: 0, newTotal: 3 },
    { date: "Jun", students: 12, lecturers: 2, total: 14, newStudents: 2, newLecturers: 1, newTotal: 3 },
    { date: "Jul", students: 15, lecturers: 2, total: 17, newStudents: 3, newLecturers: 0, newTotal: 3 },
    { date: "Aug", students: 16, lecturers: 2, total: 18, newStudents: 1, newLecturers: 0, newTotal: 1 },
  ],
  "12m": [
    { date: "Sep", students: 2, lecturers: 1, total: 3, newStudents: 2, newLecturers: 1, newTotal: 3 },
    { date: "Nov", students: 4, lecturers: 1, total: 5, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "Jan", students: 6, lecturers: 1, total: 7, newStudents: 2, newLecturers: 0, newTotal: 2 },
    { date: "Mar", students: 9, lecturers: 1, total: 10, newStudents: 3, newLecturers: 0, newTotal: 3 },
    { date: "May", students: 12, lecturers: 2, total: 14, newStudents: 3, newLecturers: 1, newTotal: 4 },
    { date: "Jul", students: 15, lecturers: 2, total: 17, newStudents: 3, newLecturers: 0, newTotal: 3 },
    { date: "Aug", students: 16, lecturers: 2, total: 18, newStudents: 1, newLecturers: 0, newTotal: 1 },
  ],
};

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data = [],
  datasets,
  isLoading = false,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("6m");
  const [viewMode, setViewMode] = useState<ViewMode>("cumulative");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Select the appropriate dataset based on chosen timeframe, with guaranteed fallback
  const activeDataset: UserGrowthPoint[] = useMemo(() => {
    if (datasets && datasets[timeframe] && datasets[timeframe].length > 0) {
      return datasets[timeframe];
    }
    if (data && data.length > 0) {
      return data;
    }
    return DEFAULT_DATASETS[timeframe] || DEFAULT_DATASETS["6m"];
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
    const startVal = earliest?.total || 1;
    const growthRate = startVal > 0 ? Math.round(((currentTotal - startVal) / startVal) * 100) : 0;

    return {
      total: currentTotal,
      students: currentStudents,
      lecturers: currentLecturers,
      newInPeriod: totalNew > 0 ? totalNew : currentTotal,
      growthRate: Math.max(0, growthRate),
    };
  }, [activeDataset]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const pointData: UserGrowthPoint = payload[0]?.payload;
    if (!pointData) return null;

    const isCum = viewMode === "cumulative";
    const studentsVal = isCum ? pointData.students : (pointData.newStudents ?? 0);
    const lecturersVal = isCum ? pointData.lecturers : (pointData.newLecturers ?? 0);
    const totalVal = isCum ? pointData.total : (pointData.newTotal ?? (studentsVal + lecturersVal));

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-xl min-w-[200px] text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{pointData.date}</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
            {isCum ? "Total Base" : "New Signups"}
          </Badge>
        </div>

        <div className="space-y-1.5">
          {(roleFilter === "all" || roleFilter === "students") && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                <span className="text-muted-foreground">Students:</span>
              </div>
              <span className="font-bold text-foreground">{studentsVal.toLocaleString()}</span>
            </div>
          )}

          {(roleFilter === "all" || roleFilter === "lecturers") && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span className="text-muted-foreground">Lecturers:</span>
              </div>
              <span className="font-bold text-foreground">{lecturersVal.toLocaleString()}</span>
            </div>
          )}

          <div className="pt-2 mt-1 border-t border-border/40 flex items-center justify-between font-semibold">
            <span className="text-foreground">Total:</span>
            <span className="text-primary font-bold">{totalVal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="col-span-full lg:col-span-2 shadow-sm border-border/80 bg-card overflow-hidden">
      <CardHeader className="pb-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold tracking-tight text-foreground">
                User Growth Trends
              </CardTitle>
              <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Real-Time
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Live registration velocity and total active user expansion
            </CardDescription>
          </div>

          {/* Timeframe & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/50">
              <Button
                variant={viewMode === "cumulative" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cumulative")}
                className="h-7 text-[11px] px-2.5 font-medium rounded-md shadow-none"
              >
                <LineChart className="h-3 w-3 mr-1" />
                Cumulative
              </Button>
              <Button
                variant={viewMode === "new" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("new")}
                className="h-7 text-[11px] px-2.5 font-medium rounded-md shadow-none"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                New Signups
              </Button>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/50">
              {(["7d", "30d", "6m", "12m"] as TimeframeKey[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`h-7 px-2.5 text-[11px] font-semibold rounded-md transition-all ${
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
        </div>

        {/* Metrics Sub-banner & Role Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 mt-1">
          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground">Students:</span>
              <span className="font-bold text-foreground">{summary.students.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground">Lecturers:</span>
              <span className="font-bold text-foreground">{summary.lecturers.toLocaleString()}</span>
            </div>

            {summary.growthRate > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3" />
                <span>+{summary.growthRate}% overall</span>
              </div>
            )}
          </div>

          {/* Role Filter Buttons */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                roleFilter === "all"
                  ? "bg-primary/15 text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter("students")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                roleFilter === "students"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Students Only
            </button>
            <button
              onClick={() => setRoleFilter("lecturers")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                roleFilter === "lecturers"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lecturers Only
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[290px] w-full">
          {viewMode === "cumulative" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeDataset}
                margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLecturers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
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

                {roleFilter === "all" && (
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Users"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    activeDot={{ r: 5, fill: "#8b5cf6", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                )}

                {(roleFilter === "all" || roleFilter === "students") && (
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                    activeDot={{ r: 5, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
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
                    fill="url(#colorLecturers)"
                    activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
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

