export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// entries: [{ value, weight }]
export function pickWeighted(rng, entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = rng() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll < 0) return e.value;
  }
  return entries[entries.length - 1].value;
}
