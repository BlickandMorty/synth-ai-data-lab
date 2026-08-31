'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, FlaskConical, Plus, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Experiment } from '@/lib/packets/types';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() { const response = await fetch('/api/experiments'); const data = await response.json(); setExperiments(data.experiments || []); }
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent) { event.preventDefault(); if (!title.trim()) return; setCreating(true); await fetch('/api/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, category: 'general', modelTarget: 'local-model' }) }); setTitle(''); setDescription(''); setCreating(false); load(); }

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="border-b border-border/40 pb-6"><div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><BookOpen className="w-3.5 h-3.5" /> Your replayable work</div><h1 className="text-3xl text-foreground font-bold tracking-tight">EXPERIMENT JOURNAL</h1><p className="text-muted-foreground text-sm mt-2 max-w-3xl">An experiment groups model runs and packets around one question. A good entry says what was tested, what would count as a failure, and which records can replay the result.</p></div>
    <div className="grid grid-cols-1 xl:grid-cols-[.7fr_1.3fr] gap-5"><form onSubmit={create} className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4"><div className="flex items-center gap-2"><Plus className="w-4 h-4 text-[#C4956A]"/><h2 className="text-sm font-semibold">Start a journal entry</h2></div><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Experiment title" className="text-xs"/><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Question, method, and failure condition." rows={5} className="text-xs"/><Button type="submit" variant="accent" disabled={creating}>{creating ? 'Creating...' : 'Create experiment'}</Button></form>
      <div className="space-y-3">{experiments.map((experiment) => <article key={experiment.id} className="rounded-xl border border-border/60 bg-card/50 p-5 hover:border-[#C4956A]/40 transition-colors"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-[#C4956A]"/><h2 className="text-sm font-semibold">{experiment.title}</h2></div><p className="text-xs text-muted-foreground leading-relaxed mt-2">{experiment.description}</p></div><Badge variant={experiment.status === 'active' ? 'amber' : 'purple'} className="font-mono">{experiment.status}</Badge></div><div className="flex flex-wrap gap-4 mt-4 text-[10px] font-mono text-muted-foreground"><span>{experiment.modelTarget}</span><span>{experiment.packetCount} packets</span><span>{experiment.runCount} runs</span><span>updated {new Date(experiment.updatedAt).toLocaleDateString()}</span></div></article>)}{experiments.length === 0 && <p className="text-sm text-muted-foreground">No experiments yet. Start with one question you can actually rerun.</p>}</div></div>
  </div>;
}
