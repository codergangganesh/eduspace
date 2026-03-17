import React from 'react';
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceTrend, TrendData } from '@/hooks/usePerformanceTrend';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

export function PerformanceTrendChart() {
    const { data, loading, trendPercentage } = usePerformanceTrend();

    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm h-[420px] overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-7">
                    <div className="space-y-2.5">
                        <Skeleton className="h-7 w-48 rounded-lg" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-64 rounded-md" />
                            <div className="flex items-center gap-4 mt-2">
                                <Skeleton className="h-3 w-16 rounded-full" />
                                <Skeleton className="h-3 w-20 rounded-full" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                </CardHeader>
                <CardContent className="px-6 pb-4">
                    <div className="flex items-end gap-3 h-[280px] w-full pt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex-1 flex flex-col gap-2 items-center h-full justify-end">
                                <Skeleton 
                                    className="w-full rounded-t-lg opacity-20" 
                                    style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }} 
                                />
                                <Skeleton className="h-3 w-8 rounded-md" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm overflow-hidden group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Student Insights Trend</CardTitle>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground">Tracking average academic scores & attendance rates</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Academic</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="size-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Attendance</span>
                        </div>
                      </div>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                    trendPercentage >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                    {trendPercentage >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {Math.abs(trendPercentage)}%
                </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barSize={40}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="currentColor"
                                className="text-border/30"
                            />
                            <XAxis
                                dataKey="week"
                                stroke="currentColor"
                                fontSize={10}
                                fontWeight={600}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground uppercase tracking-widest"
                                dy={10}
                            />
                            <YAxis
                                stroke="currentColor"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur-sm border-slate-200 dark:border-white/10 min-w-[180px]">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 border-b border-border/10 pb-2">
                                                    {payload[0].payload.week}
                                                </p>
                                                <div className="space-y-3">
                                                  <div className="flex items-center justify-between gap-4">
                                                      <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-indigo-500" />
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Academic</span>
                                                      </div>
                                                      <p className="text-sm font-black text-foreground">
                                                          {payload[0].payload.score}%
                                                      </p>
                                                  </div>
                                                  <div className="flex items-center justify-between gap-4">
                                                      <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-emerald-500" />
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Attendance</span>
                                                      </div>
                                                      <p className="text-sm font-black text-foreground">
                                                          {payload[0].payload.attendance}%
                                                      </p>
                                                  </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="score"
                                radius={[6, 6, 0, 0]}
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="#6366f1"
                                        fillOpacity={0.05}
                                    />
                                ))}
                            </Bar>
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={4}
                                dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={2000}
                            />
                            <Line
                                type="monotone"
                                dataKey="attendance"
                                stroke="#10b981"
                                strokeWidth={4}
                                strokeDasharray="5 5"
                                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                animationDuration={2000}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
