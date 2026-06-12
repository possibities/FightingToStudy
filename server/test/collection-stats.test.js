import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('collection & stats', () => {
  it('lists all species as uncollected initially', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/collection');
    expect(res.body.species).toHaveLength(24);
    expect(res.body.species.every(s => !s.collected)).toBe(true);
    expect(res.body.progress).toEqual({ collected: 0, total: 24 });
  });

  it('aggregates totals, week and subjects from completed sessions', async () => {
    const { app, clock } = makeTestApp();
    for (const [title, durationMin, subjectTag] of [['英语听力', 30, '英语'], ['刷题', 60, '算法'], ['再刷题', 30, '算法']]) {
      const q = (await request(app).post('/api/quests').send({ title, durationMin, subjectTag })).body;
      const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
      clock.current = new Date(new Date(s.endsAt).getTime() + 1000);
      await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const res = await request(app).get('/api/stats');
    expect(res.body.totalMinutes).toBe(120);
    expect(res.body.totalSessions).toBe(3);
    expect(res.body.week).toHaveLength(7);
    expect(res.body.week[6].minutes).toBe(120); // 第 7 个是"今天"
    expect(res.body.subjects).toEqual([{ tag: '算法', minutes: 90 }, { tag: '英语', minutes: 30 }]);
    expect(res.body.collection.total).toBe(24);
    expect(res.body.buildingCount).toBe(1); // 篝火
  });
});
