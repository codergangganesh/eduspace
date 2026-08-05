import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import createGlobe from "cobe";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Mic,
    Trophy,
    Play,
    Pause,
    RotateCcw,
    MapPin,
    Activity,
    Shield,
    Globe as GlobeIcon,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    TelemetryService,
    DynamicHubData,
    GlobalTelemetryStats,
    BASE_GLOBAL_HUBS
} from "@/services/telemetryService";

export type GlobeCategory = "all" | "clans" | "voice" | "quizzes";

interface GlobalStudentGlobeProps {
    className?: string;
    showStatsHeader?: boolean;
}

export function GlobalStudentGlobe({
    className = "",
    showStatsHeader = true
}: GlobalStudentGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
    const dragOffset = useRef({ phi: 0, theta: 0 });
    const phiOffsetRef = useRef(0);
    const thetaOffsetRef = useRef(0);

    const [isSpinning, setIsSpinning] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<GlobeCategory>("all");
    const [hubs, setHubs] = useState<DynamicHubData[]>(BASE_GLOBAL_HUBS);
    const [selectedHub, setSelectedHub] = useState<DynamicHubData | null>(BASE_GLOBAL_HUBS[0]);

    // 100% Real Database Stats - Defaults to 0
    const [stats, setStats] = useState<GlobalTelemetryStats>({
        totalStudents: 0,
        totalClans: 0,
        totalVoiceSessions: 0,
        totalQuizzes: 0,
        countriesCount: 0
    });

    const [isLoading, setIsLoading] = useState(true);

    // Fetch real live Supabase telemetry records
    const loadRealtimeTelemetry = useCallback(async () => {
        setIsLoading(true);
        try {
            const { stats: fetchedStats, hubs: fetchedHubs } = await TelemetryService.fetchRealtimeStats();
            setStats(fetchedStats);
            setHubs(fetchedHubs);
            if (fetchedHubs.length > 0) {
                setSelectedHub(fetchedHubs[0]);
            }
        } catch (err) {
            console.error("[GlobalStudentGlobe] Real DB telemetry load error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRealtimeTelemetry();
    }, [loadRealtimeTelemetry]);

    // Filter hubs based on selected category
    const filteredHubs = useMemo(() => {
        if (selectedCategory === "all") return hubs;
        return hubs.filter(h => h.category === selectedCategory || h.category === "all");
    }, [hubs, selectedCategory]);

    // Pointer drag handlers
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        pointerInteracting.current = { x: e.clientX, y: e.clientY };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    }, []);

    const handlePointerUp = useCallback(() => {
        if (pointerInteracting.current !== null) {
            phiOffsetRef.current += dragOffset.current.phi;
            thetaOffsetRef.current += dragOffset.current.theta;
            dragOffset.current = { phi: 0, theta: 0 };
        }
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    }, []);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (pointerInteracting.current !== null) {
                dragOffset.current = {
                    phi: (e.clientX - pointerInteracting.current.x) / 250,
                    theta: (e.clientY - pointerInteracting.current.y) / 800,
                };
            }
        };
        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerup", handlePointerUp, { passive: true });
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [handlePointerUp]);

    // Cobe Globe Initialization
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        let globe: ReturnType<typeof createGlobe> | null = null;
        let phi = 0;

        const markersConfig = filteredHubs.map(h => ({
            location: [h.lat, h.lng] as [number, number],
            size: selectedHub?.id === h.id ? 0.07 : 0.04,
        }));

        function initGlobe() {
            const width = canvas.offsetWidth;
            if (width === 0 || globe) return;

            globe = createGlobe(canvas, {
                devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                width,
                height: width,
                phi: 0,
                theta: 0.15,
                dark: 1,
                diffuse: 1.4,
                mapSamples: 16000,
                mapBrightness: 8,
                baseColor: [0.15, 0.23, 0.42],
                markerColor: [0.25, 0.85, 0.98],
                glowColor: [0.1, 0.35, 0.75],
                markers: markersConfig,
                opacity: 0.95,
                onRender: (state) => {
                    if (isSpinning && pointerInteracting.current === null) {
                        phi += 0.003;
                    }
                    state.phi = phi + phiOffsetRef.current + dragOffset.current.phi;
                    state.theta = 0.15 + thetaOffsetRef.current + dragOffset.current.theta;
                }
            });

            setTimeout(() => canvas && (canvas.style.opacity = "1"), 100);
        }

        if (canvas.offsetWidth > 0) {
            initGlobe();
        } else {
            const ro = new ResizeObserver((entries) => {
                if (entries[0]?.contentRect.width > 0) {
                    ro.disconnect();
                    initGlobe();
                }
            });
            ro.observe(canvas);
        }

        return () => {
            if (globe) globe.destroy();
        };
    }, [filteredHubs, isSpinning, selectedHub]);

    const resetGlobeView = () => {
        phiOffsetRef.current = 0;
        thetaOffsetRef.current = 0;
        dragOffset.current = { phi: 0, theta: 0 };
    };

    return (
        <div className={`relative flex flex-col items-center select-none w-full max-w-6xl mx-auto ${className}`}>
            {/* Header & Category Filter Controls */}
            {showStatsHeader && (
                <div className="w-full space-y-6 mb-4">
                    {/* Live Metric Counters */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-blue-500/5"
                        >
                            <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <div className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                                    {stats.totalStudents.toLocaleString()}
                                </div>
                                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                    <span className={`size-1.5 rounded-full ${stats.totalStudents > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                                    Registered Students
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-purple-500/5"
                        >
                            <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                <Shield className="size-5" />
                            </div>
                            <div>
                                <div className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                    {stats.totalClans}
                                </div>
                                <div className="text-xs font-semibold text-slate-400">Created Clans</div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/5"
                        >
                            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <Mic className="size-5" />
                            </div>
                            <div>
                                <div className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                    {stats.totalVoiceSessions}
                                </div>
                                <div className="text-xs font-semibold text-slate-400">AI Voice Sessions</div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-amber-500/5"
                        >
                            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                                <GlobeIcon className="size-5" />
                            </div>
                            <div>
                                <div className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                    {stats.countriesCount}
                                </div>
                                <div className="text-xs font-semibold text-slate-400">Countries</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filter Category Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
                            <Button
                                size="sm"
                                variant={selectedCategory === "all" ? "default" : "ghost"}
                                onClick={() => setSelectedCategory("all")}
                                className={`rounded-xl text-xs font-bold transition-all ${
                                    selectedCategory === "all"
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                All Hubs
                            </Button>

                            <Button
                                size="sm"
                                variant={selectedCategory === "clans" ? "default" : "ghost"}
                                onClick={() => setSelectedCategory("clans")}
                                className={`rounded-xl text-xs font-bold transition-all ${
                                    selectedCategory === "clans"
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Shield className="size-3.5 mr-1.5 text-purple-400" />
                                Study Clans
                            </Button>

                            <Button
                                size="sm"
                                variant={selectedCategory === "voice" ? "default" : "ghost"}
                                onClick={() => setSelectedCategory("voice")}
                                className={`rounded-xl text-xs font-bold transition-all ${
                                    selectedCategory === "voice"
                                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Mic className="size-3.5 mr-1.5 text-emerald-400" />
                                Voice Practice
                            </Button>

                            <Button
                                size="sm"
                                variant={selectedCategory === "quizzes" ? "default" : "ghost"}
                                onClick={() => setSelectedCategory("quizzes")}
                                className={`rounded-xl text-xs font-bold transition-all ${
                                    selectedCategory === "quizzes"
                                        ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                                        : "text-slate-300 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Trophy className="size-3.5 mr-1.5 text-amber-400" />
                                Live Battles
                            </Button>
                        </div>

                        {/* Globe Controls */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={loadRealtimeTelemetry}
                                title="Sync Database Data"
                                className="size-8 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setIsSpinning(prev => !prev)}
                                title={isSpinning ? "Pause Auto-rotation" : "Spin Globe"}
                                className="size-8 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                {isSpinning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={resetGlobeView}
                                title="Reset View"
                                className="size-8 rounded-xl border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                            >
                                <RotateCcw className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Globe Display Container */}
            <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Globe Render Column */}
                <div className="lg:col-span-7 relative flex justify-center items-center">
                    {/* Glowing Backdrop Canvas Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] aspect-square bg-gradient-to-tr from-blue-600/20 via-cyan-500/10 to-purple-600/20 blur-[90px] rounded-full pointer-events-none -z-10" />

                    <div className="relative w-full max-w-[480px] aspect-square">
                        <canvas
                            ref={canvasRef}
                            onPointerDown={handlePointerDown}
                            style={{
                                width: "100%",
                                height: "100%",
                                cursor: "grab",
                                opacity: 0,
                                transition: "opacity 1.2s ease",
                                borderRadius: "50%",
                                touchAction: "none"
                            }}
                        />
                    </div>
                </div>

                {/* Hub Inspector Telemetry Column */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {/* Selected Hub Telemetry Card */}
                    <AnimatePresence mode="wait">
                        {selectedHub && (
                            <motion.div
                                key={selectedHub.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.25 }}
                                className="bg-slate-900/80 backdrop-blur-2xl border border-blue-500/30 rounded-3xl p-6 shadow-2xl shadow-blue-500/10 space-y-5"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="size-4 text-cyan-400" />
                                            <h3 className="text-xl font-bold text-white tracking-tight">
                                                {selectedHub.name}
                                            </h3>
                                            <Badge variant="outline" className="border-blue-400/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                                                {selectedHub.country}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`size-2.5 rounded-full ${stats.totalStudents > 0 ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                {/* Hub Detailed Stats */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <div className="text-xs text-slate-400 font-medium">Students</div>
                                        <div className="text-lg font-bold text-white mt-0.5">
                                            {selectedHub.activeStudents}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <div className="text-xs text-slate-400 font-medium">Clans</div>
                                        <div className="text-lg font-bold text-purple-300 mt-0.5">
                                            {selectedHub.activeClans}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <div className="text-xs text-slate-400 font-medium">Voice Rooms</div>
                                        <div className="text-lg font-bold text-emerald-300 mt-0.5">
                                            {selectedHub.voiceSessions}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                                        <div className="text-xs text-slate-400 font-medium">Live Quizzes</div>
                                        <div className="text-lg font-bold text-amber-300 mt-0.5">
                                            {selectedHub.liveQuizzes}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Clan & Activity */}
                                <div className="space-y-2 pt-1 border-t border-white/10">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-medium flex items-center gap-1.5">
                                            <Trophy className="size-3.5 text-amber-400" />
                                            Top Clan:
                                        </span>
                                        <span className="font-bold text-white bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                            {selectedHub.topClan}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
                                        <Activity className="size-4 text-blue-400 shrink-0 mt-0.5" />
                                        <span>{selectedHub.recentActivity}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
