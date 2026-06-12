import { pickWeighted } from './rng.js';
import { MATERIALS, MATERIAL_MAP } from '../content/index.js';
import { localDateStr } from '../utils/dates.js';

const GIFT_GOLD = 200;
const GIFT_MATERIAL_COUNT = 5;
const AWAY_DAYS = 3;

export function checkWelcomeBack(db, now, rng) {
  const player = db.prepare('SELECT * FROM player WHERE id=1').get();
  if (!player?.last_completed_at) return null;
  const daysAway = (now().getTime() - new Date(player.last_completed_at).getTime()) / 86400000;
  if (daysAway < AWAY_DAYS) return null;
  const today = localDateStr(now());
  const claimed = db.prepare("SELECT value FROM settings WHERE key='welcome_back_date'").get();
  if (claimed?.value === today) return null;
  // 上次领取也算"活跃":只开页面不学习,不能天天白领礼包
  if (claimed?.value && (now().getTime() - new Date(claimed.value).getTime()) / 86400000 < AWAY_DAYS) return null;

  const gained = {};
  for (let i = 0; i < GIFT_MATERIAL_COUNT; i++) {
    const mat = pickWeighted(rng, MATERIALS.map(m => ({ value: m, weight: m.weight })));
    gained[mat.key] = (gained[mat.key] || 0) + 1;
  }
  db.transaction(() => {
    db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(GIFT_GOLD);
    for (const [key, qty] of Object.entries(gained))
      db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(qty, key);
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('welcome_back_date', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
    ).run(today);
  })();

  return {
    gold: GIFT_GOLD,
    materials: Object.entries(gained).map(([key, qty]) => ({ key, name: MATERIAL_MAP[key].name, emoji: MATERIAL_MAP[key].emoji, qty })),
  };
}
