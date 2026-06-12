import { useGame } from '../state/GameStateContext.jsx';

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
          <small className="dim">EXP {player.exp}/{player.expToNext}</small>
        </div>
      </div>
      <div className="topbar-res">
        <span>🪙 {player.gold}</span>
        {resources.map(r => <span key={r.key} title={r.name}>{r.emoji} {r.qty}</span>)}
      </div>
    </header>
  );
}
