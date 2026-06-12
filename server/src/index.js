import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createDb, DATA_DIR, DB_PATH } from './db/index.js';
import { backupDb } from './db/backup.js';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

mkdirSync(DATA_DIR, { recursive: true });
backupDb();
const db = createDb(DB_PATH);
const staticDir = path.resolve(__dirname, '../../client/dist');
const app = createApp({ db, staticDir });
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🏕️ 星夜营地: http://localhost:${PORT}`));

// 优雅关闭:把 WAL 落盘,保证下次启动备份完整
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
