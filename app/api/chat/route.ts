import { NextResponse } from 'next/server';
import { completeExperimentRun, createExperimentRun, logPacket } from '@/lib/packets/logger';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { prompt, model = 'ollama:llama3.2', experimentId, systemPrompt, temperature = 0.7, executionMode = 'direct', maxNewTokens = 160 } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    let outputText = '';
    let provider: 'ollama' | 'transformers' | 'simulator' | 'openai' | 'anthropic' = 'simulator';
    let executionEngine = 'synth-simulator-circuit';
    let fallbackReason: string | undefined;
    let providerMetrics: { promptTokens?: number; completionTokens?: number; totalTokens?: number; totalLatencyMs?: number } = {};
    const [providerType, ...modelParts] = model.split(':');
    const modelName = modelParts.join(':');
    const requestedMaxTokens = Math.min(Math.max(Number(maxNewTokens) || 160, 1), 512);
    // Qwen3 commonly consumes a short budget in its internal reasoning before
    // emitting a visible answer. A 96-token comparison cap can therefore log an
    // empty but technically successful completion. Its local cap remains bounded
    // at 512, which is enough for a visible, reviewable response in this setup.
    const effectiveMaxTokens = providerType === 'ollama' && modelName.startsWith('qwen3') ? 512 : requestedMaxTokens;
    // Ollama's installed Qwen3 variants otherwise spend short runs in reasoning
    // mode and can return an empty visible completion. This inference-only
    // directive is recorded in packet metadata; the original user prompt stays
    // intact as the packet input.
    const providerPromptDirective = providerType === 'ollama' && modelName.startsWith('qwen3') ? '/no_think' : undefined;
    const promptForProvider = providerPromptDirective ? `${prompt} ${providerPromptDirective}` : prompt;

    if (providerType === 'ollama' || providerType === 'transformers') {
      provider = providerType;
      try {
        if (executionMode === 'python') {
          const engineUrl = process.env.SYNTH_ENGINE_URL || 'http://127.0.0.1:8020';
          const engineRes = await fetch(`${engineUrl}/v1/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'llama3.2', provider: providerType, prompt: promptForProvider, system_prompt: systemPrompt, temperature, max_new_tokens: effectiveMaxTokens }),
            signal: AbortSignal.timeout(90000),
          });
          if (!engineRes.ok) throw new Error(`Python engine returned ${engineRes.status}`);
          const engineData = await engineRes.json();
          outputText = engineData.response || '';
          executionEngine = engineData.provenance?.engine || 'synth-python-fastapi';
          providerMetrics = {
            promptTokens: engineData.metrics?.prompt_tokens,
            completionTokens: engineData.metrics?.completion_tokens,
            totalTokens: engineData.metrics?.total_tokens,
            totalLatencyMs: engineData.metrics?.total_latency_ms,
          };
        } else if (providerType === 'ollama') {
          const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
          const ollamaRes = await fetch(`${ollamaBaseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modelName || 'llama3.2', prompt: promptForProvider, system: systemPrompt, stream: false, options: { temperature, num_predict: effectiveMaxTokens } }),
            signal: AbortSignal.timeout(60000),
          });
          if (!ollamaRes.ok) throw new Error(`Ollama returned ${ollamaRes.status}`);
          const ollamaData = await ollamaRes.json();
          outputText = ollamaData.response || '';
          executionEngine = 'ollama-native';
        } else {
          throw new Error('Transformers models require the Python research engine');
        }
        if (!outputText.trim()) throw new Error('The local model returned no visible completion.');
      } catch (error) {
        fallbackReason = error instanceof Error ? error.message : 'Unknown local provider failure.';
        outputText = generateSimulatedResponse(prompt, model, executionMode === 'python' ? 'The Python research engine was unavailable.' : 'No local model response was available.');
        provider = 'simulator';
      }
    } else {
      outputText = generateSimulatedResponse(prompt, model, 'That provider is not configured in this local-first build.');
      provider = 'simulator';
    }

    const totalLatencyMs = Date.now() - startTime;
    const promptTokens = providerMetrics.promptTokens ?? Math.ceil(prompt.length / 4);
    const completionTokens = providerMetrics.completionTokens ?? Math.ceil(outputText.length / 4);
    const run = experimentId ? createExperimentRun({
      experimentId,
      name: `${modelName || model} · ${new Date(startTime).toLocaleTimeString()}`,
      model,
      provider,
      parameters: { temperature, maxTokens: effectiveMaxTokens, systemPrompt: systemPrompt || undefined },
      startedAt: startTime,
    }) : undefined;

    // Record the user input and resulting completion separately. The completion
    // points back to the exact prompt packet, so a later review can replay the
    // relationship instead of treating the exchange as one opaque blob.
    const promptPacket = await logPacket({
      experimentId: experimentId || undefined,
      runId: run?.id,
      type: 'prompt',
      source: 'user',
      model,
      provider,
      input: prompt,
      metadata: {
        systemPrompt: systemPrompt || undefined,
        temperature,
        requestedMaxTokens,
        effectiveMaxTokens,
        providerPromptDirective,
        fallbackReason,
        requestedProvider: providerType || 'simulator',
        executionMode,
      },
      tokens: { promptTokens, completionTokens: 0, totalTokens: promptTokens },
      latency: { totalLatencyMs: 0 },
      tags: ['data-lab', 'prompt', modelName || 'transformer'],
    });

    // Record the resulting model interaction as a rich data packet.
    const packet = await logPacket({
      experimentId: experimentId || undefined,
      runId: run?.id,
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
        engine: executionEngine,
        executionMode,
        requestedMaxTokens,
        effectiveMaxTokens,
        providerPromptDirective,
        fallbackReason,
        syntheticOutput: provider === 'simulator',
        promptPacketId: promptPacket.id,
      },
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens: providerMetrics.totalTokens ?? promptTokens + completionTokens,
      },
      latency: {
        totalLatencyMs: providerMetrics.totalLatencyMs ?? totalLatencyMs,
        timeToFirstTokenMs: Math.min(120, Math.floor(totalLatencyMs * 0.2)),
        tokensPerSec: parseFloat(((completionTokens / (totalLatencyMs / 1000)) || 25).toFixed(1)),
      },
      tags: ['data-lab', 'model-run', modelName || 'transformer'],
    });

    if (run) {
      completeExperimentRun(run.id, {
        totalPackets: 2,
        avgLatencyMs: providerMetrics.totalLatencyMs ?? totalLatencyMs,
      });
    }

    return NextResponse.json({
      success: true,
      output: outputText,
      packet,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateSimulatedResponse(prompt: string, model: string, reason: string): string {
  return `### SYNTH simulator output\n\n${reason} SYNTH created this clearly marked placeholder packet for interface and annotation testing. It is not a model answer and should not be scored as evidence.\n\n**Requested model:** ${model}\n**Captured prompt:** ${prompt}\n\nStart Ollama or the Python engine and choose an installed model to create a real local inference packet.`;
}
