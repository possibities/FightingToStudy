import { Outlet } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import NavBar from './NavBar.jsx';
import { useGame } from '../state/GameStateContext.jsx';

export default function Layout() {
  const { state, error } = useGame();
  if (error && !state) return <div className="splash">📡 {error} —— 请确认后端已启动(npm run dev)</div>;
  if (!state) return <div className="splash">🔥 正在点亮篝火…</div>;
  return (
    <div className="layout">
      <TopBar />
      <main className="page"><Outlet /></main>
      <NavBar />
    </div>
  );
}
