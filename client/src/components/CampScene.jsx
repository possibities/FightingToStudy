import { useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import BuildMenu from './BuildMenu.jsx';

const SLOT_POS = [
  { left: '44%', top: '58%' },  // 0 篝火(固定)
  { left: '18%', top: '48%' },
  { left: '68%', top: '44%' },
  { left: '8%', top: '68%' },
  { left: '30%', top: '74%' },
  { left: '58%', top: '72%' },
  { left: '80%', top: '62%' },
  { left: '86%', top: '80%' },
];

const STARS = [[8, 12], [20, 6], [33, 18], [47, 9], [61, 14], [72, 7], [85, 16], [15, 26], [55, 24], [90, 28], [40, 30], [78, 33]];

// 由 id 派生稳定的伪随机站位与游走节奏,刷新不跳变
function creatureStyle(id, i) {
  const h = (id * 2654435761) >>> 0;
  return {
    left: `${6 + (h % 78)}%`,
    bottom: `${4 + ((h >> 7) % 14)}%`,
    animationDuration: `${7 + ((h >> 3) % 7)}s`,
    animationDelay: `${(i % 5) * 0.8}s`,
  };
}

export default function CampScene() {
  const { state } = useGame();
  const [slot, setSlot] = useState(null);
  const bySlot = Object.fromEntries(state.buildings.map(b => [b.slotIndex, b]));
  const catalog = Object.fromEntries(state.buildingCatalog.map(b => [b.key, b]));

  return (
    <section className="scene">
      <div className="scene-sky">
        {STARS.map(([x, y], i) => (
          <span key={i} className="star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
        <span className="scene-sign"><span className="only-night">🌙</span><span className="only-day">☀️</span></span>
        <span className="shooting-star" />
      </div>
      {SLOT_POS.map((pos, i) => {
        const b = bySlot[i];
        return (
          <button key={i}
            className={`slot${b ? '' : ' slot-empty'}${b?.key === 'campfire' ? ' slot-campfire' : ''}`}
            style={pos}
            onClick={() => i !== 0 && setSlot(i)}
            title={b ? catalog[b.key].name : '空地,点击建造'}>
            {b ? (
              <>
                <span className="slot-emoji">{catalog[b.key].emoji}</span>
                <span className="slot-label">{catalog[b.key].name} Lv{b.level}</span>
              </>
            ) : <span className="slot-plus">＋</span>}
          </button>
        );
      })}
      <div className="scene-creatures">
        {state.creatures.map((c, i) => (
          <span key={c.id} className="creature" style={creatureStyle(c.id, i)} title={c.name}>{c.emoji}</span>
        ))}
      </div>
      {slot !== null && <BuildMenu slotIndex={slot} building={bySlot[slot] ?? null} onClose={() => setSlot(null)} />}
    </section>
  );
}
