import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const experiments = sqliteTable('experiments', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().default('general'),
  status: text('status').notNull().default('active'),
  modelTarget: text('model_target').notNull().default('open-transformer'),
  runCount: integer('run_count').notNull().default(0),
  packetCount: integer('packet_count').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const experimentRuns = sqliteTable('experiment_runs', {
  id: text('id').primaryKey(),
  experimentId: text('experiment_id').notNull(),
  name: text('name').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  parameters: text('parameters').notNull(), // JSON
  metrics: text('metrics').notNull(), // JSON
  status: text('status').notNull().default('completed'),
  startedAt: integer('started_at').notNull(),
  finishedAt: integer('finished_at'),
});

export const packets = sqliteTable('packets', {
  id: text('id').primaryKey(),
  runId: text('run_id'),
  experimentId: text('experiment_id'),
  type: text('type').notNull(),
  source: text('source').notNull().default('user'),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  input: text('input').notNull(), // JSON or string
  output: text('output'), // JSON or string
  metadata: text('metadata'), // JSON
  tokens: text('tokens'), // JSON
  latency: text('latency'), // JSON
  tags: text('tags').notNull().default('[]'), // JSON array
  address: text('address'), // UAS address JSON
  integrityHash: text('integrity_hash'),
  parentPacketId: text('parent_packet_id'),
  schemaVersion: integer('schema_version').notNull().default(1),
  createdAt: integer('created_at').notNull(),
});

export const annotations = sqliteTable('annotations', {
  id: text('id').primaryKey(),
  packetId: text('packet_id').notNull(),
  annotator: text('annotator').notNull().default('local-researcher'),
  rubricScores: text('rubric_scores').notNull(), // JSON
  preference: text('preference'), // 'chosen' | 'rejected' | 'tie'
  comparisonPairId: text('comparison_pair_id'),
  flawTags: text('flaw_tags').notNull().default('[]'), // JSON array
  justification: text('justification'),
  revisedOutput: text('revised_output'),
  createdAt: integer('created_at').notNull(),
});
