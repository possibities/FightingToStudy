import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext.jsx';
import Icon from './Icon.jsx';

const LINKS = [
  { to: '/', end: true, icon: 'camp', text: '营地' },
  { to: '/collection', icon: 'book', text: '图鉴' },
  { to: '/stats', icon: 'chart', text: '统计' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useTheme();
  const [sfx, setSfx] = useState(() => localStorage.getItem('sfx_enabled') !== 'off');
  const navRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const location = useLocation();

  // 测量当前激活标签的位置,游标用 CSS transition 滑过去(不依赖 framer)
  useLayoutEffect(() => {
    const measure = () => {
      const a = navRef.current?.querySelector('a.active');
      if (a) setCursor({ left: a.offsetLeft, top: a.offsetTop, width: a.offsetWidth, height: a.offsetHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [location.pathname]);

  function toggleSfx() {
    const next = !sfx;
    setSfx(next);
    localStorage.setItem('sfx_enabled', next ? 'on' : 'off');
  }

  return (
    <nav className="navbar" ref={navRef}>
      {cursor && (
        <span className="nav-cursor" aria-hidden="true"
          style={{ left: cursor.left, top: cursor.top, width: cursor.width, height: cursor.height }} />
      )}
      {LINKS.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end}>
          <span className="nav-label"><Icon name={l.icon} />{l.text}</span>
        </NavLink>
      ))}
      <button className="nav-gear" onClick={() => setOpen(o => !o)} title="设置"><Icon name="gear" /></button>
      {open && (
        <div className="card settings-pop">
          <label>主题
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="auto">跟随时间</option>
              <option value="day">日间</option>
              <option value="night">夜间</option>
            </select>
          </label>
          <label>音效
            <button className="btn-ghost" onClick={toggleSfx}>{sfx ? '开' : '关'}</button>
          </label>
        </div>
      )}
    </nav>
  );
}
