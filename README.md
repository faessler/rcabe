# Flip Arcade

A retro **flip-phone arcade** that plays classic mobile games — **Snake**,
**Minesweeper** and **Tetris** — inside a UI styled like an old Samsung
feature phone. It's an installable **PWA** that works fully **offline**, and it
renders an on-screen flip-phone keypad so you can play by touch on a phone.

## Features

- 🎮 Three built-in games: Snake, Minesweeper, Tetris.
- 📱 Feature-phone shell: LCD screen, status bar, soft keys and a numeric keypad.
- 👆 On-screen keypad (D-pad, OK, soft keys, number pad) for touch play, plus
  full keyboard controls on desktop.
- 📶 Offline-first PWA (web app manifest + service worker); install it to your
  home screen and it keeps working with no connection.
- 🧩 No frameworks, no build step — plain HTML/CSS/ES modules.

## Controls

| Action | On-screen | Keyboard |
| --- | --- | --- |
| Move / navigate | D-pad | Arrow keys / WASD |
| Confirm / start / reveal | OK | Enter / Space |
| Left soft key | ⌐ | Q |
| Right soft key (Back) | ¬ | E |
| Flag (Minesweeper) | # | F |
| Back to menu | Red key | Esc |

Game specifics:

- **Snake** — D-pad to steer, OK to start / retry. Edges wrap around; only
  running into yourself ends the game.
- **Minesweeper** — D-pad moves the cursor, OK reveals, `#` (or the Flag soft
  key) toggles a flag. First reveal is always safe.
- **Tetris** — Left/Right move, Up rotates, Down soft-drops, OK hard-drops.

## Run locally

No dependencies are required (uses only Node's standard library).

```bash
npm run dev        # serves the app at http://localhost:8080
```

Open http://localhost:8080 and, on first load, the service worker caches the
app so subsequent visits work offline.

## Project layout

```
index.html                 # phone shell markup
css/styles.css             # feature-phone styling
js/phone.js                # screen manager + input routing
js/menu.js                 # main menu + about
js/games/{snake,minesweeper,tetris}.js
js/util.js                 # canvas fit, storage, game loop
manifest.webmanifest       # PWA manifest
sw.js                      # offline service worker
icons/                     # app icons (icon.svg + generated PNGs)
scripts/serve.mjs          # zero-dependency static server
scripts/gen-icons.mjs      # regenerates PNG icons from the SVG motif
```

## Cloud Agent environment

`.cursor/environment.json` runs the app in a Cloud Agent:

- `install`: regenerates the PNG icons.
- `terminals`: serves the site with `npm run dev`.
- `ports`: exposes `8080`.
