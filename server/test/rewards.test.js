import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../src/services/rewards.js';
import { aggregateBonuses } from '../src/services/bonuses.js';
import { BUILDING_MAP } from '../src/content/index.js';
import { seqRng } from './helpers.js';

const NO_BONUS = { expPct: 0, goldPct: 0, eggPctPoints: 0, materialFlat: 0 };
const basePlayer = { level: 1, exp: 0, pity_counter: 0 };

function calc(overrides = {}) {
  return calculateSettlement({
    durationMin: 25, player: basePlayer, bonuses: NO_BONUS,
    incubatingEgg: null, collectedKeys: [], rng: () => 0.5, ...overrides,
  });
}

describe('calculateSettlement', () => {
  it('awards exp = min*2 and gold = min*1', () => {
    const { events, deltas } = calc();
    expect(deltas.expGained).toBe(50);
    expect(deltas.goldGained).toBe(25);
    expect(events[0]).toMatchObject({ type: 'exp', amount: 50 });
    expect(events[1]).toMatchObject({ type: 'gold', amount: 25 });
  });

  it('applies percentage bonuses', () => {
    const { deltas } = calc({ bonuses: { ...NO_BONUS, expPct: 10, goldPct: 20 } });
    expect(deltas.expGained).toBe(55);
    expect(deltas.goldGained).toBe(30);
  });

  it('emits levelup events', () => {
    const { events } = calc({ durationMin: 120, player: { level: 1, exp: 90, pity_counter: 0 } });
    const ups = events.filter(e => e.type === 'levelup');
    expect(ups.map(u => u.level)).toEqual([2, 3]);
  });

  it('grants materials: qty = 1 + floor(min/15) + flat bonus', () => {
    expect(calc().events.find(e => e.type === 'material').qty).toBe(2);
    expect(calc({ durationMin: 5 }).events.find(e => e.type === 'material').qty).toBe(1);
    expect(calc({ bonuses: { ...NO_BONUS, materialFlat: 2 } }).events.find(e => e.type === 'material').qty).toBe(4);
  });

  it('egg drop follows rng order: material → egg-roll → rarity', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.10, 0.5]) }); // 25min → P=0.20
    expect(deltas.eggDropped).toEqual({ rarity: 'common', required: 3 });
    expect(deltas.newPity).toBe(0);
  });

  it('no egg increments pity', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.99]) });
    expect(deltas.eggDropped).toBeNull();
    expect(deltas.newPity).toBe(1);
  });

  it('pity >= 4 forces an egg even on a bad roll', () => {
    const { deltas, events } = calc({ player: { ...basePlayer, pity_counter: 4 }, rng: seqRng([0.5, 0.99, 0.5]) });
    expect(deltas.eggDropped).not.toBeNull();
    expect(events.find(e => e.type === 'egg').pity).toBe(true);
  });

  it('egg chance caps at 0.35 by duration and is boosted by points', () => {
    const miss = calc({ durationMin: 120, rng: seqRng([0.5, 0.36]) });
    expect(miss.deltas.eggDropped).toBeNull();
    const hit = calc({ durationMin: 120, bonuses: { ...NO_BONUS, eggPctPoints: 5 }, rng: seqRng([0.5, 0.39, 0.1]) });
    expect(hit.deltas.eggDropped).not.toBeNull();
  });

  it('rarity follows weights (legendary on extreme roll)', () => {
    const { deltas } = calc({ rng: seqRng([0.5, 0.0, 0.995]) });
    expect(deltas.eggDropped.rarity).toBe('legendary');
    expect(deltas.eggDropped.required).toBe(12);
  });

  it('advances incubation of the provided egg', () => {
    const { deltas, events } = calc({ incubatingEgg: { id: 9, rarity: 'rare', progress: 1, required: 5 } });
    expect(deltas.eggProgress).toEqual({ eggId: 9, progress: 2 });
    expect(events.find(e => e.type === 'egg_progress')).toMatchObject({ progress: 2, required: 5 });
    expect(deltas.hatched).toBeNull();
  });

  it('hatches at required progress, preferring uncollected species', () => {
    const { deltas, events } = calc({
      incubatingEgg: { id: 9, rarity: 'legendary', progress: 11, required: 12 },
      collectedKeys: ['galaxy_dragon'],
      rng: seqRng([0.5, 0.99, 0.0]),
    });
    expect(deltas.hatched.species.key).toBe('moon_swan');
    expect(events.find(e => e.type === 'hatch').species.key).toBe('moon_swan');
  });

  it('allows duplicates when the rarity tier is fully collected', () => {
    const { deltas } = calc({
      incubatingEgg: { id: 9, rarity: 'legendary', progress: 11, required: 12 },
      collectedKeys: ['galaxy_dragon', 'moon_swan'],
      rng: seqRng([0.5, 0.99, 0.0]),
    });
    expect(['galaxy_dragon', 'moon_swan']).toContain(deltas.hatched.species.key);
  });

  it('event order: exp → gold → levelup → material → egg → incubation', () => {
    const { events } = calc({
      durationMin: 120, player: { level: 1, exp: 90, pity_counter: 4 },
      incubatingEgg: { id: 9, rarity: 'common', progress: 0, required: 3 },
      rng: seqRng([0.5, 0.99, 0.5, 0.5]),
    });
    const types = events.map(e => e.type);
    expect(types.slice(0, 2)).toEqual(['exp', 'gold']);
    expect(types.indexOf('material')).toBeGreaterThan(types.lastIndexOf('levelup'));
    expect(types.indexOf('egg')).toBeGreaterThan(types.indexOf('material'));
    expect(types.indexOf('egg_progress')).toBeGreaterThan(types.indexOf('egg'));
  });
});

describe('aggregateBonuses', () => {
  it('stacks effects across buildings scaled by level, skipping no-effect ones', () => {
    const bonuses = aggregateBonuses([
      { building_key: 'library', level: 2 },     // exp +10
      { building_key: 'herb_garden', level: 1 }, // exp +3
      { building_key: 'tent', level: 3 },        // gold +9
      { building_key: 'observatory', level: 2 }, // egg +4
      { building_key: 'workshop', level: 1 },    // material +1
      { building_key: 'campfire', level: 1 },    // 无效果
    ], BUILDING_MAP);
    expect(bonuses).toEqual({ expPct: 13, goldPct: 9, eggPctPoints: 4, materialFlat: 1 });
  });
});
