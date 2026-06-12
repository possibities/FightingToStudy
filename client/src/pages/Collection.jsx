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
    api('/collection').then(setData).catch(e => setError(e.message));
  }, []);
  if (error) return <p className="dim">📡 {error}</p>;
  if (!data) return <p className="dim">翻阅图鉴中…</p>;
  return (
    <div>
      <h2>📖 生物图鉴 <small className="dim">{data.progress.collected}/{data.progress.total}</small></h2>
      {ORDER.map(r => (
        <section key={r}>
          <h3 className={`rarity-${r}`}>{RARITY_NAMES[r]}</h3>
          <div className="dex-grid">
            {data.species.filter(s => s.rarity === r).map(s => (
              <div key={s.key} className={`card dex-card rarity-${r}${s.collected ? '' : ' dex-locked'}`}>
                <span className="dex-emoji">{s.collected ? s.emoji : '❓'}</span>
                <b>{s.collected ? s.name : '???'}</b>
                {s.collected && <small className="dim">{s.flavor}{s.count > 1 ? ` ×${s.count}` : ''}</small>}
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h3>🎒 材料一览</h3>
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
