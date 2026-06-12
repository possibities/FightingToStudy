import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, DB_PATH } from './index.js';

const KEEP = 3;

export function backupDb() {
  if (!existsSync(DB_PATH)) return;
  const dir = path.join(DATA_DIR, 'backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(DB_PATH, path.join(dir, `app-${stamp}.db`));
  const files = readdirSync(dir).filter(f => f.startsWith('app-') && f.endsWith('.db')).sort();
  while (files.length > KEEP) unlinkSync(path.join(dir, files.shift()));
}
