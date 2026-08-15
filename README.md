# 🍜 FOOD FUN

### starring **JEFF the sumo**

A game designed by **K. Gavin Love**.

Jeff is a tiny, chubby sumo wrestler in Tokyo, and he is **starving**. Run around
collecting ramen, slushies, corn dogs and takoyaki until your hunger meter is
full — then grab the 🔑 KEY and move on. Watch out for the 🍌 **Banana Ninjas**
guarding the best food, and whatever you do, *don't eat a banana*.

---

## ▶️ How to play it

**On a computer:** open `index.html` in any web browser. That's it — no install,
no downloads, nothing to set up.

**On a tablet or phone:** open the same file. Touch buttons appear automatically.

### Controls

| Computer | Touch | What it does |
|---|---|---|
| `←` `→` or `A` `D` | ◀ ▶ | Run |
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
- 🌈 Your **Fruity Pebbles sidekick** is a rainbow bubble shield that swirls
  around Jeff. It blocks **one hit**, pops, then recharges.
- 💥 **GAME OVER:** Jeff's belly rumbles so loud the screen cracks and the whole
  level crumbles apart.

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
src/shield.js   the Fruity Pebbles rainbow bubble
src/food.js     snacks, bananas, power-ups, the hunger meter
src/ninja.js    the Banana Ninjas and their guard posts
src/boss.js     the Dragon Fruit Boss, strawberries and chomps
src/levels.js   ← all four Tokyo levels live here, as plain data
src/draw.js     how everything is drawn (Jeff, ninjas, backgrounds)
src/audio.js    the music and sound effects, made from scratch in code
src/input.js    keyboard and touch
```

**Want to make it easier or harder?** Almost everything is a number you can change:

- `src/jeff.js` — `MAX_RUN` (how fast), `JUMP_V` (how high), `SLURP_RANGE`
- `src/food.js` — `hungerTarget` (how much you have to eat to get the key)
- `src/shield.js` — `RECHARGE` (how long the bubble takes to come back)
- `src/boss.js` — `MAX_BITES` (how many chomps to beat the boss)
- `src/levels.js` — add a fifth Tokyo level by adding one more object to the list

---

### Still to name

- The Fruity Pebbles sidekick 🌈
- Jeff's catchphrase when he grabs a big snack

*Gavin's call.*
