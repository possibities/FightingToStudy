import { HttpError } from '../utils/errors.js';
import { calculateSettlement } from './rewards.js';
import { aggregateBonuses } from './bonuses.js';
import { BUILDING_MAP } from '../content/index.js';

export function settleSession({ db, sessionId, now, rng }) {
  const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(sessionId);
  if (!session) throw new HttpError(404, '没有这次冒险');
  if (session.status === 'completed') return JSON.parse(session.settlement_json); // 幂等
  if (session.status === 'abandoned') throw new HttpError(409, '该次冒险已撤退');
  if (now().getTime() < new Date(session.ends_at).getTime() - 30_000)
    throw new HttpError(409, '还没到凯旋时间');

  const quest = db.prepare('SELECT * FROM quests WHERE id=?').get(session.quest_id);
  const nowIso = now().toISOString();

  return db.transaction(() => {
    const player = db.prepare('SELECT * FROM player WHERE id=1').get();
    const buildings = db.prepare('SELECT building_key, level FROM buildings').all();
    const bonuses = aggregateBonuses(buildings, BUILDING_MAP);
    const incubatingEgg = db.prepare("SELECT * FROM eggs WHERE status='incubating' ORDER BY obtained_at, id LIMIT 1").get() || null;
    const collectedKeys = db.prepare('SELECT DISTINCT species_key FROM creatures').all().map(r => r.species_key);

    const { events, deltas } = calculateSettlement({
      durationMin: quest.duration_min, player, bonuses, incubatingEgg, collectedKeys, rng,
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
    db.prepare("UPDATE quests SET status='done' WHERE id=?").run(quest.id);
    const payload = { events };
    db.prepare("UPDATE sessions SET status='completed', completed_at=?, settlement_json=? WHERE id=?")
      .run(nowIso, JSON.stringify(payload), sessionId);
    return payload;
  })();
}
