import { createContext, useContext, useEffect, useState } from 'react';

export function resolveTheme(mode, hour) {
  if (mode === 'day' || mode === 'night') return mode;
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme_mode') || 'auto');
  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
    const apply = () => { document.documentElement.dataset.theme = resolveTheme(mode, new Date().getHours()); };
    apply();
    const t = setInterval(apply, 60_000);
    return () => clearInterval(t);
  }, [mode]);
  return <ThemeCtx.Provider value={{ mode, setMode }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
