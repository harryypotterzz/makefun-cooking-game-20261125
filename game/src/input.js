// Dapur Kilat — mouse and keyboard input.
// Pointer hits are tested against the same layout render.js draws, so a
// button is clickable exactly where it looks clickable.

import { INGREDIENTS } from './config.js';
import { layout } from './render.js';
import { addIngredient, clearPlate, serveOrder, startShift } from './state.js';

function inside(box, x, y) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export function attachInput(canvas, game, audio) {
  const L = layout();

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (1280 / rect.width),
      y: (event.clientY - rect.top) * (720 / rect.height),
    };
  }

  function clickAt(x, y) {
    if (game.phase === 'title') {
      if (inside(L.start, x, y)) {
        audio.resume();
        startShift(game);
        audio.play('start');
      }
      return;
    }
    if (game.phase === 'over') {
      if (inside(L.restart, x, y)) {
        audio.resume();
        startShift(game);
        audio.play('start');
      }
      return;
    }
    for (const bin of L.bins) {
      if (inside(bin, x, y)) {
        const result = addIngredient(game, bin.id);
        if (result === true) audio.play('add');
        else if (result === 'dup' || result === 'full') audio.play('bad');
        return;
      }
    }
    for (let i = 0; i < game.tickets.length; i++) {
      if (inside(L.tickets[i], x, y)) {
        game.activeId = game.tickets[i].id;
        audio.play('pick');
        return;
      }
    }
    if (inside(L.serve, x, y)) {
      const result = serveOrder(game);
      if (result === true) audio.play('serve');
      else if (result === 'mismatch') audio.play('bad');
      return;
    }
    if (inside(L.clear, x, y)) {
      clearPlate(game);
      audio.play('pick');
    }
  }

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toGameCoords(event);
    clickAt(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      game.muted = !game.muted;
      return;
    }
    if (key === 'p' && game.phase === 'playing') {
      game.phase = 'paused';
      return;
    }
    if (key === 'p' && game.phase === 'paused') {
      game.phase = 'playing';
      return;
    }
    if (key === 'r' && (game.phase === 'over' || game.phase === 'title')) {
      audio.resume();
      startShift(game);
      audio.play('start');
      return;
    }
    if (game.phase === 'title' && (key === 'enter' || key === ' ')) {
      audio.resume();
      startShift(game);
      audio.play('start');
      return;
    }
    if (game.phase !== 'playing') return;
    const ing = INGREDIENTS.find((i) => i.key === key);
    if (ing) {
      const result = addIngredient(game, ing.id);
      if (result === true) audio.play('add');
      else audio.play('bad');
      return;
    }
    if (key === ' ') {
      event.preventDefault();
      const result = serveOrder(game);
      if (result === true) audio.play('serve');
      else if (result === 'mismatch') audio.play('bad');
    } else if (key === 'c') {
      clearPlate(game);
      audio.play('pick');
    } else if (key === 'tab') {
      event.preventDefault();
      if (game.tickets.length > 1) {
        const idx = game.tickets.findIndex((t) => t.id === game.activeId);
        game.activeId = game.tickets[(idx + 1) % game.tickets.length].id;
        audio.play('pick');
      }
    }
  });
}
