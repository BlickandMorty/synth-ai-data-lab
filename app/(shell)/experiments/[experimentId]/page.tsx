'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, FlaskConical, Play, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataPacket, Experiment, ExperimentRun } from '@/lib/packets/types';

type Evaluation = { annotations: number; preferences: Record<string, number>; rubricAverages: Record<string, number | null>; note: string };

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const experimentId = params.experimentId;
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/experiments').then((response) => response.json()),
      fetch(`/api/packets?experimentId=${encodeURIComponent(experimentId)}&limit=500`).then((response) => response.json()),
      fetch(`/api/runs?experimentId=${encodeURIComponent(experimentId)}`).then((response) => response.json()),
      fetch(`/api/experiments/evaluation?experimentId=${encodeURIComponent(experimentId)}`).then((response) => response.json()),
    ]).then(([experimentsData, packetsData, runsData, evaluationData]) => {
      setExperiment((experimentsData.experiments || []).find((item: Experiment) => item.id === experimentId) || null);
      setPackets((packetsData.packets || []).sort((a: DataPacket, b: DataPacket) => a.createdAt - b.createdAt));
      setRuns(runsData.runs || []);
      setEvaluation(evaluationData.evaluation || null);
    });
  }, [experimentId]);

  const replayable = useMemo(() => packets.find((packet) => packet.type === 'prompt'), [packets]);
  const replayHref = replayable && typeof replayable.input === 'string'
    ? `/lab?experimentId=${encodeURIComponent(experimentId)}&prompt=${encodeURIComponent(replayable.input)}`
    : `/lab?experimentId=${encodeURIComponent(experimentId)}`;

  return <div className="space-y-6 animate-in fade-in duration-500">
    <Link href="/experiments" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3.5 h-3.5" /> All experiments</Link>
    {experiment ? <>
      <div className="border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><FlaskConical className="w-3.5 h-3.5" /> Replayable experiment</div><h1 className="text-3xl text-foreground font-bold tracking-tight">{experiment.title}</h1><p className="text-muted-foreground text-sm mt-2 max-w-3xl">{experiment.description || 'No description was recorded.'}</p></div>
        <div className="flex flex-wrap gap-2"><a href={`/api/experiments/report?experimentId=${encodeURIComponent(experimentId)}`}><Button variant="outline" size="sm" className="gap-2"><Download className="w-3.5 h-3.5" />Export report</Button></a><Link href={replayHref}><Button variant="accent" size="sm" className="gap-2"><Play className="w-3.5 h-3.5 fill-current" />{replayable ? 'Replay first prompt' : 'Open Lab for this experiment'}</Button></Link></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Runs</p><p className="font-mono text-lg mt-1">{experiment.runCount}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Packets</p><p className="font-mono text-lg mt-1">{experiment.packetCount}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Target</p><p className="font-mono text-xs mt-2 truncate">{experiment.modelTarget}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Status</p><Badge variant="amber" className="mt-2 font-mono">{experiment.status}</Badge></div></div>
      <section className="rounded-xl border border-border/60 bg-card/40 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Human review signal</h2><p className="text-xs text-muted-foreground mt-1">Scores are local reviewer judgments, displayed as a summary rather than a claim of objective model capability.</p></div><Badge variant="purple" className="font-mono">{evaluation?.annotations || 0} reviews</Badge></div>{evaluation && <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4"><div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Preference decisions</p><div className="flex flex-wrap gap-2">{Object.entries(evaluation.preferences).map(([name, count]) => <Badge key={name} variant="amber" className="font-mono">{name} · {count}</Badge>)}{Object.keys(evaluation.preferences).length === 0 && <span className="text-xs text-muted-foreground">No preference decisions yet.</span>}</div></div><div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Average rubric scores</p><div className="space-y-2">{Object.entries(evaluation.rubricAverages).map(([name, value]) => <div key={name} className="flex items-center gap-3 text-[11px]"><span className="w-32 text-muted-foreground">{name.replace(/([A-Z])/g, ' $1')}</span><div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-[#C4956A]" style={{ width: `${((value || 0) / 5) * 100}%` }} /></div><span className="font-mono w-7">{value ?? '—'}</span></div>)}</div></div></div>}</section>
      <section className="rounded-xl border border-border/60 bg-card/40 overflow-hidden"><div className="px-5 py-4 border-b border-border/50"><h2 className="text-sm font-semibold">Recorded runs</h2><p className="text-xs text-muted-foreground mt-1">Each new execution creates one run record, then links its prompt and completion packets beneath it.</p></div><div className="divide-y divide-border/40">{runs.map((run) => <div key={run.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"><div><p className="font-mono">{run.model} <span className="text-muted-foreground">· {run.provider}</span></p><p className="text-[10px] text-muted-foreground mt-1">{new Date(run.startedAt).toLocaleString()} · {run.metrics.totalPackets} packets · {run.metrics.avgLatencyMs}ms</p></div><Badge variant={run.status === 'completed' ? 'amber' : 'purple'} className="font-mono">{run.status}</Badge></div>)}{runs.length === 0 && <p className="p-5 text-xs text-muted-foreground">This experiment has no formal run records yet. Older packets remain inspectable below.</p>}</div></section>
      <section className="rounded-xl border border-border/60 bg-card/40 overflow-hidden"><div className="px-5 py-4 border-b border-border/50"><h2 className="text-sm font-semibold">Packet timeline</h2><p className="text-xs text-muted-foreground mt-1">A chronological trace of what was entered, run, and retained for this experiment.</p></div><div className="divide-y divide-border/40">{packets.map((packet) => <article key={packet.id} className="p-5 grid grid-cols-[auto_1fr] gap-4"><div className="mt-0.5"><Badge variant={packet.type === 'completion' ? 'amber' : 'purple'} className="font-mono text-[9px]">{packet.type}</Badge></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-mono">{packet.model}</span><span className="text-[10px] text-muted-foreground">{packet.provider}</span><span className="text-[10px] text-muted-foreground">{new Date(packet.createdAt).toLocaleString()}</span></div><pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-2 max-h-48 overflow-auto">{typeof packet.output === 'string' && packet.type === 'completion' ? packet.output : typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input, null, 2)}</pre><div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground"><ShieldCheck className="w-3 h-3 text-[#C4956A]" />{packet.address?.kind || packet.type} · {packet.integrityHash?.slice(0, 14) || 'no digest'}</div></div></article>)}{packets.length === 0 && <p className="p-8 text-xs font-mono text-muted-foreground">No packets have been assigned to this experiment yet.</p>}</div></section>
    </> : <p className="text-sm text-muted-foreground">Loading experiment…</p>}
  </div>;
}
