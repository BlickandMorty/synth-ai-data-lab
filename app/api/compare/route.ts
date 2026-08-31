import { NextResponse } from 'next/server';

type ChatResult = {
  success: boolean;
  output?: string;
  packet?: { id: string; model: string; provider: string; metadata?: Record<string, unknown> };
  error?: string;
};

export async function POST(req: Request) {
  try {
    const { prompt, models, experimentId, systemPrompt, temperature = 0.7, executionMode = 'direct', maxNewTokens = 96 } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }
    if (!Array.isArray(models) || models.length < 2 || models.length > 4 || models.some((model) => typeof model !== 'string')) {
      return NextResponse.json({ success: false, error: 'Choose between two and four models to compare.' }, { status: 400 });
    }

    const chatUrl = new URL('/api/chat', req.url);
    const results: ChatResult[] = [];

    // Sequential is intentional in V1: it avoids two CPU models fighting for
    // memory and records a clean, ordered replay trace.
    for (const model of models) {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model, experimentId, systemPrompt, temperature, executionMode, maxNewTokens }),
      });
      const result = await response.json() as ChatResult;
      results.push(result);
    }

    return NextResponse.json({
      success: results.every((result) => result.success),
      comparison: {
        prompt,
        models,
        executionMode,
        results,
        packetIds: results.flatMap((result) => result.packet?.id ? [result.packet.id] : []),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
