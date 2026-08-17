// FOOD FUN — THE DRAGON FRUIT BOSS
// Gavin's rules: he's a real dragon with a dragon fruit for a head, he spits
// dragon fruit seeds, and he's invincible until you find a mini strawberry.
// Eat one and you get FIVE SECONDS to hit the chomp button — Jeff then flies
// across the screen at him. Five chomps and you've eaten him.

var FF = window.FF || (window.FF = {});

const MAX_BITES = 5;
const SEED_EVERY = 105;
const CHOMP_WINDOW = 300;   // 5 seconds at 60fps

FF.CHOMP_WINDOW = CHOMP_WINDOW;

FF.Boss = class Boss {
  constructor(spec, arenaStart, arenaEnd, groundY, spots) {
    this.x = spec.x; this.y = spec.y;
    this.baseY = spec.y;
    this.w = 130; this.h = 130;
    this.bites = 0;
    this.chomps = 0;          // a banked strawberry, waiting to be spent
    this.window = 0;          // frames left to use it
    this.t = 0;
    this.face = -1;
    this.seedTimer = 90;
    this.seeds = [];
    this.hurtFlash = 0;
    this.dead = false;
    this.arena = { a: arenaStart, b: arenaEnd, groundY: groundY };
    this.spots = spots && spots.length ? spots : [
      { x: arenaStart + 60, y: groundY - 40 },
      { x: arenaEnd - 90, y: groundY - 40 },
    ];
    this.spotIndex = 0;
    this.strawberries = [];
    this.spawnStrawberry();
  }

  get cx() { return this.x; }
  get cy() { return this.y; }
  get size() { return 1 - this.bites * 0.12; }

  /** Seconds left to spend a banked chomp — the HUD counts this down. */
  get chompLeft() { return Math.max(0, this.window / 60); }

  /** Strawberries appear one at a time, always somewhere you can stand. */
  spawnStrawberry() {
    if (this.bites >= MAX_BITES) return;
    const s = this.spots[this.spotIndex % this.spots.length];
    this.spotIndex++;
    this.strawberries.push({ x: s.x, y: s.y, r: 16, phase: Math.random() * 6, dead: false });
  }

  /** Is he anywhere on screen? That's all you need to chomp him. */
  onScreen(camX, viewW) {
    const sx = this.x - camX;
    return sx > -40 && sx < viewW + 40;
  }

  canChomp() { return this.chomps > 0 && this.window > 0 && !this.dead; }

  update(jeff, ts, game) {
    this.t += ts;
    if (this.hurtFlash > 0) this.hurtFlash--;
    this.face = jeff.cx < this.x ? -1 : 1;

    // float around the arena, drifting toward Jeff
    this.y = this.baseY + Math.sin(this.t * 0.03) * 26;
    const drift = Math.sign(jeff.cx - this.x);
    const centre = (this.arena.a + this.arena.b) / 2;
    const pull = Math.abs(this.x - centre) > 220 ? Math.sign(centre - this.x) : drift;
    this.x += pull * 0.75 * ts;

    // eat a strawberry -> bank a chomp and start the five second clock
    for (const s of this.strawberries) {
      if (s.dead) continue;
      if (Math.hypot(jeff.cx - s.x, jeff.cy - s.y) < s.r + jeff.w * 0.5) {
        s.dead = true;
        this.chomps = 1;
        this.window = CHOMP_WINDOW;
        FF.audio.play('big');
        game.popText('CHOMP READY — 5 SECONDS!', jeff.cx, jeff.y - 34, '#ff5fa2');
      }
    }

    // the window running out costs you the chomp, but a new berry always appears
    // so the fight can never become unwinnable
    if (this.window > 0) {
      this.window -= ts;
      if (this.window <= 0) {
        this.window = 0;
        this.chomps = 0;
        game.popText('TOO SLOW!', jeff.cx, jeff.y - 34, '#ff5f7e');
        FF.audio.play('hurt');
        this.spawnStrawberry();
      }
    }

    // spit seeds
    this.seedTimer -= ts;
    if (this.seedTimer <= 0) {
      this.seedTimer = SEED_EVERY;
      const a = Math.atan2(jeff.cy - this.y, jeff.cx - this.x);
      for (let i = -1; i <= 1; i++) {
        this.seeds.push({
          x: this.x + this.face * 40, y: this.y + 6,
          vx: Math.cos(a + i * 0.22) * 4.4, vy: Math.sin(a + i * 0.22) * 4.4, life: 200,
        });
      }
      FF.audio.play('spit');
    }
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      s.x += s.vx * ts; s.y += s.vy * ts; s.life -= ts;
      if (s.life <= 0 || s.y > this.arena.groundY + 20) this.seeds.splice(i, 1);
    }
  }

  /** Jeff overlapping the dragon's head. */
  touching(jeff) {
    const r = 62 * this.size;
    return Math.hypot(jeff.cx - this.x, jeff.cy - this.y) < r + jeff.w * 0.4;
  }

  bite(game) {
    this.chomps = 0;
    this.window = 0;
    this.bites++;
    this.hurtFlash = 24;
    FF.audio.play('chomp');
    game.popText('CHOMP!', this.x, this.y - 70, '#fff');
    if (this.bites >= MAX_BITES) this.dead = true;
    else this.spawnStrawberry();
  }

  seedHits(jeff) {
    for (let i = 0; i < this.seeds.length; i++) {
      const s = this.seeds[i];
      if (Math.hypot(jeff.cx - s.x, jeff.cy - s.y) < 10 + jeff.w * 0.35) {
        this.seeds.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ drawing

  draw(ctx, t, lowFx) {
    // strawberries
    for (const s of this.strawberries) {
      if (s.dead) continue;
      ctx.save();
      if (!lowFx) { ctx.shadowColor = '#ff2d55'; ctx.shadowBlur = 18; }
      FF.emoji(ctx, '🍓', s.x, s.y + Math.sin(t * 0.07 + s.phase) * 5, 34, '#ff4b6b');
      ctx.restore();
    }

    // seeds
    for (const s of this.seeds) {
      ctx.fillStyle = '#2b2b2b';
      FF.oval(ctx, s.x, s.y, 6, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      FF.oval(ctx, s.x - 1.5, s.y - 2, 1.8, 2.4); ctx.fill();
    }

    if (this.dead) return;

    const k = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.face * k, k);
    if (this.hurtFlash > 0 && Math.floor(this.hurtFlash / 3) % 2 === 0) ctx.globalAlpha = 0.55;

    const flap = Math.sin(t * 0.11) * 22;

    // ---- tail, curling away behind him ----
    ctx.strokeStyle = '#c2186c';
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.lineWidth = 26 - i * 6;
      ctx.beginPath();
      ctx.moveTo(-96, 78);
      ctx.quadraticCurveTo(-160, 96 + Math.sin(t * 0.05) * 10, -214, 44 + Math.sin(t * 0.05) * 18);
      ctx.stroke();
      break;
    }
    // tail spade
    ctx.fillStyle = '#4cc76a';
    ctx.beginPath();
    ctx.moveTo(-214, 44 + Math.sin(t * 0.05) * 18);
    ctx.lineTo(-250, 18 + Math.sin(t * 0.05) * 18);
    ctx.lineTo(-244, 58 + Math.sin(t * 0.05) * 18);
    ctx.closePath(); ctx.fill();

    // ---- wings, behind the body ----
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-84, 46);
      ctx.rotate(side * 0.12 + flap * 0.012);
      const wg = ctx.createLinearGradient(0, -90, 0, 20);
      wg.addColorStop(0, '#ff9ecb');
      wg.addColorStop(1, '#b3125f');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-40, -84 - flap, -104, -66 - flap);
      ctx.quadraticCurveTo(-74, -30, -84, 6);
      ctx.quadraticCurveTo(-44, -8, 0, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,10,60,.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // ---- body ----
    const bg = ctx.createRadialGradient(-70, 46, 10, -84, 62, 92);
    bg.addColorStop(0, '#ff7ab8');
    bg.addColorStop(1, '#c2186c');
    ctx.fillStyle = bg;
    FF.oval(ctx, -84, 62, 62, 46); ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#8d0f52';
    ctx.stroke();

    // pale belly scales
    ctx.fillStyle = 'rgba(255,240,248,.85)';
    for (let i = 0; i < 4; i++) {
      FF.oval(ctx, -112 + i * 20, 88, 11, 7); ctx.fill();
    }

    // ---- clawed legs ----
    ctx.fillStyle = '#b3125f';
    for (const lx of [-118, -52]) {
      ctx.beginPath();
      ctx.moveTo(lx, 92); ctx.lineTo(lx - 10, 122); ctx.lineTo(lx + 16, 122); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff4d6';
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.moveTo(lx - 10 + c * 9, 122);
        ctx.lineTo(lx - 6 + c * 9, 132);
        ctx.lineTo(lx - 2 + c * 9, 122);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#b3125f';
    }

    // ---- neck, body up to the head ----
    ctx.strokeStyle = '#d81b7a';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(-78, 34);
    ctx.quadraticCurveTo(-58, -14, -12, -14);
    ctx.stroke();
    // spine spikes along the neck
    ctx.fillStyle = '#4cc76a';
    for (let i = 0; i < 4; i++) {
      const p = i / 3;
      const nx = -78 + p * 66, ny = 34 - p * 48 - Math.sin(p * Math.PI) * 10;
      ctx.beginPath();
      ctx.moveTo(nx - 8, ny - 12); ctx.lineTo(nx, ny - 30); ctx.lineTo(nx + 8, ny - 12);
      ctx.closePath(); ctx.fill();
    }

    // ================= THE HEAD — an actual dragon fruit =================
    // green fins fanning out all round it
    ctx.fillStyle = '#4cc76a';
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.sin(t * 0.02) * 0.08;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -44);
      ctx.quadraticCurveTo(20, -70, 3, -90);
      ctx.quadraticCurveTo(-13, -68, 0, -44);
      ctx.fill();
      ctx.restore();
    }

    // magenta dragon fruit skin
    const hg = ctx.createRadialGradient(-14, -18, 10, 0, 0, 68);
    hg.addColorStop(0, '#ff7ab8');
    hg.addColorStop(1, '#d81b7a');
    ctx.fillStyle = hg;
    FF.oval(ctx, 0, 0, 56, 58); ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#96105a';
    ctx.stroke();

    // white flesh snout with the black seeds in it
    ctx.fillStyle = '#fff2f7';
    FF.oval(ctx, 20, 14, 34, 30); ctx.fill();
    ctx.fillStyle = '#1c1c22';
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4;
      FF.oval(ctx, 20 + Math.cos(a) * (7 + (i % 4) * 6), 14 + Math.sin(a) * (7 + (i % 3) * 6), 2.3, 2.9);
      ctx.fill();
    }

    // nostril + snarling mouth with fangs
    ctx.fillStyle = '#96105a';
    FF.oval(ctx, 40, 4, 4, 3); ctx.fill();
    ctx.fillStyle = '#6d0b35';
    FF.oval(ctx, 26, 24, 20, 8 + Math.sin(t * 0.1) * 3); ctx.fill();
    ctx.fillStyle = '#fff';
    for (const fx of [14, 26, 38]) {
      ctx.beginPath();
      ctx.moveTo(fx - 4, 18); ctx.lineTo(fx, 30); ctx.lineTo(fx + 4, 18);
      ctx.closePath(); ctx.fill();
    }

    // eye + angry brow
    ctx.fillStyle = '#fff';
    FF.oval(ctx, 12, -22, 17, 19); ctx.fill();
    ctx.fillStyle = '#1c1c22';
    FF.oval(ctx, 16 + Math.sin(t * 0.05) * 2, -20, 8, 11); ctx.fill();
    ctx.fillStyle = '#fff';
    FF.oval(ctx, 20, -26, 3, 3); ctx.fill();
    ctx.strokeStyle = '#7a0c48';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-6, -44); ctx.lineTo(28, -32);
    ctx.stroke();

    // horns
    ctx.fillStyle = '#fff4d6';
    for (const h of [[-16, -50, -34, -84], [6, -52, 4, -92]]) {
      ctx.beginPath();
      ctx.moveTo(h[0] - 7, h[1]);
      ctx.quadraticCurveTo(h[2] - 4, h[3], h[2], h[3]);
      ctx.quadraticCurveTo(h[2] + 8, h[3] + 12, h[0] + 7, h[1]);
      ctx.closePath(); ctx.fill();
    }

    ctx.restore();

    // a big arrow over him while the chomp window is open
    if (this.canChomp()) {
      const bob = Math.sin(t * 0.3) * 6;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#9dffb0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 96 + bob);
      ctx.lineTo(this.x - 16, this.y - 124 + bob);
      ctx.lineTo(this.x + 16, this.y - 124 + bob);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  /** Health pips for the HUD. */
  hp() { return MAX_BITES - this.bites; }
  maxHp() { return MAX_BITES; }
};
