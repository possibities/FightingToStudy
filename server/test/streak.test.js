import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

// 指定完成日期塞一条已完成专注(绕过计时流程)
function completeOn(db, iso, minutes = 5) {
  const q = db.prepare(
    "INSERT INTO quests (title, type, duration_min, status, created_at) VALUES ('x','custom',?,'done','2026-06-01T10:00:00')"
  ).run(minutes);
  db.prepare(
    "INSERT INTO sessions (quest_id, started_at, ends_at, status, minutes, completed_at) VALUES (?, ?, ?, 'completed', ?, ?)"
  ).run(q.lastInsertRowid, iso, iso, minutes, iso);
}

describe('streak (连续专注天数)', () => {
  it('returns zeros when no sessions', async () => {
    const { app } = makeTestApp();
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 0, best: 0 });
  });

  it('counts consecutive days ending today', async () => {
    const { app, db } = makeTestApp(); // 今天 = 2026-06-11
    completeOn(db, '2026-06-09T10:00:00');
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 3, best: 3 });
  });

  it('today not yet focused does not break the streak (counts from yesterday)', async () => {
    const { app, db, clock } = makeTestApp();
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    clock.current = new Date('2026-06-12T09:00:00'); // 新的一天,还没专注
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 2, best: 2 });
  });

  it('gap breaks current but best survives; same-day sessions count once', async () => {
    const { app, db } = makeTestApp(); // 今天 = 2026-06-11
    completeOn(db, '2026-06-05T10:00:00');
    completeOn(db, '2026-06-06T10:00:00');
    completeOn(db, '2026-06-07T10:00:00'); // 最长链 3
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-10T22:00:00'); // 同日第二次,只算一天(current 仍只数到 06-10 这一天)
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 1, best: 3 });
  });

  it('cross-month chain counts once per day for best; current 0 when detached from today', async () => {
    const { app, db } = makeTestApp(); // 今天 = 2026-06-11
    completeOn(db, '2026-06-30T10:00:00');
    completeOn(db, '2026-07-01T10:00:00');
    completeOn(db, '2026-07-02T10:00:00'); // 跨月链 3 天,但今天 06-11 与 06-10 均无记录 → 断档
    expect((await request(app).get('/api/stats')).body.streak).toEqual({ current: 0, best: 3 });
  });

  it('feeds streakBest achievement metric (streak_3)', async () => {
    const { app, db } = makeTestApp();
    completeOn(db, '2026-06-09T10:00:00');
    completeOn(db, '2026-06-10T10:00:00');
    completeOn(db, '2026-06-11T10:00:00');
    const ach = (await request(app).get('/api/state')).body.achievements;
    expect(ach.find(a => a.key === 'streak_3')).toMatchObject({ unlocked: true, progress: 3, threshold: 3 });
    expect(ach.find(a => a.key === 'streak_7')).toMatchObject({ unlocked: false, progress: 3, threshold: 7 });
  });
});
