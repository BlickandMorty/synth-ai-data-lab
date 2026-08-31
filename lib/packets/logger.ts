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
          updatedAt: Date.now(),
        })
        .where(eq(experiments.id, newPacket.experimentId))
        .run();
    }
  }

  return newPacket;
}

export function createExperimentRun(data: {
  experimentId: string;
  name: string;
  model: string;
  provider: string;
  parameters: ExperimentRun['parameters'];
  startedAt?: number;
}): ExperimentRun {
  const startedAt = data.startedAt || Date.now();
  const run: ExperimentRun = {
    id: generateId('run'),
    experimentId: data.experimentId,
    name: data.name,
    model: data.model,
    provider: data.provider,
    parameters: data.parameters,
    metrics: { totalPackets: 0, avgLatencyMs: 0 },
    status: 'running',
    startedAt,
  };
  db.insert(experimentRuns).values({
    id: run.id,
    experimentId: run.experimentId,
    name: run.name,
    model: run.model,
    provider: run.provider,
    parameters: JSON.stringify(run.parameters),
    metrics: JSON.stringify(run.metrics),
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: null,
  }).run();

  const experiment = db.select().from(experiments).where(eq(experiments.id, run.experimentId)).get();
  if (experiment) {
    db.update(experiments)
      .set({ runCount: experiment.runCount + 1, updatedAt: Date.now() })
      .where(eq(experiments.id, run.experimentId))
      .run();
  }
  return run;
}

export function completeExperimentRun(runId: string, metrics: ExperimentRun['metrics'], status: ExperimentRun['status'] = 'completed') {
  db.update(experimentRuns).set({
    metrics: JSON.stringify(metrics),
    status,
    finishedAt: Date.now(),
  }).where(eq(experimentRuns.id, runId)).run();
}

export function getRunsForExperiment(experimentId: string): ExperimentRun[] {
  return db.select().from(experimentRuns)
    .where(eq(experimentRuns.experimentId, experimentId))
    .orderBy(desc(experimentRuns.startedAt))
    .all()
    .map((row) => ({
      id: row.id,
      experimentId: row.experimentId,
      name: row.name,
      model: row.model,
      provider: row.provider,
      parameters: safeParse(row.parameters),
      metrics: safeParse(row.metrics),
      status: row.status as ExperimentRun['status'],
      startedAt: row.startedAt,
      finishedAt: row.finishedAt || undefined,
    }));
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

export type AnnotationQueueItem = {
  leftPacketId: string;
  rightPacketId: string;
  promptPreview: string;
  experimentId?: string;
};

function normalizedPacketInput(packet: DataPacket) {
  return typeof packet.input === 'string' ? packet.input : JSON.stringify(packet.input);
}

function pairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(':');
}

export function getAnnotationQueue(limit = 30): AnnotationQueueItem[] {
  const realCompletions = getAllPackets(10000).filter((packet) => packet.type === 'completion' && Boolean(packet.output) && packet.provider !== 'simulator');
  const reviewedPairs = new Set(db.select().from(annotations).all().filter((row) => row.comparisonPairId).map((row) => pairKey(row.packetId, row.comparisonPairId!)));
  const byPrompt = new Map<string, DataPacket[]>();
  for (const packet of realCompletions) {
    const key = normalizedPacketInput(packet);
    byPrompt.set(key, [...(byPrompt.get(key) || []), packet]);
  }

  const items: AnnotationQueueItem[] = [];
  for (const [prompt, group] of byPrompt.entries()) {
    const ordered = [...group].sort((a, b) => b.createdAt - a.createdAt);
    for (let index = 0; index < ordered.length; index += 1) {
      const left = ordered[index];
      const right = ordered.slice(index + 1).find((candidate) => candidate.model !== left.model || candidate.provider !== left.provider);
      if (!right || reviewedPairs.has(pairKey(left.id, right.id))) continue;
      items.push({ leftPacketId: left.id, rightPacketId: right.id, promptPreview: prompt.slice(0, 180), experimentId: left.experimentId || right.experimentId });
      break;
    }
  }
  return items.sort((a, b) => (b.experimentId || '').localeCompare(a.experimentId || '')).slice(0, limit);
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

export function getDatasetSummary() {
  const allPackets = getAllPackets(10000);
  const annotationRows = db.select().from(annotations).all();
  const realCompletions = allPackets.filter((packet) => packet.type === 'completion' && packet.provider !== 'simulator');
  const simulatorPackets = allPackets.filter((packet) => packet.provider === 'simulator');
  const typeCounts = allPackets.reduce<Record<string, number>>((counts, packet) => {
    counts[packet.type] = (counts[packet.type] || 0) + 1;
    return counts;
  }, {});
  const providerCounts = allPackets.reduce<Record<string, number>>((counts, packet) => {
    counts[packet.provider] = (counts[packet.provider] || 0) + 1;
    return counts;
  }, {});
  const preferencePairs = exportPreferencePairsAsJsonl().split('\n').filter(Boolean).length;
  return {
    totalPackets: allPackets.length,
    realCompletions: realCompletions.length,
    simulatorPackets: simulatorPackets.length,
    annotations: annotationRows.length,
    eligiblePreferencePairs: preferencePairs,
    typeCounts,
    providerCounts,
    note: 'Eligible preference pairs exclude simulator output and require matching real completion packets.',
  };
}

export function getExperimentEvaluationSummary(experimentId: string) {
  const experimentPackets = getPacketsForExperiment(experimentId, 10000);
  const packetIds = new Set(experimentPackets.map((packet) => packet.id));
  const related = db.select().from(annotations).all().filter((row) => packetIds.has(row.packetId));
  const rubricNames: Array<keyof PacketAnnotation['rubricScores']> = ['factualAccuracy', 'instructionFollowing', 'nuanceAndDepth', 'conciseness', 'safetyAndRobustness'];
  const averages = Object.fromEntries(rubricNames.map((name) => {
    const values = related.map((row) => safeParse(row.rubricScores)?.[name]).filter((value): value is number => typeof value === 'number');
    return [name, values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null];
  }));
  const preferences = related.reduce<Record<string, number>>((counts, row) => {
    const key = row.preference || 'unranked';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  return {
    annotations: related.length,
    preferences,
    rubricAverages: averages,
    note: 'Averages summarize local reviewer scores; they are not an objective measure of model capability.',
  };
}

export function exportDatasetManifest() {
  const packetJsonl = exportPacketsAsJsonl();
  const preferenceJsonl = exportPreferencePairsAsJsonl();
  return {
    schema: 'synth.dataset.manifest.v1',
    generatedAt: new Date().toISOString(),
    summary: getDatasetSummary(),
    exports: {
      packets: { schema: 'synth.packet.v1', records: packetJsonl ? packetJsonl.split('\n').length : 0, sha256: digest(packetJsonl) },
      preferences: { schema: 'synth.preference.v1', records: preferenceJsonl ? preferenceJsonl.split('\n').length : 0, sha256: digest(preferenceJsonl) },
    },
    limits: [
      'A digest identifies an exported snapshot; it does not prove factual correctness, consent, licensing, or safety.',
      'Simulator output is excluded from preference exports.',
      'Preference exports require matching real completion packets and human review.',
    ],
  };
}

function safeParse(str: string | null): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
