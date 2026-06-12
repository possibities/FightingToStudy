import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCountdown, formatMs } from './useCountdown.js';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T10:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts down to zero and reports done', () => {
    const endsAt = new Date('2026-06-11T10:00:02').toISOString();
    const { result } = renderHook(() => useCountdown(endsAt));
    expect(result.current.remainingMs).toBe(2000);
    expect(result.current.done).toBe(false);
    act(() => { vi.advanceTimersByTime(2100); });
    expect(result.current.remainingMs).toBe(0);
    expect(result.current.done).toBe(true);
  });

  it('formats ms as mm:ss', () => {
    expect(formatMs(25 * 60 * 1000)).toBe('25:00');
    expect(formatMs(61000)).toBe('01:01');
    expect(formatMs(0)).toBe('00:00');
  });
});
