import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('GET /api/state', () => {
  it('bootstraps player, campfire and empty inventory', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    expect(res.body.player).toMatchObject({ name: '冒险者', level: 1, exp: 0, gold: 0, title: '见习学者', expToNext: 100, pityCounter: 0 });
    expect(res.body.buildings).toEqual([{ slotIndex: 0, key: 'campfire', level: 1 }]);
    expect(res.body.resources).toHaveLength(4);
    expect(res.body.resources.every(r => r.qty === 0)).toBe(true);
    expect(res.body.runningSession).toBeNull();
    expect(res.body.incubatingEgg).toBeNull();
    expect(res.body.creatures).toEqual([]);
    expect(res.body.collectionProgress).toEqual({ collected: 0, total: 24 });
    expect(res.body.buildingCatalog).toHaveLength(8);
    expect(res.body.welcomeBack).toBeNull();
    expect(typeof res.body.serverNow).toBe('string');
  });

  it('keeps today-completed custom quests visible and exposes knownTags', async () => {
    const { app, clock } = makeTestApp();
    const q = (await request(app).post('/api/quests').send({ title: '读书', durationMin: 25, subjectTag: '阅读' })).body;
    const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
    clock.current = new Date(new Date(s.endsAt).getTime() + 1000);
    await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    const state = (await request(app).get('/api/state')).body;
    expect(state.quests.find(x => x.id === q.id)).toMatchObject({ status: 'done', type: 'custom' });
    expect(state.knownTags).toContain('阅读');
  });
});
