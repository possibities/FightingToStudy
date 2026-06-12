import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('quests', () => {
  it('creates a custom quest', async () => {
    const { app } = makeTestApp();
    const res = await request(app).post('/api/quests').send({ title: '读《操作系统》', durationMin: 30, subjectTag: '读书' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: '读《操作系统》', type: 'custom', durationMin: 30, subjectTag: '读书', status: 'ready' });
  });

  it('validates input', async () => {
    const { app } = makeTestApp();
    expect((await request(app).post('/api/quests').send({ title: '', durationMin: 30 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x', durationMin: 3 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x', durationMin: 121 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x'.repeat(31), durationMin: 30 })).status).toBe(400);
    expect((await request(app).post('/api/quests').send({ title: 'x', durationMin: 30, subjectTag: 't'.repeat(21) })).status).toBe(400);
  });

  it('starts a session and computes ends_at from duration', async () => {
    const { app } = makeTestApp();
    const q = (await request(app).post('/api/quests').send({ title: '晨读', durationMin: 25 })).body;
    const res = await request(app).post(`/api/quests/${q.id}/start`);
    expect(res.status).toBe(200);
    expect(new Date(res.body.endsAt).getTime() - new Date('2026-06-11T10:00:00').getTime()).toBe(25 * 60 * 1000);
    const state = (await request(app).get('/api/state')).body;
    expect(state.runningSession).toMatchObject({ questTitle: '晨读', questType: 'custom', durationMin: 25 });
  });

  it('rejects concurrent sessions and non-ready quests', async () => {
    const { app } = makeTestApp();
    const q1 = (await request(app).post('/api/quests').send({ title: 'a', durationMin: 25 })).body;
    const q2 = (await request(app).post('/api/quests').send({ title: 'b', durationMin: 25 })).body;
    await request(app).post(`/api/quests/${q1.id}/start`);
    expect((await request(app).post(`/api/quests/${q2.id}/start`)).status).toBe(409);
    expect((await request(app).post(`/api/quests/${q1.id}/start`)).status).toBe(409);
    expect((await request(app).post('/api/quests/999/start')).status).toBe(404);
  });
});
