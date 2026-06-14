import Icon from './Icon.jsx';

export default function QuestCard({ quest, onStart, onRepeat }) {
  const done = quest.status === 'done';
  const failed = quest.status === 'failed' || quest.status === 'expired';
  return (
    <div className={`card quest-card${done ? ' quest-done' : ''}`}>
      <div className="quest-main">
        <span className="quest-ico"><Icon name="scroll" /></span>
        <div className="quest-text">
          <b>{quest.title}</b>
          <span className="quest-meta">
            <span className="num">{quest.durationMin}</span> 分钟{quest.subjectTag ? ` · ${quest.subjectTag}` : ''}
            <Icon name="spark" /><span className="num">{quest.durationMin * 2}</span>
            <Icon name="coin" /><span className="num">{quest.durationMin}</span>
            <Icon name="backpack" />×<span className="num">{1 + Math.floor(quest.durationMin / 15)}</span>
          </span>
        </div>
      </div>
      {done ? (
        quest.type === 'custom' && onRepeat
          ? <span className="quest-actions"><span className="quest-badge"><Icon name="check" /></span><button className="btn-ghost" title="再来一次" onClick={() => onRepeat(quest)}><Icon name="repeat" size={16} /></button></span>
          : <span className="quest-badge"><Icon name="check" /></span>
      ) : failed ? <span className="quest-badge dim"><Icon name="cross" /></span>
        : <button className="btn" onClick={() => onStart(quest)}>出发 <Icon name="arrow" size={15} /></button>}
    </div>
  );
}
