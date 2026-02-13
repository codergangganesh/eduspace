import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

export function AIChatInput({ onSendMessage, isLoading }: AIChatInputProps) {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput("");
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    return (
        <form
            onSubmit={handleSubmit}
            className="relative"
        >
            <div className="flex items-end gap-3 px-2">
                <div className="relative group flex-1">
                    {/* Professional subtle border glow */}
                    <div className="absolute inset-0 bg-primary/5 rounded-[28px] blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                    <div className="relative flex items-center w-full rounded-[28px] border border-border/60 bg-card/60 backdrop-blur-md px-2 shadow-sm transition-all duration-300 group-focus-within:border-primary/40 group-focus-within:shadow-[0_0_20px_rgba(var(--primary-rgb),0.02)]">
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message EduSpace Assistant..."
                            className="min-h-[48px] w-full resize-none bg-transparent px-5 py-[14px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0 text-[14px] font-medium placeholder:text-muted-foreground/40 scrollbar-none"
                            rows={1}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                        "h-12 w-12 shrink-0 rounded-full transition-all duration-300 mb-0.5",
                        input.trim() && !isLoading
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100 opacity-100 hover:scale-105 active:scale-95"
                            : "bg-muted text-muted-foreground scale-95 opacity-50"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>
            <div className="flex items-center justify-end mt-2 px-4 text-right">
                <p className="text-[10px] font-semibold text-muted-foreground/60 tracking-tight uppercase">
                    EduSpace AI
                </p>
            </div>
        </form>
    );
}
