'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Hash, SendHorizontal, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataPacket, PacketType } from '@/lib/packets/types';
import { Experiment } from '@/lib/packets/types';

const packetTypes: Array<PacketType | 'all'> = ['all', 'prompt', 'completion', 'comparison', 'preference_pair', 'red_team', 'search_query', 'tool_call', 'classification', 'causal_trace', 'eval_rubric'];
const captureTypes: PacketType[] = ['search_query', 'tool_call', 'red_team', 'classification', 'causal_trace', 'eval_rubric'];

export default function PacketsPage() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [filter, setFilter] = useState<(typeof packetTypes)[number]>('all');
  const [selected, setSelected] = useState<DataPacket | null>(null);
  const [captureType, setCaptureType] = useState<PacketType>('search_query');
  const [captureInput, setCaptureInput] = useState('');
  const [captureOutput, setCaptureOutput] = useState('');
  const [captureTags, setCaptureTags] = useState('');
  const [captureSource, setCaptureSource] = useState('');
  const [captureExperimentId, setCaptureExperimentId] = useState('');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/packets?limit=200').then((res) => res.json()), fetch('/api/experiments').then((res) => res.json())]).then(([packetData, experimentData]) => {
      setPackets(packetData.packets || []);
      setExperiments(experimentData.experiments || []);
    });
  }, []);

  const visible = useMemo(() => filter === 'all' ? packets : packets.filter((packet) => packet.type === filter), [filter, packets]);

  async function capturePacket() {
    if (!captureInput.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/packets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: captureType,
          source: 'user',
          model: 'external-context',
          provider: 'local',
          input: captureInput,
          output: captureOutput || undefined,
          experimentId: captureExperimentId || undefined,
          metadata: { captureMethod: 'packet-explorer-manual-entry', sourceLocator: captureSource || undefined, userVerified: false },
          tags: captureTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPackets((current) => [data.packet, ...current]);
        setSelected(data.packet);
        setCaptureInput(''); setCaptureOutput(''); setCaptureTags(''); setCaptureSource('');
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-border/40 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><Database className="w-3.5 h-3.5" /> Local packet ledger</div>
        <h1 className="text-3xl text-foreground font-bold tracking-tight">PACKET EXPLORER</h1>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">Every interaction is stored as a reviewable record. A UAS address says what kind of packet it is, what content it represents, where it came from, and which revision is being viewed.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {packetTypes.map((type) => <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1.5 rounded-full text-[11px] font-mono border transition-colors ${filter === type ? 'bg-[#C4956A]/15 border-[#C4956A]/50 text-[#C4956A]' : 'border-border/60 text-muted-foreground hover:bg-secondary'}`}>{type}</button>)}
      </div>

      <section className="rounded-xl border border-[#C4956A]/30 bg-[#C4956A]/5 p-5 space-y-3">
        <div><h2 className="text-sm font-semibold">Capture external research context</h2><p className="text-xs text-muted-foreground mt-1">Log a search query, tool result, red-team transcript, or research observation as a typed packet. This is a record of what you entered, not a claim that SYNTH independently verified it.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-3"><select value={captureType} onChange={(event) => setCaptureType(event.target.value as PacketType)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">{captureTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><Input value={captureTags} onChange={(event) => setCaptureTags(event.target.value)} placeholder="Optional tags, comma separated" className="text-xs" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><Input value={captureSource} onChange={(event) => setCaptureSource(event.target.value)} placeholder="Source URL, local path, or citation note (recommended)" className="text-xs font-mono" /><select value={captureExperimentId} onChange={(event) => setCaptureExperimentId(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="">Not attached to an experiment</option>{experiments.map((experiment) => <option key={experiment.id} value={experiment.id}>{experiment.title}</option>)}</select></div>
        <Textarea value={captureInput} onChange={(event) => setCaptureInput(event.target.value)} placeholder="Query, tool input, observation, or transcript you want to preserve" rows={3} className="text-xs font-mono" />
        <Textarea value={captureOutput} onChange={(event) => setCaptureOutput(event.target.value)} placeholder="Optional result, answer, or observation" rows={2} className="text-xs font-mono" />
        <Button variant="accent" size="sm" disabled={saving || !captureInput.trim()} onClick={capturePacket} className="gap-2"><SendHorizontal className="w-3.5 h-3.5" />{saving ? 'Saving packet...' : 'Capture typed packet'}</Button>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_.7fr] gap-5">
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card/40">
          <div className="grid grid-cols-[100px_1fr_130px] gap-3 px-4 py-3 border-b border-border/50 text-[10px] font-mono text-muted-foreground uppercase"><span>Type</span><span>Input / model</span><span>Recorded</span></div>
          <div className="divide-y divide-border/40">
            {visible.map((packet) => <button key={packet.id} onClick={() => setSelected(packet)} className={`w-full text-left grid grid-cols-[100px_1fr_130px] gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors ${selected?.id === packet.id ? 'bg-[#C4956A]/8' : ''}`}>
              <Badge variant={packet.type === 'completion' ? 'amber' : 'purple'} className="w-fit font-mono text-[9px]">{packet.type}</Badge>
              <div className="min-w-0"><p className="text-xs truncate">{typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input)}</p><p className="text-[10px] font-mono text-muted-foreground mt-1">{packet.model} · {packet.provider}</p></div>
              <span className="text-[10px] font-mono text-muted-foreground">{new Date(packet.createdAt).toLocaleString()}</span>
            </button>)}
            {visible.length === 0 && <p className="p-8 text-center text-xs font-mono text-muted-foreground">No packets match this filter.</p>}
          </div>
        </div>

        <aside className="rounded-xl border border-border/60 bg-card/50 p-5 min-h-72">
          {selected ? <div className="space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Packet detail</h2><Badge variant="amber" className="font-mono">v{selected.schemaVersion || 1}</Badge></div>
            <div className="rounded-lg bg-secondary/60 p-3"><p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">UAS address</p><p className="text-[11px] font-mono break-all">{selected.address ? `${selected.address.kind}/${selected.address.contentDigest.slice(0, 16)}/${selected.address.sourceFamily}/r${selected.address.revision}` : 'Legacy packet - no address saved'}</p></div>
            <div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Input</p><pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{typeof selected.input === 'string' ? selected.input : JSON.stringify(selected.input, null, 2)}</pre></div>
            {selected.output && <div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Output</p><pre className="text-xs whitespace-pre-wrap font-mono text-foreground max-h-64 overflow-auto">{typeof selected.output === 'string' ? selected.output : JSON.stringify(selected.output, null, 2)}</pre></div>}
            {Boolean(selected.metadata?.sourceLocator) && <div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Recorded source</p><p className="text-xs font-mono break-all text-muted-foreground">{String(selected.metadata?.sourceLocator)}</p></div>}
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-[#C4956A]" /><span>Integrity digest: <span className="font-mono">{selected.integrityHash?.slice(0, 18) || 'not available'}</span></span></div>
          </div> : <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2"><Hash className="w-6 h-6 text-[#C4956A]" /><p className="text-xs">Choose a packet to inspect its input, output, address, and provenance.</p></div>}
        </aside>
      </div>
    </div>
  );
}
