// buildings: [{ building_key, level }];catalog: BUILDING_MAP
export function aggregateBonuses(buildings, catalog) {
  const acc = { expPct: 0, goldPct: 0, eggPctPoints: 0, materialFlat: 0 };
  for (const b of buildings) {
    const def = catalog[b.building_key];
    if (!def?.effect) continue;
    const v = def.effect.value * b.level;
    if (def.effect.type === 'exp_pct') acc.expPct += v;
    else if (def.effect.type === 'gold_pct') acc.goldPct += v;
    else if (def.effect.type === 'egg_pct_points') acc.eggPctPoints += v;
    else if (def.effect.type === 'material_flat') acc.materialFlat += v;
  }
  return acc;
}
