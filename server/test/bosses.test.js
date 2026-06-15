import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeTestApp } from './helpers.js';

// 出发并到点结算一条代办,返回 complete 响应
async function clearTodo(app, clock, todoId) {
  const start = await request(app).post(`/api/quests/${todoId}/start`);
  clock.current = new Date(start.body.endsAt);
  return request(app).post(`/api/sessions/${start.body.sessionId}/complete`);
}

describe('bosses (讨伐)', () => {
  it('builds a boss with todos, hidden from the camp quest list', async () => {
    const { app } = makeTestApp();
    const boss = (await request(app).post('/api/bosses').send({ title: '啃完OS' })).body;
    expect(boss.id).toBeGreaterThan(0);
    await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: '读第1章', durationMin: 25 });
    await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: '读第2章', durationMin: 25 });
    const state = (await request(app).get('/api/state')).body;
    expect(state.bosses).toHaveLength(1);
    expect(state.bosses[0]).toMatchObject({ title: '啃完OS', status: 'active', totalMin: 50, doneMin: 0 });
    expect(state.bosses[0].todos).toHaveLength(2);
    expect(state.quests.find(q => q.title === '读第1章')).toBeUndefined(); // 代办不污染营地委托
  });

  it('defeats the boss when all todos done, granting gold + egg + title', async () => {
    const { app, clock } = makeTestApp();
    const boss = (await request(app).post('/api/bosses').send({ title: '啃完OS' })).body;
    const t1 = (await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'A', durationMin: 25 })).body;
    const t2 = (await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'B', durationMin: 25 })).body;

    const r1 = await clearTodo(app, clock, t1.id);
    expect(r1.body.events.some(e => e.type === 'boss_defeated')).toBe(false);
    let state = (await request(app).get('/api/state')).body;
    expect(state.bosses[0]).toMatchObject({ status: 'active', doneMin: 25 });

    const r2 = await clearTodo(app, clock, t2.id);
    const defeat = r2.body.events.find(e => e.type === 'boss_defeated');
    expect(defeat).toBeTruthy();
    expect(defeat.title).toBe('啃完OS 讨伐者');
    state = (await request(app).get('/api/state')).body;
    expect(state.bosses[0]).toMatchObject({ status: 'defeated', titleAward: '啃完OS 讨伐者' });
    expect(state.player.gold).toBe(100); // 25 + 25 + 50(讨伐奖金=总时长)
    expect(state.incubatingEgg).toMatchObject({ rarity: 'rare' }); // 50min<120 → 稀有
  });

  it('validates input and guards deletes', async () => {
    const { app, clock } = makeTestApp();
    expect((await request(app).post('/api/bosses').send({ title: '' })).status).toBe(400);
    const boss = (await request(app).post('/api/bosses').send({ title: 'G' })).body;
    expect((await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'x', durationMin: 3 })).status).toBe(400);
    const t = (await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'x', durationMin: 25 })).body;
    const start = await request(app).post(`/api/quests/${t.id}/start`);
    expect((await request(app).delete(`/api/bosses/${boss.id}/todos/${t.id}`)).status).toBe(409); // 进行中不能删
    clock.current = new Date(start.body.endsAt);
    await request(app).post(`/api/sessions/${start.body.sessionId}/complete`);
    expect((await request(app).delete(`/api/bosses/${boss.id}`)).status).toBe(409); // 有进展不能删
  });

  it('clears a todo via free-roam (打野): marks done, rewards by actual minutes, HP by estimate', async () => {
    const { app, clock } = makeTestApp();
    const boss = (await request(app).post('/api/bosses').send({ title: 'G' })).body;
    const t1 = (await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'A', durationMin: 25 })).body;
    await request(app).post(`/api/bosses/${boss.id}/todos`).send({ title: 'B', durationMin: 25 });
    const start = await request(app).post('/api/sessions/free/start').send({ questId: t1.id });
    expect(start.status).toBe(200);
    clock.current = new Date(clock.current.getTime() + 10 * 60000); // 实际专注 10 分钟
    const r = await request(app).post(`/api/sessions/${start.body.sessionId}/complete`);
    expect(r.body.minutes).toBe(10); // 奖励按实际时长
    const b = (await request(app).get('/api/state')).body.bosses[0];
    expect(b.todos.find(t => t.id === t1.id).status).toBe('done'); // 代办标完成
    expect(b.doneMin).toBe(25); // 进度按代办预估(25),非实际10
    expect(b.status).toBe('active'); // 还剩 B
  });
});
