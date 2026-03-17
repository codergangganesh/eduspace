
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Search, 
  Users,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StudentAttendanceDetail, AttendanceStatus, AttendanceSession } from '@/hooks/useAttendance';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AttendanceMarkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: AttendanceSession | null;
  fetchRecords: (sessionId: string) => Promise<StudentAttendanceDetail[]>;
  onSave: (records: StudentAttendanceDetail[]) => Promise<void>;
}

export function AttendanceMarkingDialog({
  isOpen,
  onClose,
  session,
  fetchRecords,
  onSave,
}: AttendanceMarkingDialogProps) {
  const [students, setStudents] = useState<StudentAttendanceDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      loadData();
    }
  }, [isOpen, session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchRecords(session.id);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (enrollment_id: string, status: AttendanceStatus) => {
    triggerHaptic('light');
    setStudents(prev => prev.map(s => 
      s.enrollment_id === enrollment_id ? { ...s, status } : s
    ));
  };

  const handleMarkAllPresent = async () => {
    setIsMarkingAll(true);
    triggerHaptic('medium');
    
    // Simulate a brief calculation/processing delay for visual polish
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' })));
    setIsMarkingAll(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.register_number.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      present: students.filter(s => s.status === 'present').length,
      absent: students.filter(s => s.status === 'absent').length,
      late: students.filter(s => s.status === 'late').length,
      excused: students.filter(s => s.status === 'excused').length,
    };
  }, [students]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(students);
      triggerHaptic('success');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const statusConfig: Record<AttendanceStatus, { label: string, color: string, icon: any }> = {
    present: { label: 'Present', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    absent: { label: 'Absent', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: XCircle },
    late: { label: 'Late', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Clock },
    excused: { label: 'Excused', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', icon: HelpCircle },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] h-[90vh] flex flex-col rounded-[2.5rem] p-0 border-none bg-white dark:bg-[#1a1625] shadow-2xl overflow-hidden">
        <DialogHeader className="p-5 md:p-6 bg-slate-900 text-white shrink-0 relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Users className="size-20" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="outline" className="text-[7px] font-black uppercase tracking-[0.2em] border-white/20 text-white/60 mb-1">
                Marking Attendance
              </Badge>
              <DialogTitle className="text-lg md:text-2xl font-black tracking-tight leading-none">
                {session?.title || 'Untitled Session'}
              </DialogTitle>
              <p className="text-[9px] md:text-xs font-bold text-white/40 uppercase tracking-widest">
                {session?.session_date ? format(new Date(session.session_date), 'EEEE, MMMM do, yyyy') : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-1 md:pb-0">
               {Object.entries(stats).map(([key, val]) => {
                 if (key === 'total') return null;
                 return (
                   <div key={key} className="flex flex-col items-center min-w-[40px]">
                      <span className="text-sm md:text-lg font-black">{val}</span>
                      <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">{key}</span>
                   </div>
                 );
               })}
               <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />
               <div className="flex flex-col items-center min-w-[40px]">
                  <span className="text-sm md:text-lg font-black text-primary">{stats.total}</span>
                  <span className="text-[7px] font-black uppercase tracking-tighter opacity-40">Total</span>
               </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 md:p-5 bg-slate-500/5 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
           <div className="relative w-full sm:w-[250px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
             <Input 
               placeholder="Search student..."
               className="h-9 pl-10 rounded-xl bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 font-bold text-xs"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>

           <Button 
             variant="outline" 
             disabled={isMarkingAll || students.length === 0}
             className="w-full sm:w-auto h-9 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 font-black uppercase tracking-widest text-[9px] gap-2 shrink-0 bg-white"
             onClick={handleMarkAllPresent}
           >
             {isMarkingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
             {isMarkingAll ? 'Marking...' : 'Mark All Present'}
           </Button>
        </div>

        <ScrollArea className="flex-1 px-4 md:px-5">
          <div className="py-3 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading students...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div 
                  key={student.enrollment_id} 
                  className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Avatar className="size-9 md:size-10 border-2 border-primary/10">
                      <AvatarImage src={student.profile_image || undefined} />
                      <AvatarFallback className="text-[10px] font-black bg-primary/5 text-primary">
                        {student.student_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-black text-xs text-foreground truncate">{student.student_name}</h4>
                      <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        {student.register_number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 w-full sm:w-auto justify-center">
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const isActive = student.status === status;
                      const Icon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.enrollment_id, status as AttendanceStatus)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg border transition-all flex-1 sm:w-14 sm:flex-none",
                            isActive 
                              ? config.color 
                              : "bg-transparent border-transparent text-muted-foreground/30 hover:bg-slate-500/5"
                          )}
                        >
                          <Icon className={cn("size-3.5", isActive ? "animate-in zoom-in-75 duration-300" : "")} />
                          <span className="text-[6px] font-black uppercase tracking-tighter">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center px-10">
                <Users className="size-10 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">No students found</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 md:p-6 border-t border-border/50 bg-slate-50 dark:bg-transparent shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left opacity-60">
              Ensure all students are marked correctly before saving.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="h-10 rounded-xl font-black uppercase tracking-widest text-[9px] px-4"
              >
                Discard
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving || loading || students.length === 0}
                className="h-10 flex-1 sm:flex-none px-8 rounded-xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 gap-2"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

