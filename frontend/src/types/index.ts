export type EventType =
  | 'statement_enter'
  | 'variable_declare'
  | 'variable_update'
  | 'comparison'
  | 'branch'
  | 'loop_iteration'
  | 'function_call'
  | 'function_return'
  | 'array_read'
  | 'array_write'
  | 'pointer_update'
  | 'output'
  | 'program_end'
  | 'runtime_error';

export interface PointerInfo {
  __isPointer?: boolean;
  address: string;
  target: any;
}

export interface CallStackFrame {
  name: string;
  line: number;
}

export interface ExecutionEvent {
  step: number;
  line: number;
  eventType: EventType | string;
  variable?: string | null;
  oldValue?: any;
  newValue?: any;
  description: string;
  currentScope?: string;
  callStack: CallStackFrame[];
  dataStructures: Record<string, any[]>;
  pointers: Record<string, PointerInfo>;
  variables: Record<string, any>;
  activeIndices?: number[] | null;
  comparisonOperands?: Record<string, any> | null;
  stdout?: string;
  runtimeError?: string | null;
  confidence: string;
}

export interface VisualObject {
  id: string;
  kind: 'array' | 'variable' | 'pointer' | 'stack_frame' | 'node' | 'edge' | 'memory_block' | 'generic';
  label: string;
  initialValue?: any;
  metadata?: Record<string, any>;
}

export interface VisualAction {
  step: number;
  line: number;
  action: string;
  targetId: string;
  params: Record<string, any>;
  explanation: string;
  confidence: string;
}

export interface VisualizationPlan {
  schemaVersion: string;
  objects: VisualObject[];
  actions: VisualAction[];
  sceneHints: Record<string, any>;
  codeUnderstanding?: {
    algorithmPattern: string;
    candidateVisualizations: string[];
    summary: string;
  };
  totalSteps: number;
  primaryVisualization: 'array_with_pointers' | 'sorting_bars' | 'call_stack_tree' | 'linked_list' | 'tree' | 'graph' | 'generic_memory';
}

export interface ExecutionResponse {
  success: boolean;
  events: ExecutionEvent[];
  totalSteps: number;
  stdout: string;
  stderr: string;
  compilationError?: string | null;
  runtimeError?: string | null;
  detectedStructures: string[];
  executionTimeMs: number;
  visualizationPlan?: VisualizationPlan | null;
}

export interface SpaceBreakdownItem {
  item: string;
  category: string;
  sizeEstimate: string;
  details: string;
}

export interface TimeComplexityInfo {
  worstCase: string;
  averageCase: string;
  bestCase: string;
  dominantTerm: string;
  mathematicalDerivation: string;
  stepFormula: string;
  exactOpCountForInput: number;
  measuredRuntimeMs: number;
  assumptions: string[];
  status: string;
  unsupportedConstructs: string[];
}

export interface SpaceComplexityInfo {
  auxiliarySpace: string;
  totalSpace: string;
  callStackDepth: number;
  breakdown: SpaceBreakdownItem[];
  limitations: string[];
}

export interface ComplexityAnalysisResponse {
  success: boolean;
  timeComplexity: TimeComplexityInfo;
  spaceComplexity: SpaceComplexityInfo;
  codePattern: string;
  summary: string;
}

export interface AIExplanationResponse {
  success: boolean;
  modelUsed: string;
  explanation: string;
  keyInsight?: string;
  suggestedQuestions: string[];
}

export interface AIPredictionResponse {
  isCorrect: boolean;
  feedback: string;
  actualNextState: Record<string, any>;
  learningTip: string;
}

export interface AIHintResponse {
  hintLevel: number;
  hint: string;
  codeSnippet?: string;
}
