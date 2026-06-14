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

// 打野:开放式专注,随时开始/结束
export const startFreeRoam = () => api('/sessions/free/start', { method: 'POST' });
