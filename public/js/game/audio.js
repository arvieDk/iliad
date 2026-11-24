/**
 * audio.js — sound for the board game, synthesized with the Web Audio API.
 *
 * Soft plucked tones (like a lyre) instead of beeps, and a slow, quiet
 * background melody in a Greek-sounding mode. Nothing to download, so the
 * game works offline. Volumes and mute are saved on the device.
 * Browsers only allow sound after the first click; unlock() handles that.
 */

const KEY = 'iliad-game-audio';
const cfg = { music: 0.3, sfx: 0.6, muted: false };
try {
  Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}'));
} catch {
  /* storage unavailable */
}

let ctx = null;
let master = null;
let unlocked = false;
let musicTimer = null;
let wantMusic = false;

function context() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** A plucked note: quick attack, soft exponential decay, a quiet octave above. */
function pluck(freq, { at = 0, dur = 0.5, vol = 0.2, type = 'triangle' } = {}) {
  const c = context();
  if (!c) return;
  const t = c.currentTime + at;
  [[1, type, vol], [2, 'sine', vol * 0.25]].forEach(([mult, wave, v]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = wave;
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

// D dorian, the mode of much ancient-sounding music.
const N = { D3: 146.8, A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, A5: 880 };

const SFX = {
  click: [[N.A5, 0, 0.05, 0.05, 'sine']],
  select: [[N.E5, 0, 0.18], [N.A5, 0.05, 0.22]],
  place: [[N.D3, 0, 0.35, 0.35, 'sine'], [N.A3, 0.01, 0.3, 0.12]],
  error: [[N.D3 * 0.9, 0, 0.3, 0.25, 'sine'], [N.D3 * 0.85, 0.1, 0.3, 0.2, 'sine']],
  move: [[N.G4, 0, 0.2], [N.D4, 0.08, 0.3]],
  flip: [[N.A4, 0, 0.12, 0.15, 'square'], [N.D4, 0.06, 0.25]],
  swap: [[N.D5, 0, 0.18], [N.A4, 0.07, 0.18], [N.D5, 0.14, 0.3]],
  score: [[N.D4, 0, 0.5], [N.F4, 0.09, 0.5], [N.A4, 0.18, 0.7]],
  token: [[N.A4, 0, 0.4], [N.E5, 0.08, 0.6]],
  turn: [[N.D4, 0, 0.35, 0.12]],
  coin: [[N.E5, 0, 0.08], [N.D5, 0.1, 0.08], [N.C5, 0.2, 0.08], [N.A4, 0.3, 0.08], [N.G4, 0.4, 0.08], [N.A4, 0.5, 0.08]],
  land: [[N.D4, 0, 0.5, 0.25, 'sine'], [N.A4, 0.02, 0.6]],
  start: [[N.D4, 0, 0.6], [N.A4, 0.12, 0.6], [N.D5, 0.24, 0.9]],
  tally: [[N.A4, 0, 0.12, 0.12]],
  total: [[N.D4, 0, 0.6], [N.A4, 0.1, 0.8]],
  win: [[N.D4, 0, 0.8], [N.F4, 0.14, 0.8], [N.A4, 0.28, 0.8], [N.D5, 0.42, 1.4]],
  draw: [[N.A4, 0, 0.6], [N.E4, 0.2, 0.9]]
};

export function sfx(name) {
  if (!unlocked || cfg.muted || !cfg.sfx) return;
  (SFX[name] || []).forEach(([f, at, dur, vol = 0.18, type]) => pluck(f, { at, dur, vol: vol * cfg.sfx, type }));
}

/* ---- Background melody: a slow random walk over the mode -------------------- */
const SCALE = [N.D4, N.E4, N.F4, N.G4, N.A4, N.C5, N.D5];
let step = 3;

function playMusic() {
  stopMusic();
  if (!unlocked || cfg.muted || !cfg.music) return;
  musicTimer = setInterval(() => {
    if (Math.random() < 0.28) return; // rests
    step = Math.max(0, Math.min(SCALE.length - 1, step + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
    pluck(SCALE[step], { dur: 1.8, vol: 0.07 * cfg.music });
    if (Math.random() < 0.25) pluck(SCALE[step] / 2, { dur: 2.4, vol: 0.05 * cfg.music, type: 'sine' });
  }, 700);
}

function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}

export function music(on) {
  wantMusic = on;
  if (on) playMusic();
  else stopMusic();
}

export function unlock() {
  if (unlocked) return;
  unlocked = true;
  const c = context();
  if (c && c.state === 'suspended') c.resume();
  if (wantMusic) playMusic();
}

export const settings = {
  get: () => ({ ...cfg }),
  set(patch) {
    Object.assign(cfg, patch);
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch {
      /* ignore */
    }
    if (wantMusic) playMusic();
  }
};
