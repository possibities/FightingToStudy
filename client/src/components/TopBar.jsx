import { useGame } from '../state/GameStateContext.jsx';
import RollingNumber from './RollingNumber.jsx';
import Icon from './Icon.jsx';

export default function TopBar() {
  const { state } = useGame();
  const { player, resources } = state;
  const pct = Math.round((player.exp / player.expToNext) * 100);
  return (
    <header className="topbar card">
      <div className="topbar-id">
        <span className="topbar-avatar"><Icon name="avatar" /></span>
        <div>
          <b>{player.title} · Lv{player.level}</b>
          <div className="bar exp-bar"><div style={{ width: `${pct}%` }} /></div>
          <small className="dim">EXP <RollingNumber value={player.exp} className="num" />/<span className="num">{player.expToNext}</span></small>
        </div>
      </div>
      <div className="topbar-res">
        <span className="res-chip"><Icon name="coin" /><RollingNumber value={player.gold} className="num" /></span>
        {resources.map(r => (
          <span className="res-chip" key={r.key} title={r.name}><Icon name={r.key} /><RollingNumber value={r.qty} className="num" /></span>
        ))}
      </div>
    </header>
  );
}
