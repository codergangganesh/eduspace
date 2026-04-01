import { useEffect, useRef } from "react";
import { AgentMessage, ConfirmationData, TypingStatus } from "@/types/agent";
import { AgentMessageBubble } from "./AgentMessage";
import { AgentConfirmCard } from "./AgentConfirmCard";
import { cn } from "@/lib/utils";

interface AgentChatWindowProps {
  messages: AgentMessage[];
  isTyping: boolean;
  typingStatus: TypingStatus;
  pendingConfirmation: ConfirmationData | null;
  isExecuting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const TypingBubble = ({ status }: { status: string }) => (
  <div className="flex items-center gap-3 px-2">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background border border-border/60 overflow-hidden shadow-lg">
      <img src="/favicon.png" alt="Agent" className="size-full object-cover" />
    </div>
    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/40 bg-card/60 backdrop-blur-md px-4 py-3 text-sm text-muted-foreground shadow-sm">
      <span className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
      </span>
      <span>{status || "Thinking..."}</span>
    </div>
  </div>
);

export const AgentChatWindow = ({
  messages,
  isTyping,
  typingStatus,
  pendingConfirmation,
  isExecuting,
  onConfirm,
  onCancel,
}: AgentChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages / typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col gap-6">
      {messages.map((msg) => (
        <div key={msg.id}>
          <AgentMessageBubble message={msg} />

          {/* Inline confirmation card below the agent message that triggered it */}
          {msg.type === "confirmation" && msg.confirmationData && pendingConfirmation && (
            <div className="mt-2 flex justify-start pl-11">
              <AgentConfirmCard
                data={pendingConfirmation}
                onConfirm={onConfirm}
                onCancel={onCancel}
                isExecuting={isExecuting}
              />
            </div>
          )}
        </div>
      ))}

      {isTyping && <TypingBubble status={typingStatus} />}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
