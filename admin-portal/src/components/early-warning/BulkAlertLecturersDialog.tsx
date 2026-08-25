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
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface BulkAlertLecturersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: AtRiskStudent[];
  onBulkAlert: (params: {
    students: AtRiskStudent[];
    customNote?: string;
    sendEmail?: boolean;
  }) => Promise<{ success: boolean; alertedLecturersCount?: number; affectedStudentsCount?: number }>;
  isSending?: boolean;
}

export const BulkAlertLecturersDialog: React.FC<BulkAlertLecturersDialogProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onBulkAlert,
  isSending = false,
}) => {
  const [customNote, setCustomNote] = useState("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);
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

  useEffect(() => {
    if (isOpen) {
      setCustomNote("");
      setSendEmail(true);
      setIsFacultyDropdownOpen(false);
    }
  }, [isOpen]);

  // Aggregate unique faculty members across all selected students
  const aggregatedFaculty = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name?: string;
        email?: string;
        studentCount: number;
        courseNames: Set<string>;
      }
    >();

    selectedStudents.forEach((student) => {
      student.enrolledClasses.forEach((cls) => {
        if (!cls.lecturerId) return;
        let entry = map.get(cls.lecturerId);
        if (!entry) {
          entry = {
            id: cls.lecturerId,
            name: cls.lecturerName || "Course Lecturer",
            email: cls.lecturerEmail || "",
            studentCount: 0,
            courseNames: new Set<string>(),
          };
          map.set(cls.lecturerId, entry);
        }
        entry.studentCount++;
        entry.courseNames.add(cls.name);
      });
    });

    return Array.from(map.values()).map((f) => ({
      ...f,
      courseNamesList: Array.from(f.courseNames),
    }));
  }, [selectedStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || aggregatedFaculty.length === 0) return;

    const res = await onBulkAlert({
      students: selectedStudents,
      customNote: customNote.trim() || undefined,
      sendEmail,
    });

    if (res.success) {
      onClose();
    }
  };

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
                  Cohort Faculty Advisory Dispatch
                </SheetTitle>
                <Badge variant="outline" className="text-[9px] font-bold uppercase text-primary border-primary/30">
                  {aggregatedFaculty.length} Faculty
                </Badge>
              </div>
              <SheetDescription className="text-[10px] sm:text-xs text-muted-foreground truncate">
                Dispatches retention warnings to all assigned teachers across {selectedStudents.length} student(s)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5">
            {/* Cohort Overview Card */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span className="font-bold text-foreground">
                  Flagged Cohort: <strong>{selectedStudents.length} Students</strong>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Reaches <strong>{aggregatedFaculty.length} Assigned Professors</strong>
              </span>
            </div>

            {/* Target Faculty Dropdown Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">
                  Targeted Faculty Members ({aggregatedFaculty.length})
                </Label>
                <span className="text-[10px] text-muted-foreground">Automatically resolved</span>
              </div>

              {aggregatedFaculty.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>No assigned faculty members found for the selected students.</span>
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
                          All Assigned Faculty ({aggregatedFaculty.length} Professors)
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate font-mono">
                          {isFacultyDropdownOpen ? "Click to collapse list" : "Click to view affected professors & courses"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="secondary" className="text-[9px] font-bold">
                        {aggregatedFaculty.length} Faculty
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
                    <div className="border-t border-border/60 p-2.5 space-y-1.5 max-h-48 overflow-y-auto bg-background/50 animate-in fade-in slide-in-from-top-1">
                      {aggregatedFaculty.map((faculty) => (
                        <div
                          key={faculty.id}
                          className="p-2.5 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground truncate">{faculty.name}</span>
                              <Badge variant="secondary" className="text-[9px] font-semibold">
                                {faculty.studentCount} flagged student(s)
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono truncate block">
                              Courses: {faculty.courseNamesList.join(", ")}
                            </span>
                          </div>
                          {faculty.email && (
                            <span className="text-[9px] text-muted-foreground font-mono truncate hidden sm:inline">
                              {faculty.email}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confidential Admin Note to Faculty */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-faculty-note" className="text-[11px] sm:text-xs font-bold text-foreground">
                  Confidential Guidance / Note to Faculty (Optional)
                </Label>
                <span className="text-[10px] text-muted-foreground">Included in advisory</span>
              </div>
              <Textarea
                id="bulk-faculty-note"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g., Department Retention Committee requests all faculty check in with flagged students prior to Midterm evaluations..."
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
                    Broadcast Advisory to Faculty Email Inboxes
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                    Direct delivery to all {aggregatedFaculty.length} faculty email addresses
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
              disabled={isSending || aggregatedFaculty.length === 0}
              className="flex-1 sm:flex-none sm:min-w-[180px] h-8 sm:h-9 text-xs font-semibold shadow-md shadow-primary/20 gap-1.5"
            >
              <Send className={cn("size-3", isSending && "animate-spin")} />
              {isSending ? "Dispatching..." : `Alert ${aggregatedFaculty.length} Faculty Members`}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
