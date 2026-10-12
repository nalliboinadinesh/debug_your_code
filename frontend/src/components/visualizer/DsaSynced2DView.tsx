import React from 'react';
import { ExecutionEvent } from '../../types';
import { formatDisplayValue, isGarbageValue } from '../../utils/dataStructures';

interface DsaSynced2DViewProps {
  currentEvent?: ExecutionEvent | null;
  detectedStructures?: string[];
  allEvents?: ExecutionEvent[];
}

export const DsaSynced2DView: React.FC<DsaSynced2DViewProps> = ({
  currentEvent,
  detectedStructures = [],
  allEvents = [],
}) => {
  // Extract real runtime array or fallback to any event with data
  const rawDataStructures = currentEvent?.dataStructures || {};
  
  // Filter out compiler variables (like __for_range)
  const arrays: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawDataStructures)) {
    if (!k.startsWith('_')) {
      arrays[k] = v;
    }
  }

  // Find map and pair structures
  const mapEntry = Object.entries(arrays).find(
    ([k, v]) => (v && typeof v === 'object' && v.__isMap) || k.toLowerCase().includes('freq') || k.toLowerCase().includes('map')
  );
  const pairEntry = Object.entries(arrays).find(
    ([k, v]) => k === 'it' || (v && typeof v === 'object' && v.__isPair)
  );

  let arrayEntries = Object.entries(arrays).filter(([k]) => k !== 'it' && (!mapEntry || k !== mapEntry[0]));
  if (arrayEntries.length === 0 && allEvents.length > 0) {
    for (const ev of allEvents) {
      if (ev.dataStructures && Object.keys(ev.dataStructures).length > 0) {
        const found = Object.entries(ev.dataStructures).find(
          ([k, arr]) => !k.startsWith('_') && k !== 'it' && Array.isArray(arr) && arr.length > 0
        );
        if (found) {
          arrayEntries = [found];
          break;
        }
      }
    }
  }
  const primaryArr = arrayEntries.length > 0 && Array.isArray(arrayEntries[0][1]) ? arrayEntries[0][1] : [10, 20, 30, 40, 50, 60, 70];
  const primaryName = arrayEntries.length > 0 ? arrayEntries[0][0] : 'arr';

  const vars = currentEvent?.variables || {};
  const activeIndices = currentEvent?.activeIndices || [];
  const pointers = currentEvent?.pointers || {};
  const callStack = currentEvent?.callStack || [];
  const eventType = currentEvent?.eventType || '';

  // Pointers mapping: variables that might index into primary array
  const pointerMap: Record<string, number> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === 'number' && v >= 0 && v < primaryArr.length) {
      pointerMap[k] = v;
    }
  }

  const activeIdx =
    activeIndices.length > 0
      ? activeIndices[0]
      : typeof vars.mid === 'number' && vars.mid < primaryArr.length
      ? vars.mid
      : typeof vars.i === 'number' && vars.i < primaryArr.length
      ? vars.i
      : typeof vars.left === 'number'
      ? vars.left
      : -1;

  // ─── Determine which cards are relevant ───
  const hasArray = arrayEntries.length > 0 || detectedStructures.includes('array') || detectedStructures.includes('binary_search');
  const hasSorting = detectedStructures.includes('sorting') || eventType === 'array_write';
  const hasCallStack = callStack.length > 1 || detectedStructures.includes('call_stack') || detectedStructures.includes('recursion');
  const hasPointers = Object.keys(pointers).length > 0 || detectedStructures.includes('pointer');
  const hasLoop = detectedStructures.includes('loop') || eventType === 'loop_iteration';
  const hasTwoPointers = typeof vars.left === 'number' && typeof vars.right === 'number';
  const hasBinarySearch =
    detectedStructures.includes('binary_search') ||
    (typeof vars.low === 'number' && typeof vars.high === 'number') ||
    typeof vars.mid === 'number';

  // If no execution data yet, show a helpful empty state
  const hasAnyData = currentEvent != null;

  if (!hasAnyData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#070b13] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="m8 21 4-4 4 4" />
            <path d="m7 8 3 3 3-3" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-lg font-heading mb-1">No Execution Data</h3>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          Run your C++ code to see visualizations appear here. Only cards relevant to your program's data structures will be shown.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 bg-[#070b13] font-mono text-sm select-none">
      {/* ═══ MAP / ASSOCIATIVE CARD (Level 3) ═══ */}
      {mapEntry && (
        <div className="rounded-xl border border-amber-500/30 bg-[#161208]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Map (Level 3: Associative)
              </span>
            </div>
            <span className="text-amber-300 font-bold text-xs">
              {mapEntry[0]} ({mapEntry[1]?.size ?? (mapEntry[1]?.entries?.length ?? 0)} elements)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(mapEntry[1]?.entries || []).map((entry: any, idx: number) => (
              <div
                key={idx}
                className="p-2 rounded bg-amber-950/40 border border-amber-500/30 flex items-center justify-between"
              >
                <div className="text-xs">
                  <span className="text-[10px] text-amber-400 block font-normal">Key</span>
                  <span className="font-bold text-white font-mono">{entry.key}</span>
                </div>
                <span className="text-slate-500">→</span>
                <div className="text-right text-xs">
                  <span className="text-[10px] text-emerald-400 block font-normal">Count</span>
                  <span className="font-bold text-emerald-300 font-mono">{entry.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ PAIR ITERATOR CARD (Level 1: Basic) ═══ */}
      {pairEntry && (
        <div className="rounded-xl border border-purple-500/30 bg-[#140b1e]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
              <span className="text-xs font-bold tracking-widest text-purple-400 uppercase">
                Pair (Level 1: Basic)
              </span>
            </div>
            <span className="text-purple-300 font-bold text-xs">
              {pairEntry[0]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded bg-purple-950/40 border border-purple-500/30 text-center">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                it.first (Key)
              </span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">
                {formatDisplayValue(
                  pairEntry[1]?.__isPair
                    ? pairEntry[1].first
                    : Array.isArray(pairEntry[1]) && pairEntry[1][0]
                    ? String(pairEntry[1][0]).replace('first =', '').trim()
                    : '—',
                  '—'
                )}
              </span>
            </div>
            <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/30 text-center">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                it.second (Value)
              </span>
              <span className="text-lg font-bold text-white font-mono mt-1 block">
                {formatDisplayValue(
                  pairEntry[1]?.__isPair
                    ? pairEntry[1].second
                    : Array.isArray(pairEntry[1]) && pairEntry[1][1]
                    ? String(pairEntry[1][1]).replace('second =', '').trim()
                    : '—',
                  '—'
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ARRAY CARD (Level 1: Basic) ═══ */}
      {hasArray && (
        <div className="rounded-xl border border-cyan-500/30 bg-[#09111e]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                Vector / Array
              </span>
            </div>
            <span className="text-cyan-400 font-bold text-xs">
              {primaryName}[{primaryArr.length}]
            </span>
          </div>

          {/* Array cells */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {primaryArr.map((val: any, idx: number) => {
              const isActive = idx === activeIdx || activeIndices.includes(idx);
              const isGarbage = isGarbageValue(val);
              const pointersHere = Object.entries(pointerMap)
                .filter(([, v]) => v === idx)
                .map(([k]) => k);

              return (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_#00f0ff] scale-105'
                        : isGarbage
                        ? 'bg-slate-900 text-slate-600 border border-slate-800'
                        : 'bg-[#141e2e] text-slate-200 border border-slate-700'
                    }`}
                    title={isGarbage ? 'Uninitialized garbage (suppressed)' : `[${idx}] = ${val}`}
                  >
                    {isGarbage ? '—' : formatDisplayValue(val, '—')}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">{idx}</span>
                  {pointersHere.length > 0 && (
                    <span className="text-xs text-cyan-400 font-bold -mt-0.5 animate-bounce">
                      ▲ {pointersHere.join(',')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SORTING BARS CARD ═══ */}
      {hasArray && hasSorting && (
        <div className="rounded-xl border border-amber-500/30 bg-[#111208]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Sorting Bars
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">
              Height proportional to element value
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-24 pt-2 px-1">
            {primaryArr.map((val: any, idx: number) => {
              const max = Math.max(...primaryArr.map((x: any) => Number(x) || 1), 10);
              const heightPct = Math.max((Number(val) / max) * 100, 12);
              const isActive = idx === activeIdx || activeIndices.includes(idx);
              return (
                <div
                  key={idx}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-t transition-all duration-300 flex items-start justify-center pt-0.5 text-[9px] font-bold ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_#f59e0b]'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {String(val)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TWO POINTERS CARD ═══ */}
      {hasArray && hasTwoPointers && (
        <div className="rounded-xl border border-amber-500/30 bg-[#160e06]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                Two Pointers
              </span>
            </div>
            {vars.currentSum !== undefined && (
              <span className="text-amber-400 font-bold text-xs">
                sum = {String(vars.currentSum)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {primaryArr.map((v: any, i: number) => {
              const isLeft = i === vars.left;
              const isRight = i === vars.right;
              const isPointer = isLeft || isRight;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[11px] ${
                      isPointer
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-[#141e2e] text-slate-400'
                    }`}
                  >
                    {String(v)}
                  </div>
                  {isLeft && <span className="text-[10px] text-amber-400 font-bold mt-0.5">▲L</span>}
                  {isRight && <span className="text-[10px] text-amber-400 font-bold mt-0.5">▲R</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ BINARY SEARCH CARD ═══ */}
      {hasArray && hasBinarySearch && (
        <div className="rounded-xl border border-emerald-500/30 bg-[#071510]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                Binary Search
              </span>
            </div>
            {vars.target !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                target {String(vars.target)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {primaryArr.map((v: any, i: number) => {
              const isMid = typeof vars.mid === 'number' && i === vars.mid;
              const inRange =
                typeof vars.low === 'number' && typeof vars.high === 'number'
                  ? i >= vars.low && i <= vars.high
                  : true;
              const isTarget = vars.target !== undefined && v === vars.target;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[11px] ${
                      isTarget
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_10px_#10b981]'
                        : isMid
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_#00f0ff]'
                        : inRange
                        ? 'bg-[#1e3a2e] text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#141e2e] text-slate-500 border border-slate-700'
                    }`}
                  >
                    {String(v)}
                  </div>
                  {isMid && <span className="text-[10px] text-cyan-400 font-bold mt-0.5">▲mid</span>}
                  {i === vars.low && !isMid && <span className="text-[10px] text-emerald-400 font-bold mt-0.5">▲lo</span>}
                  {i === vars.high && !isMid && <span className="text-[10px] text-emerald-400 font-bold mt-0.5">▲hi</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CALL STACK / RECURSION CARD ═══ */}
      {hasCallStack && (
        <div className="rounded-xl border border-violet-500/30 bg-[#0f0820]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-violet-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
              <span className="text-xs font-bold tracking-widest text-violet-400 uppercase">
                Call Stack ({callStack.length} Frame{callStack.length === 1 ? '' : 's'})
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {callStack.map((frame, idx) => {
              const isCurrent = idx === 0;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-xs transition ${
                    isCurrent
                      ? 'bg-violet-500/20 border border-violet-500/40 text-violet-200'
                      : 'bg-[#141e2e] border border-white/5 text-slate-300'
                  }`}
                >
                  <span className="font-bold font-mono">{frame.name}()</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">line {frame.line}</span>
                    {isCurrent && <span className="text-violet-400 text-[10px] font-bold">◀ active</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ POINTER REFERENCES CARD ═══ */}
      {hasPointers && Object.keys(pointers).length > 0 && (
        <div className="rounded-xl border border-teal-500/30 bg-[#071514]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-teal-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_#14b8a6]" />
              <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                Pointers
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {Object.entries(pointers).map(([pName, pInfo]) => (
              <div key={pName} className="p-2 rounded bg-[#141e2e] text-xs font-mono flex items-center justify-between border border-white/5">
                <span className="text-teal-400 font-bold">{pName}</span>
                <span className="text-slate-500 text-[10px]">{pInfo.address}</span>
                <span className="text-amber-400 font-bold">*{pName} = {String(pInfo.target)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ VARIABLES CARD (always shown when executing) ═══ */}
      {Object.keys(vars).length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-[#0b111f]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Variables
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-sans">
              Scope: {currentEvent?.currentScope || 'main'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(vars).map(([name, val]) => (
              <div key={name} className="p-2 rounded bg-[#141e2e] border border-white/5 text-center">
                <span className="text-cyan-400 font-bold text-[11px] block">{name}</span>
                <span className="text-white font-bold text-sm">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ LOOP PROGRESS INDICATOR ═══ */}
      {hasLoop && typeof vars.i === 'number' && (
        <div className="rounded-xl border border-cyan-500/20 bg-[#0b111f]/90 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
                Loop Progress
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">
              i = {vars.i}{primaryArr.length > 0 ? ` / ${primaryArr.length}` : ''}
            </span>
          </div>
          {primaryArr.length > 0 && (
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((vars.i as number) / primaryArr.length) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
