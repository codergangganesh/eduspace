import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Edit3,
  BarChart2,
  ChevronRight,
  Code2,
  Layers,
  Cpu,
  Sparkles,
} from "lucide-react";
import { WakaTimeStats } from "@/types/wakatimeProfile";
import { extractWakaTimeUsername } from "@/services/wakatimeService";
import { UnifiedPlatformLogo } from "./PlatformLogos";
import { WakaTimeAnalyticsModal } from "./WakaTimeAnalyticsModal";
import { cn } from "@/lib/utils";

export interface WakaTimeProfileCardProps {
  usernameOrHandle?: string | null;
  stats?: WakaTimeStats | null;
  error?: string | null;
  onConnect?: () => void;
  onEditHandle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function WakaTimeProfileCard({
  usernameOrHandle,
  stats,
  error,
  onConnect,
  onEditHandle,
  onRefresh,
  isRefreshing,
  className,
}: WakaTimeProfileCardProps) {
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"editors" | "languages" | "projects">("editors");

  const username = extractWakaTimeUsername(usernameOrHandle);
  const hasLinked = Boolean(username && username.trim().length > 0);
  const profileUrl = hasLinked ? `https://wakatime.com/@${username}` : "#";

  const languages = stats?.languages || [];
  const projects = stats?.projects || [];
  const editors = stats?.editors || [];
  const operatingSystems = stats?.operating_systems && stats.operating_systems.length > 0 ? stats.operating_systems : stats?.categories || [];
  const dailyBreakdown = stats?.daily_breakdown || [];
  const bestDay = stats?.best_day;

  const maxDailySeconds = Math.max(1, ...dailyBreakdown.map((d) => d.total_seconds));

  return (
    <>
      <div
        className={cn(
          "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-5 sm:p-6 backdrop-blur-xl min-h-[420px] w-full max-w-full",
          "bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1",
          "group-hover:border-[#00E5FF]/50 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.18)]",
          className
        )}
      >
        {/* Background Glow */}
        <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-[#00E5FF]" />

        <div className="space-y-4 font-sans">
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2.5 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 sm:size-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-sm p-2 shrink-0 bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]">
                <UnifiedPlatformLogo platform="wakatime" className="size-6 sm:size-7" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight flex items-center gap-1 leading-none">
                    WakaTime
                  </h3>
                  {hasLinked && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold shrink-0">
                      <CheckCircle2 className="size-2.5 mr-0.5" />Linked
                    </Badge>
                  )}
                </div>

                {hasLinked ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-primary font-mono mt-0.5 flex items-center gap-1 transition-colors truncate max-w-[160px] sm:max-w-[220px]"
                  >
                    @{username} <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                ) : (
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                    Not connected
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="size-7 rounded-xl hover:bg-accent hover:text-foreground"
                  title="Refresh activity"
                >
                  <RefreshCw className={cn("size-3", isRefreshing && "animate-spin text-primary")} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onEditHandle}
                className="size-7 rounded-xl hover:bg-accent"
                title="Edit username"
              >
                <Edit3 className="size-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Card Body */}
          {!hasLinked ? (
            <div className="py-10 px-5 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 my-2 space-y-3">
              <Clock className="size-8 text-[#00E5FF] mx-auto opacity-80" />
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Connect your WakaTime profile to track your live coding hours, IDEs, and language stats.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onConnect}
                className="gap-1.5 text-xs rounded-xl font-bold border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all px-4 h-8"
              >
                <PlusCircle className="size-3.5" />
                Connect WakaTime
              </Button>
            </div>
          ) : error ? (
            <div className="py-5 px-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive my-2 flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold">Failed to load WakaTime activity</p>
                <p className="opacity-90 leading-tight text-[11px]">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditHandle}
                  className="h-7 px-2 text-[11px] underline text-destructive hover:bg-destructive/10 mt-1 font-semibold"
                >
                  Edit Handle
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards: Displays Full Numbers Directly in Compact Font */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Weekly Total
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate" title={stats?.human_readable_total}>
                    {stats?.human_readable_total || "0 hrs"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Daily Average
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate" title={stats?.daily_average}>
                    {stats?.daily_average || "0 mins"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Top Language
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate" title={languages[0]?.name}>
                    {languages[0]?.name || "N/A"}
                  </span>
                </div>
              </div>

              {/* Interactive Card Tab Switcher (Editors & OS First!) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/50 text-[11px]">
                  <button
                    onClick={() => setActiveTab("editors")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "editors"
                        ? "bg-card text-[#00E5FF] shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Cpu className="size-3 shrink-0" /> Editors & OS
                  </button>

                  <button
                    onClick={() => setActiveTab("languages")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "languages"
                        ? "bg-card text-[#00E5FF] shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code2 className="size-3 shrink-0" /> Languages ({languages.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("projects")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "projects"
                        ? "bg-card text-[#00E5FF] shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Layers className="size-3 shrink-0" /> Projects ({projects.length})
                  </button>
                </div>

                {/* Tab Content Panels with Compact Text Sizes */}
                {activeTab === "editors" && (
                  <div className="space-y-2 text-[11px]">
                    {/* Editors List */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">IDEs & Editors</span>
                      {editors.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground">No editor metrics.</p>
                      ) : (
                        editors.slice(0, 3).map((editor) => (
                          <div key={editor.name} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-foreground truncate max-w-[140px]">{editor.name}</span>
                              <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-1">
                                {editor.text} ({editor.percent}%)
                              </span>
                            </div>
                            <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(3, editor.percent)}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Operating Systems List */}
                    {operatingSystems.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border/40">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Operating Systems</span>
                        {operatingSystems.slice(0, 2).map((os) => (
                          <div key={os.name} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-foreground truncate max-w-[140px]">{os.name}</span>
                              <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-1">
                                {os.text} ({os.percent}%)
                              </span>
                            </div>
                            <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(3, os.percent)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "languages" && (
                  <div className="space-y-1.5">
                    {languages.slice(0, 3).map((lang) => (
                      <div key={lang.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="flex items-center gap-1.5 text-foreground truncate max-w-[130px]">
                            <span
                              className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: lang.color || "#00E5FF" }}
                            />
                            {lang.name}
                          </span>
                          <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-1">
                            {lang.text} ({lang.percent}%)
                          </span>
                        </div>
                        <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(3, lang.percent)}%`,
                              backgroundColor: lang.color || "#00E5FF",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className="space-y-1.5">
                    {projects.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-1 text-center">No public projects data.</p>
                    ) : (
                      projects.slice(0, 3).map((proj) => (
                        <div key={proj.name} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-foreground truncate max-w-[140px]">{proj.name}</span>
                            <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-1">
                              {proj.text} ({proj.percent}%)
                            </span>
                          </div>
                          <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(3, proj.percent)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Full Activity Modal Trigger */}
        <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">WakaTime Metrics</span>
          {hasLinked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalyticsModal(true)}
              className="text-[11px] font-bold text-[#00E5FF] hover:bg-[#00E5FF]/10 h-6 px-2 rounded-lg gap-0.5"
            >
              View Full Analytics <ChevronRight className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Separate WakaTime Full Analytics Modal */}
      <WakaTimeAnalyticsModal
        open={showAnalyticsModal}
        onOpenChange={setShowAnalyticsModal}
        stats={stats}
        username={username}
      />
    </>
  );
}
