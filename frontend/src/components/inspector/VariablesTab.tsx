import React from 'react';
import { ExecutionEvent } from '../../types';

interface VariablesTabProps {
  currentEvent?: ExecutionEvent | null;
  previousEvent?: ExecutionEvent | null;
}

export const VariablesTab: React.FC<VariablesTabProps> = ({
  currentEvent,
  previousEvent,
}) => {
  const vars = currentEvent?.variables || {};
  const prevVars = previousEvent?.variables || {};
  const varEntries = Object.entries(vars);

  if (varEntries.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        No active scalar variables in current scope.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-2 pb-1 border-b border-white/5">
        <span>Variable</span>
        <span>Scope</span>
        <span>Current Value</span>
      </div>

      <div className="space-y-1">
        {varEntries.map(([name, val]) => {
          const prevVal = prevVars[name];
          const hasChanged = prevVal !== undefined && prevVal !== val;

          return (
            <div
              key={name}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition duration-300 ${
                hasChanged
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200'
                  : 'bg-[#11192b] border border-white/5 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-cyan-400">{name}</span>
                {hasChanged && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 font-sans">
                    updated
                  </span>
                )}
              </div>

              <span className="text-slate-500 text-[10px] font-sans">
                {currentEvent?.currentScope || 'main'}
              </span>

              <div className="flex items-center gap-1.5">
                {hasChanged && (
                  <span className="text-slate-500 line-through text-[11px]">
                    {String(prevVal)}
                  </span>
                )}
                <span className="font-bold text-white bg-slate-900/60 px-2 py-0.5 rounded border border-white/10">
                  {String(val)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
