import { useEffect } from 'react';

// 专注期间保持屏幕常亮;系统在切到后台时会自动释放,切回前台时重新申请
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null;
    const request = async () => {
      try { lock = await navigator.wakeLock.request('screen'); } catch { /* 用户拒绝/不支持 */ }
    };
    const onVis = () => { if (document.visibilityState === 'visible') request(); };
    request();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}
