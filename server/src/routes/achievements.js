import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { ACHIEVEMENTS, computeMetrics } from '../services/achievements.js';
import { HATCH_REQUIRED } from '../content/index.js';

export function createAchievementsRouter({ db, now }) {
  const router = Router();

  router.post('/:key/claim', (req, res, next) => {
    try {
      const def = ACHIEVEMENTS.find(a => a.key === req.params.key);
      if (!def) throw new HttpError(404, '没有这个成就');
      if (db.prepare('SELECT key FROM achievements WHERE key=?').get(def.key)) throw new HttpError(409, '该成就已领取');
      const metrics = computeMetrics(db);
      if ((metrics[def.metric] ?? 0) < def.threshold) throw new HttpError(409, '成就尚未达成');
      db.transaction(() => {
        const r = def.reward;
        if (r.kind === 'gold') db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(r.amount);
        else if (r.kind === 'egg') db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)').run(r.rarity, HATCH_REQUIRED[r.rarity], now().toISOString());
        else if (r.kind === 'material') db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(r.qty, r.key);
        db.prepare('INSERT INTO achievements (key, claimed_at) VALUES (?,?)').run(def.key, now().toISOString());
      })();
      res.json({ ok: true, reward: def.reward });
    } catch (e) { next(e); }
  });

  return router;
}
