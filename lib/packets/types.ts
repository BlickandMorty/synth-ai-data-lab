export type PacketType =
  | 'prompt'
  | 'completion'
  | 'search_query'
  | 'tool_call'
  | 'embedding'
  | 'classification'
  | 'comparison'
  | 'preference_pair'
  | 'red_team'
  | 'causal_trace'
  | 'eval_rubric';

export type PacketSource = 'user' | 'agent' | 'system' | 'evaluator' | 'benchmark';

export type PacketProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'transformers' | 'local' | 'simulator';

export interface UasAddress {
  kind: PacketType;
  contentDigest: string;
  sourceFamily: PacketSource;
  revision: number;
}

export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
}

export interface LatencyMetrics {
  timeToFirstTokenMs?: number;
  totalLatencyMs: number;
  tokensPerSec?: number;
}

export interface DataPacket {
  id: string;
  runId?: string;
  experimentId?: string;
  type: PacketType;
  source: PacketSource;
  model: string;
  provider: PacketProvider;
  input: string | Record<string, unknown>;
  output?: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tokens?: TokenMetrics;
  latency?: LatencyMetrics;
  address?: UasAddress;
  integrityHash?: string;
  parentPacketId?: string;
  schemaVersion?: number;
  annotations?: PacketAnnotation[];
  tags: string[];
  createdAt: number;
}

export interface PacketAnnotation {
  id: string;
  packetId: string;
  annotator: string;
  rubricScores: {
    factualAccuracy: number; // 1-5
    instructionFollowing: number; // 1-5
    nuanceAndDepth: number; // 1-5
    conciseness: number; // 1-5
    safetyAndRobustness: number; // 1-5
  };
  preference?: 'chosen' | 'rejected' | 'tie';
  comparisonPairId?: string;
  flawTags: string[]; // e.g. 'hallucination', 'sycophancy', 'verbosity', 'math_error', 'tone_drift'
  justification?: string;
  revisedOutput?: string;
  createdAt: number;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  category: 'interpretability' | 'bioactivity' | 'benchmark' | 'rlhf' | 'prompt_opt' | 'general';
  status: 'active' | 'completed' | 'archived';
  modelTarget: string;
  runCount: number;
  packetCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  name: string;
  model: string;
  provider: string;
  parameters: {
    temperature: number;
    topP?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
  metrics: {
    totalPackets: number;
    avgLatencyMs: number;
    avgNuanceScore?: number;
  };
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  finishedAt?: number;
}
