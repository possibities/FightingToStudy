import { describe, it, expect } from 'vitest';
import { SPECIES, BUILDINGS, MATERIALS, QUEST_TEMPLATES, TITLES, RARITY_WEIGHTS, HATCH_REQUIRED } from '../src/content/index.js';

describe('content data', () => {
  it('has 24 species: 10 common / 8 rare / 4 epic / 2 legendary', () => {
    const by = r => SPECIES.filter(s => s.rarity === r).length;
    expect(SPECIES).toHaveLength(24);
    expect(by('common')).toBe(10);
    expect(by('rare')).toBe(8);
    expect(by('epic')).toBe(4);
    expect(by('legendary')).toBe(2);
  });
  it('species have unique keys and required fields', () => {
    expect(new Set(SPECIES.map(s => s.key)).size).toBe(24);
    for (const s of SPECIES) {
      expect(s.name).toBeTruthy();
      expect(s.emoji).toBeTruthy();
      expect(s.flavor).toBeTruthy();
    }
  });
  it('buildings use only known effect types; campfire is not buildable', () => {
    const known = ['exp_pct', 'gold_pct', 'egg_pct_points', 'material_flat'];
    for (const b of BUILDINGS) {
      if (b.effect) expect(known).toContain(b.effect.type);
      if (b.buildable) expect(Object.keys(b.baseCost).length).toBeGreaterThan(0);
    }
    expect(BUILDINGS.find(b => b.key === 'campfire').buildable).toBe(false);
  });
  it('materials, templates, titles, weights are sane', () => {
    expect(MATERIALS.map(m => m.key)).toEqual(['wood', 'stone', 'stardust', 'crystal']);
    expect(QUEST_TEMPLATES.map(t => t.durationMin)).toEqual([5, 25, 45]);
    expect(TITLES).toHaveLength(10);
    expect(Object.keys(RARITY_WEIGHTS)).toEqual(['common', 'rare', 'epic', 'legendary']);
    expect(HATCH_REQUIRED).toEqual({ common: 3, rare: 5, epic: 8, legendary: 12 });
  });
});
