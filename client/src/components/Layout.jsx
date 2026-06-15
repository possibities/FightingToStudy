import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar.jsx';
import NavBar from './NavBar.jsx';
import Icon from './Icon.jsx';
import { useGame } from '../state/GameStateContext.jsx';

export default function Layout() {
  const { state, error } = useGame();
  const location = useLocation();
  if (error && !state) return <div className="splash"><Icon name="alert" /> {error} —— 请确认后端已启动(npm run dev)</div>;
  if (!state) return <div className="splash"><Icon name="fire" /> 正在点亮篝火…</div>;
  return (
    <div className="layout">
      <TopBar />
      <main className="page">
        {/* 按路由 key 重挂载,触发轻量淡入转场 */}
        <div key={location.pathname} className="page-fade"><Outlet /></div>
      </main>
      <NavBar />
    </div>
  );
}
