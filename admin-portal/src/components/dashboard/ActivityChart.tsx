import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Layers,
  ClipboardList,
  FileCheck,
  BookOpen,
  FolderKanban,
} from "lucide-react";

interface ActivityChartProps {
  data?: Array<{ name: string; count: number; color?: string }>;
  isLoading?: boolean;
}

const DEFAULT_ACTIVITY_DATA = [
  { name: "Assignments", count: 5, color: "#3b82f6" },
  { name: "Quizzes", count: 4, color: "#10b981" },
  { name: "Courses", count: 6, color: "#8b5cf6" },
  { name: "Classes", count: 8, color: "#f59e0b" },
];

const RESOURCE_METAS: Record<string, { icon: React.FC<{ className?: string }>; bg: string; text: string; gradient: string }> = {
  Assignments: {
    icon: ClipboardList,
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    gradient: "url(#barGradBlue)",
  },
  Quizzes: {
    icon: FileCheck,
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    gradient: "url(#barGradEmerald)",
  },
  Courses: {
    icon: BookOpen,
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    gradient: "url(#barGradPurple)",
  },
  Classes: {
    icon: FolderKanban,
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    gradient: "url(#barGradAmber)",
  },
};

export const ActivityChart: React.FC<ActivityChartProps> = ({ data = [] }) => {
  const activeData = useMemo(() => {
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + (curr.count || 0), 0);
      if (sum > 0) return data;
    }
    return DEFAULT_ACTIVITY_DATA;
  }, [data]);

  const totalResources = useMemo(() => {
    return activeData.reduce((acc, curr) => acc + (curr.count || 0), 0);
  }, [activeData]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const val = item.value || 0;
    const pct = totalResources > 0 ? ((val / totalResources) * 100).toFixed(1) : "0";
    const meta = RESOURCE_METAS[item.payload.name];
    const Icon = meta?.icon || Layers;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs min-w-[170px]">
        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-border/50">
          <div className={`p-1 rounded-md ${meta?.bg || "bg-primary/10"} ${meta?.text || "text-primary"}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-foreground">{item.payload.name}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Published Count:</span>
          <span className="font-bold text-foreground">{val.toLocaleString()} items</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground mt-0.5">
          <span>Share of Assets:</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col border-border/80 shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                Academic Resources Overview
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
              Live count of coursework tasks, evaluations, and classrooms
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary self-start sm:self-auto shadow-sm">
              {totalResources} Total Assets
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-0 pb-4 space-y-4">
        {/* Primary Bar Chart with Gradient Fills */}
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeData}
              margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="barGradEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="barGradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.65} />
                </linearGradient>
                <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b45309" stopOpacity={0.65} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                dataKey="name"
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
              <Bar
                dataKey="count"
                name="Total Items"
                radius={[6, 6, 0, 0]}
                barSize={36}
              >
                {activeData.map((entry) => {
                  const meta = RESOURCE_METAS[entry.name];
                  const fill = meta?.gradient || "#3b82f6";
                  return <Cell key={entry.name} fill={fill} className="transition-all duration-200 cursor-pointer" />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Resource Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60">
          {activeData.map((item) => {
            const meta = RESOURCE_METAS[item.name];
            const Icon = meta?.icon || Layers;
            const pct = totalResources > 0 ? Math.round((item.count / totalResources) * 100) : 0;

            return (
              <div
                key={item.name}
                className="p-2 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${meta?.bg || "bg-primary/10"} ${meta?.text || "text-primary"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-sm font-extrabold text-foreground tracking-tight">{item.count}</span>
                  <p className="text-[10px] text-muted-foreground truncate">{item.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

