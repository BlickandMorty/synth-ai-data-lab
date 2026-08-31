'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Database, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Summary = {
  totalPackets: number;
  realCompletions: number;
  simulatorPackets: number;
  annotations: number;
  eligiblePreferencePairs: number;
  typeCounts: Record<string, number>;
  providerCounts: Record<string, number>;
  note: string;
};
type Preflight = { valid: boolean; records_checked: number; errors: Array<{ index: number; missing?: string[]; issue?: string }> };

export default function DatasetsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const response = await fetch('/api/datasets/summary');
    const data = await response.json();
    setSummary(data.summary || null);
  }
  useEffect(() => { load(); }, []);

  async function runPreflight() {
    setChecking(true); setError(''); setPreflight(null);
    try {
      const response = await fetch('/api/datasets/preflight', { method: 'POST' });
      const data = await response.json();
      if (data.success) setPreflight(data.result); else setError(data.error || 'Preflight could not run.');
    } catch { setError('Preflight could not run.'); } finally { setChecking(false); }
  }

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="border-b border-border/40 pb-6"><div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest"><ClipboardCheck className="w-3.5 h-3.5" /> Training-data review</div><h1 className="text-3xl text-foreground font-bold tracking-tight">DATASET REVIEW</h1><p className="text-muted-foreground text-sm mt-2 max-w-3xl">This page separates what was logged from what is eligible for later preference training. Passing preflight checks packet structure and stated provenance; it does not prove factual correctness, consent, or licensing.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[
      ['All packets', summary?.totalPackets], ['Real completions', summary?.realCompletions], ['Annotations', summary?.annotations], ['Eligible pairs', summary?.eligiblePreferencePairs], ['Simulator excluded', summary?.simulatorPackets],
    ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border/60 bg-card/50 p-4"><p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p><p className="text-2xl font-mono mt-2">{summary ? value : '…'}</p></div>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><section className="rounded-xl border border-border/60 bg-card/50 p-5"><div className="flex items-center gap-2"><Database className="w-4 h-4 text-[#C4956A]"/><h2 className="text-sm font-semibold">What is in the ledger</h2></div><div className="mt-4 space-y-3">{summary && <><div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Packet types</p><div className="flex flex-wrap gap-2">{Object.entries(summary.typeCounts).map(([type, count]) => <Badge key={type} variant="purple" className="font-mono">{type} · {count}</Badge>)}</div></div><div><p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Execution sources</p><div className="flex flex-wrap gap-2">{Object.entries(summary.providerCounts).map(([provider, count]) => <Badge key={provider} variant={provider === 'simulator' ? 'purple' : 'amber'} className="font-mono">{provider} · {count}</Badge>)}</div></div><p className="text-xs text-muted-foreground leading-relaxed">{summary.note}</p></>}</div></section>
      <section className="rounded-xl border border-[#C4956A]/30 bg-[#C4956A]/5 p-5"><h2 className="text-sm font-semibold">Packet preflight</h2><p className="text-xs text-muted-foreground mt-2">Send the current exported packet records to the local Python engine. It checks required SYNTH packet fields and flags simulator output before you reuse the data.</p><Button variant="accent" size="sm" onClick={runPreflight} disabled={checking} className="mt-4 gap-2">{checking ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking…</> : 'Run local preflight'}</Button>{preflight && <div className="mt-4 rounded-lg bg-card/70 border border-border/60 p-3 text-xs"><div className="flex items-center gap-2"><CheckCircle2 className={`w-4 h-4 ${preflight.valid ? 'text-emerald-500' : 'text-[#C4956A]'}`} /><span className="font-semibold">{preflight.valid ? 'Structure passed' : 'Issues found'}</span></div><p className="mt-2 text-muted-foreground">Checked {preflight.records_checked} records. {preflight.errors.length ? `${preflight.errors.length} issue(s) need review.` : 'No structural issues reported.'}</p></div>}{error && <div className="mt-4 flex gap-2 text-xs text-[#C4956A]"><TriangleAlert className="w-4 h-4 shrink-0" />{error}</div>}</section></div>
    <div className="flex flex-wrap gap-2"><a href="/api/export?format=packets"><Button variant="outline" size="sm">Export all packets JSONL</Button></a><a href="/api/export?format=preferences"><Button variant="outline" size="sm">Export eligible preference pairs JSONL</Button></a><Button variant="ghost" size="sm" onClick={load}>Refresh counts</Button></div>
  </div>;
}
