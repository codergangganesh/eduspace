import React, { useState } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff,
    Video, VideoOff, Clock, Calendar, Search, Filter,
    MoreVertical, Trash2, ArrowLeft, ArrowUpRight, ArrowDownLeft,
    ChevronDown, Plus, X, MessageSquare, Settings
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
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChatSkeleton } from '@/components/skeletons/ChatSkeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCall } from '@/contexts/CallContext';
import { useEligibleStudents } from '@/hooks/useEligibleStudents';
import { useInstructors } from '@/hooks/useInstructors';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CallHistory() {
    const { user } = useAuth();
    const { initiateCall } = useCall();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'missed'>('all');
    const [isNewCallOpen, setIsNewCallOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    const { students } = useEligibleStudents();
    const { instructors } = useInstructors();

    const allContacts = [
        ...(instructors || []).map(i => ({ ...i, role: 'Instructor' })),
        ...(students || []).map(s => ({ ...s, role: 'Student' }))
    ];

    const filteredContacts = allContacts.filter(c =>
        c.full_name?.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const { data: calls, isLoading } = useQuery({
        queryKey: ['call_history', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('call_sessions')
                .select(`
                    *,
                    caller:profiles!call_sessions_caller_profiles_fkey(user_id, full_name, avatar_url, department),
                    receiver:profiles!call_sessions_receiver_profiles_fkey(user_id, full_name, avatar_url, department)
                `)
                .or(`caller_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Client-side visibility filter as a safety layer over RLS
            return (data || []).filter((call: any) => {
                if (call.caller_id === user?.id && call.is_hidden_by_caller) return false;
                if (call.receiver_id === user?.id && call.is_hidden_by_receiver) return false;
                return true;
            });
        },
        enabled: !!user?.id
    });

    // Grouping logic for Sidebar (Unique contacts)
    // List of unique contacts for Desktop Sidebar
    const desktopContacts = React.useMemo(() => {
        const groups: Record<string, any> = {};
        (calls || []).forEach((call: any) => {
            const isOutgoing = call.caller_id === user?.id;
            const otherUser = isOutgoing ? call.receiver : call.caller;
            if (!otherUser) return;

            const otherId = otherUser.user_id;

            // Apply global filters
            const name = otherUser.full_name || 'User';
            if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return;
            if (filter === 'missed' && !(call.status === 'missed' || call.status === 'rejected')) return;

            if (!groups[otherId]) {
                groups[otherId] = {
                    contact: otherUser,
                    latestCall: call,
                    isOutgoing
                };
            }
        });
        return Object.values(groups);
    }, [calls, searchQuery, filter, user?.id]);

    // Flat log for Mobile view (grouped only if consecutive same-day same-type)
    const mobileLogs = React.useMemo(() => {
        const logs: any[] = [];
        (calls || []).forEach((call: any) => {
            const isOutgoing = call.caller_id === user?.id;
            const otherUser = isOutgoing ? call.receiver : call.caller;
            if (!otherUser) return;

            // Filters
            const name = otherUser.full_name || 'User';
            if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return;
            if (filter === 'missed' && !(call.status === 'missed' || call.status === 'rejected')) return;

            // Consecutive grouping logic
            const prev = logs[logs.length - 1];
            const isSameUser = prev && prev.contact.user_id === otherUser.user_id;
            const isSameType = prev && prev.latestCall.call_type === call.call_type;
            const isSameStatus = prev && (
                (prev.latestCall.status === 'missed' || prev.latestCall.status === 'rejected') ===
                (call.status === 'missed' || call.status === 'rejected')
            );
            const isSameDay = prev && isSameDayDate(new Date(prev.latestCall.created_at), new Date(call.created_at));

            if (isSameUser && isSameType && isSameStatus && isSameDay) {
                prev.count = (prev.count || 1) + 1;
            } else {
                logs.push({
                    contact: otherUser,
                    latestCall: call,
                    isOutgoing,
                    count: 1
                });
            }
        });
        return logs;
    }, [calls, searchQuery, filter, user?.id]);

    function isSameDayDate(d1: Date, d2: Date) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    // Grouping logic for Detail View (Dates for selected contact)
    const detailLogs = React.useMemo(() => {
        if (!selectedContactId) return [];
        const contactCalls = (calls || []).filter((call: any) =>
            call.caller_id === selectedContactId || call.receiver_id === selectedContactId
        );

        const dateGroups: Record<string, any[]> = {};
        contactCalls.forEach(call => {
            const date = format(new Date(call.created_at), 'dd/MM/yyyy');
            if (!dateGroups[date]) dateGroups[date] = [];
            dateGroups[date].push(call);
        });

        return Object.entries(dateGroups).map(([date, calls]) => ({ date, calls }));
    }, [calls, selectedContactId]);

    const activeDetailContact = selectedContactId
        ? allContacts.find(c => c.id === selectedContactId) ||
        desktopContacts.find(i => i.contact.user_id === selectedContactId)?.contact ||
        mobileLogs.find(i => i.contact.user_id === selectedContactId)?.contact
        : null;

    const formatDuration = (seconds: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''} ${secs} seconds` : `${secs} seconds`;
    };

    const handleDeleteCall = async (callId: string, isCaller: boolean) => {
        try {
            console.log('Attempting to delete call:', { callId, isCaller, userId: user?.id });
            const updateData = isCaller ? { is_hidden_by_caller: true } : { is_hidden_by_receiver: true };

            const { error } = await supabase
                .from('call_sessions')
                .update(updateData as any)
                .eq('id', callId);

            if (error) {
                console.error('Supabase update error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            await queryClient.invalidateQueries({ queryKey: ['call_history', user?.id] });
            toast.success("Call removed from history");
        } catch (error: any) {
            console.error('Delete call failure:', error);
            const msg = error.message || "Failed to remove call";
            toast.error(msg);
        }
    };

    if (isLoading) return <DashboardLayout fullHeight={true}><ChatSkeleton /></DashboardLayout>;

    return (
        <DashboardLayout fullHeight={true}>
            <div className="flex bg-[#0b141a] text-slate-200 h-full overflow-hidden">
                {/* Sidebar Pane */}
                <div className={cn(
                    "w-full md:w-[400px] flex flex-col min-h-0 border-r border-slate-800/50 bg-[#111b21]",
                    selectedContactId && "hidden md:flex"
                )}>
                    <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            {isMobileSearchOpen ? (
                                <div className="flex items-center gap-2 w-full animate-in slide-in-from-left-2 duration-200">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="rounded-full text-slate-400"
                                        onClick={() => setIsMobileSearchOpen(false)}
                                    >
                                        <ArrowLeft className="size-5" />
                                    </Button>
                                    <Input
                                        autoFocus
                                        placeholder="Search..."
                                        className="bg-[#202c33] border-none rounded-lg h-10 text-slate-200 focus-visible:ring-0 placeholder:text-slate-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-semibold text-white md:text-xl md:font-bold">Calls</h2>
                                    <div className="flex items-center gap-1 md:gap-0">
                                        <Button
                                            variant="ghost" size="icon"
                                            className="rounded-full text-slate-200 hover:bg-slate-800 flex md:hidden"
                                            onClick={() => setIsMobileSearchOpen(true)}
                                        >
                                            <Search className="size-5" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="rounded-full text-slate-400 hover:bg-slate-800 hidden md:flex"
                                            onClick={() => setIsNewCallOpen(true)}
                                        >
                                            <Plus className="size-6" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="rounded-full text-slate-200 hover:bg-slate-800 flex md:hidden"
                                                >
                                                    <MoreVertical className="size-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#233138] border-none text-slate-200 min-w-[200px] shadow-2xl">
                                                <DropdownMenuItem
                                                    className="focus:bg-[#111b21] focus:text-white flex items-center gap-3 py-3"
                                                    onClick={() => setIsNewCallOpen(true)}
                                                >
                                                    <Plus className="size-4" />
                                                    <span>New Call</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="focus:bg-[#111b21] focus:text-white flex items-center gap-3 py-3"
                                                    onClick={() => navigate('/messages')}
                                                >
                                                    <MessageSquare className="size-4" />
                                                    <span>Messages</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="focus:bg-[#111b21] focus:text-white flex items-center gap-3 py-3"
                                                    onClick={() => setFilter(filter === 'all' ? 'missed' : 'all')}
                                                >
                                                    <Filter className="size-4" />
                                                    <span>{filter === 'all' ? 'Show Missed Calls' : 'Show All Calls'}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="focus:bg-[#111b21] focus:text-white flex items-center gap-3 py-3"
                                                    onClick={() => navigate('/settings')}
                                                >
                                                    <Settings className="size-4" />
                                                    <span>Settings</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                            <Input
                                placeholder="Search name or number"
                                className="pl-10 h-10 bg-[#202c33] border-none rounded-lg text-sm text-slate-200 focus-visible:ring-0 placeholder:text-slate-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Tabs - Hidden on mobile as per requirement for clean log look */}
                        <div className="hidden md:flex gap-2">
                            <Button
                                variant="ghost"
                                className={cn(
                                    "rounded-full px-4 h-8 text-xs font-semibold",
                                    filter === 'all' ? "bg-slate-700 text-white" : "text-slate-400"
                                )}
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "rounded-full px-4 h-8 text-xs font-semibold",
                                    filter === 'missed' ? "bg-slate-700 text-white" : "text-slate-400"
                                )}
                                onClick={() => setFilter('missed')}
                            >
                                Missed
                            </Button>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="px-0 md:px-2 pb-10">
                            {/* Mobile Flat Log vs Desktop Grouped List */}
                            <div className="md:hidden">
                                {mobileLogs.length === 0 ? (
                                    <div className="py-20 text-center text-slate-500 px-10">
                                        <PhoneOff className="size-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-sm">No recent calls found</p>
                                    </div>
                                ) : (
                                    mobileLogs.map((item: any, idx) => {
                                        const contact = item.contact;
                                        const call = item.latestCall;
                                        const isMissed = call.status === 'missed' || call.status === 'rejected';

                                        const dateStr = isToday(new Date(call.created_at)) ? format(new Date(call.created_at), 'h:mm a') :
                                            isYesterday(new Date(call.created_at)) ? 'Yesterday, ' + format(new Date(call.created_at), 'h:mm a') :
                                                format(new Date(call.created_at), 'd MMMM, h:mm a');

                                        const logKey = `${contact.user_id}-${call.id}`;
                                        const isExpanded = expandedLogId === logKey;

                                        return (
                                            <div key={logKey} className="px-0 py-0 animate-in fade-in duration-300">
                                                <div
                                                    onClick={() => setExpandedLogId(isExpanded ? null : logKey)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 cursor-pointer hover:bg-[#1f2c33] transition-colors border-b border-white/5 active:bg-[#202c33]",
                                                        isExpanded && "bg-[#1f2c33] border-b-0"
                                                    )}
                                                >
                                                    <Avatar className="h-14 w-14 border-none shrink-0 pointer-events-none">
                                                        <AvatarImage src={contact.avatar_url} />
                                                        <AvatarFallback className="bg-slate-700 text-slate-300 font-bold uppercase text-lg">
                                                            {contact.full_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0 pointer-events-none">
                                                        <p className="font-medium text-[17px] truncate mb-0.5 text-white">
                                                            {contact.full_name}{item.count > 1 ? `(${item.count})` : ''}
                                                        </p>
                                                        <div className="flex items-center gap-1.5">
                                                            {item.isOutgoing ? (
                                                                <ArrowUpRight className={cn("size-3.5", isMissed ? "text-red-500" : "text-emerald-500")} />
                                                            ) : (
                                                                <ArrowDownLeft className={cn("size-3.5", isMissed ? "text-red-500" : "text-emerald-500")} />
                                                            )}
                                                            <p className="text-[14px] text-slate-400 truncate font-light">
                                                                {dateStr}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="shrink-0 ml-2 p-2 rounded-full active:bg-white/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            initiateCall(contact.user_id, contact.full_name, contact.avatar_url || '', call.call_type || 'audio');
                                                        }}
                                                    >
                                                        {call.call_type === 'video' ? (
                                                            <Video className="size-6 text-slate-200" />
                                                        ) : (
                                                            <Phone className="size-5 text-slate-200" />
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="bg-[#1f2c33] flex items-center justify-around py-3 border-t border-white/5 animate-in slide-in-from-top-1 duration-200 border-b border-white/5">
                                                        <button
                                                            className="flex flex-col items-center gap-1.5 px-4 py-1 active:bg-white/5 rounded-xl transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedContactId(contact.user_id);
                                                            }}
                                                        >
                                                            <Clock className="size-5 text-slate-400" />
                                                            <span className="text-[11px] text-slate-400">Info</span>
                                                        </button>
                                                        <button
                                                            className="flex flex-col items-center gap-1.5 px-4 py-1 active:bg-white/5 rounded-xl transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate('/messages', { state: { contactId: contact.user_id } });
                                                            }}
                                                        >
                                                            <MessageSquare className="size-5 text-slate-400" />
                                                            <span className="text-[11px] text-slate-400">Message</span>
                                                        </button>
                                                        <button
                                                            className="flex flex-col items-center gap-1.5 px-4 py-1 active:bg-white/5 rounded-xl transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiateCall(contact.user_id, contact.full_name, contact.avatar_url || '', 'video');
                                                                setExpandedLogId(null);
                                                            }}
                                                        >
                                                            <Video className="size-5 text-slate-400" />
                                                            <span className="text-[11px] text-slate-400">Video Call</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="hidden md:block">
                                {desktopContacts.length === 0 ? (
                                    <div className="py-20 text-center text-slate-500 px-10">
                                        <PhoneOff className="size-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-sm">No recent calls found</p>
                                    </div>
                                ) : (
                                    desktopContacts.map((item: any) => {
                                        const contact = item.contact;
                                        const call = item.latestCall;
                                        const isMissed = call.status === 'missed' || call.status === 'rejected';
                                        const dateStr = isToday(new Date(call.created_at)) ? format(new Date(call.created_at), 'h:mm a') :
                                            isYesterday(new Date(call.created_at)) ? 'Yesterday' :
                                                format(new Date(call.created_at), 'EEEE');

                                        return (
                                            <div
                                                key={contact.user_id}
                                                onClick={() => setSelectedContactId(contact.user_id)}
                                                className={cn(
                                                    "flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-[#202c33] transition-colors group",
                                                    selectedContactId === contact.user_id && "bg-[#2a3942]"
                                                )}
                                            >
                                                <Avatar className="h-12 w-12 border-none">
                                                    <AvatarImage src={contact.avatar_url} />
                                                    <AvatarFallback className="bg-slate-700 text-slate-300 font-bold uppercase">
                                                        {contact.full_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <p className="font-semibold text-white truncate text-sm">
                                                            {contact.full_name}
                                                        </p>
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            {dateStr}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {isMissed ? (
                                                            <ArrowDownLeft className="size-3 text-red-500" />
                                                        ) : item.isOutgoing ? (
                                                            <ArrowUpRight className="size-3 text-emerald-500" />
                                                        ) : (
                                                            <ArrowDownLeft className="size-3 text-blue-500" />
                                                        )}
                                                        <p className={cn(
                                                            "text-[12px] truncate",
                                                            isMissed ? "text-red-500" : "text-slate-400"
                                                        )}>
                                                            {isMissed ? 'Missed' : item.isOutgoing ? 'Outgoing' : 'Incoming'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="hidden group-hover:flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-white">
                                                        <Phone className="size-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-white">
                                                        <Video className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Detail Pane */}
                <div className={cn(
                    "flex-1 flex flex-col min-h-0 bg-[#0b141a] relative",
                    !selectedContactId && "hidden md:flex items-center justify-center"
                )}>
                    {activeDetailContact ? (
                        <>
                            {/* Header */}
                            <div className="h-16 border-b border-slate-800/50 flex items-center justify-between px-6 bg-[#111b21] shrink-0">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost" size="icon"
                                        className="md:hidden -ml-2 text-slate-400"
                                        onClick={() => setSelectedContactId(null)}
                                    >
                                        <ArrowLeft className="size-5" />
                                    </Button>
                                    <h2 className="text-xl font-bold text-white">Call info</h2>
                                </div>
                                <Button
                                    variant="ghost" size="icon"
                                    className="text-slate-400 hover:bg-slate-800 rounded-full"
                                    onClick={() => setSelectedContactId(null)}
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 space-y-8">
                                    {/* Contact Hero Area */}
                                    <div className="relative group overflow-hidden bg-gradient-to-br from-[#111b21] to-[#182229] border border-slate-800/50 rounded-[2rem] p-8 shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Phone className="size-48 rotate-12" />
                                        </div>

                                        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                                            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                                <div className="relative">
                                                    <Avatar className="h-32 w-32 border-4 border-slate-800 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                                                        <AvatarImage src={activeDetailContact.avatar_url || (activeDetailContact as any).contact?.avatar_url} />
                                                        <AvatarFallback className="bg-slate-700 text-slate-200 text-4xl font-black uppercase">
                                                            {activeDetailContact.full_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-2xl border-4 border-[#111b21]">
                                                        <div className="size-3 bg-white rounded-full animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                                                        {activeDetailContact.full_name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                                                            {activeDetailContact.role || 'Contact'}
                                                        </Badge>
                                                        <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                                                            <span className="size-1 bg-slate-700 rounded-full" />
                                                            {activeDetailContact.department || 'Education Space'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center gap-3">
                                                <Button
                                                    variant="secondary"
                                                    className="rounded-2xl h-14 px-8 bg-[#202c33] hover:bg-[#2a3942] text-white border-none gap-3 shadow-xl group/btn transition-all hover:-translate-y-1"
                                                    onClick={() => navigate('/messages', { state: { contactId: selectedContactId } })}
                                                >
                                                    <MessageSquare className="size-5 text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                                                    <span className="font-bold">Message</span>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="rounded-2xl h-14 px-8 bg-[#202c33] hover:bg-[#2a3942] text-white border-none gap-3 shadow-xl group/btn transition-all hover:-translate-y-1"
                                                    onClick={() => initiateCall(selectedContactId!, activeDetailContact!.full_name, activeDetailContact!.avatar_url || '', 'video')}
                                                >
                                                    <Video className="size-5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
                                                    <span className="font-bold">Video</span>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="rounded-2xl h-14 px-8 bg-[#202c33] hover:bg-[#2a3942] text-white border-none gap-3 shadow-xl group/btn transition-all hover:-translate-y-1"
                                                    onClick={() => initiateCall(selectedContactId!, activeDetailContact!.full_name, activeDetailContact!.avatar_url || '', 'audio')}
                                                >
                                                    <Phone className="size-5 text-emerald-500 group-hover/btn:scale-110 transition-transform" />
                                                    <span className="font-bold">Audio</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logs List Area */}
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="h-px flex-1 bg-slate-800/50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Communication Logs</span>
                                            <div className="h-px flex-1 bg-slate-800/50" />
                                        </div>

                                        <div className="space-y-12">
                                            {detailLogs.map((group) => (
                                                <div key={group.date} className="space-y-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                        <h5 className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                                                            {group.date}
                                                        </h5>
                                                    </div>

                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        {group.calls.map((log: any) => {
                                                            const isOutgoing = log.caller_id === user?.id;
                                                            const isMissed = log.status === 'missed' || log.status === 'rejected';
                                                            const timeStr = format(new Date(log.created_at), 'h:mm a');

                                                            return (
                                                                <div key={log.id} className="relative group/log overflow-hidden bg-[#111b21] border border-slate-800/50 rounded-2xl p-4 hover:border-slate-700 transition-all">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={cn(
                                                                                "size-12 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover/log:scale-110",
                                                                                log.call_type === 'video' ? "bg-blue-500/10" : "bg-emerald-500/10"
                                                                            )}>
                                                                                {log.call_type === 'video' ?
                                                                                    <Video className="size-5 text-blue-400" /> :
                                                                                    <Phone className="size-5 text-emerald-400" />
                                                                                }
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <p className="text-sm font-bold text-white truncate">
                                                                                        {isOutgoing ? 'Outgoing' : 'Incoming'} Call
                                                                                    </p>
                                                                                    {isMissed && (
                                                                                        <Badge variant="secondary" className="h-5 bg-red-500/10 text-red-500 border-none text-[9px] font-black uppercase px-2 hover:bg-red-500/20">
                                                                                            Missed
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                                                                                    <span className="flex items-center gap-1.5 lowercase">
                                                                                        <Clock className="size-3" />
                                                                                        {timeStr}
                                                                                    </span>
                                                                                    {log.duration > 0 && (
                                                                                        <>
                                                                                            <span className="size-1 bg-slate-800 rounded-full" />
                                                                                            <span className="text-emerald-500/80">{formatDuration(log.duration)}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {/* Options removed as requested */}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-40 grayscale pointer-events-none">
                            <div className="size-20 rounded-3xl bg-slate-800 flex items-center justify-center">
                                <Search className="size-8 text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 max-w-[200px] text-center">
                                Select a contact to see detailed communication history
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Call Dialog */}
            <Dialog open={isNewCallOpen} onOpenChange={setIsNewCallOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-[#1f2c33] border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 pb-2 text-white">
                        <DialogTitle className="text-xl font-bold">New Call</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Search for people in your workspace
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                            <Input
                                placeholder="Name or email..."
                                className="pl-10 bg-[#111b21] border-none rounded-xl text-white h-11"
                                value={contactSearch}
                                onChange={(e) => setContactSearch(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[400px] pr-2">
                            <div className="space-y-1">
                                {filteredContacts.map(contact => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2a3942] cursor-pointer group transition-colors"
                                    >
                                        <Avatar className="h-10 w-10 border-none">
                                            <AvatarImage src={contact.avatar_url || (contact as any).avatar_url} />
                                            <AvatarFallback className="bg-slate-700 text-slate-300">
                                                {contact.full_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm truncate">{contact.full_name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none font-bold truncate">
                                                {contact.role}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100">
                                            <Button
                                                variant="ghost" size="icon" className="size-8 rounded-full text-emerald-500"
                                                onClick={() => {
                                                    initiateCall(contact.id, contact.full_name, contact.avatar_url || '', 'audio');
                                                    setIsNewCallOpen(false);
                                                }}
                                            >
                                                <Phone className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon" className="size-8 rounded-full text-blue-400"
                                                onClick={() => {
                                                    initiateCall(contact.id, contact.full_name, contact.avatar_url || '', 'video');
                                                    setIsNewCallOpen(false);
                                                }}
                                            >
                                                <Video className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
}
