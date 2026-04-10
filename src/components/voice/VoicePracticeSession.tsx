import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  X,
  Square,
  Loader2,
  Menu,
  ChevronDown,
  Briefcase,
  Languages,
  Presentation,
  Target,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Clock,
  BarChart2,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIChatSidebar } from "@/components/student/ai-chat/AIChatSidebar";
import { InfiniteMarquee } from "@/components/common/InfiniteMarquee";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { aiChatService } from "@/lib/aiChatService";
import { PracticeMode, VoiceSession, voiceService } from "@/lib/voiceService";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Difficulty = "beginner" | "intermediate" | "advanced";
type SessionState = "idle" | "listening" | "thinking" | "speaking" | "summary";

type SessionProfile = {
  practiceMode: PracticeMode;
  focusArea: string;
  difficulty: Difficulty;
  targetDurationMinutes: number;
};

type SessionStats = {
  startTime: Date;
  words: number;
  turns: number;
  fillers: number;
  assistantWords: number;
  scopeViolations: number;
  assistantQuestions: number;
};

const DEFAULT_PROFILE: SessionProfile = {
  practiceMode: "interview",
  focusArea: "",
  difficulty: "intermediate",
  targetDurationMinutes: 10,
};

const MODES: Array<{ id: PracticeMode; label: string; desc: string; icon: any; opening: string }> = [
  { id: "interview", label: "Interview", desc: "Behavioral and technical mock rounds.", icon: Briefcase, opening: "Tell me about yourself and why you want this role." },
  { id: "language", label: "Language", desc: "Grammar, fluency, and pronunciation.", icon: Languages, opening: "What did you do today?" },
  { id: "presentation", label: "Presentation", desc: "Delivery, pacing, and structure.", icon: Presentation, opening: "Give me the opening of your presentation." },
  { id: "sales", label: "Sales", desc: "Discovery, objections, persuasion.", icon: Target, opening: "Start by discovering the customer's needs." },
  { id: "academic", label: "Academic", desc: "Viva and subject explanation.", icon: BookOpen, opening: "Explain the topic as if this is a viva question." },
  { id: "confidence", label: "Confidence", desc: "Low-pressure speaking practice.", icon: ShieldCheck, opening: "Start with a short self-introduction." },
];

const DIFFICULTIES: Array<{ id: Difficulty; label: string }> = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

function modeLabel(mode: PracticeMode) {
  return MODES.find((m) => m.id === mode)?.label ?? "Interview";
}

function buildTitle(profile: SessionProfile) {
  return profile.focusArea ? `Practice - ${modeLabel(profile.practiceMode)} - ${profile.focusArea}` : `Practice - ${modeLabel(profile.practiceMode)}`;
}

function buildPrompt(profile: SessionProfile) {
  const focus = profile.focusArea ? `Focus area: ${profile.focusArea}.` : "Focus area: general improvement.";
  return `You are Eduspace Voice Tutor, an adaptive speaking coach.
Mode: ${modeLabel(profile.practiceMode)}.
Difficulty: ${profile.difficulty}.
${focus}
Target duration: ${profile.targetDurationMinutes} minutes.

Rules:
- Stay strictly inside the selected mode and focus area.
- Do not answer general-knowledge, news, sports, coding, shopping, or personal questions that are outside the selected practice content.
- If the user goes outside scope, reply with: "That is out of content for this session. Let's stay on ${modeLabel(profile.practiceMode)}${profile.focusArea ? ` and ${profile.focusArea}` : ""}."
- Keep replies concise, usually 2 to 4 short sentences.
- Always end with one follow-up question unless you are refusing an out-of-content request.
- Correct mistakes gently and show a better version when useful.
- Adapt to the mode: interview = STAR and follow-ups, language = grammar and pronunciation, presentation = structure and delivery, sales = discovery and objections, academic = definitions and examples, confidence = calm encouragement.
- If the learner struggles, simplify the prompt and give a scaffold.`;
}

function buildOutOfContentReply(profile: SessionProfile) {
  return `That is out of content for this session. Let's stay on ${modeLabel(profile.practiceMode)}${profile.focusArea ? ` and ${profile.focusArea}` : ""}.`;
}

function extractKeywords(value: string) {
  return (value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length > 3);
}

function getModeKeywords(mode: PracticeMode) {
  switch (mode) {
    case "interview":
      return ["interview", "role", "experience", "strength", "weakness", "project", "resume", "leadership", "team", "challenge", "behavioral"];
    case "language":
      return ["grammar", "pronunciation", "fluency", "vocabulary", "sentence", "tense", "speaking", "accent", "language", "word"];
    case "presentation":
      return ["presentation", "slide", "structure", "opening", "closing", "audience", "delivery", "transition", "story", "pitch"];
    case "sales":
      return ["sales", "customer", "discovery", "objection", "value", "pitch", "close", "demo", "pricing", "need"];
    case "academic":
      return ["academic", "viva", "definition", "example", "explain", "theory", "concept", "subject", "exam", "study"];
    case "confidence":
      return ["confidence", "calm", "short", "self", "introduction", "nervous", "speech", "practice", "intro", "steady"];
    default:
      return [];
  }
}

function countMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => count + (lower.includes(term) ? 1 : 0), 0);
}

function isDefinitelyOutOfContent(speech: string) {
  const lower = speech.toLowerCase();
  const patterns = [
    /\b(weather|forecast|joke|recipe|movie|song|sports|cricket|football|stock market|crypto|bitcoin|news|latest)\b/i,
    /\b(who is|what is the capital|capital of|current president|prime minister|tell me a fact)\b/i,
    /\b(write code|fix code|debug|programming help|build an app)\b/i,
    /\b(translate this|translate it|meaning of)\b/i,
  ];

  return patterns.some((pattern) => pattern.test(lower));
}

function analyzeText(text: string, profile: SessionProfile) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const fillers = countFillers(text);
  const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length || 1;
  const modeMatches = countMatches(text, getModeKeywords(profile.practiceMode));
  const focusMatches = profile.focusArea ? countMatches(text, extractKeywords(profile.focusArea)) : 0;
  const relevanceSignals = modeMatches + focusMatches;
  const offContent = isDefinitelyOutOfContent(text) && relevanceSignals === 0;

  return {
    words,
    fillers,
    sentences,
    relevanceSignals,
    offContent,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function countFillers(text: string) {
  const fillers = ["um", "uh", "like", "you know", "actually", "basically", "kind of", "sort of"];
  const lower = text.toLowerCase();
  return fillers.reduce((sum, phrase) => sum + ((lower.match(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"))?.length) ?? 0), 0);
}

function buildSummary(history: { role: string; text: string }[], profile: SessionProfile, stats: SessionStats) {
  const userTexts = history.filter((m) => m.role === "user").map((m) => m.text);
  const assistantTexts = history.filter((m) => m.role === "assistant").map((m) => m.text);
  const turns = userTexts.length;
  const totalWords = stats.words || userTexts.reduce((sum, text) => sum + text.trim().split(/\s+/).filter(Boolean).length, 0);
  const fillers = stats.fillers || userTexts.reduce((sum, text) => sum + countFillers(text), 0);
  const assistantWords = stats.assistantWords || assistantTexts.reduce((sum, text) => sum + text.trim().split(/\s+/).filter(Boolean).length, 0);
  const durationSeconds = Math.max(1, Math.round((Date.now() - stats.startTime.getTime()) / 1000));
  const avgWords = turns ? totalWords / turns : 0;
  const fillerRate = totalWords ? fillers / totalWords : 0;
  const targetWords = profile.practiceMode === "presentation" ? 80 : profile.practiceMode === "sales" ? 55 : profile.practiceMode === "academic" ? 65 : profile.practiceMode === "language" ? 35 : profile.practiceMode === "confidence" ? 28 : 50;
  const targetTurns = clamp(Math.round(profile.targetDurationMinutes / 1.5), 4, 16);
  const communication = clamp(Math.round(100 - Math.abs(avgWords - targetWords) * 1.2 - fillerRate * 220), 35, 100);
  const fluency = clamp(Math.round(100 - fillerRate * 280), 35, 100);
  const scope = clamp(Math.round(turns ? ((turns - stats.scopeViolations) / turns) * 100 : 100), 35, 100);
  const engagement = clamp(Math.round((turns / targetTurns) * 100), 35, 100);
  const coaching = clamp(Math.round((stats.assistantQuestions / Math.max(assistantTexts.length, 1)) * 100), 35, 100);
  const score = Math.round(communication * 0.35 + fluency * 0.15 + scope * 0.25 + engagement * 0.15 + coaching * 0.1);

  const recommendations = [
    stats.scopeViolations > 0 ? "Keep the session inside the selected mode and focus area. Off-content prompts are now blocked." : "",
    fillers > 2 ? "Pause briefly before answering to reduce filler words." : "",
    avgWords > targetWords * 1.45 ? "Lead with the answer first, then add one supporting example." : "",
    avgWords < targetWords * 0.65 ? "Expand the answer slightly with one clear detail." : "",
    profile.practiceMode === "interview" ? "Use STAR: situation, task, action, result." : "",
    profile.practiceMode === "language" ? "Repeat the corrected sentence once after the coach." : "",
    profile.practiceMode === "presentation" ? "Use cleaner transitions between points." : "",
    profile.practiceMode === "sales" ? "Ask one discovery question before pitching." : "",
    profile.practiceMode === "academic" ? "Define the concept, then give an example." : "",
    profile.practiceMode === "confidence" ? "Keep the answer short and steady, then expand later." : "",
  ].filter(Boolean) as string[];

  return {
    score,
    metrics: {
      communication,
      fluency,
      scope,
      engagement,
      coaching,
    },
    highlights: [
      turns > 0 ? `You completed ${turns} speaking turn${turns === 1 ? "" : "s"}.` : "The session was opened and ready for practice.",
      totalWords > 0 ? `You spoke ${totalWords} words in ${durationSeconds}s.` : "You kept the session concise.",
      `Scope adherence was ${scope}%.`,
      stats.assistantQuestions > 0 ? `The coach asked ${stats.assistantQuestions} follow-up question${stats.assistantQuestions === 1 ? "" : "s"}.` : "The coach kept the practice moving.",
      profile.focusArea ? `The practice stayed centered on "${profile.focusArea}".` : "The session used the selected practice mode well.",
    ],
    recommendations: recommendations.length ? recommendations : ["Keep practicing with slightly harder follow-ups."],
    note: stats.scopeViolations > 0
      ? "The session drifted outside the selected scope at least once, so the tutor is now locked to the chosen content."
      : score >= 85
        ? "Strong session. You stayed focused, communicated clearly, and handled follow-ups well."
        : score >= 70
          ? "Solid session. The next jump is sharper structure and cleaner delivery."
          : "Good start. The fastest improvement now is shorter answers with clearer structure.",
  };
}

function getVoiceTutorErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (message.includes("Authentication required")) {
    return "Sign in again to use the voice tutor.";
  }

  if (message.includes("Unauthorized")) {
    return "Voice tutor access was rejected. Refresh and try again.";
  }

  if (message.includes("CORS") || message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "AI connection blocked by origin settings. Check the function CORS config.";
  }

  if (message.includes("Missing GROQ_API_KEY") || message.includes("AI service configuration error")) {
    return "AI service is not configured on the server yet.";
  }

  if (message.includes("AI service is currently unavailable")) {
    return "AI service is temporarily unavailable. Try again in a moment.";
  }

  if (message.includes("AI Service Error")) {
    return message;
  }

  return "Connection failed. Try again.";
}

export function VoicePracticeSession() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SessionProfile>(DEFAULT_PROFILE);
  const [state, setState] = useState<SessionState>("idle");
  const [currentText, setCurrentText] = useState("");
  const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnType<typeof buildSummary> | null>(null);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    startTime: new Date(),
    words: 0,
    turns: 0,
    fillers: 0,
    assistantWords: 0,
    scopeViolations: 0,
    assistantQuestions: 0,
  });
  const [messages, setMessages] = useState([{ role: "system", content: buildPrompt(DEFAULT_PROFILE) }]);

  const recognitionRef = useRef<any>(null);
  const interimRef = useRef("");
  const stateRef = useRef(state);
  const endRef = useRef<HTMLDivElement>(null);
  const mode = useMemo(() => MODES.find((m) => m.id === profile.practiceMode) ?? MODES[0], [profile.practiceMode]);
  const prompt = useMemo(() => buildPrompt(profile), [profile]);

  const cleanup = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
  };

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      setSessions(await voiceService.getSessions());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("eduspace.voiceTutor.profile");
      if (raw) setProfile((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("eduspace.voiceTutor.profile", JSON.stringify(profile));
    } catch {}
  }, [profile]);

  useEffect(() => {
    loadSessions();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Voice recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setState("listening");
      setCurrentText("");
      interimRef.current = "";
      setErrorMsg(null);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      interimRef.current = transcript;
      setCurrentText(transcript || "...");
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "aborted") {
        setErrorMsg(`Mic error: ${event.error}`);
        setState("idle");
      }
    };

    recognition.onend = () => {
      if (stateRef.current === "listening") {
        const speech = interimRef.current.trim();
        if (speech) {
          setHistory((prev) => [...prev, { role: "user", text: speech }]);
          processSpeech(speech);
        } else {
          setState("idle");
        }
      }
    };

    recognitionRef.current = recognition;
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentText, state]);

  useEffect(() => {
    if (history.length === 0 && !currentSessionId && state === "idle") {
      setMessages([{ role: "system", content: prompt }]);
    }
  }, [currentSessionId, history.length, prompt, state]);

  const createOrLoadSession = async () => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      const created = await voiceService.createSession({
        title: buildTitle(profile),
        practice_mode: profile.practiceMode,
        focus_area: profile.focusArea || undefined,
        difficulty: profile.difficulty,
        target_duration_minutes: profile.targetDurationMinutes,
      });
      sessionId = created.id;
      setCurrentSessionId(sessionId);
      setSessions((prev) => [created, ...prev]);
      await voiceService.saveMessage(sessionId, "system", prompt);
    }
    return sessionId;
  };

  const processSpeech = async (speech: string) => {
    setState("thinking");
    setCurrentText("");
    const analysis = analyzeText(speech, profile);
    setStats((prev) => ({
      ...prev,
      words: prev.words + analysis.words,
      turns: prev.turns + 1,
      fillers: prev.fillers + analysis.fillers,
      scopeViolations: prev.scopeViolations + (analysis.offContent ? 1 : 0),
    }));

    try {
      const sessionId = await createOrLoadSession();
      await voiceService.saveMessage(sessionId, "user", speech);

      const convo = [...messages, { role: "user", content: speech }];
      if (analysis.offContent) {
        const refusal = buildOutOfContentReply(profile);
        await voiceService.saveMessage(sessionId, "assistant", refusal);
        setStats((prev) => ({
          ...prev,
          assistantWords: prev.assistantWords + refusal.trim().split(/\s+/).filter(Boolean).length,
          assistantQuestions: prev.assistantQuestions + (refusal.includes("?") ? 1 : 0),
        }));
        setHistory((prev) => [...prev, { role: "assistant", text: refusal }]);
        setMessages([...convo, { role: "assistant", content: refusal }]);
        setCurrentText("");
        setState("speaking");
        speak(refusal);
        return;
      }

      let assistant = "";
      await aiChatService.streamChat(convo, (token) => {
        assistant += token;
        setCurrentText(assistant);
      });

      if (!assistant.trim()) throw new Error("Empty response");

      await voiceService.saveMessage(sessionId, "assistant", assistant);
      const assistantAnalysis = analyzeText(assistant, profile);
      setStats((prev) => ({
        ...prev,
        assistantWords: prev.assistantWords + assistantAnalysis.words,
        assistantQuestions: prev.assistantQuestions + (assistant.includes("?") ? 1 : 0),
      }));
      setHistory((prev) => [...prev, { role: "assistant", text: assistant }]);
      setMessages([...convo, { role: "assistant", content: assistant }]);
      setCurrentText("");
      setState("speaking");
      speak(assistant);
    } catch (e: any) {
      console.error(e);
      setState("idle");
      setCurrentText("");
      setErrorMsg(e?.message?.includes("does not exist") ? "Database tables missing. Run the SQL migration." : getVoiceTutorErrorMessage(e));
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setState("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startStop = () => {
    if (state === "thinking") return;
    if (state === "speaking") {
      cleanup();
      setState("idle");
      return;
    }
    if (state === "listening") recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const newSession = () => {
    cleanup();
    setCurrentSessionId(null);
    setHistory([]);
    setMessages([{ role: "system", content: buildPrompt(profile) }]);
    setCurrentText("");
    setState("idle");
    setSummary(null);
    setStats({
      startTime: new Date(),
      words: 0,
      turns: 0,
      fillers: 0,
      assistantWords: 0,
      scopeViolations: 0,
      assistantQuestions: 0,
    });
  };

  const selectSession = async (id: string) => {
    if (state !== "idle") return;
    cleanup();
    setCurrentSessionId(id);
    setState("thinking");
    setMobileOpen(false);
    try {
      const session = sessions.find((item) => item.id === id);
      if (session) {
        setProfile({
          practiceMode: session.practice_mode ?? "interview",
          focusArea: session.focus_area ?? "",
          difficulty: session.difficulty ?? "intermediate",
          targetDurationMinutes: session.target_duration_minutes ?? 10,
        });
      }
      const loaded = await voiceService.getMessages(id);
      const system = buildPrompt({
        practiceMode: session?.practice_mode ?? "interview",
        focusArea: session?.focus_area ?? "",
        difficulty: session?.difficulty ?? "intermediate",
        targetDurationMinutes: session?.target_duration_minutes ?? 10,
      });
      const normalized = loaded.length && loaded[0].role === "system" ? loaded : [{ role: "system", content: system }, ...loaded];
      const loadedUsers = normalized.filter((m) => m.role === "user");
      const loadedAssistants = normalized.filter((m) => m.role === "assistant");
      setHistory(normalized.filter((m) => m.role !== "system").map((m) => ({ role: m.role, text: m.content })));
      setMessages(normalized.map((m) => ({ role: m.role, content: m.content })));
      setStats({
        startTime: session?.created_at ? new Date(session.created_at) : new Date(),
        words: loadedUsers.reduce((sum, m) => sum + analyzeText(m.content, {
          practiceMode: session?.practice_mode ?? "interview",
          focusArea: session?.focus_area ?? "",
          difficulty: session?.difficulty ?? "intermediate",
          targetDurationMinutes: session?.target_duration_minutes ?? 10,
        }).words, 0),
        turns: loadedUsers.length,
        fillers: loadedUsers.reduce((sum, m) => sum + analyzeText(m.content, {
          practiceMode: session?.practice_mode ?? "interview",
          focusArea: session?.focus_area ?? "",
          difficulty: session?.difficulty ?? "intermediate",
          targetDurationMinutes: session?.target_duration_minutes ?? 10,
        }).fillers, 0),
        assistantWords: loadedAssistants.reduce((sum, m) => sum + analyzeText(m.content, {
          practiceMode: session?.practice_mode ?? "interview",
          focusArea: session?.focus_area ?? "",
          difficulty: session?.difficulty ?? "intermediate",
          targetDurationMinutes: session?.target_duration_minutes ?? 10,
        }).words, 0),
        scopeViolations: loadedAssistants.filter((m) => m.content.toLowerCase().includes("out of content")).length,
        assistantQuestions: loadedAssistants.filter((m) => m.content.includes("?")).length,
      });
      setState("idle");
    } catch {
      setState("idle");
      toast.error("Failed to load history");
    }
  };

  const renameSession = async (id: string, title: string) => {
    try {
      await voiceService.updateSessionTitle(id, title);
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    } catch {
      toast.error("Failed to rename session");
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await voiceService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) newSession();
      toast.success("Practice session deleted");
    } catch {
      toast.error("Failed to delete practice session");
    }
  };

  const endSession = async () => {
    if (state === "thinking") return;
    const computed = buildSummary(history, profile, stats);
    setSummary(computed);
    setState("summary");
    if (currentSessionId) {
      try {
        await voiceService.updateSessionMeta(currentSessionId, {
          practice_mode: profile.practiceMode,
          focus_area: profile.focusArea || null,
          difficulty: profile.difficulty,
          target_duration_minutes: profile.targetDurationMinutes,
          summary: computed.note,
          rubric_score: computed.score,
          recommendations: computed.recommendations,
          session_metrics: {
            ...computed.metrics,
            start_time: stats.startTime.toISOString(),
            duration_seconds: Math.max(1, Math.round((Date.now() - stats.startTime.getTime()) / 1000)),
            user_words: stats.words,
            assistant_words: stats.assistantWords,
            turns: stats.turns,
            fillers: stats.fillers,
            scope_violations: stats.scopeViolations,
            assistant_questions: stats.assistantQuestions,
            practice_mode: profile.practiceMode,
            focus_area: profile.focusArea || null,
            difficulty: profile.difficulty,
            target_duration_minutes: profile.targetDurationMinutes,
          },
        });
        await voiceService.updateSessionTitle(currentSessionId, buildTitle(profile));
      } catch (e) {
        console.error("Could not persist summary", e);
      }
    }
  };

  const totalWords = history.filter((m) => m.role === "user").reduce((sum, m) => sum + m.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const totalTurns = history.filter((m) => m.role === "user").length;
  const isFreshState = history.length === 0 && state === "idle";
  const showMobileFreshShell = isFreshState && isMobileViewport;

  if (state === "summary") {
    const finalSummary = summary ?? buildSummary(history, profile, stats);
    return (
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 h-full bg-background">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-3">
            <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Sparkles className="size-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black">Practice Review</h2>
            <p className="text-muted-foreground">Saved with coaching notes, rubric scores, and next-step recommendations.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5"><Clock className="size-5 text-primary" /><div className="mt-2 text-2xl font-black">{Math.round((Date.now() - stats.startTime.getTime()) / 1000)}s</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Duration</div></div>
            <div className="rounded-2xl border bg-card p-5"><BarChart2 className="size-5 text-fuchsia-500" /><div className="mt-2 text-2xl font-black">{finalSummary.score}</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Coach score</div></div>
            <div className="rounded-2xl border bg-card p-5"><CheckCircle2 className="size-5 text-emerald-500" /><div className="mt-2 text-2xl font-black">{totalTurns}</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Turns</div></div>
            <div className="rounded-2xl border bg-card p-5"><Mic className="size-5 text-cyan-500" /><div className="mt-2 text-2xl font-black">{totalWords}</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Words</div></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border bg-card p-5 md:p-6 space-y-4">
              <div className="font-black text-lg">Rubric breakdown</div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(finalSummary.metrics).map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-bold capitalize">{label}</span><span className="font-black">{value}</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm font-medium">{finalSummary.note}</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border bg-card p-5 space-y-3">
                <div className="font-black text-lg">What went well</div>
                {finalSummary.highlights.map((item) => <div key={item} className="flex gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-500 mt-0.5" /><span>{item}</span></div>)}
              </div>
              <div className="rounded-3xl border bg-card p-5 space-y-3">
                <div className="font-black text-lg">Next steps</div>
                {finalSummary.recommendations.map((item) => <div key={item} className="flex gap-2 text-sm"><Sparkles className="size-4 text-primary mt-0.5" /><span>{item}</span></div>)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="rounded-2xl px-6 py-6 font-bold" onClick={newSession}>Start New Practice</Button>
            <Button variant="outline" size="lg" className="rounded-2xl px-6 py-6 font-bold" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background relative w-full">
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="absolute inset-y-0 left-0 w-[320px] bg-card z-50 md:hidden border-r border-border/40 shadow-2xl" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}>
              <AIChatSidebar
                type="voice"
                conversations={sessions}
                currentConversationId={currentSessionId || undefined}
                onSelectConversation={selectSession}
                onNewChat={newSession}
                onDeleteConversation={deleteSession}
                onUpdateTitle={renameSession}
                onClose={() => setMobileOpen(false)}
                isLoading={isLoading}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showMobileFreshShell && (
        <div className="md:hidden absolute inset-0 z-20 flex flex-col bg-surface text-on-surface overflow-hidden">
          <header className="w-full shrink-0 px-4 py-2.5 bg-surface/95 backdrop-blur-xl z-30 sticky top-0 border-b border-outline/10">
            <div className="flex justify-between items-center w-full max-w-md mx-auto">
              <div className="flex items-center gap-3 min-w-0">
                <button className="p-2 rounded-full hover:bg-[#f2f4f6] active:scale-95 duration-200" onClick={() => setMobileOpen(true)}>
                  <Menu className="size-5 text-[#424655]" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-fixed overflow-hidden ring-2 ring-white shrink-0">
                  <img alt="User profile" className="w-full h-full object-cover" src="/favicon.png" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold tracking-tighter text-[#0051d4] truncate">Fluid Mentor</h1>
                  <p className="text-[11px] text-[#424655] truncate">AI Voice Tutor</p>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-[#f2f4f6] active:scale-95 duration-200" type="button">
                <Settings className="size-5 text-[#424655]" />
              </button>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <main className="px-4 py-4 flex flex-col gap-6 max-w-md mx-auto pb-28">
              <section className="flex flex-col gap-2">
                <div className="inline-flex items-center self-start px-3 py-1 bg-secondary-container text-[#2e4687] rounded-full text-[11px] font-semibold tracking-wide uppercase">
                  Multi-mode Coach
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-on-surface whitespace-nowrap">Voice Tutor</h2>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Refine your communication skills with real-time AI feedback tailored to your goals.
                </p>
              </section>

              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-lg font-bold tracking-tight">Select Mode</h3>
                  <span className="text-xs font-medium text-primary cursor-pointer">View All</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MODES.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    const active = profile.practiceMode === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setProfile((prev) => ({ ...prev, practiceMode: item.id }))}
                        className={cn(
                          "p-4 rounded-xl flex flex-col gap-3 text-left transition-all active:scale-[0.98]",
                          active
                            ? "bg-surface-container-lowest shadow-sm border-2 border-primary/10"
                            : "bg-surface-container-low border border-transparent hover:bg-surface-container-high"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", active ? "bg-primary/10" : "bg-on-surface-variant/10")}>
                          <Icon className={cn("size-5", active ? "text-primary" : "text-on-surface-variant")} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold tracking-tight">Session Setup</h3>
                <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Focus Area</label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/60"
                      placeholder="e.g. Technical Leadership"
                      type="text"
                      value={profile.focusArea}
                      onChange={(e) => setProfile((prev) => ({ ...prev, focusArea: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-border/60 bg-gradient-to-br from-white to-surface-container-low shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Difficulty</label>
                        <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-600">Mode</span>
                      </div>
                      <p className="text-[12px] font-semibold text-on-surface">Beginner</p>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-xl border border-border/50 bg-surface-container-low px-3 py-3 pr-9 text-sm font-semibold text-on-surface shadow-inner shadow-black/[0.02] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          value={profile.difficulty}
                          onChange={(e) => setProfile((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-border/60 bg-gradient-to-br from-white to-surface-container-low shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.18em]">Duration</label>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Goal</span>
                      </div>
                      <p className="text-[12px] font-semibold text-on-surface">{profile.targetDurationMinutes} mins</p>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-xl border border-border/50 bg-surface-container-low px-3 py-3 pr-9 text-sm font-semibold text-on-surface shadow-inner shadow-black/[0.02] outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          value={String(profile.targetDurationMinutes)}
                          onChange={(e) => setProfile((prev) => ({ ...prev, targetDurationMinutes: Number(e.target.value) }))}
                        >
                          <option value="5">5 mins</option>
                          <option value="10">10 mins</option>
                          <option value="15">15 mins</option>
                          <option value="20">20 mins</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Initial Prompt</label>
                    <div className="bg-surface-container-low/50 rounded-xl p-4 italic text-sm text-on-surface-variant leading-relaxed">
                      "{mode.opening}"
                    </div>
                  </div>
                </div>
              </section>

            </main>
          </ScrollArea>

          <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            <div className="flex justify-center pb-6 pointer-events-auto">
              <button
                className="w-20 h-20 rounded-full bg-primary shadow-2xl shadow-primary/35 flex items-center justify-center active:scale-90 transition-transform duration-300 border border-white/20"
                onClick={startStop}
              >
                <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mic
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:block w-72 shrink-0 h-full border-r border-border/40 bg-card/5">
        <AIChatSidebar
          type="voice"
          conversations={sessions}
          currentConversationId={currentSessionId || undefined}
          onSelectConversation={selectSession}
          onNewChat={newSession}
          onDeleteConversation={deleteSession}
          onUpdateTitle={renameSession}
          isLoading={isLoading}
        />
      </div>

      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <div className="min-h-16 shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-9 w-9" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="size-9 rounded-full overflow-hidden border border-border/40 bg-gradient-to-tr from-primary to-fuchsia-600 flex items-center justify-center p-1.5 shadow-lg shrink-0">
                <Sparkles className="size-full text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black tracking-tight text-foreground/90 leading-none">Fluid Mentor</h2>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">AI Voice Tutor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Settings className="size-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={endSession} className="text-muted-foreground hover:text-foreground h-9 rounded-xl border border-transparent hover:border-border font-bold hidden sm:flex"><X className="size-4 mr-2" /> End Session</Button>
          </div>
        </div>

        <ScrollArea className="flex-1 z-10">
          <div className={cn("max-w-6xl mx-auto w-full min-h-full pt-4 md:pt-5 px-3 sm:px-4 md:px-6 flex flex-col pb-40 md:pb-56")}>
            {history.length === 0 && state === "idle" && (
              <div className="mb-3" />
            )}

            <AnimatePresence>
              {history.length === 0 && state === "idle" && (
                  <motion.div
                    key="session-cards"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 w-full relative z-20 mb-4"
                  >
                  <div className="min-w-0 rounded-2xl border bg-card/80 p-2 md:p-3 min-h-20 sm:min-h-28 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground font-black">Mode</p>
                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                          <mode.icon className="size-3 text-primary shrink-0" />
                          <span className="font-black text-[10px] sm:text-[12px] truncate">{mode.label}</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-primary">Live</span>
                    </div>
                    <p className="mt-2 hidden sm:block text-[11px] text-muted-foreground leading-snug line-clamp-2">{mode.desc}</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border bg-card/80 p-2 md:p-3 min-h-20 sm:min-h-28 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground font-black">Diff</p>
                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                          <ShieldCheck className="size-3 text-fuchsia-500 shrink-0" />
                          <span className="font-black text-[10px] sm:text-[12px] capitalize truncate">{profile.difficulty}</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-fuchsia-500">Set</span>
                    </div>
                    <p className="mt-2 hidden sm:block text-[11px] text-muted-foreground leading-snug line-clamp-2">Support and follow-up intensity.</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border bg-card/80 p-2 md:p-3 min-h-20 sm:min-h-28 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground font-black">Target</p>
                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                          <Clock className="size-3 text-emerald-500 shrink-0" />
                          <span className="font-black text-[10px] sm:text-[12px]">{profile.targetDurationMinutes}m</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-emerald-500">Goal</span>
                    </div>
                    <p className="mt-2 hidden sm:block text-[11px] text-muted-foreground leading-snug line-clamp-2">Paced to this duration.</p>
                  </div>
                  <div className="min-w-0 rounded-2xl border bg-card/80 p-2 md:p-3 min-h-20 sm:min-h-28 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground font-black">Pace</p>
                        <div className="mt-1 flex items-center gap-1.5 min-w-0">
                          <BarChart2 className="size-3 text-cyan-500 shrink-0" />
                          <span className="font-black text-[10px] sm:text-[12px]">{Math.round((Date.now() - stats.startTime.getTime()) / 1000)}s</span>
                        </div>
                      </div>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-cyan-500">Now</span>
                    </div>
                    <p className="mt-2 hidden sm:block text-[11px] text-muted-foreground leading-snug line-clamp-2">{stats.turns} turn{stats.turns === 1 ? "" : "s"} and {stats.words} words.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {history.length === 0 && state === "idle" && (
              <div className="grid gap-4 mt-3 w-full 2xl:grid-cols-[1.12fr_0.88fr] min-w-0 px-0.5">
                <div className="rounded-3xl border border-border/40 bg-card/80 p-4 sm:p-5 space-y-4 w-full min-w-0 overflow-hidden shadow-sm">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                      <Sparkles className="size-3" /> MULTI-MODE COACH
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight leading-none">Voice Tutor</h1>
                    <p className="text-muted-foreground max-w-sm font-medium text-[12px] sm:text-[14px] leading-relaxed opacity-70 mt-2">
                      Refine your communication skills with real-time AI feedback tailored to your goals.
                    </p>
                  <div className="flex items-center justify-between mt-6 mb-3 px-1">
                    <h2 className="text-base sm:text-lg font-black text-foreground/90 tracking-tight">Select Mode</h2>
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80">View All</button>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {MODES.map((item) => {
                      const Icon = item.icon;
                      const active = profile.practiceMode === item.id;
                      return (
                        <button 
                          key={item.id} 
                          onClick={() => setProfile((prev) => ({ ...prev, practiceMode: item.id }))} 
                          className={cn(
                            "group rounded-2xl border p-4 text-left min-w-0 transition-all active:scale-95 shadow-sm relative overflow-hidden flex flex-col items-start gap-4", 
                            active 
                              ? "border-primary bg-card dark:bg-card/90 ring-1 ring-primary/20" 
                              : "border-border/60 bg-card/40 hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "size-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                            active ? "bg-primary text-white shadow-lg" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            <Icon className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-sm block leading-none mb-1">{item.label}</span>
                            <p className="text-[10px] text-muted-foreground leading-tight opacity-70 font-medium">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-3xl border border-border/40 bg-card/80 p-4 sm:p-5 space-y-4 w-full min-w-0 overflow-hidden shadow-sm">
                  <div className="mt-8 mb-4 px-1">
                    <h2 className="text-base sm:text-lg font-black text-foreground/90 tracking-tight">Session Setup</h2>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-4 text-left shadow-lg">
                    <div className="space-y-2.5">
                        <label className="text-[10px] uppercase tracking-[0.22em] font-black text-primary/70 ml-1">Focus Area</label>
                        <Textarea 
                          value={profile.focusArea} 
                          onChange={(e) => setProfile((prev) => ({ ...prev, focusArea: e.target.value }))} 
                          placeholder="e.g. Technical Leadership Interview..." 
                          className="min-h-[120px] rounded-2xl bg-background/90 text-sm border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none px-4 py-4 shadow-inner font-medium"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2.5">
                          <label className="text-[10px] uppercase tracking-[0.22em] font-black text-primary/70 ml-1">Difficulty</label>
                          <Select 
                            value={profile.difficulty} 
                            onValueChange={(val: Difficulty) => setProfile((prev) => ({ ...prev, difficulty: val }))}
                          >
                            <SelectTrigger className="w-full h-12 rounded-2xl bg-background/90 border-border/80 text-xs font-black px-4 shadow-sm focus:ring-1 focus:ring-primary/20">
                              <SelectValue placeholder="Select Difficulty" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/80 bg-card/95 backdrop-blur-3xl z-[60]">
                                <SelectItem value="beginner" className="text-xs font-black uppercase tracking-tight py-3">Beginner</SelectItem>
                                <SelectItem value="intermediate" className="text-xs font-black uppercase tracking-tight py-3">Intermediate</SelectItem>
                                <SelectItem value="advanced" className="text-xs font-black uppercase tracking-tight py-3">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2.5">
                          <label className="text-[10px] uppercase tracking-[0.22em] font-black text-primary/70 ml-1">Duration</label>
                          <Select 
                            value={String(profile.targetDurationMinutes)} 
                            onValueChange={(val) => setProfile((prev) => ({ ...prev, targetDurationMinutes: parseInt(val) }))}
                          >
                            <SelectTrigger className="w-full h-12 rounded-2xl bg-background/90 border-border/80 text-xs font-black px-4 shadow-sm focus:ring-1 focus:ring-primary/20">
                              <SelectValue placeholder="Select Duration" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/80 bg-card/95 backdrop-blur-3xl z-[60]">
                                <SelectItem value="5" className="text-xs font-black py-3">5 Minutes</SelectItem>
                                <SelectItem value="10" className="text-xs font-black py-3">10 Minutes</SelectItem>
                                <SelectItem value="15" className="text-xs font-black py-3">15 Minutes</SelectItem>
                                <SelectItem value="20" className="text-xs font-black py-3">20 Minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                        <label className="text-[10px] uppercase tracking-[0.22em] font-black text-primary/70 ml-1">Initial Prompt</label>
                        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-left italic">
                            <p className="text-[13px] sm:text-sm text-foreground/80 leading-relaxed font-medium">"{mode.opening}"</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {history.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[84%] md:max-w-[68%] rounded-3xl px-5 py-4 text-[15px] font-semibold md:text-[16px] leading-relaxed shadow-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border/40 text-foreground rounded-bl-sm")}>{msg.text}</div>
              </motion.div>
            ))}

            <AnimatePresence>
              {(state === "listening" || state === "thinking" || state === "speaking") && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex flex-col", state === "listening" ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[84%] md:max-w-[68%] rounded-3xl px-5 py-4 text-[15px] md:text-[16px] leading-relaxed flex items-center gap-3", state === "listening" ? "bg-primary/20 text-primary border border-primary/30 rounded-br-sm italic font-bold" : "bg-card border border-border text-foreground rounded-bl-sm font-semibold")}>{state === "thinking" && <Loader2 className="size-4 animate-spin text-primary shrink-0" />}<p>{currentText || (state === "listening" ? "I am listening..." : "Thinking...")}</p></div>
                </motion.div>
              )}
              {errorMsg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-2"><p className="text-destructive font-black text-[10px] uppercase tracking-widest bg-destructive/10 border border-destructive/20 px-6 py-2 rounded-full shadow-sm">{errorMsg}</p></motion.div>}
            </AnimatePresence>
            <div ref={endRef} className="h-4" />
          </div>
        </ScrollArea>

        <div className="absolute left-0 right-0 bottom-0 z-40 flex flex-col items-center pointer-events-none pb-5 md:pb-10">
          <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 md:h-48 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
            <div className="relative flex flex-col items-center justify-center pointer-events-auto">
              <div className="relative cursor-pointer group" onClick={startStop}>
                <motion.div className="size-20 sm:size-[5.5rem] md:size-24 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 border border-white/20 z-10 relative overflow-hidden backdrop-blur-3xl bg-primary" whileTap={{ scale: 0.94 }}>
                  <Mic className="size-6 sm:size-7 md:size-8 text-primary-foreground" />
                </motion.div>
              </div>
            <motion.div className="mt-4 md:mt-6 flex flex-col items-center gap-1.5" animate={{ opacity: state === "idle" ? 0.7 : 0, y: state === "idle" ? 0 : 15 }}><p className="text-muted-foreground text-[10px] sm:text-[11px] font-black uppercase tracking-[0.35em] sm:tracking-[0.5em] text-center">Tap to talk</p></motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
