// Dapur Kilat — tuning, ingredients and dishes.
// Everything here is original: a small Indonesian warung kitchen where the
// player assembles orders from ingredients on the counter.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 120;
export const MAX_LIVES = 3;
export const MAX_TICKETS = 3;

// Six ingredients that live in bins on the counter. Each one has a short
// Indonesian name, a display colour and a one-letter key for the keyboard.
export const INGREDIENTS = [
  { id: 'nasi',    name: 'Nasi',    short: 'NASI',    key: '1', color: '#f5f0dc', edge: '#cbbf9a', glyph: 'rice' },
  { id: 'ayam',    name: 'Ayam',    short: 'AYAM',    key: '2', color: '#e8a04c', edge: '#a8661f', glyph: 'drumstick' },
  { id: 'telur',   name: 'Telur',   short: 'TELUR',   key: '3', color: '#ffe9a8', edge: '#c9a13b', glyph: 'egg' },
  { id: 'sayur',   name: 'Sayur',   short: 'SAYUR',   key: '4', color: '#7bc96f', edge: '#3e7d32', glyph: 'leaf' },
  { id: 'sambal',  name: 'Sambal',  short: 'SAMBAL',  key: '5', color: '#e0393e', edge: '#8f1d20', glyph: 'chili' },
  { id: 'kerupuk', name: 'Kerupuk', short: 'KRUPUK',  key: '6', color: '#f2c14e', edge: '#b98a1d', glyph: 'cracker' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// The warung's menu. A dish is a set of ingredients; the order of the list
// is the order the ticket shows them in. Dishes marked `late` only appear
// once the player has served a few orders (level 2+).
export const DISHES = [
  { id: 'geprek',   name: 'Nasi Ayam Geprek',  needs: ['nasi', 'ayam', 'sambal'],           time: 26 },
  { id: 'dadar',    name: 'Nasi Telur Dadar',  needs: ['nasi', 'telur', 'sayur'],            time: 26 },
  { id: 'sambal',   name: 'Telur Sambal',      needs: ['telur', 'sambal'],                    time: 22 },
  { id: 'krupuk',   name: 'Ayam Kerupuk',      needs: ['ayam', 'kerupuk', 'sambal'],           time: 26 },
  { id: 'komplit',  name: 'Nasi Ayam Komplit', needs: ['nasi', 'ayam', 'sayur', 'kerupuk'],   time: 32, late: true },
  { id: 'sayur',    name: 'Nasi Sayur Komplit', needs: ['nasi', 'sayur', 'telur', 'kerupuk'], time: 32, late: true },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// How fast new tickets arrive, and how generous their timers are, per level.
export const LEVELS = [
  { spawnEvery: 6.0, timeScale: 1.0, pool: DISHES.filter((d) => !d.late) },
  { spawnEvery: 5.0, timeScale: 0.92, pool: DISHES },
  { spawnEvery: 4.2, timeScale: 0.85, pool: DISHES },
  { spawnEvery: 3.6, timeScale: 0.78, pool: DISHES },
];

export const SERVE_BASE = 100;      // points for a correct serve
export const SERVE_TIME_BONUS = 5;  // extra points per second left on the ticket
export const COMBO_WINDOW = 6;      // seconds between serves to keep the combo

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
