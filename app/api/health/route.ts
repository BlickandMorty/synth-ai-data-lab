import { NextResponse } from 'next/server';
import { checkOllamaHealth } from '@/lib/ai/providers';

export async function GET() {
  const ollama = await checkOllamaHealth();
  const engineUrl = process.env.SYNTH_ENGINE_URL || 'http://127.0.0.1:8020';
  let engine: { running: boolean; transformers?: { transformers_installed: boolean; torch_installed: boolean } } = { running: false };
  try {
    const response = await fetch(`${engineUrl}/health`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      const data = await response.json();
      engine = { running: true, transformers: data.transformers };
    }
  } catch {
    // The Python engine is optional, and the direct Ollama route still works.
  }
  return NextResponse.json({
    success: true,
    ollama,
    storage: 'local-sqlite',
    simulatorAvailable: true,
    engine,
  });
}
