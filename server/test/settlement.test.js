import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, seqRng, grant } from './helpers.js';

async function startQuest(app, { title = '晨读', durationMin = 25 } = {}) {
  const q = (await request(app).post('/api/quests').send({ title, durationMin })).body;
  const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
  return { quest: q, sessionId: s.sessionId, endsAt: s.endsAt };
}

describe('settlement', () => {
  it('rejects completing before time is up', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T10:10:00');
    expect((await request(app).post(`/api/sessions/${sessionId}/complete`)).status).toBe(409);
  });

  it('allows completion within the 30s tolerance and pays out', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T10:24:35'); // 结束于 10:25,容差 30s
    const res = await request(app).post(`/api/sessions/${sessionId}/complete`);
    expect(res.status).toBe(200);
    const types = res.body.events.map(e => e.type);
    expect(types).toEqual(expect.arrayContaining(['exp', 'gold', 'material']));
    const state = (await request(app).get('/api/state')).body;
    expect(state.player.gold).toBe(25);
    expect(state.player.exp).toBe(50);
    expect(state.runningSession).toBeNull();
  });

  it('is idempotent: double complete returns same events and pays once', async () => {
    const { app, clock } = makeTestApp();
    const { sessionId } = await startQuest(app);
    clock.current = new Date('2026-06-11T11:00:00');
    const r1 = await request(app).post(`/api/sessions/${sessionId}/complete`);
    const r2 = await request(app).post(`/api/sessions/${sessionId}/complete`);
    expect(r2.status).toBe(200);
    expect(r2.body).toEqual(r1.body);
    expect((await request(app).get('/api/state')).body.player.gold).toBe(25);
  });

  it('stores egg drops; the new egg gains no progress in the same settlement', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,  // 结算1:材料、掉蛋判定命中、稀有度 common(required 3)
      0.5, 0.99,      // 结算2:无蛋 → 孵化进度 1/3
    ]);
    const { app, clock } = makeTestApp({ rng });
    const a = await startQuest(app, { title: 'a' });
    clock.current = new Date('2026-06-11T11:00:00');
    const r1 = await request(app).post(`/api/sessions/${a.sessionId}/complete`);
    expect(r1.body.events.find(e => e.type === 'egg')).toBeTruthy();
    expect(r1.body.events.find(e => e.type === 'egg_progress')).toBeFalsy();

    const b = await startQuest(app, { title: 'b' });
    clock.current = new Date('2026-06-11T12:00:00');
    const r2 = await request(app).post(`/api/sessions/${b.sessionId}/complete`);
    expect(r2.body.events.find(e => e.type === 'egg_progress')).toMatchObject({ progress: 1, required: 3 });
  });

  it('hatches the egg and registers the creature', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,   // 掉 common 蛋(required 3)
      0.5, 0.99,       // 进度 1
      0.5, 0.99,       // 进度 2
      0.5, 0.99, 0.0,  // 进度 3 → 孵化,取第一个未收集物种
    ]);
    const { app, clock } = makeTestApp({ rng });
    let last;
    for (let i = 0; i < 4; i++) {
      const s = await startQuest(app, { title: `q${i}` });
      clock.current = new Date(clock.current.getTime() + 60 * 60 * 1000);
      last = await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const hatch = last.body.events.find(e => e.type === 'hatch');
    expect(hatch).toBeTruthy();
    expect(hatch.species.rarity).toBe('common');
    const state = (await request(app).get('/api/state')).body;
    expect(state.creatures).toHaveLength(1);
    expect(state.incubatingEgg).toBeNull();
  });

  it('incubates only the oldest egg when multiple are queued', async () => {
    const rng = seqRng([
      0.5, 0.0, 0.5,  // 结算1:掉蛋A(common)
      0.5, 0.0, 0.5,  // 结算2:掉蛋B;蛋A进度→1(新蛋B本次不吃进度)
      0.5, 0.99,      // 结算3:无蛋;蛋A进度→2
    ]);
    const { app, db, clock } = makeTestApp({ rng });
    for (let i = 0; i < 3; i++) {
      const s = await startQuest(app, { title: `m${i}` });
      clock.current = new Date(clock.current.getTime() + 60 * 60 * 1000);
      await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    }
    const eggs = db.prepare('SELECT * FROM eggs ORDER BY id').all();
    expect(eggs).toHaveLength(2);
    expect(eggs[0].progress).toBe(2); // 最老的蛋吃进度
    expect(eggs[1].progress).toBe(0); // 排队的蛋不动
    const state = (await request(app).get('/api/state')).body;
    expect(state.incubatingEgg).toMatchObject({ id: eggs[0].id, progress: 2, queueCount: 2 });
  });

  it('abandon pays nothing and the quest returns to ready', async () => {
    const { app, db } = makeTestApp();
    const { sessionId, quest } = await startQuest(app);
    expect((await request(app).post(`/api/sessions/${sessionId}/abandon`)).status).toBe(200);
    const state = (await request(app).get('/api/state')).body;
    expect(state.player.gold).toBe(0);
    expect(state.runningSession).toBeNull();
    // 撤退的惩罚是本次无掉落;委托本身回到 ready,可重新出发
    expect(db.prepare('SELECT status FROM quests WHERE id=?').get(quest.id).status).toBe('ready');
    expect((await request(app).post(`/api/quests/${quest.id}/start`)).status).toBe(200);
    expect((await request(app).post(`/api/sessions/${sessionId}/abandon`)).status).toBe(409);
    expect((await request(app).post(`/api/sessions/${sessionId}/complete`)).status).toBe(409);
  });

  it('abandon drops 1-2 random materials when owned', async () => {
    const { app, db } = makeTestApp({ rng: seqRng([0.0, 0.99]) }); // 选库存第一种,数量 1+floor(0.99*2)=2
    grant(db, 'wood', 10);
    const { sessionId } = await startQuest(app);
    const res = await request(app).post(`/api/sessions/${sessionId}/abandon`);
    expect(res.body.lost).toMatchObject({ key: 'wood', qty: 2 });
    expect(db.prepare("SELECT qty FROM inventory WHERE item_key='wood'").get().qty).toBe(8);
  });

  it('abandon loses nothing when inventory is empty', async () => {
    const { app } = makeTestApp();
    const { sessionId } = await startQuest(app);
    const res = await request(app).post(`/api/sessions/${sessionId}/abandon`);
    expect(res.body.lost).toBeNull();
  });

  it('updates pity counter across settlements', async () => {
    const { app, db, clock } = makeTestApp({ rng: seqRng([0.5, 0.99]) });
    const s = await startQuest(app);
    clock.current = new Date('2026-06-11T11:00:00');
    await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    expect(db.prepare('SELECT pity_counter AS p FROM player WHERE id=1').get().p).toBe(1);
  });
});
