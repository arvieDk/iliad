/* The Iliad: an interactive book
 * Sound, synthesized in the browser with the Web Audio API (no audio files):
 *  - a papery page-turn rustle
 *  - an optional ambient lyre that plucks slowly over a soft drone
 */

window.ILIAD = window.ILIAD || {};

ILIAD.audio = (function () {
  let ctx = null;
  let master = null;
  let reverb = null;
  let noiseBuf = null;
  let musicTimer = null;
  let musicBus = null;
  let drone = [];
  let musicOn = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    // white noise for page rustles
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // a simple generated hall reverb for the lyre
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const x = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    reverb.buffer = ir;
    return ctx;
  }

  /* ---------- page turn ---------- */
  function flip(speed) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const dur = speed === "fast" ? 0.22 : 0.42;

    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;

    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(3200, t);
    bp.frequency.exponentialRampToValueAtTime(700, t + dur);

    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 300;

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + dur * 0.18);
    g.gain.setValueAtTime(0.3, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(bp).connect(hp).connect(g).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);

    // the soft slap of the page settling
    const s2 = c.createBufferSource();
    s2.buffer = noiseBuf;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g2 = c.createGain();
    const t2 = t + dur * 0.85;
    g2.gain.setValueAtTime(0.0001, t2);
    g2.gain.exponentialRampToValueAtTime(0.25, t2 + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.12);
    s2.connect(lp).connect(g2).connect(master);
    s2.start(t2);
    s2.stop(t2 + 0.15);
  }

  /* ---------- ambient lyre ---------- */
  // D Dorian, the mode of an old lyre: D E F G A B C
  const SCALE = [0, 2, 3, 5, 7, 9, 10];
  const ROOT = 146.83; // D3

  function freq(step) {
    const oct = Math.floor(step / SCALE.length);
    const deg = ((step % SCALE.length) + SCALE.length) % SCALE.length;
    return ROOT * Math.pow(2, oct + SCALE[deg] / 12);
  }

  function pluck(f, when, vel) {
    const c = ctx;
    const g = c.createGain();
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(f * 7, when);
    lp.frequency.exponentialRampToValueAtTime(f * 1.6, when + 1.6);

    const partials = [[1, 1], [2, 0.35], [3, 0.14], [4.01, 0.06]];
    partials.forEach(([m, a]) => {
      const o = c.createOscillator();
      o.type = m === 1 ? "triangle" : "sine";
      o.frequency.value = f * m;
      const og = c.createGain();
      og.gain.value = a;
      o.connect(og).connect(lp);
      o.start(when);
      o.stop(when + 4.2);
    });

    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.16 * vel, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 4);
    lp.connect(g);
    g.connect(musicBus);
    const wet = c.createGain();
    wet.gain.value = 0.55;
    g.connect(wet).connect(reverb);
  }

  let step = 7;
  function phrase() {
    if (!musicOn) return;
    const c = ctx;
    let t = c.currentTime + 0.05;
    const notes = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      // a gentle random walk over the scale, kept within two octaves
      step += [-2, -1, -1, 1, 1, 2, 3, -3][Math.floor(Math.random() * 8)];
      step = Math.max(3, Math.min(15, step));
      pluck(freq(step), t, 0.6 + Math.random() * 0.4);
      if (Math.random() < 0.2) pluck(freq(step - 4), t + 0.02, 0.4);
      t += [0.42, 0.62, 0.84, 1.2][Math.floor(Math.random() * 4)];
    }
    // resolve to the root now and then
    if (Math.random() < 0.35) pluck(freq(Math.random() < 0.5 ? 7 : 0), t + 0.4, 0.5);
    musicTimer = setTimeout(phrase, (t - c.currentTime) * 1000 + 1800 + Math.random() * 2600);
  }

  function startMusic() {
    const c = ensure();
    if (!c) return false;
    musicOn = true;
    musicBus = c.createGain();
    musicBus.gain.setValueAtTime(0.0001, c.currentTime);
    musicBus.gain.exponentialRampToValueAtTime(0.7, c.currentTime + 2.5);
    musicBus.connect(master);
    const wetOut = c.createGain();
    wetOut.gain.value = 0.6;
    reverb.connect(wetOut).connect(musicBus);
    musicBus._wet = wetOut;

    // drone: root and fifth, slowly breathing
    [[ROOT / 2, 0.05], [ROOT * 0.75, 0.03]].forEach(([f, a]) => {
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = a;
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      const lg = c.createGain();
      lg.gain.value = a * 0.6;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(musicBus);
      o.start();
      lfo.start();
      drone.push(o, lfo);
    });
    phrase();
    return true;
  }

  function stopMusic() {
    musicOn = false;
    clearTimeout(musicTimer);
    if (!ctx || !musicBus) return;
    const bus = musicBus;
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value, t);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const old = drone;
    drone = [];
    setTimeout(() => {
      old.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } });
      try { reverb.disconnect(bus._wet); } catch (e) { /* not connected */ }
      bus.disconnect();
    }, 1400);
    musicBus = null;
  }

  return {
    unlock: ensure,
    flip,
    setMusic(on) { return on ? startMusic() : (stopMusic(), false); },
    get musicOn() { return musicOn; }
  };
})();
