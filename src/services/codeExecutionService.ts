// ─── Wandbox Code Execution Service ──────────────────────────────────────────
// Uses https://wandbox.org — FREE, unlimited, no API key, no signup needed.
// Compiler names verified from: https://wandbox.org/api/list.json

export interface CodeExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  time: string;
  memory: number;
  error?: string;
}

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// ─── Wandbox compiler map (verified from live /api/list.json) ─────────────────
const WANDBOX_COMPILER_MAP: Record<string, { compiler: string; options?: string }> = {
  python:     { compiler: 'cpython-3.12.2' },
  javascript: { compiler: 'nodejs-20.3.1' },
  java:       { compiler: 'openjdk-jdk-23+37' },
  c:          { compiler: 'gcc-13.2.0-c' },
  cpp:        { compiler: 'gcc-13.2.0',   options: 'c++17,warning' },
  go:         { compiler: 'go-1.22.1' },
  rust:       { compiler: 'rust-1.76.0' },
  ruby:       { compiler: 'ruby-3.3.0' },
  php:        { compiler: 'php-8.3.2' },
  swift:      { compiler: 'swift-5.9.2' },
  csharp:     { compiler: 'mono-6.12.0.182' },
  perl:       { compiler: 'perl-5.38.2' },
  lua:        { compiler: 'lua-5.4.6' },
  haskell:    { compiler: 'ghc-9.8.1' },
  elixir:     { compiler: 'elixir-1.16.1' },
  bash:       { compiler: 'bash' },
};

// ─── Alias normalization ───────────────────────────────────────────────────────
const LANG_ALIASES: Record<string, string> = {
  py: 'python', python3: 'python',
  js: 'javascript', node: 'javascript', nodejs: 'javascript',
  ts: 'typescript',
  'c++': 'cpp', 'c/c++': 'cpp',
  'c#': 'csharp', cs: 'csharp', dotnet: 'csharp',
  kt: 'kotlin', kotlin: 'kotlin',
  rb: 'ruby',
  rs: 'rust',
  golang: 'go',
  sh: 'bash', shell: 'bash', zsh: 'bash',
  pl: 'perl',
  hs: 'haskell',
};

export function normalizeLang(raw: string): string {
  const clean = (raw || '').toLowerCase().trim();
  return LANG_ALIASES[clean] || clean;
}

export function isPistonRunnable(raw: string): boolean {
  const key = normalizeLang(raw);
  return key in WANDBOX_COMPILER_MAP;
}

// Dynamically fetch real compiler names and pick best match per language
async function fetchBestCompiler(langKey: string): Promise<{ compiler: string; options?: string } | null> {
  const fallback = WANDBOX_COMPILER_MAP[langKey];
  try {
    const res = await fetch('https://wandbox.org/api/list.json');
    if (!res.ok) return fallback;
    const list: Array<{ name: string; language: string; version: string }> = await res.json();

    // Language display name patterns for each key
    const langPatterns: Record<string, string> = {
      python: 'Python',
      javascript: 'JavaScript',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      go: 'Go',
      rust: 'Rust',
      ruby: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      csharp: 'C#',
      perl: 'Perl',
      lua: 'Lua',
      haskell: 'Haskell',
      elixir: 'Elixir',
      bash: 'Bash',
    };

    const targetLang = langPatterns[langKey];
    if (!targetLang) return fallback;

    // Filter compilers matching the language, exclude HEAD/experimental, pick newest
    const candidates = list.filter(c =>
      c.language === targetLang &&
      !c.name.includes('head') &&
      !c.name.includes('HEAD')
    );

    if (candidates.length === 0) return fallback;

    // Sort by version descending and pick first
    candidates.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    const best = candidates[0];
    const opts = langKey === 'cpp' ? 'c++17,warning' : undefined;
    return { compiler: best.name, options: opts };
  } catch {
    return fallback;
  }
}

// Cache resolved compiler names to avoid fetching list.json on every run
const compilerCache: Record<string, { compiler: string; options?: string }> = {};

export const codeExecutionService = {
  async executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResult> {
    const langKey = normalizeLang(request.language);
    const staticConfig = WANDBOX_COMPILER_MAP[langKey];

    if (!staticConfig) {
      return {
        success: false,
        status: 'Unsupported Language',
        stdout: '',
        stderr: `Language "${request.language}" is not supported for execution.`,
        compileOutput: '',
        time: '0.00',
        memory: 0,
        error: 'unsupported_language',
      };
    }

    const startTime = performance.now();

    // Use cached or static compiler config
    const config = compilerCache[langKey] || staticConfig;

    // Build request body
    const body: Record<string, string> = {
      code: request.code,
      compiler: config.compiler,
    };
    if (config.options) body.options = config.options;
    if (request.stdin) body.stdin = request.stdin;

    try {
      let response = await fetch(WANDBOX_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);

      // If 500 "Unknown compiler" — fetch live list and retry once with best match
      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 500 && errText.includes('Unknown compiler')) {
          const resolved = await fetchBestCompiler(langKey);
          if (resolved && resolved.compiler !== config.compiler) {
            compilerCache[langKey] = resolved;
            const retryBody: Record<string, string> = {
              code: request.code,
              compiler: resolved.compiler,
            };
            if (resolved.options) retryBody.options = resolved.options;
            if (request.stdin) retryBody.stdin = request.stdin;

            response = await fetch(WANDBOX_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(retryBody),
            });

            if (!response.ok) {
              const err2 = await response.text();
              return buildError(response.status, err2, elapsed);
            }
          } else {
            return buildError(response.status, errText, elapsed);
          }
        } else {
          return buildError(response.status, errText, elapsed);
        }
      }

      const data = await response.json();
      const finalElapsed = ((performance.now() - startTime) / 1000).toFixed(3);
      return parseWandboxResponse(data, finalElapsed);

    } catch (err: any) {
      return {
        success: false,
        status: 'Network Error',
        stdout: '',
        stderr: err?.message || 'Could not reach Wandbox. Check your internet connection.',
        compileOutput: '',
        time: '0.00',
        memory: 0,
        error: err?.message,
      };
    }
  },
};

function buildError(status: number, body: string, elapsed: string): CodeExecutionResult {
  return {
    success: false,
    status: `API Error (${status})`,
    stdout: '',
    stderr: `Wandbox returned ${status}: ${body}`,
    compileOutput: '',
    time: elapsed,
    memory: 0,
    error: body,
  };
}

function parseWandboxResponse(data: any, elapsed: string): CodeExecutionResult {
  // Wandbox response:
  // status: exit code string ("0" = success)
  // program_output: stdout
  // program_error: stderr
  // compiler_error: compile-time error
  // compiler_output: compiler info
  const exitCode = parseInt(data.status ?? '0', 10);
  const stdout = data.program_output || '';
  const stderr = data.program_error || '';
  const compileOutput = data.compiler_error || '';

  const success = exitCode === 0 && !compileOutput;

  let statusLabel = 'Accepted';
  if (compileOutput) {
    statusLabel = 'Compilation Error';
  } else if (exitCode !== 0) {
    statusLabel = 'Runtime Error';
  }

  return {
    success,
    status: statusLabel,
    stdout,
    stderr,
    compileOutput,
    time: elapsed,
    memory: 0,
  };
}
