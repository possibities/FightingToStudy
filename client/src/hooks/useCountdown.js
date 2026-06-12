import { useEffect, useState } from 'react';

export function useCountdown(endsAtIso) {
  const calc = () => Math.max(0, new Date(endsAtIso).getTime() - Date.now());
  const [remainingMs, setRemainingMs] = useState(calc);
  useEffect(() => {
    setRemainingMs(calc());
    const t = setInterval(() => setRemainingMs(calc()), 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAtIso]);
  return { remainingMs, done: remainingMs <= 0 };
}

export function formatMs(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
