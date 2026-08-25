import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { AtRiskStudent, BulkInterventionPayload } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BellRing,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Eye,
  Mail,
  PenSquare,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface BulkInterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: AtRiskStudent[];
  onRemoveStudent?: (studentId: string) => void;
  onSendBulk: (payload: BulkInterventionPayload) => Promise<{ success: boolean; deliveredCount?: number }>;
  isSending?: boolean;
}

type TemplateType =
  | "gentle_reminder"
  | "academic_warning"
  | "schedule_meeting"
  | "study_support"
  | "custom";

export const BulkInterventionDialog: React.FC<BulkInterventionDialogProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onRemoveStudent,
  onSendBulk,
  isSending = false,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("gentle_reminder");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [urgencyLevel, setUrgencyLevel] = useState<"normal" | "high" | "critical">("normal");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Institutional cohort broadcast templates
  const templates: Record<
    TemplateType,
    {
      label: string;
      badgeText: string;
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      defaultUrgency: "normal" | "high" | "critical";
      body: (count: number) => string;
    }
  > = {
    gentle_reminder: {
      label: "Progress Reminder",
      badgeText: "Encouraging",
      icon: Sparkles,
      title: "Academic Milestone & Coursework Status Reminder",
      defaultUrgency: "normal",
      body: () =>
        `Dear Student,\n\nWe hope your academic semester is progressing well.\n\nOur academic tracking system noted that you have some upcoming or pending milestone submissions in your enrolled coursework on Eduspace.\n\nRecommended Next Steps:\n1. Log into your Eduspace portal and review your pending assignments.\n2. Connect with your faculty during scheduled office hours if you require extension assistance or study guidance.\n3. Take advantage of department learning labs and peer mentoring.\n\nWe are dedicated to supporting your academic journey!\n\nOffice of Academic Affairs & Student Success\nEduspace Learning Management`,
    },
    academic_warning: {
      label: "Official Advisory",
      badgeText: "Priority Warning",
      icon: AlertTriangle,
      title: "OFFICIAL ACADEMIC ADVISORY: Milestone Notice & Retention Advisory",
      defaultUrgency: "high",
      body: () =>
        `ATTENTION: Official Academic Performance Advisory\n\nThis is a priority notification from the Academic Affairs and Retention Office regarding your academic progress in your enrolled courses.\n\nOur early warning retention analytics have flagged pending milestones, overdue submissions, or recent quiz performance trends requiring immediate intervention.\n\nRequired Action Checklist:\n1. Immediately access your course modules to submit overdue materials.\n2. Schedule an urgent consultation with your course faculty within 48 to 72 hours.\n3. Confirm your academic standing with your department coordinator.\n\nFailure to address these academic requirements may impact course credit evaluation.\n\nDepartment Academic Advisement Board\nEduspace Console`,
    },
    schedule_meeting: {
      label: "Advisement Check-in",
      badgeText: "Consultation",
      icon: CalendarCheck,
      title: "Action Requested: Academic Advisement & Roadmap Conference",
      defaultUrgency: "normal",
      body: () =>
        `Dear Student,\n\nYour academic department cordially invites you to schedule a 1-on-1 Academic Success Check-in.\n\nConference Objectives:\n• Review current academic milestone progress and grade trajectory.\n• Identify study bottlenecks or concept challenges you may be experiencing.\n• Co-create a tailored milestone recovery roadmap for upcoming assessments.\n\nPlease contact your department office or reply to this notice to book your appointment time.\n\nAcademic Advisement Committee\nEduspace Academic Portal`,
    },
    study_support: {
      label: "Tutoring Outreach",
      badgeText: "Free Resources",
      icon: BookOpen,
      title: "Academic Assistance & Peer Tutoring Resources Available",
      defaultUrgency: "normal",
      body: () =>
        `Hi Student,\n\nWe are reaching out to ensure you have full access to free specialized academic assistance available in your department:\n• Peer Tutoring: Weekly group workshops and 1-on-1 concept sessions.\n• Faculty Office Hours: Targeted Q&A on challenging module concepts.\n• Digital Practice Labs: Interactive revision quizzes and past exam guides.\n\nTaking advantage of tutoring early makes a substantial difference in final evaluations. Reach out today to connect with a mentor!\n\nEduspace Student Learning Center`,
    },
    custom: {
      label: "Custom Broadcast",
      badgeText: "Freeform",
      icon: Mail,
      title: "",
      defaultUrgency: "normal",
      body: () => "",
    },
  };

  useEffect(() => {
    if (selectedTemplate !== "custom") {
      const t = templates[selectedTemplate];
      setTitle(t.title);
      setUrgencyLevel(t.defaultUrgency);
      setMessage(t.body(selectedStudents.length));
    }
  }, [selectedTemplate, selectedStudents.length]);

  const insertVariable = (variableToken: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((prev) => prev + " " + variableToken);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = message;
    const newText = currentText.substring(0, start) + variableToken + currentText.substring(end);
    setMessage(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableToken.length, start + variableToken.length);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || selectedStudents.length === 0) return;

    const payload: BulkInterventionPayload = {
      students: selectedStudents.map((s) => ({
        userId: s.userId,
        studentName: s.fullName,
        studentEmail: s.email,
      })),
      title: title.trim(),
      message: message.trim(),
      type: selectedTemplate,
      sendEmail,
    };

    const res = await onSendBulk(payload);
    if (res.success) {
      onClose();
    }
  };

  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;
  const readTimeSeconds = Math.max(5, Math.round((wordCount / 200) * 60));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "bg-card p-0 flex flex-col shadow-2xl overflow-hidden z-50",
          isMobile
            ? "h-[92vh] max-h-[92vh] rounded-t-3xl border-t border-border/80"
            : "w-full sm:max-w-xl md:max-w-2xl border-l border-border/80"
        )}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
        )}

        {/* Drawer Header */}
        <SheetHeader className="px-5 py-3 sm:px-6 sm:py-4 border-b border-border/60 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5 pr-8">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Bulk Cohort Intervention Dispatch
                </SheetTitle>
                <Badge variant="default" className="text-[10px] font-black uppercase">
                  {selectedStudents.length} Students
                </Badge>
              </div>
              <SheetDescription className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Broadcast targeted retention guidance to selected at-risk cohort concurrently
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Selected Students Pill Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Target Recipients ({selectedStudents.length})
                </Label>
                <span className="text-[10px] text-muted-foreground">Click × to remove from broadcast</span>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-muted/30 border border-border/60 max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                {selectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-medium text-foreground shadow-xs"
                  >
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                        {getInitials(student.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[110px] font-semibold">{student.fullName}</span>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-1 rounded",
                        student.riskLevel === "critical"
                          ? "bg-red-500/20 text-red-500"
                          : student.riskLevel === "high"
                          ? "bg-rose-500/20 text-rose-500"
                          : "bg-amber-500/20 text-amber-500"
                      )}
                    >
                      {student.riskScore}
                    </span>
                    {onRemoveStudent && (
                      <button
                        type="button"
                        onClick={() => onRemoveStudent(student.id)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                        title="Remove student"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preset Template Chips */}
            <div className="space-y-1">
              <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Broadcast Template
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {(Object.keys(templates) as TemplateType[]).map((type) => {
                  const item = templates[type];
                  const Icon = item.icon;
                  const isSelected = selectedTemplate === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedTemplate(type)}
                      className={cn(
                        "flex items-center sm:flex-col justify-center sm:items-start p-2 sm:p-2.5 rounded-lg sm:rounded-xl border text-left transition-all gap-1 cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-semibold ring-1 ring-primary/30"
                          : "bg-card/70 border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 w-full justify-center sm:justify-start">
                        <Icon className={cn("size-3 sm:size-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-[11px] sm:text-xs font-bold truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabs: Compose vs Preview */}
            <div className="flex items-center justify-between border-b border-border/60 pb-1 pt-0.5">
              <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/70 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={cn(
                    "px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                    activeTab === "edit"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <PenSquare className="size-3" />
                  <span>Compose</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={cn(
                    "px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer",
                    activeTab === "preview"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="size-3" />
                  <span>Cohort Preview</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as any)}
                  className="h-6 sm:h-7 text-[10px] sm:text-xs bg-background/80 border border-border/70 rounded-md px-1.5 font-medium text-foreground cursor-pointer outline-none"
                >
                  <option value="normal">Standard Notice</option>
                  <option value="high">High Priority Advisory</option>
                  <option value="critical">Critical Mandatory</option>
                </select>
              </div>
            </div>

            {activeTab === "edit" ? (
              <div className="space-y-2.5 sm:space-y-3.5">
                {/* Title Input */}
                <div className="space-y-1">
                  <Label htmlFor="bulk-intervention-title" className="text-[11px] sm:text-xs font-bold">
                    Notification Subject / Title
                  </Label>
                  <Input
                    id="bulk-intervention-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter subject title for cohort broadcast..."
                    required
                    className="h-8 sm:h-9 text-xs bg-background/70 font-semibold"
                  />
                </div>

                {/* Variable Token Chips */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Insert:
                  </span>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{student_name}}")}
                    className="px-1.5 py-0.5 rounded bg-secondary/80 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/60 text-[9px] sm:text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    +{"{{student_name}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{student_id}}")}
                    className="px-1.5 py-0.5 rounded bg-secondary/80 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/60 text-[9px] sm:text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    +{"{{student_id}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("{{department}}")}
                    className="px-1.5 py-0.5 rounded bg-secondary/80 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/60 text-[9px] sm:text-[10px] font-mono font-medium transition-colors cursor-pointer"
                  >
                    +{"{{department}}"}
                  </button>
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bulk-intervention-message" className="text-[11px] sm:text-xs font-bold">
                      Notification Body
                    </Label>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                      {wordCount} words · ~{readTimeSeconds}s read
                    </span>
                  </div>
                  <Textarea
                    ref={textareaRef}
                    id="bulk-intervention-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter message for bulk broadcast..."
                    rows={isMobile ? 7 : 8}
                    required
                    className="text-xs resize-none leading-relaxed bg-background/70 font-normal font-sans"
                  />
                </div>
              </div>
            ) : (
              /* Live Preview */
              <div className="space-y-2 p-3 sm:p-4 rounded-xl bg-background/90 border border-border/80 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60 text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[9px] sm:text-[10px] tracking-wider flex items-center gap-1">
                    <Eye className="size-3 text-primary" />
                    Student View Preview
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold uppercase",
                      urgencyLevel === "critical"
                        ? "bg-red-500/20 text-red-500 border-red-500/30"
                        : urgencyLevel === "high"
                        ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                        : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                    )}
                  >
                    {urgencyLevel.toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-foreground">{title || "Untitled Notification"}</h4>
                  <div className="text-[11px] sm:text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-card/60 p-2.5 sm:p-3 rounded-lg border border-border/50 font-sans">
                    {message || "No message composed."}
                  </div>
                </div>
              </div>
            )}

            {/* Email Delivery Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-card/70 border border-border/80 text-xs cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                  <Mail className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground block truncate text-xs">
                    Broadcast to Student Email Inboxes
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                    Direct delivery to all {selectedStudents.length} registered email addresses
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0 ml-2"
              />
            </label>
          </div>

          {/* Sticky Action Footer */}
          <SheetFooter className="p-3.5 sm:p-4 border-t border-border/60 bg-muted/30 flex flex-row items-center justify-end gap-2 sm:gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 sm:flex-none sm:min-w-[90px] h-8 sm:h-9 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !title.trim() || !message.trim() || selectedStudents.length === 0}
              className="flex-1 sm:flex-none sm:min-w-[180px] h-8 sm:h-9 text-xs font-semibold shadow-md shadow-primary/20 gap-1.5"
            >
              <Send className={cn("size-3", isSending && "animate-spin")} />
              {isSending ? "Broadcasting..." : `Broadcast to ${selectedStudents.length} Students`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
