const R = 88;
const C = 2 * Math.PI * R;

export default function TimerRing({ remainingMs, totalMs, label }) {
  const frac = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  return (
    <div className="timer-ring">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--card-2)" strokeWidth="8" />
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--gold)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke-dashoffset .3s linear', filter: 'drop-shadow(0 0 10px rgba(216,179,106,.45))' }} />
      </svg>
      <div className="timer-label">{label}</div>
    </div>
  );
}
