import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import ForceGraph3D from "react-force-graph-3d";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Loader2, Orbit, Info, RefreshCw, Search, Hand, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { knowledgeService } from "@/lib/knowledgeService";
import { cn } from "@/lib/utils";

interface Node {
    id: string;
    label: string;
    type: 'chat' | 'note' | 'quiz' | 'assignment';
    keywords: string[];
    val: number;
}

interface Link {
    source: string;
    target: string;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

export default function KnowledgeMap() {
    const fgRef = useRef<any>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [originalData, setOriginalData] = useState<GraphData>({ nodes: [], links: [] });
    const [activeFilter, setActiveFilter] = useState<'all' | 'chat' | 'note' | 'quiz' | 'assignment'>('all');
    const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchKnowledgeData = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data: nodes, error } = await supabase
                .from('knowledge_nodes')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            // Process actual data (if no data, graph will be empty)
            const formattedNodes: Node[] = (nodes || []).map(n => ({
                id: n.id,
                label: n.label,
                type: n.entity_type as any,
                keywords: n.keywords || [],
                val: 10 + (n.keywords?.length || 0) * 2
            }));

            // Basic linking logic: link nodes that share keywords
            const links: Link[] = [];
            for (let i = 0; i < formattedNodes.length; i++) {
                for (let j = i + 1; j < formattedNodes.length; j++) {
                    const shared = formattedNodes[i].keywords.filter(k =>
                        formattedNodes[j].keywords.includes(k)
                    );
                    if (shared.length > 0) {
                        links.push({
                            source: formattedNodes[i].id,
                            target: formattedNodes[j].id
                        });
                    }
                }
            }

            setOriginalData({ nodes: formattedNodes, links });
            setGraphData({ nodes: formattedNodes, links });
        } catch (error: any) {
            console.error('Detailed Knowledge Map Error:', error);
            const message = error.message || 'Unknown database error';
            toast.error(`Map Error: ${message}`);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: Math.max(entry.contentRect.height, 400)
                    });
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (activeFilter === 'all') {
            setGraphData(originalData);
        } else {
            const filteredNodes = originalData.nodes.filter(n => n.type === activeFilter);
            const nodeIds = new Set(filteredNodes.map(n => n.id));
            const filteredLinks = originalData.links.filter(l =>
                nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) &&
                nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target)
            );
            setGraphData({ nodes: filteredNodes, links: filteredLinks });
        }
    }, [activeFilter, originalData]);

    useEffect(() => {
        fetchKnowledgeData();

        // Subscribe to real-time updates for knowledge nodes
        if (!user) return;

        const channel = supabase
            .channel('knowledge_nodes_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'knowledge_nodes',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchKnowledgeData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchKnowledgeData, user]);

    const syncExistingData = async () => {
        if (!user) return;

        try {
            setIsSyncing(true);
            toast.info("Scanning your learning history...", { duration: 3000 });

            // 1. Fetch existing notes
            const { data: notes } = await supabase
                .from('student_notes')
                .select('id, title, content')
                .eq('user_id', user.id);

            // 2. Fetch existing chats
            const { data: chats } = await supabase
                .from('ai_conversations')
                .select('id, title')
                .eq('user_id', user.id);

            // 3. Fetch existing quiz submissions
            const { data: quizSubs } = await supabase
                .from('quiz_submissions')
                .select('id, quiz:quizzes(title)')
                .eq('student_id', user.id)
                .neq('status', 'pending');

            // 4. Fetch existing assignment submissions
            const { data: assignmentSubs } = await supabase
                .from('assignment_submissions')
                .select('id, assignment:assignments(title)')
                .eq('student_id', user.id);

            // 5. Process each
            const syncPromises = [];

            if (notes) {
                for (const note of notes) {
                    syncPromises.push(knowledgeService.upsertKnowledgeNode({
                        type: 'note',
                        sourceId: note.id,
                        label: note.title,
                        text: `${note.title}\n${note.content}`
                    }));
                }
            }

            if (chats) {
                for (const chat of chats) {
                    syncPromises.push(knowledgeService.upsertKnowledgeNode({
                        type: 'chat',
                        sourceId: chat.id,
                        label: chat.title,
                        text: chat.title
                    }));
                }
            }

            if (quizSubs) {
                for (const sub of quizSubs) {
                    const title = (sub.quiz as any)?.title || 'Quiz';
                    syncPromises.push(knowledgeService.upsertKnowledgeNode({
                        type: 'quiz',
                        sourceId: sub.id,
                        label: title,
                        text: title
                    }));
                }
            }

            if (assignmentSubs) {
                for (const sub of assignmentSubs) {
                    const title = (sub.assignment as any)?.title || 'Assignment';
                    syncPromises.push(knowledgeService.upsertKnowledgeNode({
                        type: 'assignment',
                        sourceId: sub.id,
                        label: title,
                        text: title
                    }));
                }
            }

            await Promise.all(syncPromises);
            toast.success("EduMatrix synchronized!");
            fetchKnowledgeData();
        } catch (error) {
            console.error("Sync error:", error);
            toast.error("Failed to sync history");
        } finally {
            setIsSyncing(false);
        }
    };

    const LegendItems = () => {
        const filters = [
            { id: 'all', label: 'All', icon: '✨' },
            { id: 'chat', label: 'Chats', icon: '💬' },
            { id: 'note', label: 'Notes', icon: '📝' },
            { id: 'quiz', label: 'Quizzes', icon: '🏆' },
            { id: 'assignment', label: 'Tasks', icon: '📚' }
        ];

        return (
            <div className="flex items-center p-1 bg-background/50 backdrop-blur-md rounded-2xl border border-border shadow-sm">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id as any)}
                        className={cn(
                            "px-3 py-1 rounded-[10px] text-[10px] font-black transition-all flex items-center gap-1.5",
                            activeFilter === filter.id
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <span className="text-[12px] opacity-90 leading-none">{filter.icon}</span>
                        <span className="uppercase tracking-wider">{filter.label}</span>
                    </button>
                ))}
                <div className="h-4 w-[1px] bg-border mx-2" />
                <button
                    onClick={syncExistingData}
                    disabled={isSyncing || loading}
                    className="p-2 text-indigo-500 hover:bg-accent rounded-xl transition-all active:scale-95"
                    title="Sync History"
                >
                    <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
                </button>
            </div>
        );
    };

    const getNodeColor = (node: Node) => {
        switch (node.type) {
            case 'chat': return '#6366f1'; // Indigo
            case 'note': return '#10b981'; // Emerald
            case 'quiz': return '#f59e0b'; // Amber
            case 'assignment': return '#ef4444'; // Red
            default: return '#94a3b8';
        }
    };

    return (
        <DashboardLayout fullHeight>
            <div className="flex flex-col h-[100dvh] w-full bg-background/30 md:bg-transparent overflow-hidden relative">
                {/* Premium Light Theme Pattern - Unified */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                />

                {/* Desktop Header */}
                <div className="hidden md:flex flex-col p-6 text-foreground relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Orbit className="size-8 text-primary" />
                                EduMatrix
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">Visualize your learning journey across time.</p>
                        </div>
                        <LegendItems />
                    </div>
                </div>

                {/* Mobile Header (Unified Style) */}
                <div className="flex md:hidden flex-col items-start pt-4 px-4 bg-background/40 backdrop-blur-sm z-20 relative">
                    <div className="w-full flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="size-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Orbit className="size-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight">EduMatrix</h1>
                        </div>
                        <button
                            onClick={syncExistingData}
                            disabled={isSyncing || loading}
                            className="size-10 flex items-center justify-center bg-background rounded-2xl shadow-sm border border-border text-indigo-500 active:scale-95 transition-all"
                        >
                            <RefreshCw className={cn("size-5", isSyncing && "animate-spin")} />
                        </button>
                    </div>

                    <div className="w-full flex items-center p-1 bg-accent/40 rounded-[20px] mb-2 border border-border shadow-inner">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={cn(
                                "flex-1 py-2 px-1 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap",
                                activeFilter === 'all' ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All
                        </button>
                        {[
                            { id: 'chat', label: 'Chats', icon: '💬' },
                            { id: 'note', label: 'Notes', icon: '📝' },
                            { id: 'quiz', label: 'Quizzes', icon: '🏆' },
                            { id: 'assignment', label: 'Tasks', icon: '📚' }
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id as any)}
                                className={cn(
                                    "flex-1 py-2 px-1 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap flex flex-col min-[380px]:flex-row items-center justify-center gap-0.5 min-[380px]:gap-1.5",
                                    activeFilter === filter.id ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="text-[14px] min-[380px]:text-[12px] opacity-70 leading-none">{filter.icon}</span>
                                <span className="leading-none">{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Graph Container */}
                <div ref={containerRef} className="flex-1 relative overflow-hidden group bg-transparent">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-sm">
                            <Loader2 className="size-12 animate-spin text-primary" />
                        </div>
                    ) : graphData.nodes.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-background/20 backdrop-blur-[2px]">
                            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Orbit className="size-8 text-primary/40" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Build Your Galaxy</h3>
                            <p className="max-w-xs text-sm text-muted-foreground mb-6">Start chatting with AI or writing notes to see your EduMatrix come to life.</p>
                            <button
                                onClick={syncExistingData}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 transition-all active:scale-95"
                            >
                                Sync My History
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Controls Card - Desktop Tooltip */}
                            <div className="hidden md:block absolute bottom-4 right-4 md:top-4 md:right-4 z-10 pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Card className="p-3 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-white/10 dark:border-white/5 text-[9px] md:text-[10px] space-y-1.5 shadow-2xl rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <Info className="size-2 md:size-3 text-primary/60" />
                                        <span><b>Pinch/Scroll</b> to zoom</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info className="size-2 md:size-3 text-primary/60" />
                                        <span><b>Drag</b> to rotate</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info className="size-2 md:size-3 text-primary/60" />
                                        <span><b>Tap node</b> to focus</span>
                                    </div>
                                </Card>
                            </div>

                            <ForceGraph3D
                                ref={fgRef}
                                graphData={graphData}
                                width={dimensions.width}
                                height={dimensions.height}
                                nodeLabel={(node: any) => {
                                    const nodeColor = getNodeColor(node as Node);
                                    let typeIcon = '✨';
                                    if (node.type === 'chat') typeIcon = '💬';
                                    if (node.type === 'note') typeIcon = '📝';
                                    if (node.type === 'quiz') typeIcon = '🏆';
                                    if (node.type === 'assignment') typeIcon = '📚';

                                    return `
                                        <div style="font-family: inherit;" class="relative p-2 backdrop-blur-sm">
                                            <div class="absolute left-0 inset-y-0 w-0.5 rounded-full" style="background: ${nodeColor}; box-shadow: 0 0 10px ${nodeColor}80"></div>
                                            <div class="pl-4 flex flex-col gap-1">
                                                <p class="text-[9px] font-black uppercase tracking-[0.2em]" style="color: ${nodeColor}; text-shadow: 0 2px 4px rgba(0,0,0,0.5)">${node.type}</p>
                                                <h3 class="text-sm font-bold text-white leading-tight" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5)">
                                                    <span class="mr-2">${typeIcon}</span>
                                                    ${node.label}
                                                </h3>
                                            </div>
                                            <div class="pl-4 mt-2 text-[8px] font-bold text-white/40 uppercase tracking-[0.2em]" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5)">
                                                Click to Focus
                                            </div>
                                        </div>
                                    `;
                                }}
                                nodeThreeObject={(node: any) => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = 120;
                                    canvas.height = 120;
                                    const ctx = canvas.getContext('2d')!;
                                    const color = getNodeColor(node as Node);

                                    // Base sphere glow
                                    const gradient = ctx.createRadialGradient(60, 60, 0, 60, 60, 60);
                                    gradient.addColorStop(0, color);
                                    gradient.addColorStop(0.7, color);
                                    gradient.addColorStop(1, 'rgba(255,255,255,0)');

                                    ctx.fillStyle = gradient;
                                    ctx.beginPath();
                                    ctx.arc(60, 60, 50, 0, 2 * Math.PI);
                                    ctx.fill();

                                    // White icon inside
                                    ctx.fillStyle = 'white';
                                    ctx.font = 'bold 42px Arial';
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'middle';
                                    let icon = '✨';
                                    if (node.type === 'chat') icon = '💬';
                                    if (node.type === 'note') icon = '📝';
                                    if (node.type === 'quiz') icon = '🏆';
                                    if (node.type === 'assignment') icon = '📚';
                                    ctx.fillText(icon, 60, 60);

                                    const texture = new THREE.CanvasTexture(canvas);
                                    const material = new THREE.SpriteMaterial({
                                        map: texture,
                                        transparent: true,
                                        depthTest: false
                                    });
                                    const sprite = new THREE.Sprite(material);
                                    sprite.scale.set(node.val * 1.5, node.val * 1.5, 1);
                                    return sprite;
                                }}
                                nodeColor={(node: any) => getNodeColor(node as Node)}
                                nodeRelSize={7}
                                nodeVal={(node: any) => (node as Node).val}
                                linkColor={() => 'rgba(79, 70, 229, 0.15)'}
                                linkWidth={2}
                                linkOpacity={0.2}
                                backgroundColor="rgba(0,0,0,0)"
                                nodeThreeObjectExtend={false}
                                onNodeClick={(node: any) => {
                                    const distance = 40;
                                    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                                    fgRef.current.cameraPosition(
                                        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                                        node,
                                        1500
                                    );
                                }}
                            />

                            {/* Branded Control Bar - Now on all devices & Higher Up */}
                            <div className="absolute bottom-24 inset-x-0 flex justify-center px-4 z-30 pointer-events-none">
                                <div className="flex items-center justify-between w-full max-w-sm bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-[32px] p-2 pointer-events-auto">
                                    <button
                                        className="flex-1 flex flex-col items-center gap-1.5 py-3 text-indigo-600 active:scale-90 transition-all"
                                        onClick={() => {
                                            const pos = fgRef.current.cameraPosition();
                                            fgRef.current.cameraPosition({ x: pos.x * 0.8, y: pos.y * 0.8, z: pos.z * 0.8 }, null, 500);
                                        }}
                                    >
                                        <div className="size-11 flex items-center justify-center bg-indigo-500/10 rounded-2xl shadow-sm border border-indigo-500/20">
                                            <Search className="size-6 text-indigo-500" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Zoom</span>
                                    </button>
                                    <div className="w-[1px] h-8 bg-border" />
                                    <button
                                        className="flex-1 flex flex-col items-center gap-1.5 py-3 text-indigo-600 active:scale-90 transition-all"
                                        onClick={() => {
                                            fgRef.current.cameraPosition({ x: 0, y: 0, z: 200 }, { x: 0, y: 0, z: 0 }, 1000);
                                        }}
                                    >
                                        <div className="size-11 flex items-center justify-center bg-indigo-500/10 rounded-2xl shadow-sm border border-indigo-500/20">
                                            <Hand className="size-6 text-indigo-500" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pan</span>
                                    </button>
                                    <div className="w-[1px] h-8 bg-border" />
                                    <button
                                        className="flex-1 flex flex-col items-center gap-1.5 py-3 text-indigo-600 active:scale-90 transition-all"
                                        onClick={() => {
                                            const nodes = graphData.nodes as any[];
                                            if (nodes.length > 0) {
                                                const node = nodes[Math.floor(Math.random() * nodes.length)];
                                                const distance = 40;
                                                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                                                fgRef.current.cameraPosition(
                                                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                                                    node,
                                                    1500
                                                );
                                            }
                                        }}
                                    >
                                        <div className="size-11 flex items-center justify-center bg-indigo-500/10 rounded-2xl shadow-sm border border-indigo-500/20">
                                            <Target className="size-6 text-indigo-500" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Focus</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
