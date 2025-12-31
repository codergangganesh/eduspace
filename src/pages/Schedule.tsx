import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  BookOpen,
  CalendarDays,
  Grid3X3,
  List,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSchedule, Schedule as ScheduleType } from "@/hooks/useSchedule";
import { toast } from "sonner";

interface ClassEvent {
  id: string;
  title: string;
  type: "lecture" | "lab" | "tutorial" | "exam";
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  color: string;
  dayOfWeek: number;
  lecturerName: string;
  subjectName: string;
  notes?: string;
  specificDate?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "assignment" | "exam" | "class";
  color: string;
  details?: string;
}

// Convert Supabase schedule to ClassEvent format
const convertToClassEvent = (schedule: any): ClassEvent => ({
  id: schedule.id,
  title: schedule.title,
  type: schedule.type as ClassEvent['type'],
  startTime: schedule.start_time?.slice(0, 5) || "08:00",
  endTime: schedule.end_time?.slice(0, 5) || "09:00",
  location: schedule.location || undefined,
  instructor: schedule.course_title || undefined,
  color: schedule.color || "bg-blue-500",
  dayOfWeek: schedule.day_of_week,
  lecturerName: schedule.lecturer_name || "Unknown Lecturer",
  subjectName: schedule.subject_name || schedule.title || "Unknown Subject",
  notes: schedule.notes,
  specificDate: schedule.specific_date
});

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const { role, profile, user } = useAuth();
  const { schedules, assignments, createSchedule, updateSchedule, deleteSchedule, loading } = useSchedule();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    subjectName: "",
    lecturerName: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "lecture",
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    notes: ""
  });

  // Pre-fill lecturer name for lecturers
  useEffect(() => {
    if (role === 'lecturer' && profile?.full_name) {
      setFormData(prev => ({ ...prev, lecturerName: profile.full_name || "" }));
    }
  }, [role, profile]);

  const isStudent = role === "student";

  const weeklySchedule: ClassEvent[] = schedules.map(convertToClassEvent);

  // Helper to get next occurrence of a schedule for Mixed Upcoming Events
  const getNextOccurrence = (schedule: ScheduleType) => {
    // If specific date, use it
    if (schedule.specific_date) return new Date(schedule.specific_date);

    // If recurring, find next date matching day_of_week
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sun
    const scheduleDay = schedule.day_of_week;

    let daysUntil = scheduleDay - currentDay;
    // If schedule day is past in this week, or today but time passed (simplified Check), jump to next week
    // For simplicity, just check day. Precise time check would need parsing HH:MM
    if (daysUntil < 0) {
      daysUntil += 7;
    } else if (daysUntil === 0) {
      // Check if time passed? Let's assume if it's today we include it for now, 
      // to be safe we can check current time but typically "upcoming" includes today's remaining.
      // For strict "upcoming", we might check time.
      const now = format(new Date(), "HH:mm");
      if (schedule.start_time < now) {
        daysUntil += 7;
      }
    }

    return addDays(today, daysUntil);
  };

  const mixedUpcomingEvents: CalendarEvent[] = [
    // Schedules converted to generic events
    ...schedules.map(p => ({
      id: p.id,
      title: p.subject_name || p.title,
      date: getNextOccurrence(p),
      type: "class" as const,
      color: p.color || "bg-blue-500",
      details: `${p.start_time?.slice(0, 5)} - ${p.end_time?.slice(0, 5)}`
    })),
    // Assignments
    ...(assignments || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      date: new Date(a.due_date),
      type: "assignment" as const,
      color: "bg-orange-500",
      details: "Due"
    }))
  ]
    .filter(e => {
      // Filter out past events (allow today)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return e.date >= todayStart;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5); // Top 5

  const displayWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
  const displayWeekEnd = addDays(displayWeekStart, 6);

  // Filter assignments for the current view week for Summary
  const assignmentsThisWeek = (assignments || []).filter((a: any) => {
    const d = new Date(a.due_date);
    return d >= displayWeekStart && d <= displayWeekEnd;
  });

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDay = (dayIndex: number) => {
    const columnDate = addDays(displayWeekStart, dayIndex);
    const columnDateStr = format(columnDate, "yyyy-MM-dd");

    return weeklySchedule.filter((event) => {
      if (event.specificDate) {
        return event.specificDate === columnDateStr;
      }
      return event.dayOfWeek === dayIndex; // Recurring
    });
  };

  const getEventPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startHour = 8;
    const position = ((hours - startHour) * 60 + minutes) / 60;
    return Math.max(0, position * 80); // 80px per hour
  };

  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return Math.max(40, (duration / 60) * 80); // Min height 40px
  };

  const getTypeLabel = (type: ClassEvent["type"]) => {
    const labels: Record<string, string> = {
      lecture: "Lecture",
      lab: "Lab",
      tutorial: "Tutorial",
      exam: "Exam",
      event: "Event",
    };
    return labels[type] || type;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subjectName: "",
      lecturerName: role === 'lecturer' ? profile?.full_name || "" : "",
      date: format(new Date(), "yyyy-MM-dd"),
      type: "lecture",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      notes: ""
    });
    setEditingEventId(null);
  };

  // valid start times from 08:30 to 16:00 (every 45 mins)
  const validStartTimes = [
    "08:30", "09:15", "10:00", "10:45", "11:30", "12:15",
    "13:00", "13:45", "14:30", "15:15", "16:00"
  ];

  // Helper to get valid end times based on start time (up to 16:45)
  // End times should align with the 45 min structure
  const validEndTimesList = [
    "09:15", "10:00", "10:45", "11:30", "12:15",
    "13:00", "13:45", "14:30", "15:15", "16:00", "16:45"
  ];

  const getValidEndTimes = (startTime: string) => {
    return validEndTimesList.filter(t => t > startTime);
  };

  const EVENT_COLORS = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
    "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
    "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
    "bg-pink-500", "bg-rose-500"
  ];

  const getEventColor = (day: number, time: string) => {
    // deterministic hash
    const timeVal = parseInt(time.replace(":", ""));
    const hash = (day * 37 + timeVal) % EVENT_COLORS.length;
    return EVENT_COLORS[hash];
  };

  const handleCreateEvent = async () => {
    const { title, date, startTime, endTime, lecturerName, subjectName, location, notes } = formData;

    if (!title || !date || !startTime || !endTime || !lecturerName || !subjectName || !location || !notes) {
      toast.error("Please fill in all required fields (including Classroom and Notes)");
      return;
    }

    const dayOfWeek = new Date(date).getDay();
    const color = getEventColor(dayOfWeek, startTime);

    const result = await createSchedule({
      title,
      subject_name: subjectName,
      lecturer_name: lecturerName,
      type: formData.type as any,
      specific_date: date,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location, // Now mapped to Classroom label
      notes,
      color, // Auto-assigned color
      is_recurring: true
    });

    if (result.success) {
      toast.success("Event added successfully");
      setIsAddEventOpen(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to add event");
    }
  };

  const handleEditClick = (event: ClassEvent) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      subjectName: event.subjectName,
      lecturerName: event.lecturerName,
      date: event.specificDate || format(new Date(), "yyyy-MM-dd"), // Fallback if recurring
      type: event.type,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || "",
      notes: event.notes || ""
    });
    setIsEditEventOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEventId) return;

    const { title, date, startTime, endTime, lecturerName, subjectName, location, notes } = formData;

    if (!title || !date || !startTime || !endTime || !lecturerName || !subjectName || !location || !notes) {
      toast.error("Please fill in all required fields (including Classroom and Notes)");
      return;
    }

    const dayOfWeek = new Date(date).getDay();
    const color = getEventColor(dayOfWeek, startTime);

    const result = await updateSchedule(editingEventId, {
      title,
      subject_name: subjectName,
      lecturer_name: lecturerName,
      type: formData.type as any,
      specific_date: date,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      location,
      notes,
      color, // Update color based on new time
    });

    if (result.success) {
      toast.success("Event updated successfully");
      setIsEditEventOpen(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to update event");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      const result = await deleteSchedule(id);
      if (result.success) {
        toast.success("Event deleted");
        setIsEditEventOpen(false); // If open
      } else {
        toast.error(result.error || "Failed to delete event");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">Manage your class timetable and events</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-surface p-1">
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                <Grid3X3 className="size-4 mr-1" />
                Week
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4 mr-1" />
                List
              </Button>
            </div>

            {!isStudent && (
              <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="size-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Add/Edit Form Fields */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Lecture 1"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subjectName">Subject Name *</Label>
                      <Input
                        id="subjectName"
                        placeholder="e.g. Computer Science 101"
                        value={formData.subjectName}
                        onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lecturerName">Lecturer Name *</Label>
                      <Input
                        id="lecturerName"
                        placeholder="e.g. Dr. Smith"
                        value={formData.lecturerName}
                        onChange={(e) => setFormData({ ...formData, lecturerName: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lecture">Lecture</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                            <SelectItem value="tutorial">Tutorial</SelectItem>
                            <SelectItem value="exam">Exam</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time (08:30 - 16:00) *</Label>
                        <Select
                          value={formData.startTime}
                          onValueChange={(val) => {
                            // Auto calculate end time (Start + 45mins)
                            // Find index of start time, next slot is end time
                            const startIndex = validStartTimes.indexOf(val);
                            let newEndTime = "";
                            if (startIndex !== -1 && startIndex < validEndTimesList.length) {
                              newEndTime = validEndTimesList[startIndex]; // The corresponding end time for this slot
                            }
                            setFormData({ ...formData, startTime: val, endTime: newEndTime })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent>
                            {validStartTimes.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time (Until 16:45) *</Label>
                        <Select
                          value={formData.endTime}
                          onValueChange={(val) => setFormData({ ...formData, endTime: val })}
                          disabled={!formData.startTime}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent>
                            {getValidEndTimes(formData.startTime).map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Classroom *</Label>
                      <Input
                        id="location"
                        placeholder="e.g. Room 301"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes *</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add mandatory notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCreateEvent}>
                      Save Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Same Fields as Add */}
              <div className="space-y-2">
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subjectName">Subject Name *</Label>
                <Input
                  id="edit-subjectName"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lecturerName">Lecturer Name *</Label>
                <Input
                  id="edit-lecturerName"
                  value={formData.lecturerName}
                  onChange={(e) => setFormData({ ...formData, lecturerName: e.target.value })}
                />
              </div>
              {/* ... (Date, Type, Time, Location, Notes) - condensed for brevity but must be present */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time (08:30 - 16:00) *</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(val) => {
                      // Auto calculate end time (Start + 45mins)
                      const startIndex = validStartTimes.indexOf(val);
                      let newEndTime = "";
                      if (startIndex !== -1 && startIndex < validEndTimesList.length) {
                        newEndTime = validEndTimesList[startIndex];
                      }
                      setFormData({ ...formData, startTime: val, endTime: newEndTime })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {validStartTimes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endTime">End Time (Until 16:45) *</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(val) => setFormData({ ...formData, endTime: val })}
                    disabled={!formData.startTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {getValidEndTimes(formData.startTime).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Classroom *</Label>
                <Input
                  id="edit-location"
                  placeholder="e.g. Room 301"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes *</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add mandatory notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="destructive" onClick={() => editingEventId && handleDeleteEvent(editingEventId)}>
                  Delete
                </Button>
                <Button onClick={handleUpdateEvent}>
                  Update Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar/Timetable */}
          <div className="lg:col-span-3">
            {viewMode === "week" && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={goToNextWeek}>
                        <ChevronRight className="size-4" />
                      </Button>
                      <Button variant="outline" onClick={goToToday}>
                        Today
                      </Button>
                    </div>
                    <h2 className="text-lg font-semibold">
                      {format(displayWeekStart, "MMM d")} - {format(addDays(displayWeekStart, 6), "MMM d, yyyy")}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Day Headers */}
                      <div className="grid grid-cols-8 border-b border-border">
                        <div className="w-20 shrink-0" />
                        {days.map((day, index) => {
                          const date = addDays(displayWeekStart, index);
                          const isToday = isSameDay(date, new Date());
                          return (
                            <div
                              key={day}
                              className={cn(
                                "p-4 text-center border-l border-border",
                                isToday && "bg-primary/5"
                              )}
                            >
                              <p className="text-sm text-muted-foreground">{day.slice(0, 3)}</p>
                              <p
                                className={cn(
                                  "text-2xl font-semibold mt-1",
                                  isToday && "text-primary"
                                )}
                              >
                                {format(date, "d")}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Time Grid */}
                      <div className="relative">
                        {/* Time Labels */}
                        <div className="absolute left-0 top-0 w-20">
                          {timeSlots.map((time) => (
                            <div
                              key={time}
                              className="h-20 flex items-start justify-end pr-3 pt-1"
                            >
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>
                          ))}
                        </div>

                        {/* Grid */}
                        <div className="ml-20 grid grid-cols-7">
                          {days.map((_, dayIndex) => (
                            <div
                              key={dayIndex}
                              className="relative border-l border-border"
                              style={{ height: `${timeSlots.length * 80}px` }}
                            >
                              {/* Hour lines */}
                              {timeSlots.map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-full border-t border-border"
                                  style={{ top: `${i * 80}px` }}
                                />
                              ))}

                              {/* Events */}
                              {getEventsForDay(dayIndex).map((event) => (
                                <HoverCard key={event.id}>
                                  <HoverCardTrigger asChild>
                                    <div
                                      onClick={() => !isStudent && handleEditClick(event)}
                                      className={cn(
                                        "absolute left-1 right-1 rounded-lg p-2 text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
                                        event.color
                                      )}
                                      style={{
                                        top: `${getEventPosition(event.startTime)}px`,
                                        height: `${getEventHeight(event.startTime, event.endTime)}px`,
                                      }}
                                    >
                                      <p className="font-medium truncate">{event.subjectName}</p>
                                      <p className="opacity-90 truncate text-[10px]">{event.title}</p>
                                      <p className="opacity-80">
                                        {event.startTime} - {event.endTime}
                                      </p>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80 p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="font-semibold text-lg">{event.subjectName}</h4>
                                          <p className="text-sm text-muted-foreground">{event.title}</p>
                                        </div>
                                        <Badge variant="outline">{getTypeLabel(event.type)}</Badge>
                                      </div>

                                      <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <Clock className="size-4" />
                                          <span>{event.startTime} - {event.endTime}</span>
                                        </div>
                                        {event.location && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="size-4" />
                                            <span>{event.location}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Users className="size-4" />
                                          <span>{event.lecturerName}</span>
                                        </div>
                                        {event.notes && (
                                          <div className="flex items-start gap-2 pt-2 border-t border-border mt-2">
                                            <FileText className="size-4 mt-0.5" />
                                            <p>{event.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                      {!isStudent && (
                                        <div className="pt-2">
                                          <Button size="sm" variant="outline" onClick={() => handleEditClick(event)} className="w-full">
                                            <Edit className="size-3 mr-2" /> Edit Event
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewMode === "month" && (
              <Card>
                <CardContent className="p-6">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            {viewMode === "list" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weeklySchedule.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group relative"
                      >
                        <div
                          className={cn(
                            "w-1 h-full min-h-[60px] rounded-full",
                            event.color
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{event.subjectName}</h4>
                            <Badge variant="secondary">{getTypeLabel(event.type)}</Badge>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">{event.title}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" />
                              {days[event.dayOfWeek]} {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-4" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="size-4" />
                              {event.lecturerName}
                            </span>
                          </div>
                        </div>
                        {!isStudent && (
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(event)}>
                              <Edit className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Upcoming Events (Mixed) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mixedUpcomingEvents.length > 0 ? mixedUpcomingEvents.map((event) => (
                    <div
                      key={event.id + event.type}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className={cn("size-2 rounded-full mt-2", event.color)} />
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(event.date, "MMM d")}</span>
                          <span>•</span>
                          <span className="capitalize">{event.type}</span>
                          {event.details && <span>({event.details})</span>}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Academic Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Weekly Academic Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Classes */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <BookOpen className="size-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Classes This Week
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {weeklySchedule.length}
                    </span>
                  </div>

                  {/* Assignments Due */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                        <FileText className="size-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Assignments Due
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {assignmentsThisWeek.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
