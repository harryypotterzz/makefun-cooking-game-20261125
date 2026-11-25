// Dapur Kilat — bootstrap, game loop and screenshot scenes.
// The canvas is fixed at 1280x720 internally and letterboxed to the window,
// so the game looks the same on any desktop browser.
//
// Screenshot scenes (?shot=start|mid|ready|rush&seed=N): deterministic
// starting states rendered by the game's own code, used only to take the
// entry's screenshots. A normal visit without ?shot shows the title screen.

import { VIEW_W, VIEW_H, SHIFT_SECONDS } from './config.js';
import {
  newGame, startShift, spawnOrder, addIngredient, serveOrder, tick,
} from './state.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { makeAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;
const game = newGame(seed);
const audio = makeAudio(game);
attachInput(canvas, game, audio);

// A fixed, readable scene for screenshots. Each one is a real game state:
// the board, the counter, the plate and the timer are all drawn by the
// normal render path, only the starting state is preset.
function applyShot(name) {
  startShift(game);
  game.shiftLeft = SHIFT_SECONDS;
  if (name === 'start') {
    game.score = 0;
    game.coins = 0;
    game.tickets = [];
    spawnOrder(game, 'geprek');
    spawnOrder(game, 'dadar');
    spawnOrder(game, 'sambal');
    game.tickets[0].timeLeft = 24;
    game.tickets[1].timeLeft = 20;
    game.tickets[2].timeLeft = 16;
    game.activeId = game.tickets[0].id;
    game.plate = [];
  } else if (name === 'mid') {
    // A dish mid-assembly: two of three ingredients are on the plate.
    game.score = 250;
    game.coins = 32;
    game.served = 2;
    game.shiftLeft = 96;
    game.tickets = [];
    spawnOrder(game, 'geprek');
    spawnOrder(game, 'komplit');
    spawnOrder(game, 'sambal');
    game.tickets[0].timeLeft = 19;
    game.tickets[1].timeLeft = 24;
    game.tickets[2].timeLeft = 12;
    game.activeId = game.tickets[0].id;
    game.plate = ['nasi', 'ayam'];
  } else if (name === 'ready') {
    // A plate ready to serve: the dish is complete and SAJIKAN glows.
    game.score = 480;
    game.coins = 54;
    game.served = 4;
    game.level = 2;
    game.shiftLeft = 61;
    game.tickets = [];
    spawnOrder(game, 'dadar');
    spawnOrder(game, 'krupuk');
    spawnOrder(game, 'geprek');
    game.tickets[0].timeLeft = 15;
    game.tickets[1].timeLeft = 4;
    game.tickets[2].timeLeft = 21;
    game.activeId = game.tickets[0].id;
    game.plate = ['nasi', 'telur', 'sayur'];
  } else if (name === 'rush') {
    // A busy late shift: level 2, high score, combo going.
    game.score = 720;
    game.coins = 88;
    game.served = 6;
    game.combo = 3;
    game.level = 2;
    game.shiftLeft = 44;
    game.tickets = [];
    spawnOrder(game, 'komplit');
    spawnOrder(game, 'sayur');
    spawnOrder(game, 'krupuk');
    game.tickets[0].timeLeft = 9;
    game.tickets[1].timeLeft = 17;
    game.tickets[2].timeLeft = 26;
    game.activeId = game.tickets[0].id;
    game.plate = ['nasi', 'ayam', 'sambal'];
  }
}

const shot = params.get('shot');
const frozen = Boolean(shot); // screenshot scenes stay exactly as preset
if (shot) applyShot(shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (game.phase === 'playing' && !frozen) {
    const event = tick(game, dt);
    if (event === 'tick') audio.play('tick');
    else if (event === 'expire') audio.play('expire');
    else if (event === 'shiftend') audio.play('shiftend');
  }
  // In a screenshot scene the state is frozen: draw it as-is.
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a tiny handle for play-testing from the console.
window.__dapurKilat = { game, startShift, addIngredient, serveOrder };
