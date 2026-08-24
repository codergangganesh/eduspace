import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, ShieldCheck, ShieldAlert } from "lucide-react";

interface UserDistributionChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
  isLoading?: boolean;
}

export const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  data = [],
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const activeData = useMemo(() => {
    return data || [];
  }, [data]);

  const totalUsers = useMemo(() => {
    return activeData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [activeData]);

  const getRoleIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("student")) return <Users className="h-3.5 w-3.5 text-blue-500" />;
    if (n.includes("lecturer") || n.includes("faculty")) return <GraduationCap className="h-3.5 w-3.5 text-emerald-500" />;
    if (n.includes("admin")) return <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />;
    if (n.includes("suspend")) return <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />;
    return <Users className="h-3.5 w-3.5 text-primary" />;
  };

  // Custom Active Shape with slight enlargement
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const percentage = totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(1) : "0";

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <div className="flex items-center gap-2 pb-1 border-b border-border/50">
          {getRoleIcon(item.name)}
          <span className="font-semibold text-foreground">{item.name}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground pt-0.5">
          <span>Accounts:</span>
          <span className="font-mono font-bold text-foreground">{item.value}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Proportion:</span>
          <span className="font-mono font-semibold text-primary">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border bg-card flex flex-col justify-between overflow-hidden shadow-sm">
      <CardHeader className="pb-2 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            User Distribution
          </CardTitle>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {totalUsers} Registered
          </span>
        </div>
        <CardDescription className="text-xs">
          Role distribution across the platform
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 flex flex-col items-center justify-between flex-1 gap-3">
        {/* Donut Chart with Centered KPI */}
        <div className="h-[200px] w-full relative flex items-center justify-center">
          {totalUsers > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={activeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {activeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-300 cursor-pointer stroke-background stroke-2"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xl font-black tracking-tight text-foreground">
                  {activeIndex !== undefined && activeData[activeIndex]
                    ? activeData[activeIndex].value
                    : totalUsers}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {activeIndex !== undefined && activeData[activeIndex]
                    ? activeData[activeIndex].name
                    : "Total"}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground text-xs italic">
              No user records found
            </div>
          )}
        </div>

        {/* Legend Pills Grid */}
        {totalUsers > 0 && (
          <div className="grid grid-cols-2 gap-2 w-full pt-2 border-t border-border/50">
            {activeData.map((item, idx) => {
              const pct = totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(0) : "0";
              const isHovered = activeIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isHovered
                      ? "bg-accent border-primary/40 shadow-xs"
                      : "bg-muted/30 border-border/60 hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 font-mono">
                    <span className="text-xs font-bold text-foreground">{item.value}</span>
                    <span className="text-[10px] text-muted-foreground">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
