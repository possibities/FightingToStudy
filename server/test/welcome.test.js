import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

describe('welcome back gift', () => {
  it('grants a gift after 3+ days away, once per day', async () => {
    const { app, db } = makeTestApp();
    db.prepare("UPDATE player SET last_completed_at='2026-06-01T10:00:00.000Z' WHERE id=1").run();
    const r1 = await request(app).get('/api/state');
    expect(r1.body.welcomeBack).toBeTruthy();
    expect(r1.body.welcomeBack.gold).toBe(200);
    expect(r1.body.welcomeBack.materials.reduce((s, m) => s + m.qty, 0)).toBe(5);
    expect(r1.body.player.gold).toBe(200); // 已入账
    const r2 = await request(app).get('/api/state');
    expect(r2.body.welcomeBack).toBeNull();
    expect(r2.body.player.gold).toBe(200); // 不重复发
  });

  it('does not trigger for fresh players or recent activity', async () => {
    const { app, db } = makeTestApp();
    expect((await request(app).get('/api/state')).body.welcomeBack).toBeNull();
    db.prepare("UPDATE player SET last_completed_at='2026-06-10T10:00:00.000Z' WHERE id=1").run();
    expect((await request(app).get('/api/state')).body.welcomeBack).toBeNull();
  });
});
