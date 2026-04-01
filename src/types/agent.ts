// ─── EduSpace AI Agent — Type Definitions ────────────────────────────────────
import { z } from "zod";

export const AgentResponseSchema = z.object({
  type: z.enum(["text", "action_request", "question", "confirmation", "read_result", "off_topic", "error"]),
  message: z.string(),
  action: z.union([
    z.string(),
    z.object({
      type: z.string(),
      data: z.any()
    })
  ]).optional()
});
// These are brand-new types for the agent feature only.
// Zero overlap with existing ai_conversations / ai_messages types.

export type AgentRole = "user" | "agent";

export type MessageDisplayType =
  | "text"
  | "confirmation"
  | "success"
  | "error"
  | "loading";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  type: MessageDisplayType;
  timestamp: Date;
  confirmationData?: ConfirmationData;
}

// What Gemini returns (always JSON)
export interface GeminiAgentResponse {
  type:
    | "text"
    | "action_request"
    | "question"
    | "confirmation"
    | "read_result"
    | "off_topic"
    | "error";
  message: string;
  action?: string | {
    type: string;
    data: any;
  };
  // Deprecated / Legacy properties to be cleaned up
  params?: Record<string, unknown>;
  summary?: Record<string, string>;
  student_count?: number;
  data?: unknown;
}

// Actions the agent can execute (write operations)
export type AgentActionType =
  | "create_assignment"
  | "create_quiz"
  | "mark_attendance"
  | "schedule_class"
  | "send_notification"
  | "grade_submission";

// Held in state while user reviews before confirming
export interface ConfirmationData {
  action: AgentActionType;
  params: Record<string, unknown>;
  summary: Record<string, string>;
  student_count?: number;
  message: string;
  // Resolved only for attendance — matched students from DB
  resolvedStudents?: {
    present: ResolvedStudent[];
    absent: ResolvedStudent[];
    late: ResolvedStudent[];
    unmatched: string[];
  };
}

export interface ResolvedStudent {
  student_name: string;
  register_number: string;
  enrollment_id: string; // class_students.id — used in attendance_records
  student_id: string | null; // auth user id, may be null for pre-enrolled
}

// Context injected into every Gemini prompt
export interface ClassContext {
  id: string;
  class_name: string | null;
  course_code: string;
  student_count: number;
}

// OpenRouter / Gemini conversation turn
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export type TypingStatus =
  | ""
  | "Thinking..."
  | "✨ Thinking..."
  | "🔍 Searching your data..."
  | "✨ Preparing assignment template..."
  | "🎯 Generating quiz questions..."
  | "✅ Recording attendance..."
  | "📅 Preparing schedule..."
  | "🔔 Preparing notification..."
  | "📝 Saving grade..."
  | "🔍 Fetching your data..."
  | "Loading history..."
  | "✨ Creating new session...";
