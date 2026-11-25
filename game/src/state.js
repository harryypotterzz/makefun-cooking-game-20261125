// Dapur Kilat — game state and rules.
// The state is plain data; nothing here touches the canvas or the DOM, so
// the rules can be reasoned about (and screenshot presets built) on their own.

import {
  DISH_BY_ID, ING_BY_ID, LEVELS, MAX_LIVES, MAX_TICKETS, SHIFT_SECONDS,
  SERVE_BASE, SERVE_TIME_BONUS, COMBO_WINDOW, mulberry32,
} from './config.js';

let ticketSeq = 0;

export function makeTicket(dish, timeLeft) {
  return {
    id: ++ticketSeq,
    dishId: dish.id,
    name: dish.name,
    needs: [...dish.needs],
    timeLeft,
    timeMax: timeLeft,
    born: Date.now(),
  };
}

export function newGame(seed = 1) {
  return {
    phase: 'title', // title | playing | over
    seed,
    rng: mulberry32(seed),
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    comboTimer: 0,
    lives: MAX_LIVES,
    level: 1,
    shiftLeft: SHIFT_SECONDS,
    spawnTimer: 2.5,
    tickets: [],
    activeId: null,
    plate: [], // ingredient ids currently on the plate
    shake: 0,
    flash: null, // { kind: 'good' | 'bad', until: timestamp }
    pops: [], // floating score texts { x, y, text, color, until }
    message: null, // banner text { text, until }
    muted: false,
    best: 0,
    startedAt: 0,
  };
}

export function levelOf(game) {
  return LEVELS[Math.min(game.level - 1, LEVELS.length - 1)];
}

export function activeTicket(game) {
  return game.tickets.find((t) => t.id === game.activeId) ?? game.tickets[0] ?? null;
}

export function spawnOrder(game, dishId = null) {
  if (game.tickets.length >= MAX_TICKETS) return null;
  const pool = levelOf(game).pool;
  const dish = dishId
    ? DISH_BY_ID[dishId]
    : pool[Math.floor(game.rng() * pool.length)];
  const time = dish.time * levelOf(game).timeScale;
  const ticket = makeTicket(dish, time);
  game.tickets.push(ticket);
  if (game.activeId === null) game.activeId = ticket.id;
  return ticket;
}

export function startShift(game) {
  game.phase = 'playing';
  game.startedAt = Date.now();
  game.tickets = [];
  game.plate = [];
  game.activeId = null;
  game.score = 0;
  game.coins = 0;
  game.served = 0;
  game.combo = 0;
  game.comboTimer = 0;
  game.lives = MAX_LIVES;
  game.level = 1;
  game.shiftLeft = SHIFT_SECONDS;
  game.spawnTimer = 1.2;
  game.pops = [];
  game.message = null;
  spawnOrder(game);
  spawnOrder(game);
}

function pop(game, x, y, text, color) {
  game.pops.push({ x, y, text, color, until: Date.now() + 1100 });
}

function banner(game, text) {
  game.message = { text, until: Date.now() + 1400 };
}

export function plateMatches(game) {
  const ticket = activeTicket(game);
  if (!ticket) return false;
  if (game.plate.length !== ticket.needs.length) return false;
  const have = new Set(game.plate);
  return ticket.needs.every((id) => have.has(id));
}

export function addIngredient(game, ingredientId) {
  if (game.phase !== 'playing') return false;
  if (!ING_BY_ID[ingredientId]) return false;
  if (game.plate.includes(ingredientId)) return 'dup';
  if (game.plate.length >= 4) return 'full';
  game.plate.push(ingredientId);
  return true;
}

export function clearPlate(game) {
  game.plate = [];
}

export function serveOrder(game) {
  if (game.phase !== 'playing') return false;
  const ticket = activeTicket(game);
  if (!ticket) return false;
  if (!plateMatches(game)) {
    game.shake = 9;
    game.flash = { kind: 'bad', until: Date.now() + 300 };
    banner(game, 'Belum cocok — cek pesanan!');
    return 'mismatch';
  }
  const timeBonus = Math.round(ticket.timeLeft) * SERVE_TIME_BONUS;
  const now = Date.now();
  if (now - (game.lastServeAt ?? 0) < COMBO_WINDOW * 1000) {
    game.combo = Math.min(game.combo + 1, 5);
  } else {
    game.combo = 1;
  }
  game.lastServeAt = now;
  const comboBonus = (game.combo - 1) * 25;
  const gained = SERVE_BASE + timeBonus + comboBonus;
  game.score += gained;
  game.coins += 10 + game.combo * 2;
  game.served += 1;
  game.flash = { kind: 'good', until: now + 350 };
  pop(game, 640, 300, `+${gained}`, '#2e7d32');
  if (game.combo >= 2) pop(game, 640, 340, `KOMBO x${game.combo}!`, '#e65100');
  game.tickets = game.tickets.filter((t) => t.id !== ticket.id);
  game.plate = [];
  game.activeId = game.tickets[0]?.id ?? null;
  if (game.served > 0 && game.served % 4 === 0 && game.level < LEVELS.length) {
    game.level += 1;
    banner(game, `LEVEL ${game.level} — pesanan makin cepat!`);
  } else if (game.combo >= 2) {
    banner(game, `Mantap! +${gained} poin`);
  }
  game.best = Math.max(game.best, game.score);
  return true;
}

function loseLife(game, reason) {
  game.lives -= 1;
  game.shake = 12;
  game.flash = { kind: 'bad', until: Date.now() + 400 };
  game.combo = 0;
  banner(game, reason);
  if (game.lives <= 0) {
    game.phase = 'over';
    game.best = Math.max(game.best, game.score);
  }
}

// Advance the simulation by dt seconds. Returns an event string when
// something audible happened ('tick' | 'expire' | 'shiftend'), else null.
export function tick(game, dt) {
  if (game.phase !== 'playing') return null;
  game.shiftLeft -= dt;
  if (game.shiftLeft <= 0) {
    game.shiftLeft = 0;
    game.phase = 'over';
    game.best = Math.max(game.best, game.score);
    return 'shiftend';
  }
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    spawnOrder(game);
    game.spawnTimer = levelOf(game).spawnEvery;
  }
  let event = null;
  for (const ticket of [...game.tickets]) {
    ticket.timeLeft -= dt;
    if (ticket.timeLeft <= 5 && ticket.timeLeft + dt > 5) event = 'tick';
    if (ticket.timeLeft <= 0) {
      game.tickets = game.tickets.filter((t) => t.id !== ticket.id);
      if (game.activeId === ticket.id) game.activeId = game.tickets[0]?.id ?? null;
      loseLife(game, `Pesanan ${ticket.name} hangus!`);
      event = 'expire';
      if (game.phase !== 'playing') break;
    }
  }
  if (game.comboTimer > 0) game.comboTimer -= dt;
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 40);
  game.pops = game.pops.filter((p) => p.until > Date.now());
  return event;
}
