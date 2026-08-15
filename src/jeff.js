// FOOD FUN — Jeff
// A tiny chubby sumo who is always starving. He runs, jumps, vacuum-slurps food
// toward himself, and belly-bumps Banana Ninjas into orbit. He grows a little
// bigger with every level he clears.

var FF = window.FF || (window.FF = {});

const ACC = 0.85;
const MAX_RUN = 4.3;
const FRICTION = 0.80;
const GRAVITY = 0.62;
const JUMP_V = -12.6;
const COYOTE = 7;      // frames of grace after walking off a ledge
const BUFFER = 8;      // frames a jump press is remembered
const BUMP_TIME = 16;
const BUMP_SPEED = 8.6;
const BUMP_COOL = 42;
const SLURP_RANGE = 195;

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
    this.bump = 0;
    this.bumpCool = 0;
    this.star = 0;        // Big Mac star power, in frames
    this.invuln = 0;      // after taking a hit
    this.knock = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(level, input) {
    const wantLeft = input.held.left;
    const wantRight = input.held.right;

    if (this.bumpCool > 0) this.bumpCool--;
    if (this.invuln > 0) this.invuln--;
    if (this.star > 0) this.star--;

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
      if (wantLeft && !wantRight) { this.vx -= ACC; this.face = -1; }
      else if (wantRight && !wantLeft) { this.vx += ACC; this.face = 1; }
      else this.vx *= FRICTION;
      this.vx = Math.max(-MAX_RUN, Math.min(MAX_RUN, this.vx));
    }

    // ---- vacuum slurp ----
    this.slurping = input.held.slurp && this.bump <= 0;
    if (this.slurping && Math.random() < 0.25) FF.audio.play('slurp');

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

  /** Pull nearby food toward Jeff's mouth while the slurp button is held. */
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
    ctx.globalAlpha = 0.3;
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

  hurtable() { return this.invuln <= 0 && this.star <= 0; }

  takeHit(fromX) {
    this.invuln = 95;
    this.knock = 16;
    this.vx = (this.cx < fromX ? -1 : 1) * 5.5;
    this.vy = -6.5;
    this.squash = -0.2;
    FF.audio.play('hurt');
  }

  draw(ctx, t) {
    // blink while invulnerable
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    FF.drawJeff(ctx, this, t);
  }
};
