// FOOD FUN — BOB, the Fruity Pebbles sidekick
// Gavin's idea: Bob is a swirling rainbow bubble made of cereal pebbles that
// orbits Jeff. He blocks exactly one hit, pops, and then comes back.

var FF = window.FF || (window.FF = {});

const RECHARGE = 360; // frames — about 6 seconds
const PEBBLE_COLORS = ['#ff4b6b', '#ff9f1c', '#ffe14b', '#5ddd6b', '#4cc9f0', '#b06bff'];

FF.Shield = class Shield {
  constructor() {
    this.active = true;
    this.timer = 0;      // counts down while recharging
    this.popFlash = 0;
    this.bits = [];      // pebble burst particles
    this.spin = 0;
  }

  reset() {
    this.active = true;
    this.timer = 0;
    this.bits.length = 0;
  }

  /** Called when something would hurt Jeff. Returns true if the hit was eaten. */
  block(jeff) {
    if (!this.active) return false;
    this.active = false;
    this.timer = RECHARGE;
    this.popFlash = 22;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      this.bits.push({
        x: jeff.x + jeff.w / 2, y: jeff.y + jeff.h / 2,
        vx: Math.cos(a) * (2 + Math.random() * 3),
        vy: Math.sin(a) * (2 + Math.random() * 3) - 1,
        c: PEBBLE_COLORS[i % PEBBLE_COLORS.length],
        life: 40 + Math.random() * 20,
        r: 2.5 + Math.random() * 2,
      });
    }
    FF.audio.play('pop');
    return true;
  }

  update() {
    this.spin += 0.045;
    if (this.popFlash > 0) this.popFlash--;
    if (!this.active) {
      this.timer--;
      if (this.timer <= 0) {
        this.active = true;
        FF.audio.play('shield');
      }
    }
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      b.x += b.vx; b.y += b.vy; b.vy += 0.16; b.life--;
      if (b.life <= 0) this.bits.splice(i, 1);
    }
  }

  /** How full the recharge bar is, 0..1. */
  charge() {
    if (this.active) return 1;
    return Math.max(0, Math.min(1, 1 - this.timer / RECHARGE));
  }

  draw(ctx, jeff) {
    const cx = jeff.x + jeff.w / 2;
    const cy = jeff.y + jeff.h / 2;
    const rad = jeff.w * 0.95;

    if (this.active) {
      // translucent bubble
      ctx.save();
      const g = ctx.createRadialGradient(cx, cy, rad * 0.5, cx, cy, rad);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.75, 'rgba(255,255,255,.10)');
      g.addColorStop(1, 'rgba(255,255,255,.30)');
      ctx.fillStyle = g;
      FF.oval(ctx, cx, cy, rad, rad); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // orbiting cereal pebbles
      for (let i = 0; i < 12; i++) {
        const a = this.spin + (i / 12) * Math.PI * 2;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad * 0.92;
        ctx.fillStyle = PEBBLE_COLORS[i % PEBBLE_COLORS.length];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        FF.oval(ctx, px, py, 4.2, 3.4); ctx.fill();
      }
      ctx.restore();
    } else if (this.popFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.popFlash / 22;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      FF.oval(ctx, cx, cy, rad * (1 + (22 - this.popFlash) * 0.06), rad * (1 + (22 - this.popFlash) * 0.06));
      ctx.stroke();
      ctx.restore();
    }

    for (const b of this.bits) {
      ctx.globalAlpha = Math.min(1, b.life / 25);
      ctx.fillStyle = b.c;
      FF.oval(ctx, b.x, b.y, b.r, b.r); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
};
