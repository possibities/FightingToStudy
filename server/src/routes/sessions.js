import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { settleSession } from '../services/settlement.js';

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
      db.transaction(() => {
        db.prepare("UPDATE sessions SET status='abandoned', completed_at=? WHERE id=?").run(now().toISOString(), session.id);
        // 撤退的惩罚是本次无掉落;委托本身回到 ready,可重新出发
        db.prepare("UPDATE quests SET status='ready' WHERE id=?").run(session.quest_id);
      })();
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
}
