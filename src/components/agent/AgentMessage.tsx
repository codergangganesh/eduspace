import { CheckCircle, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentMessage } from "@/types/agent";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { speakNaturalText } from "@/lib/naturalSpeech";

interface AgentMessageBubbleProps {
  message: AgentMessage;
}

/** Converts **bold** and \n to HTML spans — lightweight, no markdown lib needed */
const renderContent = (text: string) => {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </span>
    );
  });
};

export const AgentMessageBubble = ({ message }: AgentMessageBubbleProps) => {
  const { profile } = useAuth();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const isUser = message.role === "user";
  const isSuccess = message.type === "success";
  const isError = message.type === "error";
  const isConfirmation = message.type === "confirmation";

  const handleSpeak = () => {
    if (isSpeaking) {
      speechRef.current?.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speechRef.current = speakNaturalText(
      message.content,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
    };
  }, []);

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        {isUser ? (
          <Avatar className="size-8 border-2 border-primary/20 shadow-sm">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
              {profile?.full_name?.substring(0, 2).toUpperCase() || "YO"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl overflow-hidden shadow-lg border border-border/60",
              isSuccess
                ? "bg-emerald-100 dark:bg-emerald-900/30"
                : isError
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-background"
            )}
          >
            {isSuccess ? (
              <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
            ) : isError ? (
              <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
            ) : (
              <img src="/favicon.png" alt="Agent" className="size-full object-cover" />
            )}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-[24px] px-5 py-3.5 text-[14px] leading-relaxed shadow-sm transition-all duration-300",
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/10"
            : isSuccess
              ? "rounded-tl-sm border border-emerald-500/10 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100"
              : isError
                ? "rounded-tl-sm border border-red-500/10 bg-red-500/5 text-red-900 dark:text-red-100"
                : isConfirmation
                  ? "rounded-tl-sm border border-amber-500/10 bg-amber-500/5 text-foreground"
                  : "rounded-tl-sm border border-border/40 bg-card/60 backdrop-blur-md text-foreground"
        )}
      >
        {/* Content */}
        <div className="whitespace-pre-wrap break-words font-medium">
          {renderContent(message.content)}
        </div>

        {/* Timestamp & Speak Button */}
        <div
          className={cn(
            "mt-2.5 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest",
            isUser
              ? "text-primary-foreground/40 justify-end"
              : "text-muted-foreground/40"
          )}
        >
          <span>{format(message.timestamp, "h:mm a")}</span>
          {!isUser && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSpeak}
              className={cn(
                "h-6 w-6 rounded-md p-0.5 transition-all duration-200",
                isSpeaking
                  ? "text-primary bg-primary/15 border border-primary/40 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
              )}
              aria-label={isSpeaking ? "Stop speaking" : "Read message aloud"}
              title={isSpeaking ? "Stop speaking" : "Read message aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
