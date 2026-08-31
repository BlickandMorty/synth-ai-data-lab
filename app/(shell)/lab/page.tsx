'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AVAILABLE_MODELS } from '@/lib/ai/providers';
import { DataPacket, Experiment } from '@/lib/packets/types';
import { 
  Play, 
  Sparkles, 
  Cpu, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Tag, 
  Code, 
  RefreshCw,
  Sliders,
  SendHorizontal
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import Link from 'next/link';

export default function DataLabPage() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [executionMode, setExecutionMode] = useState<'direct' | 'python'>('direct');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonModel, setComparisonModel] = useState('transformers:HuggingFaceTB/SmolLM2-135M-Instruct');
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert scientific AI evaluator and reasoning model.');
  const [temperature, setTemperature] = useState(0.7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [currentPacket, setCurrentPacket] = useState<DataPacket | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentId, setExperimentId] = useState('');

  useEffect(() => {
    fetch('/api/experiments')
      .then((res) => res.json())
      .then((data) => setExperiments(data.experiments || []))
      .catch(() => setExperiments([]));
  }, []);

  const presets = [
    {
      title: 'Assay Kinetics (Cheng-Prusoff)',
      text: 'Given an assay with [S] = 5 mM and substrate Km = 2.5 mM, an experimental IC50 of 42 nM is observed against EGFR kinase. Calculate the true Ki and identify any assumptions made.',
    },
    {
      title: 'Transformer Induction Circuit',
      text: 'Explain how attention head L1H4 copies token A when preceded by pattern [A][B] ... [A] -> ? in an indirect induction circuit.',
    },
    {
      title: 'Adversarial Jailbreak Probe',
      text: 'Provide a structured safety audit of prompt injection vectors in autonomous browser tools.',
    },
  ];

  async function handleRun() {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput('');
    setCurrentPacket(null);

    try {
      const res = await fetch(comparisonMode ? '/api/compare' : '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comparisonMode ? {
          prompt,
          models: [selectedModel, comparisonModel],
          systemPrompt: showAdvanced ? systemPrompt : undefined,
          temperature,
          experimentId: experimentId || undefined,
          executionMode,
          maxNewTokens: comparisonMode ? 96 : 160,
        } : {
          prompt,
          model: selectedModel,
          systemPrompt: showAdvanced ? systemPrompt : undefined,
          temperature,
          experimentId: experimentId || undefined,
          executionMode,
        }),
      });

      const data = await res.json();
      if (data.success && comparisonMode) {
        const results = data.comparison.results || [];
        setOutput(results.map((result: { packet?: DataPacket; output?: string }) => `### ${result.packet?.model || 'model'}\n\n${result.output || ''}`).join('\n\n---\n\n'));
        setCurrentPacket(results[0]?.packet || null);
      } else if (data.success) {
        setOutput(data.output);
        setCurrentPacket(data.packet);
      } else {
        setOutput(`Error: ${data.error || 'Execution failed'}`);
      }
    } catch (err: any) {
      setOutput(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="border-b border-border/40 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest">
            <span>Interactive Experimentation Canvas</span>
          </div>
          <h1 className="text-3xl text-foreground font-bold tracking-tight">
            DATA TRAINING LAB
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            Run local models with telemetry capture. Every prompt, response, and parameter setting is saved as a versioned data packet with a stable address and integrity digest.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-mono gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showAdvanced ? 'Hide Hyperparameters' : 'Hyperparameters'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Model Configuration & Prompt Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Model Selector Card */}
          <Card className="bg-card/40 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#C4956A]" />
                Target Model & Inference Engine
              </CardTitle>
              <CardDescription className="text-xs">
                Select a local Ollama target or the clearly labeled simulator used for UI and annotation testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedModel === m.id
                        ? 'border-[#C4956A] bg-[#C4956A]/10 shadow-sm ring-1 ring-[#C4956A]'
                        : 'border-border/60 hover:bg-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground truncate">{m.name}</span>
                      {m.isLocal && (
                        <Badge variant="amber" className="text-[9px] px-1 py-0 font-mono">LOCAL</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{m.description}</p>
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1">Execution path</label>
                <select
                  value={executionMode}
                  onChange={(e) => setExecutionMode(e.target.value as 'direct' | 'python')}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="direct">Direct Ollama — simplest local run</option>
                  <option value="python">Python research engine — reproducible engine provenance</option>
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">The Python route uses the local FastAPI engine on port 8020. Both stay on this machine.</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-foreground cursor-pointer">
                  <input type="checkbox" checked={comparisonMode} onChange={(e) => setComparisonMode(e.target.checked)} className="accent-[#C4956A]" />
                  Comparison run — same prompt, two logged model outputs
                </label>
                {comparisonMode && <select value={comparisonModel} onChange={(e) => setComparisonModel(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs">
                  {AVAILABLE_MODELS.filter((model) => model.id !== selectedModel).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>}
                {comparisonMode && <p className="text-[10px] text-muted-foreground">Runs are deliberately sequential and capped at 96 new tokens on this CPU machine. Choose Python when comparing against the Transformers model, then open Annotation Studio to make a human preference decision.</p>}
              </div>
              <div>
                <label className="text-xs font-mono text-muted-foreground block mb-1">Experiment journal (optional)</label>
                <select
                  value={experimentId}
                  onChange={(e) => setExperimentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">Unassigned exploratory run</option>
                  {experiments.map((experiment) => (
                    <option key={experiment.id} value={experiment.id}>{experiment.title}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Create a journal in Experiments first when you want related packets grouped together.</p>
              </div>
            </CardContent>
          </Card>

          {/* Hyperparameters Drawer */}
          {showAdvanced && (
            <Card className="bg-secondary/20 border-border/60 animate-in slide-in-from-top-2 duration-300">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground block mb-1">
                    System Directive
                  </label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={2}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-mono text-muted-foreground block mb-1">
                      Temperature: <span className="font-bold text-foreground">{temperature}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[#C4956A]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Editor */}
          <Card className="bg-card/50 border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Prompt & Input Query</CardTitle>
                <CardDescription className="text-xs">Enter text or select a research preset.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(preset.text)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary border border-border/60 text-foreground transition-colors cursor-pointer"
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Enter scientific prompt, mathematical query, or benchmark instruction..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="text-xs font-mono leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {prompt.length} chars • ~{Math.ceil(prompt.length / 4)} tokens
                </span>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleRun}
                  disabled={loading || !prompt.trim()}
                  className="gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {comparisonMode ? 'Running Comparison...' : 'Running Inference...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {comparisonMode ? 'Compare & Log Packets' : 'Execute & Log Packet'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output & Live Packet Inspector */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card/50 border-border/60 min-h-[420px] flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C4956A]" />
                  Model Generation
                </CardTitle>
                {currentPacket && (
                  <Badge variant="green" className="font-mono text-[9px]">
                    PACKET LOGGED
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 py-4 space-y-4">
              {loading ? (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs font-mono space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#C4956A]" />
                  <span>Streaming token trajectory...</span>
                </div>
              ) : output ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed font-sans whitespace-pre-wrap">
                  {output}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground text-xs font-mono p-4">
                  <Code className="w-6 h-6 mb-2 text-muted-foreground/40" />
                  <span>Awaiting execution. Run a prompt to view output and packet telemetry.</span>
                </div>
              )}
            </CardContent>

            {/* Packet Telemetry Footer */}
            {currentPacket && (
              <div className="p-4 border-t border-border/40 bg-secondary/30 rounded-b-xl space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-2 rounded bg-card/60 border border-border/40">
                    <span className="text-muted-foreground block">Latency</span>
                    <span className="font-bold text-foreground">
                      {formatDuration(currentPacket.latency?.totalLatencyMs || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border/40">
                    <span className="text-muted-foreground block">Tokens</span>
                    <span className="font-bold text-foreground">
                      {currentPacket.tokens?.totalTokens || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border/40">
                    <span className="text-muted-foreground block">Throughput</span>
                    <span className="font-bold text-emerald-500">
                      {currentPacket.latency?.tokensPerSec || 0} t/s
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">
                    ID: {currentPacket.id}
                  </span>
                  <Link href={`/annotate?packetId=${currentPacket.id}`}>
                    <Button variant="outline" size="sm" className="text-[11px] h-7 gap-1 font-mono">
                      <Tag className="w-3 h-3 text-[#C4956A]" />
                      Annotate in Studio
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
