// FOOD FUN — the four Tokyo levels
// Levels are plain data. To add a fifth Tokyo level, add one more object here —
// nothing in the engine needs to change.
//
// IMPORTANT: platforms are built with the stair() helper below rather than typed
// out by hand, because hand-placed platforms drifted out of jumping range and
// made parts of the game (including the boss fight) impossible. Run
// `node tools/check-levels.js` after changing anything in here.

var FF = window.FF || (window.FF = {});

// Every snack, and how much of the hunger meter it fills.
FF.FOOD = {
  ramen:    { e: '🍜', v: 8,  r: 17 },
  slushie:  { e: '🥤', v: 6,  r: 15 },
  corndog:  { e: '🌭', v: 10, r: 16 },
  dango:    { e: '🍡', v: 7,  r: 15 },
  sushi:    { e: '🍣', v: 9,  r: 16 },
  takoyaki: { e: '🍢', v: 9,  r: 16 },
  bento:    { e: '🍱', v: 22, r: 20 }, // the good stuff — this is what ninjas guard
};

// Special pickups (not food — these don't fill the meter).
FF.ITEMS = {
  bigmac:     { e: '🍔', r: 20 }, // star power
  chopsticks: { e: '🥢', r: 19 }, // hidden treasure, one per level
  riceball:   { e: '🍙', r: 18 }, // extra life
  slowmo:     { e: '🍧', r: 19 }, // Slow-Mo Slushie (brain freeze)
  energy:     { e: '⚡', r: 19 }, // Energy Drink — go fast for a few seconds
};

const GY = 470;      // ground top
const STEP_UP = 78;  // rise per stair step — must stay under Jeff's jump
const STEP_GAP = 62; // horizontal gap between steps

// ---- layout helpers ----

/** A climbable staircase. Every step is within one jump of the one before it. */
function stair(x, n, opts) {
  opts = opts || {};
  const w = opts.w || 130;
  const dy = opts.dy || STEP_UP;
  const gap = opts.gap || STEP_GAP;
  const dir = opts.dir || 1;
  let y = opts.y || GY - 82;
  const out = [];
  let cx = x;
  for (let i = 0; i < n; i++) {
    out.push({ x: Math.round(cx), y: Math.round(y), w: w, h: 20 });
    cx += dir * (w + gap);
    y -= dy;
  }
  return out;
}

/** Up and back down again, so you can climb a hill and come off the far side. */
function hill(x, up, opts) {
  const a = stair(x, up, opts);
  const top = a[a.length - 1];
  const o = opts || {};
  const w = o.w || 130;
  const gap = o.gap || STEP_GAP;
  const dy = o.dy || STEP_UP;
  const b = stair(top.x + w + gap, up - 1, { w: w, gap: gap, dy: -dy, y: top.y + dy });
  return a.concat(b);
}

/** Food sitting just above a platform, so it's collected by standing on it. */
function onPlat(p, n, t, lift) {
  const l = lift == null ? 40 : lift;
  const out = [];
  if (n === 1) return [{ x: Math.round(p.x + p.w / 2), y: p.y - l, t: t }];
  const span = Math.min(p.w - 24, n * 44);
  const x0 = p.x + p.w / 2 - span / 2;
  for (let i = 0; i < n; i++) {
    out.push({ x: Math.round(x0 + i * (span / (n - 1))), y: p.y - l, t: t });
  }
  return out;
}

/** A ninja standing guard on a platform. */
function guard(p, range) {
  return { x: Math.round(p.x + 10), y: p.y - 40, range: range == null ? Math.max(30, p.w / 2 - 20) : range };
}

/** A row of food along the ground. */
function row(x, y, n, dx, t) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x + i * dx, y: y, t: t });
  return out;
}

/** A rainbow of food you collect by jumping through it. */
function arc(x, y, n, t, spread, lift) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    out.push({ x: Math.round(x + p * (spread || 200)), y: Math.round(y - Math.sin(p * Math.PI) * (lift || 80)), t: t });
  }
  return out;
}

// ============================================================ 1. NEON CROSSWALK
const L1 = hill(380, 3).concat(hill(1180, 3), hill(1980, 4), stair(2680, 2));

const LEVEL1 = {
  name: 'Neon Crosswalk',
  subtitle: 'Shibuya — dodge the crowd, grab the snacks',
  theme: 'neon',
  width: 3000,
  groundY: GY,
  music: 'neon',
  walkers: 9,
  platforms: L1,
  food: [].concat(
    row(180, GY - 40, 4, 55, 'ramen'),
    onPlat(L1[0], 3, 'slushie'), onPlat(L1[1], 3, 'dango'), onPlat(L1[2], 2, 'bento'),
    onPlat(L1[3], 3, 'corndog'), onPlat(L1[4], 3, 'ramen'),
    arc(900, GY - 40, 5, 'ramen', 200, 70),
    onPlat(L1[5], 3, 'sushi'), onPlat(L1[6], 3, 'takoyaki'), onPlat(L1[7], 2, 'bento'),
    onPlat(L1[8], 3, 'dango'), onPlat(L1[9], 3, 'slushie'),
    arc(1700, GY - 40, 6, 'corndog', 220, 70),
    onPlat(L1[10], 3, 'ramen'), onPlat(L1[11], 3, 'sushi'), onPlat(L1[12], 3, 'takoyaki'),
    onPlat(L1[13], 2, 'bento'), onPlat(L1[14], 3, 'dango'), onPlat(L1[15], 3, 'ramen'),
    onPlat(L1[16], 3, 'corndog'),
    row(2760, GY - 40, 5, 50, 'ramen')
  ),
  bananas: [
    { x: 640, y: GY - 34 }, { x: 1120, y: GY - 34 }, { x: 1660, y: GY - 34 },
    { x: 2260, y: GY - 34 }, { x: 2680, y: GY - 34 },
    { x: L1[2].x + 100, y: L1[2].y - 34 }, { x: L1[7].x + 100, y: L1[7].y - 34 },
  ],
  ninjas: [
    guard(L1[2]), guard(L1[7]), guard(L1[13]),
    { x: 1000, y: GY - 40, range: 150 },
    { x: 2400, y: GY - 40, range: 150 },
  ],
  items: [
    { x: L1[1].x + 65, y: L1[1].y - 78, t: 'chopsticks' },
    { x: L1[9].x + 65, y: L1[9].y - 40, t: 'bigmac' },
    { x: L1[15].x + 65, y: L1[15].y - 40, t: 'riceball' },
    { x: 1450, y: GY - 40, t: 'energy' },
  ],
  keySpot: { x: 2880, y: GY - 60 },
};

// =============================================================== 2. RAMEN ALLEY
const L2 = hill(300, 4).concat(hill(1120, 3), hill(1820, 4), hill(2620, 3));

const LEVEL2 = {
  name: 'Ramen Alley',
  subtitle: 'Steamy noodle shops — ninjas love it here',
  theme: 'ramen',
  width: 3200,
  groundY: GY,
  music: 'ramen',
  walkers: 4,
  steam: true,
  platforms: L2,
  food: [].concat(
    row(170, GY - 40, 3, 52, 'ramen'),
    onPlat(L2[0], 3, 'ramen'), onPlat(L2[1], 3, 'takoyaki'), onPlat(L2[2], 3, 'ramen'),
    onPlat(L2[3], 2, 'bento'), onPlat(L2[4], 3, 'sushi'), onPlat(L2[5], 3, 'dango'),
    onPlat(L2[6], 3, 'ramen'),
    arc(880, GY - 40, 5, 'dango', 190, 70),
    onPlat(L2[7], 3, 'sushi'), onPlat(L2[8], 3, 'ramen'), onPlat(L2[9], 2, 'bento'),
    onPlat(L2[10], 3, 'corndog'), onPlat(L2[11], 3, 'ramen'),
    arc(1560, GY - 40, 5, 'slushie', 190, 60),
    onPlat(L2[12], 3, 'takoyaki'), onPlat(L2[13], 3, 'ramen'), onPlat(L2[14], 3, 'sushi'),
    onPlat(L2[15], 2, 'bento'), onPlat(L2[16], 3, 'dango'), onPlat(L2[17], 3, 'ramen'),
    onPlat(L2[18], 3, 'corndog'),
    arc(2380, GY - 40, 5, 'ramen', 190, 70),
    onPlat(L2[19], 3, 'ramen'), onPlat(L2[20], 3, 'takoyaki'), onPlat(L2[21], 2, 'bento'),
    onPlat(L2[22], 3, 'sushi'), onPlat(L2[23], 3, 'ramen'),
    row(3050, GY - 40, 3, 50, 'ramen')
  ),
  bananas: [
    { x: 800, y: GY - 34 }, { x: 1060, y: GY - 34 }, { x: 1520, y: GY - 34 },
    { x: 1780, y: GY - 34 }, { x: 2320, y: GY - 34 }, { x: 2560, y: GY - 34 },
    { x: L2[3].x + 100, y: L2[3].y - 34 }, { x: L2[9].x + 100, y: L2[9].y - 34 },
    { x: L2[15].x + 100, y: L2[15].y - 34 },
  ],
  ninjas: [
    guard(L2[3]), guard(L2[9]), guard(L2[15]), guard(L2[21]),
    { x: 900, y: GY - 40, range: 160 },
    { x: 1650, y: GY - 40, range: 160 },
    { x: 2450, y: GY - 40, range: 160 },
  ],
  items: [
    { x: L2[3].x + 65, y: L2[3].y - 80, t: 'chopsticks' },
    { x: L2[10].x + 65, y: L2[10].y - 40, t: 'bigmac' },
    { x: L2[1].x + 65, y: L2[1].y - 40, t: 'riceball' },
    { x: L2[16].x + 65, y: L2[16].y - 40, t: 'slowmo' },
    { x: 1200, y: GY - 40, t: 'energy' },
  ],
  keySpot: { x: 3120, y: GY - 60 },
};

// =================================================== 3. SUBWAY & BULLET TRAIN
// The train sweeps the ground, so every hill here doubles as somewhere to hide.
const L3 = hill(300, 3).concat(hill(1000, 3), hill(1700, 4), hill(2500, 3), stair(3150, 2));

const LEVEL3 = {
  name: 'Subway & Bullet Train',
  subtitle: 'Get off the ground when the lights flash!',
  theme: 'subway',
  width: 3400,
  groundY: GY,
  music: 'subway',
  walkers: 5,
  train: { every: 460, warn: 110, speed: 17 },
  throwingNinjas: true, // this level's ninjas lob bananas at you
  platforms: L3,
  food: [].concat(
    row(170, GY - 40, 3, 52, 'sushi'),
    onPlat(L3[0], 3, 'sushi'), onPlat(L3[1], 3, 'slushie'), onPlat(L3[2], 2, 'bento'),
    onPlat(L3[3], 3, 'corndog'), onPlat(L3[4], 3, 'ramen'),
    arc(760, GY - 40, 5, 'ramen', 190, 70),
    onPlat(L3[5], 3, 'takoyaki'), onPlat(L3[6], 3, 'dango'), onPlat(L3[7], 2, 'bento'),
    onPlat(L3[8], 3, 'sushi'), onPlat(L3[9], 3, 'ramen'),
    arc(1460, GY - 40, 5, 'sushi', 190, 60),
    onPlat(L3[10], 3, 'ramen'), onPlat(L3[11], 3, 'slushie'), onPlat(L3[12], 3, 'takoyaki'),
    onPlat(L3[13], 2, 'bento'), onPlat(L3[14], 3, 'corndog'), onPlat(L3[15], 3, 'ramen'),
    onPlat(L3[16], 3, 'sushi'),
    arc(2260, GY - 40, 5, 'corndog', 190, 70),
    onPlat(L3[17], 3, 'dango'), onPlat(L3[18], 3, 'ramen'), onPlat(L3[19], 2, 'bento'),
    onPlat(L3[20], 3, 'sushi'), onPlat(L3[21], 3, 'ramen'),
    onPlat(L3[22], 3, 'takoyaki'), onPlat(L3[23], 3, 'dango')
  ),
  bananas: [
    { x: 700, y: GY - 34 }, { x: 1400, y: GY - 34 }, { x: 2200, y: GY - 34 },
    { x: 2980, y: GY - 34 },
    { x: L3[2].x + 100, y: L3[2].y - 34 }, { x: L3[7].x + 100, y: L3[7].y - 34 },
    { x: L3[13].x + 100, y: L3[13].y - 34 },
  ],
  ninjas: [
    guard(L3[2]), guard(L3[7]), guard(L3[13]), guard(L3[19]),
    { x: 900, y: GY - 40, range: 150 },
    { x: 2350, y: GY - 40, range: 150 },
  ],
  items: [
    { x: L3[1].x + 65, y: L3[1].y - 40, t: 'slowmo' },
    { x: L3[12].x + 65, y: L3[12].y - 40, t: 'bigmac' },
    { x: L3[23].x + 65, y: L3[23].y - 40, t: 'chopsticks' },
    { x: L3[8].x + 65, y: L3[8].y - 40, t: 'riceball' },
    { x: 1900, y: GY - 40, t: 'energy' },
  ],
  keySpot: { x: 3330, y: GY - 60 },
};

// ============================================ 4. TEMPLE & CHERRY BLOSSOM PARK
// The last hill is the boss arena: a low ramp on both sides so you can climb to
// the strawberries and keep moving while the dragon spits seeds.
const L4main = hill(280, 4).concat(hill(1100, 3), hill(1800, 4));
const L4arena = [
  { x: 2980, y: GY - 82, w: 150, h: 20 },
  { x: 3200, y: GY - 160, w: 150, h: 20 },
  { x: 3420, y: GY - 82, w: 150, h: 20 },
];
const L4 = L4main.concat(L4arena);

const LEVEL4 = {
  name: 'Temple & Cherry Blossoms',
  subtitle: 'Ninjas hide here… and so does the Dragon Fruit Boss',
  theme: 'temple',
  width: 3700,
  groundY: GY,
  music: 'temple',
  petals: true,
  walkers: 3,
  platforms: L4,
  food: [].concat(
    row(170, GY - 40, 3, 50, 'dango'),
    onPlat(L4[0], 3, 'dango'), onPlat(L4[1], 3, 'takoyaki'), onPlat(L4[2], 3, 'sushi'),
    onPlat(L4[3], 2, 'bento'), onPlat(L4[4], 3, 'ramen'), onPlat(L4[5], 3, 'dango'),
    onPlat(L4[6], 3, 'sushi'),
    arc(860, GY - 40, 5, 'ramen', 200, 70),
    onPlat(L4[7], 3, 'dango'), onPlat(L4[8], 3, 'sushi'), onPlat(L4[9], 2, 'bento'),
    onPlat(L4[10], 3, 'takoyaki'), onPlat(L4[11], 3, 'ramen'),
    arc(1560, GY - 40, 5, 'corndog', 190, 60),
    onPlat(L4[12], 3, 'ramen'), onPlat(L4[13], 3, 'sushi'), onPlat(L4[14], 3, 'dango'),
    onPlat(L4[15], 2, 'bento'), onPlat(L4[16], 3, 'takoyaki'), onPlat(L4[17], 3, 'ramen'),
    onPlat(L4[18], 3, 'sushi'),
    arc(2380, GY - 40, 6, 'ramen', 230, 80),
    row(2700, GY - 40, 3, 52, 'dango')
  ),
  bananas: [
    { x: 620, y: GY - 34 }, { x: 1040, y: GY - 34 }, { x: 1500, y: GY - 34 },
    { x: 2320, y: GY - 34 }, { x: 2660, y: GY - 34 },
    { x: L4[3].x + 100, y: L4[3].y - 34 }, { x: L4[9].x + 100, y: L4[9].y - 34 },
    { x: L4[15].x + 100, y: L4[15].y - 34 },
  ],
  ninjas: [
    guard(L4[3]), guard(L4[9]), guard(L4[15]),
    { x: 950, y: GY - 40, range: 160 },
    { x: 1650, y: GY - 40, range: 160 },
    { x: 2450, y: GY - 40, range: 160 },
  ],
  items: [
    { x: L4[2].x + 65, y: L4[2].y - 40, t: 'chopsticks' },
    { x: L4[11].x + 65, y: L4[11].y - 40, t: 'bigmac' },
    { x: L4[16].x + 65, y: L4[16].y - 40, t: 'slowmo' },
    { x: L4[1].x + 65, y: L4[1].y - 40, t: 'riceball' },
    { x: 2050, y: GY - 40, t: 'energy' },
  ],
  keySpot: { x: 2880, y: GY - 60 },
  // Clearing the key here opens the gate to the boss arena.
  boss: { x: 3270, y: 250 },
  arenaStart: 2950,
  // Where the mini strawberries appear — all sitting on real, climbable ground.
  strawberrySpots: [
    { x: 3050, y: GY - 40 },
    { x: L4arena[0].x + 75, y: L4arena[0].y - 38 },
    { x: L4arena[1].x + 75, y: L4arena[1].y - 38 },
    { x: L4arena[2].x + 75, y: L4arena[2].y - 38 },
    { x: 3620, y: GY - 40 },
  ],
};

FF.LEVELS = [LEVEL1, LEVEL2, LEVEL3, LEVEL4];
