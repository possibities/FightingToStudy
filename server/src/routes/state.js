import { Router } from 'express';
import { localDateStr } from '../utils/dates.js';
import { expToNext, titleFor } from '../services/leveling.js';
import { MATERIAL_MAP, SPECIES, SPECIES_MAP, BUILDINGS, TITLES } from '../content/index.js';
import { toQuestJson } from './quests.js';
import { ensureDailyQuests } from '../services/dailyQuests.js';
import { checkWelcomeBack } from '../services/welcomeBack.js';

export function createStateRouter({ db, now, rng }) {
  const router = Router();

  router.get('/', (req, res, next) => {
    try {
      ensureDailyQuests(db, now, rng);
      const today = localDateStr(now());
      const welcomeBack = checkWelcomeBack(db, now, rng);
      const player = db.prepare('SELECT * FROM player WHERE id=1').get();
      const resources = db.prepare('SELECT item_key, qty FROM inventory').all()
        .map(r => ({ key: r.item_key, name: MATERIAL_MAP[r.item_key].name, emoji: MATERIAL_MAP[r.item_key].emoji, qty: r.qty }));
      const n = now();
      const todayStartIso = new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString();
      const quests = db.prepare(
        `SELECT DISTINCT q.* FROM quests q
         LEFT JOIN sessions s ON s.quest_id=q.id AND s.status='completed'
         WHERE (q.type='daily' AND q.daily_date=?)
            OR (q.type='custom' AND q.status IN ('ready','active'))
            OR (q.type='custom' AND q.status='done' AND s.completed_at>=?)
         ORDER BY q.type DESC, q.id`
      ).all(today, todayStartIso).map(toQuestJson);
      const knownTags = db.prepare(
        "SELECT subject_tag AS tag, COUNT(*) AS c FROM quests WHERE subject_tag IS NOT NULL GROUP BY subject_tag ORDER BY c DESC, tag LIMIT 8"
      ).all().map(r => r.tag);
      const running = db.prepare(
        "SELECT s.*, q.title AS quest_title, q.type AS quest_type, q.duration_min AS qmin, q.subject_tag AS qtag FROM sessions s JOIN quests q ON q.id=s.quest_id WHERE s.status='running'"
      ).get();
      const egg = db.prepare("SELECT * FROM eggs WHERE status='incubating' ORDER BY obtained_at, id LIMIT 1").get();
      const queueCount = db.prepare("SELECT COUNT(*) AS c FROM eggs WHERE status='incubating'").get().c;
      const buildings = db.prepare('SELECT slot_index, building_key, level FROM buildings ORDER BY slot_index').all()
        .map(b => ({ slotIndex: b.slot_index, key: b.building_key, level: b.level }));
      const creatures = db.prepare('SELECT id, species_key, rarity FROM creatures ORDER BY hatched_at, id').all()
        .map(c => ({ id: c.id, key: c.species_key, name: SPECIES_MAP[c.species_key]?.name, emoji: SPECIES_MAP[c.species_key]?.emoji, rarity: c.rarity }));
      const collected = db.prepare('SELECT COUNT(DISTINCT species_key) AS c FROM creatures').get().c;

      res.json({
        serverNow: now().toISOString(),
        player: {
          name: player.name, level: player.level, exp: player.exp, expToNext: expToNext(player.level),
          title: titleFor(player.level, TITLES), gold: player.gold, pityCounter: player.pity_counter,
        },
        resources, quests, knownTags,
        runningSession: running ? {
          id: running.id, questId: running.quest_id, questTitle: running.quest_title, questType: running.quest_type,
          durationMin: running.qmin, subjectTag: running.qtag, startedAt: running.started_at, endsAt: running.ends_at,
        } : null,
        incubatingEgg: egg ? { id: egg.id, rarity: egg.rarity, progress: egg.progress, required: egg.required, queueCount } : null,
        buildings, buildingCatalog: BUILDINGS, creatures,
        collectionProgress: { collected, total: SPECIES.length },
        welcomeBack,
      });
    } catch (e) { next(e); }
  });

  return router;
}
