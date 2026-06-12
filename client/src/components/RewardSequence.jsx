import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { playSfx } from '../audio/sfx.js';
import { RARITY_NAMES } from '../utils/rarity.js';

const STEP_MS = 900;
const FLIP_TYPES = ['egg', 'hatch'];
const RARE_TIERS = ['rare', 'epic', 'legendary'];

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

function Burst() {
  const parts = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
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

function FlipCard({ view, rarity, onFlip }) {
  const [flipped, setFlipped] = useState(false);
  const rare = RARE_TIERS.includes(rarity);
  if (!flipped) {
    return (
      <button type="button" className="reward-item flip-back" onClick={() => { setFlipped(true); onFlip(rare); }}>
        🎴 点击翻开战利品…
      </button>
    );
  }
  return (
    <div className={`reward-item flip-swap ${view.cls || ''}`} style={{ position: 'relative' }}>
      <span className="reward-icon">{view.icon}</span>{view.text}
      {rare && <Burst />}
    </div>
  );
}

export default function RewardSequence({ events, quest, onDone }) {
  const [shown, setShown] = useState(0);
  const [waitingFlip, setWaitingFlip] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => { playSfx('complete'); }, []);

  useEffect(() => {
    if (shown >= events.length || waitingFlip) return;
    const next = events[shown];
    const t = setTimeout(() => {
      if (next.type === 'levelup') playSfx('levelup');
      if (FLIP_TYPES.includes(next.type)) setWaitingFlip(true); // 扣牌等待玩家翻开,序列暂停
      setShown(s => s + 1);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [shown, events, waitingFlip]);

  function handleFlip(rare) {
    setWaitingFlip(false);
    if (rare) playSfx('rare');
  }

  async function again() {
    if (busy) return;
    setBusy(true);
    try {
      await api('/quests', { method: 'POST', body: { title: quest.title, durationMin: quest.durationMin, subjectTag: quest.subjectTag } });
    } catch (e) {
      toast.show(e.message);
    }
    onDone();
  }

  const allShown = shown >= events.length && !waitingFlip;
  return (
    <div className="reward-mask">
      <div className="reward-panel card">
        <h2 className="reward-title">⚔️ 委托完成!</h2>
        <AnimatePresence>
          {events.slice(0, shown).map((e, i) => {
            const v = eventView(e);
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                {FLIP_TYPES.includes(e.type)
                  ? <FlipCard view={v} rarity={e.rarity ?? e.species?.rarity} onFlip={handleFlip} />
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
    </div>
  );
}
