import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../state/GameStateContext.jsx';
import { api } from '../api/client.js';
import { useCountdown, formatMs } from '../hooks/useCountdown.js';
import TimerRing from '../components/TimerRing.jsx';
import RewardSequence from '../components/RewardSequence.jsx';

export default function Adventure() {
  const { state, refresh } = useGame();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [finishedQuest, setFinishedQuest] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
    if (!window.confirm('确定撤退吗?本次冒险将没有任何掉落。')) return;
    try {
      await api(`/sessions/${session.id}/abandon`, { method: 'POST' });
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
  return <Running session={session} buddy={buddy} onComplete={complete} onAbandon={abandon} error={error} busy={busy} />;
}

function Running({ session, buddy, onComplete, onAbandon, error, busy }) {
  const { remainingMs, done } = useCountdown(session.endsAt);
  const totalMs = new Date(session.endsAt).getTime() - new Date(session.startedAt).getTime();
  return (
    <div className="adventure">
      <p className="dim">— 委托:{session.questTitle} —</p>
      <TimerRing remainingMs={remainingMs} totalMs={totalMs} label={done ? '时辰已到' : formatMs(remainingMs)} />
      <div className="adventure-buddy">{buddy}</div>
      <p className="dim">{done ? '冒险归来,清点战利品吧!' : '伙伴在篝火旁等你凯旋…'}</p>
      {error && <p className="error-line">{error}</p>}
      {done || error
        ? <button className="btn btn-big" disabled={busy} onClick={onComplete}>{error ? '重试结算' : '🎺 凯旋归来'}</button>
        : <button className="btn-ghost retreat" onClick={onAbandon}>中途撤退(本次无掉落)</button>}
    </div>
  );
}
