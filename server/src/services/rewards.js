import { pickWeighted } from './rng.js';
import { applyExp, titleFor } from './leveling.js';
import { MATERIALS, SPECIES, TITLES, RARITY_WEIGHTS, HATCH_REQUIRED } from '../content/index.js';

// rng 消耗顺序(测试依赖):① 材料种类 ② 蛋判定(必消耗) ③ 蛋稀有度(若掉蛋) ④ 孵化物种(若孵化)
export function calculateSettlement({ durationMin, player, bonuses, incubatingEgg, collectedKeys, rng }) {
  const events = [];

  const expGained = Math.round(durationMin * 2 * (1 + bonuses.expPct / 100));
  const goldGained = Math.round(durationMin * 1 * (1 + bonuses.goldPct / 100));
  const lvl = applyExp(player.level, player.exp, expGained);
  events.push({ type: 'exp', amount: expGained });
  events.push({ type: 'gold', amount: goldGained });
  for (const newLevel of lvl.levelUps) {
    const newTitle = titleFor(newLevel, TITLES);
    events.push({ type: 'levelup', level: newLevel, title: newTitle !== titleFor(newLevel - 1, TITLES) ? newTitle : null });
  }

  const mat = pickWeighted(rng, MATERIALS.map(m => ({ value: m, weight: m.weight })));
  const qty = 1 + Math.floor(durationMin / 15) + bonuses.materialFlat;
  events.push({ type: 'material', key: mat.key, name: mat.name, emoji: mat.emoji, qty });

  const chance = Math.min(0.15 + durationMin * 0.002, 0.35) + bonuses.eggPctPoints / 100;
  const roll = rng(); // 必消耗,保底也不跳过,保证 rng 顺序稳定
  const pity = player.pity_counter >= 4;
  let eggDropped = null;
  if (pity || roll < chance) {
    const rarity = pickWeighted(rng, Object.entries(RARITY_WEIGHTS).map(([value, weight]) => ({ value, weight })));
    eggDropped = { rarity, required: HATCH_REQUIRED[rarity] };
    events.push({ type: 'egg', rarity, pity });
  }
  const newPity = eggDropped ? 0 : player.pity_counter + 1;

  let eggProgress = null;
  let hatched = null;
  if (incubatingEgg) {
    const progress = incubatingEgg.progress + 1;
    if (progress >= incubatingEgg.required) {
      const pool = SPECIES.filter(s => s.rarity === incubatingEgg.rarity);
      const uncollected = pool.filter(s => !collectedKeys.includes(s.key));
      const candidates = uncollected.length > 0 ? uncollected : pool;
      const species = candidates[Math.floor(rng() * candidates.length)];
      hatched = { eggId: incubatingEgg.id, species };
      events.push({ type: 'hatch', species });
    } else {
      eggProgress = { eggId: incubatingEgg.id, progress };
      events.push({ type: 'egg_progress', progress, required: incubatingEgg.required, rarity: incubatingEgg.rarity });
    }
  }

  return {
    events,
    deltas: {
      expGained, goldGained, newLevel: lvl.level, newExp: lvl.exp, levelUps: lvl.levelUps,
      material: { key: mat.key, qty }, eggDropped, newPity, eggProgress, hatched,
    },
  };
}
