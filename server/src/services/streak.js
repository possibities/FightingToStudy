// 连续专注天数:由已完成 session 的本地日期纯派生,不落库。
// current 从今天往回数;今天还没专注不算断(自动从昨天起算),不惩罚「今天还没开始」。
// best 为历史最长链,只增不减,供成就使用。
// 注:按 86400000ms 步进在跨 DST 的时区有理论误差,本应用目标环境(中国时区/CI 的 UTC)无 DST。
// 参数 now 是 Date(非函数),与三处调用点 stats/state/achievements 传值一致。
import { localDateStr } from '../utils/dates.js';

export function computeStreak(db, now) {
  const days = new Set(
    db.prepare("SELECT completed_at FROM sessions WHERE status='completed'").all()
      .map(r => localDateStr(new Date(r.completed_at)))
  );
  if (days.size === 0) return { current: 0, best: 0 };

  const today = localDateStr(now);
  let cursor = now;
  if (!days.has(today)) cursor = new Date(now.getTime() - 86400000);
  let current = 0;
  while (days.has(localDateStr(cursor))) {
    current += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }

  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev !== null && new Date(prev).getTime() + 86400000 === new Date(d).getTime() ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best: Math.max(best, current) };
}
