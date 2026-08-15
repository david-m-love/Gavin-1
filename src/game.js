// FOOD FUN — main game loop
// States: title -> play -> levelclear -> (boss) -> victory / gameover

var FF = window.FF || (window.FF = {});

(function () {
  const W = 960, H = 540;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let dpr = 1;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const pad = document.body.classList.contains('touch') ? 8 : 24;
    const s = Math.min((innerWidth - pad) / W, (innerHeight - pad) / H);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------- game state
  const G = {
    state: 'title',
    t: 0,
    levelIndex: 0,
    lives: 3,
    chopsticks: 0,
    level: null,
    jeff: null,
    shield: null,
    ninjas: [],
    pick: null,
    key: null,
    boss: null,
    camX: 0,
    hunger: 0,
    hungerTarget: 100,
    magnet: 0,
    slowmo: 0,
    shake: 0,
    intro: 0,
    banner: null,
    bannerT: 0,
    parts: [],
    texts: [],
    walkers: [],
    petals: [],
    steam: [],
    train: null,
    crumble: null,
    flash: 0,
  };
  FF.G = G;

  // ------------------------------------------------------------- effects
  function popText(str, x, y, color) {
    G.texts.push({ s: str, x: x, y: y, c: color || '#fff', life: 58, vy: -1.1 });
  }
  G.popText = popText;

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 12); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3.5;
      G.parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
        life: 26 + Math.random() * 22, c: color, r: 2 + Math.random() * 3,
      });
    }
  }

  // ------------------------------------------------------------- level setup
  function loadLevel(i) {
    const spec = FF.LEVELS[i];
    const lvl = Object.assign({}, spec);
    lvl.solids = [{ x: 0, y: spec.groundY, w: spec.width, h: 70 }].concat(spec.platforms);
    G.level = lvl;
    G.levelIndex = i;

    G.jeff.reset(lvl);
    G.shield.reset();
    G.pick = FF.buildPickups(spec);
    G.ninjas = (spec.ninjas || []).map((n) => new FF.Ninja(n));
    G.hunger = 0;
    G.hungerTarget = FF.hungerTarget(G.pick.food);
    G.key = null;
    G.boss = null;
    G.magnet = 0;
    G.slowmo = 0;
    G.camX = 0;
    G.parts.length = 0;
    G.texts.length = 0;
    G.intro = 150;

    // pedestrians
    G.walkers = [];
    for (let k = 0; k < (spec.walkers || 0); k++) {
      G.walkers.push({
        x: 200 + Math.random() * (spec.width - 400),
        dir: Math.random() < 0.5 ? -1 : 1,
        sp: 0.6 + Math.random() * 0.9,
        hue: Math.floor(Math.random() * 360),
        h: 46 + Math.random() * 16,
      });
    }
    // cherry blossom petals
    G.petals = [];
    if (spec.petals) {
      for (let k = 0; k < 40; k++) {
        G.petals.push({ x: Math.random() * W, y: Math.random() * H, sp: 0.5 + Math.random(), sw: Math.random() * 6, ph: Math.random() * 6 });
      }
    }
    // ramen steam
    G.steam = [];
    if (spec.steam) {
      for (let k = 0; k < 26; k++) {
        G.steam.push({ x: Math.random() * spec.width, y: spec.groundY - Math.random() * 200, r: 12 + Math.random() * 26, sp: 0.3 + Math.random() * 0.5 });
      }
    }
    // bullet train
    G.train = spec.train ? { timer: spec.train.every, active: false, x: 0, warn: 0 } : null;

    FF.audio.startMusic(spec.music || 1);
  }

  function startRun() {
    G.lives = 3;
    G.chopsticks = 0;
    G.jeff = new FF.Jeff(FF.LEVELS[0]);
    G.shield = new FF.Shield();
    loadLevel(0);
    G.state = 'play';
  }

  // ------------------------------------------------------------- damage
  function hurtJeff(fromX, reason) {
    if (!G.jeff.hurtable()) return;
    if (G.shield.block(G.jeff)) {
      popText('BLOCKED!', G.jeff.cx, G.jeff.y - 26, '#7fe4ff');
      G.jeff.invuln = 40;
      G.shake = Math.max(G.shake, 7);
      return;
    }
    G.jeff.takeHit(fromX);
    G.lives--;
    G.shake = Math.max(G.shake, 14);
    G.flash = 10;
    popText(reason || '-1 LIFE', G.jeff.cx, G.jeff.y - 30, '#ff5f7e');
    if (G.lives <= 0) startGameOver();
  }

  // ------------------------------------------------------------- game over
  function startGameOver() {
    FF.audio.stopMusic();
    FF.audio.play('rumble');
    // Gavin's game over: Jeff's belly rumbles so loud the screen cracks apart.
    const snap = document.createElement('canvas');
    snap.width = W; snap.height = H;
    snap.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, W, H);

    const cols = 8, rows = 5, cw = W / cols, ch = H / rows;
    const chunks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        chunks.push({
          sx: c * cw, sy: r * ch, w: cw, h: ch,
          x: c * cw, y: r * ch, vx: (c - cols / 2) * 0.5 + (Math.random() - 0.5),
          vy: -2 - Math.random() * 3, rot: 0, vr: (Math.random() - 0.5) * 0.09,
          delay: 24 + r * 5 + Math.random() * 22,
        });
      }
    }
    G.crumble = { snap: snap, chunks: chunks, t: 0, cracks: makeCracks() };
    G.shake = 44;
    G.state = 'gameover';
  }

  function makeCracks() {
    const out = [];
    for (let i = 0; i < 9; i++) {
      const pts = [{ x: W / 2, y: H / 2 }];
      let a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
      let x = W / 2, y = H / 2;
      for (let k = 0; k < 7; k++) {
        a += (Math.random() - 0.5) * 0.7;
        x += Math.cos(a) * (40 + Math.random() * 55);
        y += Math.sin(a) * (40 + Math.random() * 55);
        pts.push({ x: x, y: y });
      }
      out.push(pts);
    }
    return out;
  }

  // ------------------------------------------------------------- update
  function update() {
    G.t++;
    FF.audio.tick();
    if (G.shake > 0) G.shake *= 0.9;
    if (G.flash > 0) G.flash--;

    if (G.state === 'title') {
      if (FF.input.anyTapped()) { FF.audio.unlock(); startRun(); }
      return;
    }
    if (G.state === 'gameover') {
      G.crumble.t++;
      for (const c of G.crumble.chunks) {
        if (G.crumble.t < c.delay) continue;
        c.x += c.vx; c.y += c.vy; c.vy += 0.42; c.rot += c.vr;
      }
      if (G.crumble.t > 110 && FF.input.anyTapped()) { G.state = 'title'; }
      return;
    }
    if (G.state === 'victory') {
      if (FF.input.anyTapped() && G.bannerT > 90) G.state = 'title';
      G.bannerT++;
      return;
    }
    if (G.state === 'levelclear') {
      G.bannerT++;
      for (let i = 0; i < 2; i++) {
        burst(Math.random() * W + G.camX, 120 + Math.random() * 160, 'hsl(' + Math.floor(Math.random() * 360) + ',90%,65%)', 1);
      }
      updateParticles(1);
      if (G.bannerT > 110) {
        const next = G.levelIndex + 1;
        if (next >= FF.LEVELS.length) { G.state = 'victory'; G.bannerT = 0; }
        else { G.jeff.grow(); loadLevel(next); G.state = 'play'; }
      }
      return;
    }

    // ---------------- playing ----------------
    const lvl = G.level;
    const j = G.jeff;
    if (G.intro > 0) G.intro--;
    if (G.slowmo > 0) G.slowmo--;
    if (G.magnet > 0) G.magnet--;
    const ts = G.slowmo > 0 ? 0.38 : 1; // Slow-Mo Slushie affects everything but Jeff

    j.update(lvl, FF.input);
    G.shield.update();

    // slurp / magnet pull
    const all = G.pick.food.concat(G.pick.items);
    j.slurpPull(all);
    if (G.magnet > 0) {
      for (const f of G.pick.food) {
        if (f.dead) continue;
        const dx = j.cx - f.x, dy = j.cy - f.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 900) { f.x += (dx / d) * 9; f.y += (dy / d) * 9; }
      }
    }

    // ---- collect food ----
    for (const f of G.pick.food) {
      if (f.dead) continue;
      if (Math.hypot(j.cx - f.x, j.cy - f.y) < f.r + j.w * 0.45) {
        f.dead = true;
        const v = FF.FOOD[f.t].v;
        G.hunger = Math.min(G.hungerTarget, G.hunger + v);
        FF.audio.play('eat');
        burst(f.x, f.y, '#ffd166', 7);
        popText('+' + v, f.x, f.y - 14, '#ffe38a');
        if (f.t === 'bento') popText('YUM!', f.x, f.y - 38, '#ff9ecb');
        if (G.hunger >= G.hungerTarget && !G.key) spawnKey();
      }
    }

    // ---- bananas (Gavin's rule: a banana costs a life) ----
    for (const b of G.pick.bananas) {
      if (b.dead) continue;
      if (Math.hypot(j.cx - b.x, j.cy - b.y) < b.r + j.w * 0.42) {
        if (j.star > 0) { b.dead = true; burst(b.x, b.y, '#ffe14b', 10); continue; }
        if (!j.hurtable()) continue;
        b.dead = true;
        burst(b.x, b.y, '#ffe14b', 14);
        hurtJeff(b.x, 'BANANA! -1');
      }
    }

    // ---- special items ----
    for (const it of G.pick.items) {
      if (it.dead) continue;
      if (Math.hypot(j.cx - it.x, j.cy - it.y) > it.r + j.w * 0.45) continue;
      it.dead = true;
      burst(it.x, it.y, '#fff', 16);
      if (it.t === 'bigmac') {
        j.star = 380; G.magnet = 150;
        FF.audio.play('star');
        popText('BIG MAC! SLURP EVERYTHING!', it.x, it.y - 34, '#ffb703');
      } else if (it.t === 'riceball') {
        G.lives++;
        FF.audio.play('big');
        popText('+1 LIFE', it.x, it.y - 30, '#9dffb0');
      } else if (it.t === 'slowmo') {
        G.slowmo = 330;
        FF.audio.play('big');
        popText('BRAIN FREEZE! SLOW-MO', it.x, it.y - 34, '#7fe4ff');
      } else if (it.t === 'chopsticks') {
        G.chopsticks++;
        FF.audio.play('key');
        popText('GOLDEN CHOPSTICKS!', it.x, it.y - 34, '#ffd60a');
      }
    }

    // ---- ninjas ----
    for (const n of G.ninjas) {
      n.update(j, ts, lvl.groundY);
      if (n.dead || n.flying) continue;
      if (!n.hits(j)) continue;
      if (j.star > 0 || j.bump > 0) {
        n.knockFlying(Math.sign(j.vx) || j.face);
        burst(n.cx, n.cy, '#ffe14b', 14);
        popText(j.star > 0 ? 'SMASH!' : 'BELLY BUMP!', n.cx, n.cy - 30, '#ffd166');
        G.shake = Math.max(G.shake, 9);
      } else {
        hurtJeff(n.cx, 'OW! -1');
      }
    }
    G.ninjas = G.ninjas.filter((n) => !n.dead);

    // ---- bullet train ----
    if (G.train) updateTrain(ts, lvl, j);

    // ---- pedestrians ----
    for (const wk of G.walkers) {
      wk.x += wk.dir * wk.sp * ts;
      if (wk.x < 60) wk.dir = 1;
      if (wk.x > lvl.width - 60) wk.dir = -1;
      // they just bump you, they're not dangerous
      if (Math.abs(wk.x - j.cx) < 22 && Math.abs(lvl.groundY - (j.y + j.h)) < 6) {
        j.x += wk.dir * 1.1;
      }
    }

    // ---- key ----
    if (G.key && Math.hypot(j.cx - G.key.x, j.cy - G.key.y) < 34 + j.w * 0.4) {
      G.key = null;
      FF.audio.play('key');
      burst(j.cx, j.cy, '#ffd60a', 26);
      if (lvl.boss) {
        spawnBoss(lvl);
      } else {
        G.state = 'levelclear';
        G.bannerT = 0;
        FF.audio.play('win');
      }
    }

    // ---- boss ----
    if (G.boss) {
      G.boss.update(j, ts, G);
      if (G.boss.dead) {
        burst(G.boss.x, G.boss.y, '#ff5fa2', 40);
        FF.audio.play('win');
        FF.audio.stopMusic();
        G.boss = null;
        G.state = 'victory';
        G.bannerT = 0;
      } else {
        if (G.boss.seedHits(j)) hurtJeff(G.boss.x, 'SEED! -1');
        if (G.boss.touching(j)) {
          if (G.boss.chomps > 0) {
            G.boss.bite(G);
            j.vx = Math.sign(j.cx - G.boss.x) * 7;
            j.vy = -7;
            j.invuln = 40;
            G.shake = 16;
            burst(G.boss.x, G.boss.y, '#ff9ecb', 22);
          } else if (j.star > 0) {
            // star power still can't eat him — you need a strawberry
            j.vx = Math.sign(j.cx - G.boss.x) * 6;
          } else {
            hurtJeff(G.boss.x, 'TOO SPIKY! -1');
          }
        }
      }
    }

    updateParticles(ts);

    // camera
    const targetCam = Math.max(0, Math.min(lvl.width - W, j.cx - W * 0.42));
    G.camX += (targetCam - G.camX) * 0.12;
  }

  function spawnKey() {
    const k = G.level.keySpot;
    G.key = { x: k.x, y: k.y };
    FF.audio.play('key');
    popText('FULL! GRAB THE KEY →', G.jeff.cx, G.jeff.y - 40, '#ffd60a');
    G.shake = 8;
  }

  function spawnBoss(lvl) {
    G.boss = new FF.Boss(lvl.boss, lvl.arenaStart, lvl.width - 40, lvl.groundY);
    FF.audio.startMusic(2);
    popText('THE DRAGON FRUIT BOSS!', G.jeff.cx, G.jeff.y - 50, '#ff5fa2');
    G.shake = 20;
  }

  function updateTrain(ts, lvl, j) {
    const cfg = lvl.train;
    const tr = G.train;
    if (tr.active) {
      tr.x -= cfg.speed * ts;
      const ty = lvl.groundY - 58;
      if (j.x + j.w > tr.x && j.x < tr.x + 620 && j.y + j.h > ty) {
        hurtJeff(tr.x + 300, 'TRAIN! -1');
      }
      if (tr.x < -700) { tr.active = false; tr.timer = cfg.every; }
    } else {
      tr.timer -= ts;
      tr.warn = tr.timer < cfg.warn ? tr.warn + 1 : 0;
      if (tr.timer <= 0) {
        tr.active = true;
        tr.x = G.camX + W + 120;
        FF.audio.play('train');
        G.shake = Math.max(G.shake, 10);
      }
    }
  }

  function updateParticles(ts) {
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i];
      p.x += p.vx * ts; p.y += p.vy * ts; p.vy += 0.18 * ts; p.life -= ts;
      if (p.life <= 0) G.parts.splice(i, 1);
    }
    for (let i = G.texts.length - 1; i >= 0; i--) {
      const x = G.texts[i];
      x.y += x.vy; x.life--;
      if (x.life <= 0) G.texts.splice(i, 1);
    }
  }

  // ------------------------------------------------------------- rendering
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (G.state === 'title') { drawTitle(); return; }
    if (G.state === 'gameover') { drawGameOver(); return; }

    const shakeX = (Math.random() - 0.5) * G.shake;
    const shakeY = (Math.random() - 0.5) * G.shake;
    const lvl = G.level;

    FF.drawBackground(ctx, lvl.theme, W, H, G.camX, G.t);

    ctx.save();
    ctx.translate(-G.camX + shakeX, shakeY);

    for (const p of lvl.solids) FF.drawPlatform(ctx, p, lvl.theme, p.y === lvl.groundY);

    // pedestrians (behind everything else)
    for (const wk of G.walkers) drawWalker(wk, lvl);

    for (const f of G.pick.food) FF.drawPickup(ctx, f, G.t);
    for (const b of G.pick.bananas) FF.drawPickup(ctx, b, G.t);
    for (const it of G.pick.items) FF.drawPickup(ctx, it, G.t);
    if (G.key) FF.drawKey(ctx, G.key, G.t);

    for (const n of G.ninjas) n.draw(ctx, G.t);
    if (G.boss) G.boss.draw(ctx, G.t);

    if (G.train && G.train.active) drawTrain(lvl);

    G.jeff.drawSlurp(ctx, G.t);
    G.jeff.draw(ctx, G.t);
    G.shield.draw(ctx, G.jeff);

    for (const p of G.parts) {
      ctx.globalAlpha = Math.min(1, p.life / 22);
      ctx.fillStyle = p.c;
      FF.oval(ctx, p.x, p.y, p.r, p.r); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const x of G.texts) {
      ctx.globalAlpha = Math.min(1, x.life / 24);
      FF.text(ctx, x.s, x.x, x.y, 19, x.c);
    }
    ctx.globalAlpha = 1;

    if (lvl.steam) drawSteam(lvl);
    ctx.restore();

    if (lvl.petals) drawPetals();
    if (G.slowmo > 0) {
      ctx.fillStyle = 'rgba(120,220,255,.12)';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.jeff.star > 0) {
      ctx.fillStyle = 'hsla(' + (G.t * 8) % 360 + ',100%,60%,.09)';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255,60,90,' + (G.flash / 26) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.train && G.train.warn > 0 && !G.train.active) {
      const a = 0.18 + 0.18 * Math.sin(G.t * 0.4);
      ctx.fillStyle = 'rgba(255,60,60,' + a + ')';
      ctx.fillRect(0, 0, W, H);
      FF.text(ctx, '⚠ TRAIN COMING — GET UP HIGH!', W / 2, 64, 30, '#fff');
    }

    drawHUD();
    if (G.intro > 0) drawIntro();
    if (G.state === 'levelclear') drawLevelClear();
    if (G.state === 'victory') drawVictory();
  }

  function drawWalker(wk, lvl) {
    const y = lvl.groundY;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'hsl(' + wk.hue + ',45%,32%)';
    FF.rr(ctx, wk.x - 8, y - wk.h, 16, wk.h - 10, 6);
    ctx.fill();
    ctx.fillStyle = 'hsl(' + wk.hue + ',30%,72%)';
    FF.oval(ctx, wk.x, y - wk.h - 6, 8, 8); ctx.fill();
    ctx.fillStyle = 'hsl(' + wk.hue + ',45%,22%)';
    const step = Math.sin(G.t * 0.16 * wk.sp) * 5;
    ctx.fillRect(wk.x - 7, y - 12, 5, 12 + step);
    ctx.fillRect(wk.x + 2, y - 12, 5, 12 - step);
    ctx.restore();
  }

  function drawTrain(lvl) {
    const tr = G.train;
    const y = lvl.groundY - 58;
    ctx.save();
    ctx.fillStyle = '#e9edf5';
    FF.rr(ctx, tr.x, y, 620, 58, 16); ctx.fill();
    ctx.fillStyle = '#1b6ce0';
    ctx.fillRect(tr.x, y + 34, 620, 12);
    ctx.fillStyle = '#0f2a52';
    for (let k = 0; k < 8; k++) FF.rr(ctx, tr.x + 40 + k * 70, y + 12, 44, 20, 4), ctx.fill();
    // nose
    ctx.fillStyle = '#e9edf5';
    ctx.beginPath();
    ctx.moveTo(tr.x, y + 6); ctx.quadraticCurveTo(tr.x - 70, y + 20, tr.x - 60, y + 58);
    ctx.lineTo(tr.x, y + 58); ctx.closePath(); ctx.fill();
    // speed lines
    ctx.strokeStyle = 'rgba(255,255,255,.6)';
    ctx.lineWidth = 3;
    for (let k = 0; k < 6; k++) {
      const ly = y + 8 + k * 9;
      ctx.beginPath(); ctx.moveTo(tr.x + 620, ly); ctx.lineTo(tr.x + 700 + k * 20, ly); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSteam(lvl) {
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#fff';
    for (const s of G.steam) {
      s.y -= s.sp;
      if (s.y < 120) { s.y = lvl.groundY - 10; s.x = G.camX + Math.random() * W; }
      FF.oval(ctx, s.x, s.y, s.r, s.r * 0.75); ctx.fill();
    }
    ctx.restore();
  }

  function drawPetals() {
    ctx.save();
    ctx.fillStyle = '#ffb7d5';
    for (const p of G.petals) {
      p.y += p.sp;
      p.x += Math.sin((G.t + p.ph * 40) * 0.02) * 0.8;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      ctx.globalAlpha = 0.75;
      FF.oval(ctx, p.x, p.y, 5, 3.2); ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------- HUD
  function drawHUD() {
    // lives
    for (let i = 0; i < Math.min(G.lives, 8); i++) FF.emoji(ctx, '❤️', 30 + i * 30, 32, 26, '#ff4b6b');
    if (G.lives > 8) FF.text(ctx, 'x' + G.lives, 30 + 8 * 30, 32, 18, '#fff');

    // hunger meter
    const bx = 26, by = 56, bw = 250, bh = 22;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    FF.rr(ctx, bx, by, bw, bh, 11); ctx.fill();
    const p = G.hunger / G.hungerTarget;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, '#ff9f1c');
    g.addColorStop(1, '#ffd166');
    ctx.fillStyle = g;
    FF.rr(ctx, bx + 3, by + 3, Math.max(0, (bw - 6) * p), bh - 6, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2;
    FF.rr(ctx, bx, by, bw, bh, 11); ctx.stroke();
    FF.emoji(ctx, p >= 1 ? '😋' : '🍜', bx + bw + 20, by + bh / 2, 24, '#ffd166');
    FF.text(ctx, p >= 1 ? 'FULL!' : 'HUNGRY', bx + bw / 2, by + bh / 2, 14, '#fff');

    // shield charge
    const sx = 26, sy = 88;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    FF.rr(ctx, sx, sy, 150, 12, 6); ctx.fill();
    const c = G.shield.charge();
    ctx.fillStyle = G.shield.active ? '#7fe4ff' : 'hsl(' + (c * 120) + ',90%,62%)';
    FF.rr(ctx, sx + 2, sy + 2, (150 - 4) * c, 8, 4); ctx.fill();
    FF.text(ctx, G.shield.active ? 'SHIELD READY' : 'SHIELD…', sx + 75, sy + 6, 10, '#fff');

    // right side
    FF.text(ctx, G.level.name, W - 24, 30, 20, '#fff', 'right');
    FF.text(ctx, 'LEVEL ' + (G.levelIndex + 1) + ' / ' + FF.LEVELS.length, W - 24, 52, 14, 'rgba(255,255,255,.8)', 'right');
    FF.emoji(ctx, '🥢', W - 40, 78, 22, '#ffd60a');
    FF.text(ctx, '× ' + G.chopsticks, W - 62, 78, 16, '#ffd60a', 'right');

    if (G.jeff.star > 0) {
      FF.text(ctx, '🍔 BIG MAC MODE! ' + Math.ceil(G.jeff.star / 60), W / 2, 26, 22, '#ffd166');
    }
    if (G.slowmo > 0) {
      FF.text(ctx, '🍧 BRAIN FREEZE ' + Math.ceil(G.slowmo / 60), W / 2, 52, 18, '#7fe4ff');
    }

    // an arrow at the screen edge so you can always find the key
    if (G.key) {
      const kx = G.key.x - G.camX;
      if (kx < 40 || kx > W - 40) {
        const right = kx > W - 40;
        const ax = right ? W - 44 : 44;
        const ay = Math.max(120, Math.min(H - 90, G.key.y));
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(G.t * 0.12);
        FF.emoji(ctx, '🔑', ax, ay, 34, '#ffd60a');
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        const tip = right ? ax + 26 : ax - 26;
        ctx.moveTo(tip, ay);
        ctx.lineTo(right ? ax + 6 : ax - 6, ay - 13);
        ctx.lineTo(right ? ax + 6 : ax - 6, ay + 13);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }

    // boss health
    if (G.boss) {
      const w2 = 300;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      FF.rr(ctx, W / 2 - w2 / 2, H - 46, w2, 22, 11); ctx.fill();
      ctx.fillStyle = '#ff2d7a';
      FF.rr(ctx, W / 2 - w2 / 2 + 3, H - 43, (w2 - 6) * (G.boss.hp() / G.boss.maxHp()), 16, 8); ctx.fill();
      FF.text(ctx, 'DRAGON FRUIT BOSS', W / 2, H - 35, 14, '#fff');
      FF.text(ctx,
        G.boss.chomps > 0 ? 'CHOMP HIM NOW!' : 'FIND A 🍓 STRAWBERRY TO BITE HIM!',
        W / 2, H - 82, 18, G.boss.chomps > 0 ? '#9dffb0' : '#ffd166');
    }
  }

  function drawIntro() {
    const a = Math.min(1, G.intro / 40);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    FF.rr(ctx, W / 2 - 300, H / 2 - 70, 600, 120, 18); ctx.fill();
    FF.text(ctx, G.level.name, W / 2, H / 2 - 26, 42, '#ffd166');
    FF.text(ctx, G.level.subtitle, W / 2, H / 2 + 16, 18, '#fff');
    ctx.globalAlpha = 1;
  }

  function drawLevelClear() {
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, 0, W, H);
    FF.text(ctx, '🔑 KEY GET!', W / 2, H / 2 - 40, 56, '#ffd60a');
    FF.text(ctx, 'Jeff is full — and a little bit bigger!', W / 2, H / 2 + 20, 22, '#fff');
    FF.emoji(ctx, '🍜🥤🌭', W / 2, H / 2 + 70, 40, '#ffd166');
  }

  function drawVictory() {
    ctx.fillStyle = 'rgba(10,4,20,.82)';
    ctx.fillRect(0, 0, W, H);
    const t = G.bannerT;
    FF.text(ctx, 'YOU ATE THE DRAGON FRUIT BOSS!', W / 2, 130, 40, '#ff9ecb');
    FF.emoji(ctx, '🐉', W / 2 - 120, 210, 70, '#ff5fa2');
    FF.emoji(ctx, '😋', W / 2, 210, 80, '#ffd166');
    FF.emoji(ctx, '🍓', W / 2 + 120, 210, 70, '#ff4b6b');
    FF.text(ctx, 'Jeff is not hungry anymore.', W / 2, 290, 24, '#fff');
    FF.text(ctx, 'Golden Chopsticks found: ' + G.chopsticks + ' / ' + FF.LEVELS.length, W / 2, 330, 22, '#ffd60a');
    FF.text(ctx, 'Lives left: ' + G.lives, W / 2, 362, 20, '#9dffb0');
    if (t > 90 && Math.floor(t / 30) % 2 === 0) {
      FF.text(ctx, 'PRESS ANY KEY OR TAP TO PLAY AGAIN', W / 2, 440, 20, '#fff');
    }
    for (let i = 0; i < 2; i++) {
      G.parts.push({
        x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2,
        life: 120, c: 'hsl(' + Math.floor(Math.random() * 360) + ',95%,65%)', r: 3,
      });
    }
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.fillStyle = p.c;
      FF.oval(ctx, p.x, p.y, p.r, p.r); ctx.fill();
      if (p.life <= 0 || p.y > H) G.parts.splice(i, 1);
    }
  }

  function drawGameOver() {
    const cr = G.crumble;
    ctx.fillStyle = '#0a0710';
    ctx.fillRect(0, 0, W, H);
    const sx = (Math.random() - 0.5) * G.shake;
    const sy = (Math.random() - 0.5) * G.shake;
    ctx.save();
    ctx.translate(sx, sy);
    for (const c of cr.chunks) {
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
      ctx.rotate(c.rot);
      ctx.drawImage(cr.snap, c.sx, c.sy, c.w, c.h, -c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
    // cracks spider out from the middle while it falls apart
    if (cr.t < 60) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 3;
      const grow = Math.min(1, cr.t / 26);
      for (const pts of cr.cracks) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        const n = Math.max(1, Math.floor(pts.length * grow));
        for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (cr.t > 40) {
      FF.text(ctx, 'GAME OVER', W / 2, H / 2 - 40, 66, '#ff5f7e');
      FF.text(ctx, 'TOO HUNGRY!', W / 2, H / 2 + 24, 34, '#ffd166');
      FF.emoji(ctx, '😵', W / 2, H / 2 + 96, 56, '#ffd166');
    }
    if (cr.t > 110 && Math.floor(cr.t / 30) % 2 === 0) {
      FF.text(ctx, 'PRESS ANY KEY OR TAP', W / 2, H - 60, 20, '#fff');
    }
  }

  // ------------------------------------------------------------- title
  const titleJeff = { x: 0, y: 0, w: 110, h: 115, scale: 2.6, face: 1, vx: 0, vy: 0, onGround: true, squash: 0, slurping: false, star: 0 };

  function drawTitle() {
    FF.drawBackground(ctx, 'neon', W, H, G.t * 0.35, G.t);
    ctx.fillStyle = 'rgba(6,4,16,.45)';
    ctx.fillRect(0, 0, W, H);

    // bobbing logo
    const bob = Math.sin(G.t * 0.05) * 8;
    ctx.save();
    ctx.translate(W / 2, 118 + bob);
    ctx.rotate(Math.sin(G.t * 0.03) * 0.02);
    FF.text(ctx, 'FOOD FUN', 0, 0, 86, '#ffd166');
    ctx.restore();
    FF.text(ctx, 'starring JEFF the sumo 🍜', W / 2, 178, 24, '#ff9ecb');

    // Jeff waving on the title screen
    titleJeff.x = W / 2 - titleJeff.w / 2;
    titleJeff.y = 232 + Math.sin(G.t * 0.06) * 6;
    titleJeff.vy = Math.sin(G.t * 0.06) * 2;
    FF.drawJeff(ctx, titleJeff, G.t);

    // floating snacks
    const snacks = ['🍜', '🥤', '🌭', '🍡', '🍣', '🍢'];
    for (let i = 0; i < snacks.length; i++) {
      const a = G.t * 0.012 + i * (Math.PI * 2 / snacks.length);
      FF.emoji(ctx, snacks[i], W / 2 + Math.cos(a) * 210, 300 + Math.sin(a) * 62, 34, '#ffe7c2');
    }

    const touch = document.body.classList.contains('touch');
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    FF.rr(ctx, W / 2 - 260, 384, 520, 84, 14); ctx.fill();
    if (touch) {
      FF.text(ctx, 'Use the buttons: ◀ ▶ move   ⬆ jump   🌀 slurp   💥 bump', W / 2, 410, 18, '#fff');
    } else {
      FF.text(ctx, '← →  run     SPACE  jump     Z  vacuum slurp     X  belly bump', W / 2, 410, 18, '#fff');
    }
    FF.text(ctx, 'Eat everything. Dodge the 🍌 Banana Ninjas. Fill the meter. Get the 🔑', W / 2, 442, 16, 'rgba(255,255,255,.85)');

    if (Math.floor(G.t / 30) % 2 === 0) {
      FF.text(ctx, touch ? 'TAP TO START' : 'PRESS ANY KEY TO START', W / 2, 502, 26, '#9dffb0');
    }
  }

  // ------------------------------------------------------------- loop
  // One bad frame should never end the game — log it and keep going.
  function frame() {
    try {
      update();
      render();
    } catch (e) {
      console.error('FOOD FUN hiccup:', e);
    }
    FF.input.endFrame();
    requestAnimationFrame(frame);
  }
  frame();
})();
