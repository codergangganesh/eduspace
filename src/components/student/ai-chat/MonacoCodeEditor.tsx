import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Search, AlignLeft, Sun, Moon, Loader2 } from "lucide-react";
import { getMonacoLanguage } from "@/config/judge0Languages";
import { cn } from "@/lib/utils";

interface MonacoCodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  theme?: 'vs-dark' | 'light';
  height?: string;
  readOnly?: boolean;
  className?: string;
}

// Global CDN Monaco loader helper
const loadMonacoCdn = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).monaco) {
      resolve((window as any).monaco);
      return;
    }

    if ((window as any).require && (window as any).require.config) {
      (window as any).require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
      });
      (window as any).require(['vs/editor/editor.main'], () => {
        resolve((window as any).monaco);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).require) {
        (window as any).require.config({
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
        });
        (window as any).require(['vs/editor/editor.main'], () => {
          resolve((window as any).monaco);
        });
      } else {
        reject(new Error("Monaco loader failed"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Monaco script from CDN"));
    document.body.appendChild(script);
  });
};

export function MonacoCodeEditor({
  value,
  language,
  onChange,
  theme = 'vs-dark',
  height = '450px',
  readOnly = false,
  className
}: MonacoCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'vs-dark' | 'light'>(theme);
  const [isLoading, setIsLoading] = useState<boolean>(() => typeof window !== 'undefined' && !(window as any).monaco);
  const [loadError, setLoadError] = useState(false);

  const monacoLang = getMonacoLanguage(language);

  // Initialize Monaco Editor instance
  useEffect(() => {
    let isMounted = true;
    let timerId: any = null;

    // Timeout safety: automatically switch to lightweight editor if Monaco CDN load is slow (>1.5s)
    timerId = setTimeout(() => {
      if (isMounted && isLoading) {
        setLoadError(true);
        setIsLoading(false);
      }
    }, 1500);

    loadMonacoCdn()
      .then((monaco) => {
        if (timerId) clearTimeout(timerId);
        if (!isMounted || !containerRef.current) return;

        // Destroy existing editor if any
        if (editorRef.current) {
          editorRef.current.dispose();
        }

        const editor = monaco.editor.create(containerRef.current, {
          value: value || '',
          language: monacoLang,
          theme: currentTheme,
          readOnly: readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          automaticLayout: true,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 }
        });

        editorRef.current = editor;

        // Model change listener
        editor.onDidChangeModelContent(() => {
          const val = editor.getValue();
          onChange(val);
        });

        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("Monaco CDN load fallback:", err);
        if (isMounted) {
          setLoadError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update value prop if changed externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value || '');
    }
  }, [value]);

  // Update language model
  useEffect(() => {
    if (editorRef.current && (window as any).monaco) {
      const model = editorRef.current.getModel();
      if (model) {
        (window as any).monaco.editor.setModelLanguage(model, monacoLang);
      }
    }
  }, [monacoLang]);

  // Update theme
  useEffect(() => {
    setCurrentTheme(theme);
    if ((window as any).monaco) {
      (window as any).monaco.editor.setTheme(theme);
    }
  }, [theme]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectAll = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.setSelection(model.getFullModelRange());
      }
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('keyboard', 'actions.find', null);
    }
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      editorRef.current.trigger('keyboard', 'editor.action.formatDocument', null);
    }
  };

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'vs-dark' ? 'light' : 'vs-dark';
    setCurrentTheme(nextTheme);
    if ((window as any).monaco) {
      (window as any).monaco.editor.setTheme(nextTheme);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value: text } = textarea;
      const indent = '    ';
      const newValue = text.substring(0, selectionStart) + indent + text.substring(selectionEnd);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 4;
      }, 0);
    }
  };

  return (
    <div className={cn("relative flex flex-col w-full h-full min-h-[360px] rounded-lg border border-border overflow-hidden shadow-sm bg-background", className)}>
      {/* Mini Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border text-xs text-muted-foreground select-none shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-medium text-foreground/80 uppercase text-[11px] tracking-wider px-2 py-0.5 rounded bg-muted">
            {monacoLang}
          </span>
          <span className="text-[11px] opacity-70">
            {readOnly ? 'Read Only' : 'Editable'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFind}
            className="h-7 px-1.5 sm:px-2 text-xs hover:bg-accent hover:text-accent-foreground"
            title="Search Code (Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Find</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            className="h-7 px-1.5 sm:px-2 text-xs hover:bg-accent hover:text-accent-foreground"
            title="Format Code"
          >
            <AlignLeft className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Format</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-7 px-1.5 sm:px-2 text-xs hover:bg-accent hover:text-accent-foreground"
            title="Select All Code"
          >
            <span className="text-[11px] font-mono sm:hidden">ALL</span>
            <span className="hidden sm:inline">Select All</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
            title="Toggle Monaco Theme"
          >
            {currentTheme === 'vs-dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs hover:bg-accent hover:text-accent-foreground"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="w-full flex-1 min-h-[320px] relative" style={{ height: height || '100%', minHeight: '320px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 text-muted-foreground text-xs space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />

          </div>
        )}

        {!loadError ? (
          <div ref={containerRef} className="w-full h-full" />
        ) : (
          /* Fallback Textarea Editor */
          <div className="h-full w-full flex relative overflow-hidden bg-black/90">
            <div className="py-3 pl-3 pr-2 font-mono text-xs leading-relaxed text-zinc-600 border-r border-border bg-black/40 text-right min-w-[3em] shrink-0">
              {Array.from({ length: Math.max((value || '').split('\n').length, 1) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              className="w-full h-full p-3 bg-transparent font-mono text-xs leading-relaxed text-emerald-400 resize-none focus:outline-none scrollbar-thin"
              placeholder="Write or edit code here..."
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
