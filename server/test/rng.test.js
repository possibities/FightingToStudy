import { describe, it, expect } from 'vitest';
import { mulberry32, pickWeighted } from '../src/services/rng.js';

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 5; i++) expect(a()).toBe(b());
  });
  it('returns values in [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pickWeighted', () => {
  const entries = [{ value: 'a', weight: 70 }, { value: 'b', weight: 30 }];
  it('picks by cumulative weight', () => {
    expect(pickWeighted(() => 0.0, entries)).toBe('a');
    expect(pickWeighted(() => 0.69, entries)).toBe('a');
    expect(pickWeighted(() => 0.71, entries)).toBe('b');
    expect(pickWeighted(() => 0.999, entries)).toBe('b');
  });
});
