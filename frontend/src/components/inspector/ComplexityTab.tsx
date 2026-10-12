import React from 'react';
import { ComplexityAnalysisResponse } from '../../types';
import { Clock, HardDrive, CheckCircle2, Info } from 'lucide-react';

interface ComplexityTabProps {
  analysis?: ComplexityAnalysisResponse | null;
  executedSteps?: number;
}

export const ComplexityTab: React.FC<ComplexityTabProps> = ({
  analysis,
  executedSteps = 0,
}) => {
  if (!analysis) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs space-y-2">
        <Info className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p>No static analysis data available.</p>
        <p className="text-[11px] text-slate-600">
          Click the "Analyze" button above or run the code to trigger AST complexity derivation.
        </p>
      </div>
    );
  }

  const tc = analysis.timeComplexity;
  const sc = analysis.spaceComplexity;

  return (
    <div className="p-3 space-y-4 text-xs select-none">
      {/* Pattern Banner */}
      <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
        <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
          Detected Algorithm Pattern
        </div>
        <div className="text-slate-100 font-bold text-sm mt-0.5">
          {analysis.codePattern}
        </div>
      </div>

      {/* 1. TIME COMPLEXITY */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Time Complexity</span>
        </div>

        {/* Big-O Badges */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-[#11192b] border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block">Worst Case</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              {tc.worstCase}
            </span>
          </div>
          <div className="p-2 rounded bg-[#11192b] border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block">Avg Case</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {tc.averageCase}
            </span>
          </div>
          <div className="p-2 rounded bg-[#11192b] border border-white/5 text-center">
            <span className="text-[10px] text-slate-400 block">Best Case</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {tc.bestCase}
            </span>
          </div>
        </div>

        {/* Mathematical Derivation */}
        <div className="p-2.5 rounded bg-slate-900/80 border border-white/5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Mathematical Proof & Derivation
          </span>
          <div className="p-1.5 rounded bg-black/40 font-mono text-[11px] text-cyan-300">
            {tc.stepFormula}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
            {tc.mathematicalDerivation}
          </p>
        </div>

        {/* Concrete Steps vs Asymptotic */}
        <div className="p-2 rounded bg-slate-950 border border-white/10 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Exact Execution Steps:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {executedSteps || tc.exactOpCountForInput} steps
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Asymptotic Order:</span>
            <span className="font-bold text-cyan-400 font-mono text-sm">
              {tc.worstCase}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPACE COMPLEXITY */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <HardDrive className="w-4 h-4 text-violet-400" />
          <span>Space Complexity</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-[#11192b] border border-white/5">
            <span className="text-[10px] text-slate-400 block">Auxiliary Space</span>
            <span className="text-sm font-bold text-violet-400 font-mono">
              {sc.auxiliarySpace}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Algorithm extra space
            </span>
          </div>
          <div className="p-2 rounded bg-[#11192b] border border-white/5">
            <span className="text-[10px] text-slate-400 block">Total Space</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {sc.totalSpace}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Includes input buffers
            </span>
          </div>
        </div>

        {/* Memory Breakdown */}
        {sc.breakdown && sc.breakdown.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Memory Breakdown
            </span>
            <div className="space-y-1">
              {sc.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-slate-900/60 border border-white/5 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-200 font-semibold">{item.item}</span>
                    <span className="text-violet-300 font-bold">{item.sizeEstimate}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{item.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
