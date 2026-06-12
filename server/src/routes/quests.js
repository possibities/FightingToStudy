import { Router } from 'express';
import { HttpError } from '../utils/errors.js';

export function createQuestsRouter({ db, now }) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const { title, durationMin, subjectTag } = req.body ?? {};
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 30)
        throw new HttpError(400, '标题需为 1~30 个字');
      if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 120)
        throw new HttpError(400, '时长需为 5~120 分钟的整数');
      const info = db.prepare(
        "INSERT INTO quests (title, type, duration_min, subject_tag, status, created_at) VALUES (?, 'custom', ?, ?, 'ready', ?)"
      ).run(title.trim(), durationMin, (typeof subjectTag === 'string' && subjectTag.trim()) || null, now().toISOString());
      const q = db.prepare('SELECT * FROM quests WHERE id=?').get(info.lastInsertRowid);
      res.json(toQuestJson(q));
    } catch (e) { next(e); }
  });

  router.post('/:id/start', (req, res, next) => {
    try {
      const quest = db.prepare('SELECT * FROM quests WHERE id=?').get(Number(req.params.id));
      if (!quest) throw new HttpError(404, '没有这个委托');
      if (quest.status !== 'ready') throw new HttpError(409, '这个委托不可出发');
      if (db.prepare("SELECT id FROM sessions WHERE status='running'").get())
        throw new HttpError(409, '已有进行中的冒险');
      const startedAt = now();
      const endsAt = new Date(startedAt.getTime() + quest.duration_min * 60_000);
      const info = db.transaction(() => {
        const r = db.prepare('INSERT INTO sessions (quest_id, started_at, ends_at) VALUES (?,?,?)')
          .run(quest.id, startedAt.toISOString(), endsAt.toISOString());
        db.prepare("UPDATE quests SET status='active' WHERE id=?").run(quest.id);
        return r;
      })();
      res.json({ sessionId: Number(info.lastInsertRowid), endsAt: endsAt.toISOString() });
    } catch (e) { next(e); }
  });

  return router;
}

export function toQuestJson(q) {
  return { id: q.id, title: q.title, type: q.type, durationMin: q.duration_min, subjectTag: q.subject_tag, status: q.status };
}
