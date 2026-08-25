import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { AtRiskStudent, InterventionPayload } from "@/types";
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
  Eye,
  Mail,
  PanelRight,
  PenSquare,
  Plus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: AtRiskStudent | null;
  onSend: (payload: InterventionPayload) => Promise<{ success: boolean; error?: string }>;
  isSending?: boolean;
}

type TemplateType =
  | "gentle_reminder"
  | "academic_warning"
  | "schedule_meeting"
  | "study_support"
  | "custom";

export const InterventionDialog: React.FC<InterventionDialogProps> = ({
  isOpen,
  onClose,
  student,
  onSend,
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

  // Screen width detector
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Institutional elaborate templates
  const templates: Record<
    TemplateType,
    {
      label: string;
      badgeText: string;
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      defaultUrgency: "normal" | "high" | "critical";
      body: (name: string, id: string, dept: string, factors: string, courses: string) => string;
    }
  > = {
    gentle_reminder: {
      label: "Reminder",
      badgeText: "Encouraging",
      icon: Sparkles,
      title: "Academic Progress & Coursework Milestone Reminder",
      defaultUrgency: "normal",
      body: (name, id, dept, factors, courses) =>
        `Dear ${name} (${id}),\n\nWe hope your semester is going well in ${dept}.\n\nOur academic tracking highlighted upcoming milestones for your attention:\n• Status: ${factors || "Pending assignment deadlines & quiz milestones"}\n• Courses: ${courses || "Enrolled classes"}\n\nRecommended Next Steps:\n1. Review pending submissions on Eduspace.\n2. Connect with faculty during office hours if you need guidance.\n3. Utilize department study and tutoring resources.\n\nWe are here to support your success!\n\nDepartment of ${dept}\nEduspace Academic Support`,
    },
    academic_warning: {
      label: "Warning",
      badgeText: "Priority Notice",
      icon: AlertTriangle,
      title: "OFFICIAL ADVISORY: Academic Milestone & Retention Notice",
      defaultUrgency: "high",
      body: (name, id, dept, factors, courses) =>
        `ATTENTION: ${name.toUpperCase()} (ID: ${id})\nDepartment: ${dept}\n\nThis is an official retention advisory regarding your academic progress in: ${courses || "your enrolled courses"}.\n\nFlagged Milestone Vulnerabilities:\n• Indicators: ${factors || "Overdue assignments and declining performance trends"}\n\nRequired Actions:\n1. Access course modules immediately to submit overdue work.\n2. Consult with course faculty within 48 to 72 hours.\n3. Verify your standing with your academic department.\n\nOffice of Academic Affairs\nEduspace Management Console`,
    },
    schedule_meeting: {
      label: "Advisement",
      badgeText: "Consultation",
      icon: CalendarCheck,
      title: "Action Requested: Academic Advisement Check-in",
      defaultUrgency: "normal",
      body: (name, id, dept, factors, _) =>
        `Dear ${name} (ID: ${id}),\n\nYour academic advisors in ${dept} invite you for an Academic Success Check-in.\n\nPurpose:\n• Review coursework progress (${factors || "milestone trajectory"}).\n• Discuss challenges and study roadmaps for upcoming assessments.\n\nPlease reply or visit your department coordinator to confirm your meeting time.\n\nAcademic Advisement Committee\n${dept}`,
    },
    study_support: {
      label: "Tutoring",
      badgeText: "Study Help",
      icon: BookOpen,
      title: "Study Assistance & Tutoring Resources Available",
      defaultUrgency: "normal",
      body: (name, id, dept, factors, courses) =>
        `Hi ${name},\n\nWe provide free academic support in ${dept} for ${courses || "your enrolled courses"}:\n• Peer Tutoring: Group and 1-on-1 sessions.\n• Faculty Office Hours: Targeted concept review.\n• Digital Practice Labs: Quizzes and revision guides.\n\nCurrent Observation: ${factors || "Opportunities to boost quiz averages and milestone completion"}.\n\nPlease reach out if you would like a peer tutor!\n\nEduspace Learning Center`,
    },
    custom: {
      label: "Custom",
      badgeText: "Freeform",
      icon: Mail,
      title: "",
      defaultUrgency: "normal",
      body: () => "",
    },
  };

  // Synchronize when template or student changes
  useEffect(() => {
    if (!student) return;
    const factorSummary = student.factors
      .filter((f) => f.score >= 30)
      .map((f) => `${f.label} (${f.detail})`)
      .join("; ");

    const coursesList = student.enrolledClasses.map((c) => c.name).join(", ");

    if (selectedTemplate !== "custom") {
      const t = templates[selectedTemplate];
      setTitle(t.title);
      setUrgencyLevel(t.defaultUrgency);
      setMessage(
        t.body(
          student.fullName,
          student.studentId,
          student.department,
          factorSummary,
          coursesList
        )
      );
    }
  }, [selectedTemplate, student]);

  if (!student) return null;

  // Insert variable into message textarea at current cursor position
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
    if (!title.trim() || !message.trim()) return;

    const payload: InterventionPayload = {
      studentUserId: student.userId,
      studentName: student.fullName,
      studentEmail: student.email,
      title: title.trim(),
      message: message.trim(),
      type: selectedTemplate,
      sendEmail,
    };

    const res = await onSend(payload);
    if (res.success) {
      onClose();
    }
  };

  const variableChips = [
    { label: "Name", value: student.fullName },
    { label: "ID", value: student.studentId },
    { label: "Dept", value: student.department },
    {
      label: "Risk",
      value:
        student.factors.filter((f) => f.score >= 40).map((f) => f.label).join(", ") ||
        "Academic Milestones",
    },
  ];

  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;
  const readTimeSeconds = Math.max(5, Math.round((wordCount / 200) * 60));

  // Shared Form and Preview View
  const FormContent = () => (
    <div className="space-y-3 sm:space-y-4">
      {/* Student Snapshot Banner */}
      <div className="p-2.5 sm:p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-primary/20">
            {student.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-foreground truncate">{student.fullName}</span>
              <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">({student.studentId})</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{student.email}</p>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 shrink-0",
            student.riskLevel === "critical"
              ? "bg-red-500/20 text-red-500 border-red-500/30"
              : student.riskLevel === "high"
              ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
              : "bg-amber-500/20 text-amber-500 border-amber-500/30"
          )}
        >
          {student.riskScore}/100
        </Badge>
      </div>

      {/* Preset Template Chips */}
      <div className="space-y-1">
        <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Template
        </Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
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

      {/* Switcher Tab: Edit vs Live Student View */}
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
            <span>Student Preview</span>
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
        <div className="space-y-2.5 sm:space-y-3">
          {/* Title Input */}
          <div className="space-y-1">
            <Label htmlFor="intervention-title" className="text-[11px] sm:text-xs font-bold">
              Subject / Title
            </Label>
            <Input
              id="intervention-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter subject..."
              required
              className="h-8 sm:h-9 text-xs bg-background/70 font-semibold"
            />
          </div>

          {/* Quick 1-Tap Variable Inserters */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Insert:
            </span>
            {variableChips.map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => insertVariable(chip.value)}
                className="px-1.5 py-0.5 rounded bg-secondary/80 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/60 text-[9px] sm:text-[10px] font-mono font-medium transition-colors cursor-pointer"
              >
                +{chip.label}
              </button>
            ))}
          </div>

          {/* Message Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="intervention-message" className="text-[11px] sm:text-xs font-bold">
                Notification Message
              </Label>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                {wordCount}w · {message.length}c
              </span>
            </div>
            <Textarea
              ref={textareaRef}
              id="intervention-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter retention message..."
              rows={isMobile ? 6 : 7}
              required
              className="text-xs resize-none leading-relaxed bg-background/70 font-normal font-sans"
            />
          </div>
        </div>
      ) : (
        /* Live Student Notification Preview */
        <div className="space-y-2 p-3 sm:p-4 rounded-xl bg-background/90 border border-border/80 shadow-inner">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60 text-xs">
            <span className="font-bold text-muted-foreground uppercase text-[9px] sm:text-[10px] tracking-wider flex items-center gap-1">
              <Eye className="size-3 text-primary" />
              Student View
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
              Deliver to Student Email Inbox
            </span>
            <span className="text-[10px] text-muted-foreground truncate block font-mono">
              {student.email}
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
  );

  // UNIFIED RESPONSIVE DRAWER: Right-Side on Desktop (`side="right"`), Bottom on Mobile (`side="bottom"`)
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "bg-card p-0 flex flex-col shadow-2xl overflow-hidden z-50",
          isMobile
            ? "h-[90vh] max-h-[90vh] rounded-t-3xl border-t border-border/80"
            : "w-full sm:max-w-xl md:max-w-2xl border-l border-border/80"
        )}
      >
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
        )}

        {/* Drawer Header */}
        <SheetHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border/60 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5 pr-8">
            <div className="p-1.5 sm:p-2 rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
              <BellRing className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Dispatch Retention Nudge
                </SheetTitle>
              </div>
              <SheetDescription className="text-[10px] sm:text-xs text-muted-foreground truncate">
                To: {student.fullName} ({student.studentId})
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
            <FormContent />
          </div>

          {/* Sticky Action Footer */}
          <SheetFooter className="p-3 sm:p-4 border-t border-border/60 bg-muted/30 flex flex-row items-center justify-end gap-2 sm:gap-3 shrink-0">
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
              disabled={isSending || !title.trim() || !message.trim()}
              className="flex-1 sm:flex-none sm:min-w-[140px] h-8 sm:h-9 text-xs font-semibold shadow-md shadow-primary/20 gap-1.5"
            >
              <Send className={cn("size-3", isSending && "animate-spin")} />
              {isSending ? "Delivering..." : "Send Nudge"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
