'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FlaskConical, Play, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataPacket, Experiment } from '@/lib/packets/types';

export default function ExperimentDetailPage() {
  const params = useParams<{ experimentId: string }>();
  const experimentId = params.experimentId;
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [packets, setPackets] = useState<DataPacket[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/experiments').then((response) => response.json()),
      fetch(`/api/packets?experimentId=${encodeURIComponent(experimentId)}&limit=500`).then((response) => response.json()),
    ]).then(([experimentsData, packetsData]) => {
      setExperiment((experimentsData.experiments || []).find((item: Experiment) => item.id === experimentId) || null);
      setPackets((packetsData.packets || []).sort((a: DataPacket, b: DataPacket) => a.createdAt - b.createdAt));
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
        <Link href={replayHref}><Button variant="accent" size="sm" className="gap-2"><Play className="w-3.5 h-3.5 fill-current" />{replayable ? 'Replay first prompt' : 'Open Lab for this experiment'}</Button></Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Runs</p><p className="font-mono text-lg mt-1">{experiment.runCount}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Packets</p><p className="font-mono text-lg mt-1">{experiment.packetCount}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Target</p><p className="font-mono text-xs mt-2 truncate">{experiment.modelTarget}</p></div><div className="rounded-lg border border-border/60 bg-card/50 p-3"><p className="text-muted-foreground">Status</p><Badge variant="amber" className="mt-2 font-mono">{experiment.status}</Badge></div></div>
      <section className="rounded-xl border border-border/60 bg-card/40 overflow-hidden"><div className="px-5 py-4 border-b border-border/50"><h2 className="text-sm font-semibold">Packet timeline</h2><p className="text-xs text-muted-foreground mt-1">A chronological trace of what was entered, run, and retained for this experiment.</p></div><div className="divide-y divide-border/40">{packets.map((packet) => <article key={packet.id} className="p-5 grid grid-cols-[auto_1fr] gap-4"><div className="mt-0.5"><Badge variant={packet.type === 'completion' ? 'amber' : 'purple'} className="font-mono text-[9px]">{packet.type}</Badge></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-mono">{packet.model}</span><span className="text-[10px] text-muted-foreground">{packet.provider}</span><span className="text-[10px] text-muted-foreground">{new Date(packet.createdAt).toLocaleString()}</span></div><pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed mt-2 max-h-48 overflow-auto">{typeof packet.output === 'string' && packet.type === 'completion' ? packet.output : typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input, null, 2)}</pre><div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground"><ShieldCheck className="w-3 h-3 text-[#C4956A]" />{packet.address?.kind || packet.type} · {packet.integrityHash?.slice(0, 14) || 'no digest'}</div></div></article>)}{packets.length === 0 && <p className="p-8 text-xs font-mono text-muted-foreground">No packets have been assigned to this experiment yet.</p>}</div></section>
    </> : <p className="text-sm text-muted-foreground">Loading experiment…</p>}
  </div>;
}
