import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, GraduationCap, ShieldCheck, ShieldAlert } from "lucide-react";

interface UserDistributionChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
  isLoading?: boolean;
}

const DEFAULT_DISTRIBUTION = [
  { name: "Students", value: 16, color: "#3b82f6" },
  { name: "Lecturers", value: 2, color: "#10b981" },
  { name: "Administrators", value: 1, color: "#8b5cf6" },
];

export const UserDistributionChart: React.FC<UserDistributionChartProps> = ({
  data = [],
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const activeData = useMemo(() => {
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + (curr.value || 0), 0);
      if (sum > 0) return data;
    }
    return DEFAULT_DISTRIBUTION;
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

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const val = item.value || 0;
    const pct = totalUsers > 0 ? ((val / totalUsers) * 100).toFixed(1) : "0";

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl p-2.5 shadow-xl text-xs min-w-[150px]">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="font-semibold text-foreground">{item.name}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
          <span>Count:</span>
          <span className="font-bold text-foreground">{val.toLocaleString()} ({pct}%)</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="col-span-full lg:col-span-1 shadow-sm border-border/80 bg-card overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              User Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Active breakdown across user roles
            </CardDescription>
          </div>
          <div className="flex items-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {totalUsers} Total
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Donut Chart with Center Total */}
        <div className="h-[175px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
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
                    className="transition-all duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-foreground tracking-tight">
              {totalUsers}
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Users
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Rows with Mini Progress Bars */}
        <div className="space-y-2 mt-2 pt-3 border-t border-border/60">
          {activeData.map((item, idx) => {
            const pct = totalUsers > 0 ? Math.round((item.value / totalUsers) * 100) : 0;
            const isHovered = activeIndex === idx;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(undefined)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  isHovered ? "bg-muted/70" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    {getRoleIcon(item.name)}
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                    <span>{item.value}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

