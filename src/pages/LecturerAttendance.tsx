
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  useAttendance, 
  useClassAttendanceStats, 
  AttendanceSession, 
  StudentAttendanceDetail 
} from '@/hooks/useAttendance';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  Clock, 
  Plus, 
  ChevronLeft, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  TrendingUp,
  LayoutGrid,
  ListFilter,
  ArrowUpDown,
  FileDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { AttendanceSessionDialog } from '../components/attendance/AttendanceSessionDialog';
import { AttendanceMarkingDialog } from '../components/attendance/AttendanceMarkingDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LecturerAttendance() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const currentClass = classes.find(c => c.id === classId);

  const { 
    sessions, 
    sessionsLoading, 
    createSession, 
    updateSession, 
    fetchSessionRecords,
    saveAttendance 
  } = useAttendance(classId || '');

  const { data: studentStats, isLoading: statsLoading } = useClassAttendanceStats(classId || '');

  const handleExportCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;

    const headers = ['Student Name', 'Reg Number', 'Present', 'Late', 'Absent', 'Excused', 'Percentage (%)'];
    const rows = filteredStudents.map(s => [
      s.student_name,
      s.register_number,
      s.stats.present,
      s.stats.late,
      s.stats.absent,
      s.stats.excused,
      `${s.stats.percentage}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${currentClass?.course_code}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  const Sparkline = ({ data }: { data: (string | null)[] }) => {
    if (!data || data.length === 0) return null;
    
    const colors = {
      'present': '#10b981',
      'late': '#f59e0b',
      'absent': '#ef4444',
      'excused': '#6366f1',
      'null': '#e2e8f0'
    };

    return (
      <div className="flex items-center gap-1">
        {data.map((status, i) => (
          <div 
            key={i} 
            className="w-1.5 h-4 rounded-full transition-all duration-500 hover:h-6"
            style={{ 
              backgroundColor: colors[status as keyof typeof colors] || colors.null,
              opacity: status ? 1 : 0.2
            }}
          />
        ))}
      </div>
    );
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isMarkingDialogOpen, setIsMarkingDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [activeTab, setActiveTab] = useState('sessions');

  // Statistics Calculation
  const totalSessions = sessions?.length || 0;
  const avgAttendance = studentStats 
    ? Math.round(studentStats.reduce((sum, s) => sum + s.stats.percentage, 0) / (studentStats.length || 1)) 
    : 0;
  
  const atRiskCount = studentStats?.filter(s => s.stats.percentage < 75 && s.stats.total > 0).length || 0;

  // Filtering
  const filteredSessions = sessions?.filter(session => 
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(new Date(session.session_date), 'PPP').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = studentStats?.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.register_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSession = async (data: any) => {
    await createSession.mutateAsync(data);
    setIsSessionDialogOpen(false);
  };

  const handleEditSession = (session: AttendanceSession) => {
    setSelectedSession(session);
    setIsSessionDialogOpen(true);
  };

  const handleMarkAttendance = (session: AttendanceSession) => {
    setSelectedSession(session);
    setIsMarkingDialogOpen(true);
  };

  const handleUpdateSession = async (data: any) => {
    if (selectedSession) {
      await updateSession.mutateAsync({ id: selectedSession.id, ...data });
    }
    setIsSessionDialogOpen(false);
    setSelectedSession(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 w-full pb-10">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-4 md:px-0">
          <button 
            onClick={() => navigate(`/all-students`)}
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            Classes
          </button>
          <span className="opacity-20">/</span>
          <span className="text-primary/80">Attendance Management</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4 md:px-0 pt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl border border-primary/20 shrink-0">
                <Calendar className="size-5 md:size-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-4xl font-black tracking-tight text-foreground leading-tight truncate">
                  Attendance Tracker
                </h1>
                <p className="text-[9px] md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                  {currentClass?.course_code} - {currentClass?.class_name || "All Students"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => { setSelectedSession(null); setIsSessionDialogOpen(true); }}
              className="h-10 md:h-12 flex-1 md:flex-none px-6 rounded-xl md:rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[10px] md:text-xs gap-2"
            >
              <Plus className="size-4 md:size-5" />
              <span>Create Session</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
          <Card className="border-none bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-slate-100 dark:border-white/5 group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="size-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <History className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate">Total Sessions</p>
                <p className="text-xl font-black text-foreground">{totalSessions}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-slate-100 dark:border-white/5 group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="size-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate">Avg. Attendance</p>
                <p className="text-xl font-black text-foreground">{avgAttendance}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-white dark:bg-white/5 shadow-sm rounded-2xl border border-slate-100 dark:border-white/5 group overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="size-10 bg-amber-500/10 rounded-xl text-amber-500 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest truncate">Last Session</p>
                <p className="text-xl font-black text-foreground uppercase text-[10px] truncate">
                  {sessions && sessions[0] ? format(new Date(sessions[0].session_date), 'MMM d') : 'No Data'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-none shadow-sm rounded-2xl border group overflow-hidden transition-all duration-300 hover:shadow-md",
            atRiskCount > 0 
              ? "bg-rose-500/5 border-rose-500/10" 
              : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5"
          )}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0",
                atRiskCount > 0 ? "bg-rose-500/20 text-rose-500" : "bg-slate-500/10 text-slate-500"
              )}>
                <AlertCircle className="size-5" />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-widest truncate",
                  atRiskCount > 0 ? "text-rose-500" : "text-muted-foreground"
                )}>At Risk</p>
                <p className="text-xl font-black text-foreground">{atRiskCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Navigation & Search */}
        <div className="px-4 md:px-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center gap-3">
              {/* Modern Search Bar */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  placeholder={activeTab === 'sessions' ? "Find sessions..." : "Find students..."}
                  className="w-full h-12 pl-11 pr-4 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl text-[11px] md:text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Switcher Dropdown */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <FileDown className="size-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-12 w-12 md:w-auto md:px-6 rounded-2xl bg-white/10 backdrop-blur-xl border-slate-200 dark:border-white/10 font-bold gap-2">
                      <ListFilter className="size-5 md:size-4" />
                      <span className="hidden md:inline uppercase text-[10px] tracking-widest font-black">View Category</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-2xl border-slate-200 dark:border-white/10 p-2">
                    <DropdownMenuItem 
                      onClick={() => setActiveTab('sessions')}
                      className={cn(
                        "rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest p-3",
                        activeTab === 'sessions' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      )}
                    >
                      <History className="size-4" />
                      Attendance Sessions
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setActiveTab('insights')}
                      className={cn(
                        "rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest p-3",
                        activeTab === 'insights' ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      )}
                    >
                      <TrendingUp className="size-4" />
                      Student Insights
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="sessions" className="m-0 focus-visible:ring-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(sessionsLoading) ? (
                  [1, 2, 3].map(i => (
                    <Card key={i} className="rounded-3xl border border-border/50 bg-slate-500/5 h-48 flex flex-col p-6 gap-4">
                       <Skeleton className="h-4 w-16 rounded-full" />
                       <Skeleton className="h-6 w-3/4 rounded-lg" />
                       <div className="flex gap-2">
                         <Skeleton className="h-4 w-4 rounded-md" />
                         <Skeleton className="h-4 w-24 rounded-md" />
                       </div>
                       <div className="mt-auto pt-4 border-t border-border/10">
                         <Skeleton className="h-4 w-24 rounded-md" />
                       </div>
                    </Card>
                  ))
                ) : filteredSessions && filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <Card 
                      key={session.id} 
                      className="rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                              <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20 mb-1 md:mb-2 px-1.5 md:px-2.5">
                                {format(new Date(session.session_date), 'EEEE')}
                              </Badge>
                              <h3 className="text-sm md:text-lg font-black text-foreground truncate group-hover:text-primary transition-colors pr-2">
                                {session.title || 'Untitled Session'}
                              </h3>
                              <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                                <Calendar className="size-3 md:size-3.5" />
                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider">
                                  {format(new Date(session.session_date), 'PPP')}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                               <Button 
                                 onClick={() => handleMarkAttendance(session)}
                                 className="size-8 md:size-10 rounded-lg md:rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/20 shrink-0"
                               >
                                 <CheckCircle2 className="size-4 md:size-5" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="size-8 md:size-10 rounded-lg md:rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-muted-foreground shrink-0"
                                 onClick={() => handleEditSession(session)}
                               >
                                 <MoreVertical className="size-4 md:size-5" />
                               </Button>
                            </div>
                          </div>

                          {session.note && (
                            <p className="text-[9px] md:text-[10px] text-muted-foreground/60 italic leading-relaxed line-clamp-1 bg-slate-500/[0.03] p-2 md:p-3 rounded-lg md:rounded-xl border border-border/30">
                              "{session.note}"
                            </p>
                          )}
                        </div>

                        <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-500/[0.03] border-t border-border/30 flex items-center justify-between">
                          <button 
                            onClick={() => handleMarkAttendance(session)}
                            className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-[0.15em] hover:underline"
                          >
                            Mark Records
                          </button>
                          <Avatar className="size-5 border-none opacity-40 ring-1 ring-primary/20">
                            <AvatarFallback className="text-[6px] font-black bg-primary/5">ID</AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center text-center px-10">
                    <div className="p-8 bg-slate-500/5 rounded-full border border-border/50 mb-6 group">
                      <Calendar className="size-12 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">No sessions found</h3>
                    <p className="text-slate-500 font-bold max-w-sm mx-auto text-sm">
                      Create an attendance session to start tracking student presence.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="m-0 focus-visible:ring-0">
               <div className="bg-white/5 dark:bg-white/[0.03] backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                  <div className="hidden md:grid grid-cols-[2fr,1fr,1.5fr,1fr] gap-4 p-6 bg-slate-500/10 items-center border-b border-border/10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Student Profile</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Registration</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Engagement Balance</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right pr-4">Total Weight</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {statsLoading ? (
                      [1,2,3,4,5].map(i => (
                        <div key={i} className="p-6 grid grid-cols-[2fr,1fr,1.5fr,1fr] gap-4 items-center">
                           <div className="flex items-center gap-3">
                              <Skeleton className="size-11 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-32 rounded-lg" />
                                <Skeleton className="h-3 w-20 rounded-lg opacity-50" />
                              </div>
                           </div>
                           <Skeleton className="h-4 w-16 mx-auto rounded-lg" />
                           <div className="flex justify-center gap-2">
                             {[1,2,3,4].map(j => <Skeleton key={j} className="size-8 rounded-lg" />)}
                           </div>
                           <div className="flex justify-end gap-2">
                             <Skeleton className="h-2 w-24 rounded-full" />
                             <Skeleton className="h-5 w-10 rounded-md" />
                           </div>
                        </div>
                      ))
                    ) : (filteredStudents && filteredStudents.length > 0) ? (
                      filteredStudents.map((s) => (
                        <div key={s.enrollment_id} className="p-4 md:p-6 flex flex-col md:grid md:grid-cols-[2fr,1fr,1.5fr,1fr] gap-4 items-start md:items-center group hover:bg-primary/[0.02] transition-all">
                           {/* Student Profile Row */}
                           <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="size-9 md:size-11 border-2 border-primary/10 shadow-sm">
                                    <AvatarImage src={s.student_image_url || undefined} />
                                    <AvatarFallback className="text-[10px] md:text-xs font-black bg-slate-100 text-slate-500">
                                      {s.student_name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className={cn(
                                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white dark:border-slate-900",
                                    s.stats.percentage >= 75 ? "bg-emerald-500" : s.stats.percentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                                  )} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-[12px] md:text-sm text-foreground tracking-tight truncate">{s.student_name}</h4>
                                    {s.trends.isFlagged && (
                                      <Badge className="bg-rose-500 text-white border-none text-[7px] font-black uppercase tracking-tighter animate-pulse h-4 px-1">
                                        Risk Alert
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                    UID: {s.register_number}
                                  </p>
                                </div>
                              </div>
                              {/* Mobile-only Trend/Sparkline */}
                              <div className="md:hidden">
                                <Sparkline data={s.trends.sparkline || []} />
                              </div>
                           </div>

                           {/* Registration & Trend Info - Tablet+ */}
                           <div className="hidden md:flex flex-col items-center gap-1.5">
                             <span className="font-black text-[11px] text-muted-foreground/40 tabular-nums">{s.register_number}</span>
                             <Sparkline data={s.trends.sparkline || []} />
                           </div>

                           {/* Status Counters - Mobile Friendly Row */}
                           <div className="flex items-center justify-between md:justify-center gap-1 w-full md:w-auto p-2.5 md:p-0 bg-slate-500/[0.03] md:bg-transparent rounded-xl">
                              <div className="flex flex-col items-center px-1 md:px-2">
                                <span className="text-[11px] md:text-[12px] font-black text-emerald-500/80">{s.stats.present}</span>
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground/30">Pres</span>
                              </div>
                              <div className="w-px h-6 bg-slate-200 dark:bg-white/5" />
                              <div className="flex flex-col items-center px-1 md:px-2">
                                <span className="text-[11px] md:text-[12px] font-black text-amber-500/80">{s.stats.late}</span>
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground/30">Late</span>
                              </div>
                              <div className="w-px h-6 bg-slate-200 dark:bg-white/5" />
                              <div className="flex flex-col items-center px-1 md:px-2">
                                <span className="text-[11px] md:text-[12px] font-black text-rose-500/80">{s.stats.absent}</span>
                                <span className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground/30">Abs</span>
                              </div>
                              <div className="w-px h-6 bg-slate-200 dark:bg-white/5" />
                              <div className="flex flex-col items-center px-1 md:px-2 text-center">
                                <div className="flex flex-col items-center">
                                  <span className={cn(
                                    "text-[11px] md:text-[12px] font-black",
                                    s.trends.percentageDrop >= 10 ? "text-rose-600" : "text-slate-400"
                                  )}>
                                    {s.trends.percentageDrop > 0 ? `-${s.trends.percentageDrop}%` : '--'}
                                  </span>
                                  <span className="text-[7px] md:text-[8px] font-black uppercase text-muted-foreground/30">Trend</span>
                                </div>
                              </div>
                           </div>

                           {/* Percentage Bar & Badge - Desktop only */}
                           <div className="hidden md:flex items-center justify-end gap-3 pr-4">
                              <div className="w-24 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden hidden lg:block">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    s.stats.percentage >= 75 ? "bg-emerald-500" : s.stats.percentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                                  )}
                                  style={{ width: `${s.stats.percentage}%` }}
                                />
                              </div>
                              <div className={cn(
                                "min-w-[50px] text-right font-black text-[13px] tracking-tight",
                                s.stats.percentage >= 75 ? "text-emerald-500" : s.stats.percentage >= 50 ? "text-amber-500" : "text-rose-500"
                              )}>
                                {s.stats.percentage}%
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center px-10">
                        <Users className="size-12 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No engagement data found for this class</p>
                      </div>
                    )}
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AttendanceSessionDialog 
        isOpen={isSessionDialogOpen} 
        onClose={() => setIsSessionDialogOpen(false)}
        onSubmit={selectedSession ? handleUpdateSession : handleCreateSession}
        initialData={selectedSession}
      />

      <AttendanceMarkingDialog 
        isOpen={isMarkingDialogOpen} 
        onClose={() => setIsMarkingDialogOpen(false)}
        session={selectedSession}
        fetchRecords={fetchSessionRecords}
        onSave={async (records) => {
          if (selectedSession) {
            await saveAttendance.mutateAsync({ sessionId: selectedSession.id, records });
            setIsMarkingDialogOpen(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
