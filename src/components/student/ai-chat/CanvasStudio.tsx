import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    X,
    Copy,
    Check,
    Play,
    Loader2,
    Code2,
    FileText,
    Globe,
    Maximize2,
    Minimize2,
    Terminal,
    Eye,
    Edit3,
    Monitor,
    Smartphone,
    Tablet,
    Sparkles,
    Trash2,
    Bug,
    Zap,
    TestTube2,
    Languages,
    Clock,
    HardDrive,
    Wrench,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    RotateCcw
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import {
    SUPPORTED_LANGUAGES,
    LanguageConfig,
    getLanguageConfig,
    getMonacoLanguage
} from "@/config/judge0Languages";
import { MonacoCodeEditor } from "./MonacoCodeEditor";
import { codeExecutionService, CodeExecutionResult } from "@/services/codeExecutionService";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export interface CanvasArtifact {
    id: string;
    title: string;
    type: 'code' | 'markdown' | 'html' | 'diagram';
    language?: string;
    content: string;
    version: number;
    history?: { version: number; content: string; timestamp: string }[];
}

interface CanvasStudioProps {
    artifact: CanvasArtifact;
    onClose: () => void;
    onUpdateArtifact: (updatedContent: string) => void;
    onQuickAiAction?: (prompt: string) => void;
}

export function CanvasStudio({ artifact, onClose, onUpdateArtifact, onQuickAiAction }: CanvasStudioProps) {
    const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'terminal'>(
        artifact?.type === 'html' ? 'preview' : 'editor'
    );
    const [content, setContent] = useState<string>(artifact?.content || '');
    const [originalContent] = useState<string>(artifact?.content || '');
    const [copied, setCopied] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Language configuration state
    const [selectedLang, setSelectedLang] = useState<LanguageConfig>(() =>
        getLanguageConfig(artifact?.language || 'python')
    );

    // STDIN State
    const [stdin, setStdin] = useState<string>('');
    const [showStdin, setShowStdin] = useState<boolean>(false);

    // Code execution state (Judge0 backend)
    const [isRunning, setIsRunning] = useState(false);
    const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);

    // Fix Preview State
    const [fixPreview, setFixPreview] = useState<string | null>(null);

    useEffect(() => {
        if (artifact) {
            setContent(artifact.content || '');
            setSelectedLang(getLanguageConfig(artifact.language || 'python'));
            if (artifact.type === 'html' && activeTab === 'editor') {
                setActiveTab('preview');
            }
        }
    }, [artifact]);

    if (!artifact) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyOutput = () => {
        const textToCopy = execResult?.stdout || execResult?.stderr || execResult?.compileOutput || "";
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopiedOutput(true);
        setTimeout(() => setCopiedOutput(false), 2000);
    };

    const handleContentChange = (newVal: string) => {
        setContent(newVal);
        if (typeof onUpdateArtifact === 'function') {
            onUpdateArtifact(newVal);
        }
    };

    const handleLanguageChange = (newLangId: string) => {
        const newConfig = getLanguageConfig(newLangId);
        setSelectedLang(newConfig);
        toast.info(`Switched language to ${newConfig.name}`);
    };

    // Run Code using Judge0 Backend Service
    const handleRunCode = async () => {
        if (!content.trim()) {
            toast.error("Please enter code before running.");
            return;
        }

        setIsRunning(true);
        setActiveTab('terminal');
        setExecResult(null);

        const startTime = performance.now();

        try {
            const result = await codeExecutionService.executeCode({
                language: selectedLang.id,
                code: content,
                stdin: stdin,
            });

            const endTime = performance.now();
            if (!result.time || result.time === '0.00') {
                result.time = ((endTime - startTime) / 1000).toFixed(2);
            }

            setExecResult(result);

            if (result.success) {
                toast.success(`Execution Accepted (${result.status})`);
            } else {
                toast.error(`Execution Status: ${result.status}`);
            }
        } catch (err: any) {
            toast.error("Execution failed.");
            setExecResult({
                success: false,
                status: 'System Error',
                stdout: '',
                stderr: err?.message || 'Error communicating with sandbox execution service.',
                compileOutput: '',
                time: '0.00',
                memory: 0
            });
        } finally {
            setIsRunning(false);
        }
    };

    const triggerAiAction = (actionType: string) => {
        if (!onQuickAiAction) return;

        let prompt = "";
        switch (actionType) {
            case 'explain':
                prompt = `Explain this ${selectedLang.name} code line by line:\n\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            case 'debug':
                prompt = `Debug this ${selectedLang.name} code. Error Status: ${execResult?.status}\nError Output:\n${execResult?.stderr || execResult?.compileOutput}\n\nCode:\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            case 'fix':
                prompt = `Fix the errors in this ${selectedLang.name} code and provide the full corrected code:\nError Status: ${execResult?.status}\nError:\n${execResult?.stderr || execResult?.compileOutput}\n\nCode:\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            case 'optimize':
                prompt = `Optimize this ${selectedLang.name} code for time complexity, space complexity, and performance:\n\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            case 'tests':
                prompt = `Generate test cases and standard inputs (STDIN) for this ${selectedLang.name} code:\n\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            case 'convert':
                prompt = `Convert this ${selectedLang.name} code into idiomatic Python/C++/JavaScript while maintaining output behavior:\n\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
                break;
            default:
                prompt = `Analyze this code:\n\`\`\`${selectedLang.monacoLanguage}\n${content}\n\`\`\``;
        }

        onQuickAiAction(prompt);
    };

    const handleApplyFix = () => {
        if (fixPreview) {
            handleContentChange(fixPreview);
            setFixPreview(null);
            toast.success("Applied AI suggested fix to code editor!");
        }
    };

    const renderStatusBadge = () => {
        if (isRunning) {
            return (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1.5 animate-pulse px-2.5 py-1 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running...
                </Badge>
            );
        }

        if (!execResult) {
            return (
                <Badge variant="outline" className="text-muted-foreground border-border px-2.5 py-1 text-xs">
                    Ready
                </Badge>
            );
        }

        if (execResult.success) {
            return (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1 px-2.5 py-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {execResult.status}
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 flex items-center gap-1 px-2.5 py-1 text-xs">
                <XCircle className="w-3.5 h-3.5" />
                {execResult.status}
            </Badge>
        );
    };

    return (
        <div className={cn(
            "h-full w-full bg-background border-l border-border shadow-2xl flex flex-col transition-all duration-300 overflow-hidden",
            isFullScreen && "fixed inset-0 z-50 rounded-none border-none"
        )}>
            {/* ─── CANVAS STUDIO MAIN HEADER ─── */}
            <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                        <Code2 className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate font-mono">
                            {artifact.title || 'workspace.code'}
                        </h3>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0">
                            v{artifact.version || 1}
                        </span>
                    </div>

                    {/* Language Selector Dropdown */}
                    <div className="relative ml-2 hidden sm:block">
                        <select
                            value={selectedLang.id}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            disabled={isRunning}
                            className="h-8 px-2.5 pr-7 rounded-lg bg-muted/60 border border-input text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 pointer-events-none text-muted-foreground" />
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Run Code Button */}
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="h-8 px-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60"
                        title="Execute via Judge0 Sandbox"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Running...</span>
                            </>
                        ) : (
                            <>
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>▶ Run Code</span>
                            </>
                        )}
                    </Button>

                    {/* Copy Button */}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        className="h-8 px-2.5 text-xs"
                        title="Copy content"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>

                    {/* Full Screen Toggle */}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="h-8 w-8 p-0"
                        title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>

                    {/* Close Panel Button */}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="h-8 w-8 p-0 hover:text-destructive"
                        title="Close Canvas Studio"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Sub-header Navigation Tabs */}
            <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab('editor')}
                        className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all",
                            activeTab === 'editor'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Code2 className="h-3.5 w-3.5 text-primary" />
                        <span>Monaco Editor</span>
                    </button>

                    {(artifact.type === 'html' || artifact.type === 'markdown' || artifact.type === 'diagram') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('preview')}
                            className={cn(
                                "px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all",
                                activeTab === 'preview'
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Live Preview</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveTab('terminal')}
                        className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all relative",
                            activeTab === 'terminal'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Terminal Output</span>
                        {execResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </button>
                </div>

                {/* Mobile Language Selector */}
                <div className="sm:hidden">
                    <select
                        value={selectedLang.id}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={isRunning}
                        className="h-8 px-2 rounded-md bg-muted border border-input text-xs font-medium"
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* AI Fix Preview Banner */}
            <AnimatePresence>
                {fixPreview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex flex-col space-y-2 shrink-0"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-500">
                                <Wrench className="w-4 h-4" />
                                <span>AI Suggested Fix Available</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleApplyFix}
                                    className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
                                >
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Apply Fix
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFixPreview(null)}
                                    className="h-7 px-3 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MAIN CONTENT BODY ─── */}
            <div className="flex-1 overflow-hidden relative flex flex-col p-3 space-y-3 bg-muted/10">
                {/* 1. MONACO CODE EDITOR TAB */}
                {activeTab === 'editor' && (
                    <div className="flex-1 flex flex-col min-h-[400px] h-full w-full">
                        <MonacoCodeEditor
                            value={content}
                            language={selectedLang.monacoLanguage}
                            onChange={(val) => handleContentChange(val)}
                            height="400px"
                        />
                    </div>
                )}

                {/* 2. LIVE PREVIEW TAB */}
                {activeTab === 'preview' && (
                    <div className="flex-1 bg-card rounded-lg border border-border p-4 overflow-auto flex justify-center items-center">
                        {artifact.type === 'html' ? (
                            <iframe
                                title="HTML Live Preview"
                                srcDoc={content}
                                className="w-full h-full border-none bg-white rounded-md"
                                sandbox="allow-scripts"
                            />
                        ) : (
                            <div className="w-full h-full max-w-4xl mx-auto prose dark:prose-invert text-sm leading-relaxed p-4 overflow-y-auto">
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. TERMINAL TAB */}
                {activeTab === 'terminal' && (
                    <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden flex flex-col shadow-sm">
                        {/* Output Header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
                            <div className="flex items-center space-x-3 text-xs">
                                <div className="flex items-center space-x-1.5 font-semibold text-foreground">
                                    <Terminal className="w-4 h-4 text-emerald-500" />
                                    <span>Judge0 Execution Terminal</span>
                                </div>
                                {renderStatusBadge()}
                            </div>

                            {execResult && (
                                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1" title="Execution Time">
                                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                                        <span className="font-mono">{execResult.time}s</span>
                                    </div>
                                    {execResult.memory > 0 && (
                                        <div className="flex items-center space-x-1" title="Memory Usage">
                                            <HardDrive className="w-3.5 h-3.5 text-purple-500" />
                                            <span className="font-mono">{(execResult.memory / 1024).toFixed(1)} MB</span>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCopyOutput}
                                        className="h-6 px-1.5 text-[11px]"
                                    >
                                        {copiedOutput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Terminal Console */}
                        <div className="flex-1 p-3 bg-black/90 font-mono text-xs text-emerald-400 overflow-y-auto leading-relaxed select-text">
                            {isRunning ? (
                                <div className="flex items-center space-x-2 text-amber-400 py-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Executing program in Judge0 sandbox container...</span>
                                </div>
                            ) : execResult ? (
                                <div className="space-y-2">
                                    {execResult.stdout && (
                                        <div>
                                            <div className="text-[10px] uppercase text-emerald-500/70 font-semibold mb-1">Standard Output:</div>
                                            <pre className="whitespace-pre-wrap text-emerald-300">{execResult.stdout}</pre>
                                        </div>
                                    )}
                                    {execResult.stderr && (
                                        <div>
                                            <div className="text-[10px] uppercase text-rose-500/70 font-semibold mb-1">Standard Error:</div>
                                            <pre className="whitespace-pre-wrap text-rose-400">{execResult.stderr}</pre>
                                        </div>
                                    )}
                                    {execResult.compileOutput && (
                                        <div>
                                            <div className="text-[10px] uppercase text-amber-500/70 font-semibold mb-1">Compilation Output:</div>
                                            <pre className="whitespace-pre-wrap text-amber-300">{execResult.compileOutput}</pre>
                                        </div>
                                    )}
                                    {!execResult.stdout && !execResult.stderr && !execResult.compileOutput && (
                                        <span className="text-muted-foreground italic">Program executed successfully with zero output.</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted-foreground/60 italic">
                                    Click "▶ Run Code" above to execute this {selectedLang.name} code in the Judge0 sandbox.
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* STDIN Toggle Panel (Collapsible) */}
                <div className="rounded-lg border border-border bg-card overflow-hidden shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowStdin(!showStdin)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center space-x-2">
                            <Terminal className="w-3.5 h-3.5 text-primary" />
                            <span>Standard Input (STDIN)</span>
                            {stdin.trim() && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Provided
                                </Badge>
                            )}
                        </div>
                        {showStdin ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showStdin && (
                        <div className="p-3 border-t border-border bg-muted/20">
                            <Textarea
                                value={stdin}
                                onChange={(e) => setStdin(e.target.value)}
                                placeholder="Enter standard input values for your program (e.g. arguments, numbers, strings)..."
                                rows={2}
                                className="font-mono text-xs bg-background border-border resize-y focus-visible:ring-1 focus-visible:ring-primary"
                            />
                        </div>
                    )}
                </div>

                {/* ─── DYNAMIC AI QUICK ACTIONS FOOTER ─── */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center mr-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary mr-1 animate-pulse" />
                        AI Actions:
                    </span>

                    {execResult && !execResult.success ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => triggerAiAction('debug')}
                                className="h-7 px-2.5 text-xs border-destructive/30 bg-destructive/5 text-destructive"
                            >
                                <Bug className="w-3.5 h-3.5 mr-1" />
                                🐛 Debug
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => triggerAiAction('fix')}
                                className="h-7 px-2.5 text-xs border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                            >
                                <Wrench className="w-3.5 h-3.5 mr-1" />
                                🔧 Fix Error
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => triggerAiAction('explain')}
                                className="h-7 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
                                ✨ Explain Code
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => triggerAiAction('optimize')}
                                className="h-7 px-2.5 text-xs hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                            >
                                <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
                                ⚡ Optimize
                            </Button>
                        </>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => triggerAiAction('tests')}
                        className="h-7 px-2.5 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                        <TestTube2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                        🧪 Generate Tests
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => triggerAiAction('convert')}
                        className="h-7 px-2.5 text-xs hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400"
                    >
                        <Languages className="w-3.5 h-3.5 mr-1 text-sky-500" />
                        🌐 Convert
                    </Button>
                </div>
            </div>
        </div>
    );
}
