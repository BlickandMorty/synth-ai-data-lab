'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Scale, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DataPacket } from '@/lib/packets/types';

const dimensions = ['factualAccuracy', 'instructionFollowing', 'nuanceAndDepth', 'conciseness', 'safetyAndRobustness'] as const;

export default function AnnotatePage() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [winner, setWinner] = useState<'chosen' | 'rejected' | 'tie'>('tie');
  const [scores, setScores] = useState<Record<(typeof dimensions)[number], number>>({ factualAccuracy: 3, instructionFollowing: 3, nuanceAndDepth: 3, conciseness: 3, safetyAndRobustness: 3 });
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch('/api/packets?limit=100').then((res) => res.json()).then((data) => { const list = (data.packets || []).filter((p: DataPacket) => p.output); setPackets(list); setLeftId(list[0]?.id || ''); setRightId(list[1]?.id || list[0]?.id || ''); }); }, []);
  const left = useMemo(() => packets.find((packet) => packet.id === leftId), [packets, leftId]);
  const right = useMemo(() => packets.find((packet) => packet.id === rightId), [packets, rightId]);

  async function save() {
    if (!left) return;
    await fetch('/api/annotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packetId: left.id, annotator: 'local-researcher', rubricScores: scores, preference: winner, comparisonPairId: right?.id, flawTags: [], justification: notes }) });
    setSaved(true);
  }

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="border-b border-border/40 pb-6"><div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><Tag className="w-3.5 h-3.5" /> Human review layer</div><h1 className="text-3xl text-foreground font-bold tracking-tight">ANNOTATION STUDIO</h1><p className="text-muted-foreground text-sm mt-2 max-w-3xl">Compare real or explicitly labeled simulator packets. Your rubric scores and notes are saved as separate review records, so original model output remains intact.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-xs font-mono text-muted-foreground">LEFT PACKET<select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground">{packets.map((p) => <option key={p.id} value={p.id}>{p.id.slice(-8)} - {p.model}</option>)}</select></label><label className="text-xs font-mono text-muted-foreground">RIGHT PACKET<select value={rightId} onChange={(e) => setRightId(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground">{packets.map((p) => <option key={p.id} value={p.id}>{p.id.slice(-8)} - {p.model}</option>)}</select></label></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{[left, right].map((packet, index) => <article key={index} className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{index === 0 ? 'A' : 'B'}: {packet?.model || 'No packet selected'}</h2>{packet && <Badge variant={packet.provider === 'simulator' ? 'purple' : 'amber'} className="font-mono">{packet.provider}</Badge>}</div><p className="text-[10px] font-mono text-muted-foreground">PROMPT</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{packet ? (typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input)) : 'Choose a packet.'}</p><p className="text-[10px] font-mono text-muted-foreground">OUTPUT</p><pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto">{packet?.output ? (typeof packet.output === 'string' ? packet.output : JSON.stringify(packet.output, null, 2)) : 'No saved output.'}</pre></article>)}</div>
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-5"><div className="flex items-center gap-2"><Scale className="w-4 h-4 text-[#C4956A]" /><h2 className="text-sm font-semibold">Rubric and preference</h2></div><div className="grid grid-cols-1 sm:grid-cols-5 gap-3">{dimensions.map((dimension) => <label key={dimension} className="text-[10px] font-mono text-muted-foreground uppercase">{dimension.replace(/([A-Z])/g, ' $1')}<select value={scores[dimension]} onChange={(e) => setScores({ ...scores, [dimension]: Number(e.target.value) })} className="mt-2 w-full rounded-md border border-border bg-background p-2 text-xs text-foreground">{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label>)}</div><div className="flex flex-wrap gap-2">{(['chosen','rejected','tie'] as const).map((value) => <button key={value} onClick={() => setWinner(value)} className={`px-3 py-1.5 rounded-full text-xs border ${winner === value ? 'border-[#C4956A] bg-[#C4956A]/10 text-[#C4956A]' : 'border-border text-muted-foreground'}`}>{value === 'chosen' ? 'A is better' : value === 'rejected' ? 'B is better' : 'Tie / unclear'}</button>)}</div><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why? Mention evidence, missing detail, safety, or instruction-following." rows={3} className="text-xs"/><Button onClick={save} variant="accent" className="gap-2"><Check className="w-4 h-4" /> {saved ? 'Annotation saved' : 'Save annotation'}</Button></div>
  </div>;
}
