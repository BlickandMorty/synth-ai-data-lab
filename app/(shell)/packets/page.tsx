'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Filter, Hash, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataPacket, PacketType } from '@/lib/packets/types';

const packetTypes: Array<PacketType | 'all'> = ['all', 'prompt', 'completion', 'comparison', 'preference_pair', 'red_team', 'search_query'];

export default function PacketsPage() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [filter, setFilter] = useState<(typeof packetTypes)[number]>('all');
  const [selected, setSelected] = useState<DataPacket | null>(null);

  useEffect(() => {
    fetch('/api/packets?limit=200').then((res) => res.json()).then((data) => setPackets(data.packets || []));
  }, []);

  const visible = useMemo(() => filter === 'all' ? packets : packets.filter((packet) => packet.type === filter), [filter, packets]);

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
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-[#C4956A]" /><span>Integrity digest: <span className="font-mono">{selected.integrityHash?.slice(0, 18) || 'not available'}</span></span></div>
          </div> : <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2"><Hash className="w-6 h-6 text-[#C4956A]" /><p className="text-xs">Choose a packet to inspect its input, output, address, and provenance.</p></div>}
        </aside>
      </div>
    </div>
  );
}
