'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FlaskConical, 
  Tag, 
  Layers, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Activity, 
  Cpu, 
  Database,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { DataPacket, Experiment } from '@/lib/packets/types';
import { formatDuration } from '@/lib/utils';

export default function DashboardPage() {
  const [packets, setPackets] = useState<DataPacket[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pktsRes, expsRes] = await Promise.all([
          fetch('/api/packets?limit=8'),
          fetch('/api/experiments'),
        ]);
        const pktsData = await pktsRes.json();
        const expsData = await expsRes.json();
        if (pktsData.packets) setPackets(pktsData.packets);
        if (expsData.experiments) setExperiments(expsData.experiments);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalTokensLogged = packets.reduce((acc, p) => acc + (p.tokens?.totalTokens || 0), 0);
  const avgLatency = packets.length > 0 
    ? Math.round(packets.reduce((acc, p) => acc + (p.latency?.totalLatencyMs || 0), 0) / packets.length) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="border-b border-border/40 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C4956A] mb-2 uppercase tracking-widest">
          <span>AI Rich Data Training Platform</span>
          <span>•</span>
          <span>Local Experiment Lab</span>
        </div>
        <h1 className="text-3xl sm:text-4xl text-foreground font-bold tracking-tight mb-3">
          SYNTH INTELLIGENCE LAB
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          High-nuance post-training platform and experimental canvas. Run local transformers, log every query and prompt as structured data packets, and curate fine-grained preference pairs for reinforcement learning.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-mono uppercase">Logged Packets</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {loading ? '...' : packets.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-[#C4956A]" />
            Indexed in local SQLite ledger
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-mono uppercase">Active Experiments</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-[#C4956A]">
              {loading ? '...' : experiments.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#C4956A]" />
            Interpretability & Bioactivity
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-mono uppercase">Avg Inference Latency</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-500">
              {loading ? '...' : `${avgLatency} ms`}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Measured in saved packets
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-mono uppercase">Tokens Processed</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-foreground">
              {loading ? '...' : totalTokensLogged}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-[#C4956A]" />
            Telemetry verified
          </CardContent>
        </Card>
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-[#C4956A]/30 bg-gradient-to-br from-card/80 to-[#C4956A]/5 hover:border-[#C4956A]/60 transition-all group">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-[#C4956A]/10 border border-[#C4956A]/30 flex items-center justify-center mb-2">
              <FlaskConical className="w-5 h-5 text-[#C4956A]" />
            </div>
            <CardTitle className="text-lg">Launch Data Lab</CardTitle>
            <CardDescription className="text-xs">
              Execute prompts against local Ollama models. If no model is running, SYNTH creates a clearly labeled simulator packet for interface testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/lab">
              <Button variant="accent" size="sm" className="gap-2">
                Open Lab Playground
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-foreground/20 transition-all group">
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-secondary border border-border/60 flex items-center justify-center mb-2">
              <Tag className="w-5 h-5 text-foreground" />
            </div>
            <CardTitle className="text-lg">Annotation Studio</CardTitle>
            <CardDescription className="text-xs">
              Perform side-by-side A/B evaluations, grade responses with a five-point rubric, and save preference records for later export.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/annotate">
              <Button variant="outline" size="sm" className="gap-2">
                Start Annotation Task
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Live Data Packet Ledger Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Live Data Packet Ledger</h2>
            <p className="text-xs text-muted-foreground">Recent structured interaction packets recorded to SQLite</p>
          </div>
          <Link href="/packets">
            <Button variant="ghost" size="sm" className="text-xs gap-1 font-mono">
              View All Packets
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="border border-border/60 rounded-xl bg-card/40 overflow-hidden">
          {packets.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              No packets logged yet. Launch the Data Lab to generate your first packet.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {packets.slice(0, 5).map((pkt) => (
                <div key={pkt.id} className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={pkt.type === 'completion' ? 'amber' : 'purple'} className="font-mono text-[10px]">
                      {pkt.type}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-foreground truncate max-w-md sm:max-w-lg">
                        {typeof pkt.input === 'string' ? pkt.input : JSON.stringify(pkt.input)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-mono">{pkt.model}</span>
                        <span>•</span>
                        <span className="font-mono">{pkt.provider}</span>
                        {pkt.latency && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-500">{formatDuration(pkt.latency.totalLatencyMs)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(pkt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
