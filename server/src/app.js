import express from 'express';
import path from 'node:path';
import { MATERIALS } from './content/index.js';
import { createStateRouter } from './routes/state.js';
import { createQuestsRouter } from './routes/quests.js';

function ensureBootstrap(db, now) {
  const nowIso = now().toISOString();
  db.prepare("INSERT OR IGNORE INTO player (id, name, created_at) VALUES (1, '冒险者', ?)").run(nowIso);
  db.prepare("INSERT OR IGNORE INTO buildings (slot_index, building_key, level, built_at) VALUES (0, 'campfire', 1, ?)").run(nowIso);
  for (const m of MATERIALS) db.prepare('INSERT OR IGNORE INTO inventory (item_key, qty) VALUES (?, 0)').run(m.key);
}

export function createApp({ db, now = () => new Date(), rng = Math.random, staticDir = null }) {
  ensureBootstrap(db, now);
  const app = express();
  app.use(express.json());
  const deps = { db, now, rng };
  app.use('/api/state', createStateRouter(deps));
  app.use('/api/quests', createQuestsRouter(deps));
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }
  // 统一错误中间件(四参签名不可省)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || '服务器开小差了' });
  });
  return app;
}
