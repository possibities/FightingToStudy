import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RewardSequence from './RewardSequence.jsx';
import { ToastProvider } from './Toast.jsx';

vi.mock('../audio/sfx.js', () => ({ playSfx: vi.fn() }));
vi.mock('../api/client.js', () => ({ api: vi.fn() }));
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
  motion: { div: ({ children, className }) => <div className={className}>{children}</div> },
}));

const EVENTS = [
  { type: 'exp', amount: 50 },
  { type: 'gold', amount: 25 },
  { type: 'egg', rarity: 'rare', pity: false },
];

describe('RewardSequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reveals events one by one, with a flip card for drops', () => {
    const onDone = vi.fn();
    render(
      <ToastProvider>
        <RewardSequence events={EVENTS} quest={{ type: 'daily' }} onDone={onDone} />
      </ToastProvider>
    );
    expect(screen.queryByText(/经验 \+50/)).toBeNull();
    act(() => { vi.advanceTimersByTime(950); });
    expect(screen.getByText(/经验 \+50/)).toBeInTheDocument();
    expect(screen.queryByText(/金币 \+25/)).toBeNull();
    act(() => { vi.advanceTimersByTime(900); });
    expect(screen.getByText(/金币 \+25/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(900); });
    // 掉落以扣牌出现:翻开前看不到内容,也不能回营地
    expect(screen.queryByText(/稀有的蛋/)).toBeNull();
    expect(screen.queryByText('回营地')).toBeNull();
    fireEvent.click(screen.getByText(/点击翻开/));
    expect(screen.getByText(/稀有的蛋/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('回营地'));
    expect(onDone).toHaveBeenCalled();
  });

  it('offers 再来一次 for custom quests', () => {
    render(
      <ToastProvider>
        <RewardSequence events={[{ type: 'exp', amount: 10 }]} quest={{ type: 'custom', title: 'x', durationMin: 25, subjectTag: null }} onDone={() => {}} />
      </ToastProvider>
    );
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText(/再来一次/)).toBeInTheDocument();
  });
});
