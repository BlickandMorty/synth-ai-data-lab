'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Scale, Tag, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DataPacket } from '@/lib/packets/types';

const dimensions = ['factualAccuracy', 'instructionFollowing', 'nuanceAndDepth', 'conciseness', 'safetyAndRobustness'] as const;
const promptValue = (packet?: DataPacket) => packet ? (typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input)) : '';
type QueueItem = { leftPacketId: string; rightPacketId: string; promptPreview: string; experimentId?: string };

export default function AnnotatePage() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [winner, setWinner] = useState<'chosen' | 'rejected' | 'tie'>('tie');
  const [scores, setScores] = useState<Record<(typeof dimensions)[number], number>>({ factualAccuracy: 3, instructionFollowing: 3, nuanceAndDepth: 3, conciseness: 3, safetyAndRobustness: 3 });
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    Promise.all([fetch('/api/packets?limit=300').then((response) => response.json()), fetch('/api/annotation/queue?limit=30').then((response) => response.json())]).then(([data, queueData]) => {
      const list = (data.packets || []).filter((packet: DataPacket) => packet.type === 'completion' && packet.output);
      setPackets(list);
      const items: QueueItem[] = queueData.items || [];
      setQueue(items);
      const query = new URLSearchParams(window.location.search);
      const requestedLeft = query.get('leftPacketId');
      const requestedRight = query.get('rightPacketId');
      const queued = items[0];
      const first = list.find((packet: DataPacket) => packet.id === requestedLeft) || list.find((packet: DataPacket) => packet.id === queued?.leftPacketId) || list[0];
      const second = list.find((packet: DataPacket) => packet.id === requestedRight) || list.find((packet: DataPacket) => packet.id === queued?.rightPacketId) || list.find((packet: DataPacket) => packet.id !== first?.id && promptValue(packet) === promptValue(first)) || list.find((packet: DataPacket) => packet.id !== first?.id);
      setLeftId(first?.id || ''); setRightId(second?.id || '');
    });
  }, []);

  const left = useMemo(() => packets.find((packet) => packet.id === leftId), [packets, leftId]);
  const right = useMemo(() => packets.find((packet) => packet.id === rightId), [packets, rightId]);
  const samePrompt = Boolean(left && right && promptValue(left) === promptValue(right));
  const hasSimulator = left?.provider === 'simulator' || right?.provider === 'simulator';
  const canSave = Boolean(left && right && left.id !== right.id && samePrompt && !hasSimulator);

  function loadQueueItem(item?: QueueItem) {
    if (!item) return;
    setLeftId(item.leftPacketId); setRightId(item.rightPacketId); setSaved(false); setError(''); setNotes('');
  }

  async function save() {
    setError(''); setSaved(false);
    if (!canSave || !left || !right) {
      setError(hasSimulator ? 'Simulator output is not eligible for a training preference pair.' : 'Choose two different completion packets with the exact same prompt.');
      return;
    }
    const response = await fetch('/api/annotate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packetId: left.id, annotator: 'local-researcher', rubricScores: scores, preference: winner, comparisonPairId: right.id, flawTags: [], justification: notes }) });
    const data = await response.json();
    if (data.success) {
      setSaved(true);
      setQueue((items) => items.filter((item) => item.leftPacketId !== left.id || item.rightPacketId !== right.id));
    } else setError(data.error || 'Could not save annotation.');
  }

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="border-b border-border/40 pb-6"><div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><Tag className="w-3.5 h-3.5" /> Human review layer</div><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl text-foreground font-bold tracking-tight">ANNOTATION STUDIO</h1><p className="text-muted-foreground text-sm mt-2 max-w-3xl">A preference pair is only useful when it compares two real completions for the same prompt. Scores and notes are separate review records, so original model output remains intact.</p></div><div className="flex items-center gap-2"><Badge variant="purple" className="font-mono">{queue.length} eligible pairs</Badge><Button variant="outline" size="sm" disabled={queue.length === 0} onClick={() => loadQueueItem(queue.find((item) => item.leftPacketId !== leftId || item.rightPacketId !== rightId) || queue[0])}>Next pair <ChevronRight className="w-3.5 h-3.5" /></Button></div></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="text-xs font-mono text-muted-foreground">LEFT COMPLETION<select value={leftId} onChange={(event) => { setLeftId(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground">{packets.map((packet) => <option key={packet.id} value={packet.id}>{packet.id.slice(-8)} — {packet.model}</option>)}</select></label><label className="text-xs font-mono text-muted-foreground">RIGHT COMPLETION<select value={rightId} onChange={(event) => { setRightId(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-lg border border-border bg-card p-2 text-xs text-foreground">{packets.map((packet) => <option key={packet.id} value={packet.id}>{packet.id.slice(-8)} — {packet.model}</option>)}</select></label></div>
    {(!samePrompt || hasSimulator) && <div className="rounded-lg border border-[#C4956A]/40 bg-[#C4956A]/10 p-3 flex gap-2 text-xs text-muted-foreground"><TriangleAlert className="w-4 h-4 text-[#C4956A] shrink-0" />{hasSimulator ? 'At least one selected output is a simulator placeholder. It can be inspected, but it cannot become training preference data.' : 'These packets do not have the same prompt. Compare matching outputs before creating a preference pair.'}</div>}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{[left, right].map((packet, index) => <article key={index} className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{index === 0 ? 'A' : 'B'}: {packet?.model || 'No packet selected'}</h2>{packet && <Badge variant={packet.provider === 'simulator' ? 'purple' : 'amber'} className="font-mono">{packet.provider}</Badge>}</div><p className="text-[10px] font-mono text-muted-foreground">PROMPT</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{promptValue(packet) || 'Choose a completion.'}</p><p className="text-[10px] font-mono text-muted-foreground">OUTPUT</p><pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto">{packet?.output ? (typeof packet.output === 'string' ? packet.output : JSON.stringify(packet.output, null, 2)) : 'No saved output.'}</pre></article>)}</div>
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-5"><div className="flex items-center gap-2"><Scale className="w-4 h-4 text-[#C4956A]" /><h2 className="text-sm font-semibold">Rubric and preference</h2></div><div className="grid grid-cols-1 sm:grid-cols-5 gap-3">{dimensions.map((dimension) => <label key={dimension} className="text-[10px] font-mono text-muted-foreground uppercase">{dimension.replace(/([A-Z])/g, ' $1')}<select value={scores[dimension]} onChange={(event) => setScores({ ...scores, [dimension]: Number(event.target.value) })} className="mt-2 w-full rounded-md border border-border bg-background p-2 text-xs text-foreground">{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label>)}</div><div className="flex flex-wrap gap-2">{(['chosen','rejected','tie'] as const).map((value) => <button key={value} onClick={() => setWinner(value)} className={`px-3 py-1.5 rounded-full text-xs border ${winner === value ? 'border-[#C4956A] bg-[#C4956A]/10 text-[#C4956A]' : 'border-border text-muted-foreground'}`}>{value === 'chosen' ? 'A is better' : value === 'rejected' ? 'B is better' : 'Tie / unclear'}</button>)}</div><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why? Mention evidence, missing detail, safety, or instruction-following." rows={3} className="text-xs"/>{error && <p className="text-xs text-[#C4956A]">{error}</p>}<Button onClick={save} variant="accent" disabled={!canSave} className="gap-2"><Check className="w-4 h-4" /> {saved ? 'Annotation saved' : 'Save eligible annotation'}</Button></div>
  </div>;
}
