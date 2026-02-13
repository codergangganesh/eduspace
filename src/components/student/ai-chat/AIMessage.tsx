import { MessageRole } from "@/lib/aiChatService";
import { cn } from "@/lib/utils";
import { User, Bot, Sparkles, Copy, Check, Pencil, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AIMessageProps {
    messageId?: string;
    role: MessageRole;
    content: string;
    profile?: {
        full_name?: string;
        avatar_url?: string;
    };
    onUpdateMessage?: (id: string, newContent: string) => void;
    isReadOnly?: boolean;
}

export function AIMessage({ messageId, role, content, profile, onUpdateMessage, isReadOnly }: AIMessageProps) {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isAssistant = role === 'assistant';

    const processedContent = isAssistant
        ? content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/gi, '').trim()
        : content;

    const handleCopy = () => {
        navigator.clipboard.writeText(processedContent);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

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

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.focus();
        }
    }, [isEditing]);

    return (
        <div className={cn(
            "group w-full py-6 md:py-8 transition-all duration-300 relative",
            isAssistant ? "bg-accent/5 md:bg-accent/10" : "bg-transparent"
        )}>
            <div className="max-w-4xl mx-auto px-4 md:px-6 flex gap-3 md:gap-6">
                <div className="shrink-0 pt-1">
                    {isAssistant ? (
                        <Avatar className="h-10 w-10 rounded-2xl border border-border/40 shadow-lg ring-1 ring-white/10">
                            <AvatarImage src="/favicon.png" className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl">
                                <Sparkles className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar className="h-10 w-10 rounded-2xl border border-border/40 shadow-sm ring-1 ring-black/5">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-muted text-muted-foreground rounded-2xl">
                                {profile?.full_name?.charAt(0) || <User className="h-5 w-5" />}
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">
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
                            {!isEditing && (
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
                                className="min-h-[60px] w-full resize-none bg-background/50 border-primary/20 text-sm font-medium focus-visible:ring-primary/20"
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
                                        setEditValue(content);
                                    }}
                                    className="h-8 px-4 rounded-lg text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-medium",
                            "prose-p:mb-4 last:prose-p:mb-0",
                            "prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl"
                        )}>
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code my-6 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        {match[1]}
                                                    </span>
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                                                    </div>
                                                </div>
                                                <SyntaxHighlighter
                                                    style={vscDarkPlus as any}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    className="!bg-transparent !p-5 !m-0 font-mono text-sm leading-relaxed"
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            </div>
                                        ) : (
                                            <code className={cn("bg-muted/50 px-1.5 py-0.5 rounded-md text-primary font-mono text-xs border border-border/20", className)} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {processedContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle separator for "manual" feel */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/10 to-transparent" />
        </div>
    );
}
