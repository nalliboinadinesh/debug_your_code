import {
  ExecutionResponse,
  ComplexityAnalysisResponse,
  AIExplanationResponse,
  AIPredictionResponse,
  AIHintResponse,
} from '../types';

const BASE_URL = '';

export async function runCode(
  code: string,
  stdin: string = '',
  maxSteps: number = 250
): Promise<ExecutionResponse> {
  const res = await fetch(`${BASE_URL}/api/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, stdin, language: 'cpp', maxSteps }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeComplexity(
  code: string,
  executedSteps?: number
): Promise<ComplexityAnalysisResponse> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, executedSteps, language: 'cpp' }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}

export async function explainExecution(
  context: any,
  question?: string,
  model: string = 'gemma-4'
): Promise<AIExplanationResponse> {
  const res = await fetch(`${BASE_URL}/api/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, question, model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}

export async function explainComplexity(
  context: any,
  model: string = 'gemma-4'
): Promise<AIExplanationResponse> {
  const res = await fetch(`${BASE_URL}/api/ai/complexity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}

export async function getHint(
  context: any,
  studentGoal?: string,
  model: string = 'gemma-4'
): Promise<AIHintResponse> {
  const res = await fetch(`${BASE_URL}/api/ai/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, studentGoal, model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}

export async function evaluatePrediction(
  context: any,
  predictedVariables: Record<string, any>,
  model: string = 'gemma-4'
): Promise<AIPredictionResponse> {
  const res = await fetch(`${BASE_URL}/api/ai/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, predictedVariables, model }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.statusText}`);
  }
  return res.json();
}
