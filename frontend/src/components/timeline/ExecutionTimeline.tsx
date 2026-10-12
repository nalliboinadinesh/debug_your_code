import React, { useState, useEffect } from 'react';
import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
  Terminal,
  Clock,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { ExecutionEvent } from '../../types';

interface ExecutionTimelineProps {
  currentStepIndex: number;
  totalSteps: number;
  onStepChange: (index: number | ((prev: number) => number)) => void;
  currentEvent?: ExecutionEvent | null;
  stdout: string;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  currentStepIndex,
  totalSteps,
  onStepChange,
  currentEvent,
  stdout,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showConsole, setShowConsole] = useState(false);

  // Playback timer loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && totalSteps > 0) {
      const intervalMs = Math.max(800 / playbackSpeed, 100);
      timer = setInterval(() => {
        onStepChange((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, totalSteps, onStepChange]);

  const handleFirst = () => onStepChange(0);
  const handlePrev = () => onStepChange(Math.max(currentStepIndex - 1, 0));
  const handleNext = () => onStepChange(Math.min(currentStepIndex + 1, totalSteps - 1));
  const handleLast = () => onStepChange(Math.max(totalSteps - 1, 0));

  const hasSteps = totalSteps > 0;
  const currentStepNum = hasSteps ? currentStepIndex + 1 : 0;

  return (
    <div className="flex flex-col bg-[#0b1020] border-t border-white/5 select-none z-20">
      {/* Console Drawer if open */}
      {showConsole && (
        <div className="p-3 bg-[#070b16] border-b border-white/10 text-xs font-mono max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between text-slate-400 mb-1 pb-1 border-b border-white/5 font-sans">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Program Terminal Output (stdout)</span>
            </span>
            <span className="text-[10px] text-slate-500">Live output stream</span>
          </div>
          <pre className="text-emerald-400 whitespace-pre-wrap">
            {stdout || '(No output produced)'}
          </pre>
        </div>
      )}

      {/* Main Bar Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 gap-3">
        {/* Left: Step Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFirst}
            disabled={!hasSteps || currentStepIndex === 0}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
            title="First Step (Home)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePrev}
            disabled={!hasSteps || currentStepIndex === 0}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
            title="Previous Step (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!hasSteps}
            className="px-3 py-1.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)] disabled:opacity-40"
            title="Play / Pause Execution"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs">Play</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={!hasSteps || currentStepIndex >= totalSteps - 1}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
            title="Next Step (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleLast}
            disabled={!hasSteps || currentStepIndex >= totalSteps - 1}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 hover:text-white transition"
            title="Last Step (End)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition ${
                  playbackSpeed === spd
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Timeline Scrubber & Counter */}
        <div className="flex items-center gap-3 flex-1 max-w-md min-w-[200px]">
          <span className="text-xs font-mono font-bold text-slate-300 whitespace-nowrap">
            {`Step ${currentStepNum} / ${totalSteps}`}
          </span>

          <input
            type="range"
            min={0}
            max={Math.max(totalSteps - 1, 0)}
            value={currentStepIndex}
            onChange={(e) => onStepChange(Number(e.target.value))}
            disabled={!hasSteps}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
          />
        </div>

        {/* Right: Active Event Badge & Console Toggle */}
        <div className="flex items-center gap-2">
          {currentEvent && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-[11px] text-slate-300 max-w-[280px] truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse" />
              <span className="font-mono text-cyan-300 font-semibold flex-shrink-0">
                L{currentEvent.line}
              </span>
              <span className="truncate">{currentEvent.description}</span>
            </div>
          )}

          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition ${
              showConsole
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-white/5'
            }`}
            title="Toggle Program Output Stream"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
