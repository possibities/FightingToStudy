// 「自由打野」:复用一条隐藏委托承载开放式专注 session。id 存 settings,避免污染委托列表/统计。
export const FREE_CAP_MIN = 120; // 单次打野结算封顶分钟

export function freeQuestId(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key='free_quest_id'").get();
  return row ? Number(row.value) : -1;
}

export function ensureFreeQuest(db, now) {
  const existing = freeQuestId(db);
  if (existing > 0 && db.prepare('SELECT id FROM quests WHERE id=?').get(existing)) return existing;
  const info = db.prepare(
    "INSERT INTO quests (title, type, duration_min, subject_tag, status, created_at) VALUES ('自由打野','custom',1,NULL,'ready',?)"
  ).run(now().toISOString());
  const id = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO settings (key, value) VALUES ('free_quest_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(id));
  return id;
}
