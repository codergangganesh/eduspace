import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "./ThemeContext";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type VoiceState = "disabled" | "listening" | "wake_listening" | "processing" | "speaking";

interface VoiceCommandContextType {
  isVoiceSupported: boolean;
  voiceState: VoiceState;
  isWakeWordEnabled: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastCommand: string | null;
  feedbackText: string | null;
  toggleVoiceMode: () => void;
  toggleWakeWordMode: () => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  processCommandManually: (cmd: string) => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

export const VoiceCommandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("disabled");
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>("");
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const lastExecutedTimeRef = useRef<number>(0);
  const voiceStateRef = useRef<VoiceState>("disabled");
  voiceStateRef.current = voiceState;

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setIsVoiceSupported(true);
    } else {
      setIsVoiceSupported(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setVoiceState("speaking");
    setFeedbackText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setFeedbackText(null);
      if (isListeningRef.current) {
        setVoiceState("listening");
      } else {
        setVoiceState("disabled");
      }
    };

    utterance.onerror = () => {
      setFeedbackText(null);
      setVoiceState("disabled");
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const playWakeChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // Audio context fallback
    }
  };

  const executeCommand = useCallback(
    (commandText: string) => {
      const now = Date.now();
      if (now - lastExecutedTimeRef.current < 1500) {
        return; // Prevent duplicate rapid triggers
      }

      const cleanText = commandText.trim().toLowerCase();
      lastExecutedTimeRef.current = now;
      setLastCommand(cleanText);

      // 1. Theme toggle commands
      if (cleanText.includes("dark mode") || cleanText.includes("theme dark")) {
        setTheme("dark");
        speak("Switched to dark mode");
        return;
      }
      if (cleanText.includes("light mode") || cleanText.includes("theme light")) {
        setTheme("light");
        speak("Switched to light mode");
        return;
      }
      if (cleanText.includes("toggle theme") || cleanText.includes("switch theme")) {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        speak(`Switched theme to ${nextTheme} mode`);
        return;
      }

      // 2. Navigation commands (Instant matching)
      if (cleanText.includes("dashboard") || cleanText.includes("home")) {
        navigate("/dashboard");
        speak("Navigating to Dashboard");
        return;
      }
      if (cleanText.includes("assignment") || cleanText.includes("tasks")) {
        navigate("/student/assignments");
        speak("Opening Assignments");
        return;
      }
      if (cleanText.includes("quiz") || cleanText.includes("quizzes") || cleanText.includes("test")) {
        navigate("/student/quizzes");
        speak("Opening Quizzes");
        return;
      }
      if (cleanText.includes("schedule") || cleanText.includes("calendar") || cleanText.includes("timetable")) {
        navigate("/schedule");
        speak("Opening Schedule");
        return;
      }
      if (cleanText.includes("streak") || cleanText.includes("streaks")) {
        navigate("/streak");
        speak("Opening Streaks Page");
        return;
      }
      if (cleanText.includes("contest") || cleanText.includes("contests") || cleanText.includes("challenge")) {
        navigate("/contests");
        speak("Opening Contests");
        return;
      }
      if (cleanText.includes("clan") || cleanText.includes("clans") || cleanText.includes("team")) {
        navigate("/clans");
        speak("Opening Clans");
        return;
      }
      if (cleanText.includes("message") || cleanText.includes("messages") || cleanText.includes("chat")) {
        navigate("/messages");
        speak("Opening Messages");
        return;
      }
      if (cleanText.includes("ai tutor") || cleanText.includes("voice tutor") || cleanText.includes("ai agent")) {
        navigate("/voice-tutor");
        speak("Opening AI Voice Tutor");
        return;
      }
      if (cleanText.includes("setting") || cleanText.includes("settings")) {
        navigate("/settings");
        speak("Opening Settings");
        return;
      }
      if (cleanText.includes("profile") || cleanText.includes("my profile")) {
        navigate("/profile");
        speak("Opening Profile");
        return;
      }
      if (cleanText.includes("student") || cleanText.includes("students") || cleanText.includes("directory")) {
        navigate("/all-students");
        speak("Opening Students Directory");
        return;
      }
      if (cleanText.includes("help") || cleanText.includes("support")) {
        navigate("/help");
        speak("Opening Help and Support");
        return;
      }

      // 3. Page scrolling actions
      if (cleanText.includes("scroll down") || cleanText.includes("go down")) {
        window.scrollBy({ top: 500, behavior: "smooth" });
        speak("Scrolling down");
        return;
      }
      if (cleanText.includes("scroll up") || cleanText.includes("go up") || cleanText.includes("scroll top")) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        speak("Scrolling to top");
        return;
      }

      // 4. Quick AI Voice Query ("ask ai...", "explain...", "what is...")
      if (cleanText.startsWith("ask ai") || cleanText.startsWith("explain") || cleanText.startsWith("what is")) {
        speak(`Asking AI: ${cleanText.replace("ask ai", "").trim()}`);
        navigate("/ai-agent");
        return;
      }
    },
    [navigate, setTheme, theme, speak]
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error("Speech Recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState("listening");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text;
          } else {
            interim += text;
          }
        }

        const currentSpeech = (finalTranscript || interim).trim();
        setTranscript(currentSpeech);

        if (!currentSpeech) return;

        const lowerSpeech = currentSpeech.toLowerCase();

        // Check if phrase contains wake word or command keywords
        const keywords = [
          "dashboard", "quiz", "quizzes", "assignment", "assignments",
          "schedule",
          "streak", "streaks", "contest", "contests", "clan", "clans",
          "message", "messages", "voice tutor", "ai tutor", "ai agent",
          "setting", "settings", "profile", "student", "students",
          "help", "dark mode", "light mode", "scroll down", "scroll top",
          "ask ai", "explain", "what is"
        ];

        const hasMatchingKeyword = keywords.some(kw => lowerSpeech.includes(kw));

        if (hasMatchingKeyword) {
          executeCommand(lowerSpeech);
          setTranscript("");
          return;
        }

        // Wake phrase fallback
        if (lowerSpeech.includes("hey eduspace") || lowerSpeech.includes("eduspace")) {
          playWakeChime();
          speak("Yes, I'm listening");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore re-start race conditions
          }
        } else {
          setVoiceState("disabled");
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      toast.error("Could not start microphone listener");
      setVoiceState("disabled");
    }
  }, [executeCommand, speak]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("disabled");
    setTranscript("");
  }, []);

  const toggleVoiceMode = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const toggleWakeWordMode = useCallback(() => {
    setIsWakeWordEnabled((prev) => !prev);
  }, []);

  const processCommandManually = useCallback(
    (cmd: string) => {
      executeCommand(cmd);
    },
    [executeCommand]
  );

  return (
    <VoiceCommandContext.Provider
      value={{
        isVoiceSupported,
        voiceState,
        isWakeWordEnabled,
        isListening: voiceState !== "disabled",
        isSpeaking: voiceState === "speaking",
        transcript,
        lastCommand,
        feedbackText,
        toggleVoiceMode,
        toggleWakeWordMode,
        startListening,
        stopListening,
        speak,
        processCommandManually,
      }}
    >
      {children}
    </VoiceCommandContext.Provider>
  );
};

export const useVoiceCommands = () => {
  const context = useContext(VoiceCommandContext);
  if (!context) {
    throw new Error("useVoiceCommands must be used within a VoiceCommandProvider");
  }
  return context;
};
