import { HttpError } from '../utils/errors.js';
import { calculateSettlement } from './rewards.js';
import { aggregateBonuses } from './bonuses.js';
import { FREE_CAP_MIN } from './freeRoam.js';
import { BUILDING_MAP, HATCH_REQUIRED } from '../content/index.js';

export function settleSession({ db, sessionId, now, rng }) {
  const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(sessionId);
  if (!session) throw new HttpError(404, '没有这次冒险');
  if (session.status === 'completed') return JSON.parse(session.settlement_json); // 幂等
  if (session.status === 'abandoned') throw new HttpError(409, '该次冒险已撤退');

  const isFree = session.kind === 'free';
  const nowIso = now().toISOString();

  if (!isFree && now().getTime() < new Date(session.ends_at).getTime() - 30_000)
    throw new HttpError(409, '还没到凯旋时间');

  // 打野:按实际耗时结算(封顶 FREE_CAP_MIN);不足 1 分钟直接收场,不给奖励
  let durationMin;
  if (isFree) {
    const elapsed = Math.floor((now().getTime() - new Date(session.started_at).getTime()) / 60000);
    durationMin = Math.max(0, Math.min(FREE_CAP_MIN, elapsed));
    if (durationMin < 1) {
      db.prepare("UPDATE sessions SET status='abandoned', completed_at=?, minutes=0 WHERE id=?").run(nowIso, sessionId);
      return { events: [], free: true, minutes: 0 };
    }
  }

  const quest = db.prepare('SELECT * FROM quests WHERE id=?').get(session.quest_id);
  if (!isFree) durationMin = quest.duration_min;

  return db.transaction(() => {
    const player = db.prepare('SELECT * FROM player WHERE id=1').get();
    const buildings = db.prepare('SELECT building_key, level FROM buildings').all();
    const bonuses = aggregateBonuses(buildings, BUILDING_MAP);
    const incubatingEgg = db.prepare("SELECT * FROM eggs WHERE status='incubating' ORDER BY obtained_at, id LIMIT 1").get() || null;
    const collectedKeys = db.prepare('SELECT DISTINCT species_key FROM creatures').all().map(r => r.species_key);

    const { events, deltas } = calculateSettlement({
      durationMin, player, bonuses, incubatingEgg, collectedKeys, rng,
    });

    db.prepare('UPDATE player SET level=?, exp=?, gold=gold+?, pity_counter=?, last_completed_at=? WHERE id=1')
      .run(deltas.newLevel, deltas.newExp, deltas.goldGained, deltas.newPity, nowIso);
    db.prepare('UPDATE inventory SET qty=qty+? WHERE item_key=?').run(deltas.material.qty, deltas.material.key);
    if (deltas.eggProgress)
      db.prepare('UPDATE eggs SET progress=? WHERE id=?').run(deltas.eggProgress.progress, deltas.eggProgress.eggId);
    if (deltas.hatched) {
      db.prepare("UPDATE eggs SET status='hatched', progress=required WHERE id=?").run(deltas.hatched.eggId);
      db.prepare('INSERT INTO creatures (species_key, rarity, hatched_at) VALUES (?,?,?)')
        .run(deltas.hatched.species.key, deltas.hatched.species.rarity, nowIso);
    }
    // 新蛋最后入库:同一次结算不吃进度(规格 2.4)
    if (deltas.eggDropped)
      db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)')
        .run(deltas.eggDropped.rarity, deltas.eggDropped.required, nowIso);
    if (!isFree) db.prepare("UPDATE quests SET status='done' WHERE id=?").run(quest.id);

    // 讨伐:该委托属于某 Boss 时,若其代办全部完成→击败,发大奖(金币+必得蛋+称号)
    if (!isFree && quest.boss_id) {
      const boss = db.prepare('SELECT * FROM bosses WHERE id=?').get(quest.boss_id);
      const remaining = db.prepare("SELECT COUNT(*) AS c FROM quests WHERE boss_id=? AND status!='done'").get(quest.boss_id).c;
      if (boss && boss.status === 'active' && remaining === 0) {
        const totalMin = db.prepare('SELECT COALESCE(SUM(duration_min),0) AS m FROM quests WHERE boss_id=?').get(quest.boss_id).m;
        const rarity = totalMin >= 360 ? 'legendary' : totalMin >= 120 ? 'epic' : 'rare';
        const titleAward = `${boss.title} 讨伐者`;
        db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(totalMin);
        db.prepare('INSERT INTO eggs (rarity, required, obtained_at) VALUES (?,?,?)').run(rarity, HATCH_REQUIRED[rarity], nowIso);
        db.prepare("UPDATE bosses SET status='defeated', title_award=?, defeated_at=? WHERE id=?").run(titleAward, nowIso, boss.id);
        events.push({ type: 'boss_defeated', boss: boss.title, title: titleAward });
        events.push({ type: 'gold', amount: totalMin });
        events.push({ type: 'egg', rarity, pity: false });
      }
    }
    const payload = isFree ? { events, free: true, minutes: durationMin } : { events };
    db.prepare("UPDATE sessions SET status='completed', completed_at=?, settlement_json=?, minutes=? WHERE id=?")
      .run(nowIso, JSON.stringify(payload), durationMin, sessionId);
    return payload;
  })();
}
