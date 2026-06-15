import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { pickWeighted } from '../services/rng.js';
import { MATERIALS, RARITY_WEIGHTS, HATCH_REQUIRED } from '../content/index.js';

const SINGLE_COST = 40;
const TEN_COST = 360;       // 十连 9 折
const PITY_AT = 10;         // 每 10 抽内必出 ≥1 颗蛋

function getSetting(db, key, dflt) {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  return row ? row.value : dflt;
}
function setSetting(db, key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}

// 掷一次:forceEgg=保底强制出蛋
function rollOne(rng, forceEgg) {
  const kind = forceEgg ? 'egg' : pickWeighted(rng, [
    { value: 'gold', weight: 25 },
    { value: 'material', weight: 45 },
    { value: 'egg', weight: 27 },
    { value: 'egg_epic', weight: 3 },
  ]);
  if (kind === 'gold') return { kind: 'gold', amount: 20 + Math.floor(rng() * 31) }; // 20~50
  if (kind === 'material') {
    const m = pickWeighted(rng, MATERIALS.map(x => ({ value: x, weight: x.weight })));
    return { kind: 'material', key: m.key, name: m.name, emoji: m.emoji, qty: 1 + Math.floor(rng() * 3) }; // 1~3
  }
  const rarity = kind === 'egg_epic'
    ? pickWeighted(rng, [{ value: 'epic', weight: 8 }, { value: 'legendary', weight: 2 }])
    : pickWeighted(rng, Object.entries(RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight })));
  return { kind: 'egg', rarity };
}

export function createWheelRouter({ db, now, rng }) {
  const router = Router();

  router.post('/spin', (req, res, next) => {
    try {
      const count = req.body?.count === 10 ? 10 : 1;
      const cost = count === 10 ? TEN_COST : SINGLE_COST;
      const player = db.prepare('SELECT gold FROM player WHERE id=1').get();
      if (player.gold < cost) throw new HttpError(400, '金币不够转一次盘');

      const results = db.transaction(() => {
        db.prepare('UPDATE player SET gold=gold-? WHERE id=1').run(cost);
        let pity = Number(getSetting(db, 'wheel_pity', 0));
        const out = [];
        for (let i = 0; i < count; i++) {
          const r = rollOne(rng, pity >= PITY_AT - 1);
          if (r.kind === 'gold') db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(r.amount);
          else if (r.kind === 'material') db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(r.qty, r.key);
          else if (r.kind === 'egg') db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)').run(r.rarity, HATCH_REQUIRED[r.rarity], now().toISOString());
          pity = r.kind === 'egg' ? 0 : pity + 1;
          out.push(r);
        }
        setSetting(db, 'wheel_pity', pity);
        return out;
      })();

      res.json({ results, cost });
    } catch (e) { next(e); }
  });

  return router;
}
