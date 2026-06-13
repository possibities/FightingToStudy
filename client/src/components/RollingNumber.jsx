import { useEffect, useRef } from 'react';

const REDUCE = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// 数字滚动:首帧直接落终值(不从 0 滚),之后只对 delta 用 rAF 补间,直写 DOM。
// 刻意不用 framer-motion——保持它只在 Adventure/结算分包里,首屏不背这 120KB。
export default function RollingNumber({ value, className = '' }) {
  const ref = useRef(null);
  const fromRef = useRef(value);
  const inited = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inited.current || REDUCE()) {
      el.textContent = Math.round(value);
      fromRef.current = value;
      inited.current = true;
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const dur = 700;
    let start;
    cancelAnimationFrame(rafRef.current);
    const tick = ts => {
      if (start === undefined) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      el.textContent = Math.round(from + (to - from) * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)}</span>;
}
