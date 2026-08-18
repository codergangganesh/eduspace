import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ExternalLink,
  Search,
  Github,
  Globe,
  Layers,
  Calendar,
  Sparkles,
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

  const filteredProjects = projects.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.framework && p.framework.toLowerCase().includes(term)) ||
      (p.link?.repo && p.link.repo.toLowerCase().includes(term))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl border border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
              <svg className="size-4 fill-current" viewBox="0 0 116 100">
                <polygon points="58 0, 116 100, 0 100" />
              </svg>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Vercel Deployed Projects
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {vercelUsername ? `@${vercelUsername} • ` : ""}
            {projects.length} live project{projects.length !== 1 ? "s" : ""} deployed on Vercel
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, stack, or repository..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50 rounded-xl border-border/60 text-sm focus-visible:ring-1"
          />
        </div>

        {/* Projects List Scroll Area */}
        <ScrollArea className="flex-1 max-h-[50vh] pr-3">
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm space-y-1">
              <p className="font-semibold text-foreground">No projects found</p>
              <p className="text-xs">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const latestDeploy = project.latestDeployments?.[0];
                const statusInfo = getDeploymentStatusInfo(latestDeploy?.readyState);
                const liveUrl = latestDeploy?.url || (project.targets?.production?.url ? `https://${project.targets.production.url}` : null);

                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-2xl border border-border/60 bg-background/50 hover:bg-muted/40 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium border border-border/40"
                        >
                          <Layers className="size-2.5 mr-1 text-muted-foreground" />
                          {formatFrameworkName(project.framework)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                            statusInfo.bgClass,
                            statusInfo.textClass,
                            statusInfo.borderClass
                          )}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {project.link?.repo && (
                          <a
                            href={`https://github.com/${project.link.repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground transition-colors hover:underline"
                          >
                            <Github className="size-3.5" />
                            <span className="truncate max-w-[150px]">{project.link.repo}</span>
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          Updated {formatTimeAgo(project.updatedAt || project.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {liveUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="rounded-xl h-8 text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground border-border/70"
                        >
                          <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                            <Globe className="size-3.5" />
                            <span>Visit App</span>
                            <ExternalLink className="size-3 opacity-70" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-2">No live URL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
