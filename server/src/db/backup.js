import Database from 'better-sqlite3';
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR, DB_PATH } from './index.js';

const KEEP = 3;

export function backupDb() {
  if (!existsSync(DB_PATH)) return;
  // WAL 模式下未 checkpoint 的事务都在 -wal 文件里,先折叠进主库再拷贝,否则备份可能近乎空库
  try {
    const tmp = new Database(DB_PATH);
    tmp.pragma('wal_checkpoint(TRUNCATE)');
    tmp.close();
  } catch {
    /* 主库异常时仍按原样尽力备份 */
  }
  const dir = path.join(DATA_DIR, 'backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  copyFileSync(DB_PATH, path.join(dir, `app-${stamp}.db`));
  const files = readdirSync(dir).filter(f => f.startsWith('app-') && f.endsWith('.db')).sort();
  while (files.length > KEEP) unlinkSync(path.join(dir, files.shift()));
}
