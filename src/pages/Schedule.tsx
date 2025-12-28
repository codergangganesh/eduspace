import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

interface ClassEvent {
  id: string;
  title: string;
  type: "lecture" | "lab" | "tutorial" | "exam" | "event";
  startTime: string;
  endTime: string;
  location: string;
  instructor?: string;
  color: string;
  dayOfWeek: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "assignment" | "exam" | "event" | "holiday";
  color: string;
}

const weeklySchedule: ClassEvent[] = [
  {
    id: "1",
    title: "CS101 - Introduction to Algorithms",
    type: "lecture",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 201, Engineering Building",
    instructor: "Dr. Sarah Smith",
    color: "bg-blue-500",
    dayOfWeek: 1,
  },
  {
    id: "2",
    title: "MATH301 - Linear Algebra",
    type: "lecture",
    startTime: "11:00",
    endTime: "12:30",
    location: "Room 105, Math Building",
    instructor: "Prof. Michael Chen",
    color: "bg-purple-500",
    dayOfWeek: 1,
  },
  {
    id: "3",
    title: "CS101 - Lab Session",
    type: "lab",
    startTime: "14:00",
    endTime: "16:00",
    location: "Computer Lab 3",
    instructor: "TA Alex Johnson",
    color: "bg-green-500",
    dayOfWeek: 2,
  },
  {
    id: "4",
    title: "ENG202 - Literature Analysis",
    type: "lecture",
    startTime: "10:00",
    endTime: "11:30",
    location: "Room 302, Humanities Building",
    instructor: "Dr. Emily Brown",
    color: "bg-pink-500",
    dayOfWeek: 2,
  },
  {
    id: "5",
    title: "MATH301 - Tutorial",
    type: "tutorial",
    startTime: "13:00",
    endTime: "14:00",
    location: "Room 108, Math Building",
    color: "bg-purple-400",
    dayOfWeek: 3,
  },
  {
    id: "6",
    title: "CS101 - Introduction to Algorithms",
    type: "lecture",
    startTime: "09:00",
    endTime: "10:30",
    location: "Room 201, Engineering Building",
    instructor: "Dr. Sarah Smith",
    color: "bg-blue-500",
    dayOfWeek: 3,
  },
  {
    id: "7",
    title: "Physics 201",
    type: "lecture",
    startTime: "14:00",
    endTime: "15:30",
    location: "Room 401, Science Building",
    instructor: "Prof. David Lee",
    color: "bg-orange-500",
    dayOfWeek: 4,
  },
  {
    id: "8",
    title: "ENG202 - Discussion Group",
    type: "tutorial",
    startTime: "11:00",
    endTime: "12:00",
    location: "Room 305, Humanities Building",
    color: "bg-pink-400",
    dayOfWeek: 5,
  },
];

const upcomingEvents: CalendarEvent[] = [
  {
    id: "e1",
    title: "CS101 Midterm Exam",
    date: new Date(2024, 11, 15),
    type: "exam",
    color: "bg-red-500",
  },
  {
    id: "e2",
    title: "Project Proposal Due",
    date: new Date(2024, 11, 20),
    type: "assignment",
    color: "bg-yellow-500",
  },
  {
    id: "e3",
    title: "Winter Break Begins",
    date: new Date(2024, 11, 23),
    type: "holiday",
    color: "bg-green-500",
  },
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

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
    return weeklySchedule.filter((event) => event.dayOfWeek === dayIndex + 1);
  };

  const getEventPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startHour = 8;
    const position = ((hours - startHour) * 60 + minutes) / 60;
    return position * 80; // 80px per hour
  };

  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return (duration / 60) * 80;
  };

  const getTypeLabel = (type: ClassEvent["type"]) => {
    const labels = {
      lecture: "Lecture",
      lab: "Lab",
      tutorial: "Tutorial",
      exam: "Exam",
      event: "Event",
    };
    return labels[type];
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
                variant={viewMode === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                <CalendarDays className="size-4 mr-1" />
                Month
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
            <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" placeholder="Enter event title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select>
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
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" type="time" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="Enter location" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Add any notes..." />
                  </div>
                  <Button className="w-full" onClick={() => setIsAddEventOpen(false)}>
                    Add Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                      {format(weekStart, "MMM d")} - {format(addDays(weekStart, 4), "MMM d, yyyy")}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      {/* Day Headers */}
                      <div className="grid grid-cols-6 border-b border-border">
                        <div className="w-20 shrink-0" />
                        {days.map((day, index) => {
                          const date = addDays(weekStart, index);
                          const isToday = isSameDay(date, new Date());
                          return (
                            <div
                              key={day}
                              className={cn(
                                "p-4 text-center border-l border-border",
                                isToday && "bg-primary/5"
                              )}
                            >
                              <p className="text-sm text-muted-foreground">{day}</p>
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
                        <div className="ml-20 grid grid-cols-5">
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
                                <div
                                  key={event.id}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-lg p-2 text-white text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
                                    event.color
                                  )}
                                  style={{
                                    top: `${getEventPosition(event.startTime)}px`,
                                    height: `${getEventHeight(event.startTime, event.endTime)}px`,
                                  }}
                                >
                                  <p className="font-medium truncate">{event.title}</p>
                                  <p className="opacity-80">
                                    {event.startTime} - {event.endTime}
                                  </p>
                                  <p className="opacity-80 truncate">{event.location}</p>
                                </div>
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
                        className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div
                          className={cn(
                            "w-1 h-full min-h-[60px] rounded-full",
                            event.color
                          )}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge variant="secondary">{getTypeLabel(event.type)}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" />
                              {days[event.dayOfWeek - 1]}, {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="size-4" />
                              {event.location}
                            </span>
                            {event.instructor && (
                              <span className="flex items-center gap-1">
                                <Users className="size-4" />
                                {event.instructor}
                              </span>
                            )}
                          </div>
                        </div>
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

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className={cn("size-2 rounded-full mt-2", event.color)} />
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(event.date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="size-4" />
                      Classes
                    </span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      Total Hours
                    </span>
                    <span className="font-medium">14h 30m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      Office Hours
                    </span>
                    <span className="font-medium">2</span>
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
