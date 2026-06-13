import { useGame } from '../state/GameStateContext.jsx';
import RollingNumber from './RollingNumber.jsx';

export default function TopBar() {
  const { state } = useGame();
  const { player, resources } = state;
  const pct = Math.round((player.exp / player.expToNext) * 100);
  return (
    <header className="topbar card">
      <div className="topbar-id">
        <span className="topbar-avatar">🧙</span>
        <div>
          <b>{player.title} · Lv{player.level}</b>
          <div className="bar exp-bar"><div style={{ width: `${pct}%` }} /></div>
          <small className="dim">EXP <RollingNumber value={player.exp} />/{player.expToNext}</small>
        </div>
      </div>
      <div className="topbar-res">
        <span>🪙 <RollingNumber value={player.gold} /></span>
        {resources.map(r => <span key={r.key} title={r.name}>{r.emoji} <RollingNumber value={r.qty} /></span>)}
      </div>
    </header>
  );
}
