import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchedule } from "@/hooks/useSchedule";
import { useClasses } from "@/hooks/useClasses";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
    const { createSchedule } = useSchedule();
    const { classes } = useClasses();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        type: "lecture",
        day_of_week: "1", // Monday
        start_time: "09:00",
        end_time: "10:00",
        location: "",
        class_id: "none",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.start_time || !formData.end_time) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);

            const scheduleData: any = {
                title: formData.title,
                type: formData.type as any,
                day_of_week: parseInt(formData.day_of_week),
                start_time: formData.start_time,
                end_time: formData.end_time,
                location: formData.location || null,
                is_recurring: true,
                specific_date: null,
                notes: null,
                color: null,
                class_id: formData.class_id === "none" ? null : formData.class_id,
            };

            const result = await createSchedule(scheduleData);

            if (result.success) {
                toast.success("Event created successfully");
                onOpenChange(false);
                setFormData({
                    title: "",
                    type: "lecture",
                    day_of_week: "1",
                    start_time: "09:00",
                    end_time: "10:00",
                    location: "",
                    class_id: "none",
                });
            } else {
                toast.error(result.error || "Failed to create event");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add to Schedule</DialogTitle>
                    <DialogDescription>
                        Create a new class schedule or event.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Morning Lecture"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
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

                        <div className="space-y-2">
                            <Label htmlFor="day">Day</Label>
                            <Select
                                value={formData.day_of_week}
                                onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Sunday</SelectItem>
                                    <SelectItem value="1">Monday</SelectItem>
                                    <SelectItem value="2">Tuesday</SelectItem>
                                    <SelectItem value="3">Wednesday</SelectItem>
                                    <SelectItem value="4">Thursday</SelectItem>
                                    <SelectItem value="5">Friday</SelectItem>
                                    <SelectItem value="6">Saturday</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Start Time *</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time *</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Room 301 or Online"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class">Class (Optional)</Label>
                        <Select
                            value={formData.class_id}
                            onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Class (Personal)</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.course_code} - {cls.class_name || "General"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
