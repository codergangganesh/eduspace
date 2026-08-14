import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Award,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Calendar,
  Sparkles,
  Pin,
} from "lucide-react";
import { CredlyStats, CredlyBadge } from "@/types/credlyProfile";
import { extractCredlyUsername } from "@/services/credlyService";
import { UnifiedPlatformLogo, CredlyLogo } from "./PlatformLogos";
import { cn } from "@/lib/utils";

export { CredlyLogo };

export interface CredlyProfileCardProps {
  usernameOrHandle?: string | null;
  stats?: CredlyStats | null;
  error?: string | null;
  onConnect?: () => void;
  onEditHandle?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export function CredlyProfileCard({
  usernameOrHandle,
  stats,
  error,
  onConnect,
  onEditHandle,
  onRefresh,
  isRefreshing,
  isPinned,
  onTogglePin,
  className,
}: CredlyProfileCardProps) {
  const username = extractCredlyUsername(usernameOrHandle);
  const hasLinked = Boolean(username && username.trim().length > 0);
  const profileUrl = hasLinked ? `https://www.credly.com/users/${username}` : "#";

  const badges = stats?.badges || [];
  const totalBadges = stats?.totalBadges ?? badges.length;

  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-border/80 transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-7 backdrop-blur-xl min-h-[420px] w-full max-w-full",
        "bg-gradient-to-b from-card via-card/95 to-card/90 shadow-md hover:shadow-2xl hover:-translate-y-1",
        "group-hover:border-[#FF6B00]/50 group-hover:shadow-[0_0_30px_rgba(255,107,0,0.18)]",
        className
      )}
    >
      {/* Background Glow */}
      <div className="absolute -top-32 -right-32 size-64 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-[#FF6B00]" />

      <div className="space-y-6">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-13 sm:size-14 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105 shadow-sm p-2.5 shrink-0 bg-[#FF6B00]/10 border-[#FF6B00]/20 text-[#FF6B00]">
              <UnifiedPlatformLogo platform="credly" className="size-7 sm:size-8" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight flex items-center gap-1.5">
                  Credly

                </h3>
                {hasLinked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-px rounded-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-semibold shrink-0">
                    <CheckCircle2 className="size-2.5 mr-0.5" />Linked
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
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="size-7 rounded-lg hover:bg-accent hover:text-foreground"
                title="Refresh certifications"
              >
                <RefreshCw className={cn("size-3", isRefreshing && "animate-spin text-primary")} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditHandle}
              className="size-7 rounded-lg hover:bg-accent"
              title="Edit username"
            >
              <Edit3 className="size-3 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Card Body */}
        {!hasLinked ? (
          <div className="py-12 px-6 text-center rounded-2xl bg-muted/20 border border-dashed border-border/80 my-2 space-y-4">
            <ShieldCheck className="size-10 text-[#FF6B00] mx-auto opacity-80" />
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Connect your Credly profile to display your verified AWS, Microsoft Azure, Cisco, or Google Cloud certifications.
            </p>
            <Button
              variant="outline"
              size="default"
              onClick={onConnect}
              className="gap-2 text-xs sm:text-sm rounded-2xl font-bold border-[#FF6B00]/40 text-[#FF6B00] hover:bg-[#FF6B00]/10 transition-all px-5 py-2"
            >
              <PlusCircle className="size-4" />
              Connect Credly
            </Button>
          </div>
        ) : error ? (
          <div className="py-6 px-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive my-2 flex items-start gap-3.5">
            <AlertCircle className="size-6 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold">Failed to load Credly credentials</p>
              <p className="opacity-90">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditHandle}
                className="h-8 px-2 text-xs underline text-destructive hover:bg-destructive/10 mt-2 font-semibold"
              >
                Edit Handle
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Stat Banner */}
            <div className="p-4 rounded-2xl bg-[#FF6B00]/5 border border-[#FF6B00]/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Award className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Verified Credentials
                  </span>
                  <span className="text-lg font-black font-mono text-foreground">
                    {totalBadges} {totalBadges === 1 ? "Certification" : "Certifications"}
                  </span>
                </div>
              </div>

              {totalBadges > 0 && (
                <Badge className="bg-[#FF6B00] text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-sm border-0 flex items-center gap-1">
                  Verified
                </Badge>
              )}
            </div>

            {/* Badges Grid */}
            {badges.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                No public Credly badges found for @{username}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {badges.map((badge) => (
                  <a
                    key={badge.id}
                    href={badge.badge_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-card/70 border border-border/70 hover:border-[#FF6B00]/40 hover:bg-[#FF6B00]/5 transition-all duration-200 flex items-center gap-3 group/item shadow-sm"
                  >
                    {badge.image_url ? (
                      <img
                        src={badge.image_url}
                        alt={badge.name}
                        className="size-12 rounded-xl object-contain shrink-0 group-hover/item:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-12 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] shrink-0">
                        <Award className="size-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover/item:text-[#FF6B00] transition-colors">
                        {badge.name}
                      </h4>
                      {badge.issuer_name && (
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          {badge.issuer_name}
                        </p>
                      )}
                    </div>

                    <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Credly Digital Credentials</span>
        {hasLinked && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#FF6B00] transition-colors font-bold flex items-center gap-1"
          >
            View All Badges <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}
