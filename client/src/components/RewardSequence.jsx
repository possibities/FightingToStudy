import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';
import { playSfx } from '../audio/sfx.js';
import { RARITY_NAMES } from '../utils/rarity.js';

const STEP_MS = 900;

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

export default function RewardSequence({ events, quest, onDone }) {
  const [shown, setShown] = useState(0);
  const toast = useToast();

  useEffect(() => { playSfx('complete'); }, []);

  useEffect(() => {
    if (shown >= events.length) return;
    const e = events[shown];
    if (e.type === 'levelup') playSfx('levelup');
    else if ((e.type === 'egg' || e.type === 'hatch') && ['rare', 'epic', 'legendary'].includes(e.rarity ?? e.species?.rarity)) playSfx('rare');
    const t = setTimeout(() => setShown(s => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [shown, events]);

  async function again() {
    try {
      await api('/quests', { method: 'POST', body: { title: quest.title, durationMin: quest.durationMin, subjectTag: quest.subjectTag } });
    } catch (e) {
      toast.show(e.message);
    }
    onDone();
  }

  const allShown = shown >= events.length;
  return (
    <div className="reward-mask">
      <div className="reward-panel card">
        <h2 className="reward-title">⚔️ 委托完成!</h2>
        <AnimatePresence>
          {events.slice(0, shown).map((e, i) => {
            const v = eventView(e);
            return (
              <motion.div key={i} className={`reward-item ${v.cls || ''}`}
                initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <span className="reward-icon">{v.icon}</span>{v.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {allShown && (
          <div className="reward-actions">
            {quest?.type === 'custom' && <button className="btn-ghost" onClick={again}>🔁 再来一次</button>}
            <button className="btn" onClick={onDone}>回营地</button>
          </div>
        )}
      </div>
    </div>
  );
}
