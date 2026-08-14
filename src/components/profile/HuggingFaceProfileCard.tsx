import React, { useState, useEffect, useCallback } from "react";
import { HuggingFaceStats } from "@/types/huggingFaceProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ExternalLink,
  RefreshCw,
  Box,
  Database,
  Layout,
  Heart,
  Download,
  ChevronDown,
  FolderKanban,
  Users,
  Eye,
  Search,
  Loader2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchHuggingFaceStats } from "@/services/huggingFaceService";
import { toast } from "sonner";

interface HuggingFaceProfileCardProps {
  usernameOrHandle?: string | null;
  stats?: HuggingFaceStats | null;
  error?: string | null;
  onConnect?: () => void;
  onEditHandle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const POPULAR_HANDLES = ["TheBloke", "meta-llama", "stabilityai", "google", "mistralai"];

export function HuggingFaceProfileCard({
  usernameOrHandle,
  stats: initialStats,
  error: initialError,
  onConnect,
  onEditHandle,
  onRefresh,
  isRefreshing,
  isPinned,
  onTogglePin,
}: HuggingFaceProfileCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchHandle, setSearchHandle] = useState(usernameOrHandle || initialStats?.username || "");
  const [loading, setLoading] = useState(false);
  const [activeStats, setActiveStats] = useState<HuggingFaceStats | null>(initialStats || null);
  const [activeError, setActiveError] = useState<string | null>(initialError || null);

  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [visibleModelsCount, setVisibleModelsCount] = useState(20);
  const [visibleDatasetsCount, setVisibleDatasetsCount] = useState(10);
  const [visibleSpacesCount, setVisibleSpacesCount] = useState(10);

  const isLinked = Boolean(usernameOrHandle || initialStats?.username);

  // Search or fetch Hugging Face stats inside Sheet
  const handleInspectOrSearch = useCallback(async (handleToFetch: string) => {
    const clean = handleToFetch.trim();
    if (!clean) return;
    setLoading(true);
    setActiveError(null);
    try {
      const res = await fetchHuggingFaceStats(clean);
      if (res.error) {
        setActiveError(res.error);
        toast.error(res.error);
      } else {
        setActiveStats(res.data);
        setActiveError(null);
        toast.success(`Fetched Hugging Face profile for @${res.data?.username}`);
      }
    } catch (err: any) {
      setActiveError(err?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  // Synchronize state with initialStats or fetch real-time data on mount/prop change
  useEffect(() => {
    if (initialStats) {
      setActiveStats(initialStats);
    } else if (usernameOrHandle && !activeStats) {
      handleInspectOrSearch(usernameOrHandle);
    }
  }, [initialStats, usernameOrHandle, handleInspectOrSearch]);

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
    if (!activeStats && usernameOrHandle) {
      handleInspectOrSearch(usernameOrHandle);
    }
  };

  if (!isLinked) {
    return (
      <>
        <div className="group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.18)]">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-13 sm:size-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl shrink-0 p-2.5 shadow-sm">
                🤗
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">Hugging Face</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">Not connected</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-6">
            <div className="size-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 transition-transform">
              <span className="text-2xl">🤗</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-foreground">Connect Hugging Face Profile</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Showcase your Models, Datasets, Spaces, Likes, and Downloads.
              </p>
            </div>
            <Button
              onClick={onConnect || handleOpenSheet}
              variant="outline"
              size="sm"
              className="rounded-xl border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 text-xs font-semibold gap-2"
            >
              <span>🤗</span> Connect Profile
            </Button>
          </div>
        </div>

        <HuggingFaceSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          searchHandle={searchHandle}
          setSearchHandle={setSearchHandle}
          handleInspectOrSearch={handleInspectOrSearch}
          loading={loading}
          activeStats={activeStats}
          activeError={activeError}
          onEditHandle={onEditHandle}
          modelSearchQuery={modelSearchQuery}
          setModelSearchQuery={setModelSearchQuery}
          visibleModelsCount={visibleModelsCount}
          setVisibleModelsCount={setVisibleModelsCount}
          visibleDatasetsCount={visibleDatasetsCount}
          setVisibleDatasetsCount={setVisibleDatasetsCount}
          visibleSpacesCount={visibleSpacesCount}
          setVisibleSpacesCount={setVisibleSpacesCount}
        />
      </>
    );
  }

  if (initialError && !initialStats) {
    return (
      <div className="group relative rounded-3xl border border-destructive/30 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center text-xl font-bold">
            🤗
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Hugging Face Error</h4>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">{initialError}</p>
          </div>
          <Button onClick={onEditHandle || handleOpenSheet} variant="outline" size="sm" className="rounded-xl text-xs">
            Edit Handle
          </Button>
        </div>
      </div>
    );
  }

  const currentStats = activeStats || initialStats;
  const profileUrl = currentStats?.profileUrl || `https://huggingface.co/${usernameOrHandle}`;
  const allModels = currentStats?.recentModels || currentStats?.featuredModels || [];
  const previewModels = allModels.slice(0, 3);

  return (
    <>
      <div className="group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1 group-hover:border-yellow-500/50 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.18)]">
        {/* Background Glow */}
        <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-yellow-500" />

        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5 mb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 sm:size-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl shrink-0 p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
              🤗
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">Hugging Face</h3>
                <span className="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 w-fit whitespace-nowrap leading-tight shrink-0">
                  <CheckCircle2 className="size-2.5 mr-0.5" />Linked
                </span>
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-yellow-500 font-mono mt-0.5 flex items-center gap-1 transition-colors truncate max-w-[180px] sm:max-w-[240px]"
              >
                @{currentStats?.username || usernameOrHandle} <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="size-7 rounded-lg hover:bg-yellow-500/10 hover:text-yellow-500"
                title="Refresh statistics"
              >
                <RefreshCw className={cn("size-3", isRefreshing && "animate-spin text-yellow-500")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditHandle || handleOpenSheet}
              className="size-7 rounded-lg hover:bg-accent"
              title="Edit handle"
            >
              <Edit3 className="size-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">
              <Box className="size-3.5" /> Models
            </div>
            <p className="text-lg font-black text-foreground font-mono">{currentStats?.totalModels ?? 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {currentStats?.totalModelDownloads ? `${currentStats.totalModelDownloads.toLocaleString()} dl` : "0 downloads"}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
              <Database className="size-3.5" /> Datasets
            </div>
            <p className="text-lg font-black text-foreground font-mono">{currentStats?.totalDatasets ?? 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {currentStats?.totalDatasetDownloads ? `${currentStats.totalDatasetDownloads.toLocaleString()} dl` : "0 downloads"}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">
              <Layout className="size-3.5" /> Spaces
            </div>
            <p className="text-lg font-black text-foreground font-mono">{currentStats?.totalSpaces ?? 0}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {currentStats?.totalSpaceLikes ? `${currentStats.totalSpaceLikes.toLocaleString()} ♥` : "0 likes"}
            </p>
          </div>
        </div>

        {/* Realtime Impact Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40 text-xs">
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-bold">
              <Download className="size-3.5" /> {(currentStats?.totalDownloads ?? 0).toLocaleString()} dl
            </span>
            <span className="flex items-center gap-1 text-rose-500 font-bold">
              <Heart className="size-3.5 fill-rose-500" /> {(currentStats?.totalLikes ?? 0).toLocaleString()} likes
            </span>
          </div>
          {currentStats?.followers ? (
            <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
              <Users className="size-3 text-yellow-500" /> {currentStats.followers} followers
            </div>
          ) : null}
        </div>

        {/* Compact Card Preview (3 Top Models) */}
        {previewModels.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Box className="size-3.5 text-yellow-500" /> Top Models Preview
              </h4>
              <span className="text-[10px] font-mono font-extrabold text-muted-foreground">
                3 of {currentStats?.totalModels ?? allModels.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {previewModels.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/item flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-yellow-500/10 border border-border/40 hover:border-yellow-500/30 transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-foreground group-hover/item:text-yellow-600 dark:group-hover/item:text-yellow-400 truncate">
                      {m.name}
                    </div>
                    {m.pipeline_tag && (
                      <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                        {m.pipeline_tag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0">
                    <span className="flex items-center gap-0.5">
                      <Download className="size-3 text-yellow-500" /> {m.downloads.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="size-3 text-rose-500" /> {m.likes.toLocaleString()}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Prominent View All & Search Handle Button */}
        <Button
          onClick={handleOpenSheet}
          className="w-full h-10 rounded-2xl bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 font-bold text-xs gap-2 transition-all shadow-sm"
        >
          <Eye className="size-4" />
          <span>View & Search Hugging Face Profile ({currentStats?.totalModels ?? allModels.length} Models)</span>
        </Button>
      </div>

      {/* Slide-Over Sheet (GitHub Search & Inspect Style) */}
      <HuggingFaceSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        searchHandle={searchHandle}
        setSearchHandle={setSearchHandle}
        handleInspectOrSearch={handleInspectOrSearch}
        loading={loading}
        activeStats={currentStats}
        activeError={activeError}
        onEditHandle={onEditHandle}
        modelSearchQuery={modelSearchQuery}
        setModelSearchQuery={setModelSearchQuery}
        visibleModelsCount={visibleModelsCount}
        setVisibleModelsCount={setVisibleModelsCount}
        visibleDatasetsCount={visibleDatasetsCount}
        setVisibleDatasetsCount={setVisibleDatasetsCount}
        visibleSpacesCount={visibleSpacesCount}
        setVisibleSpacesCount={setVisibleSpacesCount}
      />
    </>
  );
}

// Subcomponent: Hugging Face Slide-Over Sheet
interface HuggingFaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchHandle: string;
  setSearchHandle: (val: string) => void;
  handleInspectOrSearch: (handle: string) => void;
  loading: boolean;
  activeStats: HuggingFaceStats | null;
  activeError: string | null;
  onEditHandle?: () => void;
  modelSearchQuery: string;
  setModelSearchQuery: (val: string) => void;
  visibleModelsCount: number;
  setVisibleModelsCount: React.Dispatch<React.SetStateAction<number>>;
  visibleDatasetsCount: number;
  setVisibleDatasetsCount: React.Dispatch<React.SetStateAction<number>>;
  visibleSpacesCount: number;
  setVisibleSpacesCount: React.Dispatch<React.SetStateAction<number>>;
}

function HuggingFaceSheet({
  open,
  onOpenChange,
  searchHandle,
  setSearchHandle,
  handleInspectOrSearch,
  loading,
  activeStats,
  activeError,
  onEditHandle,
  modelSearchQuery,
  setModelSearchQuery,
  visibleModelsCount,
  setVisibleModelsCount,
  visibleDatasetsCount,
  setVisibleDatasetsCount,
  visibleSpacesCount,
  setVisibleSpacesCount,
}: HuggingFaceSheetProps) {
  const allModels = activeStats?.recentModels || activeStats?.featuredModels || [];
  const filteredModels = modelSearchQuery
    ? allModels.filter(
      (m) =>
        m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        (m.pipeline_tag && m.pipeline_tag.toLowerCase().includes(modelSearchQuery.toLowerCase()))
    )
    : allModels;

  const visibleModels = filteredModels.slice(0, visibleModelsCount);
  const hasMoreModels = visibleModelsCount < filteredModels.length;

  const allDatasets = activeStats?.recentDatasets || activeStats?.featuredDatasets || [];
  const visibleDatasets = allDatasets.slice(0, visibleDatasetsCount);
  const hasMoreDatasets = visibleDatasetsCount < allDatasets.length;

  const allSpaces = activeStats?.recentSpaces || activeStats?.featuredSpaces || [];
  const visibleSpaces = allSpaces.slice(0, visibleSpacesCount);
  const hasMoreSpaces = visibleSpacesCount < allSpaces.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 p-0 overflow-hidden flex flex-col z-[70]">
        <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🤗</span>
            Hugging Face Profile & Model Explorer
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Search handles, inspect real-time models, datasets, spaces, and update your linked handle.
          </SheetDescription>
        </SheetHeader>

        {/* Handle Search & Edit Bar */}
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInspectOrSearch(searchHandle);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Enter handle e.g. TheBloke, meta-llama, google"
                value={searchHandle}
                onChange={(e) => setSearchHandle(e.target.value)}
                className="pl-9 h-10 rounded-xl font-mono text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs gap-1.5"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              <span>Inspect</span>
            </Button>
          </form>

          {/* Quick Handle Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground font-semibold">Popular:</span>
            {POPULAR_HANDLES.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setSearchHandle(h);
                  handleInspectOrSearch(h);
                }}
                className="px-2 py-0.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-mono font-semibold transition-all"
              >
                @{h}
              </button>
            ))}
          </div>

          {onEditHandle && (
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditHandle}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
              >
                <Edit3 className="size-3.5" /> Save & Update My Linked Handle
              </Button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 text-yellow-500 animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">Fetching Hugging Face profile & model models...</p>
          </div>
        )}

        {/* Error Display */}
        {activeError && !loading && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-center space-y-2">
            <p className="text-xs font-bold text-destructive">{activeError}</p>
          </div>
        )}

        {/* Main Stats Content */}
        {activeStats && !loading && (
          <div className="space-y-6">
            {/* Overview Stats Badges */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">Models</div>
                <div className="text-lg font-black font-mono text-foreground">{activeStats.totalModels}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{activeStats.totalModelDownloads.toLocaleString()} dl</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Datasets</div>
                <div className="text-lg font-black font-mono text-foreground">{activeStats.totalDatasets}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{activeStats.totalDatasetDownloads.toLocaleString()} dl</div>
              </div>
              <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">Spaces</div>
                <div className="text-lg font-black font-mono text-foreground">{activeStats.totalSpaces}</div>
                <div className="text-[10px] text-muted-foreground font-mono">{activeStats.totalSpaceLikes.toLocaleString()} ♥</div>
              </div>
            </div>

            {/* Model Search Filter */}
            {allModels.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Box className="size-3.5 text-yellow-500" /> Models Showcase ({filteredModels.length})
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold text-muted-foreground">
                    Showing {visibleModels.length} of {filteredModels.length}
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter models by name or pipeline tag..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="pl-9 h-9 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-yellow-500/20">
                  {visibleModels.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-yellow-500/10 border border-border/40 hover:border-yellow-500/30 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-foreground group-hover/item:text-yellow-600 dark:group-hover/item:text-yellow-400 truncate">
                          {m.name}
                        </div>
                        {m.pipeline_tag && (
                          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                            {m.pipeline_tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Download className="size-3.5 text-yellow-500" /> {m.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="size-3.5 text-rose-500" /> {m.likes.toLocaleString()}
                        </span>
                      </div>
                    </a>
                  ))}

                  {hasMoreModels && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleModelsCount((prev) => prev + 20)}
                      className="w-full h-9 mt-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 border border-border/50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Load More Models (+20)</span>
                      <ChevronDown className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Datasets Showcase */}
            {allDatasets.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="size-3.5 text-amber-500" /> Datasets Showcase
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold text-muted-foreground">
                    Showing {visibleDatasets.length} of {allDatasets.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-amber-500/20">
                  {visibleDatasets.map((d) => (
                    <a
                      key={d.id}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-amber-500/10 border border-border/40 hover:border-amber-500/30 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-foreground group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 truncate">
                          {d.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <Download className="size-3.5 text-amber-500" /> {d.downloads.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="size-3.5 text-rose-500" /> {d.likes.toLocaleString()}
                        </span>
                      </div>
                    </a>
                  ))}
                  {hasMoreDatasets && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleDatasetsCount((prev) => prev + 10)}
                      className="w-full h-9 mt-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 border border-border/50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Load More Datasets (+10)</span>
                      <ChevronDown className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Spaces Showcase */}
            {allSpaces.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layout className="size-3.5 text-yellow-500" /> Spaces Showcase
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold text-muted-foreground">
                    Showing {visibleSpaces.length} of {allSpaces.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-yellow-500/20">
                  {visibleSpaces.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/item flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-yellow-500/10 border border-border/40 hover:border-yellow-500/30 transition-all"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-foreground group-hover/item:text-yellow-600 dark:group-hover/item:text-yellow-400 truncate">
                          {s.name}
                        </div>
                        {s.sdk && (
                          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                            {s.sdk}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1 text-rose-500">
                          <Heart className="size-3.5 fill-rose-500" /> {s.likes.toLocaleString()}
                        </span>
                      </div>
                    </a>
                  ))}
                  {hasMoreSpaces && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleSpacesCount((prev) => prev + 10)}
                      className="w-full h-9 mt-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 border border-border/50 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Load More Spaces (+10)</span>
                      <ChevronDown className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
