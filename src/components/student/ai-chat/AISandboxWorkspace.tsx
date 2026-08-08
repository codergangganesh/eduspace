import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Loader2,
  Sparkles,
  Bug,
  Zap,
  TestTube2,
  FileCode2,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Terminal,
  Clock,
  HardDrive,
  Copy,
  Languages,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Wrench
} from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  LanguageConfig,
  getLanguageConfig
} from "@/config/judge0Languages";
import { MonacoCodeEditor } from "./MonacoCodeEditor";
import { codeExecutionService, CodeExecutionResult } from "@/services/codeExecutionService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export interface AISandboxWorkspaceProps {
  initialCode?: string;
  initialLanguage?: string;
  onClose?: () => void;
  onQuickAiAction?: (prompt: string, context?: any) => void;
  suggestedFix?: string | null;
  onClearSuggestedFix?: () => void;
  className?: string;
}

export function AISandboxWorkspace({
  initialCode = "",
  initialLanguage = "python",
  onClose,
  onQuickAiAction,
  suggestedFix = null,
  onClearSuggestedFix,
  className
}: AISandboxWorkspaceProps) {
  // Config & State
  const [selectedLang, setSelectedLang] = useState<LanguageConfig>(() =>
    getLanguageConfig(initialLanguage)
  );
  const [code, setCode] = useState<string>(
    initialCode || selectedLang.starterCode
  );
  const [originalAICode, setOriginalAICode] = useState<string>(initialCode || selectedLang.starterCode);
  const [stdin, setStdin] = useState<string>("");
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<CodeExecutionResult | null>(null);
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false);

  // Fix preview state
  const [fixCodePreview, setFixCodePreview] = useState<string | null>(suggestedFix);

  useEffect(() => {
    if (initialLanguage) {
      const config = getLanguageConfig(initialLanguage);
      setSelectedLang(config);
    }
  }, [initialLanguage]);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setOriginalAICode(initialCode);
    }
  }, [initialCode]);

  useEffect(() => {
    if (suggestedFix) {
      setFixCodePreview(suggestedFix);
    }
  }, [suggestedFix]);

  // Handle Language Change
  const handleLanguageChange = (newLangId: string) => {
    const newConfig = getLanguageConfig(newLangId);
    setSelectedLang(newConfig);

    // If current code is empty or untouched starter code, replace with new starter code
    if (!code || code === selectedLang.starterCode) {
      setCode(newConfig.starterCode);
    }
  };

  // Run Code Execution Flow
  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter code before running.");
      return;
    }

    setIsRunning(true);
    setExecResult(null);

    const startTime = performance.now();

    try {
      const result = await codeExecutionService.executeCode({
        language: selectedLang.id,
        code: code,
        stdin: stdin,
      });

      const endTime = performance.now();

      // If backend returned no duration metrics, compute client elapsed fallback
      if (!result.time || result.time === '0.00') {
        result.time = ((endTime - startTime) / 1000).toFixed(2);
      }

      setExecResult(result);

      if (result.success) {
        toast.success(`Executed successfully (${result.status})`);
      } else {
        toast.error(`Execution finished with status: ${result.status}`);
      }
    } catch (err: any) {
      toast.error("Failed to run code execution sandbox.");
      setExecResult({
        success: false,
        status: 'System Error',
        stdout: '',
        stderr: err?.message || 'Execution request failed.',
        compileOutput: '',
        time: '0.00',
        memory: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyFix = () => {
    if (fixCodePreview) {
      setCode(fixCodePreview);
      setFixCodePreview(null);
      if (onClearSuggestedFix) onClearSuggestedFix();
      toast.success("Applied AI suggested fix to code editor!");
    }
  };

  const handleCancelFix = () => {
    setFixCodePreview(null);
    if (onClearSuggestedFix) onClearSuggestedFix();
  };

  const handleResetCode = () => {
    setCode(originalAICode || selectedLang.starterCode);
    toast.info("Reset code to initial state.");
  };

  const handleCopyOutput = () => {
    const textToCopy = execResult?.stdout || execResult?.stderr || execResult?.compileOutput || "";
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Trigger AI Actions with context
  const triggerAiAction = (actionType: string) => {
    if (!onQuickAiAction) return;

    let prompt = "";
    const context = {
      code,
      language: selectedLang.name,
      stdin,
      status: execResult?.status || 'Idle',
      stdout: execResult?.stdout || '',
      stderr: execResult?.stderr || '',
      compileOutput: execResult?.compileOutput || ''
    };

    switch (actionType) {
      case 'explain':
        prompt = `Please explain this ${selectedLang.name} code line by line:\n\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      case 'debug':
        prompt = `Please debug this ${selectedLang.name} code. Here is the execution outcome:\nStatus: ${execResult?.status}\nError Output:\n${execResult?.stderr || execResult?.compileOutput}\n\nCode:\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      case 'fix':
        prompt = `Please fix the errors in this ${selectedLang.name} code and provide the full corrected code snippet:\nStatus: ${execResult?.status}\nError:\n${execResult?.stderr || execResult?.compileOutput}\n\nCode:\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      case 'optimize':
        prompt = `Analyze and optimize this ${selectedLang.name} code for time complexity, space complexity, and clean coding best practices:\n\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      case 'tests':
        prompt = `Generate comprehensive unit test cases and sample standard inputs (STDIN) for this ${selectedLang.name} program:\n\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      case 'convert':
        prompt = `Please convert this ${selectedLang.name} code into idiomatic Python/C++/JavaScript while preserving exact logic:\n\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
        break;
      default:
        prompt = `Analyze this code:\n\`\`\`${selectedLang.monacoLanguage}\n${code}\n\`\`\``;
    }

    onQuickAiAction(prompt, context);
  };

  // Status Badge styling helper
  const renderStatusBadge = () => {
    if (isRunning) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1.5 animate-pulse px-2.5 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Running...
        </Badge>
      );
    }

    if (!execResult) {
      return (
        <Badge variant="outline" className="text-muted-foreground border-border px-2.5 py-1">
          Ready
        </Badge>
      );
    }

    if (execResult.success) {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 flex items-center gap-1 px-2.5 py-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {execResult.status}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 flex items-center gap-1 px-2.5 py-1">
        <XCircle className="w-3.5 h-3.5" />
        {execResult.status}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background text-foreground rounded-xl border border-border overflow-hidden shadow-2xl transition-all duration-200",
        isFullScreen ? "fixed inset-0 z-50 rounded-none border-none" : "w-full min-h-[680px]",
        className
      )}
    >
      {/* ─── WORKSPACE HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border">
        {/* Left: Language Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FileCode2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm hidden sm:inline-block">Language:</span>
          </div>

          <div className="relative">
            <select
              value={selectedLang.id}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isRunning}
              className="h-9 px-3 pr-8 rounded-md bg-muted/60 border border-input text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 pointer-events-none text-muted-foreground" />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetCode}
            disabled={isRunning}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Reset code to original state"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>

        {/* Right: Run Button & Window Controls */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            onClick={handleRunCode}
            disabled={isRunning}
            size="sm"
            className="h-9 px-4 font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                ▶ Run Code
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              title="Close Workspace"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── AI FIX PREVIEW MODAL / BANNER ─── */}
      <AnimatePresence>
        {fixCodePreview && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex flex-col space-y-2"
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
                  onClick={handleCancelFix}
                  className="h-7 px-3 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto rounded bg-background/80 p-2 font-mono text-xs border border-amber-500/20 text-muted-foreground">
              <pre className="whitespace-pre-wrap">{fixCodePreview}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT: EDITOR + STDIN + OUTPUT ─── */}
      <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto bg-muted/10">
        {/* Editor Container */}
        <div className="flex-1 min-h-[350px]">
          <MonacoCodeEditor
            value={code}
            language={selectedLang.monacoLanguage}
            onChange={(val) => setCode(val)}
            height={isFullScreen ? "calc(100vh - 360px)" : "360px"}
          />
        </div>

        {/* STDIN Toggle Panel */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
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
                rows={3}
                className="font-mono text-xs bg-background border-border resize-y focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
        </div>

        {/* ─── TERMINAL OUTPUT PANEL ─── */}
        <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col shadow-sm">
          {/* Output Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 font-semibold text-foreground">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>Execution Output</span>
              </div>
              {renderStatusBadge()}
            </div>

            {/* Execution Metrics (Time & Memory) */}
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
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copiedOutput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>

          {/* Terminal Body */}
          <div className="p-3 bg-black/90 font-mono text-xs text-emerald-400 min-h-[120px] max-h-[220px] overflow-y-auto leading-relaxed select-text">
            {isRunning ? (
              <div className="flex items-center space-x-2 text-amber-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing program inside Judge0 sandbox container...</span>
              </div>
            ) : execResult ? (
              <div className="space-y-2">
                {/* Standard Output */}
                {execResult.stdout && (
                  <div>
                    <div className="text-[10px] uppercase text-emerald-500/70 font-semibold mb-1">Standard Output:</div>
                    <pre className="whitespace-pre-wrap text-emerald-300">{execResult.stdout}</pre>
                  </div>
                )}

                {/* Standard Error */}
                {execResult.stderr && (
                  <div>
                    <div className="text-[10px] uppercase text-rose-500/70 font-semibold mb-1">Standard Error:</div>
                    <pre className="whitespace-pre-wrap text-rose-400">{execResult.stderr}</pre>
                  </div>
                )}

                {/* Compilation Output */}
                {execResult.compileOutput && (
                  <div>
                    <div className="text-[10px] uppercase text-amber-500/70 font-semibold mb-1">Compilation Output:</div>
                    <pre className="whitespace-pre-wrap text-amber-300">{execResult.compileOutput}</pre>
                  </div>
                )}

                {!execResult.stdout && !execResult.stderr && !execResult.compileOutput && (
                  <span className="text-muted-foreground italic">Program executed successfully with zero terminal output.</span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground/60 italic">
                Click "▶ Run Code" above to execute this {selectedLang.name} program securely in the Judge0 sandbox.
              </span>
            )}
          </div>
        </div>

        {/* ─── DYNAMIC AI QUICK ACTIONS BAR ─── */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground flex items-center mr-1">
            <Sparkles className="w-3.5 h-3.5 text-primary mr-1 animate-pulse" />
            AI Actions:
          </span>

          {/* Context Aware Action Buttons */}
          {execResult && !execResult.success ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerAiAction('debug')}
                className="h-8 px-3 text-xs border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
              >
                <Bug className="w-3.5 h-3.5 mr-1.5" />
                🐛 Debug Error
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerAiAction('fix')}
                className="h-8 px-3 text-xs border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Wrench className="w-3.5 h-3.5 mr-1.5" />
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
                className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                ✨ Explain Code
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => triggerAiAction('optimize')}
                className="h-8 px-3 text-xs hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/40"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                ⚡ Optimize
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => triggerAiAction('tests')}
            className="h-8 px-3 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40"
          >
            <TestTube2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            🧪 Generate Tests
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => triggerAiAction('convert')}
            className="h-8 px-3 text-xs hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/40"
          >
            <Languages className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
            🌐 Convert Language
          </Button>
        </div>
      </div>
    </div>
  );
}
