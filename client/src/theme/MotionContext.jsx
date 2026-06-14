import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
const QUERY = '(prefers-reduced-motion: reduce)';

// 动效偏好:auto=跟随系统 / on=强制全开 / off=强制关。
// 折算成 <html>.reduce-motion 类,供 CSS 与 utils/motion.js 统一判断。
export function MotionProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('motion_mode') || 'auto');
  useEffect(() => {
    localStorage.setItem('motion_mode', mode);
    const mq = window.matchMedia(QUERY);
    const apply = () => {
      const reduce = mode === 'off' || (mode === 'auto' && mq.matches);
      document.documentElement.classList.toggle('reduce-motion', reduce);
      document.documentElement.dataset.motion = mode;
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [mode]);
  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useMotion = () => useContext(Ctx);
