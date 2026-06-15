import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, seqRng } from './helpers.js';

describe('free roam sessions', () => {
  it('starts a hidden free session and blocks concurrent starts', async () => {
    const { app } = makeTestApp();
    const start = await request(app).post('/api/sessions/free/start');
    expect(start.status).toBe(200);
    expect(start.body.sessionId).toBeGreaterThan(0);

    const state = (await request(app).get('/api/state')).body;
    expect(state.runningSession).toMatchObject({ id: start.body.sessionId, free: true });
    expect(state.quests.some(q => q.title === '自由打野')).toBe(false);

    expect((await request(app).post('/api/sessions/free/start')).status).toBe(409);
    const quest = (await request(app).post('/api/quests').send({ title: 'read', durationMin: 25 })).body;
    expect((await request(app).post(`/api/quests/${quest.id}/start`)).status).toBe(409);
  });

  it('ends with no rewards below one minute', async () => {
    const { app, db, clock } = makeTestApp();
    const start = await request(app).post('/api/sessions/free/start');
    clock.current = new Date(clock.current.getTime() + 30_000);

    const res = await request(app).post(`/api/sessions/${start.body.sessionId}/complete`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ events: [], free: true, minutes: 0 });
    expect(db.prepare('SELECT status, minutes FROM sessions WHERE id=?').get(start.body.sessionId))
      .toMatchObject({ status: 'abandoned', minutes: 0 });
    expect((await request(app).get('/api/state')).body.player.gold).toBe(0);
  });

  it('settles by elapsed minutes and caps rewards at 120 minutes', async () => {
    const { app, db, clock } = makeTestApp({ rng: seqRng([0.5, 0.99]) });
    const start = await request(app).post('/api/sessions/free/start');
    clock.current = new Date(clock.current.getTime() + 125 * 60_000);

    const res = await request(app).post(`/api/sessions/${start.body.sessionId}/complete`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ free: true, minutes: 120 });
    expect(res.body.events.find(e => e.type === 'exp')).toMatchObject({ amount: 240 });
    expect(res.body.events.find(e => e.type === 'gold')).toMatchObject({ amount: 120 });
    expect(db.prepare('SELECT status, minutes FROM sessions WHERE id=?').get(start.body.sessionId))
      .toMatchObject({ status: 'completed', minutes: 120 });
    expect((await request(app).get('/api/state')).body.player).toMatchObject({ gold: 120 });
  });
});
