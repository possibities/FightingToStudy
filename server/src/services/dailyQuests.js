import { QUEST_TEMPLATES } from '../content/index.js';
import { localDateStr } from '../utils/dates.js';

export function ensureDailyQuests(db, now, rng) {
  const today = localDateStr(now());
  const count = db.prepare("SELECT COUNT(*) AS c FROM quests WHERE type='daily' AND daily_date=?").get(today).c;
  if (count > 0) return;
  // 过去的、还没出发过的每日委托标记过期(active 的留给结算正常收尾)
  db.prepare("UPDATE quests SET status='expired' WHERE type='daily' AND status='ready' AND daily_date<?").run(today);
  const nowIso = now().toISOString();
  const ins = db.prepare(
    "INSERT INTO quests (title, type, duration_min, status, daily_date, created_at) VALUES (?, 'daily', ?, 'ready', ?, ?)"
  );
  for (const tpl of QUEST_TEMPLATES) {
    const title = tpl.titles[Math.floor(rng() * tpl.titles.length)];
    ins.run(title, tpl.durationMin, today, nowIso);
  }
}
