import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, Image as ImageIcon, Trash2, X, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { aiChatService } from "@/lib/aiChatService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatInputProps {
    onSendMessage: (message: string, image?: string) => void;
    isLoading: boolean;
}

const AudioWave = () => (
    <div className="flex items-center gap-1 h-8 px-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <motion.div
                key={i}
                initial={{ height: 4 }}
                animate={{
                    height: [4, 16, 8, 24, 6, 20, 4],
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

export function AIChatInput({ onSendMessage, isLoading }: AIChatInputProps) {
    const [input, setInput] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showComingSoon, setShowComingSoon] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((input.trim() || selectedImage) && !isLoading) {
            onSendMessage(input.trim(), selectedImage || undefined);
            setInput("");
            setSelectedImage(null);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

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
                setInput(prev => prev ? `${prev} ${text}` : text);
            }
        } catch (error) {
            console.error("Transcription error:", error);
            toast.error("Failed to transcribe audio");
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) {
                toast.error("Image must be smaller than 4MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
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
            className="relative w-full max-w-4xl mx-auto"
        >
            {showComingSoon && (
                <div className="absolute -top-8 left-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md shadow-sm uppercase tracking-wider">
                        Documents Coming Soon
                    </div>
                </div>
            )}

            {selectedImage && (
                <div className="px-2 md:px-4 mb-2">
                    <div className="relative inline-block group">
                        <img
                            src={selectedImage}
                            alt="Selected"
                            className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl md:rounded-2xl border-2 border-primary/20 shadow-md group-hover:brightness-75 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-1 shadow-lg ring-2 ring-background opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-1.5 md:gap-3 px-1 md:px-2">
                <div className="relative group flex-1">
                    {/* Professional subtle border glow */}
                    <div className="absolute inset-0 bg-primary/5 rounded-[24px] md:rounded-[28px] blur-sm opacity-100 group-focus-within:opacity-0 transition-opacity duration-500" />

                    <div className="relative flex items-center w-full rounded-[24px] md:rounded-[28px] border border-neutral-300 dark:border-border/60 bg-card/60 backdrop-blur-md px-1 md:px-2 shadow-sm transition-all duration-300 group-focus-within:border-primary/40 group-focus-within:shadow-[0_0_200px_rgba(var(--primary-rgb),0.02)]">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setShowComingSoon(true);
                                setTimeout(() => setShowComingSoon(false), 2000);
                            }}
                            className="h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-full text-muted-foreground/60 hover:text-primary transition-colors ml-0.5"
                        >
                            <Paperclip className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>

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
                                        <span className="text-xs font-bold text-primary animate-pulse ml-2 uppercase tracking-widest">
                                            Listening...
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={isTranscribing ? "Transcribing..." : (isRecording ? "" : "Message AI...")}
                                disabled={isTranscribing}
                                className={cn(
                                    "min-h-[44px] md:min-h-[48px] w-full resize-none bg-transparent px-2 py-[12px] md:py-[14px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0 text-[14px] font-medium placeholder:text-muted-foreground/40 scrollbar-none transition-all",
                                    isRecording && "opacity-20 blur-[1px]"
                                )}
                                rows={1}
                            />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={cn(
                                "h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-full mr-0.5 transition-all text-xs md:text-sm",
                                isRecording
                                    ? "bg-rose-500/10 text-rose-500 animate-pulse"
                                    : "text-muted-foreground/60 hover:text-primary"
                            )}
                        >
                            {isTranscribing ? (
                                <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                            ) : (
                                <Mic className={cn("h-3.5 w-3.5 md:h-4 md:w-4", isRecording && "fill-current")} />
                            )}
                        </Button>
                    </div>
                </div>

                <Button
                    type="submit"
                    size="icon"
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className={cn(
                        "h-11 w-11 md:h-12 md:w-12 shrink-0 rounded-full transition-all duration-300 mb-0.5",
                        (input.trim() || selectedImage) && !isLoading
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100 opacity-100 hover:scale-105 active:scale-95"
                            : "bg-muted text-muted-foreground scale-95 opacity-50"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-4.5 w-4.5 md:h-5 md:w-5" />
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
