import { useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';

const EFFECT_TEXT = {
  exp_pct: v => `EXP +${v}%/级`,
  gold_pct: v => `金币 +${v}%/级`,
  egg_pct_points: v => `蛋概率 +${v} 个百分点/级`,
  material_flat: v => `材料 +${v}/级`,
};

export default function BuildMenu({ slotIndex, building, onClose }) {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const have = Object.fromEntries(state.resources.map(r => [r.key, r.qty]));
  const matMeta = Object.fromEntries(state.resources.map(r => [r.key, r]));
  const options = building
    ? state.buildingCatalog.filter(b => b.key === building.key)
    : state.buildingCatalog.filter(b => b.buildable);

  async function build(key) {
    setBusy(true);
    try {
      await api('/buildings', { method: 'POST', body: { slotIndex, buildingKey: key } });
      await refresh();
      onClose();
    } catch (e) {
      toast.show(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal card" onClick={e => e.stopPropagation()}>
        <h3>{building ? '升级建筑' : '建造新建筑'}</h3>
        {options.map(def => {
          const maxed = building && building.level >= 3;
          const targetLevel = building ? building.level + 1 : 1;
          const cost = Object.entries(def.baseCost).map(([k, v]) => ({ key: k, qty: v * targetLevel }));
          const afford = cost.every(c => (have[c.key] || 0) >= c.qty);
          return (
            <div key={def.key} className="card build-row">
              <div>
                <b>{def.emoji} {def.name}{building ? ` Lv${building.level}${maxed ? '' : ` → Lv${targetLevel}`}` : ''}</b>
                <div className="dim">{def.desc}</div>
                {def.effect && <div className="dim">效果:{EFFECT_TEXT[def.effect.type](def.effect.value)}</div>}
                {!maxed && (
                  <div className="dim">消耗:{cost.map(c => `${matMeta[c.key]?.emoji ?? c.key}${c.qty}`).join('  ')}</div>
                )}
              </div>
              {maxed
                ? <span className="quest-badge">已满级</span>
                : <button className="btn" disabled={busy || !afford} onClick={() => build(def.key)}>{building ? '升级' : '建造'}</button>}
            </div>
          );
        })}
        <button className="btn-ghost" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
