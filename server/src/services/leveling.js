export function expToNext(level) {
  return 100 + (level - 1) * 50;
}

export function applyExp(level, exp, gained) {
  let newLevel = level;
  let newExp = exp + gained;
  const levelUps = [];
  while (newExp >= expToNext(newLevel)) {
    newExp -= expToNext(newLevel);
    newLevel += 1;
    levelUps.push(newLevel);
  }
  return { level: newLevel, exp: newExp, levelUps };
}

export function titleFor(level, titles) {
  let current = titles[0].title;
  for (const row of titles) if (level >= row.level) current = row.title;
  return current;
}
