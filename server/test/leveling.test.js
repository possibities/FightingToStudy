import { describe, it, expect } from 'vitest';
import { expToNext, applyExp, titleFor } from '../src/services/leveling.js';
import { TITLES } from '../src/content/index.js';

describe('leveling', () => {
  it('exp curve: 100, 150, …, 100+(L-1)*50', () => {
    expect(expToNext(1)).toBe(100);
    expect(expToNext(2)).toBe(150);
    expect(expToNext(10)).toBe(550);
  });
  it('applies exp without level up', () => {
    expect(applyExp(1, 0, 99)).toEqual({ level: 1, exp: 99, levelUps: [] });
  });
  it('handles single and multi level ups with carry-over', () => {
    expect(applyExp(1, 90, 20)).toEqual({ level: 2, exp: 10, levelUps: [2] });
    expect(applyExp(1, 0, 260)).toEqual({ level: 3, exp: 10, levelUps: [2, 3] });
  });
  it('titleFor returns the highest reached tier', () => {
    expect(titleFor(1, TITLES)).toBe('见习学者');
    expect(titleFor(7, TITLES)).toBe('青铜探索者');
    expect(titleFor(45, TITLES)).toBe('星夜守望者');
  });
});
