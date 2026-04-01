import { AlertTriangle, Check, X, Edit3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationData } from "@/types/agent";
import { cn } from "@/lib/utils";

interface AgentConfirmCardProps {
  data: ConfirmationData;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

const ACTION_LABELS: Record<string, string> = {
  create_assignment: "Create Assignment",
  create_quiz: "Create Quiz",
  mark_attendance: "Mark Attendance",
  schedule_class: "Schedule Class",
  send_notification: "Send Notification",
  grade_submission: "Save Grade",
};

const ACTION_COLORS: Record<string, string> = {
  create_assignment: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  create_quiz: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30",
  mark_attendance: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
  schedule_class: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
  send_notification: "border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30",
  grade_submission: "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950/30",
};

export const AgentConfirmCard = ({
  data,
  onConfirm,
  onCancel,
  isExecuting,
}: AgentConfirmCardProps) => {
  const actionLabel = ACTION_LABELS[data.action] ?? "Action";
  const cardColor = ACTION_COLORS[data.action] ?? "border-border bg-muted/20";

  const quizQuestions =
    data.action === "create_quiz"
      ? (data.params.questions as {
          question_text: string;
          options: Record<string, string>;
          correct_answer: string;
          marks: number;
        }[]) ?? []
      : [];

  return (
    <div
      className={cn(
        "mx-2 my-1 max-w-[85%] rounded-2xl rounded-tl-sm border p-4 shadow-sm",
        cardColor
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-amber-500" />
        <span className="text-sm font-semibold text-foreground">
          Confirm: {actionLabel}
        </span>
        {data.student_count !== undefined && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {data.student_count} student{data.student_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Summary table */}
      <div className="mb-3 rounded-xl border border-border/50 bg-card/80 overflow-hidden">
        {Object.entries(data.summary).map(([key, value], i) => (
          <div
            key={key}
            className={cn(
              "flex gap-3 px-3 py-2 text-sm",
              i !== 0 && "border-t border-border/40"
            )}
          >
            <span className="w-28 shrink-0 font-medium text-muted-foreground">
              {key}
            </span>
            <span className="flex-1 text-foreground break-words">{value}</span>
          </div>
        ))}
      </div>

      {/* Quiz questions preview */}
      {quizQuestions.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookOpen className="size-3" />
            Questions Preview
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border/50 bg-card/80 divide-y divide-border/40">
            {quizQuestions.map((q, i) => (
              <div key={i} className="px-3 py-2.5 text-xs">
                <p className="mb-1.5 font-medium text-foreground">
                  Q{i + 1}. {q.question_text}
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({q.marks} mark{q.marks !== 1 ? "s" : ""})
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(q.options).map(([key, val]) => (
                    <span
                      key={key}
                      className={cn(
                        "rounded px-2 py-0.5",
                        key === q.correct_answer
                          ? "bg-emerald-100 font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "text-muted-foreground"
                      )}
                    >
                      {key.toUpperCase()}) {val}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance resolved students (unmatched warning) */}
      {data.resolvedStudents?.unmatched && data.resolvedStudents.unmatched.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-100/60 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <strong>⚠️ Unmatched names:</strong> {data.resolvedStudents.unmatched.join(", ")}
          <p className="mt-0.5 opacity-80">
            These students will be skipped. Confirm to proceed with matched students only.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isExecuting}
          className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Check className="size-3.5" />
          {isExecuting ? "Processing..." : "Yes, proceed"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isExecuting}
          className="gap-1.5"
        >
          <X className="size-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isExecuting}
          className="gap-1.5 text-muted-foreground"
          title="Type your changes and I'll update the plan"
        >
          <Edit3 className="size-3.5" />
          Edit
        </Button>
      </div>
    </div>
  );
};
