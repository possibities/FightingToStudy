import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { settleSession } from '../services/settlement.js';
import { MATERIAL_MAP } from '../content/index.js';

export function createSessionsRouter({ db, now, rng }) {
  const router = Router();

  router.post('/:id/complete', (req, res, next) => {
    try {
      res.json(settleSession({ db, sessionId: Number(req.params.id), now, rng }));
    } catch (e) { next(e); }
  });

  router.post('/:id/abandon', (req, res, next) => {
    try {
      const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(Number(req.params.id));
      if (!session) throw new HttpError(404, '没有这次冒险');
      if (session.status !== 'running') throw new HttpError(409, '这次冒险已经结束了');
      let lost = null;
      db.transaction(() => {
        db.prepare("UPDATE sessions SET status='abandoned', completed_at=? WHERE id=?").run(now().toISOString(), session.id);
        // 撤退的惩罚:本次无掉落 + 慌乱中掉 1~2 个随机材料(只扣现有库存;金币/经验/伙伴永不扣)。委托回到 ready 可重新出发
        db.prepare("UPDATE quests SET status='ready' WHERE id=?").run(session.quest_id);
        const owned = db.prepare('SELECT item_key, qty FROM inventory WHERE qty > 0').all();
        if (owned.length > 0) {
          const pick = owned[Math.floor(rng() * owned.length)];
          const amount = Math.min(pick.qty, 1 + Math.floor(rng() * 2));
          db.prepare('UPDATE inventory SET qty=qty-? WHERE item_key=?').run(amount, pick.item_key);
          const meta = MATERIAL_MAP[pick.item_key];
          lost = { key: pick.item_key, name: meta.name, emoji: meta.emoji, qty: amount };
        }
      })();
      res.json({ ok: true, lost });
    } catch (e) { next(e); }
  });

  return router;
}
