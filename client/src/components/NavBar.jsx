import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar">
      <NavLink to="/" end>🏕️ 营地</NavLink>
      <NavLink to="/collection">📖 图鉴</NavLink>
      <NavLink to="/stats">📊 统计</NavLink>
    </nav>
  );
}
