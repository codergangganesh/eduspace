import React from 'react';
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceTrend, TrendData } from '@/hooks/usePerformanceTrend';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PerformanceTrendChart() {
    const { data, loading, trendPercentage } = usePerformanceTrend();

    if (loading) {
        return (
            <Card className="border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading Student Performance data...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm overflow-hidden group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-foreground">Student Performance Trend</CardTitle>
                    <p className="text-sm text-muted-foreground">Average test scores across all active cohorts</p>
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
                                            <div className="rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-sm border-emerald-500/20">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                                    {payload[0].payload.week}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full bg-emerald-500" />
                                                    <p className="text-xl font-bold text-foreground">
                                                        {payload[0].value}%
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">Avg. Performance Score</p>
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
                                        fill="#10b981"
                                        fillOpacity={0.8}
                                        className="transition-all duration-300 hover:fill-opacity-100"
                                    />
                                ))}
                            </Bar>
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
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
