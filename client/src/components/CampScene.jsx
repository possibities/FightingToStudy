import { useRef, useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import BuildMenu from './BuildMenu.jsx';
import Icon from './Icon.jsx';

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

// 远树剪影:[left%, bottom%, 字号px, 不透明度]
const TREES = [
  [7, 40, 15, 0.45], [21, 41, 13, 0.4], [52, 40, 16, 0.45], [88, 41, 13, 0.4],
  [33, 34, 21, 0.75], [73, 33, 23, 0.8], [95, 32, 19, 0.7],
];

// 萤火虫:[left%, bottom%, 飞行时长s, 闪烁延迟s]
const FIREFLIES = [
  [16, 18, 7, 0], [34, 10, 9, 0.7], [52, 22, 8, 1.3], [63, 12, 10, 0.4],
  [77, 20, 7.5, 1.8], [88, 9, 9.5, 1.1], [25, 28, 8.5, 2.1], [45, 6, 11, 0.2],
];

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
  const sceneRef = useRef(null);
  const bySlot = Object.fromEntries(state.buildings.map(b => [b.slotIndex, b]));
  const catalog = Object.fromEntries(state.buildingCatalog.map(b => [b.key, b]));

  // 鼠标视差:不触发 React 重渲染,直接写 CSS 变量
  function onMove(e) {
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5));
  }
  function onLeave() {
    const el = sceneRef.current;
    if (!el) return;
    el.style.setProperty('--px', '0');
    el.style.setProperty('--py', '0');
  }

  return (
    <section className="scene" ref={sceneRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="scene-sky plx-1">
        {STARS.map(([x, y], i) => (
          <span key={i} className="star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
        ))}
        <span className="cloud cloud-a" />
        <span className="cloud cloud-b" />
        <span className="scene-sign"><span className="only-night"><Icon name="moon" /></span><span className="only-day"><Icon name="sun" /></span></span>
        <span className="shooting-star" />
      </div>
      <div className="hill hill-far plx-2" />
      <div className="hill hill-mid plx-3" />
      <div className="scene-trees plx-3">
        {TREES.map(([x, b, size, op], i) => (
          <span key={i} className="tree" style={{ left: `${x}%`, bottom: `${b}%`, fontSize: size, opacity: op }}>🌲</span>
        ))}
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
                <span className="slot-ico"><Icon name={b.key} /></span>
                <span className="slot-label">{catalog[b.key].name} Lv{b.level}</span>
              </>
            ) : <span className="slot-plus"><Icon name="plus" /></span>}
          </button>
        );
      })}
      <div className="scene-creatures">
        {state.creatures.map((c, i) => (
          <span key={c.id} className="creature" style={creatureStyle(c.id, i)} title={c.name}>{c.emoji}</span>
        ))}
      </div>
      <div className="scene-fireflies plx-4">
        {FIREFLIES.map(([x, b, dur, delay], i) => (
          <span key={i} className="firefly" style={{ left: `${x}%`, bottom: `${b}%`, animationDuration: `${dur}s, 2.4s`, animationDelay: `${delay}s, ${delay}s` }} />
        ))}
      </div>
      {slot !== null && <BuildMenu slotIndex={slot} building={bySlot[slot] ?? null} onClose={() => setSlot(null)} />}
    </section>
  );
}
