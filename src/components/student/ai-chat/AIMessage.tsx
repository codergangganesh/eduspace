import { MessageRole, MessageContent } from "@/lib/aiChatService";
import { cn } from "@/lib/utils";
import { User, Sparkles, Copy, Check, Pencil, ThumbsUp, ThumbsDown, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { aiChatService } from "@/lib/aiChatService";
import { speakNaturalText } from "@/lib/naturalSpeech";

interface AIMessageProps {
    messageId?: string;
    role: MessageRole;
    content: string | MessageContent[];
    profile?: {
        full_name?: string;
        avatar_url?: string;
    };
    onUpdateMessage?: (id: string, newContent: string) => void;
    isReadOnly?: boolean;
    isStreaming?: boolean;
    feedbackState?: 'like' | 'dislike' | null;
    onFeedbackChange?: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
}

const TypingCursor = () => (
    <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "linear"
        }}
        className="inline-block w-1.5 h-4 ml-0.5 bg-primary/50 rounded-full align-middle mb-0.5"
    />
);

function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group/code my-4 sm:my-6 rounded-2xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl max-w-full w-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        {language || 'code'}
                    </span>
                </div>

                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                    title="Copy code to clipboard"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy code</span>
                        </>
                    )}
                </Button>
            </div>

            {/* Code Content */}
            <SyntaxHighlighter
                style={vscDarkPlus as any}
                language={language || 'text'}
                PreTag="div"
                className="!bg-transparent !p-3 sm:!p-5 !m-0 font-mono text-xs sm:text-sm leading-relaxed max-w-full overflow-x-auto"
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

export function AIMessage({ messageId, role, content, profile, onUpdateMessage, isReadOnly, isStreaming, feedbackState, onFeedbackChange }: AIMessageProps) {
    const [copied, setCopied] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(typeof content === 'string' ? content : '');
    const [localFeedback, setLocalFeedback] = useState<'like' | 'dislike' | null>(feedbackState || null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isAssistant = role === 'assistant';

    const getRawText = (c: string | MessageContent[]): string => {
        if (typeof c === 'string') return c;
        return c.map(item => item.type === 'text' ? item.text : '').join(' ');
    };

    const rawText = getRawText(content);

    const processedText = isAssistant
        ? rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim()
        : rawText;

    const handleCopy = () => {
        navigator.clipboard.writeText(processedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const speechRef = useRef<{ stop: () => void } | null>(null);

    const handleSpeak = () => {
        if (isSpeaking) {
            speechRef.current?.stop();
            setIsSpeaking(false);
            return;
        }

        setIsSpeaking(true);
        speechRef.current = speakNaturalText(
            processedText,
            () => setIsSpeaking(false),
            () => setIsSpeaking(false)
        );
    };

    useEffect(() => {
        return () => {
            speechRef.current?.stop();
        };
    }, []);

    const handleSave = () => {
        if (!editValue.trim() || editValue === content) {
            setIsEditing(false);
            return;
        }
        if (messageId && onUpdateMessage) {
            onUpdateMessage(messageId, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleFeedback = async (type: 'like' | 'dislike') => {
        const newFeedback = localFeedback === type ? null : type;
        setLocalFeedback(newFeedback);

        if (messageId && onFeedbackChange) {
            try {
                await aiChatService.upsertFeedback(messageId, type);
                onFeedbackChange(messageId, newFeedback);
            } catch (error) {
                console.error("Failed to save feedback:", error);
                // Revert on error silently — no toast to avoid confusion
                setLocalFeedback(localFeedback);
            }
        }
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        setLocalFeedback(feedbackState || null);
    }, [feedbackState]);

    return (
        <div className={cn(
            "group w-full py-4 md:py-8 transition-all duration-300 relative overflow-hidden",
            isAssistant ? "bg-accent/5 md:bg-accent/10" : "bg-transparent"
        )}>
            <div className="max-w-4xl mx-auto px-2 sm:px-4 md:px-6 flex gap-2.5 sm:gap-4 md:gap-6 w-full min-w-0">
                <div className="shrink-0 pt-1">
                    {isAssistant ? (
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl border border-border/40 shadow-lg ring-1 ring-white/10">
                            <AvatarImage src="/favicon.png" className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl sm:rounded-2xl">
                                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl border border-border/40 shadow-sm ring-1 ring-black/5">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-muted text-muted-foreground rounded-xl sm:rounded-2xl">
                                {profile?.full_name?.charAt(0) || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80 truncate">
                            {isAssistant ? "EduSpace AI" : (profile?.full_name || "You")}
                        </span>

                        <div className="flex items-center gap-1">
                            {!isAssistant && !isEditing && !isReadOnly && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setIsEditing(true)}
                                    className="h-8 w-8 opacity-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 rounded-lg hover:bg-background/80"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            )}
                            {!isEditing && !isAssistant && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    className="h-8 w-8 opacity-30 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 rounded-lg hover:bg-background/80"
                                >
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <Textarea
                                ref={textareaRef}
                                value={editValue}
                                onChange={(e) => {
                                    setEditValue(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                className="min-h-[60px] w-full max-w-full resize-none bg-background/50 border-primary/20 text-sm font-medium focus-visible:ring-primary/20 break-words [overflow-wrap:anywhere]"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    className="h-8 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
                                >
                                    <span>Save & Send</span>
                                    <Sparkles className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditValue(rawText);
                                    }}
                                    className="h-8 px-4 rounded-lg text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 w-full min-w-0">
                            {Array.isArray(content) ? (
                                content.map((part, i) => (
                                    <div key={i} className="w-full min-w-0">
                                        {part.type === 'text' && (
                                            <div className={cn(
                                                "prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-medium",
                                                "w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]",
                                                "prose-p:mb-4 last:prose-p:mb-0 prose-p:break-words prose-p:[overflow-wrap:anywhere]",
                                                "prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:max-w-full prose-pre:overflow-x-auto",
                                                "prose-code:break-words prose-code:[overflow-wrap:anywhere]"
                                            )}>
                                                <ReactMarkdown
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            const match = /language-(\w+)/.exec(className || '');
                                                            const codeString = String(children).replace(/\n$/, '');
                                                            return !inline ? (
                                                                <CodeBlock language={match ? match[1] : ''} code={codeString} />
                                                            ) : (
                                                                <code className={cn("bg-muted/50 px-1.5 py-0.5 rounded-md text-primary font-mono text-xs border border-border/20 break-words [overflow-wrap:anywhere]", className)} {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {part.text || ''}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                        {part.type === 'image_url' && (
                                            <div className="my-4 max-w-full sm:max-w-lg">
                                                <div className="rounded-2xl overflow-hidden border border-border/40 shadow-xl ring-1 ring-black/5">
                                                    <img src={part.image_url?.url} alt="Uploaded content" className="w-full h-auto object-cover max-w-full" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className={cn(
                                    "prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-medium",
                                    "w-full min-w-0 overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]",
                                    "prose-p:mb-4 last:prose-p:mb-0 prose-p:break-words prose-p:[overflow-wrap:anywhere]",
                                    "prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl prose-pre:max-w-full prose-pre:overflow-x-auto",
                                    "prose-code:break-words prose-code:[overflow-wrap:anywhere]"
                                )}>
                                    {processedText === "" && isStreaming ? (
                                        <div className="flex items-center gap-2 text-muted-foreground/40 py-2">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="w-2 h-2 rounded-full bg-primary/40"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                                className="w-2 h-2 rounded-full bg-primary/40"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                                                className="w-2 h-2 rounded-full bg-primary/40"
                                            />
                                        </div>
                                    ) : (
                                        <ReactMarkdown
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const codeString = String(children).replace(/\n$/, '');
                                                    return !inline ? (
                                                        <CodeBlock language={match ? match[1] : ''} code={codeString} />
                                                    ) : (
                                                        <code className={cn("bg-muted/50 px-1.5 py-0.5 rounded-md text-primary font-mono text-xs border border-border/20 break-words [overflow-wrap:anywhere]", className)} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                }
                                            }}
                                        >
                                            {processedText}
                                        </ReactMarkdown>
                                    )}
                                    {isStreaming && processedText !== "" && <TypingCursor />}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action row: Copy + Like + Dislike — only for completed AI responses */}
                    {isAssistant && !isStreaming && !isReadOnly && (
                        <div className="mt-3 flex items-center gap-1 flex-wrap">
                            {/* Copy */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCopy}
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
                                aria-label="Copy message"
                                title="Copy message"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>

                            {/* Speaker (Text to Speech) */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSpeak}
                                className={cn(
                                    "h-8 w-8 rounded-lg transition-all duration-200",
                                    isSpeaking
                                        ? "text-primary bg-primary/15 border border-primary/40 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                                aria-label={isSpeaking ? "Stop speaking" : "Read message aloud"}
                                title={isSpeaking ? "Stop speaking" : "Read message aloud"}
                            >
                                {isSpeaking ? (
                                    <VolumeX className="h-4 w-4 text-primary" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>

                            {/* Like */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleFeedback('like')}
                                className={cn(
                                    "h-8 w-8 rounded-lg transition-all duration-200",
                                    localFeedback === 'like'
                                        ? "text-blue-500 hover:bg-muted/60"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                                aria-label="Like this response"
                                aria-pressed={localFeedback === 'like'}
                            >
                                <ThumbsUp className={cn("h-4 w-4", localFeedback === 'like' && "fill-blue-500")} />
                            </Button>

                            {/* Dislike */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleFeedback('dislike')}
                                className={cn(
                                    "h-8 w-8 rounded-lg transition-all duration-200",
                                    localFeedback === 'dislike'
                                        ? "text-rose-500 hover:bg-muted/60"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                                aria-label="Dislike this response"
                                aria-pressed={localFeedback === 'dislike'}
                            >
                                <ThumbsDown className={cn("h-4 w-4", localFeedback === 'dislike' && "fill-rose-500")} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle separator for "manual" feel */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/10 to-transparent" />
        </div>
    );
}