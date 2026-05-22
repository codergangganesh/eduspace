import React, { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  Inbox,
  Search,
  SlidersHorizontal,
  Swords,
  Trophy,
  Users,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStreakDuels } from "@/hooks/useStreakDuels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DuelViewKey = "active" | "roster" | "invites" | "history";

export function StreakDuelsManager() {
  const { user } = useAuth();
  const {
    activeDuels,
    pendingDuels,
    pastDuels,
    classesAndClassmates,
    isLoading,
    challengeClassmate,
    acceptChallenge,
    declineChallenge,
    syncScores
  } = useStreakDuels();

  const [activeTab, setActiveTab] = useState<DuelViewKey>("active");
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const getInitials = (name?: string, fallback = "DU") =>
    (name || fallback)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const toggleClass = (classId: string) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const getDuelStatusWithPeer = (peerId: string, classId: string): "active" | "pending" | "none" => {
    const active = activeDuels.some(
      (duel) => duel.class_id === classId && (duel.challenger_id === peerId || duel.defender_id === peerId)
    );
    if (active) return "active";

    const pending = pendingDuels.some(
      (duel) => duel.class_id === classId && (duel.challenger_id === peerId || duel.defender_id === peerId)
    );
    if (pending) return "pending";

    return "none";
  };

  const rosterCount = classesAndClassmates.reduce((total, group) => total + group.classmates.length, 0);

  const viewOptions: Array<{
    key: DuelViewKey;
    label: string;
    title: string;
    description: string;
    count: number;
    icon: typeof Swords;
  }> = [
    {
      key: "active",
      label: "Live Battles",
      title: "Active Consistency Duels",
      description: "Logs active learning days during the 7-day duel",
      count: activeDuels.length,
      icon: Swords
    },
    {
      key: "roster",
      label: "Classmates",
      title: "Classroom Roster PvP",
      description: "Select a classmate from your enrolled courses to challenge",
      count: rosterCount,
      icon: Users
    },
    {
      key: "invites",
      label: "Invites",
      title: "Pending Invites",
      description: "Review duel requests and respond before they expire",
      count: pendingDuels.length,
      icon: Inbox
    },
    {
      key: "history",
      label: "History",
      title: "Duel History",
      description: "See your completed, tied, and rejected duel outcomes",
      count: pastDuels.length,
      icon: Trophy
    }
  ];

  const activeView = viewOptions.find((option) => option.key === activeTab) ?? viewOptions[0];
  const ActiveViewIcon = activeView.icon;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-10 w-full rounded-lg bg-slate-200/50 dark:bg-slate-800/80" />
        <div className="h-[250px] w-full rounded-[2rem] bg-slate-200/50 dark:bg-slate-800/80" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:from-slate-900 dark:to-slate-950/80">
        <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative z-10 mb-5 flex flex-col gap-3 border-b border-slate-200/50 pb-4 dark:border-slate-800/50 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ActiveViewIcon className="size-5 text-indigo-500" />
              <h3 className="text-base font-black text-slate-800 dark:text-white">{activeView.title}</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{activeView.description}</p>
          </div>

          <div className="flex items-center justify-end gap-2">
            {activeTab === "active" && (
              <button
                onClick={syncScores}
                className="rounded-xl border border-slate-200/50 bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase text-indigo-600 shadow-sm transition-colors hover:bg-slate-200 dark:border-slate-700/50 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-700"
              >
                Sync Scores
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter duel sections"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span className="hidden sm:inline">{activeView.label}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/95"
              >
                {viewOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <DropdownMenuItem
                      key={option.key}
                      onClick={() => setActiveTab(option.key)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl px-3 py-3",
                        activeTab === option.key && "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black uppercase tracking-[0.14em]">{option.label}</p>
                          <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {option.count}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {activeTab === "active" && (
          <div className="space-y-4">
            {activeDuels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Swords className="mb-3 size-12 animate-pulse text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No active duels at the moment</p>
                <button
                  onClick={() => setActiveTab("roster")}
                  className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700"
                >
                  Challenge a Classmate
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeDuels.map((duel) => {
                  const isChallenger = duel.challenger_id === user?.id;
                  const myScore = isChallenger ? duel.challenger_score : duel.defender_score;
                  const oppScore = isChallenger ? duel.defender_score : duel.challenger_score;
                  const myStreak = isChallenger ? duel.challenger_current_streak : duel.defender_current_streak;
                  const oppStreak = isChallenger ? duel.defender_current_streak : duel.challenger_current_streak;
                  const myName = isChallenger ? duel.challenger_name : duel.defender_name;
                  const oppName = isChallenger ? duel.defender_name : duel.challenger_name;
                  const myAvatar = isChallenger ? duel.challenger_avatar : duel.defender_avatar;
                  const oppAvatar = isChallenger ? duel.defender_avatar : duel.challenger_avatar;
                  const isWinning = myScore > oppScore;
                  const isTied = myScore === oppScore;
                  const timeLeft = duel.expires_at
                    ? formatDistanceToNow(new Date(duel.expires_at), { addSuffix: false })
                    : "7 days";

                  return (
                    <div
                      key={duel.id}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/50 p-5 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="absolute left-4 top-3 rounded-full border border-indigo-200/30 bg-indigo-50 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        {duel.class_name || duel.course_code}
                      </div>

                      <div className="absolute right-4 top-3 flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                        <Clock className="size-3" /> {timeLeft} left
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/40">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="size-12 border-2 border-indigo-200/70 shadow-sm shadow-indigo-500/10">
                            <AvatarImage src={myAvatar ?? undefined} alt={myName ?? "You"} />
                            <AvatarFallback className="bg-indigo-600 font-black text-white">
                              {getInitials(myName, "ME")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">You</p>
                            <h4 className="truncate text-sm font-black text-slate-800 dark:text-white">{myName || "You"}</h4>
                          </div>
                        </div>

                        <div className="shrink-0 rounded-full border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300">
                          VS
                        </div>

                        <div className="flex min-w-0 items-center gap-3">
                          <div className="min-w-0 text-right">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Opponent</p>
                            <h4 className="truncate text-sm font-black text-slate-800 dark:text-white">
                              {oppName || "Opponent"}
                            </h4>
                          </div>
                          <Avatar className="size-12 border-2 border-slate-200/80 shadow-sm">
                            <AvatarImage src={oppAvatar ?? undefined} alt={oppName ?? "Opponent"} />
                            <AvatarFallback className="bg-slate-200 font-black text-slate-700">
                              {getInitials(oppName, "OP")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 border-b border-t border-slate-100 py-3 dark:border-slate-800/80">
                        <div className="border-r border-slate-100 text-center dark:border-slate-800/50">
                          <span className="text-[10px] font-black uppercase text-slate-400">You</span>
                          <div className="mt-0.5 text-xl font-black text-slate-800 dark:text-white">
                            {myScore} <span className="text-xs text-slate-400">days</span>
                          </div>
                          <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] font-bold text-orange-500">
                            <Flame className="size-3 fill-orange-500" /> {myStreak} streak
                          </div>
                        </div>

                        <div className="text-center">
                          <span className="text-[10px] font-black uppercase text-slate-400">Opponent</span>
                          <div className="mt-0.5 text-xl font-black text-slate-800 dark:text-white">
                            {oppScore} <span className="text-xs text-slate-400">days</span>
                          </div>
                          <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] font-bold text-orange-500">
                            <Flame className="size-3 fill-orange-500" /> {oppStreak} streak
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between text-[10px] font-bold">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5",
                            isWinning
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : isTied
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {isWinning ? "Winning" : isTied ? "Tied" : "Defending"}
                        </span>

                        <span className="text-slate-400">Started {format(new Date(duel.started_at || ""), "MMM d")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "roster" && (
          <div className="space-y-5">
            <div className="flex flex-col justify-end gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search classmate..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {classesAndClassmates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-3 size-12 animate-pulse text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">You are not enrolled in any classes.</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Ask your lecturer to invite you to a class to participate in Streak Duels.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classesAndClassmates.map((group) => {
                  const isExpanded = expandedClasses[group.class_id] !== false;
                  const filteredClassmates = group.classmates.filter(
                    (classmate) =>
                      classmate.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      classmate.register_number.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (searchQuery && filteredClassmates.length === 0) return null;

                  return (
                    <div
                      key={group.class_id}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/30 dark:border-slate-800/80 dark:bg-slate-900/10"
                    >
                      <button
                        onClick={() => toggleClass(group.class_id)}
                        className="flex w-full items-center justify-between border-b border-slate-200/40 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-100/50 dark:border-slate-800/40 dark:bg-slate-900/30 dark:hover:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white sm:text-sm">{group.class_name}</h4>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400">{group.course_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800">
                            {filteredClassmates.length} classmate{filteredClassmates.length === 1 ? "" : "s"}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="size-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="divide-y divide-slate-100 bg-white/40 dark:divide-slate-800/50 dark:bg-transparent">
                          {filteredClassmates.length === 0 ? (
                            <p className="p-4 text-center text-xs font-bold text-slate-400">
                              No other students enrolled in this class roster
                            </p>
                          ) : (
                            filteredClassmates.map((classmate) => {
                              const duelStatus = getDuelStatusWithPeer(classmate.student_id, classmate.class_id);

                              return (
                                <div
                                  key={`${classmate.class_id}-${classmate.student_id}`}
                                  className="flex flex-col justify-between gap-3 p-4 transition-all duration-200 hover:bg-slate-50/40 dark:hover:bg-slate-900/20 xs:flex-row xs:items-center"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar className="size-10 border border-slate-200/50 shadow-sm">
                                      <AvatarImage src={classmate.profile_image ?? undefined} alt={classmate.student_name} />
                                      <AvatarFallback className="bg-slate-200 text-xs font-black text-slate-800">
                                        {getInitials(classmate.student_name, "CL")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h5 className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 sm:text-sm">
                                        {classmate.student_name}
                                        {classmate.current_streak && classmate.current_streak > 0 ? (
                                          <span className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1 text-[9px] text-orange-500">
                                            <Flame className="size-2.5 fill-orange-500" /> {classmate.current_streak}
                                          </span>
                                        ) : null}
                                      </h5>
                                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                        ID: {classmate.register_number} • {classmate.email}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    {duelStatus === "active" ? (
                                      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-600 shadow-sm dark:bg-emerald-950/20 dark:text-emerald-400">
                                        Dueling
                                      </span>
                                    ) : duelStatus === "pending" ? (
                                      <span className="inline-flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase text-amber-600 shadow-sm dark:bg-amber-950/20 dark:text-amber-400">
                                        <Clock className="size-3" /> Pending
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => challengeClassmate(classmate.student_id, classmate.class_id)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/25"
                                      >
                                        Duel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "invites" && (
          <div className="space-y-4">
            {pendingDuels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="mb-3 size-12 animate-pulse text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No pending duel invitations</p>
                <p className="mt-0.5 text-xs text-slate-500">Send a battle request to a peer to start competing!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDuels.map((duel) => {
                  const isReceived = duel.defender_id === user?.id;
                  const opponentName = isReceived ? duel.challenger_name : duel.defender_name;
                  const opponentAvatar = isReceived ? duel.challenger_avatar : duel.defender_avatar;
                  const myName = isReceived ? duel.defender_name : duel.challenger_name;
                  const myAvatar = isReceived ? duel.defender_avatar : duel.challenger_avatar;

                  return (
                    <div
                      key={duel.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/50 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          <Avatar className="size-14 border-2 border-white shadow-md dark:border-slate-900">
                            <AvatarImage src={myAvatar ?? undefined} alt={myName ?? "You"} />
                            <AvatarFallback className="bg-indigo-600 text-xs font-black text-white">
                              {getInitials(myName, "ME")}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar className="size-14 border-2 border-white shadow-md dark:border-slate-900">
                            <AvatarImage src={opponentAvatar ?? undefined} alt={opponentName ?? "Opponent"} />
                            <AvatarFallback className="bg-slate-200 text-xs font-black text-slate-800">
                              {getInitials(opponentName, "OP")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {duel.class_name || duel.course_code}
                          </p>
                          <h4 className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white sm:text-sm">
                            {isReceived ? (
                              <span>
                                <strong className="font-extrabold">{opponentName}</strong> has challenged you
                              </span>
                            ) : (
                              <span>
                                Challenged <strong className="font-extrabold">{opponentName}</strong>
                              </span>
                            )}
                          </h4>
                          <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                            Sent {formatDistanceToNow(new Date(duel.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isReceived ? (
                          <>
                            <button
                              onClick={() => declineChallenge(duel.id)}
                              title="Decline Duel"
                              className="flex items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
                            >
                              <X className="size-4" />
                            </button>
                            <button
                              onClick={() => acceptChallenge(duel.id)}
                              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:bg-indigo-700 hover:shadow-indigo-600/25"
                            >
                              <Check className="size-3.5" /> Accept Battle
                            </button>
                          </>
                        ) : (
                          <span className="rounded-full border border-slate-200/50 bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-400 dark:border-slate-700/50 dark:bg-slate-800/80">
                            Waiting for acceptance...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {pastDuels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="mb-3 size-12 animate-pulse text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No duel history yet</p>
                <p className="mt-0.5 text-xs text-slate-500">Your resolved duels will be logged here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastDuels.map((duel) => {
                  const isChallenger = duel.challenger_id === user?.id;
                  const myScore = isChallenger ? duel.challenger_score : duel.defender_score;
                  const oppScore = isChallenger ? duel.defender_score : duel.challenger_score;
                  const myName = isChallenger ? duel.challenger_name : duel.defender_name;
                  const myAvatar = isChallenger ? duel.challenger_avatar : duel.defender_avatar;
                  const opponentName = isChallenger ? duel.defender_name : duel.challenger_name;
                  const opponentAvatar = isChallenger ? duel.defender_avatar : duel.challenger_avatar;

                  if (duel.status === "rejected") {
                    return (
                      <div
                        key={duel.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/40 bg-slate-50/50 p-3.5 text-xs opacity-80 dark:border-slate-800/40 dark:bg-slate-900/10"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex -space-x-2">
                            <Avatar className="size-10 border-2 border-white shadow-sm dark:border-slate-900">
                              <AvatarImage src={myAvatar ?? undefined} alt={myName ?? "You"} />
                              <AvatarFallback className="bg-indigo-600 text-[10px] font-black text-white">
                                {getInitials(myName, "ME")}
                              </AvatarFallback>
                            </Avatar>
                            <Avatar className="size-10 border-2 border-white shadow-sm dark:border-slate-900">
                              <AvatarImage src={opponentAvatar ?? undefined} alt={opponentName ?? "Opponent"} />
                              <AvatarFallback className="bg-slate-200 text-[10px] font-black text-slate-800">
                                {getInitials(opponentName, "OP")}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="font-semibold text-slate-400">
                            Challenge with {opponentName} was rejected or expired.
                          </span>
                        </div>
                        <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[10px] text-slate-400 dark:bg-slate-800">
                          {duel.class_name || duel.course_code}
                        </span>
                      </div>
                    );
                  }

                  const isIWon = duel.winner_id === user?.id;
                  const isTie = duel.winner_id === null;

                  return (
                    <div
                      key={duel.id}
                      className={cn(
                        "flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center",
                        isIWon
                          ? "border-emerald-500/25 bg-emerald-500/5"
                          : isTie
                            ? "border-slate-200 bg-slate-50/20 dark:border-slate-800"
                            : "border-rose-500/25 bg-rose-500/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          <Avatar
                            className={cn(
                              "size-14 border-2 transition-transform duration-300 hover:scale-105 sm:size-16",
                              isIWon ? "border-emerald-500 shadow-sm" : isTie ? "border-slate-300" : "border-rose-400"
                            )}
                          >
                            <AvatarImage src={myAvatar ?? undefined} alt={myName ?? "You"} />
                            <AvatarFallback className="bg-indigo-600 font-black text-white">
                              {getInitials(myName, "ME")}
                            </AvatarFallback>
                          </Avatar>
                          <Avatar
                            className={cn(
                              "size-14 border-2 transition-transform duration-300 hover:scale-105 sm:size-16",
                              isIWon ? "border-emerald-500 shadow-sm" : isTie ? "border-slate-300" : "border-rose-400"
                            )}
                          >
                            <AvatarImage src={opponentAvatar ?? undefined} alt={opponentName ?? "Opponent"} />
                            <AvatarFallback className="bg-slate-200 font-black text-slate-800">
                              {getInitials(opponentName, "OP")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {duel.class_name || duel.course_code}
                          </span>
                          <h4 className="mt-0.5 text-xs font-bold text-slate-800 dark:text-white sm:text-sm">
                            Streak Duel vs <strong className="font-extrabold">{opponentName}</strong>
                          </h4>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                            Score: {myScore} days vs {oppScore} days
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span
                          className={cn(
                            "rounded-xl border px-3 py-1 text-[10px] font-black uppercase shadow-sm",
                            isIWon
                              ? "border-emerald-600 bg-emerald-500 text-white shadow-emerald-500/10"
                              : isTie
                                ? "border-slate-300/40 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                : "border-rose-600 bg-rose-500 text-white shadow-rose-500/10"
                          )}
                        >
                          {isIWon ? "Victory" : isTie ? "Tie" : "Defeat"}
                        </span>

                        <span className="text-[9px] font-semibold text-slate-400">
                          {duel.expires_at ? format(new Date(duel.expires_at), "MMM d, yyyy") : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
