import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createQuest } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { playSfx, vibrate } from '../audio/sfx.js';
import { RARITY_NAMES } from '../utils/rarity.js';

const FLIP_TYPES = ['egg', 'hatch'];
const RARE_TIERS = ['rare', 'epic', 'legendary'];
const REDUCE = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const rarityOf = e => e.rarity ?? e.species?.rarity ?? null;

// 瀑布揭晓:普通行越往后越快(360→220ms),稀有/升级行前留白(hitstop)制造顿挫
function stepFor(event, idx) {
  if (RARE_TIERS.includes(rarityOf(event)) || event.type === 'levelup') return 680;
  return Math.max(220, 360 - idx * 28);
}

function eventView(e) {
  switch (e.type) {
    case 'exp': return { icon: '✨', text: `经验 +${e.amount}` };
    case 'gold': return { icon: '🪙', text: `金币 +${e.amount}` };
    case 'levelup': return { icon: '🎺', text: `升级!Lv${e.level}${e.title ? ` · 获得称号「${e.title}」` : ''}`, cls: 'rarity-legendary' };
    case 'material': return { icon: e.emoji, text: `${e.name} ×${e.qty}` };
    case 'egg': return { icon: '🥚', text: `获得${RARITY_NAMES[e.rarity]}的蛋!${e.pity ? '(命运的眷顾)' : ''}`, cls: `rarity-${e.rarity}` };
    case 'egg_progress': return { icon: '🐣', text: `孵化进度 ${e.progress}/${e.required}`, cls: `rarity-${e.rarity}` };
    case 'hatch': return { icon: e.species.emoji, text: `孵化了「${e.species.name}」!${e.species.flavor}`, cls: `rarity-${e.species.rarity}` };
    default: return { icon: '❔', text: '???' };
  }
}

// 粒子爆裂,颗数随稀有度递增
function Burst({ count = 12 }) {
  const parts = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const dist = 42 + (i % 3) * 24;
    return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, delay: (i % 4) * 0.05 };
  });
  return (
    <span className="burst">
      {parts.map((p, i) => (
        <span key={i} className="burst-p" style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.delay}s` }}>✨</span>
      ))}
    </span>
  );
}

// 传说降临:短暂全屏接管(god ray + 幕布),自动落幕,可点击跳过
function LegendaryStage({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="legend-stage" onClick={onDone} role="presentation">
      <div className="legend-rays" />
      <div className="legend-veil" />
      <div className="legend-text">✦ 传说降临 ✦</div>
    </div>
  );
}

function FlipCard({ view, rarity, type, onFlip }) {
  const [flipped, setFlipped] = useState(false);
  const tier = RARE_TIERS.includes(rarity) ? rarity : null;
  if (!flipped) {
    return (
      <button type="button" className="reward-item flip-back" onClick={() => { setFlipped(true); onFlip(rarity); }}>
        🎴 点击翻开战利品…
      </button>
    );
  }
  const burstCount = tier === 'legendary' ? 20 : tier === 'epic' ? 16 : 12;
  return (
    <div className={`reward-item flip-swap ${view.cls || ''}${type === 'hatch' ? ' hatch-reveal' : ''}`} style={{ position: 'relative' }}>
      {type === 'hatch' && <span className="hatch-ring" />}
      <span className="reward-icon">{view.icon}</span>{view.text}
      {tier && <Burst count={burstCount} />}
    </div>
  );
}

export default function RewardSequence({ events, quest, onDone }) {
  const [shown, setShown] = useState(0);
  const [waitingFlip, setWaitingFlip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [combo, setCombo] = useState(0);
  const [pulse, setPulse] = useState(null);   // 'rare' | 'epic' 面板脉冲
  const [stage, setStage] = useState(false);  // 传说天光接管
  const toast = useToast();
  const pulseT = useRef(0);

  useEffect(() => { playSfx('complete'); }, []);

  useEffect(() => {
    if (shown >= events.length || waitingFlip) return;
    const next = events[shown];
    const t = setTimeout(() => {
      if (next.type === 'levelup') { playSfx('levelup'); vibrate(20); }
      if (FLIP_TYPES.includes(next.type)) setWaitingFlip(true); // 扣牌等待玩家翻开,序列暂停
      else setCombo(c => c + 1);
      setShown(s => s + 1);
    }, stepFor(next, shown));
    return () => clearTimeout(t);
  }, [shown, events, waitingFlip]);

  function flashPulse(kind) {
    setPulse(kind);
    clearTimeout(pulseT.current);
    pulseT.current = setTimeout(() => setPulse(null), 700);
  }

  function handleFlip(rarity) {
    setWaitingFlip(false);
    setCombo(c => c + 1);
    playSfx('flip');
    if (rarity === 'legendary') {
      playSfx('legendary'); vibrate([40, 60, 140]);
      if (!REDUCE()) setStage(true);
    } else if (rarity === 'epic') {
      playSfx('epic'); vibrate([30, 40, 60]); flashPulse('epic');
    } else if (rarity === 'rare') {
      playSfx('rare'); vibrate(30); flashPulse('rare');
    }
  }

  async function again() {
    if (busy) return;
    setBusy(true);
    try {
      await createQuest(quest);
    } catch (e) {
      toast.show(e.message);
    }
    onDone();
  }

  const allShown = shown >= events.length && !waitingFlip;
  return (
    <div className="reward-mask">
      <div className={`reward-panel card${pulse ? ` panel-pulse pulse-${pulse}` : ''}`}>
        <h2 className="reward-title">⚔️ 委托完成!</h2>
        {combo >= 3 && <div className="combo-badge" key={combo}>连击 ×{combo}</div>}
        <AnimatePresence>
          {events.slice(0, shown).map((e, i) => {
            const v = eventView(e);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                {FLIP_TYPES.includes(e.type)
                  ? <FlipCard view={v} rarity={rarityOf(e)} type={e.type} onFlip={handleFlip} />
                  : <div className={`reward-item ${v.cls || ''}`}><span className="reward-icon">{v.icon}</span>{v.text}</div>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {allShown && (
          <div className="reward-actions">
            {quest?.type === 'custom' && <button className="btn-ghost" disabled={busy} onClick={again}>🔁 再来一次</button>}
            <button className="btn" onClick={onDone}>回营地</button>
          </div>
        )}
      </div>
      {stage && <LegendaryStage onDone={() => setStage(false)} />}
    </div>
  );
}
