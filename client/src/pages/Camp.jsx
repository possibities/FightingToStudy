import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api/client.js';
import QuestCard from '../components/QuestCard.jsx';
import CreateQuestModal from '../components/CreateQuestModal.jsx';
import CampScene from '../components/CampScene.jsx';

export default function Camp() {
  const { state, refresh } = useGame();
  const toast = useToast();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (state.runningSession) navigate('/adventure');
  }, [state.runningSession, navigate]);

  useEffect(() => {
    if (state.welcomeBack) {
      const mats = state.welcomeBack.materials.reduce((s, m) => s + m.qty, 0);
      toast.show(`🦊 伙伴们想你了!回归礼包:🪙${state.welcomeBack.gold} + 材料×${mats}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startQuest(quest) {
    try {
      await api(`/quests/${quest.id}/start`, { method: 'POST' });
      await refresh();
      navigate('/adventure');
    } catch (e) {
      toast.show(e.message);
    }
  }

  async function repeatQuest(quest) {
    try {
      await api('/quests', { method: 'POST', body: { title: quest.title, durationMin: quest.durationMin, subjectTag: quest.subjectTag } });
      await refresh();
    } catch (e) {
      toast.show(e.message);
    }
  }

  const daily = state.quests.filter(q => q.type === 'daily');
  const custom = state.quests.filter(q => q.type === 'custom');
  const egg = state.incubatingEgg;

  return (
    <div className="camp-split">
      <CampScene />
      <section className="quest-panel">
        <h3 className="panel-title">📜 今日委托</h3>
        {daily.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} />)}
        <h3 className="panel-title">🗺️ 自由委托</h3>
        {custom.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} onRepeat={repeatQuest} />)}
        <button className="btn-ghost quest-add" onClick={() => setShowCreate(true)}>＋ 自建委托</button>
        {egg && (
          <div className="card egg-card">
            <span>🥚 <b className={`rarity-${egg.rarity}`}>孵化中</b>{egg.queueCount > 1 ? <small className="dim"> · 队列 {egg.queueCount}</small> : null}</span>
            <div className="bar"><div style={{ width: `${(egg.progress / egg.required) * 100}%` }} /></div>
            <small className="dim">再专注 {egg.required - egg.progress} 次就孵出来了!</small>
          </div>
        )}
        {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
      </section>
    </div>
  );
}
