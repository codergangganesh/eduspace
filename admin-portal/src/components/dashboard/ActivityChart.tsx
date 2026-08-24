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
    return data || [];
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
          <span>Created Records:</span>
          <span className="font-mono font-bold text-foreground text-sm">{val}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground mt-0.5">
          <span>Proportion:</span>
          <span className="font-mono font-semibold text-primary">{pct}%</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Academic Resources Breakdown
          </CardTitle>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {totalResources} Total
          </span>
        </div>
        <CardDescription className="text-xs">
          Active coursework, tests, curriculums, and classrooms
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col items-center justify-between flex-1 gap-3">
        {/* Horizontal Bars Container */}
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradBlue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="barGradEmerald" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="barGradPurple" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="barGradAmber" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="hsl(var(--border))"
                opacity={0.6}
              />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {activeData.map((entry, index) => {
                  const meta = RESOURCE_METAS[entry.name];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={meta ? meta.gradient : "#3b82f6"}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4 Mini Stat Badges */}
        <div className="grid grid-cols-4 gap-2 w-full pt-2 border-t border-border/50">
          {activeData.map((item, idx) => {
            const meta = RESOURCE_METAS[item.name];
            const Icon = meta?.icon || Layers;
            return (
              <div
                key={idx}
                className="p-2 rounded-lg bg-muted/30 border border-border/60 text-center space-y-0.5"
              >
                <div className="flex items-center justify-center gap-1">
                  <Icon className={`h-3 w-3 ${meta?.text || "text-foreground"}`} />
                  <span className="text-[10px] text-muted-foreground font-medium truncate">
                    {item.name}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground font-mono">{item.count}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
