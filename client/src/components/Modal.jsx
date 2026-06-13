import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// 可访问弹窗:遮罩点击/Esc 关闭、锁定背景滚动、初始聚焦与 Tab 焦点陷阱
export default function Modal({ onClose, className = '', labelledBy, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 初始焦点:第一个可聚焦元素,否则面板本身
    const first = panel?.querySelector(FOCUSABLE);
    (first ?? panel)?.focus();

    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panel?.querySelectorAll(FOCUSABLE);
      if (!items?.length) return;
      const list = Array.from(items);
      const idx = list.indexOf(document.activeElement);
      if (e.shiftKey && (idx <= 0)) { e.preventDefault(); list.at(-1).focus(); }
      else if (!e.shiftKey && idx === list.length - 1) { e.preventDefault(); list[0].focus(); }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus instanceof HTMLElement) prevFocus.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div ref={panelRef} className={`modal card ${className}`} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
