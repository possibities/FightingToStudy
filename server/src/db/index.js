import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(filePath = ':memory:') {
  const db = new Database(filePath);
  db.pragma('journal_mode = WAL');
  db.exec(readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return db;
}

export const DATA_DIR = path.resolve(__dirname, '../../../data');
export const DB_PATH = path.join(DATA_DIR, 'app.db');
