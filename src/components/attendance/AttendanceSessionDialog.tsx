
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Bookmark, MessageSquare } from 'lucide-react';

interface AttendanceSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function AttendanceSessionDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData 
}: AttendanceSessionDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    note: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        session_date: initialData.session_date,
        start_time: initialData.start_time || '',
        end_time: initialData.end_time || '',
        note: initialData.note || '',
      });
    } else {
      setFormData({
        title: '',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        note: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[95vh] rounded-[2rem] p-0 border-none bg-white dark:bg-[#1a1625] shadow-2xl overflow-hidden flex flex-col">
        <DialogHeader className="p-5 md:p-6 bg-gradient-to-br from-indigo-600 to-primary text-white space-y-1 shrink-0">
          <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm mb-1">
            <Calendar className="size-5" />
          </div>
          <DialogTitle className="text-lg md:text-xl font-black tracking-tight">
            {initialData ? 'Edit Session' : 'New Session'}
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold uppercase tracking-[0.15em] text-[9px]">
            {initialData ? 'Update session details' : 'Set up a session to mark attendance'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Session Topic / Title
              </Label>
              <div className="relative">
                <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                <Input
                  id="title"
                  placeholder="e.g., Introduction to React"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-11 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold dark:bg-white/5 dark:border-white/5 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="h-11 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold dark:bg-white/5 dark:border-white/5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_time" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Start Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="h-11 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold dark:bg-white/5 dark:border-white/5 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  End Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="h-11 pl-12 rounded-xl bg-slate-50 border-slate-100 font-bold dark:bg-white/5 dark:border-white/5 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Additional Note
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-3.5 size-4 text-muted-foreground/40" />
                <Textarea
                  id="note"
                  placeholder="Any extra instructions or notes..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="min-h-[80px] pl-12 pt-3 rounded-2xl bg-slate-50 border-slate-100 font-bold dark:bg-white/5 dark:border-white/5 text-sm"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11 rounded-xl font-black uppercase tracking-widest text-[9px] flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[9px] flex-1 shadow-lg shadow-primary/20"
            >
              {initialData ? 'Update Session' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
