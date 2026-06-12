// server/src/routes/buildings.js
import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { BUILDING_MAP, MATERIAL_MAP } from '../content/index.js';

export function createBuildingsRouter({ db, now }) {
  const router = Router();

  router.post('/', (req, res, next) => {
    try {
      const { slotIndex, buildingKey } = req.body ?? {};
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > 7)
        throw new HttpError(400, '无效地块(1~7)');
      const def = BUILDING_MAP[buildingKey];
      if (!def || !def.buildable) throw new HttpError(400, '无效建筑');
      const existing = db.prepare('SELECT * FROM buildings WHERE slot_index=?').get(slotIndex);
      if (existing && existing.building_key !== buildingKey)
        throw new HttpError(400, '该地块已有其他建筑');
      if (existing && existing.level >= 3) throw new HttpError(400, '已达最高等级');
      const targetLevel = existing ? existing.level + 1 : 1;
      const cost = Object.entries(def.baseCost).map(([key, base]) => ({ key, qty: base * targetLevel }));

      db.transaction(() => {
        for (const c of cost) {
          const row = db.prepare('SELECT qty FROM inventory WHERE item_key=?').get(c.key);
          if (!row || row.qty < c.qty)
            throw new HttpError(400, `材料不足:${MATERIAL_MAP[c.key].name} 需要 ${c.qty}`);
        }
        for (const c of cost) db.prepare('UPDATE inventory SET qty=qty-? WHERE item_key=?').run(c.qty, c.key);
        if (existing) db.prepare('UPDATE buildings SET level=? WHERE id=?').run(targetLevel, existing.id);
        else db.prepare('INSERT INTO buildings (slot_index, building_key, level, built_at) VALUES (?,?,1,?)')
          .run(slotIndex, buildingKey, now().toISOString());
      })();

      res.json({ slotIndex, buildingKey, level: targetLevel });
    } catch (e) { next(e); }
  });

  return router;
}
