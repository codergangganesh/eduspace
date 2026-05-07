

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  ShieldCheck,
  Sparkles,
  Clock,
  BarChart2,
  CheckCircle2,
  Settings,
  Database,
  Code2,
  Volume2,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AIChatSidebar } from "@/components/student/ai-chat/AIChatSidebar";
import { InfiniteMarquee } from "@/components/common/InfiniteMarquee";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PracticeMode, VoiceSession, voiceService } from "@/lib/voiceService";
import { vapi, isVapiConfigured, interviewerConfig } from "@/lib/vapi";
import { aiChatService } from "@/lib/aiChatService";


type Difficulty = "beginner" | "intermediate" | "advanced";
type SessionState = "idle" | "listening" | "thinking" | "speaking" | "ending" | "summary";

type SessionProfile = {
  practiceMode: PracticeMode;
  focusArea: string;
  difficulty: Difficulty;
  targetDurationMinutes: number;
  voiceId: string;
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
  voiceId: "sarah",
};

const MODES: Array<{ id: PracticeMode; label: string; desc: string; icon: any; opening: string }> = [
  { id: "interview", label: "Interview", desc: "Behavioral and technical mock rounds.", icon: Briefcase, opening: "Tell me about yourself and why you want this role." },
  { id: "language", label: "Language", desc: "Grammar, fluency, and pronunciation.", icon: Languages, opening: "What did you do today?" },
  { id: "presentation", label: "Presentation", desc: "Delivery, pacing, and structure.", icon: Presentation, opening: "Give me the opening of your presentation." },
  { id: "sales", label: "SQL Practice", desc: "Queries, joins, filters, and database thinking.", icon: Database, opening: "Write a SQL query and explain why it works." },
  { id: "academic", label: "DSA", desc: "Algorithms, data structures, and complexity.", icon: Code2, opening: "Explain the data structure or algorithm step by step." },
  { id: "confidence", label: "Confidence", desc: "Low-pressure speaking practice.", icon: ShieldCheck, opening: "Start with a short self-introduction." },
];

const DIFFICULTIES: Array<{ id: Difficulty; label: string }> = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const TUTOR_VOICES = [
  { id: "sarah", name: "Sarah", tone: "Warm and clear" },
  { id: "burt", name: "Burt", tone: "Deep and steady" },
  { id: "marissa", name: "Marissa", tone: "Friendly coach" },
  { id: "andrea", name: "Andrea", tone: "Calm and professional" },
  { id: "phillip", name: "Phillip", tone: "Confident mentor" },
  { id: "steve", name: "Steve", tone: "Direct and crisp" },
];

const MOBILE_UNSUPPORTED_VOICE_STORAGE_KEY = "eduspace.voiceTutor.mobileUnsupportedVoices";
const MOBILE_FALLBACK_VOICE_ID = DEFAULT_PROFILE.voiceId;

function getTutorVoice(voiceId: string) {
  return TUTOR_VOICES.find((voice) => voice.id === voiceId) ?? TUTOR_VOICES[0];
}

function isLikelyMobileBrowser() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || navigator.vendor || "";
  const isiPadDesktopMode = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|Mobile|CriOS|FxiOS/i.test(userAgent) || isiPadDesktopMode;
}

function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Voice connection error";
}

function isVoiceSelectionFailure(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("selected voice preview") ||
    normalized.includes("could not select the selected voice") ||
    normalized.includes("voice preview") ||
    ((normalized.includes("voice") || normalized.includes("11labs")) &&
      (normalized.includes("unsupported") ||
        normalized.includes("unavailable") ||
        normalized.includes("invalid") ||
        normalized.includes("not found") ||
        normalized.includes("could not select")))
  );
}

function getFriendlyVoiceError(message: string, isMobile: boolean) {
  const normalized = message.toLowerCase();

  if (isVoiceSelectionFailure(message)) {
    return isMobile
      ? "A compatible tutor voice could not be loaded on this device."
      : "The selected tutor voice could not be loaded right now.";
  }

  if (
    normalized.includes("microphone") ||
    normalized.includes("permission") ||
    normalized.includes("notallowederror") ||
    normalized.includes("denied")
  ) {
    return "Microphone access is required to start the AI Voice Tutor.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("connection") ||
    normalized.includes("signaling") ||
    normalized.includes("transport")
  ) {
    return "The voice connection was interrupted. Please try again.";
  }

  return "Could not start the AI Voice Tutor right now. Please try again.";
}

function modeLabel(mode: PracticeMode) {
  return MODES.find((m) => m.id === mode)?.label ?? "Interview";
}

function buildTitle(profile: SessionProfile) {
  return profile.focusArea ? `Practice - ${modeLabel(profile.practiceMode)} - ${profile.focusArea}` : `Practice - ${modeLabel(profile.practiceMode)}`;
}

function buildPrompt(profile: SessionProfile) {
  const focus = profile.focusArea ? `Focus area: ${profile.focusArea}.` : "Focus area: general improvement.";
  const modeGuidance = profile.practiceMode === "sales"
    ? "SQL Practice = write, explain, and improve SQL queries, joins, filters, aggregations, and database reasoning."
    : profile.practiceMode === "academic"
      ? "DSA = solve algorithm and data structure problems, explain complexity, and talk through your approach clearly."
      : profile.practiceMode === "interview"
        ? "Interview = behavioral and technical mock rounds using STAR and crisp follow-ups."
        : profile.practiceMode === "language"
          ? "Language = grammar, pronunciation, fluency, and natural speaking correction."
          : profile.practiceMode === "presentation"
            ? "Presentation = structure, delivery, pacing, and audience clarity."
            : "Confidence = calm encouragement, short answers, and steady speaking practice.";
  return `You are Eduspace Voice Tutor, an adaptive speaking coach.
Mode: ${modeLabel(profile.practiceMode)}.
Difficulty: ${profile.difficulty}.
${focus}
Target duration: ${profile.targetDurationMinutes} minutes.

Rules:
- Stay strictly inside the selected mode and focus area.
- Do not show or speak any extra topic information outside the selected practice content.
- Do not answer general-knowledge, news, sports, shopping, or personal questions that are outside the selected practice content.
- If the user goes outside scope, reply with: "That is out of content for this session. Let's stay on ${modeLabel(profile.practiceMode)}${profile.focusArea ? ` and ${profile.focusArea}` : ""}."
- Keep replies concise, usually 2 to 4 short sentences.
- Always end with one follow-up question unless you are refusing an out-of-content request.
- Correct mistakes gently and show a better version when useful.
- Adapt to the mode: ${modeGuidance}
- If the learner struggles, simplify the prompt and give a scaffold.`;
}

function buildOutOfContentReply(profile: SessionProfile) {
  return `That is out of content for this session. Let's stay on ${modeLabel(profile.practiceMode)}${profile.focusArea ? ` and ${profile.focusArea}` : ""}.`;
}

function extractKeywords(value: string) {
  const matches: string[] = value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return matches.filter((word) => word.length > 3);
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
      return ["sql", "query", "table", "join", "select", "where", "group", "aggregate", "database", "index"];
    case "academic":
      return ["dsa", "algorithm", "data", "structure", "array", "linked", "tree", "graph", "recursion", "complexity"];
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
  const targetWords = profile.practiceMode === "presentation" ? 80 : profile.practiceMode === "sales" ? 60 : profile.practiceMode === "academic" ? 58 : profile.practiceMode === "language" ? 35 : profile.practiceMode === "confidence" ? 28 : 50;
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
    profile.practiceMode === "sales" ? "Write the query clearly, then explain the result set." : "",
    profile.practiceMode === "academic" ? "State the approach, then explain the complexity." : "",
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

function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function VoicePracticeSession() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<SessionProfile>(DEFAULT_PROFILE);
  const [state, setState] = useState<SessionState>("idle");
  const [currentText, setCurrentText] = useState("");
  const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnType<typeof buildSummary> | null>(null);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
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

  const vapiActiveRef = useRef(false);
  const previewActiveRef = useRef(false);
  const previewTimeoutRef = useRef<number | null>(null);
  const previewSettleTimeoutRef = useRef<number | null>(null);
  const previewStopPendingRef = useRef(false);
  const callTransitionRef = useRef<"idle" | "preview-starting" | "session-starting" | "stopping">("idle");
  const mobileUnsupportedVoiceIdsRef = useRef<Set<string>>(new Set());
  const suppressVoiceSelectionErrorRef = useRef(false);
  const fallbackNoticeShownRef = useRef(false);
  const mobileAudioContextRef = useRef<AudioContext | null>(null);
  const micVisualizerContextRef = useRef<AudioContext | null>(null);
  const micVisualizerStreamRef = useRef<MediaStream | null>(null);
  const micVisualizerAnalyserRef = useRef<AnalyserNode | null>(null);
  const micVisualizerSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micVisualizerFrameRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const micLevel = useMotionValue(0);
  const lowBandLevel = useMotionValue(0);
  const midBandLevel = useMotionValue(0);
  const highBandLevel = useMotionValue(0);
  const smoothedMicLevel = useSpring(micLevel, {
    stiffness: 180,
    damping: 26,
    mass: 0.8,
  });
  const smoothedLowBand = useSpring(lowBandLevel, {
    stiffness: 160,
    damping: 24,
    mass: 0.9,
  });
  const smoothedMidBand = useSpring(midBandLevel, {
    stiffness: 170,
    damping: 24,
    mass: 0.88,
  });
  const smoothedHighBand = useSpring(highBandLevel, {
    stiffness: 180,
    damping: 22,
    mass: 0.82,
  });
  const activeMicScale = useTransform(smoothedMicLevel, [0, 1], [1, 1.16]);
  const activeGlowOpacity = useTransform(smoothedMicLevel, [0, 1], [0.18, 0.6]);
  const activeWaveScale = useTransform(smoothedMicLevel, [0, 1], [1.04, 1.5]);
  const activeWaveOpacity = useTransform(smoothedMicLevel, [0, 1], [0.12, 0.36]);
  const liquidCoreScale = useTransform(() => 0.98 + smoothedMicLevel.get() * 0.09 + smoothedMidBand.get() * 0.05);
  const liquidHaloScale = useTransform(() => 1.02 + smoothedMicLevel.get() * 0.18 + smoothedLowBand.get() * 0.06);
  const cyanBlobScale = useTransform(() => 0.94 + smoothedLowBand.get() * 0.24 + smoothedMicLevel.get() * 0.08);
  const violetBlobScale = useTransform(() => 0.94 + smoothedMidBand.get() * 0.22 + smoothedMicLevel.get() * 0.07);
  const pinkBlobScale = useTransform(() => 0.94 + smoothedHighBand.get() * 0.2 + smoothedMicLevel.get() * 0.08);
  const shimmerOpacity = useTransform(() => 0.42 + smoothedHighBand.get() * 0.22 + smoothedMicLevel.get() * 0.12);
  const flowTilt = useTransform(() => -8 + smoothedLowBand.get() * 10 - smoothedHighBand.get() * 6);
  const waveBar1 = useTransform(() => 0.28 + smoothedLowBand.get() * 0.95);
  const waveBar2 = useTransform(() => 0.36 + smoothedMidBand.get() * 1.1);
  const waveBar3 = useTransform(() => 0.3 + smoothedHighBand.get() * 1.05);
  const waveBar4 = useTransform(() => 0.34 + (smoothedLowBand.get() * 0.45 + smoothedMidBand.get() * 0.8));
  const waveBar5 = useTransform(() => 0.26 + smoothedMicLevel.get() * 1.2);
  const waveBar6 = useTransform(() => 0.34 + (smoothedMidBand.get() * 0.5 + smoothedHighBand.get() * 0.82));
  const waveBar7 = useTransform(() => 0.3 + smoothedLowBand.get() * 1.02);
  const waveBar8 = useTransform(() => 0.36 + smoothedHighBand.get() * 1.08);
  const waveBar9 = useTransform(() => 0.28 + smoothedMidBand.get() * 0.95);

  const mode = useMemo(() => MODES.find((m) => m.id === profile.practiceMode) ?? MODES[0], [profile.practiceMode]);
  const selectedVoice = useMemo(() => getTutorVoice(profile.voiceId), [profile.voiceId]);
  const prompt = useMemo(() => buildPrompt(profile), [profile]);
  const isMobileBrowser = useMemo(() => isLikelyMobileBrowser(), []);
  const isMobileEnvironment = isMobileViewport || isMobileBrowser;

  const cleanup = () => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    if (previewSettleTimeoutRef.current) {
      window.clearTimeout(previewSettleTimeoutRef.current);
      previewSettleTimeoutRef.current = null;
    }
    vapi.stop();
    vapiActiveRef.current = false;
    previewActiveRef.current = false;
    previewStopPendingRef.current = false;
    setPreviewingVoiceId(null);
  };

  const stopMicLevelMonitoring = () => {
    if (micVisualizerFrameRef.current) {
      window.cancelAnimationFrame(micVisualizerFrameRef.current);
      micVisualizerFrameRef.current = null;
    }

    micVisualizerSourceRef.current?.disconnect();
    micVisualizerSourceRef.current = null;
    micVisualizerAnalyserRef.current?.disconnect();
    micVisualizerAnalyserRef.current = null;

    micVisualizerStreamRef.current?.getTracks().forEach((track) => track.stop());
    micVisualizerStreamRef.current = null;

    if (micVisualizerContextRef.current) {
      void micVisualizerContextRef.current.close().catch(() => undefined);
      micVisualizerContextRef.current = null;
    }

    micLevel.set(0);
    lowBandLevel.set(0);
    midBandLevel.set(0);
    highBandLevel.set(0);
  };

  const startMicLevelMonitoring = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    if (micVisualizerAnalyserRef.current || micVisualizerStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const WindowWithWebkitAudio = window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      };
      const AudioContextCtor = window.AudioContext ?? WindowWithWebkitAudio.webkitAudioContext;

      if (!AudioContextCtor) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const context = new AudioContextCtor();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      micVisualizerContextRef.current = context;
      micVisualizerStreamRef.current = stream;
      micVisualizerAnalyserRef.current = analyser;
      micVisualizerSourceRef.current = source;

      const tick = () => {
        const currentAnalyser = micVisualizerAnalyserRef.current;
        if (!currentAnalyser) return;

        currentAnalyser.getByteFrequencyData(buffer);
        const average = buffer.reduce((sum, value) => sum + value, 0) / (buffer.length * 255);
        const normalized = clamp((average - 0.02) * 3.1, 0, 1);
        const third = Math.floor(buffer.length / 3);
        const averageBand = (start: number, end: number) => {
          const sliceLength = Math.max(end - start, 1);
          let sum = 0;
          for (let index = start; index < end; index += 1) {
            sum += buffer[index];
          }
          return sum / (sliceLength * 255);
        };
        const low = clamp((averageBand(0, third) - 0.015) * 3.2, 0, 1);
        const mid = clamp((averageBand(third, third * 2) - 0.015) * 3.4, 0, 1);
        const high = clamp((averageBand(third * 2, buffer.length) - 0.01) * 3.8, 0, 1);

        micLevel.set(normalized);
        lowBandLevel.set(low);
        midBandLevel.set(mid);
        highBandLevel.set(high);
        micVisualizerFrameRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch (error) {
      console.warn("Mic visualizer unavailable", error);
      stopMicLevelMonitoring();
    }
  };

  const buildAssistantConfig = (
    sessionProfile: SessionProfile,
    sessionPrompt: string,
    sessionMode: typeof MODES[number],
    voiceIdOverride?: string
  ) => {
    const resolvedVoiceId = voiceIdOverride ?? sessionProfile.voiceId;

    let assistantConfig: any = {
      name: "Eduspace Voice Tutor",
      firstMessage: sessionMode.opening,
      backgroundSpeechDenoisingPlan: {
        smartDenoisingPlan: {
          enabled: false,
        },
        fourierDenoisingPlan: {
          enabled: false,
        },
      },
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
      voice: {
        provider: "11labs",
        voiceId: resolvedVoiceId,
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: sessionPrompt,
          },
        ],
      },
    };

    if (sessionProfile.practiceMode === "interview") {
      const baseConfig = JSON.parse(JSON.stringify(interviewerConfig));
      baseConfig.model.messages[0].content = baseConfig.model.messages[0].content.replace("{{questions}}", sessionProfile.focusArea || "General behavioral and technical questions.");
      baseConfig.voice.voiceId = resolvedVoiceId;
      baseConfig.backgroundSpeechDenoisingPlan = {
        smartDenoisingPlan: {
          enabled: false,
        },
        fourierDenoisingPlan: {
          enabled: false,
        },
      };
      assistantConfig = baseConfig;
    }

    return assistantConfig;
  };

  const startVoiceSessionWithFallback = async (
    sessionProfile: SessionProfile,
    sessionPrompt: string,
    sessionMode: typeof MODES[number]
  ) => {
    const preferredVoice = getPreferredVoiceForMobile(sessionProfile.voiceId);
    const fallbackVoice = getFallbackVoiceFor(preferredVoice.id);
    const canRetryWithFallback = isMobileEnvironment && preferredVoice.id !== fallbackVoice.id;

    suppressVoiceSelectionErrorRef.current = canRetryWithFallback;

    try {
      await vapi.start(buildAssistantConfig(sessionProfile, sessionPrompt, sessionMode, preferredVoice.id));
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (!canRetryWithFallback || !isVoiceSelectionFailure(errorMessage)) {
        throw error;
      }

      markVoiceUnsupportedOnMobile(preferredVoice.id);
      console.warn("[VAPI] Retrying mobile voice session with fallback voice", {
        requestedVoiceId: sessionProfile.voiceId,
        failedVoiceId: preferredVoice.id,
        fallbackVoiceId: fallbackVoice.id,
        error: errorMessage,
      });

      await vapi.stop().catch(() => undefined);
      suppressVoiceSelectionErrorRef.current = false;
      await vapi.start(buildAssistantConfig(sessionProfile, sessionPrompt, sessionMode, fallbackVoice.id));
      showMobileFallbackNotice();
    } finally {
      suppressVoiceSelectionErrorRef.current = false;
    }
  };

  const resumeMobileAudioContext = () => {
    if (!isMobileEnvironment || typeof window === "undefined") return;

    const WindowWithWebkitAudio = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextCtor = window.AudioContext ?? WindowWithWebkitAudio.webkitAudioContext;

    if (!AudioContextCtor) return;

    if (!mobileAudioContextRef.current) {
      mobileAudioContextRef.current = new AudioContextCtor();
    }

    if (mobileAudioContextRef.current.state === "suspended") {
      void mobileAudioContextRef.current.resume();
    }
  };

  const persistUnsupportedMobileVoices = (voiceIds: string[]) => {
    try {
      localStorage.setItem(MOBILE_UNSUPPORTED_VOICE_STORAGE_KEY, JSON.stringify(voiceIds));
    } catch (error) {
      console.warn("Failed to persist mobile voice compatibility cache", error);
    }
  };

  const markVoiceUnsupportedOnMobile = (voiceId: string) => {
    if (!voiceId) return;
    if (mobileUnsupportedVoiceIdsRef.current.has(voiceId)) return;

    mobileUnsupportedVoiceIdsRef.current.add(voiceId);
    persistUnsupportedMobileVoices(Array.from(mobileUnsupportedVoiceIdsRef.current));
  };

  const getFallbackVoiceFor = (voiceId: string) => {
    return (
      TUTOR_VOICES.find((voice) => voice.id === MOBILE_FALLBACK_VOICE_ID && voice.id !== voiceId) ??
      TUTOR_VOICES.find((voice) => voice.id !== voiceId) ??
      getTutorVoice(voiceId)
    );
  };

  const getPreferredVoiceForMobile = (voiceId: string) => {
    if (!isMobileEnvironment || !mobileUnsupportedVoiceIdsRef.current.has(voiceId)) {
      return getTutorVoice(voiceId);
    }

    return getFallbackVoiceFor(voiceId);
  };

  const showMobileFallbackNotice = () => {
    if (fallbackNoticeShownRef.current) return;
    fallbackNoticeShownRef.current = true;
    toast.info("Using a compatible tutor voice on this device.");
  };

  const buildPreviewConfig = (voiceId: string) => {
    const voice = getTutorVoice(voiceId);

    return {
      name: "Eduspace Voice Preview",
      firstMessage: `Hello, I am ${voice.name}, your AI tutor. This voice is ${voice.tone.toLowerCase()}, and I will guide you clearly through your practice sessions.`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
      voice: {
        provider: "11labs",
        voiceId,
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are only previewing a voice. Say the first message exactly once, then stay silent.",
          },
        ],
      },
    };
  };

  const startVoicePreviewWithFallback = async (requestedVoiceId: string) => {
    const preferredVoice = getPreferredVoiceForMobile(requestedVoiceId);
    const fallbackVoice = getFallbackVoiceFor(preferredVoice.id);
    const canRetryWithFallback = isMobileEnvironment && preferredVoice.id !== fallbackVoice.id;

    suppressVoiceSelectionErrorRef.current = canRetryWithFallback;

    try {
      await vapi.start(buildPreviewConfig(preferredVoice.id));
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (!canRetryWithFallback || !isVoiceSelectionFailure(errorMessage)) {
        throw error;
      }

      markVoiceUnsupportedOnMobile(preferredVoice.id);
      console.warn("[VAPI] Retrying mobile voice preview with fallback voice", {
        requestedVoiceId,
        failedVoiceId: preferredVoice.id,
        fallbackVoiceId: fallbackVoice.id,
        error: errorMessage,
      });

      await vapi.stop().catch(() => undefined);
      suppressVoiceSelectionErrorRef.current = false;
      await vapi.start(buildPreviewConfig(fallbackVoice.id));
      showMobileFallbackNotice();
    } finally {
      suppressVoiceSelectionErrorRef.current = false;
    }
  };

  const previewVoice = async (voice = selectedVoice) => {
    if (!isVapiConfigured()) {
      toast.error("Voice preview is not configured. Please add VITE_VAPI_PUBLIC_KEY.");
      return;
    }

    if (callTransitionRef.current !== "idle") {
      return;
    }

    if (vapiActiveRef.current && !previewActiveRef.current) {
      toast.info("End the current tutor session before previewing another voice.");
      return;
    }

    try {
      callTransitionRef.current = "preview-starting";
      resumeMobileAudioContext();

      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewSettleTimeoutRef.current) {
        window.clearTimeout(previewSettleTimeoutRef.current);
        previewSettleTimeoutRef.current = null;
      }

      if (previewActiveRef.current) {
        await vapi.stop();
        previewActiveRef.current = false;
        previewStopPendingRef.current = false;
      }

      previewActiveRef.current = true;
      previewStopPendingRef.current = false;
      setPreviewingVoiceId(voice.id);
      setErrorMsg(null);

      await startVoicePreviewWithFallback(voice.id);

      callTransitionRef.current = "idle";

      previewTimeoutRef.current = window.setTimeout(() => {
        previewTimeoutRef.current = null;
        if (previewActiveRef.current) {
          previewStopPendingRef.current = true;
          callTransitionRef.current = "stopping";
          vapi.stop();
          window.setTimeout(() => {
            if (previewActiveRef.current) {
              previewActiveRef.current = false;
              setPreviewingVoiceId(null);
            }
            previewStopPendingRef.current = false;
            if (callTransitionRef.current === "stopping") {
              callTransitionRef.current = "idle";
            }
          }, 500);
        }
      }, 16000);
    } catch (error) {
      console.error("Voice preview failed", error);
      callTransitionRef.current = "idle";
      previewActiveRef.current = false;
      previewStopPendingRef.current = false;
      setPreviewingVoiceId(null);
      toast.error(getFriendlyVoiceError(getErrorMessage(error), isMobileEnvironment));
    }
  };

  const handleVoiceSettingsOpenChange = (open: boolean) => {
    setVoiceSettingsOpen(open);

    if (!open && previewActiveRef.current) {
      callTransitionRef.current = "stopping";
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewSettleTimeoutRef.current) {
        window.clearTimeout(previewSettleTimeoutRef.current);
        previewSettleTimeoutRef.current = null;
      }
      vapi.stop();
      previewActiveRef.current = false;
      previewStopPendingRef.current = false;
      setPreviewingVoiceId(null);
      window.setTimeout(() => {
        if (callTransitionRef.current === "stopping") {
          callTransitionRef.current = "idle";
        }
      }, 300);
    }
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
    } catch (error) {
      console.warn("Failed to load voice tutor profile", error);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MOBILE_UNSUPPORTED_VOICE_STORAGE_KEY);
      if (!raw) return;

      const voiceIds = JSON.parse(raw);
      if (!Array.isArray(voiceIds)) return;

      mobileUnsupportedVoiceIdsRef.current = new Set(
        voiceIds.filter((voiceId): voiceId is string => typeof voiceId === "string")
      );
    } catch (error) {
      console.warn("Failed to load mobile voice compatibility cache", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("eduspace.voiceTutor.profile", JSON.stringify(profile));
    } catch (error) {
      console.warn("Failed to save voice tutor profile", error);
    }
  }, [profile]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!isVapiConfigured()) return;

    const onCallStart = () => {
      console.log("[VAPI] Call started");
      if (previewActiveRef.current) return;

      setState("listening");
      vapiActiveRef.current = true;
      setErrorMsg(null);
      void startMicLevelMonitoring();
    };

    const onCallEnd = () => {
      console.log("[VAPI] Call ended");
      if (previewActiveRef.current) {
        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        previewActiveRef.current = false;
        previewStopPendingRef.current = false;
        setPreviewingVoiceId(null);
        callTransitionRef.current = "idle";
        return;
      }

      setState("idle");
      vapiActiveRef.current = false;
      previewActiveRef.current = false;
      callTransitionRef.current = "idle";
      stopMicLevelMonitoring();
    };

    const onSpeechStart = () => {
      if (previewActiveRef.current) return;
      setState("speaking");
    };

    const onSpeechEnd = () => {
      if (previewActiveRef.current) {
        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        if (previewSettleTimeoutRef.current) {
          window.clearTimeout(previewSettleTimeoutRef.current);
        }
        previewStopPendingRef.current = true;
        previewSettleTimeoutRef.current = window.setTimeout(() => {
          previewSettleTimeoutRef.current = null;
          if (!previewActiveRef.current) {
            previewStopPendingRef.current = false;
            return;
          }
          callTransitionRef.current = "stopping";
          vapi.stop();
        }, 1800);
        return;
      }
      if (previewActiveRef.current) return;
      setState("listening");
    };

    const onMessage = async (message: any) => {
      if (previewActiveRef.current) return;

      if (message.type === "transcript") {
        const text = message.transcript.trim();
        if (!text) return;

        if (message.transcriptType === "partial") {
          setCurrentText(text);
        } else if (message.transcriptType === "final") {
          const role = message.role;
          setCurrentText("");
          setHistory(prev => [...prev, { role, text }]);
          
          if (role === "user") {
            const analysis = analyzeText(text, profile);
            setStats(prev => ({
              ...prev,
              words: prev.words + analysis.words,
              turns: prev.turns + 1,
              fillers: prev.fillers + analysis.fillers,
              scopeViolations: prev.scopeViolations + (analysis.offContent ? 1 : 0),
            }));
          } else {
            setStats(prev => ({
              ...prev,
              assistantWords: prev.assistantWords + text.split(" ").length,
              assistantQuestions: prev.assistantQuestions + (text.includes("?") ? 1 : 0),
            }));
          }

          // Save to Supabase
          try {
            const sessId = await createOrLoadSession();
            await voiceService.saveMessage(sessId, role, text);
          } catch (e) {
            console.error("Failed to save message to session", e);
          }
        }
      }
    };

    const onError = (error: any) => {
      const errorMessage = getErrorMessage(error);
      
      // Suppress normal call-end signals that might be reported as errors
      const ignoredMessages = [
        "Meeting ended",
        "ejection",
        "disconnect",
        "Signaling connection",
        "meeting state",
        "room was deleted",
        "Exiting meeting",
        "daily-call-join-error",
        "daily-error",
      ];

      const shouldIgnore = ignoredMessages.some(msg => 
        errorMessage.toLowerCase().includes(msg.toLowerCase())
      );

      if (suppressVoiceSelectionErrorRef.current && isVoiceSelectionFailure(errorMessage)) {
        console.debug("[VAPI] Suppressed voice selection error during fallback recovery:", errorMessage);
        return;
      }

      if (previewActiveRef.current) {
        if (previewTimeoutRef.current) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        previewActiveRef.current = false;
        previewStopPendingRef.current = false;
        setPreviewingVoiceId(null);
        callTransitionRef.current = "idle";
        if (!shouldIgnore) {
          console.error("[VAPI] Voice preview error:", errorMessage);
          toast.error(getFriendlyVoiceError(errorMessage, isMobileEnvironment));
        } else {
          console.debug("[VAPI] Ignored preview event:", errorMessage);
        }
        return;
      }

      if (!shouldIgnore) {
        console.error("[VAPI] Real error:", errorMessage);
        setErrorMsg(getFriendlyVoiceError(errorMessage, isMobileEnvironment));
        setState("idle");
        vapiActiveRef.current = false;
        callTransitionRef.current = "idle";
      } else {
        console.debug("[VAPI] Ignored event:", errorMessage);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, [profile, prompt, currentSessionId]);


  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentText, state]);

  useEffect(() => {
    if (history.length === 0 && !currentSessionId && state === "idle") {
      setMessages([{ role: "system", content: prompt }]);
    }
  }, [currentSessionId, history.length, prompt, state]);

  useEffect(() => {
    return () => {
      stopMicLevelMonitoring();
    };
  }, []);

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

  const startStop = async (profileOverride?: SessionProfile, options?: { mobileImmediateStart?: boolean }) => {
    if (state === "thinking") return;
    if (callTransitionRef.current !== "idle") return;
    if (previewActiveRef.current) {
      callTransitionRef.current = "stopping";
      await vapi.stop();
      previewActiveRef.current = false;
      vapiActiveRef.current = false;
      previewStopPendingRef.current = false;
      setPreviewingVoiceId(null);
      setState("idle");
      callTransitionRef.current = "idle";
      return;
    }
    const sessionProfile = profileOverride ?? profile;
    const sessionMode = MODES.find((m) => m.id === sessionProfile.practiceMode) ?? MODES[0];
    const sessionPrompt = buildPrompt(sessionProfile);
    
    if (vapiActiveRef.current) {
      callTransitionRef.current = "stopping";
      vapi.stop();
      vapiActiveRef.current = false;
      setState("idle");
      callTransitionRef.current = "idle";
    } else {
      if (!isVapiConfigured()) {
        setErrorMsg("Voice Tutor is not configured. Please add VITE_VAPI_PUBLIC_KEY to environment.");
        return;
      }

      try {
        callTransitionRef.current = "session-starting";
        vapiActiveRef.current = true;
        resumeMobileAudioContext();

        if (options?.mobileImmediateStart) {
          setErrorMsg(null);
          setState("thinking");
        } else {
          setState("thinking");
          setErrorMsg(null);
        }

        await startVoiceSessionWithFallback(sessionProfile, sessionPrompt, sessionMode);
        callTransitionRef.current = "idle";
      } catch (e) {
        console.error(e);
        setErrorMsg(getFriendlyVoiceError(getErrorMessage(e), isMobileEnvironment));
        vapiActiveRef.current = false;
        setState("idle");
        callTransitionRef.current = "idle";
      }
    }
  };

  const startPracticeWithMode = (practiceMode: PracticeMode) => {
    const nextProfile = { ...profile, practiceMode };
    setProfile(nextProfile);
    setMessages([{ role: "system", content: buildPrompt(nextProfile) }]);
    void startStop(nextProfile);
  };

  const handleSessionToggle = () => {
    void startStop();
  };

  const handleMicButtonClick = () => {
    if (isMobileViewport && !vapiActiveRef.current && !previewActiveRef.current && callTransitionRef.current === "idle") {
      resumeMobileAudioContext();
      void startStop(undefined, { mobileImmediateStart: true });
      return;
    }

    void startStop();
  };

  const isMicListening = state === "listening";
  const isAiResponding = state === "speaking" || state === "thinking";
  const isMicActive = state !== "idle";

  const renderVoiceReactiveMic = (options?: {
    buttonClassName?: string;
    activeButtonClassName?: string;
    iconClassName?: string;
    useMaterialIcon?: boolean;
  }) => (
    <motion.button
      type="button"
      onClick={handleMicButtonClick}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "relative isolate overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "flex items-center justify-center transition-all duration-300",
        isMicActive
          ? "h-16 w-[15.5rem] rounded-[2rem] px-1"
          : "rounded-full border border-white/20 backdrop-blur-3xl shadow-2xl",
        isMicActive ? options?.activeButtonClassName : options?.buttonClassName
      )}
      animate={
        isAiResponding
          ? {
              boxShadow: isMicActive
                ? [
                    "0 0 0 rgba(0,0,0,0)",
                    "0 0 0 rgba(0,0,0,0)",
                    "0 0 0 rgba(0,0,0,0)",
                  ]
                : [
                    "0 18px 40px rgba(168,85,247,0.22)",
                    "0 22px 52px rgba(56,189,248,0.3)",
                    "0 18px 40px rgba(168,85,247,0.22)",
                  ],
            }
          : {
              boxShadow: isMicActive
                ? "0 0 0 rgba(0,0,0,0)"
                : "0 18px 42px rgba(79,70,229,0.2)",
            }
      }
      transition={isAiResponding ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.28 }}
    >
      {isMicActive ? (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="relative flex h-12 w-full max-w-[15rem] items-center justify-center gap-1.5">
            <motion.div
              className="pointer-events-none absolute inset-x-2 inset-y-2 rounded-full blur-xl"
              style={{
                opacity: shimmerOpacity,
                background: "linear-gradient(90deg, rgba(45,212,191,0.24), rgba(96,165,250,0.3), rgba(168,85,247,0.28), rgba(244,114,182,0.24))",
                scaleX: activeWaveScale,
              }}
              animate={
                isMicListening
                  ? { x: [-18, 18, -12] }
                  : isAiResponding
                    ? { x: [-10, 10, -6] }
                    : { x: [-6, 6, -4] }
              }
              transition={{ duration: isMicListening ? 1.5 : isAiResponding ? 1.9 : 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {[
              waveBar1,
              waveBar2,
              waveBar3,
              waveBar4,
              waveBar5,
              waveBar6,
              waveBar7,
              waveBar8,
              waveBar9,
            ].map((bar, index) => (
              <motion.span
                key={index}
                className="relative z-10 block w-1.5 sm:w-2 rounded-full"
                style={{
                  height: "78%",
                  scaleY: isMicListening ? bar : isAiResponding ? activeMicScale : 0.32,
                  opacity: isMicListening ? 1 : isAiResponding ? 0.88 : 0.58,
                  background: index % 3 === 0
                    ? "linear-gradient(180deg, rgba(45,212,191,1), rgba(59,130,246,0.86))"
                    : index % 3 === 1
                      ? "linear-gradient(180deg, rgba(96,165,250,1), rgba(168,85,247,0.9))"
                      : "linear-gradient(180deg, rgba(244,114,182,1), rgba(99,102,241,0.88))",
                  boxShadow: "0 0 10px rgba(125,211,252,0.24)",
                }}
                animate={
                  isAiResponding
                    ? { y: [0, -1.5, 0] }
                    : { y: [0, 0.5, 0] }
                }
                transition={{ duration: 1.35 + index * 0.08, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary"
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {options?.useMaterialIcon ? (
            <motion.span
              className={cn("material-symbols-outlined text-white", options?.iconClassName)}
              style={{ fontVariationSettings: "'FILL' 1" }}
              animate={{ y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              mic
            </motion.span>
          ) : (
            <Mic className={cn("text-primary-foreground", options?.iconClassName)} />
          )}
        </motion.div>
      )}
    </motion.button>
  );


  const newSession = () => {
    cleanup();
    stopMicLevelMonitoring();
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
          voiceId: profile.voiceId ?? DEFAULT_PROFILE.voiceId,
        });
      }
      const loaded = await voiceService.getMessages(id);
      const system = buildPrompt({
        practiceMode: session?.practice_mode ?? "interview",
        focusArea: session?.focus_area ?? "",
        difficulty: session?.difficulty ?? "intermediate",
        targetDurationMinutes: session?.target_duration_minutes ?? 10,
        voiceId: profile.voiceId ?? DEFAULT_PROFILE.voiceId,
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
          voiceId: profile.voiceId ?? DEFAULT_PROFILE.voiceId,
        }).words, 0),
        turns: loadedUsers.length,
        fillers: loadedUsers.reduce((sum, m) => sum + analyzeText(m.content, {
          practiceMode: session?.practice_mode ?? "interview",
          focusArea: session?.focus_area ?? "",
          difficulty: session?.difficulty ?? "intermediate",
          targetDurationMinutes: session?.target_duration_minutes ?? 10,
          voiceId: profile.voiceId ?? DEFAULT_PROFILE.voiceId,
        }).fillers, 0),
        assistantWords: loadedAssistants.reduce((sum, m) => sum + analyzeText(m.content, {
          practiceMode: session?.practice_mode ?? "interview",
          focusArea: session?.focus_area ?? "",
          difficulty: session?.difficulty ?? "intermediate",
          targetDurationMinutes: session?.target_duration_minutes ?? 10,
          voiceId: profile.voiceId ?? DEFAULT_PROFILE.voiceId,
        }).words, 0),
        scopeViolations: loadedAssistants.filter((m) => /out of content|not related content/i.test(m.content)).length,
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
    if (state === "thinking" || state === "ending") return;
    
    // Stop Vapi if active
    if (vapiActiveRef.current) {
      vapi.stop();
      vapiActiveRef.current = false;
    }

    // Show ending loading screen immediately
    setState("ending");

    // Capture exact duration now before any async work
    const capturedDurationSeconds = Math.max(1, Math.round((Date.now() - stats.startTime.getTime()) / 1000));
    setSessionDurationSeconds(capturedDurationSeconds);

    // Build local summary right away so the screen can show instantly
    const computed = buildSummary(history, profile, stats);
    setSummary(computed);

    // Run AI-powered evaluation in the background and update summary when ready
    let finalSummary = computed;
    try {
      const transcriptText = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n");
      const evalPrompt = `You are an expert ${modeLabel(profile.practiceMode)} coach. Analyze this practice transcript and provide comprehensive feedback.

Transcript:
${transcriptText}

Return exactly in JSON format:
{
  "totalScore": number,
  "categoryScores": {
    "communication": number,
    "clarity": number,
    "relevance": number,
    "fluency": number
  },
  "strengths": string[],
  "improvements": string[],
  "finalAssessment": string
}

Be specific and constructive.`;

      const aiResponse = await aiChatService.streamChat([{ role: "user", content: evalPrompt }], () => {});
      if (aiResponse) {
        const extractedJson = extractJsonObject(aiResponse);
        if (extractedJson) {
          const aiData = JSON.parse(extractedJson);
          finalSummary = {
            ...computed,
            score: aiData.totalScore || computed.score,
            metrics: {
              ...computed.metrics,
              communication: aiData.categoryScores?.communication || computed.metrics.communication,
              fluency: aiData.categoryScores?.fluency || computed.metrics.fluency,
            },
            highlights: aiData.strengths || computed.highlights,
            recommendations: aiData.improvements || computed.recommendations,
            note: aiData.finalAssessment || computed.note
          };
          setSummary(finalSummary);
        }
      }
    } catch (e) {
      console.error("AI Evaluation failed, using local summary", e);
    }

    // Transition to summary — either with AI-enhanced or local data
    setState("summary");

    if (currentSessionId) {
      try {
        await voiceService.updateSessionMeta(currentSessionId, {
          practice_mode: profile.practiceMode,
          focus_area: profile.focusArea || null,
          difficulty: profile.difficulty,
          target_duration_minutes: profile.targetDurationMinutes,
          summary: finalSummary.note,
          rubric_score: finalSummary.score,
          recommendations: finalSummary.recommendations,
          session_metrics: {
            ...finalSummary.metrics,
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
  const showDesktopFreshStudio = isFreshState && !isMobileViewport;
  const scopeReply = buildOutOfContentReply(profile);
  const focusTopic = profile.focusArea.trim() ? profile.focusArea.trim() : mode.label;

  if (state === "ending") {
    return (
      <div className="flex-1 flex flex-col h-full bg-background items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center px-6"
        >
          <div className="relative">
            <div className="size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Loader2 className="size-9 text-primary animate-spin" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tight">Ending Session</h3>
            <p className="text-sm text-muted-foreground font-medium">Analyzing your performance and generating feedback…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (state === "summary") {
    const finalSummary = summary ?? buildSummary(history, profile, stats);
    const durationSeconds = Math.max(1, Math.round((Date.now() - stats.startTime.getTime()) / 1000));
    const durationDisplay = durationSeconds < 60
      ? `${durationSeconds}s`
      : `${(durationSeconds / 60).toFixed(1)} min`;
    return (
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
        <ScrollArea className="flex-1">
          <div className="min-h-full flex flex-col items-center p-4 md:p-8">
            <div className="max-w-5xl w-full space-y-6 pb-20">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black">Practice Review</h2>
                <p className="text-muted-foreground">Saved with coaching notes, rubric scores, and next-step recommendations.</p>
              </div>

              <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-card p-5"><Clock className="size-5 text-primary" /><div className="mt-2 text-2xl font-black">{durationDisplay}</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Duration</div></div>
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

              <div className="flex flex-col sm:flex-row gap-3 justify-center pb-8">
                <Button size="lg" className="rounded-2xl px-6 py-6 font-bold" onClick={newSession}>Start New Practice</Button>
                <Button variant="outline" size="lg" className="rounded-2xl px-6 py-6 font-bold" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
              </div>
            </div>
          </div>
        </ScrollArea>
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
        <div className="md:hidden absolute inset-0 z-20 flex flex-col bg-background text-foreground overflow-hidden">
          <header className="w-full shrink-0 px-4 py-2.5 bg-background/95 backdrop-blur-xl z-30 sticky top-0 border-b border-border/20">
            <div className="flex justify-between items-center w-full max-w-md mx-auto">
              <div className="flex items-center gap-3 min-w-0">
                <button className="p-2 rounded-full hover:bg-muted active:scale-95 duration-200" onClick={() => setMobileOpen(true)}>
                  <Menu className="size-5 text-muted-foreground" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden ring-2 ring-primary/20 shrink-0">
                  <img alt="User profile" className="w-full h-full object-cover" src="/favicon.png" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold tracking-tighter text-primary truncate">Fluid Mentor</h1>
                  <p className="text-[11px] text-muted-foreground truncate">AI Voice Tutor</p>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-muted active:scale-95 duration-200" type="button">
                <Settings className="size-5 text-muted-foreground" />
              </button>
            </div>
          </header>

          <ScrollArea className="flex-1">
            <main className="px-4 py-4 flex flex-col gap-6 max-w-md mx-auto pb-28">
              <section className="flex flex-col gap-2">
                <div className="inline-flex items-center self-start px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-semibold tracking-wide uppercase">
                  Multi-mode Coach
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight text-foreground whitespace-nowrap">Voice Tutor</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Refine your communication skills with real-time AI feedback tailored to your goals.
                </p>
              </section>

              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">Select Mode</h3>
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
                            ? "bg-card shadow-sm border-2 border-primary/30"
                            : "bg-muted/40 border border-transparent hover:bg-muted/60"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", active ? "bg-primary/15 dark:bg-primary/20 dark:ring-1 dark:ring-primary/40" : "bg-muted")}>
                          <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold tracking-tight text-foreground">Session Setup</h3>
                <div className="bg-card rounded-[1.5rem] p-6 shadow-sm border border-border/40 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Focus Area</label>
                    <input
                      className="w-full bg-muted/50 border border-border/60 rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="e.g. Technical Leadership"
                      type="text"
                      value={profile.focusArea}
                      onChange={(e) => setProfile((prev) => ({ ...prev, focusArea: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-border/60 bg-card shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">Difficulty</label>
                        <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-fuchsia-500">Mode</span>
                      </div>
                      <p className="text-[12px] font-semibold text-foreground capitalize">{profile.difficulty}</p>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-xl border border-border/60 bg-muted/50 px-3 py-3 pr-9 text-sm font-semibold text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          value={profile.difficulty}
                          onChange={(e) => setProfile((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-border/60 bg-card shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">Duration</label>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-500">Goal</span>
                      </div>
                      <p className="text-[12px] font-semibold text-foreground">{profile.targetDurationMinutes} mins</p>
                      <div className="relative">
                        <select
                          className="w-full appearance-none rounded-xl border border-border/60 bg-muted/50 px-3 py-3 pr-9 text-sm font-semibold text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          value={String(profile.targetDurationMinutes)}
                          onChange={(e) => setProfile((prev) => ({ ...prev, targetDurationMinutes: Number(e.target.value) }))}
                        >
                          <option value="5">5 mins</option>
                          <option value="10">10 mins</option>
                          <option value="15">15 mins</option>
                          <option value="20">20 mins</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Initial Prompt</label>
                    <div className="bg-muted/40 border border-border/40 rounded-xl p-4 italic text-sm text-muted-foreground leading-relaxed">
                      "{mode.opening}"
                    </div>
                  </div>
                </div>
              </section>

            </main>
          </ScrollArea>

          <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            <div className="flex justify-center pb-6 pointer-events-auto">
              {renderVoiceReactiveMic({
                buttonClassName: "h-20 w-20",
                activeButtonClassName: "h-16 w-[13.5rem]",
                iconClassName: "text-4xl",
                useMaterialIcon: true,
              })}
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
            <div className="size-9 rounded-full overflow-hidden border border-border/40 bg-gradient-to-tr from-primary to-fuchsia-600 flex items-center justify-center p-1 shadow-lg shrink-0 relative">
              <img
                src="/ai-tutor.png"
                alt="AI Voice Tutor"
                className="size-full object-cover rounded-full"
              />
              {state === "speaking" && (
                <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm md:text-base font-black tracking-tight text-foreground/90 leading-none">Fluid Mentor</h2>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">AI Voice Tutor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setVoiceSettingsOpen(true)}>
              <Settings className="size-5" />
            </Button>
            {!showDesktopFreshStudio && (
              <Button variant="ghost" size="sm" onClick={endSession} className="text-muted-foreground hover:text-foreground h-9 rounded-xl border border-transparent hover:border-border font-bold hidden sm:flex"><X className="size-4 mr-2" /> End Session</Button>
            )}
          </div>
        </div>

        <Sheet open={voiceSettingsOpen} onOpenChange={handleVoiceSettingsOpenChange}>
          <SheetContent side="right" className="w-full sm:max-w-xl border-l border-border bg-background p-0 text-foreground overflow-hidden flex flex-col">
            <div className="bg-gradient-to-br from-[#000b60] via-[#142283] to-[#dfe0ff] dark:from-primary/80 dark:via-primary/60 dark:to-primary/20 px-6 py-6 text-white">
              <SheetHeader>
                <SheetTitle className="text-2xl font-extrabold tracking-tight text-white">Voice Settings</SheetTitle>
                <SheetDescription className="text-white/75">
                  Choose the Vapi/11Labs tutor voice used for new AI Voice Tutor sessions. Preview starts a short Vapi sample.
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-6 pb-6 pt-6">
              <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Selected Voice</p>
                    <h3 className="mt-1 text-xl font-extrabold text-foreground">{selectedVoice.name}</h3>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{selectedVoice.tone}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => previewVoice(selectedVoice)}
                    className="rounded-full bg-primary px-5 font-extrabold text-white hover:bg-primary/90"
                  >
                    <Volume2 className="mr-2 size-4" />
                    {previewingVoiceId === selectedVoice.id ? "Playing..." : "Preview"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {TUTOR_VOICES.map((voice) => {
                  const active = selectedVoice.id === voice.id;
                  return (
                    <div
                      key={voice.id}
                      className={cn(
                        "rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5",
                        active ? "border-primary ring-2 ring-primary" : "border-border/60 hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-extrabold text-foreground">{voice.name}</p>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">{voice.tone}</p>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em]",
                          active ? "bg-primary text-white" : "bg-muted text-foreground"
                        )}>
                          {active ? "Active" : "Select"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex h-8 items-center rounded-full px-3 py-1 text-[11px] font-extrabold leading-none transition",
                            active
                              ? "bg-primary text-white hover:bg-primary/90"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                          onClick={() => {
                            setProfile((prev) => ({ ...prev, voiceId: voice.id }));
                            if (vapiActiveRef.current) {
                              toast.info("Voice updated. It will apply from the next voice session.");
                            }
                          }}
                        >
                          {active ? "Selected" : "Select voice"}
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center rounded-full bg-muted px-3 py-1 text-[11px] font-extrabold leading-none text-foreground transition hover:bg-primary hover:text-white"
                          onClick={() => previewVoice(voice)}
                        >
                          <Volume2 className="mr-1.5 size-3.5" />
                          {previewingVoiceId === voice.id ? "Playing..." : "Hear sample"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                Note: preview starts a short Vapi voice call using the same 11Labs voice that will be used in the live tutor session.
              </p>
            </div>
          </SheetContent>
        </Sheet>

        <ScrollArea className="flex-1 z-10">
          <div className={cn(
            "w-full min-h-full flex flex-col",
            showDesktopFreshStudio
              ? "max-w-none p-0 pb-0"
              : "max-w-6xl mx-auto pt-4 md:pt-5 px-3 sm:px-4 md:px-6 pb-40 md:pb-56"
          )}>
            {history.length === 0 && state === "idle" && (
              <div className="mb-3" />
            )}

            {showDesktopFreshStudio ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex min-h-full w-full flex-col overflow-hidden bg-[#fbf8ff] dark:bg-background text-[#1b1b21] dark:text-foreground"
              >
                <section className="relative flex flex-1 px-8 py-12 xl:px-14 xl:py-16 2xl:px-20">
                  <div className="absolute right-0 top-0 -z-0 h-full w-2/3 rounded-bl-[9rem] bg-[#f5f2fb] dark:bg-muted/20" />
                  <div className="relative z-10 grid w-full items-start gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                      <span className="inline-flex rounded-full bg-[#142283] dark:bg-primary/20 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#8390f2] dark:text-primary">
                        Premium Intelligence
                      </span>
                      <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-[#000b60] dark:text-foreground xl:text-7xl">
                        Master Your <br /> Next Interview
                      </h1>
                      <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[#454652] dark:text-muted-foreground xl:text-lg">
                        Practice DSA, SQL, interviews, presentations, and communication in a calm coaching space built for focused voice sessions.
                      </p>

                      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                        <Input
                          value={profile.focusArea}
                          onChange={(e) => setProfile((prev) => ({ ...prev, focusArea: e.target.value }))}
                          placeholder="Focus area, e.g. Binary trees, SQL joins, HR interview..."
                          className="h-[52px] rounded-full border-[#c6c5d4] dark:border-border bg-white/90 dark:bg-muted/50 px-6 text-sm font-semibold text-[#1b1b21] dark:text-foreground shadow-[0_8px_24px_-6px_rgba(0,11,96,0.08)] placeholder:text-[#767683] dark:placeholder:text-muted-foreground focus:border-[#000b60] dark:focus:border-primary focus-visible:ring-[#000b60]/20 dark:focus-visible:ring-primary/20"
                        />
                        <Select
                          value={profile.difficulty}
                          onValueChange={(val: Difficulty) => setProfile((prev) => ({ ...prev, difficulty: val }))}
                        >
                          <SelectTrigger className="h-[52px] rounded-full border-[#c6c5d4] dark:border-border bg-[#f5f2fb] dark:bg-muted/50 px-5 text-xs font-extrabold text-[#000b60] dark:text-foreground shadow-sm focus:ring-[#000b60]/20 dark:focus:ring-primary/20">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-[#c6c5d4] dark:border-border bg-white/95 dark:bg-card backdrop-blur-3xl z-[60]">
                            <SelectItem value="beginner" className="text-xs font-black uppercase tracking-tight py-3">Beginner</SelectItem>
                            <SelectItem value="intermediate" className="text-xs font-black uppercase tracking-tight py-3">Intermediate</SelectItem>
                            <SelectItem value="advanced" className="text-xs font-black uppercase tracking-tight py-3">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={String(profile.targetDurationMinutes)}
                          onValueChange={(val) => setProfile((prev) => ({ ...prev, targetDurationMinutes: parseInt(val) }))}
                        >
                          <SelectTrigger className="h-[52px] rounded-full border-[#c6c5d4] dark:border-border bg-[#f5f2fb] dark:bg-muted/50 px-5 text-xs font-extrabold text-[#000b60] dark:text-foreground shadow-sm focus:ring-[#000b60]/20 dark:focus:ring-primary/20">
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-[#c6c5d4] dark:border-border bg-white/95 dark:bg-card backdrop-blur-3xl z-[60]">
                            <SelectItem value="5" className="text-xs font-black py-3">5 Minutes</SelectItem>
                            <SelectItem value="10" className="text-xs font-black py-3">10 Minutes</SelectItem>
                            <SelectItem value="15" className="text-xs font-black py-3">15 Minutes</SelectItem>
                            <SelectItem value="20" className="text-xs font-black py-3">20 Minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-4">
                        <Button
                          onClick={handleSessionToggle}
                          className="h-12 rounded-full bg-gradient-to-r from-[#000b60] to-[#142283] dark:from-primary dark:to-primary/80 px-8 text-sm font-extrabold text-white shadow-[0_16px_32px_-8px_rgba(0,11,96,0.22)] hover:from-[#142283] hover:to-[#000b60]"
                        >
                          Begin Your Journey
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-12 rounded-full bg-[#eae7ef] dark:bg-muted px-8 text-sm font-extrabold text-[#000b60] dark:text-foreground hover:bg-[#e4e1ea] dark:hover:bg-muted/80"
                          onClick={() => setProfile((prev) => ({ ...prev, focusArea: mode.label }))}
                        >
                          Use Current Focus
                        </Button>
                      </div>
                    </div>

                    <div className="hidden lg:col-span-5 lg:flex lg:items-center lg:justify-center">
                      <div className="w-full max-w-[420px] rotate-3 overflow-hidden rounded-[2rem] bg-[#eae7ef] dark:bg-muted/30 p-8 opacity-95 shadow-[0_16px_32px_-8px_rgba(0,11,96,0.12)] transition-all duration-700 hover:rotate-1">
                        <div className="flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-white via-[#f5f2fb] to-[#dfe0ff] dark:from-muted/40 dark:via-muted/20 dark:to-primary/10 p-10">
                          <img src="/ai-tutor.png" alt="AI Voice Tutor" className="h-auto max-h-[320px] w-full object-contain drop-shadow-2xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-[#efecf5] dark:bg-muted/10 px-8 py-10 xl:px-14 xl:py-12 2xl:px-20">
                  <div className="mb-8 flex items-end justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-extrabold tracking-tight text-[#000b60] dark:text-foreground">Focus Your Preparation</h2>
                      <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#454652] dark:text-muted-foreground">
                        Choose the coaching area first, then start your voice practice with the selected setup.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                    {MODES.slice(0, 6).map((item) => {
                      const Icon = item.icon;
                      const active = profile.practiceMode === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setProfile((prev) => ({ ...prev, practiceMode: item.id }))}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setProfile((prev) => ({ ...prev, practiceMode: item.id }));
                            }
                          }}
                          className={cn(
                            "group flex min-h-[260px] cursor-pointer flex-col justify-between rounded-2xl bg-white dark:bg-card p-7 text-left shadow-[0_16px_32px_-8px_rgba(0,11,96,0.08)] dark:shadow-none dark:border dark:border-border/40 transition-all duration-300 hover:-translate-y-1",
                            active && "ring-2 ring-[#000b60] dark:ring-primary"
                          )}
                        >
                          <div>
                            <div className={cn(
                              "mb-7 flex size-14 items-center justify-center rounded-2xl bg-[#dfe0ff]/70 dark:bg-primary/15 text-[#000b60] dark:text-primary transition-transform group-hover:scale-110",
                              active && "bg-[#000b60] dark:bg-primary/20 dark:ring-2 dark:ring-primary/40 text-white dark:text-primary"
                            )}>
                              <Icon className="size-7" />
                            </div>
                            <h3 className="text-2xl font-extrabold leading-tight text-[#000b60] dark:text-foreground">{item.label}</h3>
                            <p className="mt-4 text-sm font-medium leading-relaxed text-[#454652] dark:text-muted-foreground">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startPracticeWithMode(item.id);
                            }}
                            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[#eae7ef] dark:bg-muted px-5 py-3 text-sm font-extrabold text-[#000b60] dark:text-foreground transition-all group-hover:bg-[#000b60] dark:group-hover:bg-primary group-hover:text-white"
                          >
                            Start Practice
                            <ChevronDown className="-rotate-90 size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            ) : (
              <>
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
            </>
          )
        }

            {!showDesktopFreshStudio && (
            <div className={cn("w-full", state === "idle" && "lg:grid lg:grid-cols-[1fr_380px] lg:gap-8")}>
              <div className="space-y-6 min-w-0">
                {history.length === 0 && state === "idle" && (
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
                )}

                {state !== "idle" && history.length === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="relative">
                      <div className={cn("size-24 rounded-full bg-gradient-to-tr from-primary to-fuchsia-600 flex items-center justify-center p-2 shadow-2xl relative z-10 overflow-hidden", state === "speaking" && "animate-speak-pulse")}>
                        <img
                          src="/ai-tutor.png"
                          alt="AI Voice Tutor"
                          className="size-full object-cover rounded-full"
                        />
                      </div>
                      {state === "speaking" && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-primary/20 -z-0"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-black uppercase tracking-tighter">Fluid Tutor</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-1">{state === "speaking" ? "Speaking..." : state === "listening" ? "Listening..." : "Connecting..."}</p>
                    </div>
                  </motion.div>
                )}

                {history.map((msg, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex flex-col mb-4", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("max-w-[84%] md:max-w-[72%] rounded-3xl px-5 py-4 text-[15px] font-semibold md:text-[16px] leading-relaxed shadow-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border/40 text-foreground rounded-bl-sm")}>{msg.text}</div>
                  </motion.div>
                ))}

                <AnimatePresence>
                  {(state === "listening" || state === "thinking" || state === "speaking") && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex flex-col", state === "listening" ? "items-end" : "items-start")}>
                      {state === "speaking" && (
                        <div className="mb-2 ml-4 flex items-center gap-2">
                          <div className="size-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Tutor is speaking</span>
                        </div>
                      )}
                      <div className={cn("max-w-[84%] md:max-w-[72%] rounded-3xl px-5 py-4 text-[15px] md:text-[16px] leading-relaxed flex items-center gap-3", state === "listening" ? "bg-primary/10 text-primary border border-primary/20 rounded-br-sm italic font-bold" : "bg-card border border-border text-foreground rounded-bl-sm font-semibold")}>
                        {state === "thinking" && <Loader2 className="size-4 animate-spin text-primary shrink-0" />}
                        <p>{currentText || (state === "listening" ? "Listening..." : state === "speaking" ? "..." : "Thinking...")}</p>
                      </div>
                    </motion.div>
                  )}
                  {errorMsg && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-2"><p className="text-destructive font-black text-[10px] uppercase tracking-widest bg-destructive/10 border border-destructive/20 px-6 py-2 rounded-full shadow-sm">{errorMsg}</p></motion.div>}
                </AnimatePresence>
              </div>

              {state === "idle" && (
                <div className={cn("space-y-4", history.length > 0 && "hidden lg:block")}>
                  <div className="rounded-3xl border border-border/40 bg-card/80 p-4 sm:p-5 space-y-4 w-full min-w-0 overflow-hidden shadow-sm h-fit sticky top-4">
                    <div className="mt-2 mb-4 px-1">
                      <h2 className="text-base sm:text-lg font-black text-foreground/90 tracking-tight">
                        {history.length === 0 ? "Session Setup" : "Session Details"}
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-4 text-left shadow-lg">
                      <div className="space-y-2.5">
                        <label className="text-[10px] uppercase tracking-[0.22em] font-black text-primary/70 ml-1">Focus Area</label>
                        <Textarea
                          value={profile.focusArea}
                          onChange={(e) => setProfile((prev) => ({ ...prev, focusArea: e.target.value }))}
                          placeholder="e.g. Technical Leadership Interview..."
                          className="h-[88px] max-h-[88px] rounded-2xl bg-background/90 text-sm border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none px-4 py-4 shadow-inner font-medium overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-left italic">
                          <p className="text-[12px] sm:text-sm text-foreground/80 leading-relaxed font-medium">"{mode.opening}"</p>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSessionToggle} 
                        className="w-full h-14 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {history.length === 0 ? "Start Voice Session" : "Resume Practice"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
            <div ref={endRef} className="h-4" />
          </div>
        </ScrollArea>

        <div className={cn("absolute left-0 right-0 bottom-0 z-40 flex flex-col items-center pointer-events-none pb-5 md:pb-10", showDesktopFreshStudio && "hidden")}>
          <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 md:h-48 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
          <div className="relative flex flex-col items-center justify-center pointer-events-auto">
            {renderVoiceReactiveMic({
              buttonClassName: "size-20 sm:size-[5.5rem] md:size-24",
              activeButtonClassName: "h-16 w-[14rem] sm:w-[15rem] md:w-[16rem]",
              iconClassName: "size-6 sm:size-7 md:size-8",
            })}
            <motion.div className="mt-4 md:mt-6 flex flex-col items-center gap-1.5" animate={{ opacity: state === "idle" ? 0.7 : 0, y: state === "idle" ? 0 : 15 }}><p className="text-muted-foreground text-[10px] sm:text-[11px] font-black uppercase tracking-[0.35em] sm:tracking-[0.5em] text-center">Tap to talk</p></motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
