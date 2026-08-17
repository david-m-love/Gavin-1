// FOOD FUN — Jeff
// A tiny chubby sumo who is always starving. He runs, jumps, vacuum-slurps food
// toward himself, belly-bumps Banana Ninjas into orbit, and — once he's eaten a
// strawberry — flies clean across the screen to chomp the Dragon Fruit Boss.
// He grows a little bigger with every level he clears.

var FF = window.FF || (window.FF = {});

const ACC = 0.78;
const MAX_RUN = 3.7;          // Gavin asked for a slightly slower base pace
const ENERGY_BOOST = 1.7;     // ...and the Energy Drink is what makes you fast
const FRICTION = 0.80;
const GRAVITY = 0.62;
const JUMP_V = -12.6;
const COYOTE = 7;             // frames of grace after walking off a ledge
const BUFFER = 8;             // frames a jump press is remembered
const BUMP_TIME = 16;
const BUMP_SPEED = 8.6;
const BUMP_COOL = 42;

const SLURP_RANGE = 195;
const SLURP_BURST = 90;       // one slurp lasts 1.5s...
const SLURP_COOL = 900;       // ...then waits 15s. Change this to retune it.

const CHOMP_TIME = 50;        // max frames of the flight at the dragon
const CHOMP_SPEED = 17;

FF.SLURP_COOL = SLURP_COOL;   // the HUD draws the recharge bar from this

FF.Jeff = class Jeff {
  constructor(level) {
    this.scale = 1;
    this.setSize();
    this.reset(level);
  }

  /** Jeff gets a tiny bit bigger each level he beats. */
  grow() {
    this.scale = Math.min(1.5, this.scale + 0.09);
    this.setSize();
  }

  setSize() {
    this.w = 42 * this.scale;
    this.h = 44 * this.scale;
  }

  reset(level) {
    this.x = 90;
    this.y = level.groundY - this.h;
    this.vx = 0; this.vy = 0;
    this.face = 1;
    this.onGround = true;
    this.coyote = 0; this.buffer = 0;
    this.squash = 0;
    this.slurping = false;
    this.slurpBurst = 0;
    this.slurpCool = 0;
    this.bump = 0;
    this.bumpCool = 0;
    this.chomp = 0;           // frames left in the flight at the boss
    this.chompTarget = null;
    this.star = 0;            // Big Mac star power, in frames
    this.energy = 0;          // Energy Drink speed boost, in frames
    this.invuln = 0;          // after taking a hit
    this.knock = 0;
    this.trail = [];          // ghost images while boosted or chomping
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  /** Top speed right now — the Energy Drink is the only thing that raises it. */
  get topSpeed() { return this.energy > 0 ? MAX_RUN * ENERGY_BOOST : MAX_RUN; }

  slurpReady() { return this.slurpCool <= 0 && this.slurpBurst <= 0; }

  /** Launch Jeff across the screen at the boss. */
  startChomp(tx, ty) {
    this.chomp = CHOMP_TIME;
    this.chompTarget = { x: tx, y: ty };
    this.face = tx > this.cx ? 1 : -1;
    this.squash = -0.2;
    this.bump = 0;
    FF.audio.play('chompFly');
  }

  update(level, input) {
    const wantLeft = input.held.left;
    const wantRight = input.held.right;

    if (this.bumpCool > 0) this.bumpCool--;
    if (this.invuln > 0) this.invuln--;
    if (this.star > 0) this.star--;
    if (this.energy > 0) this.energy--;
    if (this.slurpCool > 0) this.slurpCool--;
    if (this.slurpBurst > 0) this.slurpBurst--;

    // ---- flying at the dragon: nothing else matters while this is happening ----
    if (this.chomp > 0) {
      this.chomp--;
      const dx = this.chompTarget.x - this.cx;
      const dy = this.chompTarget.y - this.cy;
      const d = Math.hypot(dx, dy) || 1;
      this.vx = (dx / d) * CHOMP_SPEED;
      this.vy = (dy / d) * CHOMP_SPEED;
      this.x += this.vx;
      this.y += this.vy;
      // stay inside the world even though walls are ignored mid-flight
      this.x = Math.max(0, Math.min(level.width - this.w, this.x));
      this.y = Math.max(-80, Math.min(level.groundY - this.h, this.y));
      this.pushTrail();
      return;                                  // no gravity, no walls, no steering
    }

    // ---- belly bump ----
    if (input.tapped('bump') && this.bump <= 0 && this.bumpCool <= 0) {
      this.bump = BUMP_TIME;
      this.bumpCool = BUMP_COOL;
      this.squash = -0.14;
      FF.audio.play('bump');
    }
    if (this.bump > 0) {
      this.bump--;
      this.vx = this.face * BUMP_SPEED * (0.4 + this.bump / BUMP_TIME);
    } else if (this.knock > 0) {
      // knocked back after a hit — no steering for a moment
      this.knock--;
    } else {
      const top = this.topSpeed;
      if (wantLeft && !wantRight) { this.vx -= ACC; this.face = -1; }
      else if (wantRight && !wantLeft) { this.vx += ACC; this.face = 1; }
      else this.vx *= FRICTION;
      this.vx = Math.max(-top, Math.min(top, this.vx));
    }

    // ---- vacuum slurp: one burst, then a cooldown ----
    if (input.tapped('slurp') && this.slurpReady()) {
      this.slurpBurst = SLURP_BURST;
      this.slurpCool = SLURP_COOL;
      FF.audio.play('slurp');
    }
    this.slurping = this.slurpBurst > 0 && this.bump <= 0;

    // ---- jump, with coyote time and input buffering so it always feels fair ----
    if (input.tapped('jump')) this.buffer = BUFFER;
    if (this.buffer > 0) this.buffer--;
    if (this.coyote > 0) this.coyote--;

    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = JUMP_V;
      this.onGround = false;
      this.coyote = 0; this.buffer = 0;
      this.squash = -0.16;
      FF.audio.play('jump');
    }
    // let go of jump early = shorter hop
    if (!input.held.jump && this.vy < -4) this.vy *= 0.86;

    this.vy = Math.min(this.vy + GRAVITY, 15);

    this.moveAndCollide(level);

    // world edges
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    const maxX = level.width - this.w;
    if (this.x > maxX) { this.x = maxX; this.vx = 0; }

    this.squash *= 0.82;
    if (this.energy > 0) this.pushTrail(); else if (this.trail.length) this.trail.length = 0;
  }

  pushTrail() {
    this.trail.push({ x: this.x, y: this.y, life: 12 });
    if (this.trail.length > 8) this.trail.shift();
    for (const g of this.trail) g.life--;
  }

  moveAndCollide(level) {
    const plats = level.solids;

    this.x += this.vx;
    for (const p of plats) {
      if (!this.overlaps(p)) continue;
      if (this.vx > 0) this.x = p.x - this.w;
      else if (this.vx < 0) this.x = p.x + p.w;
      this.vx = 0;
      if (this.bump > 0) this.bump = 0;
    }

    const wasAir = !this.onGround;
    this.y += this.vy;
    this.onGround = false;
    for (const p of plats) {
      if (!this.overlaps(p)) continue;
      if (this.vy > 0) {
        this.y = p.y - this.h;
        this.onGround = true;
        if (wasAir && this.vy > 6) { this.squash = 0.2; FF.audio.play('land'); }
      } else if (this.vy < 0) {
        this.y = p.y + p.h;
      }
      this.vy = 0;
    }
    if (this.onGround) this.coyote = COYOTE;
  }

  overlaps(p) {
    return this.x < p.x + p.w && this.x + this.w > p.x &&
           this.y < p.y + p.h && this.y + this.h > p.y;
  }

  /** Pull nearby food toward Jeff's mouth while the slurp is running. */
  slurpPull(items) {
    if (!this.slurping) return;
    for (const it of items) {
      if (it.dead) continue;
      const dx = this.cx - it.x;
      const dy = this.cy - it.y;
      const d = Math.hypot(dx, dy);
      // only sucks in what's in front of him, like a real slurp
      if (d < SLURP_RANGE && d > 1 && Math.sign(dx) !== this.face) {
        const pull = 4.2 * (1 - d / SLURP_RANGE) + 1.2;
        it.x += (dx / d) * pull;
        it.y += (dy / d) * pull;
      }
    }
  }

  /** Draw the swirl of air Jeff is inhaling. */
  drawSlurp(ctx, t) {
    if (!this.slurping) return;
    ctx.save();
    ctx.strokeStyle = '#bfe9ff';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const p = ((t * 0.06 + i * 0.25) % 1);
      const d = SLURP_RANGE * (1 - p);
      ctx.globalAlpha = 0.35 * p;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, d * 0.55,
        this.face > 0 ? -0.6 : Math.PI - 0.6,
        this.face > 0 ? 0.6 : Math.PI + 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Motion ghosts while boosted or mid-chomp. */
  drawTrail(ctx) {
    if (!this.trail.length) return;
    ctx.save();
    for (let i = 0; i < this.trail.length; i++) {
      const g = this.trail[i];
      ctx.globalAlpha = 0.06 + 0.05 * i;
      ctx.fillStyle = this.chomp > 0 ? '#ff5fa2' : '#ffd166';
      FF.oval(ctx, g.x + this.w / 2, g.y + this.h / 2, this.w * 0.5, this.h * 0.5);
      ctx.fill();
    }
    ctx.restore();
  }

  hurtable() { return this.invuln <= 0 && this.star <= 0 && this.chomp <= 0; }

  takeHit(fromX) {
    this.invuln = 95;
    this.knock = 16;
    this.vx = (this.cx < fromX ? -1 : 1) * 5.5;
    this.vy = -6.5;
    this.squash = -0.2;
    FF.audio.play('hurt');
  }

  draw(ctx, t) {
    this.drawTrail(ctx);
    // blink while invulnerable
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    FF.drawJeff(ctx, this, t);
  }
};
