// FOOD FUN — the four Tokyo levels
// Levels are plain data. To add a fifth Tokyo level, add one more object here —
// nothing in the engine needs to change.

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
};

// ---- little layout helpers so the level data stays readable ----

function row(x, y, n, dx, t) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: x + i * dx, y: y, t: t });
  return out;
}

function arc(x, y, n, t, spread, lift) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    out.push({ x: x + p * (spread || 200), y: y - Math.sin(p * Math.PI) * (lift || 90), t: t });
  }
  return out;
}

const GY = 470; // ground top

FF.LEVELS = [
  // ------------------------------------------------------ 1. NEON CROSSWALK
  {
    name: 'Neon Crosswalk',
    subtitle: 'Shibuya — dodge the crowd, grab the snacks',
    theme: 'neon',
    width: 3000,
    groundY: GY,
    music: 1,
    walkers: 9,
    platforms: [
      { x: 420, y: 380, w: 150, h: 20 },
      { x: 700, y: 310, w: 130, h: 20 },
      { x: 1020, y: 380, w: 170, h: 20 },
      { x: 1360, y: 300, w: 140, h: 20 },
      { x: 1640, y: 380, w: 150, h: 20 },
      { x: 1980, y: 330, w: 200, h: 20 },
      { x: 2340, y: 260, w: 140, h: 20 },
      { x: 2560, y: 380, w: 160, h: 20 },
    ],
    food: [].concat(
      row(220, GY - 40, 5, 55, 'ramen'),
      arc(430, GY - 130, 5, 'slushie', 140, 70),
      row(720, 265, 3, 45, 'dango'),
      row(1030, 335, 4, 45, 'corndog'),
      arc(1180, GY - 40, 6, 'ramen', 220, 60),
      row(1370, 255, 3, 45, 'sushi'),
      row(1650, 335, 4, 40, 'slushie'),
      row(1990, 285, 5, 45, 'takoyaki'),
      arc(2180, GY - 40, 6, 'dango', 200, 70),
      row(2570, 335, 4, 45, 'corndog'),
      row(2760, GY - 40, 5, 50, 'ramen'),
      // guarded premium bento
      [{ x: 2350, y: 215, t: 'bento' }, { x: 1420, y: 255, t: 'bento' }]
    ),
    bananas: [
      { x: 620, y: GY - 34 }, { x: 1290, y: GY - 34 },
      { x: 1450, y: 255 }, { x: 2050, y: 285 },
      { x: 2380, y: 215 }, { x: 2680, y: GY - 34 },
    ],
    ninjas: [
      { x: 900, y: GY - 46, range: 140 },
      { x: 1400, y: 254, range: 90 },
      { x: 1860, y: GY - 46, range: 170 },
      { x: 2330, y: 214, range: 110 },
      { x: 2500, y: GY - 46, range: 150 },
    ],
    items: [
      { x: 760, y: 265, t: 'chopsticks' },
      { x: 2060, y: 285, t: 'bigmac' },
      { x: 2620, y: 335, t: 'riceball' },
    ],
    keySpot: { x: 2880, y: GY - 60 },
  },

  // --------------------------------------------------------- 2. RAMEN ALLEY
  {
    name: 'Ramen Alley',
    subtitle: 'Steamy noodle shops — ninjas love it here',
    theme: 'ramen',
    width: 3200,
    groundY: GY,
    music: 1,
    walkers: 4,
    steam: true,
    platforms: [
      { x: 280, y: 390, w: 120, h: 18 },
      { x: 480, y: 320, w: 120, h: 18 },
      { x: 700, y: 250, w: 120, h: 18 },
      { x: 940, y: 330, w: 150, h: 18 },
      { x: 1200, y: 250, w: 120, h: 18 },
      { x: 1420, y: 350, w: 140, h: 18 },
      { x: 1680, y: 270, w: 130, h: 18 },
      { x: 1920, y: 380, w: 140, h: 18 },
      { x: 2160, y: 300, w: 150, h: 18 },
      { x: 2420, y: 220, w: 130, h: 18 },
      { x: 2660, y: 340, w: 150, h: 18 },
      { x: 2920, y: 260, w: 150, h: 18 },
    ],
    food: [].concat(
      row(180, GY - 40, 4, 52, 'ramen'),
      row(290, 345, 3, 42, 'ramen'),
      row(490, 275, 3, 42, 'takoyaki'),
      row(710, 205, 3, 42, 'ramen'),
      arc(880, GY - 40, 6, 'dango', 240, 80),
      row(950, 285, 4, 42, 'sushi'),
      row(1210, 205, 3, 42, 'ramen'),
      arc(1300, GY - 40, 5, 'slushie', 180, 60),
      row(1430, 305, 3, 45, 'corndog'),
      row(1690, 225, 3, 42, 'ramen'),
      arc(1800, GY - 40, 6, 'takoyaki', 220, 70),
      row(1930, 335, 3, 45, 'dango'),
      row(2170, 255, 4, 42, 'ramen'),
      row(2430, 175, 3, 42, 'sushi'),
      arc(2500, GY - 40, 6, 'ramen', 230, 80),
      row(2670, 295, 4, 45, 'corndog'),
      row(2930, 215, 3, 45, 'ramen'),
      [{ x: 2450, y: 175, t: 'bento' }, { x: 1240, y: 205, t: 'bento' }, { x: 730, y: 205, t: 'bento' }]
    ),
    bananas: [
      { x: 620, y: GY - 34 }, { x: 1120, y: GY - 34 }, { x: 1560, y: GY - 34 },
      { x: 2000, y: GY - 34 }, { x: 1270, y: 205 }, { x: 2480, y: 175 },
      { x: 2760, y: 295 }, { x: 2300, y: GY - 34 },
    ],
    ninjas: [
      { x: 700, y: 204, range: 80 },
      { x: 1080, y: GY - 46, range: 170 },
      { x: 1230, y: 204, range: 70 },
      { x: 1620, y: GY - 46, range: 190 },
      { x: 2180, y: 254, range: 110 },
      { x: 2440, y: 174, range: 80 },
      { x: 2620, y: GY - 46, range: 180 },
    ],
    items: [
      { x: 1930, y: 335, t: 'slowmo' },
      { x: 2940, y: 215, t: 'chopsticks' },
      { x: 500, y: 275, t: 'riceball' },
      { x: 1450, y: 305, t: 'bigmac' },
    ],
    keySpot: { x: 3080, y: GY - 60 },
  },

  // --------------------------------------------------- 3. SUBWAY & BULLET TRAIN
  {
    name: 'Subway & Bullet Train',
    subtitle: 'Get off the platform when the lights flash!',
    theme: 'subway',
    width: 3400,
    groundY: GY,
    music: 1,
    walkers: 5,
    train: { every: 460, warn: 110, speed: 17 }, // frames between runs / warning / px per frame
    platforms: [
      { x: 240, y: 370, w: 170, h: 20 },
      { x: 520, y: 300, w: 150, h: 20 },
      { x: 800, y: 370, w: 170, h: 20 },
      { x: 1100, y: 290, w: 160, h: 20 },
      { x: 1400, y: 370, w: 180, h: 20 },
      { x: 1720, y: 280, w: 160, h: 20 },
      { x: 2020, y: 370, w: 170, h: 20 },
      { x: 2320, y: 290, w: 160, h: 20 },
      { x: 2620, y: 370, w: 180, h: 20 },
      { x: 2940, y: 300, w: 170, h: 20 },
      { x: 3180, y: 380, w: 160, h: 20 },
    ],
    food: [].concat(
      row(250, 325, 4, 45, 'sushi'),
      row(530, 255, 3, 45, 'slushie'),
      row(810, 325, 4, 45, 'corndog'),
      arc(700, GY - 40, 5, 'ramen', 180, 60),
      row(1110, 245, 4, 42, 'takoyaki'),
      row(1410, 325, 4, 45, 'dango'),
      arc(1550, GY - 40, 5, 'sushi', 180, 60),
      row(1730, 235, 4, 42, 'ramen'),
      row(2030, 325, 4, 45, 'slushie'),
      arc(2150, GY - 40, 5, 'corndog', 180, 60),
      row(2330, 245, 4, 42, 'takoyaki'),
      row(2630, 325, 4, 45, 'ramen'),
      row(2950, 255, 4, 45, 'sushi'),
      row(3190, 335, 3, 45, 'dango'),
      [{ x: 1150, y: 245, t: 'bento' }, { x: 2360, y: 245, t: 'bento' }, { x: 2980, y: 255, t: 'bento' }]
    ),
    bananas: [
      { x: 600, y: GY - 34 }, { x: 1180, y: 245 }, { x: 1660, y: GY - 34 },
      { x: 2390, y: 245 }, { x: 2860, y: GY - 34 }, { x: 3010, y: 255 },
      { x: 960, y: 325 },
    ],
    ninjas: [
      { x: 1120, y: 244, range: 80 },
      { x: 1480, y: 324, range: 90 },
      { x: 1760, y: 234, range: 80 },
      { x: 2340, y: 244, range: 80 },
      { x: 2680, y: 324, range: 100 },
      { x: 2960, y: 254, range: 90 },
    ],
    items: [
      { x: 560, y: 255, t: 'slowmo' },
      { x: 1750, y: 235, t: 'bigmac' },
      { x: 3200, y: 335, t: 'chopsticks' },
      { x: 2060, y: 325, t: 'riceball' },
    ],
    // sits on top of the last platform, clear of everything else
    keySpot: { x: 3260, y: 336 },
  },

  // ------------------------------------------- 4. TEMPLE & CHERRY BLOSSOM PARK
  {
    name: 'Temple & Cherry Blossoms',
    subtitle: 'Ninjas hide here… and so does the Dragon Fruit Boss',
    theme: 'temple',
    width: 3600,
    groundY: GY,
    music: 1,
    petals: true,
    walkers: 3,
    platforms: [
      { x: 260, y: 400, w: 140, h: 20 },
      { x: 460, y: 340, w: 140, h: 20 },
      { x: 660, y: 280, w: 140, h: 20 },
      { x: 900, y: 350, w: 160, h: 20 },
      { x: 1180, y: 270, w: 150, h: 20 },
      { x: 1440, y: 360, w: 150, h: 20 },
      { x: 1700, y: 280, w: 150, h: 20 },
      { x: 1960, y: 210, w: 150, h: 20 },
      { x: 2220, y: 320, w: 160, h: 20 },
      { x: 2500, y: 250, w: 150, h: 20 },
      // boss arena ledges
      { x: 2980, y: 330, w: 130, h: 20 },
      { x: 3320, y: 330, w: 130, h: 20 },
      { x: 3150, y: 240, w: 130, h: 20 },
    ],
    food: [].concat(
      row(180, GY - 40, 4, 50, 'dango'),
      row(270, 355, 3, 42, 'dango'),
      row(470, 295, 3, 42, 'takoyaki'),
      row(670, 235, 3, 42, 'sushi'),
      arc(820, GY - 40, 6, 'ramen', 230, 80),
      row(910, 305, 4, 42, 'dango'),
      row(1190, 225, 4, 42, 'sushi'),
      arc(1300, GY - 40, 5, 'corndog', 190, 60),
      row(1450, 315, 3, 45, 'takoyaki'),
      row(1710, 235, 4, 42, 'ramen'),
      arc(1820, GY - 40, 6, 'slushie', 220, 70),
      row(1970, 165, 3, 45, 'sushi'),
      row(2230, 275, 4, 42, 'dango'),
      row(2510, 205, 3, 45, 'takoyaki'),
      arc(2600, GY - 40, 6, 'ramen', 230, 80),
      [{ x: 1990, y: 165, t: 'bento' }, { x: 2540, y: 205, t: 'bento' }, { x: 700, y: 235, t: 'bento' }]
    ),
    bananas: [
      { x: 560, y: GY - 34 }, { x: 1080, y: GY - 34 }, { x: 1220, y: 225 },
      { x: 1620, y: GY - 34 }, { x: 2020, y: 165 }, { x: 2570, y: 205 },
      { x: 2300, y: 275 }, { x: 2760, y: GY - 34 },
    ],
    ninjas: [
      { x: 680, y: 234, range: 80 },
      { x: 1000, y: GY - 46, range: 160 },
      { x: 1210, y: 224, range: 80 },
      { x: 1560, y: GY - 46, range: 180 },
      { x: 1980, y: 164, range: 80 },
      { x: 2240, y: 274, range: 100 },
      { x: 2520, y: 204, range: 80 },
      { x: 2700, y: GY - 46, range: 170 },
    ],
    items: [
      { x: 690, y: 235, t: 'chopsticks' },
      { x: 1460, y: 315, t: 'bigmac' },
      { x: 2240, y: 275, t: 'slowmo' },
      { x: 480, y: 295, t: 'riceball' },
    ],
    keySpot: { x: 2860, y: GY - 60 },
    // Clearing the key here opens the gate to the boss arena.
    boss: { x: 3230, y: 250 },
    arenaStart: 2950,
  },
];
