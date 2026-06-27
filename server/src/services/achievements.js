// 成就系统:静态定义 + 按实时数据算进度;达成且未领取→可领奖(金币/蛋)。
// metric 取自现有数据,无需额外埋点。

export const ACHIEVEMENTS = [
  { key: 'first_focus', name: '初次出击', desc: '完成第 1 次专注', icon: 'sword', metric: 'sessions', threshold: 1, reward: { kind: 'gold', amount: 20 } },
  { key: 'sessions_10', name: '渐入佳境', desc: '累计完成 10 次专注', icon: 'sword', metric: 'sessions', threshold: 10, reward: { kind: 'gold', amount: 100 } },
  { key: 'sessions_50', name: '专注成习', desc: '累计完成 50 次专注', icon: 'sword', metric: 'sessions', threshold: 50, reward: { kind: 'egg', rarity: 'rare' } },
  { key: 'focus_60', name: '一刻千金', desc: '累计专注 60 分钟', icon: 'hourglass', metric: 'focusMinutes', threshold: 60, reward: { kind: 'gold', amount: 50 } },
  { key: 'focus_300', name: '心流五小时', desc: '累计专注 300 分钟', icon: 'hourglass', metric: 'focusMinutes', threshold: 300, reward: { kind: 'egg', rarity: 'rare' } },
  { key: 'focus_1000', name: '千分钟修行', desc: '累计专注 1000 分钟', icon: 'hourglass', metric: 'focusMinutes', threshold: 1000, reward: { kind: 'egg', rarity: 'epic' } },
  { key: 'level_5', name: '小有名气', desc: '达到等级 5', icon: 'medal', metric: 'level', threshold: 5, reward: { kind: 'gold', amount: 100 } },
  { key: 'level_10', name: '声名远扬', desc: '达到等级 10', icon: 'medal', metric: 'level', threshold: 10, reward: { kind: 'egg', rarity: 'epic' } },
  { key: 'collect_1', name: '第一个伙伴', desc: '收集第 1 种生物', icon: 'book', metric: 'collected', threshold: 1, reward: { kind: 'gold', amount: 30 } },
  { key: 'collect_12', name: '图鉴过半', desc: '收集 12 种生物', icon: 'book', metric: 'collected', threshold: 12, reward: { kind: 'egg', rarity: 'rare' } },
  { key: 'collect_24', name: '万物图鉴', desc: '集齐全部 24 种生物', icon: 'book', metric: 'collected', threshold: 24, reward: { kind: 'egg', rarity: 'legendary' } },
  { key: 'boss_1', name: '讨伐者', desc: '首次击败一个讨伐目标', icon: 'skull', metric: 'bossesDefeated', threshold: 1, reward: { kind: 'gold', amount: 80 } },
];

export function computeMetrics(db) {
  return {
    focusMinutes: db.prepare("SELECT COALESCE(SUM(COALESCE(s.minutes, q.duration_min)), 0) AS v FROM sessions s JOIN quests q ON q.id=s.quest_id WHERE s.status='completed'").get().v,
    sessions: db.prepare("SELECT COUNT(*) AS v FROM sessions WHERE status='completed'").get().v,
    level: db.prepare('SELECT level AS v FROM player WHERE id=1').get().v,
    collected: db.prepare('SELECT COUNT(DISTINCT species_key) AS v FROM creatures').get().v,
    bossesDefeated: db.prepare("SELECT COUNT(*) AS v FROM bosses WHERE status='defeated'").get().v,
    buildings: db.prepare('SELECT COUNT(*) AS v FROM buildings').get().v,
    hatched: db.prepare('SELECT COUNT(*) AS v FROM creatures').get().v,
  };
}

export function computeAchievements(db) {
  const metrics = computeMetrics(db);
  const claimed = new Set(db.prepare('SELECT key FROM achievements').all().map(r => r.key));
  return ACHIEVEMENTS.map(a => {
    const progress = metrics[a.metric] ?? 0;
    return {
      key: a.key, name: a.name, desc: a.desc, icon: a.icon, threshold: a.threshold,
      progress: Math.min(progress, a.threshold), unlocked: progress >= a.threshold, claimed: claimed.has(a.key), reward: a.reward,
    };
  });
}
