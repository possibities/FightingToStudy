import { useState } from 'react';
import { api } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';

const TAG_SUGGESTIONS = ['英语', '算法', '阅读', '数学', '写作'];

export default function CreateQuestModal({ onClose }) {
  const { refresh } = useGame();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) { toast.show('给委托起个名字吧'); return; }
    setBusy(true);
    try {
      await api('/quests', { method: 'POST', body: { title: title.trim(), durationMin: duration, subjectTag: tag.trim() || null } });
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
        <h3>新的委托</h3>
        <input className="input" maxLength={30} placeholder="比如:读《操作系统》第3章"
          value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <label className="dim">时长:{duration} 分钟</label>
        <input type="range" min={5} max={120} step={5} value={duration} onChange={e => setDuration(Number(e.target.value))} />
        <input className="input" placeholder="学科标签(可选)" value={tag} onChange={e => setTag(e.target.value)} />
        <div className="tag-row">
          {TAG_SUGGESTIONS.map(t => <button key={t} className="btn-ghost tag" onClick={() => setTag(t)}>{t}</button>)}
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn" disabled={busy} onClick={submit}>创建</button>
        </div>
      </div>
    </div>
  );
}
