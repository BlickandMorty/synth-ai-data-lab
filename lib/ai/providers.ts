export interface ModelOption {
  id: string;
  name: string;
  provider: 'ollama' | 'openai' | 'anthropic' | 'google' | 'simulator';
  description: string;
  contextWindow: number;
  isLocal: boolean;
  recommendedFor: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'ollama:qwen3:4b',
    name: 'Qwen3 4B',
    provider: 'ollama',
    description: 'Installed local model through Ollama. Best default for real SYNTH packets.',
    contextWindow: 32768,
    isLocal: true,
    recommendedFor: 'Local evaluation, annotation, and replayable prompt packets',
  },
  {
    id: 'ollama:qwen3:4b-direct-lab',
    name: 'Qwen3 4B Direct Lab',
    provider: 'ollama',
    description: 'Local experimental Qwen3 variant kept for direct comparisons.',
    contextWindow: 32768,
    isLocal: true,
    recommendedFor: 'Matched comparison runs',
  },
  {
    id: 'ollama:qwen3:4b-direct-lab-v2',
    name: 'Qwen3 4B Direct Lab v2',
    provider: 'ollama',
    description: 'Second local experimental variant for controlled replay comparisons.',
    contextWindow: 32768,
    isLocal: true,
    recommendedFor: 'Versioned local experiments',
  },
  {
    id: 'simulator:synth-transformer',
    name: 'SYNTH Toy Transformer (Local Simulator)',
    provider: 'simulator',
    description: 'Zero-latency internal simulation engine with induction head and reasoning tracers.',
    contextWindow: 8192,
    isLocal: true,
    recommendedFor: 'Instant development, UI testing & test harness verification',
  },
];

export async function checkOllamaHealth(endpoint = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'): Promise<{ running: boolean; models: string[] }> {
  try {
    const res = await fetch(`${endpoint}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return { running: false, models: [] };
    const data = await res.json();
    const models = (data.models || []).map((m: any) => m.name);
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  }
}
