import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Stats() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api('/stats').then(setData).catch(e => setError(e.message));
  }, []);
  if (error) return <p className="dim">📡 {error}</p>;
  if (!data) return <p className="dim">清点战果中…</p>;
  const maxWeek = Math.max(1, ...data.week.map(d => d.minutes));
  const maxSubject = Math.max(1, ...data.subjects.map(s => s.minutes));
  return (
    <div>
      <h2>📊 冒险统计</h2>
      <div className="stat-cards">
        <div className="card stat-card"><b>{Math.floor(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</b><small className="dim">总专注</small></div>
        <div className="card stat-card"><b>{data.totalSessions}</b><small className="dim">完成委托</small></div>
        <div className="card stat-card"><b>Lv{data.level}</b><small className="dim">{data.title}</small></div>
        <div className="card stat-card"><b>{data.collection.collected}/{data.collection.total}</b><small className="dim">图鉴收集</small></div>
        <div className="card stat-card"><b>{data.buildingCount}</b><small className="dim">营地建筑</small></div>
      </div>
      <div className="card">
        <h3>本周专注(分钟)</h3>
        <div className="week-bars">
          {data.week.map(d => (
            <div key={d.date} className="week-col">
              <span className="dim week-num">{d.minutes || ''}</span>
              <div className="week-bar" style={{ height: `${(d.minutes / maxWeek) * 100}%` }} />
              <small className="dim">{d.date.slice(5)}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>学科分布</h3>
        {data.subjects.length === 0 && <p className="dim">还没有数据,出发吧!</p>}
        {data.subjects.map(s => (
          <div key={s.tag} className="subject-row">
            <span className="subject-tag">{s.tag}</span>
            <div className="bar subject-bar"><div style={{ width: `${(s.minutes / maxSubject) * 100}%` }} /></div>
            <small className="dim">{s.minutes}m</small>
          </div>
        ))}
      </div>
    </div>
  );
}
