import { Router } from 'express';
import { HttpError } from '../utils/errors.js';
import { localDateStr } from '../utils/dates.js';

export const MIN_BET = 10;
export const MAX_BET = 100;
export const DAILY_LIMIT = 10; // 每日上限(克制),跨天重置

function getSetting(db, key, dflt) {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  return row ? row.value : dflt;
}
function setSetting(db, key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}

// 当日剩余局数(current 为 Date)
export function diceRemaining(db, current) {
  const today = localDateStr(current);
  const used = getSetting(db, 'dice_day', '') === today ? Number(getSetting(db, 'dice_count', 0)) : 0;
  return Math.max(0, DAILY_LIMIT - used);
}

// 篝火骰戏:押大(8~12)/小(2~6),掷 2 骰。猜中翻倍,出 7 庄家通杀,否则输。只赌金币。
export function createDiceRouter({ db, now, rng }) {
  const router = Router();

  router.post('/roll', (req, res, next) => {
    try {
      const { choice, bet } = req.body ?? {};
      if (choice !== 'big' && choice !== 'small') throw new HttpError(400, '押大或押小');
      if (!Number.isInteger(bet) || bet < MIN_BET || bet > MAX_BET) throw new HttpError(400, `下注需为 ${MIN_BET}~${MAX_BET} 金币的整数`);
      const today = localDateStr(now());
      const count = getSetting(db, 'dice_day', '') === today ? Number(getSetting(db, 'dice_count', 0)) : 0;
      if (count >= DAILY_LIMIT) throw new HttpError(409, '今日骰戏次数已用完,明天再来');
      const player = db.prepare('SELECT gold FROM player WHERE id=1').get();
      if (player.gold < bet) throw new HttpError(400, '金币不够下注');

      const out = db.transaction(() => {
        db.prepare('UPDATE player SET gold=gold-? WHERE id=1').run(bet);
        const d1 = 1 + Math.floor(rng() * 6);
        const d2 = 1 + Math.floor(rng() * 6);
        const sum = d1 + d2;
        let win = false;
        if (sum !== 7 && ((choice === 'big' && sum >= 8) || (choice === 'small' && sum <= 6))) {
          win = true;
          db.prepare('UPDATE player SET gold=gold+? WHERE id=1').run(bet * 2); // 退本 + 等额奖金
        }
        setSetting(db, 'dice_day', today);
        setSetting(db, 'dice_count', count + 1);
        return { dice: [d1, d2], sum, win, choice, delta: win ? bet : -bet, remainingToday: DAILY_LIMIT - (count + 1) };
      })();

      res.json(out);
    } catch (e) { next(e); }
  });

  return router;
}
