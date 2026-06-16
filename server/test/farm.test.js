import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

async function focusOnce(app, clock, min = 5) {
  const q = (await request(app).post('/api/quests').send({ title: 'f', durationMin: min })).body;
  const s = await request(app).post(`/api/quests/${q.id}/start`);
  clock.current = new Date(s.body.endsAt);
  return request(app).post(`/api/sessions/${s.body.sessionId}/complete`);
}

describe('farm (营地农园)', () => {
  it('grows by focus completions, then harvest yields + frees the plot', async () => {
    const { app, clock } = makeTestApp();
    expect((await request(app).post('/api/farm/plant').send({ slotIndex: 0, crop: 'wheat' })).status).toBe(200);
    let farm = (await request(app).get('/api/state')).body.farm;
    expect(farm[0]).toMatchObject({ crop: 'wheat', progress: 0, required: 2, ready: false });

    const r1 = await focusOnce(app, clock);
    expect(r1.body.events.some(e => e.type === 'farm_grow')).toBe(true); // 专注推进作物
    expect((await request(app).get('/api/state')).body.farm[0].progress).toBe(1);

    await focusOnce(app, clock);
    farm = (await request(app).get('/api/state')).body.farm;
    expect(farm[0]).toMatchObject({ progress: 2, ready: true });

    const h = await request(app).post('/api/farm/harvest').send({ slotIndex: 0 });
    expect(h.status).toBe(200);
    expect(h.body.results.some(x => x.kind === 'material' && x.key === 'wood')).toBe(true);
    expect((await request(app).get('/api/state')).body.farm).toHaveLength(0); // 收获后清空
  });

  it('guards occupied slot, unripe harvest, invalid input', async () => {
    const { app } = makeTestApp();
    await request(app).post('/api/farm/plant').send({ slotIndex: 0, crop: 'herb' });
    expect((await request(app).post('/api/farm/plant').send({ slotIndex: 0, crop: 'wheat' })).status).toBe(409); // 占用
    expect((await request(app).post('/api/farm/harvest').send({ slotIndex: 0 })).status).toBe(409); // 未成熟
    expect((await request(app).post('/api/farm/plant').send({ slotIndex: 9, crop: 'wheat' })).status).toBe(400); // 越界
    expect((await request(app).post('/api/farm/plant').send({ slotIndex: 1, crop: 'nope' })).status).toBe(400); // 无效作物
  });
});
