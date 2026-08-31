'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, BookOpen, ExternalLink, GitBranch, Layers, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CANON_RESEARCH_PROJECTS } from '@/lib/research/catalog';

export default function ProjectsPage() {
  const [activity, setActivity] = useState<Record<string, { available: boolean; pushedAt?: string; defaultBranch?: string; error?: string }>>({});

  useEffect(() => {
    fetch('/api/projects/activity').then((response) => response.json()).then((data) => {
      if (!data.projects) return;
      setActivity(Object.fromEntries(data.projects.map((item: { repository: string; available: boolean; pushedAt?: string; defaultBranch?: string; error?: string }) => [item.repository, item])));
    }).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-border/40 pb-6">
        <p className="text-xs font-mono text-[#C4956A] uppercase tracking-widest mb-2">Master project map</p>
        <h1 className="text-3xl sm:text-4xl text-foreground font-bold tracking-tight">RESEARCH SYSTEM</h1>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed mt-3">
          This is the honest connection between the projects. SYNTH does not claim ownership of every repository: it is the local place to run, inspect, annotate, and preserve evidence when a project needs a real model evaluation.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3 border-[#C4956A]/30 bg-gradient-to-r from-card/70 to-[#C4956A]/5">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GitBranch className="w-4 h-4 text-[#C4956A]" /> How work moves through the system</CardTitle><CardDescription className="text-xs">A simple workflow, not a claim that every project has completed results.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['1', 'Choose a project question', 'Example: does a retrieval answer stay grounded?'],
              ['2', 'Run and capture', 'SYNTH saves prompt, context, output, model, and latency as packets.'],
              ['3', 'Review carefully', 'Compare matching outputs and write a real human preference or rubric score.'],
              ['4', 'Keep/export evidence', 'Replay the experiment later or export only validated reviewed pairs.'],
            ].map(([step, title, description]) => <div key={step} className="rounded-lg border border-border/50 bg-background/30 p-3"><span className="font-mono text-[#C4956A]">{step}</span><p className="font-semibold mt-1">{title}</p><p className="text-muted-foreground leading-relaxed mt-1">{description}</p></div>)}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div><h2 className="text-base font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-[#C4956A]" /> Canon projects</h2><p className="text-xs text-muted-foreground mt-1">Each card explains its actual role and the specific way it can connect to this lab.</p></div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {CANON_RESEARCH_PROJECTS.map((project) => (
            <Card key={project.name} className="border-border/60 bg-card/45 hover:border-[#C4956A]/45 transition-colors">
              <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{project.name}</CardTitle><p className="font-mono text-[10px] text-[#C4956A] mt-1">{project.role}</p></div><Badge variant="purple" className="font-mono text-[9px] shrink-0">{project.status}</Badge></div><CardDescription className="text-xs leading-relaxed mt-2">{project.description}</CardDescription></CardHeader>
              <CardContent className="space-y-3"><div className="rounded-lg bg-secondary/35 border border-border/40 p-3"><p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">Connection</p><p className="text-xs mt-1">{project.connection}</p><p className="text-xs text-muted-foreground leading-relaxed mt-2">{project.useInSynth}</p></div>{activity[project.repository] && <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono"><Activity className="w-3 h-3 text-[#C4956A]" />{activity[project.repository].available ? <>GitHub last pushed {activity[project.repository].pushedAt ? new Date(activity[project.repository].pushedAt!).toLocaleDateString() : 'at an unknown time'}{activity[project.repository].defaultBranch ? ` · ${activity[project.repository].defaultBranch}` : ''}</> : <>{activity[project.repository].error}</>}</div>}<a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#C4956A] hover:underline">Open repository <ExternalLink className="w-3 h-3" /></a></CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-border/60 bg-card/40"><CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#C4956A]" /> What counts as an experiment</CardTitle><CardDescription className="text-xs">A repeatable question with recorded inputs, model/config, outputs, and a human interpretation of what happened.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Link href="/experiments"><Button size="sm" variant="accent">Open experiment journal <ArrowRight className="w-3.5 h-3.5" /></Button></Link><Link href="/onboarding"><Button size="sm" variant="outline"><BookOpen className="w-3.5 h-3.5" /> Read the plain-language guide</Button></Link></CardContent></Card>
    </div>
  );
}
