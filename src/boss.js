// FOOD FUN — THE DRAGON FRUIT BOSS
// Gavin's rule: he's invincible until you find the mini strawberries. Every
// strawberry you eat earns you one CHOMP. Five chomps and you've eaten him.

var FF = window.FF || (window.FF = {});

const MAX_BITES = 5;
const SEED_EVERY = 105;

FF.Boss = class Boss {
  constructor(spec, arenaStart, arenaEnd, groundY) {
    this.x = spec.x; this.y = spec.y;
    this.baseY = spec.y;
    this.w = 120; this.h = 130;
    this.bites = 0;
    this.chomps = 0;         // banked strawberries = available bites
    this.t = 0;
    this.seedTimer = 90;
    this.seeds = [];
    this.hurtFlash = 0;
    this.dead = false;
    this.arena = { a: arenaStart, b: arenaEnd, groundY: groundY };
    this.strawberries = [];
    this.spawnStrawberry();
  }

  get cx() { return this.x; }
  get cy() { return this.y; }
  get size() { return 1 - this.bites * 0.13; }

  /** Strawberries appear one at a time, scattered around the arena. */
  spawnStrawberry() {
    if (this.bites + this.chomps >= MAX_BITES) return;
    const spots = [
      { x: this.arena.a + 60, y: this.arena.groundY - 40 },
      { x: this.arena.a + 210, y: 300 },
      { x: this.arena.a + 380, y: 210 },
      { x: this.arena.b - 90, y: this.arena.groundY - 40 },
      { x: this.arena.a + 130, y: 300 },
    ];
    const s = spots[(this.bites + this.chomps) % spots.length];
    this.strawberries.push({ x: s.x, y: s.y, r: 16, phase: Math.random() * 6, dead: false });
  }

  update(jeff, ts, game) {
    this.t += ts;
    if (this.hurtFlash > 0) this.hurtFlash--;

    // float around the arena, drifting toward Jeff
    this.y = this.baseY + Math.sin(this.t * 0.03) * 26;
    const drift = Math.sign(jeff.cx - this.x);
    const centre = (this.arena.a + this.arena.b) / 2;
    const pull = Math.abs(this.x - centre) > 220 ? Math.sign(centre - this.x) : drift;
    this.x += pull * 0.75 * ts;

    // eat a strawberry -> bank a chomp
    for (const s of this.strawberries) {
      if (s.dead) continue;
      if (Math.hypot(jeff.cx - s.x, jeff.cy - s.y) < s.r + jeff.w * 0.5) {
        s.dead = true;
        this.chomps++;
        FF.audio.play('big');
        game.popText('CHOMP READY!', jeff.cx, jeff.y - 30, '#ff5fa2');
      }
    }

    // spit seeds
    this.seedTimer -= ts;
    if (this.seedTimer <= 0) {
      this.seedTimer = SEED_EVERY;
      const a = Math.atan2(jeff.cy - this.y, jeff.cx - this.x);
      for (let i = -1; i <= 1; i++) {
        this.seeds.push({ x: this.x, y: this.y, vx: Math.cos(a + i * 0.22) * 4.4, vy: Math.sin(a + i * 0.22) * 4.4, life: 200 });
      }
      FF.audio.play('chomp');
    }
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      s.x += s.vx * ts; s.y += s.vy * ts; s.life -= ts;
      if (s.life <= 0 || s.y > this.arena.groundY + 20) this.seeds.splice(i, 1);
    }
  }

  /** Jeff touching the boss: a bite if a strawberry is banked, otherwise it hurts. */
  touching(jeff) {
    const rw = this.w * this.size * 0.5;
    const rh = this.h * this.size * 0.5;
    return Math.abs(jeff.cx - this.x) < rw + jeff.w * 0.4 &&
           Math.abs(jeff.cy - this.y) < rh + jeff.h * 0.4;
  }

  bite(game) {
    this.chomps--;
    this.bites++;
    this.hurtFlash = 22;
    FF.audio.play('chomp');
    game.popText('CHOMP!', this.x, this.y - 60, '#fff');
    if (this.bites >= MAX_BITES) {
      this.dead = true;
    } else {
      this.spawnStrawberry();
    }
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

  draw(ctx, t) {
    // strawberries
    for (const s of this.strawberries) {
      if (s.dead) continue;
      ctx.save();
      ctx.shadowColor = '#ff2d55';
      ctx.shadowBlur = 18;
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

    const s = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(s, s);
    if (this.hurtFlash > 0 && Math.floor(this.hurtFlash / 3) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // green fins/leaves poking out all around
    ctx.fillStyle = '#4cc76a';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.sin(t * 0.02) * 0.08;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.quadraticCurveTo(22, -76, 4, -96);
      ctx.quadraticCurveTo(-14, -74, 0, -50);
      ctx.fill();
      ctx.restore();
    }

    // magenta body
    const g = ctx.createRadialGradient(-14, -18, 10, 0, 0, 72);
    g.addColorStop(0, '#ff7ab8');
    g.addColorStop(1, '#d81b7a');
    ctx.fillStyle = g;
    FF.oval(ctx, 0, 0, 60, 66); ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#96105a';
    ctx.stroke();

    // white flesh belly with black seeds (he really is fruit)
    ctx.fillStyle = '#fff2f7';
    FF.oval(ctx, 0, 12, 36, 40); ctx.fill();
    ctx.fillStyle = '#1c1c22';
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4;
      FF.oval(ctx, Math.cos(a) * (8 + (i % 4) * 7), 12 + Math.sin(a) * (10 + (i % 3) * 8), 2.4, 3);
      ctx.fill();
    }

    // angry face
    ctx.fillStyle = '#fff';
    FF.oval(ctx, -22, -22, 15, 17); ctx.fill();
    FF.oval(ctx, 22, -22, 15, 17); ctx.fill();
    ctx.fillStyle = '#1c1c22';
    const look = Math.sin(t * 0.05) * 3;
    FF.oval(ctx, -22 + look, -20, 7, 9); ctx.fill();
    FF.oval(ctx, 22 + look, -20, 7, 9); ctx.fill();
    ctx.strokeStyle = '#7a0c48';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-36, -40); ctx.lineTo(-10, -31);
    ctx.moveTo(36, -40); ctx.lineTo(10, -31);
    ctx.stroke();

    // mouth + fangs
    ctx.fillStyle = '#6d0b35';
    FF.oval(ctx, 0, 2, 18, 10 + Math.sin(t * 0.1) * 3); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-10, -4); ctx.lineTo(-4, 6); ctx.lineTo(-1, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -4); ctx.lineTo(4, 6); ctx.lineTo(1, -4); ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  /** Health pips for the HUD. */
  hp() { return MAX_BITES - this.bites; }
  maxHp() { return MAX_BITES; }
};
