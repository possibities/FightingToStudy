let ctx;

function beep(freq, at, dur, type = 'sine', gain = 0.04) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur);
}

export function playSfx(kind) {
  try {
    if (localStorage.getItem('sfx_enabled') === 'off') return;
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    if (kind === 'complete') {
      beep(523, t, 0.12); beep(659, t + 0.12, 0.12); beep(784, t + 0.24, 0.25);
    } else if (kind === 'rare') {
      [440, 554, 659, 880].forEach((f, i) => beep(f, t + i * 0.1, 0.12, 'triangle', 0.05));
    } else if (kind === 'levelup') {
      [523, 587, 659, 784, 1047].forEach((f, i) => beep(f, t + i * 0.09, 0.12, 'square', 0.03));
    }
  } catch {
    /* 音频不可用时静默 */
  }
}
