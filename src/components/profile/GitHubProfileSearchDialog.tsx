import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  ExternalLink,
  GitBranch,
  Star,
  Users,
  UserCheck,
  Building2,
  Sparkles,
  AlertCircle,
  X,
  Code2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { GitHubSearchResultItem, GitHubStats } from "@/types/codingProfile";
import { searchGitHubUsers, fetchGitHubStats } from "@/services/codingProfileService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GitHubProfileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  githubToken?: string | null;
  initialQuery?: string;
}

const POPULAR_SEARCHES = [
  "torvalds",
  "gaearon",
  "yyx990803",
  "shadcn",
  "sindresorhus",
  "codergangganesh",
];

export function GitHubProfileSearchDialog({
  open,
  onOpenChange,
  githubToken,
  initialQuery = "",
}: GitHubProfileSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<GitHubSearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Inspected user stats modal state
  const [inspectingUser, setInspectingUser] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [inspectedStats, setInspectedStats] = useState<GitHubStats | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchTerm: string) => {
      const q = searchTerm.trim();
      if (!q) {
        setResults([]);
        setTotalCount(0);
        setCurrentPage(1);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setCurrentPage(1);

      try {
        const res = await searchGitHubUsers(q, githubToken, 1);
        if (res.error) {
          setError(res.error);
          setResults([]);
          setTotalCount(0);
        } else {
          setResults(res.items);
          setTotalCount(res.totalCount);
        }
      } catch (err: any) {
        setError(err?.message || "An error occurred during search.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [githubToken]
  );

  const handleLoadMore = useCallback(async () => {
    const q = query.trim();
    if (!q || loadingMore) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    try {
      const res = await searchGitHubUsers(q, githubToken, nextPage);
      if (!res.error && res.items.length > 0) {
        setResults((prev) => [...prev, ...res.items]);
        setCurrentPage(nextPage);
      }
    } catch {}
    finally {
      setLoadingMore(false);
    }
  }, [query, githubToken, currentPage, loadingMore]);

  // Debounced search on query change
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, open, handleSearch]);

  const handleInspectUser = async (username: string) => {
    setInspectingUser(username);
    setInspectLoading(true);
    setInspectedStats(null);
    setInspectError(null);

    try {
      const res = await fetchGitHubStats(username, githubToken);
      if (res.error) {
        setInspectError(res.error);
      } else {
        setInspectedStats(res.data);
      }
    } catch (err: any) {
      setInspectError(err?.message || "Failed to inspect profile.");
    } finally {
      setInspectLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setTotalCount(0);
    setCurrentPage(1);
    setError(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl w-[94vw] sm:w-full rounded-3xl p-6 max-h-[85vh] overflow-hidden flex flex-col gap-4 border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-foreground tracking-tight">
              <div className="size-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Search className="size-4" />
              </div>
              Search GitHub Profiles
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Search developers, open-source contributors, and organizations across GitHub worldwide.
            </DialogDescription>
          </DialogHeader>

          {/* Search Input Bar */}
          <div className="relative space-y-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, handle, or topic (e.g. torvalds, gaearon)..."
                className="pl-10 pr-10 h-11 rounded-2xl bg-muted/30 border-border/70 text-xs sm:text-sm font-medium focus-visible:ring-blue-500"
                autoFocus
              />
              {loading ? (
                <Loader2 className="absolute right-3.5 size-4 text-blue-500 animate-spin" />
              ) : query ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-3.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Popular Suggestion Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                Popular:
              </span>
              {POPULAR_SEARCHES.map((name) => (
                <button
                  key={name}
                  onClick={() => setQuery(name)}
                  className={cn(
                    "text-[11px] font-mono px-2.5 py-0.5 rounded-full border transition-all",
                    query === name
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  @{name}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[380px] space-y-3 pr-1">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border/60 rounded-2xl bg-muted/10">
                <GitBranch className="size-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">Type a username to start searching</p>
                <p className="text-[11px] text-muted-foreground">
                  Explore public GitHub profiles, top languages, stargazers, and repository stats.
                </p>
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && !error && (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border/60 rounded-2xl bg-muted/10">
                <AlertCircle className="size-8 text-amber-500/60 mx-auto" />
                <p className="font-semibold text-foreground">No GitHub profiles found for "{query}"</p>
                <p className="text-[11px] font-mono">Try checking the spelling or searching for a different handle.</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1">
                  <span>Found {totalCount.toLocaleString()} matching profile{totalCount === 1 ? "" : "s"}</span>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {results.map((item) => (
                    <div
                      key={item.login}
                      className="group p-3 rounded-2xl bg-muted/20 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={item.avatarUrl}
                          alt={item.login}
                          className="size-11 rounded-xl object-cover border border-blue-500/20 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-foreground truncate group-hover:text-blue-500 transition-colors">
                              @{item.login}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] px-1.5 py-0 rounded-md uppercase font-bold shrink-0",
                                item.type === "Organization"
                                  ? "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10"
                                  : "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                              )}
                            >
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            github.com/{item.login}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleInspectUser(item.login)}
                          className="h-8 text-[11px] font-bold rounded-xl px-2.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shadow-sm"
                        >
                          <span>Inspect</span>
                        </Button>
                        <a
                          href={item.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Open GitHub Profile"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {results.length < totalCount && (
                  <div className="pt-2 flex flex-col items-center gap-2">
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Showing <strong className="text-foreground">{results.length}</strong> of <strong className="text-foreground">{totalCount.toLocaleString()}</strong> profiles
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="rounded-2xl text-xs font-bold gap-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 px-6"
                    >
                      {loadingMore ? (
                        <><Loader2 className="size-3.5 animate-spin" /> Loading more...</>
                      ) : (
                        <>Load More Results</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inspected User Full Profile Stats Modal */}
      <Dialog open={Boolean(inspectingUser)} onOpenChange={(open) => !open && setInspectingUser(null)}>
        <DialogContent className="sm:max-w-3xl w-[94vw] sm:w-full rounded-3xl p-6 max-h-[88vh] overflow-y-auto border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl">
          {inspectLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="size-10 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-foreground">Fetching GitHub statistics for @{inspectingUser}...</p>
              <p className="text-xs text-muted-foreground">Gathering repositories, top languages, stargazers, and activity events.</p>
            </div>
          ) : inspectError ? (
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="size-10 text-rose-500 mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-bold text-base text-foreground">Failed to Load Profile</h4>
                <p className="text-xs text-muted-foreground">{inspectError}</p>
              </div>
              <Button onClick={() => setInspectingUser(null)} variant="outline" className="rounded-xl text-xs font-bold">
                Close
              </Button>
            </div>
          ) : inspectedStats ? (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-4">
                  <img
                    src={inspectedStats.avatarUrl}
                    alt={inspectedStats.name || inspectedStats.username || "Avatar"}
                    className="size-16 sm:size-20 rounded-2xl object-cover border-2 border-blue-500/30 shadow-md shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xl text-foreground">
                        {inspectedStats.name || inspectedStats.username}
                      </h3>
                      <span className="text-xs font-mono text-muted-foreground font-semibold">
                        @{inspectedStats.username}
                      </span>
                    </div>
                    {inspectedStats.bio && (
                      <p className="text-xs text-muted-foreground max-w-lg leading-relaxed line-clamp-2">
                        {inspectedStats.bio}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={inspectedStats.htmlUrl || `https://github.com/${inspectedStats.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-xs flex items-center shrink-0"
                >
                  <span>View GitHub Profile</span>
                </a>
              </div>

              {/* 4 Primary Stats Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <GitBranch className="size-4 text-blue-500 mx-auto mb-1" />
                  <span className="text-lg font-extrabold text-foreground font-mono block">
                    {inspectedStats.publicRepos}
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">Public Repos</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <Star className="size-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-lg font-extrabold text-foreground font-mono block">
                    {inspectedStats.totalStars ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Total Stars</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                  <Users className="size-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-lg font-extrabold text-foreground font-mono block">
                    {inspectedStats.followers}
                  </span>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Followers</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <UserCheck className="size-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-lg font-extrabold text-foreground font-mono block">
                    {inspectedStats.following ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Following</span>
                </div>
              </div>

              {/* Top Languages */}
              {inspectedStats.topLanguages && inspectedStats.topLanguages.length > 0 && (
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Code2 className="size-4 text-blue-500" /> Top Languages & Stack
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {inspectedStats.topLanguages.map((item) => (
                      <div key={item.language} className="p-2.5 rounded-xl bg-card border border-border/50 flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground truncate">{item.language}</span>
                        <span className="font-mono font-extrabold text-blue-500">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Repos */}
              {inspectedStats.topRepos && inspectedStats.topRepos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <BookOpen className="size-4 text-blue-500" /> Featured Projects ({inspectedStats.topRepos.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inspectedStats.topRepos.slice(0, 4).map((repo) => (
                      <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all space-y-1.5 block"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs text-foreground truncate">{repo.name}</h5>
                          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-bold shrink-0">
                            <Star className="size-3 fill-amber-500/30" /> {repo.stars}
                          </span>
                        </div>
                        {repo.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {repo.description}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
