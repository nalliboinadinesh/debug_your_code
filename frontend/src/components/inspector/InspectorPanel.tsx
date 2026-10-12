import React, { useState } from 'react';
import { VariablesTab } from './VariablesTab';
import { ComplexityTab } from './ComplexityTab';
import { AiTutorTab } from './AiTutorTab';
import { ExecutionEvent, ComplexityAnalysisResponse } from '../../types';
import { Variable, Layers, Activity, Sparkles, Database, ShieldCheck } from 'lucide-react';
import {
  classifyDataStructure,
  isGarbageValue,
  formatDisplayValue,
  DS_TAXONOMY,
} from '../../utils/dataStructures';

interface InspectorPanelProps {
  code: string;
  currentEvent?: ExecutionEvent | null;
  previousEvent?: ExecutionEvent | null;
  nextEvent?: ExecutionEvent | null;
  totalSteps?: number;
  complexity?: ComplexityAnalysisResponse | null;
  detectedStructures?: string[];
}

export type InspectorTab = 'variables' | 'structures' | 'complexity' | 'ai_tutor';

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  code,
  currentEvent,
  previousEvent,
  nextEvent,
  totalSteps = 0,
  complexity,
  detectedStructures = [],
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>('variables');

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border-l border-white/5 overflow-hidden select-none">
      {/* Tab Navigation Header */}
      <div className="flex items-center px-2 py-1.5 bg-[#0d1426] border-b border-white/5 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition whitespace-nowrap ${
            activeTab === 'variables'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Variable className="w-3.5 h-3.5 text-cyan-400" />
          <span>Variables</span>
        </button>

        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition whitespace-nowrap ${
            activeTab === 'structures'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Structures</span>
        </button>

        <button
          onClick={() => setActiveTab('complexity')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition whitespace-nowrap ${
            activeTab === 'complexity'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span>TC / SC</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_tutor')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition whitespace-nowrap ${
            activeTab === 'ai_tutor'
              ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AI Tutor</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'variables' && (
          <VariablesTab currentEvent={currentEvent} previousEvent={previousEvent} />
        )}

        {activeTab === 'structures' && (
          <div className="p-3 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Active Data Structures (Levels 1–5)
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>Garbage Sanitized</span>
              </div>
            </div>

            {currentEvent?.dataStructures && Object.keys(currentEvent.dataStructures).length > 0 ? (
              Object.entries(currentEvent.dataStructures).map(([name, dsVal]) => {
                const valObj: any = dsVal;
                const meta = classifyDataStructure(name, dsVal, detectedStructures);
                const isMap = Boolean(valObj && typeof valObj === 'object' && valObj.__isMap);
                const isPair = Boolean(
                  name === 'it' ||
                  (valObj && typeof valObj === 'object' && valObj.__isPair) ||
                  (Array.isArray(valObj) && valObj.length === 2 && typeof valObj[0] === 'string' && valObj[0].includes('first ='))
                );

                // Render Map key-value entries
                if (isMap) {
                  const entries: { key: any; value: any }[] = Array.isArray(valObj.entries) ? valObj.entries : [];
                  return (
                    <div
                      key={name}
                      className={`p-2.5 rounded-lg bg-slate-900/90 border ${meta.borderColor} space-y-2`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${meta.badgeBg}`}>
                            {`L${meta.level}: ${meta.typeName}`}
                          </span>
                          <span className="font-bold text-amber-300 font-mono text-sm">{name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          size: {valObj.size ?? entries.length}
                        </span>
                      </div>

                      {entries.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic font-mono pl-1">
                          {'{} (empty map)'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {entries.map((entry, i) => (
                            <div
                              key={i}
                              className="flex items-center px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-xs font-mono"
                            >
                              <span className="text-amber-200 font-bold">{`[${entry.key}]`}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="text-emerald-400 font-bold">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Render Pair (e.g. `it` from range-for)
                if (isPair) {
                  let firstVal = '—';
                  let secondVal = '—';
                  if (valObj && typeof valObj === 'object' && valObj.__isPair) {
                    firstVal = formatDisplayValue(valObj.first, '—');
                    secondVal = formatDisplayValue(valObj.second, '—');
                  } else if (Array.isArray(valObj)) {
                    for (const elem of valObj) {
                      const s = String(elem);
                      if (s.includes('first =')) firstVal = s.replace('first =', '').trim();
                      if (s.includes('second =')) secondVal = s.replace('second =', '').trim();
                    }
                  }

                  return (
                    <div
                      key={name}
                      className={`p-2.5 rounded-lg bg-slate-900/90 border ${meta.borderColor} space-y-2`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${meta.badgeBg}`}>
                            {`L${meta.level}: ${meta.typeName}`}
                          </span>
                          <span className="font-bold text-purple-300 font-mono text-sm">{name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">pair&lt;K, V&gt;</span>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex-1 p-1.5 rounded bg-purple-950/40 border border-purple-500/30 text-center font-mono">
                          <div className="text-[10px] text-purple-400 font-bold uppercase">first (key)</div>
                          <div className="text-sm font-bold text-white mt-0.5">{firstVal}</div>
                        </div>
                        <div className="text-slate-500 font-bold">→</div>
                        <div className="flex-1 p-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-center font-mono">
                          <div className="text-[10px] text-cyan-400 font-bold uppercase">second (val)</div>
                          <div className="text-sm font-bold text-white mt-0.5">{secondVal}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Render Arrays, Vectors, Sets, etc.
                const arr = Array.isArray(dsVal) ? dsVal : [];
                return (
                  <div
                    key={name}
                    className={`p-2.5 rounded-lg bg-slate-900/90 border ${meta.borderColor} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${meta.badgeBg}`}>
                          {`L${meta.level}: ${meta.typeName}`}
                        </span>
                        <span className="font-bold text-white font-mono text-sm">{name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        length: {arr.length}
                      </span>
                    </div>

                    {arr.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic font-mono pl-1">
                        {'[] (empty array)'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {arr.map((elem, i) => {
                          const isGarbage = isGarbageValue(elem);
                          const isHighlight = currentEvent.activeIndices?.includes(i);
                          return (
                            <div
                              key={i}
                              className={`flex flex-col items-center px-2 py-1 rounded text-xs font-mono font-bold transition-all ${
                                isHighlight
                                  ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/50 scale-105'
                                  : isGarbage
                                  ? 'bg-slate-900 text-slate-600 border border-slate-800'
                                  : 'bg-slate-800 text-slate-100 border border-slate-700'
                              }`}
                              title={isGarbage ? 'Uninitialized garbage memory (suppressed)' : `[${i}] = ${elem}`}
                            >
                              <span className="text-[9px] opacity-60 font-normal">[{i}]</span>
                              <span>{isGarbage ? '—' : formatDisplayValue(elem, '—')}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-slate-500 text-xs py-6">
                No arrays or data structures currently active.
              </div>
            )}

            {/* Pointers Section */}
            {currentEvent?.pointers && Object.keys(currentEvent.pointers).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Observed Pointers
                </span>
                {Object.entries(currentEvent.pointers).map(([pName, pInfo]) => (
                  <div key={pName} className="p-2 rounded bg-slate-900 text-xs font-mono flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">{pName}</span>
                    <span className="text-slate-400 text-[10px]">{pInfo.address}</span>
                    <span className="text-amber-400 font-bold">*{pName} = {String(pInfo.target)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'complexity' && (
          <ComplexityTab analysis={complexity} executedSteps={totalSteps} />
        )}

        {activeTab === 'ai_tutor' && (
          <AiTutorTab
            code={code}
            currentEvent={currentEvent}
            previousEvent={previousEvent}
            nextEvent={nextEvent}
            totalSteps={totalSteps}
            complexity={complexity}
          />
        )}
      </div>
    </div>
  );
};
