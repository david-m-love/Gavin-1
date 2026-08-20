// FOOD FUN — main game loop
// States: title -> play -> levelclear -> (boss) -> victory / gameover

var FF = window.FF || (window.FF = {});

(function () {
  const W = 960, H = 540;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let dpr = 1;

  const btnBump = document.getElementById('bBump');
  const btnSlurp = document.getElementById('bSlurp');

  function resize() {
    // Profiling showed the game's own per-frame work is well under a
    // millisecond — the cost on a slow device is filling pixels, not running
    // code. So the thing worth controlling is how many pixels there are. A 2x
    // backing store means 1920x1080 of fill every frame for art that gains
    // nothing from it, and dropping to 1x when the device is struggling more
    // than halves the work again.
    dpr = G.lowFx ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const pad = document.body.classList.contains('touch') ? 8 : 24;
    const s = Math.min((innerWidth - pad) / W, (innerHeight - pad) / H);
    canvas.style.width = (W * s) + 'px';
    canvas.style.height = (H * s) + 'px';
  }
  addEventListener('resize', resize);
  // NB: the first resize() happens after G exists — it reads G.lowFx.

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
    thrown: [],          // bananas the ninjas have lobbed
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
    bannerT: 0,
    parts: [],
    texts: [],
    walkers: [],
    petals: [],
    steam: [],
    train: null,
    crumble: null,
    flash: 0,
    lowFx: false,        // set automatically when the device can't keep up
  };
  FF.G = G;
  resize();

  // ------------------------------------------------------------- effects
  function popText(str, x, y, color) {
    G.texts.push({ s: str, x: x, y: y, c: color || '#fff', life: 58, vy: -1.1 });
  }
  G.popText = popText;

  function burst(x, y, color, n) {
    const count = Math.round((n || 12) * (G.lowFx ? 0.4 : 1));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3.5;
      G.parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
        life: 26 + Math.random() * 22, c: color, r: 2 + Math.random() * 3,
      });
    }
  }

  // ------------------------------------------------------------- best score
  const BEST_KEY = 'foodfun.best';

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      const b = raw && JSON.parse(raw);
      if (!b || typeof b.level !== 'number') return null;
      return {
        level: Math.max(0, Math.min(FF.LEVELS.length - 1, b.level)),
        chopsticks: Math.max(0, b.chopsticks || 0),
        beaten: !!b.beaten,
      };
    } catch (e) { return null; }
  }

  let best = loadBest();

  function recordBest(beaten) {
    best = {
      level: Math.max(best ? best.level : 0, G.levelIndex),
      chopsticks: Math.max(best ? best.chopsticks : 0, G.chopsticks),
      beaten: (best && best.beaten) || !!beaten,
    };
    try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch (e) { /* ignore */ }
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
    G.ninjas = (spec.ninjas || []).map((n) => new FF.Ninja(n, spec.throwingNinjas && n.throws));
    G.thrown = [];
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
    G.petals = [];
    if (spec.petals) {
      for (let k = 0; k < 40; k++) {
        G.petals.push({ x: Math.random() * W, y: Math.random() * H, sp: 0.5 + Math.random(), ph: Math.random() * 6 });
      }
    }
    G.steam = [];
    if (spec.steam) {
      for (let k = 0; k < 26; k++) {
        G.steam.push({ x: Math.random() * spec.width, y: spec.groundY - Math.random() * 200, r: 12 + Math.random() * 26, sp: 0.3 + Math.random() * 0.5 });
      }
    }
    G.train = spec.train ? { timer: spec.train.every, active: false, x: 0, warn: 0 } : null;

    FF.audio.startMusic(spec.music || 'neon');
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
      popText('BOB BLOCKED IT!', G.jeff.cx, G.jeff.y - 26, '#7fe4ff');
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
    recordBest(false);
    FF.audio.stopMusic();
    FF.audio.play('rumble');
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
      if (FF.input.tapped('left')) { FF.setLook(FF.lookIndex - 1); FF.audio.unlock(); FF.audio.play('eat'); }
      if (FF.input.tapped('right')) { FF.setLook(FF.lookIndex + 1); FF.audio.unlock(); FF.audio.play('eat'); }
      if (FF.input.anyTapped()) { FF.audio.unlock(); startRun(); }
      return;
    }
    if (G.state === 'gameover') {
      G.crumble.t++;
      for (const c of G.crumble.chunks) {
        if (G.crumble.t < c.delay) continue;
        c.x += c.vx; c.y += c.vy; c.vy += 0.42; c.rot += c.vr;
      }
      if (G.crumble.t > 110 && FF.input.anyTapped()) G.state = 'title';
      return;
    }
    if (G.state === 'victory') {
      if (FF.input.anyTapped() && G.bannerT > 90) G.state = 'title';
      G.bannerT++;
      return;
    }
    if (G.state === 'levelclear') {
      G.bannerT++;
      if (!G.lowFx) {
        burst(Math.random() * W + G.camX, 120 + Math.random() * 160, 'hsl(' + Math.floor(Math.random() * 360) + ',90%,65%)', 1);
      }
      updateParticles(1);
      if (G.bannerT > 130) {
        const next = G.levelIndex + 1;
        if (next >= FF.LEVELS.length) { recordBest(true); G.state = 'victory'; G.bannerT = 0; }
        else {
          // all that food did him good — you never start a level worse than 2
          if (G.lives < 3) G.lives++;
          G.jeff.grow(); loadLevel(next); recordBest(false); G.state = 'play';
        }
      }
      return;
    }

    // ---------------- playing ----------------
    const lvl = G.level;
    const j = G.jeff;
    if (G.intro > 0) G.intro--;
    if (G.slowmo > 0) G.slowmo--;
    if (G.magnet > 0) G.magnet--;
    const ts = G.slowmo > 0 ? 0.38 : 1;

    // Pressing the action button while a chomp is banked launches Jeff at the
    // dragon instead of belly bumping. Jeff.update sees chomp > 0 first, so the
    // bump never fires on the same press.
    const bossReady = G.boss && G.boss.canChomp() && G.boss.onScreen(G.camX, W);
    if (bossReady && FF.input.tapped('bump') && j.chomp <= 0) {
      j.startChomp(G.boss.x, G.boss.y);
      popText('CHOMP!', j.cx, j.y - 30, '#9dffb0');
    }

    j.update(lvl, FF.input);
    const bobWasGone = !G.shield.active;
    G.shield.update();
    if (bobWasGone && G.shield.active) popText('BOB IS BACK! 🌈', j.cx, j.y - 34, '#7fe4ff');

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
        if (f.t === 'bento') popText('YUM! YUM!', f.x, f.y - 38, '#ff9ecb');
        if (G.hunger >= G.hungerTarget && !G.key) spawnKey();
      }
    }

    // ---- bananas on the ground ----
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

    // ---- bananas in the air (thrown by ninjas) ----
    FF.updateThrown(G.thrown, ts, lvl.groundY);
    for (let i = G.thrown.length - 1; i >= 0; i--) {
      const b = G.thrown[i];
      if (Math.hypot(j.cx - b.x, j.cy - b.y) > 16 + j.w * 0.4) continue;
      G.thrown.splice(i, 1);
      burst(b.x, b.y, '#ffe14b', 12);
      if (j.star > 0) continue;
      hurtJeff(b.x, 'BANANA! -1');
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
        popText('BIG MAC! YUM! YUM!', it.x, it.y - 34, '#ffb703');
        popText('SLURP EVERYTHING!', it.x, it.y - 58, '#ffd166');
      } else if (it.t === 'riceball') {
        G.lives++;
        FF.audio.play('big');
        popText('+1 LIFE', it.x, it.y - 30, '#9dffb0');
      } else if (it.t === 'slowmo') {
        G.slowmo = 330;
        FF.audio.play('big');
        popText('BRAIN FREEZE! SLOW-MO', it.x, it.y - 34, '#7fe4ff');
      } else if (it.t === 'energy') {
        j.energy = 480;
        FF.audio.play('energy');
        popText('⚡ ENERGY DRINK — GO FAST!', it.x, it.y - 34, '#b6ff3d');
      } else if (it.t === 'chopsticks') {
        G.chopsticks++;
        FF.audio.play('key');
        popText('GOLDEN CHOPSTICKS!', it.x, it.y - 34, '#ffd60a');
      }
    }

    // ---- ninjas ----
    for (const n of G.ninjas) {
      n.update(j, ts, lvl.groundY, G.thrown);
      if (n.dead || n.flying) continue;
      if (!n.hits(j)) continue;
      if (j.star > 0 || j.bump > 0 || j.chomp > 0) {
        n.knockFlying(Math.sign(j.vx) || j.face);
        burst(n.cx, n.cy, '#ffe14b', 14);
        popText(j.star > 0 ? 'SMASH!' : 'BELLY BUMP!', n.cx, n.cy - 30, '#ffd166');
        G.shake = Math.max(G.shake, 9);
        // Landing the hit stops the charge. Otherwise the dash carried Jeff a
        // further 128px into whatever was behind the ninja, which is what made
        // bumping a guard feel like a trap.
        if (j.bump > 0) { j.bump = 0; j.vx *= 0.3; }
        if (j.invuln < 25) j.invuln = 25;
      } else {
        hurtJeff(n.cx, 'OW! -1');
      }
    }
    G.ninjas = G.ninjas.filter((n) => !n.dead);

    if (G.train) updateTrain(ts, lvl, j);

    for (const wk of G.walkers) {
      wk.x += wk.dir * wk.sp * ts;
      if (wk.x < 60) wk.dir = 1;
      if (wk.x > lvl.width - 60) wk.dir = -1;
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
        // one-on-one with the dragon: the ninjas clear out
        for (const n of G.ninjas) burst(n.cx, n.cy, '#ffe14b', 12);
        if (G.ninjas.length) popText('THE NINJAS RUN AWAY!', j.cx, j.y - 56, '#ffe14b');
        G.ninjas = [];
        G.thrown = [];
        spawnBoss(lvl);
      } else {
        G.state = 'levelclear';
        G.bannerT = 0;
        FF.audio.stopMusic();
        FF.audio.fanfare();
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
        recordBest(true);
        G.state = 'victory';
        G.bannerT = 0;
      } else {
        if (j.chomp > 0 && G.boss.touching(j)) {
          G.boss.bite(G);
          j.chomp = 0;
          j.vx = Math.sign(j.cx - G.boss.x) * 7 || -7;
          j.vy = -7;
          j.invuln = 50;
          G.shake = 18;
          burst(G.boss.x, G.boss.y, '#ff9ecb', 22);
        } else if (j.chomp <= 0) {
          if (G.boss.seedHits(j)) hurtJeff(G.boss.x, 'SEED! -1');
          if (G.boss.touching(j)) {
            if (j.star > 0) j.vx = Math.sign(j.cx - G.boss.x) * 6;
            else hurtJeff(G.boss.x, 'TOO SPIKY! -1');
          }
        }
      }
    }

    updateParticles(ts);

    const targetCam = Math.max(0, Math.min(lvl.width - W, j.cx - W * 0.42));
    G.camX += (targetCam - G.camX) * 0.12;

    syncButtons(bossReady);
  }

  /** Keep the on-screen buttons telling the truth about what's available. */
  function syncButtons(bossReady) {
    if (btnBump) {
      const ico = btnBump.querySelector('.ico');
      const lab = btnBump.querySelector('small');
      if (bossReady) {
        btnBump.classList.add('chomp');
        btnBump.classList.remove('dim');
        if (ico) ico.textContent = '🐉';
        if (lab) lab.textContent = 'CHOMP';
      } else {
        btnBump.classList.remove('chomp');
        btnBump.classList.toggle('dim', !!(G.boss && !bossReady));
        if (ico) ico.textContent = '💥';
        if (lab) lab.textContent = 'BUMP';
      }
    }
    if (btnSlurp) btnSlurp.classList.toggle('dim', !G.jeff.slurpReady());
  }

  function spawnKey() {
    const k = G.level.keySpot;
    G.key = { x: k.x, y: k.y };
    FF.audio.play('key');
    popText('FULL! GRAB THE KEY →', G.jeff.cx, G.jeff.y - 40, '#ffd60a');
    G.shake = 8;
  }

  function spawnBoss(lvl) {
    G.boss = new FF.Boss(lvl.boss, lvl.arenaStart, lvl.width - 40, lvl.groundY, lvl.strawberrySpots);
    FF.audio.startMusic('boss');
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
    const low = G.lowFx;

    FF.drawBackground(ctx, lvl.theme, W, H, G.camX, G.t, low);

    ctx.save();
    ctx.translate(-G.camX + shakeX, shakeY);

    // Only draw what the camera can actually see. A level holds around a
    // hundred snacks and most of them are nowhere near the screen.
    const left = G.camX - 80, right = G.camX + W + 80;
    const seen = (x) => x > left && x < right;

    for (const p of lvl.solids) {
      if (p.x + p.w > left && p.x < right) FF.drawPlatform(ctx, p, lvl.theme, p.y === lvl.groundY);
    }
    for (const wk of G.walkers) if (seen(wk.x)) drawWalker(wk, lvl);

    for (const f of G.pick.food) if (seen(f.x)) FF.drawPickup(ctx, f, G.t, low);
    for (const b of G.pick.bananas) if (seen(b.x)) FF.drawPickup(ctx, b, G.t, low);
    for (const it of G.pick.items) if (seen(it.x)) FF.drawPickup(ctx, it, G.t, low);
    if (G.key) FF.drawKey(ctx, G.key, G.t, low);

    for (const n of G.ninjas) if (seen(n.x)) n.draw(ctx, G.t);
    FF.drawThrown(ctx, G.thrown);
    if (G.boss) G.boss.draw(ctx, G.t, low);

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

    if (lvl.steam && !low) drawSteam(lvl);
    ctx.restore();

    if (lvl.petals && !low) drawPetals();
    if (G.slowmo > 0) { ctx.fillStyle = 'rgba(120,220,255,.12)'; ctx.fillRect(0, 0, W, H); }
    if (G.jeff.star > 0) { ctx.fillStyle = 'hsla(' + (G.t * 8) % 360 + ',100%,60%,.09)'; ctx.fillRect(0, 0, W, H); }
    if (G.jeff.energy > 0 && !low) drawSpeedLines();
    if (G.flash > 0) { ctx.fillStyle = 'rgba(255,60,90,' + (G.flash / 26) + ')'; ctx.fillRect(0, 0, W, H); }
    if (G.train && G.train.warn > 0 && !G.train.active) {
      ctx.fillStyle = 'rgba(255,60,60,' + (0.18 + 0.18 * Math.sin(G.t * 0.4)) + ')';
      ctx.fillRect(0, 0, W, H);
      FF.text(ctx, '⚠ TRAIN COMING — GET UP HIGH!', W / 2, 64, 30, '#fff');
    }

    drawHUD();
    if (G.intro > 0) drawIntro();
    if (G.state === 'levelclear') drawLevelClear();
    if (G.state === 'victory') drawVictory();
  }

  function drawSpeedLines() {
    ctx.save();
    ctx.strokeStyle = 'rgba(182,255,61,.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      const y = (i * 97 + (G.t * 11) % 97) % H;
      const len = 40 + (i % 3) * 30;
      const x = (W - ((G.t * 22 + i * 260) % (W + 300)));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
    ctx.restore();
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
    for (let k = 0; k < 8; k++) { FF.rr(ctx, tr.x + 40 + k * 70, y + 12, 44, 20, 4); ctx.fill(); }
    ctx.fillStyle = '#e9edf5';
    ctx.beginPath();
    ctx.moveTo(tr.x, y + 6); ctx.quadraticCurveTo(tr.x - 70, y + 20, tr.x - 60, y + 58);
    ctx.lineTo(tr.x, y + 58); ctx.closePath(); ctx.fill();
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
    ctx.globalAlpha = 0.75;
    for (const p of G.petals) {
      p.y += p.sp;
      p.x += Math.sin((G.t + p.ph * 40) * 0.02) * 0.8;
      if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      FF.oval(ctx, p.x, p.y, 5, 3.2); ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------- HUD
  function drawHUD() {
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

    // Bob's shield charge
    const sx = 26, sy = 88;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    FF.rr(ctx, sx, sy, 150, 12, 6); ctx.fill();
    const c = G.shield.charge();
    ctx.fillStyle = G.shield.active ? '#7fe4ff' : 'hsl(' + (c * 120) + ',90%,62%)';
    FF.rr(ctx, sx + 2, sy + 2, (150 - 4) * c, 8, 4); ctx.fill();
    FF.text(ctx, G.shield.active ? '🌈 BOB IS READY' : 'BOB IS COMING BACK…', sx + 75, sy + 6, 10, '#fff');

    // slurp recharge
    const ux = 26, uy = 106;
    const ready = G.jeff.slurpReady();
    const charge = ready ? 1 : 1 - G.jeff.slurpCool / FF.SLURP_COOL;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    FF.rr(ctx, ux, uy, 150, 12, 6); ctx.fill();
    ctx.fillStyle = ready ? '#bfe9ff' : '#5a7f96';
    FF.rr(ctx, ux + 2, uy + 2, (150 - 4) * charge, 8, 4); ctx.fill();
    FF.text(ctx, ready ? '🌀 SLURP READY' : 'SLURP ' + Math.ceil(G.jeff.slurpCool / 60) + 's', ux + 75, uy + 6, 10, '#fff');

    FF.text(ctx, G.level.name, W - 24, 30, 20, '#fff', 'right');
    FF.text(ctx, 'LEVEL ' + (G.levelIndex + 1) + ' / ' + FF.LEVELS.length, W - 24, 52, 14, 'rgba(255,255,255,.8)', 'right');
    FF.emoji(ctx, '🥢', W - 40, 78, 22, '#ffd60a');
    FF.text(ctx, '× ' + G.chopsticks, W - 62, 78, 16, '#ffd60a', 'right');

    let banner = 26;
    if (G.jeff.star > 0) { FF.text(ctx, '🍔 BIG MAC MODE! ' + Math.ceil(G.jeff.star / 60), W / 2, banner, 22, '#ffd166'); banner += 26; }
    if (G.jeff.energy > 0) { FF.text(ctx, '⚡ ENERGY DRINK! ' + Math.ceil(G.jeff.energy / 60), W / 2, banner, 20, '#b6ff3d'); banner += 24; }
    if (G.slowmo > 0) { FF.text(ctx, '🍧 BRAIN FREEZE ' + Math.ceil(G.slowmo / 60), W / 2, banner, 18, '#7fe4ff'); }

    // key finder arrow
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

    // boss health + what to do next
    if (G.boss) {
      const w2 = 300;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      FF.rr(ctx, W / 2 - w2 / 2, H - 46, w2, 22, 11); ctx.fill();
      ctx.fillStyle = '#ff2d7a';
      FF.rr(ctx, W / 2 - w2 / 2 + 3, H - 43, (w2 - 6) * (G.boss.hp() / G.boss.maxHp()), 16, 8); ctx.fill();
      FF.text(ctx, 'DRAGON FRUIT BOSS', W / 2, H - 35, 14, '#fff');

      const touch = document.body.classList.contains('touch');
      if (G.boss.canChomp()) {
        const secs = G.boss.chompLeft.toFixed(1);
        FF.text(ctx, (touch ? 'TAP 🐉 CHOMP' : 'PRESS X — CHOMP!') + '   ' + secs + 's',
          W / 2, H - 84, 26, '#9dffb0');
        // countdown bar
        const cw = 260;
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        FF.rr(ctx, W / 2 - cw / 2, H - 66, cw, 9, 5); ctx.fill();
        ctx.fillStyle = '#9dffb0';
        FF.rr(ctx, W / 2 - cw / 2 + 2, H - 64, (cw - 4) * (G.boss.window / FF.CHOMP_WINDOW), 5, 3); ctx.fill();
      } else {
        FF.text(ctx, 'FIND A 🍓 STRAWBERRY TO BITE HIM!', W / 2, H - 82, 18, '#ffd166');
      }
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
    const pop = Math.min(1, G.bannerT / 12);
    ctx.save();
    ctx.translate(W / 2, H / 2 - 40);
    ctx.scale(pop, pop);
    FF.text(ctx, '🔑 KEY GET!', 0, 0, 56, '#ffd60a');
    ctx.restore();
    FF.text(ctx, 'LEVEL COMPLETE!', W / 2, H / 2 + 16, 30, '#9dffb0');
    if (G.lives < 3) {
      FF.text(ctx, '❤️ +1 LIFE — all that food did him good!', W / 2, H / 2 + 56, 22, '#ff9ecb');
    } else {
      FF.text(ctx, 'Jeff is full — and a little bit bigger!', W / 2, H / 2 + 56, 20, '#fff');
    }
    FF.emoji(ctx, '🍜🥤🌭', W / 2, H / 2 + 100, 40, '#ffd166');
  }

  function drawVictory() {
    ctx.fillStyle = 'rgba(10,4,20,.82)';
    ctx.fillRect(0, 0, W, H);
    FF.text(ctx, 'YOU ATE THE DRAGON FRUIT BOSS!', W / 2, 130, 40, '#ff9ecb');
    FF.emoji(ctx, '🐉', W / 2 - 120, 210, 70, '#ff5fa2');
    FF.emoji(ctx, '😋', W / 2, 210, 80, '#ffd166');
    FF.emoji(ctx, '🍓', W / 2 + 120, 210, 70, '#ff4b6b');
    FF.text(ctx, 'Jeff is not hungry anymore.', W / 2, 290, 24, '#fff');
    FF.text(ctx, 'Golden Chopsticks found: ' + G.chopsticks + ' / ' + FF.LEVELS.length, W / 2, 330, 22, '#ffd60a');
    FF.text(ctx, 'Lives left: ' + G.lives, W / 2, 362, 20, '#9dffb0');
    if (G.bannerT > 90 && Math.floor(G.bannerT / 30) % 2 === 0) {
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
    ctx.save();
    ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    for (const c of cr.chunks) {
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
      ctx.rotate(c.rot);
      ctx.drawImage(cr.snap, c.sx, c.sy, c.w, c.h, -c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
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
  const titleJeff = { x: 0, y: 0, w: 110, h: 115, scale: 2.6, face: 1, vx: 0, vy: 0, onGround: true, squash: 0, slurping: false, star: 0, chomp: 0 };

  function drawTitle() {
    FF.drawBackground(ctx, 'neon', W, H, G.t * 0.35, G.t, G.lowFx);
    ctx.fillStyle = 'rgba(6,4,16,.45)';
    ctx.fillRect(0, 0, W, H);

    if (best) {
      const line = best.beaten
        ? '🏆 YOU BEAT THE DRAGON FRUIT BOSS!   🥢 ' + best.chopsticks + ' / ' + FF.LEVELS.length
        : 'BEST: got to ' + FF.LEVELS[best.level].name + '   🥢 ' + best.chopsticks + ' / ' + FF.LEVELS.length;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      const bw2 = Math.max(300, line.length * 9.4);
      FF.rr(ctx, W / 2 - bw2 / 2, 28, bw2, 30, 15); ctx.fill();
      FF.text(ctx, line, W / 2, 43, 17, best.beaten ? '#ffd60a' : '#9dffb0');
    }

    const bob = Math.sin(G.t * 0.05) * 8;
    ctx.save();
    ctx.translate(W / 2, 118 + bob);
    ctx.rotate(Math.sin(G.t * 0.03) * 0.02);
    FF.text(ctx, 'FOOD FUN', 0, 0, 86, '#ffd166');
    ctx.restore();
    FF.text(ctx, 'starring JEFF the sumo 🍜  &  BOB the rainbow bubble 🌈', W / 2, 176, 21, '#ff9ecb');

    titleJeff.x = W / 2 - titleJeff.w / 2;
    titleJeff.y = 214 + Math.sin(G.t * 0.06) * 6;
    titleJeff.vy = Math.sin(G.t * 0.06) * 2;
    FF.drawJeff(ctx, titleJeff, G.t);

    const snacks = ['🍜', '🥤', '🌭', '🍡', '🍣', '🍢'];
    for (let i = 0; i < snacks.length; i++) {
      const a = G.t * 0.012 + i * (Math.PI * 2 / snacks.length);
      FF.emoji(ctx, snacks[i], W / 2 + Math.cos(a) * 240, 300 + Math.sin(a) * 62, 34, '#ffe7c2');
    }

    const look = FF.look();
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(G.t * 0.1);
    FF.text(ctx, '◀', W / 2 - 150, 278, 44, '#9dffb0');
    FF.text(ctx, '▶', W / 2 + 150, 278, 44, '#9dffb0');
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    FF.rr(ctx, W / 2 - 190, 336, 380, 46, 12); ctx.fill();
    FF.text(ctx, look.name, W / 2, 351, 22, '#ffd166');
    FF.text(ctx, '← →  pick your sumo  (' + (FF.lookIndex + 1) + ' of ' + FF.LOOKS.length + ')  — ' + look.blurb,
      W / 2, 372, 13, 'rgba(255,255,255,.85)');

    const touch = document.body.classList.contains('touch');
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    FF.rr(ctx, W / 2 - 270, 396, 540, 76, 14); ctx.fill();
    if (touch) {
      FF.text(ctx, 'Buttons: ◀ ▶ move   ⬆ jump   🌀 slurp   💥 bump', W / 2, 420, 17, '#fff');
    } else {
      FF.text(ctx, '← →  run     SPACE  jump     Z  vacuum slurp     X  belly bump', W / 2, 420, 17, '#fff');
    }
    FF.text(ctx, 'Eat everything. Dodge the 🍌 Banana Ninjas. Fill the meter. Get the 🔑', W / 2, 450, 15, 'rgba(255,255,255,.85)');

    if (Math.floor(G.t / 30) % 2 === 0) {
      FF.text(ctx, touch ? 'TAP THE SCREEN TO START' : 'PRESS SPACE TO START', W / 2, 502, 26, '#9dffb0');
    }
  }

  // ------------------------------------------------------------- loop
  // Watch how long frames are taking and quietly turn off the expensive effects
  // if the device can't keep up, rather than just running slowly.
  let frameAvg = 16.7;
  let lastFrame = 0;

  function frame(now) {
    if (lastFrame) {
      const dt = Math.min(200, now - lastFrame);
      frameAvg = frameAvg * 0.93 + dt * 0.07;
      const was = G.lowFx;
      if (!G.lowFx && frameAvg > 26) G.lowFx = true;
      else if (G.lowFx && frameAvg < 19) G.lowFx = false;
      // dropping detail also drops the canvas resolution, which is the part
      // that actually costs a slow device anything
      if (was !== G.lowFx) resize();
    }
    lastFrame = now;

    try {
      update();
      render();
    } catch (e) {
      console.error('FOOD FUN hiccup:', e);
    }
    FF.input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
