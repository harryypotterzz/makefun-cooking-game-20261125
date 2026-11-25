# Dapur Kilat — Warung Rush

[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/harryypotterzz/makefun-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/harryypotterzz/makefun-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game that plays offline in a desktop browser,
built for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137)
bounty on make.fun ($250, 10 places paid).

## The game

You run a small Indonesian warung kitchen during a 120-second shift.
Orders arrive on the order board — each ticket names a dish and the
ingredients it needs, with its own countdown. Pick ingredients from the
bins on the counter to assemble the dish on your plate, then serve it
before the ticket's timer runs out. Serve fast for time bonuses and
combos; let a ticket expire and you lose a life. Three lives, and the
orders get faster and fancier as your level rises.

- **Kitchen and order board:** every order ticket shows its dish, its
  ingredient chips (ticked off as you add them), and a live countdown bar.
- **Ingredients on the counter:** Nasi, Ayam, Telur, Sayur, Sambal,
  Kerupuk — click a bin or press keys 1–6.
- **A dish mid-assembly:** the plate in the middle of the counter shows
  each ingredient as you add it.
- **A timer:** every ticket counts down, and the shift clock up top
  counts down the whole 120 seconds.
- **A plate ready to serve:** when the plate matches the selected order,
  the SAJIKAN button lights up — serve with a click or the Space bar.

Controls: mouse (click tickets, bins, SAJIKAN) and keyboard
(1–6 ingredients, Tab switch order, Space serve, C clear plate,
P pause, M mute, R restart). Sound effects are synthesized in code
(WebAudio); there are no audio files and no network requests anywhere.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into the output directory and writes `dossier.json` with
the vendored make.fun library. It creates the output directory when
missing and clears only its contents — it never deletes the directory
itself.

## Files

- `game/` — the playable game as static files (`index.html` + `src/*.js`)
- `screenshots/` — 4 real renders of the game's own code
- `main.ts` — the entry program
- `serve.ts` — the local play-test server
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
