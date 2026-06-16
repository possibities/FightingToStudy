import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, seqRng } from './helpers.js';

describe('dice (篝火骰戏)', () => {
  it('win on matching big (sum 8), pays double', async () => {
    const { app, db } = makeTestApp({ rng: seqRng([0.5, 0.5]) }); // d=4,4 → sum 8(大)
    db.prepare('UPDATE player SET gold=100 WHERE id=1').run();
    const r = await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 10 });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ dice: [4, 4], sum: 8, win: true, delta: 10 });
    expect((await request(app).get('/api/state')).body.player.gold).toBe(110); // -10 +20
  });

  it('loses on 7 (house sweep) regardless of choice', async () => {
    const { app, db } = makeTestApp({ rng: seqRng([0.4, 0.55]) }); // d=3,4 → sum 7
    db.prepare('UPDATE player SET gold=100 WHERE id=1').run();
    const r = await request(app).post('/api/dice/roll').send({ choice: 'small', bet: 20 });
    expect(r.body).toMatchObject({ sum: 7, win: false, delta: -20 });
    expect((await request(app).get('/api/state')).body.player.gold).toBe(80);
  });

  it('enforces daily limit', async () => {
    const { app, db } = makeTestApp(); // rng 0.5 → sum 8 每局大胜
    db.prepare('UPDATE player SET gold=100000 WHERE id=1').run();
    for (let i = 0; i < 10; i++) {
      const r = await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 10 });
      expect(r.status).toBe(200);
    }
    expect((await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 10 })).status).toBe(409);
    expect((await request(app).get('/api/state')).body.diceRemaining).toBe(0);
  });

  it('validates choice, bet range, and balance', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET gold=100 WHERE id=1').run();
    expect((await request(app).post('/api/dice/roll').send({ choice: 'x', bet: 10 })).status).toBe(400);
    expect((await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 5 })).status).toBe(400);
    expect((await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 200 })).status).toBe(400);
    db.prepare('UPDATE player SET gold=5 WHERE id=1').run();
    expect((await request(app).post('/api/dice/roll').send({ choice: 'big', bet: 10 })).status).toBe(400);
  });
});
