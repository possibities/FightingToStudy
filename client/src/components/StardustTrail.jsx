import { useEffect, useRef } from 'react';

const GLYPHS = ['✦', '✧', '·', '✨'];

// 鼠标星尘拖尾:直接操作 DOM,不触发 React 渲染
export default function StardustTrail() {
  const boxRef = useRef(null);
  useEffect(() => {
    // 尊重系统「减少动态效果」偏好:不挂监听、不生成粒子
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const box = boxRef.current;
    let last = 0;
    function onMove(e) {
      const now = performance.now();
      if (now - last < 45) return; // 节流:每 45ms 最多一颗
      last = now;
      const s = document.createElement('span');
      s.className = 'stardust';
      s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      s.style.left = `${e.clientX + (Math.random() * 14 - 7)}px`;
      s.style.top = `${e.clientY + (Math.random() * 14 - 7)}px`;
      s.style.fontSize = `${8 + Math.random() * 8}px`;
      box.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return <div ref={boxRef} className="stardust-box" aria-hidden="true" />;
}
