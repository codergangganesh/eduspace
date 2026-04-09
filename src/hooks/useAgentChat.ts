import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AgentMessage,
  AgentActionType,
  ClassContext,
  ConversationTurn,
  ConfirmationData,
  GeminiAgentResponse,
  ResolvedStudent,
  TypingStatus,
} from "@/types/agent";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

/** Strip markdown code fences Gemini sometimes wraps JSON in */
const extractJSON = (raw: string): any => {
  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse AI JSON:", raw);
    throw new Error("The agent returned an invalid response format. Please try again.");
  }
};

/** Fuzzy name matcher: returns true if db name contains all words from query */
const nameMatches = (dbName: string, queryName: string): boolean => {
  const q = queryName.toLowerCase().trim();
  const d = dbName.toLowerCase();
  return q.split(/\s+/).every((word) => d.includes(word));
};

// ─── Groq API ─────────────────────────────────────────────────────────────────

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const callGemini = async (
  history: ConversationTurn[],
  systemPrompt: string
): Promise<GeminiAgentResponse> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string;
  if (!apiKey) throw new Error("VITE_GROQ_API_KEY is not set in .env");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  return extractJSON(raw);
};

// ─── System Prompt Builder ────────────────────────────────────────────────────

const buildSystemPrompt = (
  role: string,
  name: string,
  classes: ClassContext[]
): string => {
  const today = new Date().toISOString().split("T")[0];

  const classesText =
    classes.length > 0
      ? classes
        .map(
          (c) =>
            `- "${c.class_name ?? "Unnamed"}" (${c.course_code}, class_id: "${c.id}"${role === "lecturer" ? `, ${c.student_count} students` : ""
            })`
        )
        .join("\n")
      : "No classes found in your account.";


  const lecturerActions = `
WRITE ACTIONS (require user confirmation before DB write):
  create_assignment  — Create a new assignment for a class
  create_quiz        — Generate and save a quiz with questions
  mark_attendance    — Record attendance for a class session
  schedule_class     — Add a recurring or one-time schedule entry
  send_notification  — Send a notification to students in a class
  grade_submission   — Save a grade and feedback for a student submission

READ ACTIONS (no confirmation needed):
  get_attendance_report      — Show attendance stats for a class
  get_pending_submissions    — Show who has/hasn't submitted an assignment
`;

  const studentActions = `
READ ACTIONS (no confirmation needed):
  get_assignments    — Show pending assignments with due dates
  get_attendance     — Show attendance percentage per class
  get_schedule       — Show upcoming class schedule
  get_quiz_results   — Show recent quiz scores
  get_notifications  — Show recent notifications
`;

  return `You are the EduSpace AI Agent — a conversational interface for the EduSpace LMS.
Respond in a friendly but professional tone.

TODAY: ${today}
USER: ${name}
ROLE: ${role}

${role === "lecturer" ? "LECTURER" : "STUDENT"} CLASSES:
${classesText}

${role === "lecturer" ? lecturerActions : studentActions}

══════════════════════════════════════
CRITICAL RULES (never violate these):
══════════════════════════════════════
1. NEVER reference a class or student not shown in the context above.
2. Students CANNOT create assignments, quizzes, or mark attendance.
3. ALWAYS return JSON. No conversation text outside the JSON.
4. Use "message" field for your response.
5. Respond ONLY with a single valid JSON object.

══════════════════════════════════════
RESPONSE SCHEMAS (pick exactly one):
══════════════════════════════════════

Question / follow-up:
{"type":"question","message":"Your question here"}

Read-only result:
{"type":"read_result","message":"Nicely formatted result with emojis"}

Write action confirmation:
{"type":"confirmation","message":"Here's what I'll do:","action":"ACTION_NAME","params":{...},"summary":{"Field":"Value"},"student_count":N}

Off-topic / Error:
{"type":"off_topic","message":"..."} | {"type":"error","message":"..."}

`;
};

// ─── DB Execution Layer ───────────────────────────────────────────────────────
// All Supabase writes happen here. Called only after user confirms.

const executeAction = async (
  confirmation: ConfirmationData,
  userId: string,
  userName: string
): Promise<string> => {
  const { action, params } = confirmation;

  switch (action) {
    // ── Create Assignment ─────────────────────────────────────────────────
    case "create_assignment": {
      // 🔐 Fix MED-03: Validate AI-returned params before any DB write
      const title = String(params.title ?? "").trim();
      if (!title) throw new Error("Assignment title is required.");
      if (title.length > 200) throw new Error("Assignment title is too long (max 200 chars).");
      if (!params.class_id) throw new Error("Class ID is required.");

      const maxPoints = Number(params.max_points ?? 100);
      if (isNaN(maxPoints) || maxPoints < 0 || maxPoints > 1000)
        throw new Error("Max points must be between 0 and 1000.");

      const { data: assignment, error } = await supabase
        .from("assignments")
        .insert({
          title,
          class_id: params.class_id as string,
          topic: (params.topic as string) ?? null,
          description: (params.description as string) ?? null,
          instructions: (params.instructions as string) ?? null,
          due_date: (params.due_date as string) ?? null,
          max_points: maxPoints,
          lecturer_id: userId,
          status: "active",
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      // Notify enrolled students
      const { data: students } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", params.class_id as string)
        .not("student_id", "is", null);

      if (students && students.length > 0) {
        const notifications = students.map((s) => ({
          recipient_id: s.student_id as string,
          sender_id: userId,
          title: `New Assignment: ${title}`,
          message: `A new assignment "${title}" has been posted. Due: ${params.due_date ?? "TBD"}.`,
          type: "announcement",
          class_id: params.class_id as string,
          link: "/student/assignments",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      await logAction(userId, action, params, assignment?.id);
      const count = students?.length ?? 0;
      return `✅ Assignment **"${title}"** created successfully!\n${count} student${count !== 1 ? "s" : ""} in the class have been notified.\nDue: ${params.due_date ?? "No deadline set"} | Points: ${maxPoints}`;
    }

    // ── Create Quiz ───────────────────────────────────────────────────────
    case "create_quiz": {
      // 🔐 Fix MED-03: Validate quiz params
      const quizTitle = String(params.title ?? "").trim();
      if (!quizTitle) throw new Error("Quiz title is required.");
      if (quizTitle.length > 200) throw new Error("Quiz title is too long (max 200 chars).");
      if (!params.class_id) throw new Error("Class ID is required.");

      const passPercentage = Number(params.pass_percentage ?? 40);
      if (isNaN(passPercentage) || passPercentage < 0 || passPercentage > 100)
        throw new Error("Pass percentage must be between 0 and 100.");

      const questions = (params.questions as {
        question_text: string;
        options: Record<string, string>;
        correct_answer: string;
        marks: number;
      }[]);

      if (!Array.isArray(questions) || questions.length === 0)
        throw new Error("Quiz must have at least one question.");
      if (questions.length > 100)
        throw new Error("Quiz cannot have more than 100 questions.");

      // Validate each question's marks
      for (const q of questions) {
        const marks = Number(q.marks);
        if (isNaN(marks) || marks < 0 || marks > 100)
          throw new Error(`Invalid marks value (${q.marks}) in a question. Must be 0–100.`);
        q.marks = marks; // normalize
      }

      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      const { data: quiz, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          title: quizTitle,
          class_id: params.class_id as string,
          description: (params.description as string) ?? null,
          pass_percentage: passPercentage,
          due_date: (params.due_date as string) ?? null,
          created_by: userId,
          status: "active",
          total_marks: totalMarks,
        })
        .select("id")
        .single();

      if (quizErr) throw new Error(quizErr.message);

      const questionRows = questions.map((q, i) => ({
        quiz_id: quiz!.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        order_index: i,
      }));

      const { error: qErr } = await supabase.from("quiz_questions").insert(questionRows);
      if (qErr) throw new Error(qErr.message);

      // Notify students
      const { data: students } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", params.class_id as string)
        .not("student_id", "is", null);

      if (students && students.length > 0) {
        const notifications = students.map((s) => ({
          recipient_id: s.student_id as string,
          sender_id: userId,
          title: `New Quiz: ${params.title}`,
          message: `A new quiz "${params.title}" is available with ${questions.length} questions.`,
          type: "announcement",
          class_id: params.class_id as string,
          link: "/student/quizzes",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      await logAction(userId, action, { ...params, quiz_id: quiz?.id });
      const count = students?.length ?? 0;
      return `✅ Quiz **"${params.title}"** created with ${questions.length} questions!\n${count} student${count !== 1 ? "s" : ""} have been notified.\nTotal marks: ${totalMarks} | Pass: ${params.pass_percentage}%`;
    }

    // ── Mark Attendance ────────────────────────────────────────────────────
    case "mark_attendance": {
      const resolved = confirmation.resolvedStudents;
      if (!resolved) throw new Error("Student data not resolved");

      // Create attendance session
      const { data: session, error: sessErr } = await supabase
        .from("attendance_sessions")
        .insert({
          class_id: params.class_id as string,
          session_date: params.session_date as string,
          title: (params.title as string) ?? "Attendance",
          created_by: userId,
        })
        .select("id")
        .single();

      if (sessErr) throw new Error(sessErr.message);

      // Build attendance records
      const records = [
        ...resolved.present.map((s) => ({
          session_id: session!.id,
          class_id: params.class_id as string,
          enrollment_id: s.enrollment_id,
          student_id: s.student_id,
          status: "present",
          marked_by: userId,
        })),
        ...resolved.absent.map((s) => ({
          session_id: session!.id,
          class_id: params.class_id as string,
          enrollment_id: s.enrollment_id,
          student_id: s.student_id,
          status: "absent",
          marked_by: userId,
        })),
        ...resolved.late.map((s) => ({
          session_id: session!.id,
          class_id: params.class_id as string,
          enrollment_id: s.enrollment_id,
          student_id: s.student_id,
          status: "late",
          marked_by: userId,
        })),
      ];

      if (records.length > 0) {
        const { error: recErr } = await supabase.from("attendance_records").insert(records);
        if (recErr) throw new Error(recErr.message);
      }

      await logAction(userId, action, params, session?.id);
      return `✅ Attendance marked for ${params.session_date}!\n**Session:** ${params.title}\n✓ Present: ${resolved.present.length} | ✗ Absent: ${resolved.absent.length} | ⏰ Late: ${resolved.late.length}`;
    }

    // ── Schedule Class ─────────────────────────────────────────────────────
    case "schedule_class": {
      const { data: schedule, error } = await supabase
        .from("schedules")
        .insert({
          title: params.title as string,
          class_id: params.class_id as string,
          type: (params.type as string) ?? "lecture",
          start_time: params.start_time as string,
          end_time: params.end_time as string,
          is_recurring: (params.is_recurring as boolean) ?? false,
          day_of_week: params.is_recurring ? (params.day_of_week as number) : null,
          specific_date: !params.is_recurring ? (params.specific_date as string) : null,
          location: (params.location as string) ?? null,
          notes: (params.notes as string) ?? null,
          lecturer_id: userId,
          lecturer_name: userName,
          created_by: userId,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      await logAction(userId, action, params, schedule?.id);

      const when = params.is_recurring
        ? `Every ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][params.day_of_week as number] ?? ""}`
        : params.specific_date;

      return `✅ Schedule created!\n**"${params.title}"** — ${when}, ${params.start_time}–${params.end_time}${params.location ? ` | ${params.location}` : ""}`;
    }

    // ── Send Notification ──────────────────────────────────────────────────
    case "send_notification": {
      const { data: students, error: studErr } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", params.class_id as string)
        .not("student_id", "is", null);

      if (studErr) throw new Error(studErr.message);
      if (!students || students.length === 0) {
        return "⚠️ No linked students found in this class. Notification not sent.";
      }

      const notifications = students.map((s) => ({
        recipient_id: s.student_id as string,
        sender_id: userId,
        title: params.title as string,
        message: params.message as string,
        type: params.type as string,
        class_id: params.class_id as string,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw new Error(error.message);

      await logAction(userId, action, params);
      return `✅ Notification sent to ${students.length} student${students.length !== 1 ? "s" : ""}!\n**"${params.title}"**`;
    }

    // ── Grade Submission ───────────────────────────────────────────────────
    case "grade_submission": {
      // 🔐 Fix MED-03: Validate grade before writing to DB
      const grade = Number(params.grade);
      if (isNaN(grade) || grade < 0 || grade > 100)
        throw new Error(`Invalid grade "${params.grade}". Grade must be between 0 and 100.`);

      if (!params.assignment_title || !params.student_name)
        throw new Error("Assignment title and student name are required.");

      // Find assignment by title + class
      const { data: assignment } = await supabase
        .from("assignments")
        .select("id, title")
        .eq("class_id", params.class_id as string)
        .ilike("title", `%${params.assignment_title as string}%`)
        .single();

      if (!assignment) throw new Error(`Assignment "${params.assignment_title}" not found.`);

      // Find student submission
      const { data: studentRecord } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", params.class_id as string)
        .ilike("student_name", `%${params.student_name as string}%`)
        .single();

      if (!studentRecord?.student_id) {
        throw new Error(`Student "${params.student_name}" not found in this class.`);
      }

      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          grade,
          feedback: (params.feedback as string) ?? null,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("assignment_id", assignment.id)
        .eq("student_id", studentRecord.student_id);

      if (error) throw new Error(error.message);

      // Notify student
      await supabase.from("notifications").insert({
        recipient_id: studentRecord.student_id,
        sender_id: userId,
        title: `Grade Posted: ${assignment.title}`,
        message: `Your grade for "${assignment.title}" is ${grade}. ${params.feedback ? `Feedback: ${params.feedback}` : ""}`,
        type: "announcement",
        link: "/student/assignments",
      });

      await logAction(userId, action, params);
      return `✅ Grade **${grade}** saved for **${params.student_name}**!\nAssignment: "${assignment.title}"${params.feedback ? `\nFeedback sent.` : ""}`;
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

/** Log every AI-driven write to agent_actions (best-effort, non-blocking) */
const logAction = async (
  userId: string,
  tool: string,
  params: Record<string, unknown>,
  relatedId?: string
) => {
  try {
    await supabase.from("agent_actions" as any).insert({
      user_id: userId,
      tool_called: tool,
      params: { ...params, related_id: relatedId },
      result_status: "success",
      source: "ai_agent",
    });
  } catch {
    // Non-critical — silently ignore log failures
  }
};

// ── Attendance name resolver (frontend handles matching) ──────────────────────
const resolveAttendanceStudents = async (
  classId: string,
  absentNames: string[],
  lateNames: string[]
) => {
  const { data: allStudents, error } = await supabase
    .from("class_students")
    .select("id, student_name, register_number, student_id")
    .eq("class_id", classId);

  if (error || !allStudents) throw new Error("Failed to fetch students");

  const absent: ResolvedStudent[] = [];
  const late: ResolvedStudent[] = [];
  const unmatched: string[] = [];

  const resolve = (names: string[], bucket: ResolvedStudent[]) => {
    for (const name of names) {
      const found = allStudents.find((s) => nameMatches(s.student_name, name));
      if (found) {
        bucket.push({
          student_name: found.student_name,
          register_number: found.register_number,
          enrollment_id: found.id,
          student_id: found.student_id,
        });
      } else {
        unmatched.push(name);
      }
    }
  };

  resolve(absentNames, absent);
  resolve(lateNames, late);

  const absentAndLateIds = new Set([
    ...absent.map((s) => s.enrollment_id),
    ...late.map((s) => s.enrollment_id),
  ]);

  const present: ResolvedStudent[] = allStudents
    .filter((s) => !absentAndLateIds.has(s.id))
    .map((s) => ({
      student_name: s.student_name,
      register_number: s.register_number,
      enrollment_id: s.id,
      student_id: s.student_id,
    }));

  return { present, absent, late, unmatched };
};

// ─── Main Hook ────────────────────────────────────────────────────────────────

export const useAgentChat = () => {
  const { user, role, profile } = useAuth();

  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<TypingStatus>("");
  const [pendingConfirmation, setPendingConfirmation] =
    useState<ConfirmationData | null>(null);

  // Gemini conversation history (not displayed, just context for the model)
  const historyRef = useRef<ConversationTurn[]>([]);

  // ── Fetch lecturer's classes with student counts ──────────────────────────
  const fetchLecturerClasses = useCallback(async (): Promise<ClassContext[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("classes")
      .select("id, class_name, course_code")
      .eq("lecturer_id", user.id)
      .eq("is_active", true);

    if (!data) return [];

    const withCounts = await Promise.all(
      data.map(async (cls) => {
        const { count } = await supabase
          .from("class_students")
          .select("*", { count: "exact", head: true })
          .eq("class_id", cls.id);
        return { ...cls, student_count: count ?? 0 };
      })
    );
    return withCounts;
  }, [user]);

  // ── Fetch student's enrolled classes ────────────────────────────────────
  const fetchStudentClasses = useCallback(async (): Promise<ClassContext[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("class_students")
      .select("class_id, classes(id, class_name, course_code)")
      .eq("student_id", user.id);

    return (data ?? [])
      .map((e) => {
        const cls = e.classes as { id: string; class_name: string | null; course_code: string } | null;
        return cls ? { id: cls.id, class_name: cls.class_name, course_code: cls.course_code, student_count: 0 } : null;
      })
      .filter((c): c is ClassContext => !!c);
  }, [user]);

  // ── Load an existing conversation ──────────────────────────────────────────
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    setIsTyping(true);
    setTypingStatus("Loading history...");
    try {
      const { data, error } = await supabase
        .from("agent_history" as any)
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const loadedMessages: AgentMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        role: m.sender,
        content: m.content,
        type: (m.content.startsWith("{") && m.content.endsWith("}")) ? "confirmation" : "text",
        timestamp: new Date(m.created_at),
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      
      // Sync Gemini history ref
      historyRef.current = loadedMessages.map(m => ({
        role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant",
        content: m.content,
      }));

    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsTyping(false);
      setTypingStatus("");
    }
  }, [user]);

  // ── Add a display message ─────────────────────────────────────────────────
  const addMessage = useCallback((
    agentRole: AgentMessage["role"],
    content: string,
    type: AgentMessage["type"],
    confirmationData?: ConfirmationData,
    conversationId?: string
  ) => {
    const newMessage = { id: uid(), role: agentRole, content, type, timestamp: new Date(), confirmationData };
    setMessages((prev) => [...prev, newMessage]);

    // Background save to Supabase history (per-message deletion requirement)
    if (user) {
      supabase
        .from("agent_history" as any)
        .insert({
          user_id: user.id,
          content,
          sender: agentRole,
          conversation_id: conversationId || currentConversationId,
        })
        .then(({ error }) => {
          if (error) console.error("History save error:", error);
        });
        
      // Update last activity in conversation
      if (conversationId || currentConversationId) {
        supabase
          .from("agent_conversations" as any)
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId || currentConversationId);
      }
    }
  }, [user, currentConversationId]);

  // ── Core: send user message, get Gemini response ─────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!user || !role) return;

    let targetConvId = currentConversationId;

    // 1. Create conversation if it's the first message
    if (!targetConvId) {
        const title = text.length > 40 ? text.substring(0, 37) + "..." : text;
        const { data: newConv, error } = await supabase
            .from("agent_conversations" as any)
            .insert({ user_id: user.id, title })
            .select("id")
            .single();
        
        if (error) {
            console.error("Failed to create conversation:", error);
        } else if (newConv) {
            targetConvId = (newConv as any).id;
            setCurrentConversationId(targetConvId);
        }
    }

    // Add user bubble
    addMessage("user", text, "text", undefined, targetConvId!);
    setIsTyping(true);
    setTypingStatus("Thinking...");

    try {
      // 2. Fetch fresh context
      setTypingStatus("🔍 Searching your data...");
      const classes =
        role === "lecturer"
          ? await fetchLecturerClasses()
          : await fetchStudentClasses();
      

      // 3. Build system prompt
      const systemPrompt = buildSystemPrompt(role, profile?.full_name ?? "User", classes);

      // 4. Add user turn to history
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
      ];

      // 5. Call Gemini
      const parsed = await callGemini(historyRef.current, systemPrompt);

      // 6. Add assistant turn to history
      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: JSON.stringify(parsed) },
      ];

      // 7. Handle response type
      switch (parsed.type) {
        case "question":
        case "read_result":
        case "off_topic":
          addMessage("agent", parsed.message, "text", undefined, targetConvId!);
          break;

        case "error":
          addMessage("agent", parsed.message, "error", undefined, targetConvId!);
          break;

        case "confirmation": {
          const targetAction = (typeof parsed.action === 'string' ? parsed.action : parsed.action?.type) as AgentActionType;
          if (!targetAction || !parsed.params) {
            addMessage("agent", parsed.message, "text", undefined, targetConvId!);
            break;
          }

          let confirmation: ConfirmationData = {
            action: targetAction,
            params: parsed.params,
            summary: parsed.summary ?? {},
            student_count: parsed.student_count,
            message: parsed.message,
          };

          // Attendance: resolve student names → IDs on the frontend
          if (targetAction === "mark_attendance" && parsed.params.class_id) {
            setTypingStatus("✅ Recording attendance...");
            const resolved = await resolveAttendanceStudents(
              parsed.params.class_id as string,
              (parsed.params.absent_names as string[]) ?? [],
              (parsed.params.late_names as string[]) ?? []
            );
            confirmation = { ...confirmation, resolvedStudents: resolved };

            // Build enhanced message showing matched/unmatched
            const matchedLines = [
              ...resolved.present.map((s) => `✅ ${s.student_name} (${s.register_number}) — Present`),
              ...resolved.absent.map((s) => `❌ ${s.student_name} (${s.register_number}) — Absent`),
              ...resolved.late.map((s) => `⏰ ${s.student_name} (${s.register_number}) — Late`),
              ...resolved.unmatched.map((n) => `⚠️ "${n}" — Not found in class roster`),
            ].join("\n");

            confirmation.message =
              resolved.unmatched.length > 0
                ? `I found most students, but some names didn't match the roster:\n\n${matchedLines}\n\n**Please correct the unmatched names, or confirm to proceed with matched students only.**`
                : parsed.message;

            confirmation.summary = {
              ...parsed.summary,
              Present: `${resolved.present.length} students`,
              Absent: `${resolved.absent.length} students`,
              Late: `${resolved.late.length} students`,
              ...(resolved.unmatched.length > 0
                ? { "⚠️ Not Found": resolved.unmatched.join(", ") }
                : {}),
            };
          }

          setPendingConfirmation(confirmation);
          addMessage("agent", confirmation.message, "confirmation", confirmation, targetConvId!);
          break;
        }

        default:
          addMessage("agent", parsed.message ?? "Something unexpected happened.", "text", undefined, targetConvId!);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      addMessage("agent", `❌ ${msg}`, "error", undefined, targetConvId!);
    } finally {
      setIsTyping(false);
      setTypingStatus("");
    }
  }, [user, role, profile, addMessage, fetchLecturerClasses, fetchStudentClasses, currentConversationId]);

  // ── User confirms an action ───────────────────────────────────────────────
  const confirmAction = useCallback(async () => {
    if (!pendingConfirmation || !user) return;

    const statusMap: Record<string, TypingStatus> = {
      create_assignment: "✨ Preparing assignment template...",
      create_quiz: "🎯 Generating quiz questions...",
      mark_attendance: "✅ Recording attendance...",
      schedule_class: "📅 Preparing schedule...",
      send_notification: "🔔 Preparing notification...",
      grade_submission: "📝 Saving grade...",
    };

    setIsTyping(true);
    setTypingStatus(statusMap[pendingConfirmation.action] ?? "Thinking...");
    const targetConvId = currentConversationId;
    setPendingConfirmation(null);

    try {
      const resultMsg = await executeAction(
        pendingConfirmation,
        user.id,
        profile?.full_name ?? "Lecturer"
      );

      // Add success message and record in Gemini history so it knows what happened
      addMessage("agent", resultMsg, "success", undefined, targetConvId!);
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: "[ACTION CONFIRMED]" },
        { role: "assistant", content: JSON.stringify({ type: "read_result", message: resultMsg }) },
      ];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed. Please try again.";
      addMessage("agent", `❌ ${msg}`, "error", undefined, targetConvId!);
    } finally {
      setIsTyping(false);
      setTypingStatus("");
    }
  }, [pendingConfirmation, user, profile, addMessage, currentConversationId]);

  // ── User cancels confirmation ─────────────────────────────────────────────
  const cancelAction = useCallback(() => {
    const targetConvId = currentConversationId;
    setPendingConfirmation(null);
    addMessage("agent", "Action cancelled. What would you like to do?", "text", undefined, targetConvId!);
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: "[ACTION CANCELLED]" },
      { role: "assistant", content: JSON.stringify({ type: "read_result", message: "Action cancelled." }) },
    ];
  }, [addMessage, currentConversationId]);

  // ── Start a fresh chat ───────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setPendingConfirmation(null);
    historyRef.current = [];
  }, []);

  return {
    messages,
    currentConversationId,
    isTyping,
    typingStatus,
    pendingConfirmation,
    sendMessage,
    confirmAction,
    cancelAction,
    clearChat,
    loadConversation,
  };
};
