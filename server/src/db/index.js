import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(filePath = ':memory:') {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  migrate(db);
  return db;
}

// 轻量迁移:为打野(自由专注)增列。ALTER ADD COLUMN 安全、不重建表、保留存档。
function migrate(db) {
  const cols = db.prepare('PRAGMA table_info(sessions)').all().map(c => c.name);
  if (!cols.includes('kind')) db.exec("ALTER TABLE sessions ADD COLUMN kind TEXT NOT NULL DEFAULT 'quest'");
  if (!cols.includes('minutes')) db.exec('ALTER TABLE sessions ADD COLUMN minutes INTEGER');
}

export const DATA_DIR = path.resolve(__dirname, '../../../data');
export const DB_PATH = path.join(DATA_DIR, 'app.db');
