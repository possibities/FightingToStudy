import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext.jsx';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { mode, setMode } = useTheme();
  const [sfx, setSfx] = useState(() => localStorage.getItem('sfx_enabled') !== 'off');

  function toggleSfx() {
    const next = !sfx;
    setSfx(next);
    localStorage.setItem('sfx_enabled', next ? 'on' : 'off');
  }

  return (
    <nav className="navbar">
      <NavLink to="/" end>🏕️ 营地</NavLink>
      <NavLink to="/collection">📖 图鉴</NavLink>
      <NavLink to="/stats">📊 统计</NavLink>
      <button className="nav-gear" onClick={() => setOpen(o => !o)} title="设置">⚙️</button>
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
            <button className="btn-ghost" onClick={toggleSfx}>{sfx ? '开 🔔' : '关 🔕'}</button>
          </label>
        </div>
      )}
    </nav>
  );
}
