import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { RARITY_NAMES } from '../utils/rarity.js';

const ORDER = ['common', 'rare', 'epic', 'legendary'];

export default function Collection() {
  const { state } = useGame();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const ac = new AbortController();
    api('/collection', { signal: ac.signal }).then(setData).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => ac.abort();
  }, []);
  if (error) return <p className="dim">📡 {error}</p>;
  if (!data) return (
    <div>
      <h2 className="deco-title">📖 生物图鉴</h2>
      <div className="bar dex-progress"><div style={{ width: 0 }} /></div>
      <div className="dex-grid">{Array.from({ length: 10 }, (_, i) => <div key={i} className="skel skel-card" />)}</div>
    </div>
  );
  return (
    <div>
      <h2 className="deco-title">📖 生物图鉴 <small className="dim">{data.progress.collected}/{data.progress.total}</small></h2>
      <div className="bar dex-progress"><div style={{ width: `${(data.progress.collected / data.progress.total) * 100}%` }} /></div>
      {ORDER.map(r => {
        const group = data.species.filter(s => s.rarity === r);
        const got = group.filter(s => s.collected).length;
        return (
          <section key={r}>
            <h3 className={`rarity-${r} deco-title`}>{RARITY_NAMES[r]} <small className="dim">{got}/{group.length}</small></h3>
            <div className="dex-grid">
              {group.map(s => (
                <div key={s.key} className={`card dex-card rarity-${r}${s.collected ? '' : ' dex-locked'}`}>
                  <span className="dex-emoji">{s.collected ? s.emoji : '❓'}</span>
                  <b>{s.collected ? s.name : '???'}</b>
                  {s.collected && <small className="dim">{s.flavor}{s.count > 1 ? ` ×${s.count}` : ''}</small>}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <section>
        <h3 className="deco-title">🎒 材料一览</h3>
        <div className="dex-grid">
          {state.resources.map(r => (
            <div key={r.key} className="card dex-card">
              <span className="dex-emoji">{r.emoji}</span>
              <b>{r.name}</b>
              <small className="dim">持有 {r.qty}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
