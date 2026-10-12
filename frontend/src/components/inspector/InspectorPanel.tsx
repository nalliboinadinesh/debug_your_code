import React, { useState } from 'react';
import { VariablesTab } from './VariablesTab';
import { ComplexityTab } from './ComplexityTab';
import { AiTutorTab } from './AiTutorTab';
import { ExecutionEvent, ComplexityAnalysisResponse } from '../../types';
import { Variable, Layers, Activity, Sparkles, Database } from 'lucide-react';

interface InspectorPanelProps {
  code: string;
  currentEvent?: ExecutionEvent | null;
  previousEvent?: ExecutionEvent | null;
  nextEvent?: ExecutionEvent | null;
  totalSteps?: number;
  complexity?: ComplexityAnalysisResponse | null;
}

export type InspectorTab = 'variables' | 'structures' | 'complexity' | 'ai_tutor';

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  code,
  currentEvent,
  previousEvent,
  nextEvent,
  totalSteps = 0,
  complexity,
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
          <div className="p-3 space-y-3">
            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Observed Data Structures
            </div>
            {currentEvent?.dataStructures && Object.keys(currentEvent.dataStructures).length > 0 ? (
              Object.entries(currentEvent.dataStructures).map(([name, arr]) => {
                const isSet = name.toLowerCase().includes('set') || name.toLowerCase().includes('seen');
                return (
                  <div key={name} className="p-2.5 rounded bg-slate-900 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isSet
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {isSet ? 'Set' : 'Array'}
                        </span>
                        <span className="font-bold text-white font-mono">{name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isSet ? `size: ${arr.length}` : `length: ${arr.length}`}
                      </span>
                    </div>
                    {arr.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic font-mono pl-1">
                        {isSet ? '∅ (empty set)' : '[] (empty array)'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {arr.map((elem, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${
                              currentEvent.activeIndices?.includes(i)
                                ? 'bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/50'
                                : isSet
                                ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {String(elem)}
                          </span>
                        ))}
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
