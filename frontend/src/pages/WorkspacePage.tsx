import React, { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '../components/editor/CodeEditor';
import { SceneRenderer } from '../components/visualizer/SceneRenderer';
import { DsaSynced2DView } from '../components/visualizer/DsaSynced2DView';
import { InspectorPanel } from '../components/inspector/InspectorPanel';
import { ExecutionTimeline } from '../components/timeline/ExecutionTimeline';
import { DycLogo } from '../components/layout/DycLogo';
import { CODE_EXAMPLES } from '../data/examples';
import { runCode, analyzeComplexity } from '../services/api';
import {
  ExecutionResponse,
  ExecutionEvent,
  ComplexityAnalysisResponse,
} from '../types';
import {
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Box,
  SplitSquareVertical,
  ChevronLeft,
  Settings,
  HelpCircle,
  Columns,
  Code2,
  Maximize2,
  PanelRight,
} from 'lucide-react';

interface WorkspacePageProps {
  onBackToLanding: () => void;
}

export type CanvasViewMode = '3d' | '2d' | 'split';
export type EditorLayoutMode = 'balanced' | 'code-focus' | 'stage-focus' | 'two-pane' | 'stacked';

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ onBackToLanding }) => {
  // Active example & code state
  const [selectedExampleId, setSelectedExampleId] = useState<string>('array-loop-unit');
  const [code, setCode] = useState<string>(CODE_EXAMPLES[0].code);
  const [stdin, setStdin] = useState<string>('');

  // Execution & Trace state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [complexityResult, setComplexityResult] = useState<ComplexityAnalysisResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<CanvasViewMode>('3d');
  
  // LeetCode-style Draggable Layout State (Default: Stacked)
  const [layoutMode, setLayoutMode] = useState<EditorLayoutMode>('stacked');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [editorWidth, setEditorWidth] = useState<number>(46); // Left editor width percentage
  const [stageHeight, setStageHeight] = useState<number>(54); // Right stage height percentage
  const [isDraggingH, setIsDraggingH] = useState<boolean>(false);
  const [isDraggingV, setIsDraggingV] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Load example preset
  const handleSelectExample = (id: string) => {
    const ex = CODE_EXAMPLES.find((e) => e.id === id);
    if (ex) {
      setSelectedExampleId(id);
      setCode(ex.code);
      setStdin(ex.stdin);
      // Reset state for new example
      setExecutionResult(null);
      setComplexityResult(null);
      setCurrentStepIndex(0);
    }
  };

  // Run Code through backend isolated GDB runner
  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runCode(code, stdin);
      setExecutionResult(res);
      setCurrentStepIndex(0);
      
      // Also automatically trigger static complexity analysis for complete sync
      handleAnalyze(res.totalSteps);
    } catch (err: any) {
      setExecutionResult({
        success: false,
        events: [],
        totalSteps: 0,
        stdout: '',
        stderr: err.message,
        runtimeError: err.message,
        detectedStructures: [],
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run Complexity Analysis
  const handleAnalyze = async (stepsCount?: number) => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeComplexity(code, stepsCount || executionResult?.totalSteps);
      setComplexityResult(res);
    } catch (err: any) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset workspace
  const handleReset = () => {
    setExecutionResult(null);
    setComplexityResult(null);
    setCurrentStepIndex(0);
  };

  // LeetCode-style horizontal splitter dragging (moving editor left & right)
  const handleMouseDownH = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingH(true);

    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - containerRect.left;
      let newPercent = (deltaX / containerRect.width) * 100;
      if (newPercent < 18) newPercent = 18;
      if (newPercent > 82) newPercent = 82;
      setEditorWidth(Math.round(newPercent * 10) / 10);
    };

    const onMouseUp = () => {
      setIsDraggingH(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // LeetCode-style vertical splitter dragging (moving stage & inspector up & down)
  const handleMouseDownV = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingV(true);

    const rightPane = rightPaneRef.current;
    if (!rightPane) return;
    const paneRect = rightPane.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - paneRect.top;
      let newPercent = (deltaY / paneRect.height) * 100;
      if (newPercent < 18) newPercent = 18;
      if (newPercent > 82) newPercent = 82;
      setStageHeight(Math.round(newPercent * 10) / 10);
    };

    const onMouseUp = () => {
      setIsDraggingV(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Active event derived from trace
  const events = executionResult?.events || [];
  const currentEvent: ExecutionEvent | null =
    events.length > 0 && currentStepIndex < events.length
      ? events[currentStepIndex]
      : null;

  const previousEvent: ExecutionEvent | null =
    events.length > 0 && currentStepIndex > 0
      ? events[currentStepIndex - 1]
      : null;

  const nextEvent: ExecutionEvent | null =
    events.length > 0 && currentStepIndex < events.length - 1
      ? events[currentStepIndex + 1]
      : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TOP BAR */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0a0f1d] border-b border-white/5 z-30 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition"
            title="Back to Landing Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <DycLogo size="sm" showWordmark />
        </div>

        {/* View Mode Toggle */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-[#0e1628] border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition ${
              viewMode === '3d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Stage</span>
          </button>

          <button
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition ${
              viewMode === '2d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>DSA 2D Cards</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Dual Synced</span>
          </button>
        </div>

        {/* Layout Mode Selector */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-[#0e1628] border border-white/10 text-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1">Layout</span>
          <button
            onClick={() => {
              setLayoutMode('stacked');
              setEditorWidth(46);
              setStageHeight(54);
              setIsInspectorOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition ${
              layoutMode === 'stacked' && isInspectorOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Stacked layout (Default: Code left, Stage & Inspector right)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Stacked</span>
          </button>

          <button
            onClick={() => {
              setLayoutMode('stacked');
              setEditorWidth(62);
              setStageHeight(54);
              setIsInspectorOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition ${
              editorWidth >= 58 && layoutMode === 'stacked' && isInspectorOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Wide Editor (62% code workspace)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Focus</span>
          </button>

          <button
            onClick={() => {
              setLayoutMode('stacked');
              setEditorWidth(30);
              setStageHeight(65);
              setIsInspectorOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition ${
              editorWidth <= 35 && layoutMode === 'stacked' && isInspectorOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Wide Stage (70% visualizer stage)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Stage Focus</span>
          </button>

          <button
            onClick={() => {
              setLayoutMode('two-pane');
              setEditorWidth(50);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition ${
              layoutMode === 'two-pane'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Two-Pane (50/50 Editor & Visualizer)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Two-Pane</span>
          </button>

          <button
            onClick={() => {
              setLayoutMode('balanced');
              setEditorWidth(46);
              setStageHeight(54);
              setIsInspectorOpen(true);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition ${
              layoutMode === 'balanced' && isInspectorOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Reset to Balanced Split"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Reset Split</span>
          </button>
        </div>

        {/* Language & Workspace Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle Inspector Button */}
          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              isInspectorOpen && layoutMode !== 'two-pane'
                ? 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm'
            }`}
            title={isInspectorOpen && layoutMode !== 'two-pane' ? 'Collapse Inspector' : 'Show Inspector'}
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px] font-medium">
              {isInspectorOpen && layoutMode !== 'two-pane' ? 'Hide Inspector' : 'Show Inspector'}
            </span>
          </button>

          <div className="px-2.5 py-1 rounded bg-[#131d33] border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>C++ 17</span>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition"
            title="Reset Workspace"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY WITH LEETCODE-STYLE DRAGGABLE SPLITTERS */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col lg:flex-row overflow-hidden relative select-none"
      >
        {/* Monaco Code Editor (Draggable Left/Right Width like LeetCode) */}
        <div
          style={{ width: `${editorWidth}%` }}
          className="w-full lg:h-full flex-shrink-0 flex flex-col overflow-hidden"
        >
          <CodeEditor
            code={code}
            onChange={setCode}
            stdin={stdin}
            onStdinChange={setStdin}
            onRun={handleRun}
            onAnalyze={() => handleAnalyze()}
            isRunning={isRunning}
            isAnalyzing={isAnalyzing}
            currentLine={currentEvent?.line}
            compilationError={executionResult?.compilationError}
            runtimeError={executionResult?.runtimeError}
            selectedExampleId={selectedExampleId}
            onSelectExample={handleSelectExample}
          />
        </div>

        {/* LeetCode-style Draggable Vertical Splitter (Move Editor Left & Right) */}
        <div
          onMouseDown={handleMouseDownH}
          onDoubleClick={() => setEditorWidth(46)}
          className={`hidden lg:flex items-center justify-center w-2 cursor-col-resize select-none relative z-20 group transition-colors ${
            isDraggingH
              ? 'bg-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'bg-[#0a0f1d] hover:bg-cyan-500/30 border-x border-white/5'
          }`}
          title="Drag to resize editor (Double-click to reset)"
        >
          {/* Central pill grab handle */}
          <div
            className={`w-1 h-8 rounded-full transition-colors ${
              isDraggingH ? 'bg-cyan-300' : 'bg-slate-600 group-hover:bg-cyan-400'
            }`}
          />
          {/* Dragging percentage indicator */}
          {isDraggingH && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-500/50 text-[10px] text-cyan-200 font-mono pointer-events-none whitespace-nowrap shadow-xl z-30">
              {editorWidth}% | {Math.round(100 - editorWidth)}%
            </div>
          )}
        </div>

        {/* Right Workspace Area: Stacked Stage (Top) & Inspector (Bottom) */}
        {layoutMode === 'two-pane' || !isInspectorOpen ? (
          /* Two-Pane Mode: Stage takes full remaining width */
          <div
            style={{ width: `${100 - editorWidth}%` }}
            className="w-full lg:h-full flex-1 flex flex-col bg-[#070b13] relative overflow-hidden"
          >
            {viewMode === '3d' && (
              <SceneRenderer
                currentEvent={currentEvent}
                detectedStructures={executionResult?.detectedStructures}
                totalSteps={events.length}
                allEvents={events}
                visualizationPlan={executionResult?.visualizationPlan}
              />
            )}
            {viewMode === '2d' && (
              <DsaSynced2DView
                currentEvent={currentEvent}
                detectedStructures={executionResult?.detectedStructures}
                allEvents={events}
              />
            )}
            {viewMode === 'split' && (
              <div className="flex flex-col h-full w-full">
                <div className="h-1/2 w-full border-b border-white/10">
                  <SceneRenderer
                    currentEvent={currentEvent}
                    detectedStructures={executionResult?.detectedStructures}
                    totalSteps={events.length}
                    allEvents={events}
                    visualizationPlan={executionResult?.visualizationPlan}
                  />
                </div>
                <div className="h-1/2 w-full overflow-y-auto">
                  <DsaSynced2DView
                    currentEvent={currentEvent}
                    detectedStructures={executionResult?.detectedStructures}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Stacked Layout (Default): Stage on top, Inspector on bottom, with vertical draggable splitter */
          <div
            ref={rightPaneRef}
            style={{ width: `${100 - editorWidth}%` }}
            className="w-full lg:h-full flex-1 flex flex-col overflow-hidden"
          >
            {/* Top Stage */}
            <div
              style={{ height: `${stageHeight}%` }}
              className="w-full flex-shrink-0 relative overflow-hidden bg-[#070b13]"
            >
              {viewMode === '3d' && (
                <SceneRenderer
                  currentEvent={currentEvent}
                  detectedStructures={executionResult?.detectedStructures}
                  totalSteps={events.length}
                  allEvents={events}
                  visualizationPlan={executionResult?.visualizationPlan}
                />
              )}
              {viewMode === '2d' && (
                <DsaSynced2DView
                  currentEvent={currentEvent}
                  detectedStructures={executionResult?.detectedStructures}
                  allEvents={events}
                />
              )}
              {viewMode === 'split' && (
                <div className="flex flex-col h-full w-full">
                  <div className="h-1/2 w-full border-b border-white/10">
                    <SceneRenderer
                      currentEvent={currentEvent}
                      detectedStructures={executionResult?.detectedStructures}
                      totalSteps={events.length}
                      allEvents={events}
                      visualizationPlan={executionResult?.visualizationPlan}
                    />
                  </div>
                  <div className="h-1/2 w-full overflow-y-auto">
                    <DsaSynced2DView
                      currentEvent={currentEvent}
                      detectedStructures={executionResult?.detectedStructures}
                      allEvents={events}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Draggable Horizontal Splitter (Move Stage & Inspector Up & Down) */}
            <div
              onMouseDown={handleMouseDownV}
              onDoubleClick={() => setStageHeight(54)}
              className={`hidden lg:flex items-center justify-center h-2 cursor-row-resize select-none relative z-20 group transition-colors ${
                isDraggingV
                  ? 'bg-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'bg-[#0a0f1d] hover:bg-cyan-500/30 border-y border-white/5'
              }`}
              title="Drag to resize stage and inspector (Double-click to reset)"
            >
              <div
                className={`h-1 w-8 rounded-full transition-colors ${
                  isDraggingV ? 'bg-cyan-300' : 'bg-slate-600 group-hover:bg-cyan-400'
                }`}
              />
              {isDraggingV && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-cyan-950/95 border border-cyan-500/50 text-[10px] text-cyan-200 font-mono pointer-events-none whitespace-nowrap shadow-xl z-30">
                  Stage {stageHeight}% | Inspector {Math.round(100 - stageHeight)}%
                </div>
              )}
            </div>

            {/* Bottom Inspector */}
            <div
              style={{ height: `${100 - stageHeight}%` }}
              className="w-full flex-1 flex flex-col overflow-hidden"
            >
              <InspectorPanel
                code={code}
                currentEvent={currentEvent}
                previousEvent={previousEvent}
                nextEvent={nextEvent}
                totalSteps={events.length}
                complexity={complexityResult}
              />
            </div>
          </div>
        )}

        {/* Global drag shield to prevent event capture during dragging */}
        {(isDraggingH || isDraggingV) && (
          <div
            className={`fixed inset-0 z-50 select-none ${
              isDraggingH ? 'cursor-col-resize' : 'cursor-row-resize'
            }`}
          />
        )}
      </div>

      {/* 3. BOTTOM PANEL: EXECUTION TIMELINE */}
      <ExecutionTimeline
        currentStepIndex={currentStepIndex}
        totalSteps={events.length}
        onStepChange={setCurrentStepIndex}
        currentEvent={currentEvent}
        stdout={executionResult?.stdout || ''}
      />
    </div>
  );
};
