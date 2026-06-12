export default function QuestCard({ quest, onStart }) {
  const done = quest.status === 'done';
  const failed = quest.status === 'failed' || quest.status === 'expired';
  return (
    <div className={`card quest-card${done ? ' quest-done' : ''}`}>
      <div className="quest-main">
        <b>📜 {quest.title}</b>
        <small className="dim">
          {quest.durationMin} 分钟{quest.subjectTag ? ` · ${quest.subjectTag}` : ''} · 预期 ✨{quest.durationMin * 2} 🪙{quest.durationMin} 📦×{1 + Math.floor(quest.durationMin / 15)}
        </small>
      </div>
      {done ? <span className="quest-badge">✅</span>
        : failed ? <span className="quest-badge dim">✖</span>
        : <button className="btn" onClick={() => onStart(quest)}>出发</button>}
    </div>
  );
}
