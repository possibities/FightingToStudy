import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

const apiMock = vi.fn();
vi.mock('../api/client.js', () => ({ api: (...a) => apiMock(...a) }));

import { GameStateProvider, useGame } from './GameStateContext.jsx';

function Probe() {
  const { state } = useGame();
  return <div data-testid="probe">{state ? 'loaded' : 'empty'}</div>;
}

describe('GameStateProvider 回前台刷新', () => {
  it('refetches /state on window focus and on becoming visible', async () => {
    apiMock.mockResolvedValue({ player: {} });
    render(<GameStateProvider><Probe /></GameStateProvider>);
    await waitFor(() => expect(apiMock).toHaveBeenCalledTimes(1)); // 挂载首拉
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); }); // jsdom 恒为 visible
    await waitFor(() => expect(apiMock.mock.calls.length).toBeGreaterThanOrEqual(3));
  });
});
