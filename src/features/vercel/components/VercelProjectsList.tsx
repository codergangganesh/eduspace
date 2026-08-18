import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Search,
  Github,
  Globe,
  Layers,
  Calendar,
  X,
  Code2,
} from "lucide-react";
import { VercelProject } from "../types/vercelTypes";
import {
  formatFrameworkName,
  getDeploymentStatusInfo,
  formatTimeAgo,
} from "../utils/vercelHelpers";
import { cn } from "@/lib/utils";

interface VercelProjectsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: VercelProject[];
  vercelUsername?: string;
}

export function VercelProjectsList({
  open,
  onOpenChange,
  projects = [],
  vercelUsername,
}: VercelProjectsListProps) {
  const [search, setSearch] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string>("all");

  // Extract unique frameworks for quick filter chips
  const frameworks = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.framework) set.add(p.framework);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.framework && p.framework.toLowerCase().includes(term)) ||
        (p.link?.repo && p.link.repo.toLowerCase().includes(term));

      const matchesFramework =
        selectedFramework === "all" || p.framework === selectedFramework;

      return matchesSearch && matchesFramework;
    });
  }, [projects, search, selectedFramework]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl z-50 overflow-hidden"
      >
        {/* Sticky Header */}
        <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/50 bg-card/80 backdrop-blur-md shrink-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-9 sm:size-10 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-md shrink-0">
              <svg className="size-4.5 sm:size-5 fill-current" viewBox="0 0 116 100">
                <polygon points="58 0, 116 100, 0 100" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base sm:text-xl font-black tracking-tight text-foreground truncate">
                  Vercel Projects
                </SheetTitle>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted/80 text-foreground border border-border/60 shrink-0"
                >
                  {projects.length} Total
                </Badge>
              </div>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                {vercelUsername ? `@${vercelUsername} • ` : ""}Cloud Deployments & Repositories
              </SheetDescription>
            </div>
          </div>

          {/* Search Bar */}
          <div className="pt-1.5 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, frameworks, or repos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 sm:pl-9 pr-8 sm:pr-9 bg-background/60 rounded-xl border-border/60 text-xs h-9 sm:h-10 focus-visible:ring-1"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Framework Filter Chips */}
            {frameworks.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFramework("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0",
                    selectedFramework === "all"
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                  )}
                >
                  All ({projects.length})
                </button>
                {frameworks.map((fw) => {
                  const count = projects.filter((p) => p.framework === fw).length;
                  const isSelected = selectedFramework === fw;
                  return (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => setSelectedFramework(isSelected ? "all" : fw)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1",
                        isSelected
                          ? "bg-foreground text-background shadow-xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40"
                      )}
                    >
                      <span>{formatFrameworkName(fw)}</span>
                      <span className="opacity-70 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable Project Cards Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 sm:space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground space-y-2">
              <div className="size-11 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-center mx-auto text-muted-foreground">
                <Code2 className="size-5 opacity-60" />
              </div>
              <p className="font-bold text-sm text-foreground">No projects found</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No deployments match "{search || selectedFramework}".
              </p>
              {(search || selectedFramework !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedFramework("all");
                  }}
                  className="rounded-xl text-xs mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {filteredProjects.map((project) => {
                const latestDeploy = project.latestDeployments?.[0];
                const statusInfo = getDeploymentStatusInfo(latestDeploy?.readyState);
                const liveUrl =
                  latestDeploy?.url ||
                  (project.targets?.production?.url
                    ? `https://${project.targets.production.url}`
                    : null);
                const vercelProjectUrl = vercelUsername
                  ? `https://vercel.com/${vercelUsername}/${project.name}`
                  : null;

                return (
                  <div
                    key={project.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-card hover:border-border transition-all duration-200 shadow-xs hover:shadow-md space-y-2.5 group"
                  >
                    {/* Top Row: Title + Framework + Status Badge */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h4>
                        {project.framework && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md font-semibold border border-border/50 bg-muted/60 shrink-0"
                          >
                            <Layers className="size-2.5 mr-1 text-muted-foreground" />
                            {formatFrameworkName(project.framework)}
                          </Badge>
                        )}
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 flex items-center gap-1",
                          statusInfo.bgClass,
                          statusInfo.textClass,
                          statusInfo.borderClass
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            latestDeploy?.readyState === "READY"
                              ? "bg-emerald-500 animate-pulse"
                              : latestDeploy?.readyState === "BUILDING"
                              ? "bg-amber-500 animate-ping"
                              : "bg-rose-500"
                          )}
                        />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Single-Line Description for Mobile: Git Repo + Updated At */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden whitespace-nowrap min-w-0">
                      {project.link?.repo ? (
                        <a
                          href={`https://github.com/${project.link.repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground font-mono transition-colors hover:underline text-[11px] truncate shrink-0 max-w-[140px] sm:max-w-[200px]"
                        >
                          <Github className="size-3 shrink-0" />
                          <span className="truncate">{project.link.repo}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground/80 shrink-0">
                          Direct Deploy
                        </span>
                      )}
                      <span className="text-border shrink-0">•</span>
                      <span className="flex items-center gap-1 text-[11px] truncate shrink-0">
                        <Calendar className="size-3 shrink-0" />
                        Updated {formatTimeAgo(project.updatedAt || project.createdAt)}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        {vercelProjectUrl && (
                          <a
                            href={vercelProjectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium hover:underline truncate"
                          >
                            Vercel Dashboard
                          </a>
                        )}
                      </div>

                      <div className="shrink-0">
                        {liveUrl ? (
                          <Button
                            size="sm"
                            variant="default"
                            asChild
                            className="rounded-full h-7 sm:h-7.5 px-3.5 text-xs font-semibold gap-1.5 shadow-xs bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                          >
                            <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                              <Globe className="size-3.5" />
                              <span>Visit App</span>
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            No production alias
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <SheetFooter className="p-3.5 sm:p-4 border-t border-border/50 bg-card/80 backdrop-blur-md shrink-0 flex flex-row items-center justify-between gap-2">
          <div className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
            {filteredProjects.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold h-8 px-3"
            >
              Close
            </Button>
            {vercelUsername && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                asChild
                className="rounded-xl text-xs font-semibold h-8 px-3"
              >
                <a
                  href={`https://vercel.com/${vercelUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Vercel
                </a>
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
