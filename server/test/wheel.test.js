import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

// 默认 rng=0.5 → 奖池落在「材料」(永不出蛋),便于测保底
describe('wheel (星夜转盘)', () => {
  it('single spin deducts gold and applies a reward', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET gold=1000 WHERE id=1').run();
    const r = await request(app).post('/api/wheel/spin').send({ count: 1 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ cost: 40 });
    expect(r.body.results).toHaveLength(1);
    expect(r.body.results[0].kind).toBe('material'); // rng 0.5
    const gold = (await request(app).get('/api/state')).body.player.gold;
    expect(gold).toBe(960); // 1000 - 40,材料无返金
  });

  it('rejects when gold insufficient', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET gold=10 WHERE id=1').run();
    expect((await request(app).post('/api/wheel/spin').send({ count: 1 })).status).toBe(400);
  });

  it('pity guarantees an egg within 10 spins', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET gold=10000 WHERE id=1').run();
    let eggs = 0;
    for (let i = 0; i < 10; i++) {
      const r = await request(app).post('/api/wheel/spin').send({ count: 1 });
      eggs += r.body.results.filter(x => x.kind === 'egg').length;
    }
    expect(eggs).toBeGreaterThanOrEqual(1); // 第 10 抽保底
  });

  it('ten-pull costs 360 and returns 10 results', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET gold=1000 WHERE id=1').run();
    const r = await request(app).post('/api/wheel/spin').send({ count: 10 });
    expect(r.body.cost).toBe(360);
    expect(r.body.results).toHaveLength(10);
    expect(r.body.results.some(x => x.kind === 'egg')).toBe(true); // 十连内保底必出蛋
  });
});
