import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Icon from '../components/Icon.jsx';

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
  if (error) return <p className="dim">📡 {error}</p>;
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
