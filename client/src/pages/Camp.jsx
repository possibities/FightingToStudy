import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api, createQuest, startFreeRoam } from '../api/client.js';
import QuestCard from '../components/QuestCard.jsx';
import CreateQuestModal from '../components/CreateQuestModal.jsx';
import CampScene from '../components/CampScene.jsx';
import Icon from '../components/Icon.jsx';
import { requestNotify } from '../utils/notify.js';

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
      requestNotify(); // 借出发这次点击手势申请通知权限,便于专注结束时提醒
      await api(`/quests/${quest.id}/start`, { method: 'POST' });
      await refresh();
      navigate('/adventure');
    } catch (e) {
      toast.show(e.message);
    }
  }

  async function repeatQuest(quest) {
    try {
      await createQuest(quest);
      await refresh();
    } catch (e) {
      toast.show(e.message);
    }
  }

  async function freeRoam() {
    try {
      requestNotify(); // 借点击手势申请通知权限
      await startFreeRoam();
      await refresh();
      navigate('/adventure');
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
        <button className="btn btn-big freeroam-btn" onClick={freeRoam}><Icon name="sword" size={18} /> 打野 · 自由专注</button>
        <h3 className="panel-title deco-title"><span className="sec-idx">01</span>今日委托</h3>
        {daily.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} />)}
        <h3 className="panel-title deco-title"><span className="sec-idx">02</span>自由委托</h3>
        {custom.map(q => <QuestCard key={q.id} quest={q} onStart={startQuest} onRepeat={repeatQuest} />)}
        <button className="btn-ghost quest-add" onClick={() => setShowCreate(true)}><Icon name="plus" size={15} /> 自建委托</button>
        {egg && (
          <div className="card egg-card">
            <span><Icon name="egg" size={16} /> <b className={`rarity-${egg.rarity}`}>孵化中</b>{egg.queueCount > 1 ? <small className="dim"> · 队列 <span className="num">{egg.queueCount}</span></small> : null}</span>
            <div className="bar"><div style={{ width: `${(egg.progress / egg.required) * 100}%` }} /></div>
            <small className="dim">再专注 <span className="num">{egg.required - egg.progress}</span> 次就孵出来了!</small>
          </div>
        )}
        {showCreate && <CreateQuestModal onClose={() => setShowCreate(false)} />}
      </section>
    </div>
  );
}
