import { cn } from "@/lib/utils";
import { Phone, Video, PhoneOff, PhoneForwarded, PhoneIncoming, PhoneMissed, Clock } from "lucide-react";

interface CallBubbleProps {
    type: 'audio' | 'video';
    status: 'started' | 'ended' | 'missed' | 'declined';
    duration?: string;
    timestamp: string;
    isOwn: boolean;
    content?: string;
}

export function CallBubble({ type, status, duration, timestamp, isOwn, content }: CallBubbleProps) {
    const isVideo = type === 'video';
    const isMissed = status === 'missed' || status === 'declined';

    return (
        <div className={cn(
            "flex flex-col gap-3 p-4 rounded-2xl min-w-[220px] shadow-sm animate-in fade-in slide-in-from-bottom-2",
            isOwn
                ? "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
                : "bg-white dark:bg-[#202c33] border border-slate-100 dark:border-none"
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                    isMissed
                        ? "bg-red-500/10 text-red-500"
                        : "bg-emerald-500/10 text-emerald-500"
                )}>
                    {status === 'ended' || status === 'declined' ? (
                        <PhoneOff className="size-5" />
                    ) : isVideo ? (
                        <Video className="size-5" />
                    ) : (
                        <Phone className="size-5" />
                    )}
                </div>

                <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {content || (isVideo ? 'Video Call' : 'Voice Call')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {isOwn ? (
                            <PhoneForwarded className="size-3 text-slate-400" />
                        ) : isMissed ? (
                            <PhoneMissed className="size-3 text-red-500" />
                        ) : (
                            <PhoneIncoming className="size-3 text-emerald-500" />
                        )}
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-wider",
                            isMissed ? "text-red-500" : "text-slate-500 dark:text-slate-400"
                        )}>
                            {status === 'missed' ? 'Missed Call' :
                                status === 'declined' ? 'Declined' :
                                    status === 'started' ? 'Started' : 'Call Ended'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="size-3 text-slate-500/50" />
                    <span className="text-[10px] font-bold uppercase">{timestamp}</span>
                </div>
                {duration && (
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {duration}
                    </span>
                )}
            </div>
        </div>
    );
}
