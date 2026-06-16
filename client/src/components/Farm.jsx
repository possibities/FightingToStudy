import { useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';
import { plantCrop, harvestCrop } from '../api/client.js';
import { RARITY_NAMES } from '../utils/rarity.js';
import Icon from './Icon.jsx';

const CROP_OPTIONS = [
  { key: 'wheat', emoji: '🌾', name: '麦穗', req: 2 },
  { key: 'herb', emoji: '🌿', name: '灵草', req: 3 },
  { key: 'crystalflower', emoji: '💠', name: '晶花', req: 5 },
];

export default function Farm({ onClose }) {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const total = state.farmPlots ?? 6;
  const bySlot = Object.fromEntries((state.farm ?? []).map(p => [p.slotIndex, p]));

  async function plant(slotIndex, crop) {
    if (busy) return;
    setBusy(true);
    try { await plantCrop(slotIndex, crop); await refresh(); }
    catch (e) { toast.show(e.message); }
    finally { setBusy(false); }
  }
  async function harvest(slotIndex) {
    if (busy) return;
    setBusy(true);
    try {
      const { results } = await harvestCrop(slotIndex);
      const txt = results.map(r => (r.kind === 'egg' ? `${RARITY_NAMES[r.rarity]}蛋` : `${r.name}×${r.qty}`)).join('、');
      toast.show(`🌾 收获:${txt}`);
      await refresh();
    } catch (e) { toast.show(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="modal-mask" onClick={busy ? undefined : onClose}>
      <div className="modal card farm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="farm-title">
        <h3 id="farm-title"><Icon name="sprout" size={20} /> 营地农园</h3>
        <p className="dim">播种后,每完成一次专注作物 +1 成长,成熟即可收获材料(晶花有概率出蛋)。</p>
        <div className="farm-grid">
          {Array.from({ length: total }, (_, i) => {
            const p = bySlot[i];
            if (!p) {
              return (
                <div key={i} className="farm-plot empty">
                  <span className="farm-plot-hint dim">空地 · 播种</span>
                  <div className="farm-seeds">
                    {CROP_OPTIONS.map(c => (
                      <button key={c.key} className="farm-seed" title={`${c.name}(${c.req} 次专注)`} disabled={busy} onClick={() => plant(i, c.key)}>{c.emoji}</button>
                    ))}
                  </div>
                </div>
              );
            }
            const pct = Math.round((p.progress / p.required) * 100);
            return (
              <div key={i} className={`farm-plot${p.ready ? ' ready' : ''}`}>
                <span className="farm-crop">{p.emoji}</span>
                <b className="farm-name">{p.name}</b>
                {p.ready
                  ? <button className="btn farm-harvest" disabled={busy} onClick={() => harvest(i)}>收获</button>
                  : <>
                      <div className="bar farm-bar"><div style={{ width: `${pct}%` }} /></div>
                      <small className="dim num">{p.progress}/{p.required} 次</small>
                    </>}
              </div>
            );
          })}
        </div>
        <button className="btn-ghost" onClick={onClose} disabled={busy}>关闭</button>
      </div>
    </div>
  );
}
