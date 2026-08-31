import { db } from '@/lib/db';
import { packets, annotations, experiments, experimentRuns } from '@/lib/db/schema';
import { DataPacket, PacketAnnotation, Experiment, ExperimentRun } from './types';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import { createHash } from 'crypto';

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function logPacket(packetData: Omit<DataPacket, 'id' | 'createdAt'>): Promise<DataPacket> {
  const newPacket: DataPacket = {
    ...packetData,
    id: generateId('pkt'),
    createdAt: Date.now(),
  };
  const contentDigest = digest({
    type: newPacket.type,
    source: newPacket.source,
    input: newPacket.input,
    output: newPacket.output,
    metadata: newPacket.metadata,
  });
  newPacket.address ??= {
    kind: newPacket.type,
    contentDigest,
    sourceFamily: newPacket.source,
    revision: 1,
  };
  newPacket.integrityHash ??= digest({
    address: newPacket.address,
    model: newPacket.model,
    provider: newPacket.provider,
    input: newPacket.input,
    output: newPacket.output,
    createdAt: newPacket.createdAt,
  });
  newPacket.schemaVersion ??= 1;

  db.insert(packets).values({
    id: newPacket.id,
    runId: newPacket.runId || null,
    experimentId: newPacket.experimentId || null,
    type: newPacket.type,
    source: newPacket.source,
    model: newPacket.model,
    provider: newPacket.provider,
    input: typeof newPacket.input === 'string' ? newPacket.input : JSON.stringify(newPacket.input),
    output: newPacket.output ? (typeof newPacket.output === 'string' ? newPacket.output : JSON.stringify(newPacket.output)) : null,
    metadata: newPacket.metadata ? JSON.stringify(newPacket.metadata) : null,
    tokens: newPacket.tokens ? JSON.stringify(newPacket.tokens) : null,
    latency: newPacket.latency ? JSON.stringify(newPacket.latency) : null,
    tags: JSON.stringify(newPacket.tags || []),
    address: JSON.stringify(newPacket.address),
    integrityHash: newPacket.integrityHash,
    parentPacketId: newPacket.parentPacketId || null,
    schemaVersion: newPacket.schemaVersion,
    createdAt: newPacket.createdAt,
  }).run();

  if (newPacket.experimentId) {
    const exp = db.select().from(experiments).where(eq(experiments.id, newPacket.experimentId)).get();
    if (exp) {
      db.update(experiments)
        .set({
          packetCount: exp.packetCount + 1,
          runCount: exp.runCount + (newPacket.type === 'prompt' ? 1 : 0),
          updatedAt: Date.now(),
        })
        .where(eq(experiments.id, newPacket.experimentId))
        .run();
    }
  }

  return newPacket;
}

export function getAllPackets(limit = 100): DataPacket[] {
  const rows = db.select().from(packets).orderBy(desc(packets.createdAt)).limit(limit).all();
  return rows.map(r => ({
    id: r.id,
    runId: r.runId || undefined,
    experimentId: r.experimentId || undefined,
    type: r.type as any,
    source: r.source as any,
    model: r.model,
    provider: r.provider as any,
    input: safeParse(r.input),
    output: r.output ? safeParse(r.output) : undefined,
    metadata: r.metadata ? safeParse(r.metadata) : undefined,
    tokens: r.tokens ? safeParse(r.tokens) : undefined,
    latency: r.latency ? safeParse(r.latency) : undefined,
    address: r.address ? safeParse(r.address) : undefined,
    integrityHash: r.integrityHash || undefined,
    parentPacketId: r.parentPacketId || undefined,
    schemaVersion: r.schemaVersion || 1,
    tags: safeParse(r.tags) || [],
    createdAt: r.createdAt,
  }));
}

export function getPacketsForExperiment(experimentId: string, limit = 500): DataPacket[] {
  const rows = db.select().from(packets)
    .where(eq(packets.experimentId, experimentId))
    .orderBy(desc(packets.createdAt))
    .limit(limit)
    .all();
  return rows.map(r => ({
    id: r.id,
    runId: r.runId || undefined,
    experimentId: r.experimentId || undefined,
    type: r.type as any,
    source: r.source as any,
    model: r.model,
    provider: r.provider as any,
    input: safeParse(r.input),
    output: r.output ? safeParse(r.output) : undefined,
    metadata: r.metadata ? safeParse(r.metadata) : undefined,
    tokens: r.tokens ? safeParse(r.tokens) : undefined,
    latency: r.latency ? safeParse(r.latency) : undefined,
    address: r.address ? safeParse(r.address) : undefined,
    integrityHash: r.integrityHash || undefined,
    parentPacketId: r.parentPacketId || undefined,
    schemaVersion: r.schemaVersion || 1,
    tags: safeParse(r.tags) || [],
    createdAt: r.createdAt,
  }));
}

export function getPacketById(id: string): (DataPacket & { annotations?: PacketAnnotation[] }) | null {
  const row = db.select().from(packets).where(eq(packets.id, id)).get();
  if (!row) return null;

  const annRows = db.select().from(annotations).where(eq(annotations.packetId, id)).all();
  const parsedAnnotations: PacketAnnotation[] = annRows.map(a => ({
    id: a.id,
    packetId: a.packetId,
    annotator: a.annotator,
    rubricScores: safeParse(a.rubricScores),
    preference: a.preference as any,
    comparisonPairId: a.comparisonPairId || undefined,
    flawTags: safeParse(a.flawTags) || [],
    justification: a.justification || undefined,
    revisedOutput: a.revisedOutput || undefined,
    createdAt: a.createdAt,
  }));

  return {
    id: row.id,
    runId: row.runId || undefined,
    experimentId: row.experimentId || undefined,
    type: row.type as any,
    source: row.source as any,
    model: row.model,
    provider: row.provider as any,
    input: safeParse(row.input),
    output: row.output ? safeParse(row.output) : undefined,
    metadata: row.metadata ? safeParse(row.metadata) : undefined,
    tokens: row.tokens ? safeParse(row.tokens) : undefined,
    latency: row.latency ? safeParse(row.latency) : undefined,
    address: row.address ? safeParse(row.address) : undefined,
    integrityHash: row.integrityHash || undefined,
    parentPacketId: row.parentPacketId || undefined,
    schemaVersion: row.schemaVersion || 1,
    tags: safeParse(row.tags) || [],
    createdAt: row.createdAt,
    annotations: parsedAnnotations,
  };
}

export function saveAnnotation(annotationData: Omit<PacketAnnotation, 'id' | 'createdAt'>): PacketAnnotation {
  const newAnn: PacketAnnotation = {
    ...annotationData,
    id: generateId('ann'),
    createdAt: Date.now(),
  };

  db.insert(annotations).values({
    id: newAnn.id,
    packetId: newAnn.packetId,
    annotator: newAnn.annotator,
    rubricScores: JSON.stringify(newAnn.rubricScores),
    preference: newAnn.preference || null,
    comparisonPairId: newAnn.comparisonPairId || null,
    flawTags: JSON.stringify(newAnn.flawTags || []),
    justification: newAnn.justification || null,
    revisedOutput: newAnn.revisedOutput || null,
    createdAt: newAnn.createdAt,
  }).run();

  return newAnn;
}

export function getAllExperiments(): Experiment[] {
  const rows = db.select().from(experiments).orderBy(desc(experiments.updatedAt)).all();
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category as any,
    status: r.status as any,
    modelTarget: r.modelTarget,
    runCount: r.runCount,
    packetCount: r.packetCount,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export function exportPacketsAsJsonl(): string {
  return getAllPackets(10000).map((packet) => JSON.stringify({
    schema: 'synth.packet.v1',
    ...packet,
  })).join('\n');
}

export function exportPreferencePairsAsJsonl(): string {
  const rows = db.select().from(annotations).all();
  const records: string[] = [];

  for (const row of rows) {
    if (!row.comparisonPairId || !row.preference || row.preference === 'tie') continue;
    const primary = getPacketById(row.packetId);
    const comparison = getPacketById(row.comparisonPairId);
    if (!primary || !comparison || !primary.output || !comparison.output) continue;
    if (primary.metadata?.syntheticOutput || comparison.metadata?.syntheticOutput) continue;

    const primaryOutput = typeof primary.output === 'string' ? primary.output : JSON.stringify(primary.output);
    const comparisonOutput = typeof comparison.output === 'string' ? comparison.output : JSON.stringify(comparison.output);
    const primaryInput = typeof primary.input === 'string' ? primary.input : JSON.stringify(primary.input);
    const chosenIsPrimary = row.preference === 'chosen';

    records.push(JSON.stringify({
      schema: 'synth.preference.v1',
      prompt: primaryInput,
      chosen: chosenIsPrimary ? primaryOutput : comparisonOutput,
      rejected: chosenIsPrimary ? comparisonOutput : primaryOutput,
      sourcePacketIds: [primary.id, comparison.id],
      rubricScores: safeParse(row.rubricScores),
      flawTags: safeParse(row.flawTags) || [],
      justification: row.justification || undefined,
      note: 'Human-reviewed local SYNTH preference pair. Inspect the source packet addresses before using for training.',
    }));
  }

  return records.join('\n');
}

export function seedDemoDataIfEmpty() {
  const existingExp = db.select().from(experiments).all();
  if (existingExp.length > 0) return;

  const now = Date.now();
  const demoExperiments: Experiment[] = [
    {
      id: 'exp_mech_interp_01',
      title: 'Mechanistic Induction Heads & Attention Routing',
      description: 'Isolating induction heads in 2-layer attention-only toy transformers and measuring indirect effect of circuit ablation on multi-token sequence continuation.',
      category: 'interpretability',
      status: 'active',
      modelTarget: 'toy-transformer-2l',
      runCount: 4,
      packetCount: 18,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 3600000,
    },
    {
      id: 'exp_bioactivity_curation',
      title: 'Assay Kinetics & Cheng-Prusoff IC50/Ki Normalization',
      description: 'Validating enzyme inhibition curves, target binding affinity conversions (Ki = IC50 / (1 + [S]/Km)), and spotting subtle hallucinated assay conditions in ChEMBL bioactivity records.',
      category: 'bioactivity',
      status: 'active',
      modelTarget: 'qwen2.5-coder / llama-3.3',
      runCount: 7,
      packetCount: 32,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 7200000,
    },
    {
      id: 'exp_uas_storage_spine',
      title: 'UAS (Unified Address Space) Replayable Packets Protocol',
      description: 'Formalizing state packets, delta proofs, and deterministic replay traces for research reproducibility across native Windows / Linux environments.',
      category: 'rlhf',
      status: 'active',
      modelTarget: 'ollama/llama3.2',
      runCount: 3,
      packetCount: 12,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 1800000,
    }
  ];

  for (const exp of demoExperiments) {
    db.insert(experiments).values({
      id: exp.id,
      title: exp.title,
      description: exp.description,
      category: exp.category,
      status: exp.status,
      modelTarget: exp.modelTarget,
      runCount: exp.runCount,
      packetCount: exp.packetCount,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
    }).run();
  }

  // Seed sample rich packets
  const samplePackets = [
    {
      id: 'pkt_sample_01',
      experimentId: 'exp_bioactivity_curation',
      type: 'prompt' as const,
      source: 'user' as const,
      model: 'llama3.2:3b',
      provider: 'ollama' as const,
      input: 'Given an assay with [S] = 5 mM and substrate Km = 2.5 mM, an experimental IC50 of 42 nM is observed against EGFR kinase. Calculate the true Ki and identify any assumptions made.',
      output: 'Using the Cheng-Prusoff equation for competitive inhibition:\n\nKi = IC50 / (1 + [S] / Km)\n\nGiven:\n- IC50 = 42 nM\n- [S] = 5 mM\n- Km = 2.5 mM\n\nCalculation:\nKi = 42 / (1 + 5 / 2.5) = 42 / (1 + 2) = 42 / 3 = 14.0 nM\n\nAssumptions required:\n1. Mutually exclusive competitive binding.\n2. Enzyme concentration [E] << IC50 (tight binding corrections not needed).\n3. Reversible equilibrium kinetics.',
      metadata: { domain: 'Pharmacology', equation: 'Cheng-Prusoff', confidence: 0.98 },
      tokens: { promptTokens: 48, completionTokens: 142, totalTokens: 190 },
      latency: { totalLatencyMs: 420, timeToFirstTokenMs: 85, tokensPerSec: 33.8 },
      tags: ['bioactivity', 'kinetics', 'cheng-prusoff', 'egfr'],
      createdAt: now - 3600000 * 4,
    },
    {
      id: 'pkt_sample_02',
      experimentId: 'exp_mech_interp_01',
      type: 'comparison' as const,
      source: 'evaluator' as const,
      model: 'qwen2.5:7b vs mistral-nemo',
      provider: 'local' as const,
      input: 'Explain how attention head L1H4 copies token A when preceded by pattern [A][B] ... [A] -> ? in an indirect induction circuit.',
      output: 'Model A explains the QK circuit matching previous token position with current token, followed by OV circuit projecting the subsequent token value. Model B vaguely mentions pattern matching without distinguishing QK vs OV subspace operations.',
      metadata: { arenaMode: 'side-by-side', preferenceWinner: 'model_a' },
      tokens: { promptTokens: 38, completionTokens: 210, totalTokens: 248 },
      latency: { totalLatencyMs: 650, timeToFirstTokenMs: 110, tokensPerSec: 32.3 },
      tags: ['mech-interp', 'induction-heads', 'qk-circuit', 'ov-circuit'],
      createdAt: now - 3600000 * 2,
    }
  ];

  for (const pkt of samplePackets) {
    db.insert(packets).values({
      id: pkt.id,
      experimentId: pkt.experimentId,
      type: pkt.type,
      source: pkt.source,
      model: pkt.model,
      provider: pkt.provider,
      input: pkt.input,
      output: pkt.output,
      metadata: JSON.stringify(pkt.metadata),
      tokens: JSON.stringify(pkt.tokens),
      latency: JSON.stringify(pkt.latency),
      tags: JSON.stringify(pkt.tags),
      createdAt: pkt.createdAt,
    }).run();
  }
}

function safeParse(str: string | null): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
