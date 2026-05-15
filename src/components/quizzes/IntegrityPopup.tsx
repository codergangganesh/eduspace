import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { ShieldAlert, Clock, Maximize2, Target } from "lucide-react";

interface IntegrityPopupProps {
    open: boolean;
    reason: 'entry' | 'return';
    onAction: () => void;
    isFullscreen?: boolean;
}

export function IntegrityPopup({ open, reason, onAction, isFullscreen }: IntegrityPopupProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="w-[92vw] max-w-lg rounded-2xl border border-white/10 bg-[#09090B] p-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-8 sm:p-10">
                    {/* Minimalist Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex size-11 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                            <ShieldAlert className="size-5 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                {reason === 'return' ? 'Session Interrupted' : 'Action Required'}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="size-1.5 rounded-full bg-red-500" />
                                <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">Security Protocol Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <p className="text-[15px] leading-relaxed text-slate-400">
                                {reason === 'return'
                                    ? 'Your assessment session was paused because you exited fullscreen mode. To maintain a secure environment, you must remain in a focused state.'
                                    : 'This assessment requires you to enter fullscreen mode. This ensures a stable environment and prevents accidental navigation during your attempt.'}
                            </p>
                        </div>

                        {/* System Monitor Area (Functional Look) */}
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Environment Status</span>
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">SECURE-v1.4</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">Timer Protection</p>
                                        <p className="text-[11px] text-slate-500">The quiz timer remains synchronized and visible in the background.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 py-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase">Active</span>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">State Preservation</p>
                                        <p className="text-[11px] text-slate-500">All previously submitted answers and progress are securely cached.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 py-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase">Synced</span>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white">Interface Lock</p>
                                        <p className="text-[11px] text-slate-500">Quiz interaction and navigation are restricted until fullscreen mode.</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 py-1">
                                        <span className="size-1.5 rounded-full bg-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-500/80 uppercase">Locked</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <AlertDialogAction
                                onClick={(event) => {
                                    event.preventDefault();
                                    onAction();
                                }}
                                className="h-12 w-full rounded-lg bg-white text-black hover:bg-slate-200 text-sm font-semibold transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                            >
                                {reason === 'return' ? 'Return to Session' : 'Begin Assessment'}
                            </AlertDialogAction>
                            
                            <p className="text-[11px] text-center text-slate-600 mt-4 italic font-medium">
                                * Your progress has been securely cached and will resume immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
