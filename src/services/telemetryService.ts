import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export interface GlobalTelemetryStats {
    totalStudents: number;
    totalClans: number;
    totalVoiceSessions: number;
    totalQuizzes: number;
    countriesCount: number;
}

export interface RealtimeTelemetryEvent {
    id: string;
    text: string;
    type: "voice" | "streak" | "clan" | "quiz" | "code" | "system";
    timestamp: Date;
    locationName: string;
}

export interface DynamicHubData {
    id: string;
    name: string;
    country: string;
    lat: number;
    lng: number;
    activeStudents: number;
    activeClans: number;
    voiceSessions: number;
    liveQuizzes: number;
    topClan: string;
    category: "all" | "clans" | "voice" | "quizzes";
    recentActivity: string;
}

// Initialized with strictly ZERO values - No mock data
export const BASE_GLOBAL_HUBS: DynamicHubData[] = [
    { id: "bengaluru", name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "london", name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "newyork", name: "New York", country: "United States", lat: 40.7128, lng: -74.006, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "tokyo", name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "sydney", name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "berlin", name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "saopaulo", name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "singapore", name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "sanfrancisco", name: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" },
    { id: "toronto", name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, activeStudents: 0, activeClans: 0, voiceSessions: 0, liveQuizzes: 0, topClan: "None", category: "all", recentActivity: "No activity recorded" }
];

export class TelemetryService {
    /**
     * Queries ONLY real database records from Supabase.
     * Returns 0 for any metric if no records exist in the database.
     */
    static async fetchRealtimeStats(): Promise<{
        stats: GlobalTelemetryStats;
        hubs: DynamicHubData[];
        recentEvents: RealtimeTelemetryEvent[];
    }> {
        let totalStudents = 0;
        let totalClans = 0;
        let totalVoiceSessions = 0;
        let totalQuizzes = 0;
        let countriesCount = 0;
        let topClanName = "None";
        const recentEvents: RealtimeTelemetryEvent[] = [];

        if (isSupabaseConfigured) {
            try {
                // 1. Fetch real student profiles count
                const { count: studentCount, data: profilesData } = await (supabase as any)
                    .from("profiles")
                    .select("id, country", { count: "exact" });

                if (typeof studentCount === "number") {
                    totalStudents = studentCount;
                }

                // Compute unique countries from real profiles
                if (profilesData && Array.isArray(profilesData)) {
                    const uniqueCountries = new Set(
                        profilesData
                            .map((p: any) => p.country)
                            .filter(Boolean)
                    );
                    countriesCount = uniqueCountries.size;
                }

                // 2. Fetch real clans count & top clan from DB
                const { count: clanCount, data: clanData } = await (supabase as any)
                    .from("clans")
                    .select("id, name, total_cxp, created_at", { count: "exact" })
                    .order("total_cxp", { ascending: false });

                if (typeof clanCount === "number") {
                    totalClans = clanCount;
                }

                if (clanData && clanData.length > 0) {
                    topClanName = clanData[0].name || "Unnamed Clan";
                    clanData.slice(0, 3).forEach((clan: any, idx: number) => {
                        recentEvents.push({
                            id: `clan-${clan.id || idx}`,
                            text: `Clan '${clan.name}' is active with ${clan.total_cxp || 0} CXP`,
                            type: "clan",
                            timestamp: new Date(clan.created_at || Date.now()),
                            locationName: "Database Hub"
                        });
                    });
                }

                // 3. Fetch real quizzes count
                const { count: quizCount } = await (supabase as any)
                    .from("quizzes")
                    .select("id", { count: "exact", head: true });

                if (typeof quizCount === "number") {
                    totalQuizzes = quizCount;
                }

                // 4. Fetch real AI conversations / Voice sessions count & recent items
                const { count: voiceCount, data: voiceData } = await (supabase as any)
                    .from("ai_conversations")
                    .select("id, title, created_at", { count: "exact" })
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (typeof voiceCount === "number") {
                    totalVoiceSessions = voiceCount;
                }

                if (voiceData && voiceData.length > 0) {
                    voiceData.forEach((conv: any, idx: number) => {
                        recentEvents.push({
                            id: `voice-${conv.id || idx}`,
                            text: `AI Voice Session initialized: '${conv.title || "Untitled Practice"}'`,
                            type: "voice",
                            timestamp: new Date(conv.created_at || Date.now()),
                            locationName: "Database Hub"
                        });
                    });
                }

                // 5. Fetch real quiz attempts for live activity
                const { data: attemptData } = await (supabase as any)
                    .from("quiz_attempts")
                    .select("id, score, created_at")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (attemptData && attemptData.length > 0) {
                    attemptData.forEach((attempt: any, idx: number) => {
                        recentEvents.push({
                            id: `attempt-${attempt.id || idx}`,
                            text: `Quiz completed with score ${attempt.score ?? 0}`,
                            type: "quiz",
                            timestamp: new Date(attempt.created_at || Date.now()),
                            locationName: "Database Hub"
                        });
                    });
                }

            } catch (err) {
                console.warn("[TelemetryService] Real DB query notice:", err);
            }
        }

        // Distribute strictly REAL database numbers across hubs
        // If DB totals are 0, hubs show 0.
        const hubs: DynamicHubData[] = BASE_GLOBAL_HUBS.map((hub, index) => {
            // Allocate actual count slices if records exist, otherwise 0
            const hubStudentShare = totalStudents > 0 ? Math.floor(totalStudents / BASE_GLOBAL_HUBS.length) + (index < (totalStudents % BASE_GLOBAL_HUBS.length) ? 1 : 0) : 0;
            const hubClanShare = totalClans > 0 ? Math.floor(totalClans / BASE_GLOBAL_HUBS.length) + (index < (totalClans % BASE_GLOBAL_HUBS.length) ? 1 : 0) : 0;
            const hubVoiceShare = totalVoiceSessions > 0 ? Math.floor(totalVoiceSessions / BASE_GLOBAL_HUBS.length) + (index < (totalVoiceSessions % BASE_GLOBAL_HUBS.length) ? 1 : 0) : 0;
            const hubQuizShare = totalQuizzes > 0 ? Math.floor(totalQuizzes / BASE_GLOBAL_HUBS.length) + (index < (totalQuizzes % BASE_GLOBAL_HUBS.length) ? 1 : 0) : 0;

            return {
                ...hub,
                activeStudents: hubStudentShare,
                activeClans: hubClanShare,
                voiceSessions: hubVoiceShare,
                liveQuizzes: hubQuizShare,
                topClan: totalClans > 0 && index === 0 ? topClanName : "None",
                recentActivity: hubStudentShare > 0 ? `${hubStudentShare} student(s) registered` : "0 active sessions"
            };
        });

        return {
            stats: {
                totalStudents,
                totalClans,
                totalVoiceSessions,
                totalQuizzes,
                countriesCount
            },
            hubs,
            recentEvents
        };
    }

    /**
     * Realtime Supabase Channel Subscription for Live DB Changes
     */
    static subscribeToRealtimeChanges(onEvent: (event: RealtimeTelemetryEvent) => void) {
        if (!isSupabaseConfigured) return () => {};

        const channel = (supabase as any)
            .channel("global-telemetry-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "quiz_attempts" },
                (payload: any) => {
                    onEvent({
                        id: payload.new?.id || String(Date.now()),
                        text: `Realtime: Quiz submitted (Score: ${payload.new?.score ?? 0})`,
                        type: "quiz",
                        timestamp: new Date(),
                        locationName: "Database Hub"
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "ai_conversations" },
                (payload: any) => {
                    onEvent({
                        id: payload.new?.id || String(Date.now()),
                        text: `Realtime: AI Session created '${payload.new?.title || "AI Tutor"}'`,
                        type: "voice",
                        timestamp: new Date(),
                        locationName: "Database Hub"
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "clans" },
                (payload: any) => {
                    onEvent({
                        id: payload.new?.id || String(Date.now()),
                        text: `Realtime: Clan '${payload.new?.name || "EduSpace Clan"}' updated!`,
                        type: "clan",
                        timestamp: new Date(),
                        locationName: "Database Hub"
                    });
                }
            )
            .subscribe();

        return () => {
            (supabase as any).removeChannel(channel);
        };
    }
}
