import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'synth.db');
const sqlite = new Database(dbPath);

// Initialize tables if they do not exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'active',
    model_target TEXT NOT NULL DEFAULT 'open-transformer',
    run_count INTEGER NOT NULL DEFAULT 0,
    packet_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS experiment_runs (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    parameters TEXT NOT NULL,
    metrics TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    started_at INTEGER NOT NULL,
    finished_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS packets (
    id TEXT PRIMARY KEY,
    run_id TEXT,
    experiment_id TEXT,
    type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'user',
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    metadata TEXT,
    tokens TEXT,
    latency TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    address TEXT,
    integrity_hash TEXT,
    parent_packet_id TEXT,
    schema_version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    packet_id TEXT NOT NULL,
    annotator TEXT NOT NULL DEFAULT 'local-researcher',
    rubric_scores TEXT NOT NULL,
    preference TEXT,
    comparison_pair_id TEXT,
    flaw_tags TEXT NOT NULL DEFAULT '[]',
    justification TEXT,
    revised_output TEXT,
    created_at INTEGER NOT NULL
  );
`);

function ensurePacketColumn(name: string, definition: string) {
  const columns = sqlite.prepare('PRAGMA table_info(packets)').all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === name)) {
    sqlite.exec(`ALTER TABLE packets ADD COLUMN ${definition}`);
  }
}

ensurePacketColumn('address', 'address TEXT');
ensurePacketColumn('integrity_hash', 'integrity_hash TEXT');
ensurePacketColumn('parent_packet_id', 'parent_packet_id TEXT');
ensurePacketColumn('schema_version', 'schema_version INTEGER NOT NULL DEFAULT 1');

export const db = drizzle(sqlite, { schema });
export { sqlite };
