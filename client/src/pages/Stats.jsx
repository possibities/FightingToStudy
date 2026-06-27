import { useEffect, useState } from 'react';
import { api, claimAchievement } from '../api/client.js';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { RARITY_NAMES } from '../utils/rarity.js';
import Icon from '../components/Icon.jsx';

function rewardLabel(reward) {
  if (reward.kind === 'gold') return <><Icon name="coin" size={13} /> {reward.amount}</>;
  if (reward.kind === 'egg') return <span className={`rarity-${reward.rarity}`}><Icon name="egg" size={13} /> {RARITY_NAMES[reward.rarity]}蛋</span>;
  return <><Icon name="spark" size={13} /> 材料×{reward.qty}</>;
}

function Achievements() {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [claiming, setClaiming] = useState(null);
  const list = state?.achievements;
  if (!list) return null;

  const claimedCount = list.filter(a => a.claimed).length;
  const claimable = list.filter(a => a.unlocked && !a.claimed).length;
  const rank = a => (a.claimed ? 2 : a.unlocked ? 0 : 1);
  const sorted = [...list].sort((a, b) => rank(a) - rank(b) || b.progress / b.threshold - a.progress / a.threshold);

  async function handleClaim(a) {
    if (claiming) return;
    setClaiming(a.key);
    try {
      const { reward } = await claimAchievement(a.key);
      const txt = reward.kind === 'gold' ? `🪙 ${reward.amount} 金币`
        : reward.kind === 'egg' ? `🥚 ${RARITY_NAMES[reward.rarity]}蛋`
        : `材料 ×${reward.qty}`;
      toast.show(`🏆 「${a.name}」已领取:${txt}`);
      await refresh();
    } catch (e) {
      toast.show(e.message);
    } finally {
      setClaiming(null);
    }
  }

  return (
    <div className="card ach-section">
      <h3>
        <Icon name="trophy" size={18} /> 成就
        <span className="dim ach-count num">{claimedCount}/{list.length}</span>
        {claimable > 0 && <span className="ach-pip">{claimable} 个可领取</span>}
      </h3>
      <div className="ach-grid">
        {sorted.map(a => {
          const pct = Math.min(100, (a.progress / a.threshold) * 100);
          const cls = a.claimed ? 'is-claimed' : a.unlocked ? 'is-claimable' : 'is-locked';
          return (
            <div key={a.key} className={`ach-item ${cls}`}>
              <span className="ach-ico"><Icon name={a.icon} /></span>
              <div className="ach-body">
                <b className="ach-name">{a.name}</b>
                <small className="dim">{a.desc}</small>
                <div className="ach-prog">
                  <div className="bar ach-bar"><div style={{ width: `${pct}%` }} /></div>
                  <small className="dim num">{a.progress}/{a.threshold}</small>
                </div>
              </div>
              <div className="ach-action">
                {a.claimed ? (
                  <span className="ach-done"><Icon name="check" size={13} /> 已领</span>
                ) : a.unlocked ? (
                  <button className="btn ach-claim" disabled={claiming === a.key} onClick={() => handleClaim(a)}>
                    {claiming === a.key ? '领取中' : '领取'}
                  </button>
                ) : (
                  <span className="ach-reward dim">{rewardLabel(a.reward)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Stats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const ac = new AbortController();
    api('/stats', { signal: ac.signal }).then(setData).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => ac.abort();
  }, []);
  if (error) return <p className="dim"><Icon name="alert" size={14} /> {error}</p>;
  if (!data) return (
    <div>
      <h2 className="deco-title"><Icon name="chart" size={20} /> 冒险统计</h2>
      <div className="stat-cards">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skel skel-stat" />)}</div>
      <div className="skel skel-block" />
    </div>
  );
  const maxWeek = Math.max(1, ...data.week.map(d => d.minutes));
  const maxSubject = Math.max(1, ...data.subjects.map(s => s.minutes));
  return (
    <div>
      <h2 className="deco-title"><Icon name="chart" size={20} /> 冒险统计</h2>
      <div className="stat-cards">
        <div className="card stat-card"><span className="stat-ico"><Icon name="hourglass" /></span><b className="num">{Math.floor(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</b><small className="dim">总专注</small></div>
        <div className="card stat-card"><span className="stat-ico"><Icon name="sword" /></span><b className="num">{data.totalSessions}</b><small className="dim">完成委托</small></div>
        <div className="card stat-card"><span className="stat-ico"><Icon name="medal" /></span><b className="num">Lv{data.level}</b><small className="dim">{data.title}</small></div>
        <div className="card stat-card"><span className="stat-ico"><Icon name="book" /></span><b className="num">{data.collection.collected}/{data.collection.total}</b><small className="dim">图鉴收集</small></div>
        <div className="card stat-card"><span className="stat-ico"><Icon name="camp" /></span><b className="num">{data.buildingCount}</b><small className="dim">营地建筑</small></div>
      </div>
      <Achievements />
      <div className="card">
        <h3>本周专注(分钟)</h3>
        <div className="week-bars">
          {data.week.map((d, i) => (
            <div key={d.date} className="week-col">
              <span className="dim week-num">{d.minutes || ''}</span>
              <div className="week-bar" style={{ height: `${(d.minutes / maxWeek) * 100}%`, animationDelay: `${i * 0.07}s` }} />
              <small className="dim">{d.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>学科分布</h3>
        {data.subjects.length === 0 && <p className="dim">还没有数据,出发吧!</p>}
        {data.subjects.map((s, i) => (
          <div key={s.tag} className="subject-row">
            <span className="subject-tag">{s.tag}</span>
            <div className="bar subject-bar"><div className="subject-fill" style={{ width: `${(s.minutes / maxSubject) * 100}%`, animationDelay: `${i * 0.08}s` }} /></div>
            <small className="dim">{s.minutes}m</small>
          </div>
        ))}
      </div>
    </div>
  );
}
