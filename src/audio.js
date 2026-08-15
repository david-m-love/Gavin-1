// FOOD FUN — sound
// Everything is synthesized with the Web Audio API, so there are no audio files
// to load and nothing can 404. Gavin asked for "loud hype battle music" —
// taiko drums, a stomping bass, and horn stabs, like a real sumo match.

var FF = window.FF || (window.FF = {});

FF.audio = (function () {
  let ctx = null;
  let master = null;
  let muted = false;
  let musicOn = false;
  let nextNote = 0;
  let step = 0;
  let intensity = 1; // 1 = normal level, 2 = boss fight

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

  function noise(dur, vol, when, hz) {
    if (!ctx) return;
    const t = when || ctx.currentTime;
    const n = Math.floor(ctx.sampleRate * dur);
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
  function horn(when, root) {
    [0, 4, 7].forEach((semi, i) => {
      const f = root * Math.pow(2, semi / 12);
      tone(f, 0.34, 'sawtooth', 0.055 - i * 0.008, when);
    });
  }

  // ---- sound effects ----

  const sfx = {
    eat() { tone(520 + Math.random() * 90, 0.09, 'triangle', 0.16, 0, 780); noise(0.05, 0.05, 0, 2400); },
    big() { [440, 587, 740, 880].forEach((f, i) => tone(f, 0.16, 'triangle', 0.14, ctx && ctx.currentTime + i * 0.05)); },
    jump() { tone(300, 0.13, 'square', 0.09, 0, 620); },
    land() { noise(0.05, 0.06, 0, 400); },
    slurp() { tone(180, 0.22, 'sawtooth', 0.05, 0, 520); },
    bump() { taiko(0, 0.9); tone(200, 0.12, 'square', 0.12, 0, 90); },
    hurt() { tone(300, 0.3, 'sawtooth', 0.16, 0, 70); noise(0.18, 0.09, 0, 500); },
    shield() { [660, 880, 1100].forEach((f, i) => tone(f, 0.14, 'sine', 0.1, ctx && ctx.currentTime + i * 0.04)); },
    pop() { tone(900, 0.12, 'sine', 0.12, 0, 220); noise(0.08, 0.07, 0, 3000); },
    key() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, 'square', 0.11, ctx && ctx.currentTime + i * 0.09)); },
    star() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.11, ctx && ctx.currentTime + i * 0.06)); },
    chomp() { tone(220, 0.16, 'square', 0.18, 0, 60); noise(0.12, 0.12, 0, 700); },
    rumble() { tone(70, 1.6, 'sine', 0.3, 0, 30); noise(1.4, 0.14, 0, 180); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, ctx && ctx.currentTime + i * 0.13)); },
    train() { tone(90, 0.9, 'sawtooth', 0.09, 0, 240); noise(0.8, 0.07, 0, 600); },
  };

  function play(name) {
    if (!ctx || muted) return;
    const fn = sfx[name];
    if (fn) fn();
  }

  // ---- the music sequencer ----
  // A 16-step loop scheduled slightly ahead of the audio clock so it stays
  // rock-steady even when the game loop stutters.

  const BASS = [55, 0, 55, 0, 73.4, 0, 55, 0, 65.4, 0, 65.4, 0, 82.4, 0, 73.4, 0];

  function tick() {
    if (!ctx || !musicOn) return;
    const spb = 60 / (intensity > 1 ? 152 : 132) / 2; // eighth notes
    while (nextNote < ctx.currentTime + 0.15) {
      const t = nextNote;
      if (step % 4 === 0) taiko(t, step % 8 === 0 ? 1 : 0.7);
      if (step % 8 === 6) taiko(t, 0.5);
      if (intensity > 1 && step % 2 === 1) noise(0.04, 0.04, t, 5000);
      const b = BASS[step % 16];
      if (b) tone(b, spb * 0.9, 'square', 0.075, t);
      if (step % 16 === 0) horn(t, 220);
      if (step % 16 === 12) horn(t, intensity > 1 ? 262 : 196);
      nextNote += spb;
      step = (step + 1) % 16;
    }
  }

  return {
    unlock,
    setMuted,
    isMuted() { return muted; },
    play,
    startMusic(level) { unlock(); intensity = level; musicOn = true; if (ctx) nextNote = ctx.currentTime + 0.05; },
    stopMusic() { musicOn = false; },
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
