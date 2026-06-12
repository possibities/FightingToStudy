import { createDb } from '../src/db/index.js';
import { createApp } from '../src/app.js';

export function seqRng(values) {
  let i = 0;
  return () => (i < values.length ? values[i++] : values[values.length - 1]);
}

// clock.current 可被测试直接改写以"快进时间"
export function makeTestApp({ start = '2026-06-11T10:00:00', rng = () => 0.5 } = {}) {
  const db = createDb(':memory:');
  const clock = { current: new Date(start) };
  const app = createApp({ db, now: () => clock.current, rng });
  return { app, db, clock };
}

export function grant(db, key, qty) {
  db.prepare('UPDATE inventory SET qty = qty + ? WHERE item_key=?').run(qty, key);
}
