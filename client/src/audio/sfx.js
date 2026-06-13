let ctx, bus;

function ensureCtx() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  // 母线:低通柔化高频毛刺 → 压缩器收住动态,让程序化音色不再是干硬的电子哔
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 7200;
  lp.Q.value = 0.5;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  lp.connect(comp).connect(ctx.destination);
  bus = lp;
}

// 单音:带 ADSR 快起淡出(消爆音),可选滑音
function tone(freq, at, dur, { type = 'sine', gain = 0.05, glideTo = null } = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.014);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(bus);
  osc.start(at);
  osc.stop(at + dur + 0.03);
}

export function playSfx(kind) {
  try {
    if (localStorage.getItem('sfx_enabled') === 'off') return;
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    switch (kind) {
      case 'complete':
        tone(523, t, 0.14); tone(659, t + 0.12, 0.14); tone(784, t + 0.24, 0.32, { gain: 0.06 });
        break;
      case 'flip':
        tone(660, t, 0.07, { type: 'sine', gain: 0.03 });
        break;
      case 'rare': // 轻快上行琶音
        [440, 554, 659, 880].forEach((f, i) => tone(f, t + i * 0.1, 0.16, { type: 'triangle', gain: 0.05 }));
        break;
      case 'epic': // 琶音 + 低频垫底,厚度上来
        [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.2, { type: 'triangle', gain: 0.05 }));
        tone(131, t, 0.75, { type: 'sine', gain: 0.05 });
        break;
      case 'legendary': // 和声铺底 + 上滑 + 闪亮泛音,史诗感
        [392, 494, 587].forEach(f => tone(f, t, 0.95, { type: 'sawtooth', gain: 0.028 }));
        tone(784, t + 0.1, 0.5, { type: 'triangle', gain: 0.05, glideTo: 1568 });
        [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + 0.5 + i * 0.08, 0.26, { type: 'sine', gain: 0.04 }));
        tone(98, t, 1.05, { type: 'sine', gain: 0.06 });
        break;
      case 'levelup':
        [523, 587, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.15, { type: 'square', gain: 0.035 }));
        break;
    }
  } catch {
    /* 音频不可用时静默 */
  }
}

// 触觉反馈,跟随音效开关;不支持的设备静默
export function vibrate(pattern) {
  try {
    if (localStorage.getItem('sfx_enabled') === 'off') return;
    navigator.vibrate?.(pattern);
  } catch { /* 忽略 */ }
}
