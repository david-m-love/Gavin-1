/**
 * Checks that every platform and every pickup in FOOD FUN can actually be
 * reached by jumping.
 *
 * Gavin found this the hard way: the boss arena platforms were 140px above the
 * ground when Jeff can only jump 128px, so the boss fight was unwinnable. This
 * script exists so that can never happen again.
 *
 *     node tools/check-levels.js
 *
 * Exits non-zero if anything is unreachable or buried inside a platform.
 * The jump numbers are read straight out of src/jeff.js, so tuning Jeff's
 * physics automatically re-tunes this check.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ---- real physics, read from the game ----
const jeffSrc = fs.readFileSync(path.join(ROOT, 'src/jeff.js'), 'utf8');
const constant = (name) => {
  const m = jeffSrc.match(new RegExp('const ' + name + ' = (-?[\\d.]+)'));
  if (!m) throw new Error('could not find ' + name + ' in src/jeff.js');
  return parseFloat(m[1]);
};
const JUMP_V = constant('JUMP_V');
const GRAVITY = constant('GRAVITY');
const MAX_RUN = constant('MAX_RUN');

const PEAK = (JUMP_V * JUMP_V) / (2 * GRAVITY);   // highest rise, feet to feet
const AIRTIME = (2 * Math.abs(JUMP_V)) / GRAVITY;
const HOP = MAX_RUN * AIRTIME * 0.6;              // conservative horizontal reach

// Leave headroom: a player shouldn't need a frame-perfect maximum jump.
const MAX_RISE = PEAK - 24;

// ---- load the level data ----
const sandbox = { window: {}, Math: Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/levels.js'), 'utf8'), sandbox);
const FF = sandbox.window.FF;
const LEVELS = FF.LEVELS;

const gapBetween = (a, b) =>
  Math.max(0, Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w)));

let problems = 0;

for (const lvl of LEVELS) {
  const ground = { x: 0, y: lvl.groundY, w: lvl.width, name: 'ground' };
  const plats = lvl.platforms.map((p) => ({ ...p }));

  // Flood-fill outward from the ground: which platforms can Jeff actually stand on?
  const reached = [ground];
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of plats) {
      if (reached.includes(p)) continue;
      for (const s of reached) {
        const rise = s.y - p.y;             // >0 means p is above s
        const gap = gapBetween(s, p);
        if (gap > HOP) continue;
        if (rise <= MAX_RISE) { reached.push(p); grew = true; break; }
      }
    }
  }

  const stranded = plats.filter((p) => !reached.includes(p));

  // A pickup is fine if you can touch it from some reachable surface — either
  // standing on it or grabbing it mid-jump.
  const pickups = []
    .concat((lvl.food || []).map((f) => ({ ...f, kind: 'food' })))
    .concat((lvl.bananas || []).map((b) => ({ ...b, kind: 'banana' })))
    .concat((lvl.items || []).map((i) => ({ ...i, kind: 'item ' + i.t })))
    .concat(lvl.keySpot ? [{ ...lvl.keySpot, kind: 'KEY' }] : []);

  const floating = [];
  const buried = [];
  for (const u of pickups) {
    const ok = reached.some((s) => {
      const rise = s.y - u.y;
      const withinX = u.x >= s.x - HOP && u.x <= s.x + s.w + HOP;
      return withinX && rise <= PEAK + 20 && rise >= -140;
    });
    if (!ok) floating.push(u);
    const inside = plats.concat([ground]).some(
      (p) => u.x > p.x + 6 && u.x < p.x + p.w - 6 && u.y > p.y + 6 && u.y < p.y + p.h - 6
    );
    if (inside) buried.push(u);
  }

  const bad = stranded.length + floating.length + buried.length;
  problems += bad;

  console.log(
    (bad ? '✗' : '✓') + ' ' + lvl.name +
    '  —  ' + plats.length + ' platforms, ' + pickups.length + ' pickups' +
    (bad ? '   ' + bad + ' PROBLEM(S)' : '')
  );
  for (const p of stranded) {
    const best = reached
      .filter((s) => s.y > p.y)
      .map((s) => ({ rise: s.y - p.y, gap: gapBetween(s, p) }))
      .sort((a, b) => a.rise - b.rise)[0];
    console.log('    unreachable platform x=' + p.x + ' y=' + p.y +
      (best ? '  (nearest step below needs rise ' + best.rise + 'px / across ' + Math.round(best.gap) + 'px)' : ''));
  }
  for (const u of floating) console.log('    floating ' + u.kind + ' at x=' + u.x + ' y=' + u.y);
  for (const u of buried) console.log('    buried ' + u.kind + ' at x=' + u.x + ' y=' + u.y);
}

console.log(
  '\nJeff can rise ' + PEAK.toFixed(0) + 'px per jump (budgeting ' + MAX_RISE.toFixed(0) +
  ') and hop about ' + HOP.toFixed(0) + 'px across.'
);

if (problems) {
  console.error('\n' + problems + ' problem(s) — some of the level is unplayable.');
  process.exit(1);
}
console.log('All platforms and pickups are reachable.');
