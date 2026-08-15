// FOOD FUN — drawing helpers
// Everything is drawn with canvas shapes and emoji glyphs. No image files, so
// the game loads instantly and nothing can go missing. The look Gavin picked is
// "cute cartoon / anime": round soft bodies, big shiny eyes, blush, bright colors.

var FF = window.FF || (window.FF = {});

// Deterministic pseudo-random so background buildings don't jitter every frame.
FF.hash = function (n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

FF.rr = function (ctx, x, y, w, h, r) {
  w = Math.max(0, w); h = Math.max(0, h);
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

FF.oval = function (ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
};

// Some emoji fall back to a plain text glyph on some systems, and a plain glyph
// is painted with whatever fillStyle happens to be set. So always set one.
FF.emoji = function (ctx, ch, cx, cy, size, color) {
  ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color || '#fff';
  ctx.fillText(ch, cx, cy);
};

FF.text = function (ctx, str, cx, cy, size, color, align) {
  ctx.font = 'bold ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = 'rgba(0,0,0,.65)';
  ctx.strokeText(str, cx, cy);
  ctx.fillStyle = color || '#fff';
  ctx.fillText(str, cx, cy);
};

// ---------------------------------------------------------------- JEFF ------

/**
 * Jeff has several looks and you pick one on the title screen. Each look is
 * just a bundle of colours and part choices — the drawing code below reads them,
 * so adding a new Jeff means adding one more entry to this list.
 */
FF.LOOKS = [
  {
    id: 'classic', name: 'Original Jeff', blurb: 'the first one',
    skin: '#ffe0c2', skin2: '#f0b483', line: '#a76b45',
    belt: '#2b3a8f', belt2: '#e23b5a',
    hair: 'topknot', hairColor: '#2a1d17',
    eyes: 'big', wide: 1.0, tall: 1.0, blush: true,
  },
  {
    id: 'beefy', name: 'Big Beefy Jeff', blurb: 'a serious sumo',
    skin: '#f7c894', skin2: '#d99a5c', line: '#8b5220',
    belt: '#c62828', belt2: '#ffd54f',
    hair: 'topknot', hairColor: '#150e06',
    eyes: 'determined', brow: 'thick', wide: 1.2, tall: 1.02, blush: false,
  },
  {
    id: 'cool', name: 'Cool Jeff', blurb: 'shades and spiky hair',
    skin: '#ffd9b0', skin2: '#eeb27e', line: '#96603a',
    belt: '#1565c0', belt2: '#00e5ff',
    hair: 'spiky', hairColor: '#14141c', headband: '#ff1744',
    eyes: 'shades', wide: 1.0, tall: 1.04, blush: false,
  },
  {
    id: 'chonk', name: 'Chonky Jeff', blurb: 'cheeks full of food',
    skin: '#ffe7cd', skin2: '#f5c79b', line: '#b07a52',
    belt: '#8e24aa', belt2: '#ffca28',
    hair: 'tuft', hairColor: '#3b2a1e',
    eyes: 'sparkle', wide: 1.24, tall: 0.93, blush: true, cheeks: true,
  },
  {
    id: 'fire', name: 'Fire Jeff', blurb: 'hair made of flames',
    skin: '#ffcf9e', skin2: '#e79a5f', line: '#8f4b20',
    belt: '#1b1b1b', belt2: '#ff6d00',
    hair: 'flame',
    eyes: 'fierce', brow: 'angry', wide: 1.06, tall: 1.02, blush: false,
  },
];

// Which look is in play. Saved so it sticks between visits.
FF.lookIndex = 0;
try {
  const saved = localStorage.getItem('foodfun.look');
  const i = FF.LOOKS.findIndex((l) => l.id === saved);
  if (i >= 0) FF.lookIndex = i;
} catch (e) { /* private browsing — just use the default */ }

FF.look = function () { return FF.LOOKS[FF.lookIndex]; };

FF.setLook = function (i) {
  FF.lookIndex = ((i % FF.LOOKS.length) + FF.LOOKS.length) % FF.LOOKS.length;
  try { localStorage.setItem('foodfun.look', FF.LOOKS[FF.lookIndex].id); } catch (e) { /* ignore */ }
};

// ---- hair styles ----

function drawHair(ctx, L, bw, bh, s, t) {
  if (L.hair === 'topknot') {
    ctx.fillStyle = L.hairColor;
    FF.oval(ctx, 0, -bh * 0.86, bw * 0.54, bh * 0.24); ctx.fill();
    FF.oval(ctx, 0, -bh * 1.08, bw * 0.2, bh * 0.16); ctx.fill();
    return;
  }
  if (L.hair === 'spiky') {
    ctx.fillStyle = L.hairColor;
    // taller in the middle, leaning outward at the edges
    const peaks = [1.02, 1.3, 1.46, 1.3, 1.02];
    for (let i = -2; i <= 2; i++) {
      const lean = i * bw * 0.09;
      ctx.beginPath();
      ctx.moveTo(i * bw * 0.24 - bw * 0.15, -bh * 0.8);
      ctx.lineTo(i * bw * 0.24 + lean, -bh * peaks[i + 2]);
      ctx.lineTo(i * bw * 0.24 + bw * 0.15, -bh * 0.8);
      ctx.closePath(); ctx.fill();
    }
    FF.oval(ctx, 0, -bh * 0.76, bw * 0.62, bh * 0.2); ctx.fill();
    if (L.headband) {
      ctx.fillStyle = L.headband;
      FF.rr(ctx, -bw * 0.66, -bh * 0.72, bw * 1.32, bh * 0.14, 3); ctx.fill();
      ctx.fillStyle = '#fff';
      FF.oval(ctx, 0, -bh * 0.65, bw * 0.09, bh * 0.05); ctx.fill();
    }
    return;
  }
  if (L.hair === 'tuft') {
    ctx.fillStyle = L.hairColor;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.1, -bh * 0.9);
    ctx.quadraticCurveTo(bw * 0.34, -bh * 1.3, bw * 0.02, -bh * 1.08);
    ctx.quadraticCurveTo(bw * 0.2, -bh * 1.02, -bw * 0.1, -bh * 0.9);
    ctx.fill();
    FF.oval(ctx, 0, -bh * 0.84, bw * 0.4, bh * 0.16); ctx.fill();
    return;
  }
  if (L.hair === 'flame') {
    // three flickering tongues of fire — tall and pointy in the middle
    const g = ctx.createLinearGradient(0, -bh * 1.8, 0, -bh * 0.7);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(0.35, '#ffc300');
    g.addColorStop(0.72, '#ff7b00');
    g.addColorStop(1, '#e02b16');
    ctx.fillStyle = g;
    const tongues = [
      { off: -0.42, top: 1.26, wide: 0.2, lean: -0.16 },
      { off: 0.0, top: 1.78, wide: 0.24, lean: 0.05 },
      { off: 0.44, top: 1.3, wide: 0.2, lean: 0.18 },
    ];
    tongues.forEach((f, i) => {
      const lick = Math.sin(t * 0.22 + i * 2.1) * bh * 0.12;
      const tipX = (f.off + f.lean) * bw;
      ctx.beginPath();
      ctx.moveTo((f.off - f.wide) * bw, -bh * 0.74);
      ctx.quadraticCurveTo((f.off - f.wide * 1.1) * bw, -bh * (f.top * 0.6), tipX, -bh * f.top - lick);
      ctx.quadraticCurveTo((f.off + f.wide * 1.1) * bw, -bh * (f.top * 0.6), (f.off + f.wide) * bw, -bh * 0.74);
      ctx.closePath(); ctx.fill();
    });
    // a hot white core in the tallest flame
    ctx.fillStyle = 'rgba(255,255,220,.75)';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.09, -bh * 0.78);
    ctx.quadraticCurveTo(-bw * 0.1, -bh * 1.1, bw * 0.02, -bh * 1.34);
    ctx.quadraticCurveTo(bw * 0.12, -bh * 1.1, bw * 0.09, -bh * 0.78);
    ctx.closePath(); ctx.fill();
  }
}

// ---- eye styles ----

function drawEyes(ctx, L, bw, bh, s, t, blink) {
  const eyeY = -bh * 0.34;

  if (L.brow === 'thick') {
    ctx.strokeStyle = L.hairColor || '#2a1d17';
    ctx.lineWidth = 4.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.5, eyeY - bh * 0.24); ctx.lineTo(-bw * 0.16, eyeY - bh * 0.18);
    ctx.moveTo(bw * 0.5, eyeY - bh * 0.24); ctx.lineTo(bw * 0.16, eyeY - bh * 0.18);
    ctx.stroke();
  }
  if (L.brow === 'angry') {
    ctx.strokeStyle = '#7a3010';
    ctx.lineWidth = 4.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.5, eyeY - bh * 0.26); ctx.lineTo(-bw * 0.14, eyeY - bh * 0.1);
    ctx.moveTo(bw * 0.5, eyeY - bh * 0.26); ctx.lineTo(bw * 0.14, eyeY - bh * 0.1);
    ctx.stroke();
  }

  if (blink && L.eyes !== 'shades') {
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 2.4 * s;
    ctx.beginPath();
    ctx.moveTo(-bw * 0.5, eyeY); ctx.quadraticCurveTo(-bw * 0.3, eyeY + 4, -bw * 0.14, eyeY);
    ctx.moveTo(bw * 0.16, eyeY); ctx.quadraticCurveTo(bw * 0.34, eyeY + 4, bw * 0.5, eyeY);
    ctx.stroke();
    return;
  }

  if (L.eyes === 'shades') {
    ctx.fillStyle = '#15151c';
    FF.rr(ctx, -bw * 0.58, eyeY - bh * 0.14, bw * 1.16, bh * 0.3, bh * 0.1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.moveTo(-bw * 0.46, eyeY + bh * 0.1);
    ctx.lineTo(-bw * 0.2, eyeY - bh * 0.11);
    ctx.lineTo(-bw * 0.08, eyeY - bh * 0.11);
    ctx.lineTo(-bw * 0.34, eyeY + bh * 0.1);
    ctx.closePath(); ctx.fill();
    return;
  }

  if (L.eyes === 'determined' || L.eyes === 'fierce') {
    const squint = L.eyes === 'fierce' ? 0.13 : 0.16;
    ctx.fillStyle = '#fff';
    FF.oval(ctx, -bw * 0.31, eyeY, bw * 0.19, bh * squint); ctx.fill();
    FF.oval(ctx, bw * 0.31, eyeY, bw * 0.19, bh * squint); ctx.fill();
    ctx.fillStyle = '#15151c';
    FF.oval(ctx, -bw * 0.27, eyeY, bw * 0.1, bh * (squint - 0.02)); ctx.fill();
    FF.oval(ctx, bw * 0.35, eyeY, bw * 0.1, bh * (squint - 0.02)); ctx.fill();
    return;
  }

  // 'big' and 'sparkle'
  const r = L.eyes === 'sparkle' ? 0.245 : 0.21;
  ctx.fillStyle = '#fff';
  FF.oval(ctx, -bw * 0.33, eyeY, bw * 0.21, bh * r); ctx.fill();
  FF.oval(ctx, bw * 0.33, eyeY, bw * 0.21, bh * r); ctx.fill();
  ctx.fillStyle = '#1a1a24';
  FF.oval(ctx, -bw * 0.3, eyeY + bh * 0.02, bw * 0.12, bh * (r - 0.07)); ctx.fill();
  FF.oval(ctx, bw * 0.36, eyeY + bh * 0.02, bw * 0.12, bh * (r - 0.07)); ctx.fill();
  ctx.fillStyle = '#fff';
  FF.oval(ctx, -bw * 0.26, eyeY - bh * 0.06, bw * 0.055, bh * 0.055); ctx.fill();
  FF.oval(ctx, bw * 0.4, eyeY - bh * 0.06, bw * 0.055, bh * 0.055); ctx.fill();
  if (L.eyes === 'sparkle') {
    FF.oval(ctx, -bw * 0.35, eyeY + bh * 0.09, bw * 0.035, bh * 0.035); ctx.fill();
    FF.oval(ctx, bw * 0.31, eyeY + bh * 0.09, bw * 0.035, bh * 0.035); ctx.fill();
  }
}

/**
 * Jeff: a tiny, chubby, permanently hungry sumo. He squashes when he lands and
 * stretches when he jumps, which is most of what makes him feel alive.
 */
FF.drawJeff = function (ctx, j, t) {
  const L = (j.look != null ? FF.LOOKS[j.look] : null) || FF.look();
  const s = j.scale;
  const cx = j.x + j.w / 2;
  const cy = j.y + j.h / 2;

  // squash & stretch from vertical speed
  const sq = Math.max(-0.22, Math.min(0.22, -j.vy * 0.017)) + j.squash;
  const bw = j.w * (1 - sq) * 0.55 * (L.wide || 1);
  const bh = j.h * (1 + sq) * 0.56 * (L.tall || 1);

  // shadow on the ground
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#000';
  FF.oval(ctx, cx, j.y + j.h - 2, j.w * 0.42, 5 * s);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(j.face, 1);

  // star-power rainbow glow
  if (j.star > 0) {
    ctx.save();
    const hue = (t * 6) % 360;
    ctx.shadowColor = 'hsl(' + hue + ',100%,60%)';
    ctx.shadowBlur = 26;
    ctx.fillStyle = 'hsla(' + hue + ',100%,65%,.35)';
    FF.oval(ctx, 0, 0, bw * 1.35, bh * 1.35);
    ctx.fill();
    ctx.restore();
  }

  // legs and arms are outlined so they read against his own belly
  ctx.lineWidth = 2.2 * s;
  ctx.strokeStyle = L.line;

  const wob = j.onGround && Math.abs(j.vx) > 0.4 ? Math.sin(t * 0.35) * 3.6 * s : 0;
  ctx.fillStyle = L.skin2;
  FF.oval(ctx, -bw * 0.46, bh * 0.98 + wob, bw * 0.36, bh * 0.26); ctx.fill(); ctx.stroke();
  FF.oval(ctx, bw * 0.46, bh * 0.98 - wob, bw * 0.36, bh * 0.26); ctx.fill(); ctx.stroke();

  const armY = j.slurping ? -bh * 0.12 : bh * 0.14;
  const armSwing = j.onGround && Math.abs(j.vx) > 0.4 ? Math.sin(t * 0.35) * 4 * s : 0;
  ctx.fillStyle = L.skin;
  FF.oval(ctx, -bw * 1.02, armY - armSwing, bw * 0.32, bh * 0.34); ctx.fill(); ctx.stroke();
  FF.oval(ctx, bw * 1.02, armY + armSwing, bw * 0.32, bh * 0.34); ctx.fill(); ctx.stroke();

  // body
  const body = ctx.createLinearGradient(0, -bh, 0, bh);
  body.addColorStop(0, L.skin);
  body.addColorStop(1, L.skin2);
  ctx.fillStyle = body;
  FF.oval(ctx, 0, 0, bw, bh); ctx.fill();
  ctx.lineWidth = 2.5 * s;
  ctx.strokeStyle = L.line;
  ctx.stroke();

  // belly highlight
  ctx.fillStyle = 'rgba(255,255,255,.42)';
  FF.oval(ctx, 0, bh * 0.2, bw * 0.62, bh * 0.5); ctx.fill();

  // mawashi (sumo belt), clipped to the body so it wraps
  ctx.save();
  ctx.beginPath();
  FF.oval(ctx, 0, 0, bw, bh);
  ctx.clip();
  ctx.fillStyle = L.belt;
  ctx.fillRect(-bw, bh * 0.42, bw * 2, bh * 0.34);
  ctx.fillStyle = L.belt2;
  ctx.fillRect(-bw, bh * 0.42, bw * 2, bh * 0.09);
  ctx.restore();

  drawHair(ctx, L, bw, bh, s, t);

  const blink = (Math.floor(t / 140) % 7 === 0) && (t % 140 < 10);
  drawEyes(ctx, L, bw, bh, s, t, blink);

  if (L.blush) {
    ctx.fillStyle = 'rgba(255,120,140,.5)';
    FF.oval(ctx, -bw * 0.62, -bh * 0.14, bw * 0.16, bh * 0.1); ctx.fill();
    FF.oval(ctx, bw * 0.62, -bh * 0.14, bw * 0.16, bh * 0.1); ctx.fill();
  }
  if (L.cheeks) {
    // cheeks packed with food, puffing out either side of his mouth
    ctx.fillStyle = L.skin;
    ctx.strokeStyle = L.line;
    ctx.lineWidth = 2 * s;
    FF.oval(ctx, -bw * 0.42, -bh * 0.08, bw * 0.22, bh * 0.17); ctx.fill(); ctx.stroke();
    FF.oval(ctx, bw * 0.42, -bh * 0.08, bw * 0.22, bh * 0.17); ctx.fill(); ctx.stroke();
  }

  // mouth — wide open when slurping, happy otherwise
  if (j.slurping) {
    ctx.fillStyle = '#7d2130';
    FF.oval(ctx, 0, -bh * 0.06, bw * 0.26 + Math.sin(t * 0.5) * 2, bh * 0.2); ctx.fill();
  } else {
    ctx.strokeStyle = '#7d2130';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.arc(0, -bh * 0.14, bw * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
};

// --------------------------------------------------------------- NINJA ------

/** A Banana Ninja: a banana in a mask, guarding the good snacks. */
FF.drawNinja = function (ctx, n, t) {
  ctx.save();
  ctx.translate(n.x + n.w / 2, n.y + n.h / 2);
  ctx.rotate(n.spin || 0);
  ctx.scale(n.face, 1);

  if (!n.flying) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    FF.oval(ctx, 0, n.h * 0.55, n.w * 0.4, 4); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // alert bubble when he's spotted you
  if (n.alert > 0 && !n.flying) {
    FF.text(ctx, '!', 0, -n.h * 0.85, 22, '#ff4b6b');
  }

  FF.emoji(ctx, '🍌', 0, 0, n.h * 1.15, '#ffe14b');

  // ninja mask band
  ctx.fillStyle = '#22232c';
  FF.rr(ctx, -n.w * 0.46, -n.h * 0.16, n.w * 0.92, n.h * 0.26, 3);
  ctx.fill();
  // headband tails, flapping
  ctx.beginPath();
  ctx.moveTo(-n.w * 0.42, -n.h * 0.1);
  ctx.quadraticCurveTo(-n.w * 0.8, -n.h * 0.02 + Math.sin(t * 0.2) * 3, -n.w * 0.95, n.h * 0.16);
  ctx.lineTo(-n.w * 0.78, n.h * 0.06);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = '#fff';
  FF.oval(ctx, -n.w * 0.17, -n.h * 0.04, n.w * 0.12, n.h * 0.07); ctx.fill();
  FF.oval(ctx, n.w * 0.17, -n.h * 0.04, n.w * 0.12, n.h * 0.07); ctx.fill();
  ctx.fillStyle = '#111';
  FF.oval(ctx, -n.w * 0.15, -n.h * 0.04, n.w * 0.055, n.h * 0.05); ctx.fill();
  FF.oval(ctx, n.w * 0.19, -n.h * 0.04, n.w * 0.055, n.h * 0.05); ctx.fill();

  ctx.restore();
};

// ----------------------------------------------------------- BACKGROUNDS ----

function neonBg(ctx, W, H, camX, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#160c2e');
  sky.addColorStop(0.6, '#2b1350');
  sky.addColorStop(1, '#4a1a4e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // two parallax layers of buildings
  for (let layer = 0; layer < 2; layer++) {
    const par = layer === 0 ? 0.18 : 0.42;
    const base = H - 70 - layer * -30;
    for (let i = -1; i < 22; i++) {
      const seed = i + layer * 100;
      const bw = 90 + FF.hash(seed) * 80;
      const bh = 130 + FF.hash(seed + 7) * 220 - layer * 40;
      const x = ((i * 150 - camX * par) % 3300 + 3300) % 3300 - 200;
      ctx.fillStyle = layer === 0 ? '#1c1136' : '#2a1750';
      ctx.fillRect(x, base - bh, bw, bh);
      // lit windows
      const cols = Math.floor(bw / 18);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < Math.floor(bh / 22); r++) {
          const hv = FF.hash(seed * 31 + c * 7 + r * 13);
          if (hv > 0.55) {
            ctx.fillStyle = hv > 0.93 ? 'rgba(255,220,120,.85)' : 'rgba(140,200,255,' + (0.25 + hv * 0.4) + ')';
            ctx.fillRect(x + 6 + c * 18, base - bh + 10 + r * 22, 8, 11);
          }
        }
      }
      // neon signs
      if (FF.hash(seed + 3) > 0.55) {
        const hue = (FF.hash(seed + 11) * 360) | 0;
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.05 + i);
        ctx.save();
        ctx.shadowColor = 'hsl(' + hue + ',100%,60%)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = 'hsla(' + hue + ',100%,68%,' + pulse + ')';
        FF.rr(ctx, x + bw * 0.2, base - bh + 26, bw * 0.6, 16, 4);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // the giant screens on the sides of the buildings
  for (let i = 0; i < 3; i++) {
    const sx = ((i * 900 - camX * 0.42) % 2700 + 2700) % 2700 - 400;
    ctx.save();
    ctx.fillStyle = '#0b0b18';
    FF.rr(ctx, sx, 168, 220, 130, 8); ctx.fill();
    const hue2 = (t * 2 + i * 90) % 360;
    ctx.fillStyle = 'hsla(' + hue2 + ',85%,55%,.9)';
    FF.rr(ctx, sx + 8, 176, 204, 114, 5); ctx.fill();
    FF.emoji(ctx, ['🍜', '🥤', '🌭'][i], sx + 110, 233, 62);
    ctx.restore();
  }
}

function ramenBg(ctx, W, H, camX, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#3a1620');
  sky.addColorStop(1, '#8a3b23');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // shop fronts
  for (let i = -1; i < 16; i++) {
    const x = ((i * 230 - camX * 0.5) % 3680 + 3680) % 3680 - 260;
    ctx.fillStyle = '#5c2318';
    ctx.fillRect(x, 150, 210, 320);
    ctx.fillStyle = '#7c3320';
    ctx.fillRect(x + 10, 250, 190, 220);
    // noren curtain
    ctx.fillStyle = '#e0452f';
    ctx.fillRect(x + 10, 250, 190, 46);
    ctx.fillStyle = '#fff';
    FF.emoji(ctx, '麺', x + 115, 273, 30);
    // paper lanterns
    for (let k = 0; k < 2; k++) {
      const lx = x + 45 + k * 120;
      const sway = Math.sin(t * 0.03 + i + k) * 4;
      ctx.strokeStyle = '#3a1a12'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, 150); ctx.lineTo(lx + sway, 186); ctx.stroke();
      ctx.save();
      ctx.shadowColor = '#ff9b3d'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#ff6b35';
      FF.oval(ctx, lx + sway, 206, 17, 22); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(lx + sway - 17, 203, 34, 3);
    }
  }
}

function subwayBg(ctx, W, H, camX, t) {
  ctx.fillStyle = '#161a24';
  ctx.fillRect(0, 0, W, H);

  // tiled wall
  for (let i = -1; i < 40; i++) {
    for (let r = 0; r < 9; r++) {
      const x = ((i * 56 - camX * 0.45) % 2240 + 2240) % 2240 - 60;
      ctx.fillStyle = (i + r) % 2 ? '#252c3c' : '#2b3346';
      ctx.fillRect(x, 40 + r * 42, 54, 40);
    }
  }
  // tunnel mouth
  const tx = ((520 - camX * 0.45) % 1800 + 1800) % 1800 - 300;
  ctx.fillStyle = '#0a0d14';
  ctx.beginPath();
  ctx.moveTo(tx, 430); ctx.lineTo(tx, 220);
  ctx.quadraticCurveTo(tx + 90, 150, tx + 180, 220);
  ctx.lineTo(tx + 180, 430);
  ctx.closePath(); ctx.fill();

  // vending machines + signage
  for (let i = -1; i < 14; i++) {
    const x = ((i * 300 - camX * 0.62) % 4200 + 4200) % 4200 - 320;
    ctx.fillStyle = '#d63b52';
    FF.rr(ctx, x, 300, 74, 132, 6); ctx.fill();
    ctx.fillStyle = '#12203a';
    FF.rr(ctx, x + 8, 312, 58, 74, 4); ctx.fill();
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = ['#ffd23f', '#4cc9f0', '#90e07a'][k % 3];
      ctx.fillRect(x + 13 + (k % 3) * 18, 320 + Math.floor(k / 3) * 32, 12, 24);
    }
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 0.08 + i)) + ')';
    ctx.fillRect(x + 8, 396, 58, 6);
  }
}

function templeBg(ctx, W, H, camX, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#ffd6e8');
  sky.addColorStop(0.55, '#ffb3d1');
  sky.addColorStop(1, '#f8e3c8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // distant pagoda
  const px = 700 - camX * 0.15;
  ctx.fillStyle = 'rgba(150,60,80,.35)';
  for (let f = 0; f < 4; f++) {
    const wdt = 150 - f * 26;
    const y = 300 - f * 52;
    ctx.beginPath();
    ctx.moveTo(px - wdt, y); ctx.lineTo(px + wdt, y);
    ctx.lineTo(px + wdt * 0.6, y - 22); ctx.lineTo(px - wdt * 0.6, y - 22);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(px - wdt * 0.45, y - 52, wdt * 0.9, 32);
  }

  // torii gates
  for (let i = -1; i < 12; i++) {
    const x = ((i * 340 - camX * 0.4) % 4080 + 4080) % 4080 - 380;
    ctx.fillStyle = '#e0453f';
    ctx.fillRect(x, 250, 16, 220);
    ctx.fillRect(x + 150, 250, 16, 220);
    ctx.fillRect(x - 18, 244, 202, 15);
    ctx.fillRect(x - 8, 274, 182, 11);
  }

  // cherry trees
  for (let i = -1; i < 14; i++) {
    const x = ((i * 280 - camX * 0.66) % 3920 + 3920) % 3920 - 300;
    ctx.fillStyle = '#6b4a3a';
    ctx.fillRect(x + 40, 330, 16, 140);
    ctx.fillStyle = 'rgba(255,170,205,.95)';
    for (let b = 0; b < 6; b++) {
      const bx = x + 48 + Math.cos(b * 1.05) * 52;
      const by = 320 + Math.sin(b * 1.05) * 34;
      FF.oval(ctx, bx, by, 40, 30); ctx.fill();
    }
  }
}

FF.drawBackground = function (ctx, theme, W, H, camX, t) {
  if (theme === 'neon') neonBg(ctx, W, H, camX, t);
  else if (theme === 'ramen') ramenBg(ctx, W, H, camX, t);
  else if (theme === 'subway') subwayBg(ctx, W, H, camX, t);
  else templeBg(ctx, W, H, camX, t);
};

/** Platforms and ground, styled per level. */
FF.drawPlatform = function (ctx, p, theme, isGround) {
  // Platform colours are picked to stand out from their own background — in
  // Ramen Alley especially, brown-on-brown was impossible to read.
  const top = {
    neon: '#5a6076', ramen: '#e0ad69', subway: '#5b6480', temple: '#b8c7a6',
  }[theme];
  const side = {
    neon: '#2b3048', ramen: '#8a5f35', subway: '#343d55', temple: '#7e8d70',
  }[theme];

  ctx.fillStyle = side;
  FF.rr(ctx, p.x, p.y, p.w, p.h, isGround ? 0 : 6);
  ctx.fill();
  if (!isGround) {
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = top;
  FF.rr(ctx, p.x, p.y, p.w, Math.min(12, p.h), isGround ? 0 : 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.fillRect(p.x, p.y, p.w, 3);

  if (isGround && theme === 'neon') {
    // Shibuya crosswalk stripes
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let x = p.x; x < p.x + p.w; x += 74) ctx.fillRect(x, p.y + 16, 40, 8);
  }
  if (isGround && theme === 'subway') {
    // yellow safety line
    ctx.fillStyle = '#f0c419';
    ctx.fillRect(p.x, p.y + 15, p.w, 5);
  }
  if (isGround && theme === 'temple') {
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 2;
    for (let x = p.x; x < p.x + p.w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, p.y); ctx.lineTo(x, p.y + p.h); ctx.stroke();
    }
  }
};
