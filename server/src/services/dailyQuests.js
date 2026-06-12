import { QUEST_TEMPLATES } from '../content/index.js';
import { localDateStr } from '../utils/dates.js';

export function ensureDailyQuests(db, now, rng) {
  const today = localDateStr(now());
  const count = db.prepare("SELECT COUNT(*) AS c FROM quests WHERE type='daily' AND daily_date=?").get(today).c;
  if (count > 0) return;
  const nowIso = now().toISOString();
  // 过期标记 + 生成新三条放在同一事务,避免中途失败留下残缺的当日委托
  db.transaction(() => {
    db.prepare("UPDATE quests SET status='expired' WHERE type='daily' AND status='ready' AND daily_date<?").run(today);
    const ins = db.prepare(
      "INSERT INTO quests (title, type, duration_min, status, daily_date, created_at) VALUES (?, 'daily', ?, 'ready', ?, ?)"
    );
    for (const tpl of QUEST_TEMPLATES) {
      const title = tpl.titles[Math.floor(rng() * tpl.titles.length)];
      ins.run(title, tpl.durationMin, today, nowIso);
    }
  })();
}
