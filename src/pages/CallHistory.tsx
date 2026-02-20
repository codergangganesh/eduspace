import React, { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
    Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
    Video, VideoOff, Clock, Calendar, Search, Filter,
    MoreVertical, Trash2, ArrowLeft
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChatSkeleton } from '@/components/skeletons/ChatSkeleton';

export default function CallHistory() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'missed' | 'video' | 'audio'>('all');

    const { data: calls, isLoading } = useQuery({
        queryKey: ['call_history', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('call_sessions')
                .select(`
                    *,
                    caller:profiles!call_sessions_caller_id_fkey(full_name, avatar_url),
                    receiver:profiles!call_sessions_receiver_id_fkey(full_name, avatar_url)
                `)
                .or(`caller_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id
    });

    const filteredCalls = calls?.filter(call => {
        const otherUser = call.caller_id === user?.id ? call.receiver : call.caller;
        const nameMatch = otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!nameMatch) return false;
        if (filter === 'missed') return call.status === 'missed';
        if (filter === 'video') return call.call_type === 'video';
        if (filter === 'audio') return call.call_type === 'audio';
        return true;
    });

    const formatCallDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    };

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    if (isLoading) return <DashboardLayout><ChatSkeleton /></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Call History</h1>
                        <p className="text-sm text-slate-500">Track your recent voice and video interactions.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input
                                placeholder="Search contacts..."
                                className="pl-9 h-10 rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0">
                                    <Filter className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setFilter('all')}>All Calls</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('missed')}>Missed Only</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('video')}>Video Calls</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilter('audio')}>Voice Calls</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Call List */}
                <Card className="rounded-2xl border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardContent className="p-0">
                        {!filteredCalls || filteredCalls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <PhoneOff className="size-8 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-medium">No call logs found</p>
                                    <p className="text-sm text-slate-500">Your recent calls will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCalls.map((call) => {
                                    const isOutgoing = call.caller_id === user?.id;
                                    const otherUser = isOutgoing ? call.receiver : call.caller;
                                    const status = call.status;

                                    return (
                                        <div key={call.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                                                    <AvatarImage src={otherUser?.avatar_url} />
                                                    <AvatarFallback>{otherUser?.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                            {otherUser?.full_name || 'Deleted User'}
                                                        </h4>
                                                        {call.call_type === 'video' ? (
                                                            <Video className="size-3 text-slate-400" />
                                                        ) : (
                                                            <Phone className="size-3 text-slate-400" />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {status === 'missed' ? (
                                                            <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                                                <PhoneMissed className="size-3" />
                                                                Missed
                                                            </div>
                                                        ) : isOutgoing ? (
                                                            <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                                                                <PhoneOutgoing className="size-3" />
                                                                Outgoing
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                                                                <PhoneIncoming className="size-3" />
                                                                Incoming
                                                            </div>
                                                        )}
                                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <Clock className="size-2.5" />
                                                            {formatCallDate(call.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                        {call.duration ? formatDuration(call.duration) : '--'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 lowercase">
                                                        {call.call_type} call
                                                    </p>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="size-4 text-slate-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="text-red-500">
                                                            <Trash2 className="size-4 mr-2" />
                                                            Delete Record
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
