import React, { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Play, Activity, Terminal, AlertTriangle, XCircle, Code2, Sparkles } from 'lucide-react';
import { CODE_EXAMPLES } from '../../data/examples';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  stdin: string;
  onStdinChange: (value: string) => void;
  onRun: () => void;
  onAnalyze: () => void;
  isRunning: boolean;
  isAnalyzing: boolean;
  currentLine?: number | null;
  compilationError?: string | null;
  runtimeError?: string | null;
  selectedExampleId: string;
  onSelectExample: (id: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  stdin,
  onStdinChange,
  onRun,
  onAnalyze,
  isRunning,
  isAnalyzing,
  currentLine,
  compilationError,
  runtimeError,
  selectedExampleId,
  onSelectExample,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<any[]>([]);
  const [showStdin, setShowStdin] = React.useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('dyc-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00f0ff', fontStyle: 'bold' },
        { token: 'type', foreground: '38bdf8' },
        { token: 'string', foreground: '10b981' },
        { token: 'number', foreground: 'f59e0b' },
      ],
      colors: {
        'editor.background': '#0a0f1d',
        'editor.lineHighlightBackground': '#141d33',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#00f0ff',
      },
    });
    monaco.editor.setTheme('dyc-dark');
  };

  // Highlight active execution line
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (currentLine && currentLine > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-cyan-500/25 border-l-4 border-cyan-400',
            glyphMarginClassName: 'text-cyan-400',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(currentLine);
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentLine]);

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border-r border-white/5 select-none overflow-hidden">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d1426] border-b border-white/5 gap-2">
        {/* Preset Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Code2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <select
            value={selectedExampleId}
            onChange={(e) => onSelectExample(e.target.value)}
            className="bg-[#131c33] text-xs text-slate-200 border border-slate-700/60 rounded px-2 py-1 outline-none focus:border-cyan-400 max-w-[200px] truncate"
          >
            {CODE_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2.5 py-1 text-xs rounded border transition flex items-center gap-1 ${
              showStdin
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle standard input (stdin)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Input</span>
          </button>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-2.5 py-1 text-xs rounded border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-medium transition flex items-center gap-1"
            title="Run static TC/SC analysis"
          >
            <Activity className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Analyze</span>
          </button>

          <button
            onClick={onRun}
            disabled={isRunning}
            className="px-3 py-1 text-xs rounded font-bold transition flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
            title="Compile & trace C++ execution"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-pulse' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Optional Stdin Editor Drawer */}
      {showStdin && (
        <div className="p-2.5 bg-[#090e1c] border-b border-white/10 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Standard Input (stdin)</span>
            <span className="text-[10px] text-slate-500">Passed to program via redirected stream</span>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Enter input values here..."
            className="w-full h-16 p-2 rounded bg-[#0f172a] border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>
      )}

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language="cpp"
          theme="dyc-dark"
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            tabSize: 4,
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Error Banners */}
      {compilationError && (
        <div className="p-3 bg-red-950/80 border-t border-red-500/40 text-red-200 text-xs font-mono max-h-36 overflow-y-auto">
          <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1 font-sans">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>Compilation Error</span>
          </div>
          <pre className="whitespace-pre-wrap">{compilationError}</pre>
        </div>
      )}

      {runtimeError && (
        <div className="p-3 bg-amber-950/80 border-t border-amber-500/40 text-amber-200 text-xs font-mono max-h-36 overflow-y-auto">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1 font-sans">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Runtime Error</span>
          </div>
          <pre className="whitespace-pre-wrap">{runtimeError}</pre>
        </div>
      )}
    </div>
  );
};
