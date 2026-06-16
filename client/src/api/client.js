export async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e; // 组件卸载主动取消,交给调用方静默处理
    throw new Error('信号不佳,联系不上营地');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
}

// 创建一条委托(自建/再来一次/重复均走这里)
export const createQuest = ({ title, durationMin, subjectTag = null }) =>
  api('/quests', { method: 'POST', body: { title, durationMin, subjectTag } });

// 打野:开放式专注,随时开始/结束。带 questId 则对该委托(如讨伐代办)打野
export const startFreeRoam = (questId = null) =>
  api('/sessions/free/start', { method: 'POST', body: questId != null ? { questId } : undefined });

// 讨伐(Boss × 代办)
export const startQuestById = (id) => api(`/quests/${id}/start`, { method: 'POST' });
export const createBoss = (title) => api('/bosses', { method: 'POST', body: { title } });
export const addBossTodo = (bossId, { title, durationMin, subjectTag = null }) =>
  api(`/bosses/${bossId}/todos`, { method: 'POST', body: { title, durationMin, subjectTag } });
export const deleteBossTodo = (bossId, todoId) => api(`/bosses/${bossId}/todos/${todoId}`, { method: 'DELETE' });
export const deleteBoss = (bossId) => api(`/bosses/${bossId}`, { method: 'DELETE' });

// 星夜转盘:count=1 单抽 / 10 十连
export const spinWheel = (count = 1) => api('/wheel/spin', { method: 'POST', body: { count } });

// 营地农园
export const plantCrop = (slotIndex, crop) => api('/farm/plant', { method: 'POST', body: { slotIndex, crop } });
export const harvestCrop = (slotIndex) => api('/farm/harvest', { method: 'POST', body: { slotIndex } });

// 篝火骰戏:choice='big'|'small'
export const rollDice = (choice, bet) => api('/dice/roll', { method: 'POST', body: { choice, bet } });
