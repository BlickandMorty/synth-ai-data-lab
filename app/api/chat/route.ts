import { NextResponse } from 'next/server';
import { logPacket } from '@/lib/packets/logger';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { prompt, model = 'ollama:llama3.2', experimentId, systemPrompt, temperature = 0.7 } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    let outputText = '';
    let provider: 'ollama' | 'simulator' | 'openai' | 'anthropic' = 'simulator';
    const [providerType, ...modelParts] = model.split(':');
    const modelName = modelParts.join(':');

    if (providerType === 'ollama') {
      provider = 'ollama';
      try {
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
        const ollamaRes = await fetch(`${ollamaBaseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName || 'llama3.2',
            prompt: prompt,
            system: systemPrompt,
            stream: false,
            options: { temperature },
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (ollamaRes.ok) {
          const ollamaData = await ollamaRes.json();
          outputText = ollamaData.response || '';
        } else {
          outputText = generateSimulatedResponse(prompt, model);
          provider = 'simulator';
        }
      } catch {
        // Fallback to simulator if Ollama daemon is offline
        outputText = generateSimulatedResponse(prompt, model);
        provider = 'simulator';
      }
    } else {
      outputText = generateSimulatedResponse(prompt, model);
      provider = 'simulator';
    }

    const totalLatencyMs = Date.now() - startTime;
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(outputText.length / 4);

    // Record the user input and resulting completion separately. The completion
    // points back to the exact prompt packet, so a later review can replay the
    // relationship instead of treating the exchange as one opaque blob.
    const promptPacket = await logPacket({
      experimentId: experimentId || undefined,
      type: 'prompt',
      source: 'user',
      model,
      provider,
      input: prompt,
      metadata: {
        systemPrompt: systemPrompt || undefined,
        temperature,
        requestedProvider: providerType || 'simulator',
      },
      tokens: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
      latency: { totalLatencyMs: 0 },
      tags: ['data-lab', 'prompt', modelName || 'transformer'],
    });

    // Record the resulting model interaction as a rich data packet.
    const packet = await logPacket({
      experimentId: experimentId || undefined,
      type: 'completion',
      source: 'user',
      model: model,
      provider: provider,
      input: prompt,
      output: outputText,
      parentPacketId: promptPacket.id,
      metadata: {
        systemPrompt: systemPrompt || undefined,
        temperature,
        engine: provider === 'ollama' ? 'ollama-native' : 'synth-simulator-circuit',
        syntheticOutput: provider === 'simulator',
        promptPacketId: promptPacket.id,
      },
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      latency: {
        totalLatencyMs,
        timeToFirstTokenMs: Math.min(120, Math.floor(totalLatencyMs * 0.2)),
        tokensPerSec: parseFloat(((completionTokens / (totalLatencyMs / 1000)) || 25).toFixed(1)),
      },
      tags: ['data-lab', 'model-run', modelName || 'transformer'],
    });

    return NextResponse.json({
      success: true,
      output: outputText,
      packet,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateSimulatedResponse(prompt: string, model: string): string {
  return `### SYNTH simulator output\n\nNo local model response was available, so SYNTH created this clearly marked placeholder packet for interface and annotation testing. It is not a model answer and should not be scored as evidence.\n\n**Requested model:** ${model}\n**Captured prompt:** ${prompt}\n\nStart Ollama and choose an installed model to create a real local inference packet.`;
}
