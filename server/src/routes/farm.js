import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { pickWeighted } from '../services/rng.js';
import { MATERIAL_MAP, RARITY_WEIGHTS, HATCH_REQUIRED } from '../content/index.js';

export const FARM_PLOTS = 6;
// 作物:按「完成专注次数」成长(成长推进在 settlement);成熟后收获产材料/小概率蛋
export const CROPS = {
  wheat: { name: '麦穗', emoji: '🌾', required: 2 },
  herb: { name: '灵草', emoji: '🌿', required: 3 },
  crystalflower: { name: '晶花', emoji: '💠', required: 5 },
};

function mat(key, qty) {
  const m = MATERIAL_MAP[key];
  return { kind: 'material', key, name: m.name, emoji: m.emoji, qty };
}

// 收获产出(服务端 rng)
function harvestYield(crop, rng) {
  const out = [];
  if (crop === 'wheat') out.push(mat('wood', 2 + Math.floor(rng() * 2)));         // 2~3
  else if (crop === 'herb') out.push(mat('stardust', 1 + Math.floor(rng() * 2))); // 1~2
  else { // crystalflower
    out.push(mat('crystal', 1));
    if (rng() < 0.3) {
      const rarity = pickWeighted(rng, Object.entries(RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight })));
      out.push({ kind: 'egg', rarity });
    }
  }
  return out;
}

export function createFarmRouter({ db, now, rng }) {
  const router = Router();

  router.post('/plant', (req, res, next) => {
    try {
      const { slotIndex, crop } = req.body ?? {};
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= FARM_PLOTS)
        throw new HttpError(400, `无效地块(0~${FARM_PLOTS - 1})`);
      if (!CROPS[crop]) throw new HttpError(400, '没有这种作物');
      if (db.prepare('SELECT id FROM farm WHERE slot_index=?').get(slotIndex))
        throw new HttpError(409, '这块地已经种了');
      db.prepare('INSERT INTO farm (slot_index, crop, progress, required, planted_at) VALUES (?,?,0,?,?)')
        .run(slotIndex, crop, CROPS[crop].required, now().toISOString());
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  router.post('/harvest', (req, res, next) => {
    try {
      const { slotIndex } = req.body ?? {};
      const plot = db.prepare('SELECT * FROM farm WHERE slot_index=?').get(Number(slotIndex));
      if (!plot) throw new HttpError(404, '这块地是空的');
      if (plot.progress < plot.required) throw new HttpError(409, '作物还没成熟');
      const results = db.transaction(() => {
        const yields = harvestYield(plot.crop, rng);
        for (const r of yields) {
          if (r.kind === 'material') db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(r.qty, r.key);
          else if (r.kind === 'egg') db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)').run(r.rarity, HATCH_REQUIRED[r.rarity], now().toISOString());
        }
        db.prepare('DELETE FROM farm WHERE id=?').run(plot.id);
        return yields;
      })();
      res.json({ results });
    } catch (e) { next(e); }
  });

  return router;
}
