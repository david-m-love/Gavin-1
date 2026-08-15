// FOOD FUN — input
// One control interface shared by keyboard and touch, so the game only ever
// asks "is right held?" and never cares where the answer came from.

var FF = window.FF || (window.FF = {});

FF.input = (function () {
  const held = { left: false, right: false, jump: false, slurp: false, bump: false };
  const pressed = {}; // edge-triggered, cleared at the end of each frame
  let anyPress = false;

  function down(k) {
    if (!k) return;
    if (!held[k]) pressed[k] = true;
    held[k] = true;
    anyPress = true;
    FF.audio.unlock();
  }
  function up(k) {
    if (!k) return;
    held[k] = false;
  }

  const KEYS = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    KeyZ: 'slurp', ArrowDown: 'slurp', KeyS: 'slurp',
    KeyX: 'bump', ShiftLeft: 'bump', ShiftRight: 'bump',
  };

  addEventListener('keydown', (e) => {
    const k = KEYS[e.code];
    if (k) { e.preventDefault(); down(k); }
    if (e.code === 'Enter' || e.code === 'Space') { anyPress = true; FF.audio.unlock(); }
  });
  addEventListener('keyup', (e) => {
    const k = KEYS[e.code];
    if (k) { e.preventDefault(); up(k); }
  });
  // Losing focus mid-run shouldn't leave Jeff sprinting into a ninja.
  addEventListener('blur', () => { for (const k in held) held[k] = false; });

  // ---- touch ----
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch');
  }
  document.querySelectorAll('#touch .btn').forEach((el) => {
    const k = el.dataset.key;
    const press = (e) => { e.preventDefault(); el.classList.add('down'); down(k); };
    const release = (e) => { e.preventDefault(); el.classList.remove('down'); up(k); };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
  });
  // Tapping the canvas counts as "any button" for title / game-over screens.
  addEventListener('pointerdown', () => { anyPress = true; FF.audio.unlock(); });

  return {
    held,
    /** True only on the frame the button went down. */
    tapped(k) { return !!pressed[k]; },
    /** Any key or tap this frame — used by the title and game-over screens. */
    anyTapped() { return anyPress; },
    endFrame() { for (const k in pressed) delete pressed[k]; anyPress = false; },
  };
})();
