// FOOD FUN — sound
// Everything is synthesized with the Web Audio API, so there are no audio files
// to load and nothing can 404. Gavin asked for a different track on every level,
// and a little "you did it" jingle when a level is finished.

var FF = window.FF || (window.FF = {});

FF.audio = (function () {
  let ctx = null;
  let master = null;
  let muted = false;
  let musicOn = false;
  let nextNote = 0;
  let step = 0;
  let track = 'neon';

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.32;
    master.connect(ctx.destination);
    nextNote = ctx.currentTime + 0.05;
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.32, ctx.currentTime, 0.02);
  }

  // ---- little synth voices ----

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /** A struck, ringing note — used for the koto plucks and temple bells. */
  function pluck(freq, dur, vol, when, type) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(600, t + dur);
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, when, hz) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = hz || 1200;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  /** Big taiko drum hit — low thump plus a skin slap. */
  function taiko(when, vol) {
    tone(150, 0.28, 'sine', (vol || 1) * 0.55, when, 45);
    noise(0.08, (vol || 1) * 0.18, when, 900);
  }

  /** Brass stab for the hype. */
  function horn(when, root, vol) {
    [0, 4, 7].forEach((semi, i) => {
      tone(root * Math.pow(2, semi / 12), 0.34, 'sawtooth', (vol || 0.055) - i * 0.008, when);
    });
  }

  // ---- sound effects ----

  const sfx = {
    eat() { tone(520 + Math.random() * 90, 0.09, 'triangle', 0.16, 0, 780); noise(0.05, 0.05, 0, 2400); },
    big() { [440, 587, 740, 880].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, ctx && ctx.currentTime + i * 0.05)); },
    jump() { tone(300, 0.13, 'square', 0.09, 0, 620); },
    land() { noise(0.05, 0.06, 0, 400); },
    slurp() { tone(180, 0.34, 'sawtooth', 0.06, 0, 620); },
    bump() { taiko(0, 0.9); tone(200, 0.12, 'square', 0.12, 0, 90); },
    hurt() { tone(300, 0.3, 'sawtooth', 0.16, 0, 70); noise(0.18, 0.09, 0, 500); },
    shield() { [660, 880, 1100].forEach((f, i) => tone(f, 0.14, 'sine', 0.1, ctx && ctx.currentTime + i * 0.04)); },
    pop() { tone(900, 0.12, 'sine', 0.12, 0, 220); noise(0.08, 0.07, 0, 3000); },
    key() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'square', 0.11, ctx && ctx.currentTime + i * 0.09)); },
    star() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.11, ctx && ctx.currentTime + i * 0.06)); },
    energy() { [392, 523, 659, 880, 1175].forEach((f, i) => tone(f, 0.14, 'square', 0.1, ctx && ctx.currentTime + i * 0.045)); },
    chomp() { tone(220, 0.16, 'square', 0.18, 0, 60); noise(0.12, 0.12, 0, 700); taiko(0, 1); },
    chompFly() { tone(240, 0.3, 'sawtooth', 0.1, 0, 1400); noise(0.26, 0.07, 0, 2600); },
    spit() { tone(160, 0.14, 'square', 0.1, 0, 70); noise(0.1, 0.08, 0, 1600); },
    throw() { noise(0.12, 0.06, 0, 1800); tone(420, 0.12, 'triangle', 0.06, 0, 700); },
    rumble() { tone(70, 1.6, 'sine', 0.3, 0, 30); noise(1.4, 0.14, 0, 180); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, ctx && ctx.currentTime + i * 0.13)); },
    train() { tone(90, 0.9, 'sawtooth', 0.09, 0, 240); noise(0.8, 0.07, 0, 600); },
  };

  function play(name) {
    if (!ctx || muted) return;
    const fn = sfx[name];
    if (fn) fn();
  }

  /** The little "you finished a level!" jingle. */
  function fanfare() {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    taiko(t0, 1);
    taiko(t0 + 0.12, 0.7);
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => {
      tone(f, 0.22, 'square', 0.12, t0 + 0.1 + i * 0.11);
      tone(f / 2, 0.22, 'triangle', 0.07, t0 + 0.1 + i * 0.11);
    });
    horn(t0 + 0.56, 523.3, 0.075);
    tone(1318.5, 0.7, 'triangle', 0.12, t0 + 0.58);
    taiko(t0 + 0.58, 1);
  }

  // ---- the music ----
  // One track per level, so each place in Tokyo sounds different. Each is 16
  // steps of eighth notes; the scheduler below is shared.

  const TRACKS = {
    // Shibuya — the original taiko-and-horns track. Gavin said keep it.
    neon: {
      bpm: 132,
      bass: [55, 0, 55, 0, 73.4, 0, 55, 0, 65.4, 0, 65.4, 0, 82.4, 0, 73.4, 0],
      bassType: 'square', bassVol: 0.075,
      kick: [0, 4, 8, 12], soft: [6, 14], hat: [],
      horns: { 0: 220, 12: 196 },
    },
    // Ramen Alley — slower and warmer, plucked like a koto.
    ramen: {
      bpm: 104,
      bass: [110, 0, 0, 110, 0, 82.4, 0, 0, 98, 0, 0, 98, 0, 73.4, 0, 0],
      bassType: 'triangle', bassVol: 0.085,
      kick: [0, 8], soft: [12], hat: [],
      pluck: [220, 0, 261.6, 0, 329.6, 0, 293.7, 0, 220, 0, 196, 0, 261.6, 0, 329.6, 0],
      pluckVol: 0.09,
    },
    // The subway — fast and mechanical, like the train.
    subway: {
      bpm: 156,
      bass: [73.4, 73.4, 0, 73.4, 98, 0, 73.4, 0, 65.4, 65.4, 0, 65.4, 87.3, 0, 98, 0],
      bassType: 'square', bassVol: 0.07,
      kick: [0, 4, 8, 12], soft: [2, 6, 10, 14], hat: [1, 3, 5, 7, 9, 11, 13, 15],
      lead: [0, 0, 587, 0, 0, 0, 440, 0, 0, 0, 523, 0, 0, 0, 392, 0],
      leadType: 'square', leadVol: 0.045,
    },
    // The temple — airy, bells and a slow flute.
    temple: {
      bpm: 92,
      bass: [98, 0, 0, 0, 0, 0, 0, 0, 87.3, 0, 0, 0, 0, 0, 0, 0],
      bassType: 'sine', bassVol: 0.09,
      kick: [0], soft: [8], hat: [],
      pluck: [784, 0, 0, 659.3, 0, 0, 523.3, 0, 587.3, 0, 0, 493.9, 0, 0, 659.3, 0],
      pluckVol: 0.075, pluckType: 'sine',
      lead: [0, 0, 392, 0, 0, 0, 0, 0, 0, 0, 349.2, 0, 0, 0, 0, 0],
      leadType: 'triangle', leadVol: 0.05,
    },
    // The Dragon Fruit Boss — loud hype battle music.
    boss: {
      bpm: 158,
      bass: [49, 49, 0, 49, 58.3, 0, 49, 0, 43.7, 43.7, 0, 43.7, 55, 0, 61.7, 0],
      bassType: 'sawtooth', bassVol: 0.08,
      kick: [0, 2, 4, 6, 8, 10, 12, 14], soft: [], hat: [1, 3, 5, 7, 9, 11, 13, 15],
      horns: { 0: 262, 8: 233, 12: 196 },
    },
  };

  function tick() {
    if (!ctx || !musicOn) return;
    const T = TRACKS[track] || TRACKS.neon;
    const spb = 60 / T.bpm / 2; // eighth notes
    while (nextNote < ctx.currentTime + 0.15) {
      const t = nextNote;
      const s = step;

      if (T.kick.indexOf(s) >= 0) taiko(t, s === 0 ? 1 : 0.75);
      if (T.soft.indexOf(s) >= 0) taiko(t, 0.45);
      if (T.hat.indexOf(s) >= 0) noise(0.03, 0.035, t, 6000);

      const b = T.bass[s];
      if (b) tone(b, spb * 0.9, T.bassType, T.bassVol, t);

      if (T.pluck && T.pluck[s]) pluck(T.pluck[s], spb * 2.6, T.pluckVol, t, T.pluckType);
      if (T.lead && T.lead[s]) tone(T.lead[s], spb * 1.6, T.leadType, T.leadVol, t);
      if (T.horns && T.horns[s]) horn(t, T.horns[s]);

      nextNote += spb;
      step = (step + 1) % 16;
    }
  }

  return {
    unlock,
    setMuted,
    isMuted() { return muted; },
    play,
    fanfare,
    /** @param name one of the TRACKS keys — levels pass their own. */
    startMusic(name) {
      unlock();
      track = TRACKS[name] ? name : 'neon';
      musicOn = true;
      step = 0;
      if (ctx) nextNote = ctx.currentTime + 0.05;
    },
    stopMusic() { musicOn = false; },
    currentTrack() { return musicOn ? track : null; },
    tick,
  };
})();

// Mute button
addEventListener('DOMContentLoaded', () => {
  const b = document.getElementById('mute');
  if (!b) return;
  b.addEventListener('click', () => {
    FF.audio.unlock();
    FF.audio.setMuted(!FF.audio.isMuted());
    b.textContent = FF.audio.isMuted() ? '🔇' : '🔊';
  });
});
