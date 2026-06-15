import { useRef, useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';
import { spinWheel } from '../api/client.js';
import { playSfx, vibrate } from '../audio/sfx.js';
import { RARITY_NAMES } from '../utils/rarity.js';
import Icon from './Icon.jsx';

const SINGLE = 40;
const TEN = 360;
// 8 段:与服务端奖池类目对应,稀蛋单列一格
const SEGMENTS = [
  { cat: 'gold', icon: 'coin' }, { cat: 'material', icon: 'backpack' },
  { cat: 'egg', icon: 'egg' }, { cat: 'material', icon: 'backpack' },
  { cat: 'gold', icon: 'coin' }, { cat: 'egg', icon: 'egg' },
  { cat: 'material', icon: 'backpack' }, { cat: 'rare', icon: 'gem' },
];

function segIndexFor(r) {
  if (r.kind === 'egg' && (r.rarity === 'epic' || r.rarity === 'legendary')) return 7;
  const cat = r.kind; // gold / material / egg
  const idxs = SEGMENTS.map((s, i) => (s.cat === cat ? i : -1)).filter(i => i >= 0);
  return idxs.length ? idxs[Math.floor(Math.random() * idxs.length)] : 0;
}
const rewardIconName = r => (r.kind === 'gold' ? 'coin' : r.kind === 'egg' ? 'egg' : null);
const rewardText = r => (r.kind === 'gold' ? `金币 +${r.amount}` : r.kind === 'material' ? `${r.name} ×${r.qty}` : `${RARITY_NAMES[r.rarity]}的蛋`);

export default function Wheel({ onClose }) {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [single, setSingle] = useState(null);
  const [ten, setTen] = useState(null);
  const rotRef = useRef(0);
  const gold = state.player.gold;

  function landTo(idx) {
    const landAngle = (360 - (idx * 45 + 22.5)) % 360;        // 让该段中心转到顶部指针
    const next = rotRef.current + 360 * 4 + (((landAngle - (rotRef.current % 360)) % 360) + 360) % 360;
    rotRef.current = next;
    setRot(next);
  }

  async function spin(count) {
    if (spinning) return;
    const cost = count === 10 ? TEN : SINGLE;
    if (gold < cost) { toast.show('金币不够转一次盘'); return; }
    setSpinning(true); setSingle(null); setTen(null);
    try {
      const { results } = await spinWheel(count);
      playSfx('flip');
      const anchor = count === 10 ? (results.find(x => x.kind === 'egg') || results[0]) : results[0];
      landTo(segIndexFor(anchor));
      setTimeout(() => {
        if (count === 1) {
          const r = results[0];
          setSingle(r);
          if (r.kind === 'egg') { playSfx(r.rarity === 'legendary' ? 'legendary' : r.rarity === 'epic' ? 'epic' : 'rare'); vibrate(30); }
        } else {
          setTen(results);
          if (results.some(x => ['epic', 'legendary'].includes(x.rarity))) playSfx('epic');
          else if (results.some(x => x.kind === 'egg')) playSfx('rare');
        }
        setSpinning(false);
        refresh();
      }, 2900);
    } catch (e) { toast.show(e.message); setSpinning(false); }
  }

  return (
    <div className="modal-mask" onClick={spinning ? undefined : onClose}>
      <div className="modal card wheel-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="wheel-title">
        <h3 id="wheel-title"><Icon name="wheel" size={20} /> 星夜转盘</h3>
        <div className="wheel-wrap">
          <span className="wheel-pointer" />
          <div className="wheel" style={{ transform: `rotate(${rot}deg)` }}>
            {SEGMENTS.map((s, i) => (
              <div key={i} className={`wheel-seg${s.cat === 'rare' ? ' rare' : ''}`} style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}>
                <span className="wheel-seg-ico"><Icon name={s.icon} size={18} /></span>
              </div>
            ))}
            <span className="wheel-hub" />
          </div>
        </div>

        {single && (
          <div className={`wheel-result reward-item ${single.kind === 'egg' ? `rarity-${single.rarity}` : ''}`}>
            <span className="reward-icon">{rewardIconName(single) ? <Icon name={rewardIconName(single)} /> : single.emoji}</span>{rewardText(single)}
          </div>
        )}
        {ten && (
          <div className="wheel-ten">
            {ten.map((r, i) => (
              <span key={i} className={`wheel-chip ${r.kind === 'egg' ? `rarity-${r.rarity}` : ''}`} title={rewardText(r)}>
                {rewardIconName(r) ? <Icon name={rewardIconName(r)} size={14} /> : r.emoji}
                <span className="num">{r.kind === 'gold' ? r.amount : r.kind === 'material' ? `×${r.qty}` : ''}</span>
              </span>
            ))}
          </div>
        )}

        <div className="wheel-actions">
          <button className="btn" onClick={() => spin(1)} disabled={spinning || gold < SINGLE}>单抽 · {SINGLE}</button>
          <button className="btn" onClick={() => spin(10)} disabled={spinning || gold < TEN}>十连 · {TEN}</button>
        </div>
        <small className="dim">当前金币 <span className="num">{gold}</span> · 十连含保底(必出蛋)</small>
        <button className="btn-ghost" onClick={onClose} disabled={spinning}>关闭</button>
      </div>
    </div>
  );
}
