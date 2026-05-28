import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ClanService } from "@/services/clanService";
import { BannerStyle } from "@/types/clans";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useClans(classId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch current user's clan membership
  const { data: myClanData = null, isLoading: isMyClanLoading } = useQuery({
    queryKey: ["myClan", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return ClanService.fetchMyClan(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3, // Cache membership for 3 mins
  });

  const myClan = myClanData?.clan || null;
  const myMembership = myClanData?.membership || null;

  // 2. Fetch list of all clans in the selected classroom
  const { data: clans = [], isLoading: isClansLoading } = useQuery({
    queryKey: ["clansList", classId],
    queryFn: async () => {
      if (!classId) return [];
      return ClanService.fetchClans(classId);
    },
    enabled: !!classId,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch clan members
  const { data: clanMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["clanMembers", myClan?.id],
    queryFn: async () => {
      if (!myClan?.id) return [];
      return ClanService.fetchClanMembers(myClan.id);
    },
    enabled: !!myClan?.id,
    staleTime: 1000 * 60 * 5,
  });

  // 4. Fetch active weekly guild battle
  const { data: activeBattle = null, isLoading: isBattleLoading } = useQuery({
    queryKey: ["clanBattle", classId, myClan?.id],
    queryFn: async () => {
      if (!classId || !myClan?.id) return null;
      return ClanService.fetchActiveBattle(classId, myClan.id);
    },
    enabled: !!classId && !!myClan?.id,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = isMyClanLoading || isClansLoading || isMembersLoading || isBattleLoading;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["myClan", user?.id] });
    if (classId) {
      queryClient.invalidateQueries({ queryKey: ["clansList", classId] });
      if (myClan?.id) {
        queryClient.invalidateQueries({ queryKey: ["clanBattle", classId, myClan.id] });
      }
    }
    if (myClan?.id) {
      queryClient.invalidateQueries({ queryKey: ["clanMembers", myClan.id] });
    }
  };

  // 5. Subscribe to real-time updates for clans
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`clans_realtime_sync_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clans"
        },
        () => {
          invalidateAll();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clan_members"
        },
        () => {
          invalidateAll();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clan_battles"
        },
        () => {
          invalidateAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, classId, myClan?.id]);

  // Mutations
  const createClanMutation = useMutation({
    mutationFn: async ({ name, tag, banner }: { name: string; tag: string; banner: BannerStyle }) => {
      if (!user?.id || !classId) throw new Error("Missing credentials or classroom context");
      return ClanService.createClan(name, tag, classId, user.id, banner);
    },
    onSuccess: (data) => {
      if (data) {
        toast.success("🏆 Clan Founded!", {
          description: `"${data.clan.name}" [${data.clan.tag}] has been established. Form your legacy!`
        });
        invalidateAll();
      } else {
        toast.error("Disband existing clan first.");
      }
    },
    onError: () => {
      toast.error("Failed to establish clan.");
    }
  });

  const joinClanMutation = useMutation({
    mutationFn: async (clanId: string) => {
      if (!user?.id) throw new Error("No user ID");
      return ClanService.joinClan(clanId, user.id);
    },
    onSuccess: (member) => {
      if (member) {
        toast.success("🛡️ Joined Clan!", {
          description: "Welcome to the family. Pool your activity to raise the guild!"
        });
        invalidateAll();
      } else {
        toast.error("Could not join clan.");
      }
    },
    onError: () => {
      toast.error("Failed to join clan.");
    }
  });

  const leaveClanMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !myClan?.id || !myMembership?.role) throw new Error("Clan context missing");
      return ClanService.leaveClan(myClan.id, user.id, myMembership.role);
    },
    onSuccess: (success) => {
      if (success) {
        toast.info("Clan Left", {
          description: myMembership?.role === "leader" 
            ? "The clan was disbanded because the leader left." 
            : "You have departed the clan."
        });
        invalidateAll();
      } else {
        toast.error("Failed to depart clan.");
      }
    },
    onError: () => {
      toast.error("Failed to depart clan.");
    }
  });

  const updateBannerMutation = useMutation({
    mutationFn: async (banner: BannerStyle) => {
      if (!myClan?.id) throw new Error("Missing clan context");
      return ClanService.updateBanner(myClan.id, banner);
    },
    onSuccess: (success) => {
      if (success) {
        toast.success("🎨 Banner Modified!", {
          description: "Your house banner has been visualised."
        });
        invalidateAll();
      } else {
        toast.error("Banner change rejected.");
      }
    },
    onError: () => {
      toast.error("Failed to update banner.");
    }
  });

  return {
    clans,
    myClan,
    myMembership,
    clanMembers,
    activeBattle,
    isLoading,
    createClan: async (name: string, tag: string, banner: BannerStyle) => {
      createClanMutation.mutate({ name, tag, banner });
      return true;
    },
    joinClan: async (clanId: string) => {
      joinClanMutation.mutate(clanId);
      return true;
    },
    leaveClan: async () => {
      leaveClanMutation.mutate();
      return true;
    },
    updateBanner: async (banner: BannerStyle) => {
      updateBannerMutation.mutate(banner);
      return true;
    },
    refresh: () => {
      invalidateAll();
    }
  };
}
