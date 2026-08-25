import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { AtRiskStudent } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronDown,
  GraduationCap,
  Mail,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface AlertLecturerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  student: AtRiskStudent | null;
  onSendAlert: (params: {
    student: AtRiskStudent;
    customNote?: string;
    sendEmail?: boolean;
    targetLecturerIds?: string[];
  }) => Promise<{ success: boolean; alertedLecturersCount?: number; error?: string }>;
  isSending?: boolean;
}

export const AlertLecturerDialog: React.FC<AlertLecturerDialogProps> = ({
  isOpen,
  onClose,
  student,
  onSendAlert,
  isSending = false,
}) => {
  const [customNote, setCustomNote] = useState("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [selectedLecturerIds, setSelectedLecturerIds] = useState<Set<string>>(new Set());
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Aggregate unique lecturers from enrolled classes
  const assignedLecturers = useMemo(() => {
    if (!student) return [];
    const map = new Map<string, { id: string; name?: string; email?: string; classNames: string[] }>();

    student.enrolledClasses.forEach((cls) => {
      if (!cls.lecturerId) return;
      const existing = map.get(cls.lecturerId);
      if (existing) {
        if (!existing.classNames.includes(cls.name)) {
          existing.classNames.push(cls.name);
        }
      } else {
        map.set(cls.lecturerId, {
          id: cls.lecturerId,
          name: cls.lecturerName || "Course Lecturer",
          email: cls.lecturerEmail || "",
          classNames: [cls.name],
        });
      }
    });

    return Array.from(map.values());
  }, [student]);

  // Select all lecturers by default when student opens
  useEffect(() => {
    if (student) {
      const allIds = new Set(assignedLecturers.map((l) => l.id));
      setSelectedLecturerIds(allIds);
      setCustomNote("");
      setSendEmail(true);
      setIsFacultyDropdownOpen(false);
    }
  }, [student, assignedLecturers]);

  if (!student) return null;

  const toggleLecturer = (id: string) => {
    const next = new Set(selectedLecturerIds);
    if (next.has(id)) {
      if (next.size > 1) {
        next.delete(id);
      }
    } else {
      next.add(id);
    }
    setSelectedLecturerIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLecturerIds.size === 0) return;

    const res = await onSendAlert({
      student,
      customNote: customNote.trim() || undefined,
      sendEmail,
      targetLecturerIds: Array.from(selectedLecturerIds),
    });

    if (res.success) {
      onClose();
    }
  };

  const factorSummary = student.factors
    .filter((f) => f.score >= 30)
    .map((f) => `${f.label} (${f.detail})`)
    .join("; ");

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
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm sm:text-base font-bold text-foreground truncate">
                  Faculty Academic Retention Alert
                </SheetTitle>
                <Badge variant="outline" className="text-[9px] font-bold uppercase text-primary border-primary/30">
                  {assignedLecturers.length} Faculty
                </Badge>
              </div>
              <SheetDescription className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Notify course professors regarding student {student.fullName}'s retention risk profile
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
            {/* Student Dossier Banner */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-8 sm:size-9 border border-border shrink-0">
                  <AvatarImage src={student.avatarUrl || ""} alt={student.fullName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {getInitials(student.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-foreground truncate">{student.fullName}</span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">({student.studentId})</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate font-mono">
                    {student.email} · {student.department}
                  </p>
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
                {student.riskScore}/100 Risk
              </Badge>
            </div>

            {/* Target Faculty Dropdown Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">
                  Assigned Faculty Members ({assignedLecturers.length})
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {selectedLecturerIds.size === assignedLecturers.length
                    ? "All Faculty Selected"
                    : `${selectedLecturerIds.size} of ${assignedLecturers.length} Selected`}
                </span>
              </div>

              {assignedLecturers.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>No assigned lecturers found for this student's enrolled courses.</span>
                </div>
              ) : (
                <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden transition-all shadow-xs">
                  {/* Dropdown Header Button */}
                  <button
                    type="button"
                    onClick={() => setIsFacultyDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                        <GraduationCap className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {selectedLecturerIds.size === 0
                            ? "No faculty selected"
                            : selectedLecturerIds.size === assignedLecturers.length
                            ? `All Assigned Faculty (${assignedLecturers.length})`
                            : assignedLecturers
                                .filter((l) => selectedLecturerIds.has(l.id))
                                .map((l) => l.name)
                                .join(", ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                          {isFacultyDropdownOpen ? "Click to collapse list" : "Click to view / select specific faculty"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="secondary" className="text-[9px] font-bold">
                        {selectedLecturerIds.size}/{assignedLecturers.length}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "size-4 text-muted-foreground transition-transform duration-200",
                          isFacultyDropdownOpen && "rotate-180 text-primary"
                        )}
                      />
                    </div>
                  </button>

                  {/* Collapsible Dropdown Content */}
                  {isFacultyDropdownOpen && (
                    <div className="border-t border-border/60 p-2.5 space-y-2 bg-background/50 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-muted-foreground border-b border-border/40 pb-1.5">
                        <span>Select professors to receive advisory:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLecturerIds(new Set(assignedLecturers.map((l) => l.id)))}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (assignedLecturers.length > 0) {
                                setSelectedLecturerIds(new Set([assignedLecturers[0].id]));
                              }
                            }}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {assignedLecturers.map((lecturer) => {
                          const isChecked = selectedLecturerIds.has(lecturer.id);
                          return (
                            <label
                              key={lecturer.id}
                              onClick={() => toggleLecturer(lecturer.id)}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all gap-2",
                                isChecked
                                  ? "bg-primary/5 border-primary/60 ring-1 ring-primary/20"
                                  : "bg-card/60 border-border/60 hover:bg-muted/40"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleLecturer(lecturer.id)}
                                  className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-foreground block truncate">{lecturer.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                    Courses: {lecturer.classNames.join(", ")}
                                  </span>
                                </div>
                              </div>

                              {lecturer.email && (
                                <span className="text-[9px] text-muted-foreground font-mono truncate hidden sm:inline">
                                  {lecturer.email}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generated Faculty Advisory Preview */}
            <div className="space-y-1">
              <Label className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">
                Automated Milestone Risk Summary
              </Label>
              <div className="p-2.5 sm:p-3 rounded-lg bg-background/80 border border-border/70 text-[11px] sm:text-xs text-foreground/90 space-y-1 leading-relaxed font-sans">
                <p className="font-semibold text-primary">
                  Subject: Academic Retention Alert · {student.fullName} ({student.riskLevel.toUpperCase()})
                </p>
                <p className="text-muted-foreground">
                  {factorSummary || "Multiple pending coursework deadlines or quiz score decline detected."}
                </p>
              </div>
            </div>

            {/* Confidential Admin Note to Faculty */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="faculty-custom-note" className="text-[11px] sm:text-xs font-bold text-foreground">
                  Confidential Admin Guidance / Note to Faculty (Optional)
                </Label>
                <span className="text-[10px] text-muted-foreground">Appended to advisory</span>
              </div>
              <Textarea
                id="faculty-custom-note"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g., Student requested extension due to family emergency; please offer 1-on-1 concept review during tomorrow's lab..."
                rows={isMobile ? 3 : 4}
                className="text-xs resize-none leading-relaxed bg-background/70 font-sans"
              />
            </div>

            {/* Email Delivery Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-card/70 border border-border/80 text-xs cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                  <Mail className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-foreground block truncate text-xs">
                    Send Official Advisory to Faculty Email Inboxes
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                    Dispatches detailed student dossier to {selectedLecturerIds.size} professor(s)
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
              disabled={isSending || selectedLecturerIds.size === 0}
              className="flex-1 sm:flex-none sm:min-w-[160px] h-8 sm:h-9 text-xs font-semibold shadow-md shadow-primary/20 gap-1.5"
            >
              <Send className={cn("size-3", isSending && "animate-spin")} />
              {isSending ? "Dispatching..." : `Alert ${selectedLecturerIds.size} Faculty Member(s)`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
