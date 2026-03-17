
import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useStudentAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle,
  AlertTriangle,
  FileText,
  Filter,
  Users,
  PieChart,
  ArrowRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudentAttendance() {
  const { classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  const { records, stats, isLoading } = useStudentAttendance(
    selectedClassId === 'all' ? undefined : selectedClassId
  );

  const statusConfig = {
    present: { label: 'Present', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    absent: { label: 'Absent', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    late: { label: 'Late', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    excused: { label: 'Excused', icon: HelpCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    pending: { label: 'Not Marked', icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  };

  const isLowAttendance = stats && stats.total > 0 && stats.percentage < 75;

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto w-full pb-10 px-4 md:px-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 md:pt-4">
          <div className="space-y-3">
             <div className="flex items-center gap-3 md:gap-4">
                <div className="p-3 md:p-4 bg-primary/10 rounded-2xl md:rounded-[2rem] border border-primary/20 shadow-sm shrink-0">
                  <PieChart className="size-6 md:size-8 text-primary shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between md:justify-start gap-4">
                      <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground leading-tight truncate">
                        Attendance Record
                      </h1>
                      
                      {/* Status Alert Badge - Visible on all screens */}
                      {isLowAttendance && (
                        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1 md:py-1.5 bg-rose-500/10 text-rose-500 rounded-lg md:rounded-xl border border-rose-500/20 shrink-0 animate-pulse transition-all">
                           <AlertTriangle className="size-3.5 md:size-4 fill-rose-500/20" />
                           <span className="text-[9px] md:text-xs font-black uppercase tracking-tighter md:tracking-widest">Action Required</span>
                        </div>
                      )}
                   </div>
                   
                   <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                      <div className="h-0.5 md:h-1 w-6 md:w-8 bg-primary rounded-full" />
                      <p className="text-[9px] md:text-xs text-slate-500 font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">
                        Your academic presence
                      </p>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 lg:w-[280px] group">
              <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block group-hover:text-primary transition-colors">Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="h-10 md:h-14 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md border-slate-200/50 dark:border-white/10 font-bold shadow-sm">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-2xl">
                  <SelectItem value="all" className="font-bold">All Enrolled</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">
                      {c.course_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden xl:flex items-center gap-2 px-6 h-14 bg-slate-500/5 rounded-2xl border border-dashed border-slate-500/20">
               <Users className="size-4 text-muted-foreground/40" />
               <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                 {classes.length} Enrolled
               </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="w-full">
          
          {/* Main Column: Stats & History */}
          <div className="space-y-6 md:space-y-10">
            {/* Stats Summary - Horizontal on Desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
               {/* Total Sessions Card */}
               <Card className="rounded-2xl border-none bg-white/20 dark:bg-white/5 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all duration-300 hover:bg-white/30 group">
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-3 rounded-xl bg-slate-500/10 text-slate-500 shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Users className="size-5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Sessions</p>
                        <p className="text-xl font-black text-foreground tracking-tight">{isLoading ? '...' : stats?.total}</p>
                     </div>
                  </CardContent>
               </Card>

               {/* Present Card */}
               <Card className="rounded-2xl border-none bg-white/20 dark:bg-white/5 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all duration-300 hover:bg-white/30 group">
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle2 className="size-5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Present</p>
                        <p className="text-xl font-black text-emerald-500 tracking-tight">{isLoading ? '...' : stats?.present}</p>
                     </div>
                  </CardContent>
               </Card>

               {/* Absent Card */}
               <Card className="rounded-2xl border-none bg-white/20 dark:bg-white/5 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden transition-all duration-300 hover:bg-white/30 group">
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 group-hover:bg-rose-500/20 transition-colors">
                        <XCircle className="size-5" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Absent</p>
                        <p className="text-xl font-black text-rose-500 tracking-tight">{isLoading ? '...' : stats?.absent}</p>
                     </div>
                  </CardContent>
               </Card>

               {/* Percentage Card */}
               <Card className={cn(
                 "rounded-2xl border-none shadow-sm backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-white/30 group border",
                 isLowAttendance ? "bg-rose-500/5 border-rose-500/10" : "bg-primary/5 border-primary/10"
               )}>
                  <CardContent className="p-4 flex items-center gap-4">
                     <div className={cn(
                       "p-3 rounded-xl shrink-0 transition-colors",
                       isLowAttendance ? "bg-rose-500/20 text-rose-500" : "bg-primary/20 text-primary"
                     )}>
                        <PieChart className="size-5" />
                     </div>
                     <div>
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          isLowAttendance ? "text-rose-500" : "text-primary/70"
                        )}>Rate %</p>
                        <p className={cn(
                          "text-xl font-black tracking-tight",
                          isLowAttendance ? "text-rose-600" : "text-primary"
                        )}>{isLoading ? '...%' : `${stats?.percentage}%`}</p>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* History Section */}
            <div className="space-y-4 px-1 md:px-0">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-primary rounded-full" />
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-foreground/80">Detailed History</h3>
                  </div>
                  <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-white/10 text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-0">
                    Latest
                  </Badge>
               </div>

               <div className="bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-sm">
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid grid-cols-[1.8fr,1.5fr,1.2fr,1fr] gap-4 p-5 bg-slate-500/[0.03] items-center border-b border-border/10">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Context</span>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">Session</span>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">Status</span>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-right pr-4">Time</span>
                  </div>

                  <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                    {isLoading ? (
                      [1,2,3,4].map(i => (
                        <div key={i} className="p-4 md:p-6 flex items-center gap-4">
                           <Skeleton className="size-8 md:size-10 rounded-lg md:rounded-xl flex-shrink-0" />
                           <div className="flex-1 space-y-2">
                              <Skeleton className="h-2.5 w-1/3 rounded-lg" />
                              <Skeleton className="h-2 w-1/4 rounded-lg opacity-50" />
                           </div>
                        </div>
                      ))
                    ) : records && records.length > 0 ? (
                      records.map((record: any) => {
                        const classInfo = classes.find(c => c.id === record.class_id);
                        const config = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.pending;
                        const Icon = config.icon;

                        return (
                          <div key={record.id} className="group hover:bg-white/20 dark:hover:bg-white/[0.02] transition-all p-4 md:p-5 flex flex-col md:grid md:grid-cols-[1.8fr,1.5fr,1.2fr,1fr] gap-3 md:gap-4 items-start md:items-center">
                             
                             {/* Context & Class - Mobil Friendly Row */}
                             <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="p-2 md:p-2.5 rounded-lg md:rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                                   <FileText className="size-4 md:size-5 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                   <div className="flex items-center justify-between md:justify-start gap-2">
                                      <h4 className="font-black text-[12px] md:text-[13px] text-foreground tracking-tight truncate">{classInfo?.course_code || 'N/A'}</h4>
                                      {/* Mobile-only status badge inside the row */}
                                      <div className="md:hidden">
                                        <Badge className={cn("rounded-md px-2 py-0.5 font-black text-[7px] uppercase tracking-widest border-none shadow-none gap-1", config.bg, config.color)}>
                                          <Icon className="size-2" />
                                          {config.label}
                                        </Badge>
                                      </div>
                                   </div>
                                   <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40 leading-none truncate mt-0.5">
                                      {classInfo?.class_name || 'Classroom Session'} • {record.session?.title || 'General'}
                                   </p>
                                </div>
                             </div>

                             {/* Session Date - Integrated on Mobile */}
                             <div className="flex items-center md:flex-col md:items-center gap-2 md:gap-1 w-full md:w-auto px-1 md:px-0">
                                <div className="flex items-center gap-1.5 bg-slate-500/5 md:bg-transparent px-2 py-0.5 md:p-0 rounded-full">
                                   <Calendar className="size-2.5 text-muted-foreground/50" />
                                   <p className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase">
                                      {format(new Date(record.session?.session_date || record.created_at), 'MMMM d, yyyy')}
                                   </p>
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-white/5 flex-1 md:hidden" />
                                <div className="flex items-center gap-1 md:hidden">
                                   <Clock className="size-2.5 text-muted-foreground/30" />
                                   <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                      {format(new Date(record.created_at), 'p')}
                                   </p>
                                </div>
                             </div>

                             {/* Status - Desktop Only Badge Column */}
                             <div className="hidden md:flex justify-center">
                                <Badge className={cn(
                                  "rounded-xl px-3.5 py-1.5 font-black text-[9px] uppercase tracking-widest border-none shadow-none gap-2 transition-all duration-300", 
                                  config.bg, 
                                  config.color
                                )}>
                                   <Icon className="size-3" />
                                   {config.label}
                                </Badge>
                             </div>

                             {/* Registration Time - Desktop Only */}
                             <div className="hidden md:flex flex-col items-end pr-4 text-right opacity-60">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Recorded</p>
                                <p className="text-[11px] font-black text-foreground tracking-tighter leading-none italic">
                                   {format(new Date(record.created_at), 'p')}
                                </p>
                             </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-24 flex flex-col items-center justify-center text-center px-10">
                        <History className="size-10 text-slate-300 mb-4 opacity-20" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 leading-relaxed">
                          Clean Slate • No Data
                        </p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function History({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  );
}
