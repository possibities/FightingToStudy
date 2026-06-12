import { Router } from 'express';
import { SPECIES, TITLES } from '../content/index.js';
import { titleFor } from '../services/leveling.js';
import { localDateStr } from '../utils/dates.js';

export function createStatsRouter({ db, now }) {
  const router = Router();
  router.get('/', (req, res, next) => {
    try {
      const rows = db.prepare(
        "SELECT q.duration_min AS m, q.subject_tag AS tag, s.completed_at AS at FROM sessions s JOIN quests q ON q.id=s.quest_id WHERE s.status='completed'"
      ).all();
      const totalMinutes = rows.reduce((sum, r) => sum + r.m, 0);
      const week = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now().getTime() - i * 86400000);
        const ds = localDateStr(d);
        week.push({ date: ds, minutes: rows.filter(r => localDateStr(new Date(r.at)) === ds).reduce((s, r) => s + r.m, 0) });
      }
      const byTag = {};
      for (const r of rows) {
        const t = r.tag || '未分类';
        byTag[t] = (byTag[t] || 0) + r.m;
      }
      const player = db.prepare('SELECT * FROM player WHERE id=1').get();
      const collected = db.prepare('SELECT COUNT(DISTINCT species_key) AS c FROM creatures').get().c;
      const buildingCount = db.prepare('SELECT COUNT(*) AS c FROM buildings').get().c;
      res.json({
        totalMinutes,
        totalSessions: rows.length,
        level: player.level,
        title: titleFor(player.level, TITLES),
        week,
        subjects: Object.entries(byTag).map(([tag, minutes]) => ({ tag, minutes })).sort((a, b) => b.minutes - a.minutes),
        collection: { collected, total: SPECIES.length },
        buildingCount,
      });
    } catch (e) { next(e); }
  });
  return router;
}
