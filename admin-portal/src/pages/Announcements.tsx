import React, { useState, useEffect } from "react";
import {
  announcementsService,
  AnnouncementAudience,
} from "@/services/announcements.service";
import { studentsService } from "@/services/students.service";
import { coursesService } from "@/services/courses.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Megaphone, Send, Users, CheckCircle2, History, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ExportButton } from "@/components/common/ExportButton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Announcements: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [targetId, setTargetId] = useState("");
  const [recipientCount, setRecipientCount] = useState<number>(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPrerequisites();
    loadHistory();
  }, []);

  const loadPrerequisites = async () => {
    try {
      const [depts, clsRes] = await Promise.all([
        studentsService.getAllDepartments(),
        coursesService.getClasses({ pageSize: 100 }),
      ]);
      setDepartments(depts);
      setClasses(clsRes.data || []);
    } catch (err) {
      console.error("Error loading announcement options:", err);
    }
  };

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await announcementsService.getAnnouncementHistory();
      setHistory(data);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([loadPrerequisites(), loadHistory()]);
      toast.success("Announcements data refreshed successfully!");
    } catch (err) {
      toast.error("Failed to refresh announcements data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Recalculate recipient count whenever audience or targetId changes
  useEffect(() => {
    const fetchCount = async () => {
      const count = await announcementsService.getRecipientCount(audience, targetId);
      setRecipientCount(count);
    };
    fetchCount();
  }, [audience, targetId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message body.");
      return;
    }

    if ((audience === "department" || audience === "class") && !targetId) {
      toast.error("Please select the specific department or class.");
      return;
    }

    try {
      setIsSending(true);
      const res = await announcementsService.sendAnnouncement({
        title,
        message,
        audience,
        targetId: targetId || undefined,
      });

      if (res.success) {
        toast.success(`Announcement broadcast successfully to ${res.count} recipients!`);
        setTitle("");
        setMessage("");
        setAudience("all");
        setTargetId("");
        loadHistory();
      } else {
        toast.error(res.error || "Failed to send announcement.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send announcement.");
    } finally {
      setIsSending(false);
    }
  };

  const exportCols = [
    { header: "Title", key: "title", width: 25 },
    { header: "Message", key: "message", width: 35 },
    { header: "Audience", key: "audience", width: 15 },
    { header: "Recipients", key: "total", width: 12 },
    { header: "Read Count", key: "read", width: 12 },
    { header: "Sent At", key: "created_at", width: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">Platform Announcements</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Targeted Broadcasts
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dispatch official notifications to students, lecturers, departments, or individual classes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs font-medium bg-card/60 border-border/80 hover:bg-accent min-w-[95px]"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <ExportButton data={history} columns={exportCols} filename="eduspace-announcements" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Compose Form */}
        <Card className="lg:col-span-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Compose Notice
            </CardTitle>
            <CardDescription className="text-xs">
              Broadcast an urgent notification across targeted user groups.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Announcement Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., End of Semester Exam Schedule Released"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Audience</Label>
                <Select
                  value={audience}
                  onValueChange={(val: AnnouncementAudience) => {
                    setAudience(val);
                    setTargetId("");
                  }}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone (All Students & Faculty)</SelectItem>
                    <SelectItem value="students">All Enrolled Students Only</SelectItem>
                    <SelectItem value="lecturers">All Faculty / Lecturers Only</SelectItem>
                    <SelectItem value="department">Specific Academic Department</SelectItem>
                    <SelectItem value="class">Specific Class Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {audience === "department" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-xs font-semibold">Select Department</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audience === "class" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-xs font-semibold">Select Class</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Choose classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name || cls.course_code} ({cls.lecturer_name || "Faculty"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Message Body</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message content here..."
                  className="min-h-[120px] text-sm resize-y"
                  required
                />
              </div>

              {/* Recipient Count Indicator */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Estimated Reach:
                </span>
                <span className="font-bold text-primary">{recipientCount} Recipients</span>
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-semibold shadow-md shadow-primary/20"
                disabled={isSending || recipientCount === 0}
              >
                {isSending ? (
                  "Broadcasting..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Broadcast Announcement Now
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: History */}
        <Card className="lg:col-span-6 border-border bg-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Past Broadcasts
            </CardTitle>
            <CardDescription className="text-xs">
              Review previously dispatched announcements and engagement rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[520px]">
            {isLoadingHistory ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements sent"
                description="Broadcasted announcements and their recipient engagement rates will appear here."
              />
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => {
                  const readPercent =
                    item.total > 0 ? Math.round((item.read / item.total) * 100) : 0;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Delivered to: <strong className="text-foreground">{item.total}</strong> users
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {readPercent}% Read Rate
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
