'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { BookOpen, FlaskConical, Plus, Radio, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Experiment } from '@/lib/packets/types';

type Template = Pick<Experiment, 'title' | 'description' | 'category' | 'modelTarget'>;

const templates: Template[] = [
  {
    title: 'Mixed-provider reasoning comparison',
    description: 'Compare the same prompt across local Qwen and SmolLM. Record the prompt, parameters, outputs, human preference, and one thing that could make the result misleading.',
    category: 'benchmark', modelTarget: 'qwen3:4b + SmolLM2 135M',
  },
  {
    title: 'UAS packet provenance check',
    description: 'Test whether prompts, outputs, external context, and human annotations preserve an inspectable chain of addresses and integrity digests after export and replay.',
    category: 'rlhf', modelTarget: 'local packet ledger',
  },
  {
    title: 'Scientific reasoning audit',
    description: 'Ask a narrow scientific question, state the assumptions that matter, compare outputs, and label unsupported jumps or missing uncertainty rather than grading for confidence.',
    category: 'interpretability', modelTarget: 'qwen3:4b',
  },
  {
    title: 'Security instruction-conflict audit',
    description: 'Use synthetic, authorized prompts to test instruction following and prompt-injection resistance. Do not add real credentials, operational data, or sensitive material.',
    category: 'rlhf', modelTarget: 'qwen3:4b + SmolLM2 135M',
  },
];

const categories: Experiment['category'][] = ['general', 'benchmark', 'interpretability', 'bioactivity', 'rlhf', 'prompt_opt'];

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Experiment['category']>('general');
  const [modelTarget, setModelTarget] = useState('local-model');
  const [creating, setCreating] = useState(false);

  async function load() {
    const response = await fetch('/api/experiments');
    const data = await response.json();
    setExperiments(data.experiments || []);
  }
  useEffect(() => { load(); }, []);

  function chooseTemplate(template: Template) {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setModelTarget(template.modelTarget);
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    await fetch('/api/experiments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, modelTarget }),
    });
    setTitle(''); setDescription(''); setCategory('general'); setModelTarget('local-model');
    setCreating(false); load();
  }

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="border-b border-border/40 pb-6">
      <div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><BookOpen className="w-3.5 h-3.5" /> Your replayable work</div>
      <h1 className="text-3xl text-foreground font-bold tracking-tight">EXPERIMENT JOURNAL</h1>
      <p className="text-muted-foreground text-sm mt-2 max-w-3xl">An experiment groups model runs and packets around one question. A good entry says what was tested, what would count as a failure, and which records can replay the result.</p>
    </div>

    <section className="rounded-xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center gap-2"><WandSparkles className="w-4 h-4 text-[#C4956A]" /><h2 className="text-sm font-semibold">Start from a research template</h2></div>
      <p className="text-xs text-muted-foreground mt-1">Templates only prefill a plan. They do not create results or make a research claim.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">{templates.map((template) => <button key={template.title} onClick={() => chooseTemplate(template)} className="rounded-lg border border-border/60 bg-background/50 p-3 text-left hover:border-[#C4956A]/50 transition-colors"><p className="text-xs font-semibold">{template.title}</p><p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{template.description}</p><span className="inline-block mt-2 text-[10px] font-mono text-[#C4956A]">Use template →</span></button>)}</div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-[.7fr_1.3fr] gap-5">
      <form onSubmit={create} className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-4">
        <div className="flex items-center gap-2"><Plus className="w-4 h-4 text-[#C4956A]"/><h2 className="text-sm font-semibold">Start a journal entry</h2></div>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Experiment title" className="text-xs"/>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Question, method, and failure condition." rows={5} className="text-xs"/>
        <div className="grid grid-cols-2 gap-3"><select value={category} onChange={(event) => setCategory(event.target.value as Experiment['category'])} className="h-9 rounded-md border border-input bg-background px-3 text-xs">{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><Input value={modelTarget} onChange={(event) => setModelTarget(event.target.value)} placeholder="Model target" className="text-xs" /></div>
        <Button type="submit" variant="accent" disabled={creating}>{creating ? 'Creating...' : 'Create experiment'}</Button>
      </form>
      <div className="space-y-3">{experiments.map((experiment) => <Link href={`/experiments/${experiment.id}`} key={experiment.id} className="block rounded-xl border border-border/60 bg-card/50 p-5 hover:border-[#C4956A]/40 transition-colors"><article><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-[#C4956A]"/><h2 className="text-sm font-semibold">{experiment.title}</h2></div><p className="text-xs text-muted-foreground leading-relaxed mt-2">{experiment.description}</p></div><Badge variant={experiment.status === 'active' ? 'amber' : 'purple'} className="font-mono">{experiment.status}</Badge></div><div className="flex flex-wrap gap-4 mt-4 text-[10px] font-mono text-muted-foreground"><span>{experiment.modelTarget}</span><span>{experiment.packetCount} packets</span><span>{experiment.runCount} runs</span><span>updated {new Date(experiment.updatedAt).toLocaleDateString()}</span></div></article></Link>)}{experiments.length === 0 && <p className="text-sm text-muted-foreground">No experiments yet. Start with one question you can actually rerun.</p>}</div>
    </div>
  </div>;
}
