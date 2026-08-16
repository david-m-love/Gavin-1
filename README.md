# 🍜 FOOD FUN

### starring **JEFF the sumo**

A game designed by **K. Gavin Love**.

### 🎮 Play it now: **[food-fun-iota.vercel.app](https://food-fun-iota.vercel.app/)**

Jeff is a tiny, chubby sumo wrestler in Tokyo, and he is **starving**. Run around
collecting ramen, slushies, corn dogs and takoyaki until your hunger meter is
full — then grab the 🔑 KEY and move on. Watch out for the 🍌 **Banana Ninjas**
guarding the best food, and whatever you do, *don't eat a banana*.

Jeff's catchphrase is **"YUM! YUM!"** — you'll hear it when he grabs a big snack.

His sidekick is **BOB** 🌈, a rainbow bubble made of Fruity Pebbles who swirls
around Jeff and takes a hit for him.

### 🥋 Pick your Jeff

On the title screen, press **← and →** to flip through **five different sumos** —
Original Jeff, Big Beefy Jeff, Cool Jeff, Chonky Jeff and Fire Jeff. The one you
pick is saved, so it's still there next time you play.

---

## 🌐 Play it online

### ▶ **[food-fun-iota.vercel.app](https://food-fun-iota.vercel.app/)**

Send that link to anyone and they can play — computer, phone or tablet, no
downloads, nothing to install.

### Putting it on Vercel (about two minutes)

The game is a plain static site — no build step, no server, no dependencies —
so Vercel needs no configuration at all.

1. Go to **[vercel.com](https://vercel.com)** → **Continue with GitHub**.
   The free Hobby plan is fine, and it can deploy private repos.
2. **Add New… → Project**.
3. Find **`david-m-love/Gavin-1`** in the list. If it isn't there, click
   *Adjust GitHub App Permissions* and give Vercel access to that repo.
4. **Framework Preset: Other.** Leave *Build Command* and *Output Directory*
   **empty** — there is nothing to build.
5. **Deploy.** About twenty seconds later there's a live URL.
6. Optional: **Settings → General → Project Name** → `food-fun`, which makes the
   address `food-fun.vercel.app`.

After that it's automatic: every push to the `claude/game-design-questions-oued56`
branch redeploys the live site.

---

## ▶️ How to play it

**Online:** open the link above.

**On a computer:** open `index.html` in any web browser. That's it — no install,
no downloads, nothing to set up.

**On a tablet or phone:** open the same file. Touch buttons appear automatically.

**Save it like a real app:** on an iPad or phone, open the live link, tap the
Share button and choose **Add to Home Screen**. Food Fun gets its own icon and
opens fullscreen with no browser bars.

### Controls

| Computer | Touch | What it does |
|---|---|---|
| `←` `→` or `A` `D` | ◀ ▶ | Run *(and pick your Jeff on the title screen)* |
| `SPACE` or `↑` | ⬆ JUMP | Jump (hold longer = higher) |
| `Z` or `↓` | 🌀 SLURP | **Vacuum slurp** — inhale food from far away |
| `X` or `SHIFT` | 💥 BUMP | **Belly bump** — send Banana Ninjas flying |

Tap the 🔊 button in the corner for sound.

---

## 🎮 The rules

- Jeff starts every level **completely starving**. Eating fills the hunger meter.
- When the meter is **FULL**, the 🔑 **KEY** appears. Grab it to clear the level.
- Jeff gets **a tiny bit bigger** every level he beats.
- You get **3 lives**.
- 🍌 **Eating a banana costs a life.**
- 🍌 **Banana Ninjas** guard the best food. Touching one costs a life —
  unless you **belly bump** them first, and then they go flying.
- 🌈 **BOB**, your Fruity Pebbles sidekick, is a rainbow bubble that swirls around
  Jeff. He blocks **one hit**, pops, then comes back.
- 💥 **GAME OVER:** Jeff's belly rumbles so loud the screen cracks and the whole
  level crumbles apart.
- 🏆 Your **best run** is remembered — the furthest level you reached and the most
  golden chopsticks you found show up on the title screen.

## 🍔 Power-ups and secrets

| Item | What it does |
|---|---|
| 🍔 **Big Mac** | Star power! Slurps up **all** the food on screen and makes Jeff unstoppable |
| 🍧 **Slow-Mo Slushie** | Brain freeze — everything else slows down so you can slip past ninjas |
| 🍙 **Rice Ball** | A hidden extra life |
| 🥢 **Golden Chopsticks** | One rare treasure hidden in every level. Can you find all 4? |
| 🍱 **Bento** | The really good stuff. Worth a lot — which is why ninjas guard it |

## 🗾 The levels

1. **Neon Crosswalk** — Shibuya. Giant screens, huge crowds, neon everywhere.
2. **Ramen Alley** — steamy noodle shops and paper lanterns. Ninjas love it here.
3. **Subway & Bullet Train** — when the lights flash, **get up high**. The train
   is coming and it will not stop for you.
4. **Temple & Cherry Blossoms** — pink petals, torii gates… and the boss.

## 🐉 The Dragon Fruit Boss

He's waiting at the end of the temple, and he is **invincible**.

The only way to hurt him is to find the **mini strawberries** 🍓 hidden around the
arena. Every strawberry you eat earns you one **CHOMP**. Touch him with a chomp
banked and Jeff takes a bite out of him.

He's actually fruit — so you beat him by **eating him**. Five bites and he's gone.

---

## 🛠 For anyone who wants to change the game

It's plain JavaScript with no libraries and no build step. Edit a file, refresh
the browser, see the change.

```
index.html      the page, the canvas, the touch buttons
src/game.js     the main loop: title → play → boss → victory / game over
src/jeff.js     Jeff — running, jumping, slurping, belly bumping, growing
src/shield.js   BOB, the Fruity Pebbles rainbow bubble
src/food.js     snacks, bananas, power-ups, the hunger meter
src/ninja.js    the Banana Ninjas and their guard posts
src/boss.js     the Dragon Fruit Boss, strawberries and chomps
src/levels.js   ← all four Tokyo levels live here, as plain data
src/draw.js     how everything is drawn (Jeff, ninjas, backgrounds)
src/audio.js    the music and sound effects, made from scratch in code
src/input.js    keyboard and touch

manifest.webmanifest   lets the game be saved to a home screen like an app
tools/make-images.js   redraws the app icons + link preview using the game's
                       own art code — re-run it if Jeff's look changes
```

**Want to make it easier or harder?** Almost everything is a number you can change:

- `src/jeff.js` — `MAX_RUN` (how fast), `JUMP_V` (how high), `SLURP_RANGE`
- `src/food.js` — `hungerTarget` (how much you have to eat to get the key)
- `src/shield.js` — `RECHARGE` (how long Bob takes to come back)
- `src/draw.js` — `FF.LOOKS` (all five sumos — add a sixth by adding one entry)
- `src/boss.js` — `MAX_BITES` (how many chomps to beat the boss)
- `src/levels.js` — add a fifth Tokyo level by adding one more object to the list

---

*Designed by K. Gavin Love. Jeff says YUM! YUM!*
