import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

// 直接塞一条已完成专注,绕过计时流程便于快速堆量
function addCompletedSession(db, minutes = 5) {
  const q = db.prepare(
    "INSERT INTO quests (title, type, duration_min, status, created_at) VALUES ('x','custom',?,'done','2026-06-11T10:00:00')"
  ).run(minutes);
  db.prepare(
    "INSERT INTO sessions (quest_id, started_at, ends_at, status, minutes, completed_at) VALUES (?, '2026-06-11T10:00:00','2026-06-11T10:05:00','completed',?, '2026-06-11T10:05:00')"
  ).run(q.lastInsertRowid, minutes);
}

describe('achievements (成就系统)', () => {
  it('exposes achievements in /api/state with progress/unlocked/claimed', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/api/state');
    expect(res.status).toBe(200);
    const ach = res.body.achievements;
    expect(Array.isArray(ach)).toBe(true);
    expect(ach.length).toBeGreaterThanOrEqual(12);
    expect(ach.find(a => a.key === 'first_focus')).toMatchObject({ unlocked: false, claimed: false, progress: 0, threshold: 1 });
  });

  it('unlocks first_focus after one completed session and pays gold on claim', async () => {
    const { app, db } = makeTestApp();
    addCompletedSession(db, 5);
    const before = (await request(app).get('/api/state')).body;
    expect(before.achievements.find(a => a.key === 'first_focus')).toMatchObject({ unlocked: true, claimed: false, progress: 1 });
    const goldBefore = before.player.gold;
    const r = await request(app).post('/api/achievements/first_focus/claim');
    expect(r.status).toBe(200);
    expect(r.body.reward).toEqual({ kind: 'gold', amount: 20 });
    const after = (await request(app).get('/api/state')).body;
    expect(after.player.gold).toBe(goldBefore + 20);
    expect(after.achievements.find(a => a.key === 'first_focus').claimed).toBe(true);
  });

  it('caps progress at threshold and accumulates focus minutes', async () => {
    const { app, db } = makeTestApp();
    addCompletedSession(db, 45);
    addCompletedSession(db, 45);
    const ach = (await request(app).get('/api/state')).body.achievements;
    expect(ach.find(a => a.key === 'focus_60')).toMatchObject({ unlocked: true, progress: 60, threshold: 60 });
    expect(ach.find(a => a.key === 'focus_300')).toMatchObject({ unlocked: false, progress: 90 });
  });

  it('grants an egg reward (sessions_50) and queues it for incubation', async () => {
    const { app, db } = makeTestApp();
    for (let i = 0; i < 50; i++) addCompletedSession(db, 1);
    const r = await request(app).post('/api/achievements/sessions_50/claim');
    expect(r.status).toBe(200);
    expect(r.body.reward).toEqual({ kind: 'egg', rarity: 'rare' });
    expect((await request(app).get('/api/state')).body.incubatingEgg).toMatchObject({ rarity: 'rare' });
  });

  it('rejects claiming a not-yet-unlocked achievement', async () => {
    const { app } = makeTestApp();
    expect((await request(app).post('/api/achievements/sessions_10/claim')).status).toBe(409);
  });

  it('rejects double claim and unknown key', async () => {
    const { app, db } = makeTestApp();
    addCompletedSession(db, 5);
    expect((await request(app).post('/api/achievements/first_focus/claim')).status).toBe(200);
    expect((await request(app).post('/api/achievements/first_focus/claim')).status).toBe(409);
    expect((await request(app).post('/api/achievements/nope/claim')).status).toBe(404);
  });

  it('tracks level, collection and boss metrics', async () => {
    const { app, db } = makeTestApp();
    db.prepare('UPDATE player SET level=10 WHERE id=1').run();
    db.prepare("INSERT INTO creatures (species_key, rarity, hatched_at) VALUES ('forest_sprite','common','2026-06-11T10:00:00')").run();
    db.prepare("INSERT INTO bosses (title, status, created_at, defeated_at) VALUES ('期末','defeated','2026-06-11T10:00:00','2026-06-11T10:00:00')").run();
    const ach = (await request(app).get('/api/state')).body.achievements;
    expect(ach.find(a => a.key === 'level_5')).toMatchObject({ unlocked: true });
    expect(ach.find(a => a.key === 'level_10')).toMatchObject({ unlocked: true });
    expect(ach.find(a => a.key === 'collect_1')).toMatchObject({ unlocked: true });
    expect(ach.find(a => a.key === 'boss_1')).toMatchObject({ unlocked: true });
  });
});
