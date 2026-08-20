import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  RefreshCw,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Pin,
  Sparkles,
  Layers,
  ChevronRight,
  FolderGit2,
  Rocket,
  PlusCircle,
  Globe,
  Cpu,
  Calendar,
} from "lucide-react";
import { VercelCachedData, VercelConnectionData } from "../types/vercelTypes";
import { VercelConnectButton } from "./VercelConnectButton";
import { VercelProjectsList } from "./VercelProjectsList";
import { syncVercelProfile, disconnectVercel } from "../services/vercelService";
import { formatFrameworkName, getDeploymentStatusInfo, formatTimeAgo } from "../utils/vercelHelpers";
import { UnifiedPlatformLogo } from "@/components/profile/PlatformLogos";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface VercelProfileCardProps {
  usernameOrHandle?: string | null;
  connectionData?: VercelConnectionData | null;
  stats?: VercelCachedData | null;
  error?: string | null;
  onConnect?: () => void;
  onEditHandle?: () => void;
  onRefresh?: () => void;
  onRefreshSuccess?: (data: VercelConnectionData) => void;
  onDisconnectSuccess?: () => void;
  isRefreshing?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
  readOnly?: boolean;
}

export function VercelProfileCard({
  usernameOrHandle,
  connectionData,
  stats: propStats,
  error,
  onConnect,
  onEditHandle,
  onRefresh,
  onRefreshSuccess,
  onDisconnectSuccess,
  isRefreshing = false,
  isPinned,
  onTogglePin,
  className,
  readOnly = false,
}: VercelProfileCardProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "stacks" | "deployments">("projects");
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const rawUsername = usernameOrHandle || connectionData?.vercelUsername || "";
  const username = rawUsername.replace(/^@+/, "").trim();
  const hasLinked = Boolean(connectionData?.connected || username.length > 0);
  const profileUrl = hasLinked ? `https://vercel.com/${username}` : "#";

  const cachedData: VercelCachedData | undefined =
    propStats || connectionData?.cachedData || undefined;

  const projects = cachedData?.projects || [];
  const topFrameworks = cachedData?.topFrameworks || [];
  const recentDeployments = cachedData?.recentDeployments || [];
  const totalProjects = cachedData?.totalProjects ?? projects.length;
  const totalDeployments = cachedData?.totalDeployments ?? recentDeployments.length;
  const lastSynced = connectionData?.lastSyncedAt || cachedData?.lastSynced;

  const topFramework = topFrameworks[0]
    ? formatFrameworkName(topFrameworks[0].framework)
    : "Next.js";

  const handleManualSync = async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }

    try {
      setSyncing(true);
      const res = await syncVercelProfile();
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to sync Vercel statistics.");
        return;
      }
      toast.success("Vercel statistics synchronized!");
      onRefreshSuccess?.(res.data);
    } catch (err: any) {
      toast.error(err?.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const res = await disconnectVercel();
      if (!res.success) {
        toast.error(res.error || "Failed to disconnect Vercel.");
        return;
      }
      toast.success("Vercel account disconnected.");
      setShowConfirmDisconnect(false);
      onDisconnectSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full",
          "bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1",
          "group-hover:border-foreground/40 group-hover:shadow-[0_0_30px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]",
          className
        )}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-15 dark:group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-foreground" />

        <div className="space-y-6 font-sans">
          {/* Card Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5 mb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-13 sm:size-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-sm p-2.5 shrink-0 bg-black text-white dark:bg-white dark:text-black border-border/40">
                <UnifiedPlatformLogo platform="vercel" className="size-6 sm:size-7" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight flex items-center gap-1 leading-none">
                    Vercel
                  </h3>
                  {hasLinked && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-px rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold shrink-0"
                    >
                      <CheckCircle2 className="size-2.5 mr-0.5" />
                      Linked
                    </Badge>
                  )}
                </div>

                {hasLinked ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary font-mono mt-0.5 flex items-center gap-1 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
                  >
                    @{username} <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[180px] sm:max-w-[240px]">
                    Not connected
                  </p>
                )}
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {onTogglePin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePin}
                  className={cn(
                    "size-7 rounded-lg transition-all",
                    isPinned
                      ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 border border-amber-500/30 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  title={isPinned ? "Unpin platform card" : "Pin platform card to top"}
                >
                  <Pin className={cn("size-3", isPinned && "fill-amber-500")} />
                </Button>
              )}

              {hasLinked && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleManualSync}
                  disabled={isRefreshing || syncing}
                  className="size-7 rounded-xl hover:bg-accent hover:text-foreground"
                  title="Refresh statistics"
                >
                  <RefreshCw
                    className={cn(
                      "size-3 text-muted-foreground",
                      (isRefreshing || syncing) && "animate-spin text-primary"
                    )}
                  />
                </Button>
              )}

              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditHandle || onConnect}
                  className="size-7 rounded-xl hover:bg-accent"
                  title={hasLinked ? "Manage connection" : "Connect Vercel"}
                >
                  <Edit3 className="size-3 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Card Body */}
          {!hasLinked ? (
            <div className="py-10 px-5 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 my-2 space-y-3">
              <div className="size-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto shadow-sm">
                <svg className="size-5 fill-current" viewBox="0 0 116 100">
                  <polygon points="58 0, 116 100, 0 100" />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Connect your Vercel account to showcase your live web apps, frameworks, and deployment activity.
              </p>
              {!readOnly && (
                <div className="pt-1 flex justify-center">
                  <Button
                    size="sm"
                    onClick={onConnect}
                    className="h-9 text-xs rounded-xl font-bold px-5 gap-2 bg-black hover:bg-neutral-900 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black shadow-sm transition-all duration-200"
                  >
                    <svg className="size-3.5 fill-current" viewBox="0 0 116 100">
                      <polygon points="58 0, 116 100, 0 100" />
                    </svg>
                    <span>Connect Vercel Account</span>
                  </Button>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="py-5 px-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive my-2 flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold">Failed to load Vercel statistics</p>
                <p className="opacity-90 leading-tight text-[11px]">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSync}
                  className="h-7 px-2 text-[11px] underline text-destructive hover:bg-destructive/10 mt-1 font-semibold"
                >
                  Retry Sync
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 3 Top Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Hosted Apps
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate"
                    title={`${totalProjects} projects`}
                  >
                    {totalProjects}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Deployments
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate"
                    title={`${totalDeployments} deployments`}
                  >
                    {totalDeployments}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-0.5 min-w-0">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                    Top Stack
                  </span>
                  <span
                    className="text-xs sm:text-sm font-extrabold font-mono text-foreground leading-tight block truncate"
                    title={topFramework}
                  >
                    {topFramework}
                  </span>
                </div>
              </div>

              {/* Interactive Card Tab Switcher */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/50 text-[11px]">
                  <button
                    onClick={() => setActiveTab("projects")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "projects"
                        ? "bg-card text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FolderGit2 className="size-3 shrink-0" /> Projects ({projects.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("stacks")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "stacks"
                        ? "bg-card text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Layers className="size-3 shrink-0" /> Stacks ({topFrameworks.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("deployments")}
                    className={cn(
                      "flex-1 py-1 font-bold rounded-lg transition-all flex items-center justify-center gap-1 truncate",
                      activeTab === "deployments"
                        ? "bg-card text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Rocket className="size-3 shrink-0" /> Activity ({recentDeployments.length})
                  </button>
                </div>

                {/* Tab 1: Projects Panel */}
                {activeTab === "projects" && (
                  <div className="space-y-2 text-[11px]">
                    {projects.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2 text-center">
                        No projects found on this Vercel account.
                      </p>
                    ) : (
                      projects.slice(0, 3).map((proj) => {
                        const deploy = proj.latestDeployments?.[0];
                        const status = getDeploymentStatusInfo(deploy?.readyState);
                        const liveUrl =
                          deploy?.url ||
                          (proj.targets?.production?.url
                            ? `https://${proj.targets.production.url}`
                            : null);

                        return (
                          <div
                            key={proj.id}
                            className="p-2 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-foreground truncate max-w-[130px]">
                                  {proj.name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-px rounded font-medium border border-border/40 shrink-0"
                                >
                                  {formatFrameworkName(proj.framework)}
                                </Badge>
                                <span
                                  className={cn(
                                    "text-[9px] font-semibold px-1 rounded-full border",
                                    status.bgClass,
                                    status.textClass,
                                    status.borderClass
                                  )}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Updated {formatTimeAgo(proj.updatedAt || proj.createdAt)}
                              </p>
                            </div>

                            {liveUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-6 px-2.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground gap-1 shrink-0 transition-colors"
                              >
                                <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                                  <Globe className="size-2.5" />
                                  <span>Live</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                    {projects.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowProjectsModal(true)}
                        className="w-full py-1.5 px-2 text-[11px] font-semibold text-center text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
                      >
                        View all {projects.length} deployed projects
                      </button>
                    )}
                  </div>
                )}

                {/* Tab 2: Stacks & Frameworks */}
                {activeTab === "stacks" && (
                  <div className="space-y-1.5 text-[11px]">
                    {topFrameworks.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2 text-center">
                        No framework breakdown available.
                      </p>
                    ) : (
                      topFrameworks.slice(0, 3).map((fw) => {
                        const percent = totalProjects > 0 ? Math.round((fw.count / totalProjects) * 100) : 0;
                        return (
                          <div key={fw.framework} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-foreground truncate max-w-[140px]">
                                {formatFrameworkName(fw.framework)}
                              </span>
                              <span className="font-mono text-muted-foreground text-[10px] shrink-0 ml-1">
                                {fw.count} project{fw.count !== 1 ? "s" : ""} ({percent}%)
                              </span>
                            </div>
                            <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-foreground rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(5, percent)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 3: Recent Deployments */}
                {activeTab === "deployments" && (
                  <div className="space-y-1.5 text-[11px]">
                    {recentDeployments.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground py-2 text-center">
                        No deployment events found.
                      </p>
                    ) : (
                      recentDeployments.slice(0, 3).map((d) => {
                        const status = getDeploymentStatusInfo(d.state);
                        return (
                          <div
                            key={d.uid || d.name}
                            className="p-2 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-foreground truncate max-w-[130px]">
                                  {d.name}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] font-semibold px-1 rounded-full border",
                                    status.bgClass,
                                    status.textClass,
                                    status.borderClass
                                  )}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {formatTimeAgo(d.created)}
                              </p>
                            </div>

                            {d.url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-6 px-2.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground gap-1 shrink-0 transition-colors"
                              >
                                <a href={d.url} target="_blank" rel="noopener noreferrer">
                                  <Globe className="size-2.5" />
                                  <span>Visit</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Modal Trigger */}
        <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">
            {hasLinked && lastSynced ? `Synced ${formatTimeAgo(lastSynced)}` : "Vercel Cloud Platform"}
          </span>

          {hasLinked && projects.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProjectsModal(true)}
              className="text-[11px] font-bold text-foreground hover:bg-muted h-6 px-2 rounded-lg"
            >
              Explore {projects.length} Project{projects.length !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>

      {/* Projects List Explorer Dialog */}
      <VercelProjectsList
        open={showProjectsModal}
        onOpenChange={setShowProjectsModal}
        projects={projects}
        vercelUsername={username}
      />

      {/* Disconnect Confirmation Modal */}
      <AlertDialog open={showConfirmDisconnect} onOpenChange={setShowConfirmDisconnect}>
        <AlertDialogContent className="rounded-3xl border border-border/80 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Manage Vercel Connection
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Connected as <strong className="text-foreground">@{username}</strong>. Disconnecting will remove your stored Vercel connection from EduSpace. You can reconnect anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
