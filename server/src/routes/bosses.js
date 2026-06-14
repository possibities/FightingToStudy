import { Router } from 'express';
import { HttpError } from '../utils/errors.js';

// 讨伐目标(Boss):其下「代办」即一条带时长的委托(quests.boss_id 指向本目标)。
export function createBossesRouter({ db, now }) {
  const router = Router();

  // 新建讨伐目标
  router.post('/', (req, res, next) => {
    try {
      const { title } = req.body ?? {};
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 40)
        throw new HttpError(400, '目标名需为 1~40 个字');
      const info = db.prepare('INSERT INTO bosses (title, created_at) VALUES (?, ?)').run(title.trim(), now().toISOString());
      res.json({ id: Number(info.lastInsertRowid) });
    } catch (e) { next(e); }
  });

  // 加代办(=一条委托)
  router.post('/:id/todos', (req, res, next) => {
    try {
      const boss = db.prepare('SELECT * FROM bosses WHERE id=?').get(Number(req.params.id));
      if (!boss) throw new HttpError(404, '没有这个讨伐目标');
      if (boss.status !== 'active') throw new HttpError(409, '该目标已被击败');
      const { title, durationMin, subjectTag } = req.body ?? {};
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 30)
        throw new HttpError(400, '代办标题需为 1~30 个字');
      if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 120)
        throw new HttpError(400, '时长需为 5~120 分钟的整数');
      const info = db.prepare(
        "INSERT INTO quests (title, type, duration_min, subject_tag, status, boss_id, created_at) VALUES (?, 'custom', ?, ?, 'ready', ?, ?)"
      ).run(title.trim(), durationMin, (typeof subjectTag === 'string' && subjectTag.trim()) || null, boss.id, now().toISOString());
      res.json({ id: Number(info.lastInsertRowid) });
    } catch (e) { next(e); }
  });

  // 删代办(仅未开始的 ready,避免孤儿 session 影响统计)
  router.delete('/:id/todos/:tid', (req, res, next) => {
    try {
      const t = db.prepare('SELECT * FROM quests WHERE id=? AND boss_id=?').get(Number(req.params.tid), Number(req.params.id));
      if (!t) throw new HttpError(404, '没有这条代办');
      if (t.status !== 'ready') throw new HttpError(409, '已开始或已完成的代办不能删');
      db.prepare('DELETE FROM quests WHERE id=?').run(t.id);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // 删目标(仅无进展的:所有代办都还是 ready)
  router.delete('/:id', (req, res, next) => {
    try {
      const boss = db.prepare('SELECT * FROM bosses WHERE id=?').get(Number(req.params.id));
      if (!boss) throw new HttpError(404, '没有这个讨伐目标');
      if (db.prepare("SELECT id FROM quests WHERE boss_id=? AND status IN ('active','done')").get(boss.id))
        throw new HttpError(409, '已有进展的目标不能删除');
      db.transaction(() => {
        db.prepare('DELETE FROM quests WHERE boss_id=?').run(boss.id);
        db.prepare('DELETE FROM bosses WHERE id=?').run(boss.id);
      })();
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
}
