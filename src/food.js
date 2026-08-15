// FOOD FUN — snacks, hazards and the hunger meter
// Jeff starts every level starving. Food fills the meter; when it's full the KEY
// appears and the level can be cleared.

var FF = window.FF || (window.FF = {});

let uid = 0;

function pickup(x, y, kind, type, r) {
  return {
    id: ++uid,
    x: x, y: y, kind: kind, t: type, r: r,
    phase: (++uid % 100) * 0.31, // so they don't all bob in sync
    dead: false,
  };
}

FF.buildPickups = function (level) {
  const food = level.food.map((f) => pickup(f.x, f.y, 'food', f.t, FF.FOOD[f.t].r));
  const bananas = (level.bananas || []).map((b) => pickup(b.x, b.y, 'banana', 'banana', 16));
  const items = (level.items || []).map((i) => pickup(i.x, i.y, 'item', i.t, FF.ITEMS[i.t].r));
  return { food, bananas, items };
};

/**
 * How full the meter has to get. Deliberately less than every snack in the
 * level, so you never have to clear out the ninja-guarded stuff to move on.
 */
FF.hungerTarget = function (foods) {
  const total = foods.reduce((s, f) => s + FF.FOOD[f.t].v, 0);
  return Math.max(40, Math.round(total * 0.55));
};

FF.drawPickup = function (ctx, p, t) {
  if (p.dead) return;
  const bob = Math.sin(t * 0.06 + p.phase) * 4;
  const y = p.y + bob;

  if (p.kind === 'item') {
    // specials get a glow so they read as "rare"
    const glow = { bigmac: '#ffb703', chopsticks: '#ffd60a', riceball: '#ffffff', slowmo: '#7fe4ff' }[p.t];
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16 + Math.sin(t * 0.1 + p.phase) * 6;
    FF.emoji(ctx, FF.ITEMS[p.t].e, p.x, y, p.r * 2.1);
    ctx.restore();
    // sparkles
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 3; i++) {
      const a = t * 0.05 + i * 2.1 + p.phase;
      FF.oval(ctx, p.x + Math.cos(a) * (p.r + 10), y + Math.sin(a) * (p.r + 8), 1.8, 1.8);
      ctx.fill();
    }
    return;
  }

  if (p.kind === 'banana') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(Math.sin(t * 0.04 + p.phase) * 0.12);
    FF.emoji(ctx, '🍌', 0, 0, 34);
    // a little danger flash so it never feels unfair
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 0.15 + p.phase);
    ctx.strokeStyle = '#ff3b5c';
    ctx.lineWidth = 2;
    FF.oval(ctx, 0, 0, 21, 19);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const f = FF.FOOD[p.t];
  // a soft halo so snacks stay easy to see against dark buildings
  ctx.save();
  const halo = ctx.createRadialGradient(p.x, y, 2, p.x, y, f.r * 1.8);
  halo.addColorStop(0, 'rgba(255,240,200,.42)');
  halo.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = halo;
  FF.oval(ctx, p.x, y, f.r * 1.8, f.r * 1.8); ctx.fill();
  if (p.t === 'bento') {
    ctx.shadowColor = '#ff5fa2';
    ctx.shadowBlur = 16;
    FF.emoji(ctx, f.e, p.x, y, f.r * 2.2);
  } else {
    FF.emoji(ctx, f.e, p.x, y, f.r * 2.1);
  }
  ctx.restore();
};

/** The key that appears once the hunger meter is full. */
FF.drawKey = function (ctx, key, t) {
  const bob = Math.sin(t * 0.08) * 7;
  ctx.save();
  ctx.shadowColor = '#ffd60a';
  ctx.shadowBlur = 26 + Math.sin(t * 0.14) * 10;
  FF.emoji(ctx, '🔑', key.x, key.y + bob, 46);
  ctx.restore();
  // a ring of light so it's easy to spot from across the level
  ctx.strokeStyle = 'rgba(255,214,10,' + (0.25 + 0.2 * Math.sin(t * 0.1)) + ')';
  ctx.lineWidth = 3;
  FF.oval(ctx, key.x, key.y + bob, 36 + Math.sin(t * 0.1) * 5, 36 + Math.sin(t * 0.1) * 5);
  ctx.stroke();
};
