/**
 * Regenerates the app icons and the link-preview image for FOOD FUN.
 *
 * The pictures are drawn with the game's OWN code (FF.drawJeff, FF.Shield,
 * FF.drawBackground, FF.text) rather than hand-made art — so the icon really is
 * Jeff, and the share image really is the title screen. Re-run this whenever
 * Jeff's look changes.
 *
 * Writes: icon-192.png, icon-512.png, apple-touch-icon.png, og-image.png
 *
 * Playwright is only needed for this tool, not for the game:
 *
 *     npm i playwright
 *     node tools/make-images.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// The icon uses the picked-by-default look; index 4 is Fire Jeff, 0 is Original.
const ICON_LOOK = Number(process.env.ICON_LOOK || 0);

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch(
    fs.existsSync(CHROME) ? { executablePath: CHROME } : {}
  );
  const page = await browser.newPage({ viewport: { width: 1300, height: 800 } });
  page.on('pageerror', (e) => { throw e; });

  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.FF && window.FF.drawJeff);

  const images = await page.evaluate((lookIndex) => {
    const out = {};

    function make(w, h) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    }

    // ---------- square app icon ----------
    function icon(size) {
      const c = make(size, size);
      const x = c.getContext('2d');
      const k = size / 512; // everything below is authored at 512

      // background: deep Tokyo-night purple
      const g = x.createRadialGradient(256 * k, 200 * k, 40 * k, 256 * k, 256 * k, 380 * k);
      g.addColorStop(0, '#4a1d6e');
      g.addColorStop(1, '#160c2e');
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);

      // a few neon windows for texture
      for (let i = 0; i < 26; i++) {
        const hv = FF.hash(i * 3.7);
        x.fillStyle = 'rgba(140,200,255,' + (0.08 + hv * 0.16) + ')';
        x.fillRect(FF.hash(i) * size, FF.hash(i + 40) * size, 14 * k, 18 * k);
      }

      // Jeff, kept inside the middle 70% so Android's maskable crop is safe
      const jw = 150 * k, jh = 156 * k;
      const j = {
        x: 256 * k - jw / 2, y: 256 * k - jh / 2 + 6 * k,
        w: jw, h: jh, scale: 3.4 * k, face: 1, vx: 0, vy: 0,
        onGround: true, squash: 0, slurping: false, star: 0, look: lookIndex,
      };
      FF.drawJeff(x, j, 40);
      const bob = new FF.Shield();
      bob.spin = 0.5;
      bob.draw(x, j);
      return c.toDataURL('image/png');
    }

    out['icon-192.png'] = icon(192);
    out['icon-512.png'] = icon(512);
    out['apple-touch-icon.png'] = icon(180);

    // ---------- 1200x630 link preview ----------
    (function og() {
      const W = 1200, H = 630;
      const c = make(W, H);
      const x = c.getContext('2d');

      FF.drawBackground(x, 'neon', W, H, 260, 40);
      x.fillStyle = 'rgba(6,4,16,.45)';
      x.fillRect(0, 0, W, H);

      FF.text(x, 'FOOD FUN', W / 2, 118, 104, '#ffd166');
      FF.text(x, 'starring JEFF the sumo 🍜  &  BOB the rainbow bubble 🌈', W / 2, 190, 27, '#ff9ecb');

      const jw = 150, jh = 156;
      const j = {
        x: W / 2 - jw / 2, y: 260, w: jw, h: jh, scale: 3.4, face: 1,
        vx: 0, vy: 0, onGround: true, squash: 0, slurping: false, star: 0, look: lookIndex,
      };
      FF.drawJeff(x, j, 40);
      const bob = new FF.Shield();
      bob.spin = 0.5;
      bob.draw(x, j);

      // snacks orbiting him — skipping any that would land on top of Jeff
      const snacks = ['🍜', '🥤', '🌭', '🍡', '🍣', '🍢', '🍔', '🍱'];
      const jcx = W / 2, jcy = 338;
      snacks.forEach((e, i) => {
        const a = 0.28 + i * (Math.PI * 2 / snacks.length);
        const px = jcx + Math.cos(a) * 350;
        const py = 348 + Math.sin(a) * 150;
        if (Math.hypot(px - jcx, py - jcy) < 235) return;
        FF.emoji(x, e, px, py, 52, '#ffe7c2');
      });

      FF.text(x, 'Eat everything. Dodge the 🍌 Banana Ninjas. Chomp the 🐉 Dragon Fruit Boss.',
        W / 2, 552, 25, '#fff');
      FF.text(x, 'a game by K. GAVIN LOVE', W / 2, 596, 20, '#9dffb0');

      out['og-image.png'] = c.toDataURL('image/png');
    })();

    return out;
  }, ICON_LOOK);

  for (const [name, dataUrl] of Object.entries(images)) {
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(ROOT, name), buf);
    console.log('wrote', name, (buf.length / 1024).toFixed(1) + ' KB');
  }

  await browser.close();
})();
