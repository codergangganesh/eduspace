import { MessageRole, MessageContent } from "@/lib/aiChatService";
import { cn } from "@/lib/utils";
import { User, Sparkles, Copy, Check, Pencil, ThumbsUp, ThumbsDown, Volume2, VolumeX, Play, Loader2, Terminal, Trash2 } from "lucide-react";
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
    onQuickAction?: (prompt: string) => void;
    userPromptContext?: string;
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

const loadPyodideEngine = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if ((window as any).pyodideInstance) {
            resolve((window as any).pyodideInstance);
            return;
        }
        if ((window as any).loadPyodide) {
            (window as any).loadPyodide().then((py: any) => {
                (window as any).pyodideInstance = py;
                resolve(py);
            }).catch(reject);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.onload = () => {
            if ((window as any).loadPyodide) {
                (window as any).loadPyodide().then((py: any) => {
                    (window as any).pyodideInstance = py;
                    resolve(py);
                }).catch(reject);
            } else {
                reject(new Error("loadPyodide undefined"));
            }
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

const loadSkulpt = (): Promise<void> => {
    return new Promise((resolve) => {
        if ((window as any).Sk) {
            resolve();
            return;
        }
        const script1 = document.createElement("script");
        script1.src = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js";
        script1.onload = () => {
            const script2 = document.createElement("script");
            script2.src = "https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js";
            script2.onload = () => resolve();
            script2.onerror = () => resolve();
            document.body.appendChild(script2);
        };
        script1.onerror = () => resolve();
        document.body.appendChild(script1);
    });
};

interface ExecutionRecord {
    id: string;
    timestamp: string;
    executionTime: string;
    output: string;
    isError: boolean;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [history, setHistory] = useState<ExecutionRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<ExecutionRecord | null>(null);

    const storageKey = useRef<string>('');
    if (!storageKey.current) {
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = (hash << 5) - hash + code.charCodeAt(i);
            hash |= 0;
        }
        storageKey.current = `eduspace_term_${Math.abs(hash)}`;
    }

    // Load persistent execution history on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey.current);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHistory(parsed);
                    setSelectedRecord(parsed[0]);
                }
            }
        } catch (e) {
            // ignore localStorage errors
        }
    }, []);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyOutput = () => {
        if (!selectedRecord?.output) return;
        navigator.clipboard.writeText(selectedRecord.output);
        setCopiedOutput(true);
        setTimeout(() => setCopiedOutput(false), 2000);
    };

    const handleClearHistory = () => {
        setHistory([]);
        setSelectedRecord(null);
        try {
            localStorage.removeItem(storageKey.current);
        } catch (e) { }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setShowOutput(true);
        const startTime = performance.now();
        const cleanLang = (language || 'javascript').toLowerCase().trim();
        let finalOut = '';
        let isErr = false;

        try {
            // 1. Local high-speed execution for JavaScript / TypeScript
            if (cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'typescript' || cleanLang === 'ts') {
                const logs: string[] = [];
                const customConsole = {
                    log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                    error: (...args: any[]) => logs.push(`[Error] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                    warn: (...args: any[]) => logs.push(`[Warn] ` + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
                    info: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
                };

                try {
                    const runFn = new Function('console', code);
                    const result = runFn(customConsole);
                    if (result !== undefined && logs.length === 0) {
                        logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
                    }
                    finalOut = logs.length > 0 ? logs.join('\n') : 'Code executed successfully with zero output.';
                    isErr = false;
                } catch (err: any) {
                    finalOut = err?.message || String(err);
                    isErr = true;
                }
            } else if (cleanLang === 'python' || cleanLang === 'py' || cleanLang === 'python3') {
                // 2. Real Python 3 Execution (Pyodide WebAssembly Engine)
                let pySuccess = false;
                try {
                    const py = await loadPyodideEngine();
                    py.runPython(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
                    `);

                    try {
                        await py.runPythonAsync(code);
                        const stdout = py.runPython("sys.stdout.getvalue()");
                        const stderr = py.runPython("sys.stderr.getvalue()");
                        finalOut = (stdout || stderr || "Code executed successfully with zero output.").trim();
                        isErr = Boolean(stderr && !stdout);
                        pySuccess = true;
                    } catch (pyErr: any) {
                        const stderr = py.runPython("sys.stderr.getvalue()");
                        finalOut = (stderr || pyErr?.message || String(pyErr)).trim();
                        isErr = true;
                        pySuccess = true;
                    }
                } catch (loadErr: any) {
                    console.warn("Pyodide loading notice...", loadErr);
                }

                if (!pySuccess) {
                    // Fallback to Skulpt Engine
                    try {
                        await loadSkulpt();
                        const Sk = (window as any).Sk;
                        if (Sk) {
                            const logs: string[] = [];
                            Sk.configure({
                                output: (text: string) => logs.push(text),
                                read: (x: string) => (Sk.builtinFiles?.files?.[x] || ""),
                                python3: true
                            });

                            await Sk.misceval.asyncToPromise(() => {
                                return Sk.importMainWithBody("<stdin>", false, code, true);
                            });

                            const skOut = logs.join('').trim();
                            if (skOut) {
                                finalOut = skOut;
                                isErr = false;
                            }
                        }
                    } catch (skErr: any) {
                        console.warn("Skulpt fallback notice...", skErr);
                    }
                }
            }

            // 3. Wandbox Multi-Language Execution API
            if (!finalOut) {
                const wandboxCompilers: Record<string, string> = {
                    python: 'cpython-head', python3: 'cpython-head', py: 'cpython-head',
                    cpp: 'gcc-head', 'c++': 'gcc-head', c: 'gcc-head-c',
                    java: 'openjdk-head', javascript: 'nodejs-head', js: 'nodejs-head',
                    typescript: 'typescript-head', ts: 'typescript-head',
                    go: 'go-head', rust: 'rust-head', php: 'php-head', ruby: 'ruby-head', sql: 'sqlite-head'
                };

                const wandboxCompiler = wandboxCompilers[cleanLang];
                if (wandboxCompiler) {
                    try {
                        const res = await fetch('https://wandbox.org/api/compile.json', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ compiler: wandboxCompiler, code })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            const out = (data.program_output || data.compiler_output || '').trim();
                            if (out) {
                                finalOut = out;
                                isErr = Boolean(data.status !== '0' && data.compiler_output);
                            }
                        }
                    } catch (err) {
                        console.warn("Wandbox error:", err);
                    }
                }
            }

            if (!finalOut) {
                finalOut = 'Code executed with zero return output.';
            }

        } catch (error: any) {
            finalOut = `Execution Error: ${error?.message || 'Could not execute code in sandbox.'}`;
            isErr = true;
        } finally {
            const endTime = performance.now();
            const timeStr = ((endTime - startTime) / 1000).toFixed(3) + 's';
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            const newRecord: ExecutionRecord = {
                id: crypto.randomUUID(),
                timestamp,
                executionTime: timeStr,
                output: finalOut,
                isError: isErr
            };

            setHistory(prev => {
                const updated = [newRecord, ...prev].slice(0, 10);
                try {
                    localStorage.setItem(storageKey.current, JSON.stringify(updated));
                } catch (e) { }
                return updated;
            });
            setSelectedRecord(newRecord);
            setIsRunning(false);
        }
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

                <div className="flex items-center gap-1.5">
                    {/* Run Code Button */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="h-7 px-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg flex items-center justify-center transition-all active:scale-95 border border-emerald-500/20 shadow-sm"
                        title="Run Code"
                    >
                        {isRunning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                        ) : (
                            <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                        )}
                    </Button>

                    {/* Terminal Toggle Button */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowOutput(!showOutput)}
                        className={cn(
                            "h-7 px-2 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all active:scale-95 border relative",
                            showOutput || history.length > 0
                                ? "text-primary hover:text-primary hover:bg-primary/10 border-primary/30"
                                : "text-muted-foreground hover:text-white hover:bg-white/10 border-white/10"
                        )}
                        title="Terminal Output"
                    >
                        <Terminal className="h-3.5 w-3.5" />
                        {history.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                    </Button>

                    {/* Copy Code Button */}
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

                            </>
                        )}
                    </Button>
                </div>
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

            {/* Interactive Execution Output Console Drawer */}
            {showOutput && (
                <div className="border-t border-white/10 bg-[#0c0c0e] p-3 sm:p-4 text-xs font-mono">
                    <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                isRunning ? "bg-amber-400 animate-pulse" : (selectedRecord?.isError ? "bg-rose-500" : "bg-emerald-400")
                            )} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                Terminal Output
                                {selectedRecord && (
                                    <span className="text-neutral-400 font-normal">
                                        ({selectedRecord.executionTime} • {selectedRecord.timestamp})
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* History selector */}
                            {history.length > 1 && (
                                <select
                                    value={selectedRecord?.id || ''}
                                    onChange={(e) => {
                                        const rec = history.find(r => r.id === e.target.value);
                                        if (rec) setSelectedRecord(rec);
                                    }}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-muted-foreground focus:outline-none focus:border-primary/40 cursor-pointer"
                                >
                                    {history.map((rec, idx) => (
                                        <option key={rec.id} value={rec.id} className="bg-[#121214] text-white">
                                            Run #{history.length - idx} ({rec.timestamp})
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Copy Output Button */}
                            {selectedRecord?.output && (
                                <button
                                    type="button"
                                    onClick={handleCopyOutput}
                                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                    title="Copy terminal output"
                                >
                                    {copiedOutput ? (
                                        <>
                                            <Check className="h-3 w-3 text-emerald-400" />

                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />

                                        </>
                                    )}
                                </button>
                            )}

                            {/* Clear History Button */}
                            {history.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearHistory}
                                    className="text-[10px] font-medium text-muted-foreground/70 hover:text-rose-400 transition-colors flex items-center gap-1 px-1.5 py-1"
                                    title="Clear output history"
                                >
                                    <Trash2 className="h-3 w-3" />

                                </button>
                            )}

                            {/* Hide Drawer Button */}
                            <button
                                type="button"
                                onClick={() => setShowOutput(false)}
                                className="text-[10px] font-medium text-muted-foreground/70 hover:text-white transition-colors px-1.5 py-1"
                                title="Close terminal"
                            >
                                Hide
                            </button>
                        </div>
                    </div>

                    <pre className={cn(
                        "max-h-64 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed font-mono p-3 rounded-xl bg-black/60 border border-white/5 shadow-inner selection:bg-primary/30",
                        selectedRecord?.isError ? "text-rose-400" : "text-emerald-300/90"
                    )}>
                        {isRunning ? "Executing code in sandbox..." : (selectedRecord?.output || "No output history yet. Click ▶ to run.")}
                    </pre>
                </div>
            )}
        </div>
    );
}

interface QuickActionItem {
    label: string;
    prompt: string;
}

function getContextualQuickActions(userPrompt: string, aiResponse: string, hasCode: boolean): QuickActionItem[] {
    const userText = userPrompt.toLowerCase();
    const aiText = aiResponse.toLowerCase();
    const combinedText = `${userText} ${aiText}`;

    // 1. Error / Debugging / Exception Intent
    if (/\b(error|bug|exception|traceback|failed|crash|fix|issue|why am i getting|warning|syntaxerror|typeerror|nullpointer|undefined|invalid|cannot read)\b/.test(combinedText)) {
        return [
            {
                label: "Explain Error",
                prompt: "Explain why this error occurs and what caused it in detail."
            },
            {
                label: "Debug Code",
                prompt: "Debug this code line-by-line and pinpoint the exact root cause of the failure."
            },
            {
                label: "Suggest Fix",
                prompt: "Provide the exact code fix and step-by-step instructions to resolve this error."
            },
            {
                label: "Show Corrected Code",
                prompt: "Show the complete corrected code with the error fixed and tested."
            },
            {
                label: "Explain Step by Step",
                prompt: "Explain step-by-step how to prevent this type of error in the future."
            }
        ];
    }

    // 2. Component Refactoring / UI / React Intent
    if (/\b(react|component|refactor|improve it|ui|style|tailwind|jsx|tsx|css|hooks|state|props|view)\b/.test(combinedText) && (hasCode || /\b(component|code)\b/.test(combinedText))) {
        return [
            {
                label: "Optimize Component",
                prompt: "Optimize this component for better rendering performance and clean state management."
            },
            {
                label: "Improve UI & Style",
                prompt: "Enhance the styling, visual polish, and layout aesthetics of this UI component."
            },
            {
                label: "Fix Issues",
                prompt: "Identify and fix any potential bugs, accessibility issues, or edge cases in this component."
            },
            {
                label: "Refactor Code",
                prompt: "Refactor this code following modern clean code architecture best practices."
            },
            {
                label: "Explain Changes",
                prompt: "Provide a summary explaining the key architectural and structural improvements made."
            }
        ];
    }

    // 3. Code Generation / Writing Code Intent
    if (hasCode || /\b(write|create|program|function|script|algorithm|python|javascript|typescript|cpp|c\+\+|java|sql|code|array|loop)\b/.test(userText)) {
        return [
            {
                label: "Explain Code",
                prompt: "Please explain step-by-step how this code works and what each part does."
            },
            {
                label: "Optimize Code",
                prompt: "Optimize this code for better time and space complexity and runtime performance."
            },
            {
                label: "Add Comments",
                prompt: "Add clear, descriptive inline comments to this code explaining key logic."
            },
            {
                label: "Convert Language",
                prompt: "Convert this code into another programming language (e.g., Python, JavaScript, TypeScript, or C++)."
            },
            {
                label: "Generate Test Cases",
                prompt: "Generate unit tests and edge-case test inputs for this code."
            }
        ];
    }

    // 4. Writing / Rewriting / Text Editing Intent
    if (/\b(rewrite|paragraph|essay|grammar|professional|tone|summarize|improve|text|article|draft|writing|email|letter)\b/.test(userText)) {
        return [
            {
                label: "Make More Professional",
                prompt: "Rewrite this text to sound highly professional, formal, and polished."
            },
            {
                label: "Make It Shorter",
                prompt: "Make this text concise while retaining all key information."
            },
            {
                label: "Improve Grammar",
                prompt: "Correct all grammar, spelling, punctuation, and phrasing errors."
            },
            {
                label: "Simplify Text",
                prompt: "Simplify the wording and structure so it is easy for anyone to understand."
            },
            {
                label: "Change Tone",
                prompt: "Provide 3 alternative variations of this text in different tones (e.g. Academic, Casual, Persuasive)."
            }
        ];
    }

    // 5. Math / Science / Formula Intent
    if (/\b(equation|formula|theorem|calculate|solve|derivative|integral|matrix|proof|physics|chemistry|math|statistic|algebra)\b/.test(combinedText)) {
        return [
            {
                label: "Step-by-Step Solution",
                prompt: "Show a detailed step-by-step mathematical breakdown for this solution."
            },
            {
                label: "Explain Formula",
                prompt: "Explain the underlying intuition and practical application of this formula/theorem."
            },
            {
                label: "Generate Practice Problem",
                prompt: "Create a similar math/science problem with a step-by-step solution for practice."
            },
            {
                label: "Simplify Math",
                prompt: "Explain this math concept in simple, intuitive terms without heavy notation."
            }
        ];
    }

    // 6. Quiz / Assessment Intent
    if (/\b(quiz|question|test|exam|practice|mcq|choice|option|assessment)\b/.test(combinedText)) {
        return [
            {
                label: "More Practice Questions",
                prompt: "Generate 3 more practice questions with detailed explanations."
            },
            {
                label: "Explain Options",
                prompt: "Explain why the incorrect options in these questions are wrong."
            },
            {
                label: "Summarize Key Concepts",
                prompt: "Summarize the core concepts tested in these questions as quick study notes."
            }
        ];
    }

    // 7. Fallback / General Learning Intent
    return [
        {
            label: "Explain Simpler (ELI5)",
            prompt: "Could you explain this concept in simpler terms as if I'm 5 years old (ELI5)?"
        },
        {
            label: "Real-World Examples",
            prompt: "Provide 3 concrete real-world examples illustrating this concept in action."
        },
        {
            label: "Generate Quiz",
            prompt: "Generate 3 multiple-choice practice questions with answers and explanations based on this response."
        },
        {
            label: "Save as Flashcard",
            prompt: "Summarize the key takeaways from this response as concise bullet points for a flashcard."
        }
    ];
}

export function AIMessage({ messageId, role, content, profile, onUpdateMessage, isReadOnly, isStreaming, feedbackState, onFeedbackChange, onQuickAction, userPromptContext }: AIMessageProps) {
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

    const containsCode = processedText.includes('```');
    const contextualQuickActions = getContextualQuickActions(userPromptContext || '', processedText, containsCode);

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
                        <div className="mt-3 space-y-2.5">
                            <div className="flex items-center gap-1 flex-wrap">
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

                            {onQuickAction && (
                                <div className="pt-2 border-t border-border/15 flex items-center gap-1.5 flex-wrap">
                                    {contextualQuickActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => onQuickAction(action.prompt)}
                                            className="text-[11px] font-medium px-3 py-1 rounded-full border border-border/60 hover:border-primary/40 bg-card/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 shadow-sm"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Subtle separator for "manual" feel */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/10 to-transparent" />
        </div>
    );
}