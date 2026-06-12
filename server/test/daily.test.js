import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('daily quests', () => {
  it('lazily generates exactly 3 daily quests (5/25/45 min) once per day', async () => {
    const { app } = makeTestApp();
    const r1 = await request(app).get('/api/state');
    const daily = r1.body.quests.filter(q => q.type === 'daily');
    expect(daily).toHaveLength(3);
    expect(daily.map(q => q.durationMin).sort((a, b) => a - b)).toEqual([5, 25, 45]);
    expect(daily.every(q => q.status === 'ready')).toBe(true);
    const r2 = await request(app).get('/api/state');
    expect(r2.body.quests.filter(q => q.type === 'daily')).toHaveLength(3);
  });

  it("expires yesterday's ready quests and generates new ones next day", async () => {
    const { app, db, clock } = makeTestApp();
    await request(app).get('/api/state');
    clock.current = new Date('2026-06-12T08:00:00');
    const res = await request(app).get('/api/state');
    expect(res.body.quests.filter(q => q.type === 'daily')).toHaveLength(3); // 只剩今天的
    expect(db.prepare("SELECT COUNT(*) AS c FROM quests WHERE status='expired'").get().c).toBe(3);
  });
});
