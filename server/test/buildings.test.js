import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp, grant } from './helpers.js';

describe('buildings', () => {
  it('rejects building without materials', async () => {
    const { app } = makeTestApp();
    const res = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('材料不足');
  });

  it('builds, deducts cost, then upgrades with level-scaled cost', async () => {
    const { app, db } = makeTestApp();
    grant(db, 'wood', 100);
    const b1 = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(b1.body).toEqual({ slotIndex: 1, buildingKey: 'tent', level: 1 });
    expect(db.prepare("SELECT qty FROM inventory WHERE item_key='wood'").get().qty).toBe(95);  // 5×1
    const b2 = await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect(b2.body.level).toBe(2);
    expect(db.prepare("SELECT qty FROM inventory WHERE item_key='wood'").get().qty).toBe(85);  // 再扣 5×2
  });

  it('enforces slot and level rules', async () => {
    const { app, db } = makeTestApp();
    grant(db, 'wood', 999); grant(db, 'stone', 999);
    expect((await request(app).post('/api/buildings').send({ slotIndex: 0, buildingKey: 'tent' })).status).toBe(400);     // 篝火地块
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'campfire' })).status).toBe(400); // 不可建
    expect((await request(app).post('/api/buildings').send({ slotIndex: 9, buildingKey: 'tent' })).status).toBe(400);     // 越界
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' });
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'library' })).status).toBe(400);  // 已有其他建筑
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' }); // Lv2
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' }); // Lv3
    expect((await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'tent' })).status).toBe(400);     // 满级
  });

  it('building bonuses affect settlement', async () => {
    const { app, db, clock } = makeTestApp();
    grant(db, 'wood', 100); grant(db, 'stone', 100);
    await request(app).post('/api/buildings').send({ slotIndex: 1, buildingKey: 'library' }); // EXP +5%
    const q = (await request(app).post('/api/quests').send({ title: '晨读', durationMin: 20 })).body;
    const s = (await request(app).post(`/api/quests/${q.id}/start`)).body;
    clock.current = new Date(new Date(s.endsAt).getTime() + 1000);
    const res = await request(app).post(`/api/sessions/${s.sessionId}/complete`);
    expect(res.body.events.find(e => e.type === 'exp').amount).toBe(42); // 40 × 1.05
  });
});
