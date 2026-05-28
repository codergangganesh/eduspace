import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClanHub } from "@/components/clans/ClanHub";
import { ClanLeaderboard } from "@/components/clans/ClanLeaderboard";
import { BannerBuilderModal } from "@/components/clans/BannerBuilderModal";
import { useClans } from "@/hooks/useClans";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Sparkles, BookOpen, Swords, Plus, UserPlus, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BannerStyle } from "@/types/clans";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

export default function ClansPage() {
  const { user } = useAuth();
  
  // Class enrollments management
  const [classes, setClasses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isClassesLoading, setIsClassesLoading] = useState(true);

  // Unguilded States
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [clanName, setClanName] = useState("");
  const [clanTag, setClanTag] = useState("");
  const [bannerStyle, setBannerStyle] = useState<BannerStyle>({
    bgColor: "cosmos",
    icon: "shield",
    pattern: "stars",
    borderColor: "solid"
  });
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  // Retrieve enrolled classes
  useEffect(() => {
    const fetchMyClasses = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
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

        if (error) throw error;

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
        console.error("Failed to load enrolled classes for clans:", err);
      } finally {
        setIsClassesLoading(false);
      }
    };
    fetchMyClasses();
  }, [user?.id]);

  // Hook for clans management
  const {
    clans,
    myClan,
    myMembership,
    clanMembers,
    isLoading,
    createClan,
    joinClan,
    leaveClan,
    updateBanner
  } = useClans(selectedClassId);

  const handleCreateClanSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!clanName.trim() || !clanTag.trim()) return;
    createClan(clanName, clanTag, bannerStyle);
    
    // Reset form
    setClanName("");
    setClanTag("");
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  if (isClassesLoading) {
    return (
      <DashboardLayout fullHeight>
        <div className="h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/20">
          <Loader2 className="size-8 text-indigo-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      fullHeight
      actions={
        <SEO
          title="Classroom Guilds | Eduspace"
          description="Form collaborative Clans within your courses, earn CXP through daily consistency, and engage in weekly PvP battles against rival classroom guilds."
        />
      }
    >
      <div className="h-full flex flex-col bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header & Classroom Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Shield className="size-8 text-indigo-500 animate-pulse" />
                Classroom <span className="text-primary italic">Guilds</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                Unite with classmates to compete in weekly consistency wars.
              </p>
            </div>

            {/* Select classroom dropdown */}
            {classes.length > 0 && (
              <div className="relative shrink-0">
                <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 rounded-xl py-1 px-3 flex items-center gap-2 shadow-sm">
                  <BookOpen className="size-4 text-indigo-500" />
                  <select
                    value={selectedClassId || ""}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-transparent text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer py-1.5"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} [{cls.code}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1C1F26] border border-slate-100 dark:border-white/5 rounded-[2.5rem]">
              <BookOpen className="size-16 text-slate-300 dark:text-slate-700 animate-pulse mb-4" />
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">No Enrolled Courses</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1">
                You must be enrolled in at least one active class to create or participate in Classroom Clans.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 text-indigo-500 animate-spin" />
            </div>
          ) : myClan ? (
            /* Student has a Clan: Render Clan Hub Dashboard */
            <ClanHub
              clan={myClan}
              membership={myMembership!}
              members={clanMembers}
              classId={selectedClassId!}
              onLeaveClan={leaveClan}
              onUpdateBanner={updateBanner}
            />
          ) : (
            /* Student does NOT have a Clan: Renders Join or Create tabs */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Tab Selector Left/Top (1 Column) */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-[#1C1F26] border border-slate-100 dark:border-white/5 p-4 rounded-[2rem] shadow-xl space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select House Action</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setActiveTab("join")}
                      className={cn(
                        "w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider text-left flex items-center gap-3 transition-all active:scale-95",
                        activeTab === "join"
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <UserPlus className="size-4" />
                      <span>Join Classroom Clan</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("create")}
                      className={cn(
                        "w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider text-left flex items-center gap-3 transition-all active:scale-95",
                        activeTab === "create"
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-500 dark:bg-slate-900/40 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <Plus className="size-4" />
                      <span>Establish New Clan</span>
                    </button>
                  </div>
                </div>

                {/* Insight widget */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-[2rem] text-white space-y-4 shadow-xl border border-white/5 relative overflow-hidden hidden lg:block">
                  <div className="absolute -top-10 -right-10 size-24 rounded-full bg-white/5 blur-xl" />
                  <Sparkles className="size-6 text-yellow-400 animate-pulse" />
                  <h4 className="text-sm font-black uppercase tracking-wider">Weekly PvP War starts soon!</h4>
                  <p className="text-[11px] text-indigo-200/90 leading-relaxed font-semibold">
                    Unite with teammates in this classroom. Matchmaking triggers every Monday. Ensure your clan has at least 2 members to be paired!
                  </p>
                </div>
              </div>

              {/* Main Panel Content Right (2 Columns) */}
              <div className="lg:col-span-2">
                {activeTab === "join" ? (
                  <div className="bg-white dark:bg-[#1C1F26] border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        Classroom Rankings
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Active clans in {selectedClass?.name}</p>
                    </div>

                    <ClanLeaderboard
                      clans={clans}
                      onJoinClan={joinClan}
                      isJoined={false}
                    />
                  </div>
                ) : (
                  /* Create Clan Form */
                  <div className="bg-white dark:bg-[#1C1F26] border border-slate-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        Establish New Clan
                      </h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Set your house banners and details</p>
                    </div>

                    <form onSubmit={handleCreateClanSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Form Details */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">House Name</label>
                            <Input
                              type="text"
                              placeholder="e.g. ByteForce"
                              value={clanName}
                              onChange={(e) => setClanName(e.target.value)}
                              className="rounded-xl border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-black uppercase focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clan Tag (2-4 chars)</label>
                            <Input
                              type="text"
                              placeholder="e.g. BYTE"
                              maxLength={4}
                              value={clanTag}
                              onChange={(e) => setClanTag(e.target.value.toUpperCase())}
                              className="rounded-xl border-slate-200 bg-slate-50 py-2.5 px-4 text-xs font-black uppercase focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-600/10 active:scale-95"
                        >
                          Found Clan
                        </Button>
                      </div>

                      {/* Banner Customization Core Preview */}
                      <div
                        onClick={() => setIsBannerModalOpen(true)}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 cursor-pointer transition-all hover:scale-101 min-h-[220px]"
                      >
                        <div className="size-20 bg-white dark:bg-slate-900 shadow-md rounded-2xl flex items-center justify-center border-2 border-indigo-500/20 rotate-6 hover:rotate-0 transition-transform">
                          <Shield className="size-10 text-indigo-500 animate-pulse" />
                        </div>
                        <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                          Configure Crest Banner
                        </span>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-center max-w-[150px] mt-1">
                          Tap to select custom icons, linear gradients, and neon borders
                        </p>
                      </div>

                    </form>

                    {/* Banner Builder Popup */}
                    <BannerBuilderModal
                      isOpen={isBannerModalOpen}
                      onClose={() => setIsBannerModalOpen(false)}
                      onSave={setBannerStyle}
                      initialBanner={bannerStyle}
                    />
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
