// FOOD FUN — Banana Ninjas
// They guard the best food. Each one is tied to a guard post and won't chase
// Jeff past it, so the rare snacks always have someone standing over them.
// Belly-bump them (or hit them in Big Mac star mode) and they go flying.

var FF = window.FF || (window.FF = {});

const PATROL_SPEED = 1.15;
const CHASE_SPEED = 2.35;
const SPOT_X = 230;
const SPOT_Y = 70;

FF.Ninja = class Ninja {
  constructor(spec) {
    this.home = spec.x;
    this.range = spec.range || 100;
    this.w = 30; this.h = 40;
    this.x = spec.x; this.y = spec.y;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.face = 1;
    this.alert = 0;
    this.flying = false;
    this.vx = 0; this.vy = 0;
    this.spin = 0;
    this.dead = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(jeff, ts, groundLimit) {
    if (this.flying) {
      this.x += this.vx * ts;
      this.y += this.vy * ts;
      this.vy += 0.5 * ts;
      this.spin += 0.4 * ts;
      if (this.y > groundLimit + 400) this.dead = true;
      return;
    }

    const dx = jeff.cx - this.cx;
    const dy = jeff.cy - this.cy;
    const sees = Math.abs(dx) < SPOT_X && Math.abs(dy) < SPOT_Y;

    if (sees) {
      this.alert = Math.min(30, this.alert + 2);
      this.dir = Math.sign(dx) || this.dir;
      this.x += this.dir * CHASE_SPEED * ts;
    } else {
      this.alert = Math.max(0, this.alert - 1);
      this.x += this.dir * PATROL_SPEED * ts;
    }

    // never abandon the guard post
    const lo = this.home - this.range;
    const hi = this.home + this.range;
    if (this.x < lo) { this.x = lo; this.dir = 1; }
    if (this.x > hi) { this.x = hi; this.dir = -1; }

    this.face = this.dir;
  }

  hits(jeff) {
    if (this.flying || this.dead) return false;
    return this.x < jeff.x + jeff.w && this.x + this.w > jeff.x &&
           this.y < jeff.y + jeff.h && this.y + this.h > jeff.y;
  }

  knockFlying(dirX) {
    this.flying = true;
    this.vx = dirX * 11 + (Math.random() * 3 - 1.5);
    this.vy = -10.5;
    FF.audio.play('bump');
  }

  draw(ctx, t) {
    FF.drawNinja(ctx, this, t);
  }
};
