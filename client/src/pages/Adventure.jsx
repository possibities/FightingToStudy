import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { api } from '../api/client.js';
import { useCountdown, formatMs } from '../hooks/useCountdown.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { notify } from '../utils/notify.js';
import TimerRing from '../components/TimerRing.jsx';
import RewardSequence from '../components/RewardSequence.jsx';
import Modal from '../components/Modal.jsx';
import Icon from '../components/Icon.jsx';

export default function Adventure() {
  const { state, refresh } = useGame();
  const toast = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [finishedQuest, setFinishedQuest] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showRetreat, setShowRetreat] = useState(false);

  const session = state?.runningSession;

  // 无进行中冒险时回营地(放在 effect 里,避免渲染期间导航)
  useEffect(() => {
    if (state && !session && !events) navigate('/');
  }, [state, session, events, navigate]);

  async function complete() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api(`/sessions/${session.id}/complete`, { method: 'POST' });
      setFinishedQuest({ title: session.questTitle, type: session.questType, durationMin: session.durationMin, subjectTag: session.subjectTag });
      setEvents(data.events);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function abandon() {
    setShowRetreat(false);
    try {
      const r = await api(`/sessions/${session.id}/abandon`, { method: 'POST' });
      if (r.lost) toast.show(`🏃 仓促撤退,路上掉了 ${r.lost.emoji}${r.lost.name} ×${r.lost.qty}`);
      await refresh();
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  async function done() {
    await refresh();
    navigate('/');
  }

  if (events) return <RewardSequence events={events} quest={finishedQuest} onDone={done} />;
  if (!state) return <div className="splash">🔥 正在点亮篝火…</div>;
  if (!session) return null;
  const buddy = state.creatures.at(-1)?.emoji ?? '🔥';
  return (
    <>
      <Running session={session} buddy={buddy} onComplete={complete} onAbandon={() => setShowRetreat(true)} error={error} busy={busy} />
      {showRetreat && (
        <Modal onClose={() => setShowRetreat(false)} className="retreat-modal" labelledBy="retreat-title">
          <div className="retreat-buddy">{buddy}</div>
          <div className="speech">真的要走吗?战利品会留在森林里的…</div>
          <h3 id="retreat-title">🏳️ 中途撤退</h3>
          <ul className="retreat-warns dim">
            <li>本次专注的所有掉落将泡汤</li>
            <li>慌乱中可能弄丢 1~2 个材料</li>
            <li>委托不会锁定,随时可以再出发</li>
          </ul>
          <div className="modal-actions">
            <button className="btn-ghost btn-danger" onClick={abandon}>确认撤退</button>
            <button className="btn" onClick={() => setShowRetreat(false)}>🔥 再坚持一下</button>
          </div>
        </Modal>
      )}
    </>
  );
}

const ADV_STARS = [[6, 8], [14, 22], [24, 12], [34, 28], [44, 7], [55, 18], [64, 30], [72, 10], [81, 24], [90, 14], [12, 40], [88, 38], [50, 36], [70, 44]];

const CHEERS = [
  '你专注的样子在发光 ✨',
  '再坚持一下,篝火替你留着 🔥',
  '别看手机,看我 👀',
  '这一局打完,蛋说不定就孵了 🥚',
  '风很安静,正适合赶路',
  '凯旋的号角已经在路上 🎺',
  '今天的你比昨天强一点点',
  '我赌一颗松果,你能撑到最后 🌰',
];

function Running({ session, buddy, onComplete, onAbandon, error, busy }) {
  const { remainingMs, done } = useCountdown(session.endsAt);
  const totalMs = new Date(session.endsAt).getTime() - new Date(session.startedAt).getTime();
  const pct = totalMs > 0 ? Math.min(100, Math.round(((totalMs - remainingMs) / totalMs) * 100)) : 0;
  const [cheer, setCheer] = useState(() => CHEERS[Math.floor(Math.random() * CHEERS.length)]);
  useWakeLock(!done); // 专注中保持屏幕常亮
  useEffect(() => {
    const t = setInterval(() => setCheer(CHEERS[Math.floor(Math.random() * CHEERS.length)]), 18000);
    return () => clearInterval(t);
  }, []);
  // 计时结束且页面在后台时,弹通知召唤玩家回来结算
  useEffect(() => {
    if (done) notify('⚔️ 冒险完成!', `「${session.questTitle}」已凯旋,回营地清点战利品吧!`);
  }, [done, session.questTitle]);
  return (
    <div className="adventure" style={{ '--dusk': done ? 1 : pct / 100 }}>
      <div className="adventure-stars">
        {ADV_STARS.map(([x, y], i) => (
          <span key={i} className="star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 6) * 0.4}s` }} />
        ))}
        <span className="shooting-star" />
        <span className="shooting-star delay" />
        <span className="firefly" style={{ left: '12%', bottom: '14%', animationDuration: '8s, 2.4s' }} />
        <span className="firefly" style={{ left: '82%', bottom: '10%', animationDuration: '10s, 2.4s', animationDelay: '1.2s, 1.2s' }} />
        <span className="firefly" style={{ left: '64%', bottom: '20%', animationDuration: '9s, 2.4s', animationDelay: '0.6s, 0.6s' }} />
        <div className="hill hill-far adv-hill-far" />
        <div className="hill hill-mid adv-hill-mid" />
      </div>
      <p className="adventure-quest">委托 · {session.questTitle}{session.subjectTag ? ` · ${session.subjectTag}` : ''}</p>
      <div className="timer-aura">
        <TimerRing remainingMs={remainingMs} totalMs={totalMs} done={done} label={done ? '时辰已到' : formatMs(remainingMs)} />
      </div>
      <small className="dim">旅程 {done ? 100 : pct}%</small>
      <div className="speech">{done ? '冒险归来,清点战利品吧!' : cheer}</div>
      <div className="adventure-buddy">{buddy}</div>
      {error && <p className="error-line">{error}</p>}
      {done || error
        ? <button className="btn btn-big" disabled={busy} onClick={onComplete}>{error ? '重试结算' : <><Icon name="trophy" size={18} /> 凯旋归来</>}</button>
        : <button className="btn-ghost retreat" onClick={onAbandon}><Icon name="flag" size={14} /> 中途撤退(本次无掉落)</button>}
    </div>
  );
}
