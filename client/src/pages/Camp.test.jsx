import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast.jsx';

// mock 必须补齐所有具名导出:Camp 静态引入的 Wheel/Farm/Dice 分别要 spinWheel/plantCrop/harvestCrop/rollDice,
// vi.mock 工厂缺导出会让这些模块加载即抛 SyntaxError(先于任何断言)
vi.mock('../api/client.js', () => ({
  api: vi.fn(), createQuest: vi.fn(), startFreeRoam: vi.fn(),
  spinWheel: vi.fn(), plantCrop: vi.fn(), harvestCrop: vi.fn(), rollDice: vi.fn(),
}));
vi.mock('../state/GameStateContext.jsx', () => ({ useGame: vi.fn() }));
vi.mock('../utils/notify.js', () => ({ requestNotify: vi.fn(), notify: vi.fn() }));

import Camp from './Camp.jsx';
import { useGame } from '../state/GameStateContext.jsx';

const baseState = {
  quests: [], welcomeBack: null, runningSession: null, incubatingEgg: null,
  buildings: [], creatures: [], buildingCatalog: [], knownTags: [], // buildingCatalog 是数组(CampScene 对它 .map)
  player: { pityCounter: 0 },
};

function renderCamp(overrides = {}) {
  useGame.mockReturnValue({ state: { ...baseState, ...overrides }, refresh: vi.fn() });
  return render(<ToastProvider><MemoryRouter><Camp /></MemoryRouter></ToastProvider>);
}

// 数字被 <span className="num"> 隔开,getByText 的默认匹配只看直接文本节点,必须用 textContent 匹配器
const pityHint = () => screen.queryByText((_, el) => el?.classList?.contains('pity-hint'));

describe('Camp 保底提示', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows pity hint when pityCounter >= 2', () => {
    renderCamp({ player: { pityCounter: 2 } });
    expect(pityHint()?.textContent).toContain('已连空 2 次');
    expect(pityHint()?.textContent).toContain('再专注 3 次');
  });

  it('shows 1 remaining when pityCounter = 4', () => {
    renderCamp({ player: { pityCounter: 4 } });
    expect(pityHint()?.textContent).toContain('再专注 1 次');
  });

  it('hides pity hint when pityCounter < 2', () => {
    renderCamp({ player: { pityCounter: 1 } });
    expect(pityHint()).toBeNull();
  });
});
