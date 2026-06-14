import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { createBoss, addBossTodo, deleteBossTodo, deleteBoss, startQuestById } from '../api/client.js';
import { requestNotify } from '../utils/notify.js';
import Icon from '../components/Icon.jsx';

const DURATIONS = [5, 15, 25, 45, 60, 90];

export default function Boss() {
  const { state, refresh } = useGame();
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  const bosses = state.bosses ?? [];
  const active = bosses.filter(b => b.status === 'active');
  const defeated = bosses.filter(b => b.status === 'defeated');

  async function newBoss() {
    if (!title.trim()) { toast.show('给讨伐目标起个名字'); return; }
    try { await createBoss(title.trim()); setTitle(''); await refresh(); }
    catch (e) { toast.show(e.message); }
  }
  async function start(todoId) {
    try { requestNotify(); await startQuestById(todoId); await refresh(); navigate('/adventure'); }
    catch (e) { toast.show(e.message); }
  }

  return (
    <div>
      <h2 className="deco-title"><Icon name="skull" size={20} /> 讨伐</h2>
      <p className="dim">把大目标立成讨伐旗,拆成代办逐条专注击破。清空全部代办即击败,获高稀蛋 + 金币 + 专属称号。</p>

      <div className="boss-new">
        <input className="input" maxLength={40} placeholder="新讨伐目标(如:啃完《操作系统》)"
          value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && newBoss()} />
        <button className="btn" onClick={newBoss}>立旗</button>
      </div>

      {active.length === 0 && <p className="dim" style={{ marginTop: 14 }}>还没有讨伐目标。</p>}
      {active.map(b => <BossCard key={b.id} boss={b} onStart={start} onChanged={refresh} toast={toast} />)}

      {defeated.length > 0 && (
        <section>
          <h3 className="deco-title"><Icon name="trophy" size={18} /> 战绩</h3>
          <div className="dex-grid">
            {defeated.map(b => (
              <div key={b.id} className="card dex-card rarity-legendary">
                <span className="dex-tab">已讨平</span>
                <span className="dex-emoji"><Icon name="trophy" size={28} /></span>
                <b>{b.title}</b>
                <small className="dim">称号「{b.titleAward}」</small>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BossCard({ boss, onStart, onChanged, toast }) {
  const [tTitle, setTTitle] = useState('');
  const [tDur, setTDur] = useState(25);
  const pct = boss.totalMin > 0 ? Math.round((boss.doneMin / boss.totalMin) * 100) : 0;

  async function addTodo() {
    if (!tTitle.trim()) { toast.show('代办标题?'); return; }
    try { await addBossTodo(boss.id, { title: tTitle.trim(), durationMin: tDur }); setTTitle(''); await onChanged(); }
    catch (e) { toast.show(e.message); }
  }
  async function delTodo(tid) {
    try { await deleteBossTodo(boss.id, tid); await onChanged(); } catch (e) { toast.show(e.message); }
  }
  async function removeBoss() {
    try { await deleteBoss(boss.id); await onChanged(); } catch (e) { toast.show(e.message); }
  }

  return (
    <div className="card boss-card">
      <div className="boss-head">
        <b className="boss-title">{boss.title}</b>
        <button className="boss-del" title="删除目标" onClick={removeBoss}><Icon name="cross" size={16} /></button>
      </div>
      <div className="boss-hp">
        <div className="bar boss-hp-bar"><div style={{ width: `${pct}%` }} /></div>
        <small className="dim num">{boss.doneMin}/{boss.totalMin} min</small>
      </div>

      <div className="boss-todos">
        {boss.todos.map(t => (
          <div key={t.id} className={`boss-todo${t.status === 'done' ? ' done' : ''}`}>
            <span className="boss-todo-box"><Icon name={t.status === 'done' ? 'check' : 'scroll'} size={16} /></span>
            <span className="boss-todo-main"><b>{t.title}</b><span className="num dim"> · {t.durationMin}min</span></span>
            {t.status === 'done' ? <span className="dim">已讨</span>
              : t.status === 'active' ? <span className="dim">进行中</span>
                : (
                  <span className="boss-todo-actions">
                    <button className="btn" onClick={() => onStart(t.id)}>出发 <Icon name="arrow" size={14} /></button>
                    <button className="boss-del" title="删除代办" onClick={() => delTodo(t.id)}><Icon name="cross" size={14} /></button>
                  </span>
                )}
          </div>
        ))}
      </div>

      <div className="boss-addtodo">
        <input className="input" maxLength={30} placeholder="加一条代办"
          value={tTitle} onChange={e => setTTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} />
        <select value={tDur} onChange={e => setTDur(Number(e.target.value))}>
          {DURATIONS.map(d => <option key={d} value={d}>{d}min</option>)}
        </select>
        <button className="btn-ghost" title="添加" onClick={addTodo}><Icon name="plus" size={14} /></button>
      </div>
    </div>
  );
}
