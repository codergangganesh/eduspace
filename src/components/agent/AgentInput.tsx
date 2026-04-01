import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Loader2, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { aiChatService } from "@/lib/aiChatService";
import { toast } from "sonner";

interface AgentInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const AudioWave = () => (
    <div className="flex items-center gap-1 h-6 px-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{
                    height: [4, 12, 6, 18, 4, 14, 4],
                }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                }}
                className="w-1 rounded-full bg-primary/40 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
            />
        ))}
    </div>
);

export const AgentInput = ({
  onSend,
  disabled,
  placeholder = "Type a command or ask anything...",
}: AgentInputProps) => {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const text = await aiChatService.transcribeAudio(blob);
      if (text) {
        setValue(prev => prev ? `${prev} ${text}` : text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isTranscribing) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  // Auto-resize textarea when value changes from voice
  useEffect(() => {
    handleInput();
  }, [value]);

  return (
    <div className="bg-card w-full">
      <div
        className={cn(
          "flex items-end gap-2 px-3 py-3 relative",
          "ring-0 transition-all duration-300"
        )}
      >
        <div className="relative flex-1">
          <AnimatePresence>
            {isRecording && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute inset-0 z-10 flex items-center bg-card/40 backdrop-blur-sm px-2 pointer-events-none"
                >
                    <AudioWave />
                    <span className="text-[10px] font-bold text-primary animate-pulse ml-2 uppercase tracking-widest">
                        Listening...
                    </span>
                </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={disabled || isTranscribing}
            placeholder={isTranscribing ? "Transcribing..." : (isRecording ? "" : placeholder)}
            rows={1}
            className={cn(
              "flex-1 w-full resize-none bg-transparent text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50",
              "max-h-40 min-h-[24px] outline-none border-0 focus:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isRecording && "opacity-20 blur-[1px]"
            )}
            style={{ height: "24px" }}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "size-8 rounded-xl transition-all duration-300",
              isRecording
                ? "bg-rose-500/10 text-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Mic className={cn("size-4", isRecording && "fill-current")} />
            )}
          </Button>

          <Button
            size="icon"
            onClick={submit}
            disabled={!value.trim() || disabled || isTranscribing}
            className={cn(
              "size-8 rounded-xl transition-all duration-300",
              (value.trim() && !disabled && !isTranscribing)
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100 opacity-100 hover:scale-105"
                : "bg-muted text-muted-foreground scale-95 opacity-50"
            )}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
