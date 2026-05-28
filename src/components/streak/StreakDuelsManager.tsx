import React, { useState, useEffect } from "react";
import { format } from "date-fns";
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
  X,
  Sparkles,
  Award,
  Shield,
  Briefcase,
  Play,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStreakDuels } from "@/hooks/useStreakDuels";
import { useClans } from "@/hooks/useClans";
import { useStreak } from "@/contexts/StreakContext";
import { BADGE_DETAILS, BadgeType } from "@/services/streakService";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// Custom Subcomponents
// import { DuelistProgressCard } from "./DuelistProgressCard";
import { RanksPodium } from "./RanksPodium";
import { AchievementBadgesCard } from "./AchievementBadgesCard";
import { ClanHub } from "@/components/clans/ClanHub";
import { ClanLeaderboard } from "@/components/clans/ClanLeaderboard";
import { ArenaLeaderboard } from "./ArenaLeaderboard";

type DuelViewKey = "active" | "roster" | "invites" | "history";

export function StreakDuelsManager() {
  const { user } = useAuth();
  const { streak, badges } = useStreak();
  
  // 1. Existing Individual PvP state hooks
  const {
    activeDuels,
    pendingDuels,
    pastDuels,
    classesAndClassmates,
    isLoading: isDuelsLoading,
    challengeClassmate,
    acceptChallenge,
    declineChallenge,
    syncScores
  } = useStreakDuels();

  // 2. Classroom Clans active context queries
  const [classes, setClasses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isClassesLoading, setIsClassesLoading] = useState(true);

  // Unguilded form states inside tab
  const [clanName, setClanName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [bannerStyle, setBannerStyle] = useState<any>({
    bgColor: "cosmos",
    icon: "shield",
    pattern: "stars",
    borderColor: "solid"
  });

  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from("class_students")
          .select(`
            class_id,
            classes (
              id,
              class_name,
              course_code
            )
          `)
          .eq("student_id", user.id);

        const formatted = (data || [])
          .map((e: any) => ({
            id: e.class_id,
            name: e.classes?.class_name || "Untitled Class",
            code: e.classes?.course_code || "N/A"
          }))
          .filter(Boolean);

        setClasses(formatted);
        if (formatted.length > 0) {
          setSelectedClassId(formatted[0].id);
        }
      } catch (err) {
        console.error("Failed to load classes for duels clans:", err);
      } finally {
        setIsClassesLoading(false);
      }
    };
    fetchMyClasses();
  }, [user?.id]);

  // Hook for clans actions
  const {
    clans,
    myClan,
    myMembership,
    clanMembers,
    isLoading: isClansLoading,
    createClan,
    joinClan,
    leaveClan,
    updateBanner
  } = useClans(selectedClassId);

  // Tab selections
  const [arenaMode, setArenaMode] = useState<"1v1" | "leaderboard">("1v1");
  const [activeTab, setActiveTab] = useState<DuelViewKey>("active");
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const triggerConfetti = (type: 'victory' | 'tie') => {
    if (type === 'victory') {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 1000 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 40 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 200);
    } else {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a855f7', '#6366f1', '#cbd5e1']
      });
    }
  };

  const getInitials = (name?: string, fallback = "DU") =>
    (name || fallback)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const toggleClass = (classId: string) => {
    setExpandedClasses((prev) => ({ ...prev, [classId]: !prev[classId] }));
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
    icon: any;
  }> = [
    {
      key: "active",
      label: "Live Battles",
      title: "Active 1v1 Duels",
      description: "Daily streak logging duel progression",
      count: activeDuels.length,
      icon: Swords
    },
    {
      key: "roster",
      label: "Classmates",
      title: "Class Roster PvP",
      description: "Challenge a student in your enrolled classes",
      count: rosterCount,
      icon: Users
    },
    {
      key: "invites",
      label: "Invites",
      title: "Duel Invitations",
      description: "Review pending challenges from your peers",
      count: pendingDuels.length,
      icon: Inbox
    },
    {
      key: "history",
      label: "History",
      title: "PvP History Logs",
      description: "Outcome records of previous battles",
      count: pastDuels.length,
      icon: Trophy
    }
  ];

  const activeView = viewOptions.find((option) => option.key === activeTab) ?? viewOptions[0];
  const ActiveViewIcon = activeView.icon;

  const currentStreakVal = streak?.current_streak || 0;
  const totalDaysVal = streak?.total_days || 0;

  const handleCreateClanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clanName.trim() || !clanTag.trim()) return;
    createClan(clanName, clanTag, bannerStyle);
    setClanName("");
    setClanTag("");
  };

  if (isDuelsLoading || isClassesLoading) {
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <div className="h-44 w-full rounded-[2.5rem] bg-slate-200/50 dark:bg-slate-800/80" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-[400px] rounded-[2.5rem] bg-slate-200/50 dark:bg-slate-800/80" />
          <div className="xl:col-span-1 h-[400px] rounded-[2.5rem] bg-slate-200/50 dark:bg-slate-800/80" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">

      {/* 2. Main Switcher Tabs matching design */}
      <div className="flex justify-start pt-1 select-none">
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner relative">
          {[
            { id: "1v1", label: "1v1 Battles" },
            { id: "leaderboard", label: "Leaderboard" }
          ].map((mode) => {
            const isActive = arenaMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setArenaMode(mode.id as "1v1" | "leaderboard")}
                className={cn(
                  "relative px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 z-10 active:scale-95",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Arena Content */}
      {arenaMode === "leaderboard" ? (
        <ArenaLeaderboard classmates={classesAndClassmates[0]?.classmates || []} pastDuels={pastDuels} />
      ) : (
        <>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          
          {/* Left Column (xl:col-span-2) */}
          <div className="xl:col-span-2 space-y-6 flex flex-col justify-between">
            
            {/* Live Duels / Groups Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 w-full flex-1 flex flex-col justify-between">
              <div className="absolute -top-24 -left-24 size-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full justify-between space-y-5">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Swords className="size-4 text-indigo-500" />
                    Live Duels Workspace
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    Participate in daily learning wars
                  </p>
                </div>
              </div>

              {/* Toggle Content rendering */}
              <div className="flex-1 flex flex-col h-full justify-between">
                  <div className="space-y-5">
                    
                    {/* Action controllers */}
                    <div className="flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-200/10">
                      <div className="flex items-center gap-2">
                        <ActiveViewIcon className="size-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {activeView.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeTab === "active" && (
                          <button
                            onClick={syncScores}
                            className="rounded-xl border border-slate-200/50 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 shadow-sm transition-colors hover:bg-slate-100"
                          >
                            Sync Scores
                          </button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white dark:bg-slate-950 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50">
                              <SlidersHorizontal className="size-3" />
                              <span>{activeView.label}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                            {viewOptions.map((opt) => (
                              <DropdownMenuItem
                                key={opt.key}
                                onClick={() => setActiveTab(opt.key)}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-[10px] font-black uppercase tracking-wider",
                                  activeTab === opt.key && "bg-indigo-500/10 text-indigo-500"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <opt.icon className="size-3.5" />
                                  <span>{opt.label}</span>
                                </div>
                                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px]">
                                  {opt.count}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Active battles list */}
                    {activeTab === "active" && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {activeDuels.length === 0 ? (
                          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                            <Swords className="mb-2 size-10 animate-pulse text-slate-300 dark:text-slate-700" />
                            <p className="text-xs font-bold text-slate-500">No active duels currently</p>
                            <button
                              onClick={() => setActiveTab("roster")}
                              className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-[10px] font-black text-white uppercase tracking-wider shadow-md hover:bg-indigo-700 active:scale-95"
                            >
                              Challenge Classmate
                            </button>
                          </div>
                        ) : (
                          activeDuels.map((duel) => {
                            const isChallenger = duel.challenger_id === user?.id;
                            const myScore = isChallenger ? duel.challenger_score : duel.defender_score;
                            const oppScore = isChallenger ? duel.defender_score : duel.challenger_score;
                            const myStreak = isChallenger ? duel.challenger_current_streak : duel.defender_current_streak;
                            const oppStreak = isChallenger ? duel.defender_current_streak : duel.challenger_current_streak;
                            const myName = isChallenger ? duel.challenger_name : duel.defender_name;
                            const oppName = isChallenger ? duel.defender_name : duel.challenger_name;
                            const isWinning = myScore > oppScore;
                            const isTied = myScore === oppScore;

                            return (
                              <div key={duel.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3 shadow-sm select-none">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] font-black uppercase text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                                    {duel.class_name || duel.course_code}
                                  </span>
                                  <span className="text-[8px] font-bold text-slate-400">
                                    Started {format(new Date(duel.started_at || ""), "MMM d")}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-2">
                                  <div className="min-w-0">
                                    <h5 className="truncate text-xs font-black text-slate-800 dark:text-white">{oppName}</h5>
                                    <p className="text-[9px] font-bold text-orange-500 flex items-center gap-0.5 mt-0.5">
                                      <Flame className="size-3 fill-orange-500" /> {oppStreak} streak
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                      {myScore} <span className="text-[9px] text-slate-400">vs</span> {oppScore}
                                    </span>
                                    <span className={cn(
                                      "block text-[8px] font-black uppercase mt-0.5",
                                      isWinning ? "text-emerald-500" : isTied ? "text-indigo-500" : "text-rose-500"
                                    )}>
                                      {isWinning ? "Winning" : isTied ? "Tied" : "Trailing"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Classmate roster listings */}
                    {activeTab === "roster" && (
                      <div className="space-y-4">
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search classmate..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900 dark:text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                          {classesAndClassmates.map((group) => {
                            const isExpanded = expandedClasses[group.class_id] !== false;
                            const filtered = group.classmates.filter(
                              (c) =>
                                c.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.register_number.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (searchQuery && filtered.length === 0) return null;

                            return (
                              <div key={group.class_id} className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white/20 overflow-hidden">
                                <button
                                  onClick={() => toggleClass(group.class_id)}
                                  className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950/20 py-2 px-3 border-b border-slate-100 dark:border-slate-850"
                                >
                                  <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">
                                    {group.class_name} [{group.course_code}]
                                  </span>
                                  {isExpanded ? <ChevronDown className="size-3 text-slate-400" /> : <ChevronRight className="size-3 text-slate-400" />}
                                </button>

                                {isExpanded && (
                                  <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                    {filtered.map((classmate) => {
                                      const duelStatus = getDuelStatusWithPeer(classmate.student_id, classmate.class_id);

                                      return (
                                        <div key={`${classmate.class_id}-${classmate.student_id}`} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                              <AvatarImage src={classmate.profile_image} />
                                              <AvatarFallback className="bg-indigo-600 text-white font-black text-[9px]">
                                                {getInitials(classmate.student_name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">{classmate.student_name}</h5>
                                              <p className="text-[8px] font-bold text-slate-400">Reg: {classmate.register_number}</p>
                                            </div>
                                          </div>

                                          <div>
                                            {duelStatus === "active" ? (
                                              <span className="inline-flex items-center rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[8px] font-black uppercase text-emerald-600">
                                                Dueling
                                              </span>
                                            ) : duelStatus === "pending" ? (
                                              <span className="inline-flex items-center rounded-xl bg-amber-500/10 px-3 py-1.5 text-[8px] font-black uppercase text-amber-600">
                                                Pending
                                              </span>
                                            ) : (
                                              <button
                                                onClick={() => challengeClassmate(classmate.student_id, classmate.class_id)}
                                                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-[9px] font-black text-white uppercase tracking-wider active:scale-95"
                                              >
                                                Duel
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pending Invites */}
                    {activeTab === "invites" && (
                      <div className="space-y-3">
                        {pendingDuels.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Inbox className="mb-2 size-10 animate-pulse text-slate-300" />
                            <p className="text-xs font-bold text-slate-500">No pending duel invitations</p>
                          </div>
                        ) : (
                          pendingDuels.map((duel) => {
                            const isReceived = duel.defender_id === user?.id;
                            const opponentName = isReceived ? duel.challenger_name : duel.defender_name;
                            const opponentAvatar = isReceived ? duel.challenger_avatar : duel.defender_avatar;

                            return (
                              <div key={duel.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-9">
                                    <AvatarImage src={opponentAvatar} />
                                    <AvatarFallback className="bg-indigo-600 text-white font-black text-[9px]">
                                      {getInitials(opponentName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest block">
                                      {duel.class_name || duel.course_code}
                                    </span>
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                      {isReceived ? `${opponentName} challenged you` : `Challenged ${opponentName}`}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isReceived ? (
                                    <>
                                      <button
                                        onClick={() => declineChallenge(duel.id)}
                                        className="size-7 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center border border-rose-500/20 active:scale-95"
                                      >
                                        <X className="size-4" />
                                      </button>
                                      <button
                                        onClick={() => acceptChallenge(duel.id)}
                                        className="size-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95"
                                      >
                                        <Check className="size-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* History logs */}
                    {activeTab === "history" && (
                      <div className="space-y-3">
                        {pastDuels.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Trophy className="mb-2 size-10 animate-pulse text-slate-300" />
                            <p className="text-xs font-bold text-slate-500">No previous outcomes found</p>
                          </div>
                        ) : (
                          pastDuels.map((duel) => {
                            const isChallenger = duel.challenger_id === user?.id;
                            const myScore = isChallenger ? duel.challenger_score : duel.defender_score;
                            const oppScore = isChallenger ? duel.defender_score : duel.challenger_score;
                            const opponentName = isChallenger ? duel.defender_name : duel.challenger_name;

                            if (duel.status === "rejected") {
                              return (
                                <div key={duel.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl opacity-60 text-xs font-bold text-slate-500">
                                  Challenge with {opponentName} was rejected or expired.
                                </div>
                              );
                            }

                            const isIWon = duel.winner_id === user?.id;
                            const isTie = duel.winner_id === null;

                            return (
                              <div
                                key={duel.id}
                                className={cn(
                                  "flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-shadow",
                                  isIWon ? "border-emerald-500/25 bg-emerald-500/5" : isTie ? "border-slate-200 bg-slate-50/10" : "border-rose-500/25 bg-rose-500/5"
                                )}
                                onClick={() => {
                                  if (isIWon) triggerConfetti("victory");
                                  else if (isTie) triggerConfetti("tie");
                                }}
                              >
                                <div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                    Duel vs {opponentName} {isIWon && "⭐"}
                                  </h4>
                                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                                    Score: {myScore} vs {oppScore} days
                                  </p>
                                </div>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border shadow-sm",
                                  isIWon ? "bg-emerald-500 border-emerald-600 text-white" : isTie ? "bg-slate-200 border-slate-300 text-slate-700" : "bg-rose-500 border-rose-600 text-white"
                                )}>
                                  {isIWon ? "Victory" : isTie ? "Tie" : "Defeat"}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                  </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (xl:col-span-1) - Side Panels */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Climb the Ranks Sidebar */}
          <RanksPodium 
            classmates={classesAndClassmates[0]?.classmates || []} 
            userStreak={currentStreakVal} 
            onViewLeaderboard={() => setArenaMode("leaderboard")} 
          />

        </div>

      </div>

      {/* Full-width Achievement Badges Area */}
      <div className="mt-2">
        <AchievementBadgesCard 
          currentStreak={currentStreakVal} 
          wonDuelsCount={pastDuels.filter(d => d.winner_id === user?.id).length} 
        />
      </div>
      </>
      )}

    </div>
  );
}
