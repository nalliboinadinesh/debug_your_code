import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  BrainCircuit,
  Cpu,
  Layers,
} from 'lucide-react';
import {
  explainExecution,
  explainComplexity,
  getHint,
  evaluatePrediction,
} from '../../services/api';
import { ExecutionEvent, ComplexityAnalysisResponse } from '../../types';

interface AiTutorTabProps {
  code: string;
  currentEvent?: ExecutionEvent | null;
  previousEvent?: ExecutionEvent | null;
  nextEvent?: ExecutionEvent | null;
  totalSteps?: number;
  complexity?: ComplexityAnalysisResponse | null;
}

export const AiTutorTab: React.FC<AiTutorTabProps> = ({
  code,
  currentEvent,
  previousEvent,
  nextEvent,
  totalSteps = 0,
  complexity,
}) => {
  const [model, setModel] = useState<'gemma-4' | 'open-llm'>('gemma-4');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'Why did the iteration count change when I used i += 2?',
    'What did this execution step do to the array?',
    'Why is the asymptotic time complexity O(N)?',
  ]);

  // Prediction Quiz state
  const [predictedVar, setPredictedVar] = useState('');
  const [predictedVal, setPredictedVal] = useState('');
  const [predictionFeedback, setPredictionFeedback] = useState<string | null>(null);

  const getContext = () => ({
    code,
    currentStep: currentEvent?.step || 1,
    totalSteps: totalSteps || 1,
    currentLine: currentEvent?.line || 1,
    currentEvent: currentEvent || null,
    currentVariables: currentEvent?.variables || {},
    previousEvent: previousEvent || null,
    nextEvent: nextEvent || null,
    complexity: complexity || null,
  });

  const handleExplainStep = async (customQ?: string) => {
    setLoading(true);
    setPredictionFeedback(null);
    try {
      const q = customQ || question;
      const res = await explainExecution(getContext(), q, model);
      setExplanation(res.explanation);
      setModelUsed(res.modelUsed);
      if (res.suggestedQuestions.length > 0) {
        setSuggestedQuestions(res.suggestedQuestions);
      }
      if (!customQ) setQuestion('');
    } catch (e: any) {
      setExplanation(`Error communicating with AI tutor: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainComplexity = async () => {
    setLoading(true);
    try {
      const res = await explainComplexity(getContext(), model);
      setExplanation(res.explanation);
      setModelUsed(res.modelUsed);
    } catch (e: any) {
      setExplanation(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setLoading(true);
    try {
      const res = await getHint(getContext(), 'Next step understanding', model);
      setExplanation(`💡 **Tutor Hint**:\n\n${res.hint}\n\n${res.codeSnippet || ''}`);
      setModelUsed(`AI Hint Assistant (${model})`);
    } catch (e: any) {
      setExplanation(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPrediction = async () => {
    if (!predictedVar || !predictedVal) return;
    setLoading(true);
    try {
      const parsedVal = isNaN(Number(predictedVal)) ? predictedVal : Number(predictedVal);
      const res = await evaluatePrediction(
        getContext(),
        { [predictedVar]: parsedVal },
        model
      );
      setPredictionFeedback(
        `${res.isCorrect ? '✅ Correct!' : '❌ Not quite.'}\n\n${res.feedback}\n\n💡 Tip: ${res.learningTip}`
      );
    } catch (e: any) {
      setPredictionFeedback(`Evaluation error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-4 text-xs select-none">
      {/* Model Selector Bar */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Active Model</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModel('gemma-4')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              model === 'gemma-4'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            Gemma 4
          </button>
          <button
            onClick={() => setModel('open-llm')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              model === 'open-llm'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            Open-LLM
          </button>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => handleExplainStep()}
          disabled={loading}
          className="p-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold transition text-[11px] flex flex-col items-center gap-1 text-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explain Step</span>
        </button>

        <button
          onClick={handleExplainComplexity}
          disabled={loading}
          className="p-2 rounded bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-semibold transition text-[11px] flex flex-col items-center gap-1 text-center"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Explain TC/SC</span>
        </button>

        <button
          onClick={handleGetHint}
          disabled={loading}
          className="p-2 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold transition text-[11px] flex flex-col items-center gap-1 text-center"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Get Hint</span>
        </button>
      </div>

      {/* Explanation Output Area */}
      {explanation && (
        <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-2">
          {modelUsed && (
            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-wider pb-1 border-b border-white/5">
              <span>{modelUsed}</span>
              <span className="text-slate-400 font-normal">Verified Context</span>
            </div>
          )}
          <div className="text-slate-200 leading-relaxed text-[11px] whitespace-pre-wrap font-sans">
            {explanation}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Suggested Questions
        </span>
        <div className="space-y-1">
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleExplainStep(sq)}
              disabled={loading}
              className="w-full text-left p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-white/5 transition flex items-center gap-1.5"
            >
              <HelpCircle className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{sq}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExplainStep()}
          placeholder="Ask tutor about this step or code..."
          className="flex-1 p-2 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
        />
        <button
          onClick={() => handleExplainStep()}
          disabled={loading || !question.trim()}
          className="p-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Predict-Next-State Quiz */}
      <div className="p-2.5 rounded-lg bg-[#0e1628] border border-white/10 space-y-2 mt-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive State Prediction Quiz</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Predict what variable will be updated in the next step to test your understanding!
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={predictedVar}
            onChange={(e) => setPredictedVar(e.target.value)}
            placeholder="Variable (e.g. total)"
            className="w-1/2 p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400"
          />
          <input
            type="text"
            value={predictedVal}
            onChange={(e) => setPredictedVal(e.target.value)}
            placeholder="Value (e.g. 10)"
            className="w-1/2 p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400"
          />
        </div>

        <button
          onClick={handleCheckPrediction}
          disabled={loading || !predictedVar || !predictedVal}
          className="w-full py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition disabled:opacity-40"
        >
          Verify My Prediction
        </button>

        {predictionFeedback && (
          <div className="p-2 rounded bg-black/50 border border-emerald-500/30 text-[11px] text-slate-200 whitespace-pre-wrap font-sans">
            {predictionFeedback}
          </div>
        )}
      </div>
    </div>
  );
};
