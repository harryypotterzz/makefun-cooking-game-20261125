// Dapur Kilat — all canvas drawing.
// One canvas, one view (1280x720), everything drawn in code: the kitchen,
// the order board, the ingredient counter, the plate being assembled, the
// timer, and the overlays. No images, no network, no fonts to fetch.

import { VIEW_W, VIEW_H, INGREDIENTS, ING_BY_ID, MAX_LIVES } from './config.js';
import { activeTicket, plateMatches } from './state.js';

// Geometry of every clickable region, shared with input.js.
export function layout() {
  const bins = INGREDIENTS.map((ing, i) => ({
    id: ing.id,
    x: 90 + i * 185,
    y: 330,
    w: 160,
    h: 128,
  }));
  return {
    bins,
    tickets: [0, 1, 2].map((i) => ({ x: 40 + i * 410, y: 100, w: 380, h: 140 })),
    serve: { x: 920, y: 548, w: 240, h: 92 },
    clear: { x: 120, y: 560, w: 170, h: 68 },
    plate: { x: 430, y: 520, w: 420, h: 150 },
    start: { x: 440, y: 470, w: 400, h: 84 },
    restart: { x: 440, y: 520, w: 400, h: 84 },
    mute: { x: 1212, y: 12, w: 56, h: 40 },
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- ingredient glyphs, drawn in code inside a circle of radius r ---

function glyph(ctx, kind, cx, cy, r) {
  ctx.save();
  ctx.lineWidth = Math.max(2, r * 0.12);
  if (kind === 'rice') {
    ctx.fillStyle = '#fffdf2';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.25, r * 0.85, r * 0.55, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#cbbf9a';
    ctx.stroke();
    ctx.fillStyle = '#e8dfc0';
    for (const [dx, dy] of [[-0.4, -0.1], [0, -0.3], [0.4, -0.05]]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx * r, cy + dy * r, r * 0.12, r * 0.07, dx, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'drumstick') {
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.75, cy + r * 0.75);
    ctx.stroke();
    ctx.fillStyle = '#f5f5f5';
    for (const [dx, dy] of [[0.62, 0.88], [0.88, 0.62]]) {
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c47a2e';
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.1, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a04c';
    ctx.beginPath();
    ctx.arc(cx - r * 0.18, cy - r * 0.18, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.8, r * 0.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c690';
    ctx.stroke();
    ctx.fillStyle = '#f7b733';
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy, r * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'leaf') {
    ctx.fillStyle = '#58a34c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.75, r * 0.45, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7bc96f';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.1, cy - r * 0.1, r * 0.5, r * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e7d32';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.7, cy - r * 0.3);
    ctx.stroke();
  } else if (kind === 'chili') {
    ctx.strokeStyle = '#c62828';
    ctx.lineWidth = r * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.6, Math.PI * 0.15, Math.PI * 0.95);
    ctx.stroke();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy - r * 0.55);
    ctx.lineTo(cx - r * 0.75, cy - r * 0.85);
    ctx.stroke();
  } else if (kind === 'cracker') {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2 + 0.01; a += Math.PI / 6) {
      const rad = r * (0.72 + 0.18 * Math.sin(a * 3));
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b98a1d';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.fillStyle = '#d89b2b';
    for (const [dx, dy] of [[-0.3, -0.2], [0.25, 0.1], [0, -0.4]]) {
      ctx.beginPath();
      ctx.arc(cx + dx * r, cy + dy * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// --- background: the warung kitchen ---

function drawKitchen(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  wall.addColorStop(0, '#fbe3b0');
  wall.addColorStop(0.55, '#f7cf8e');
  wall.addColorStop(1, '#e8b06a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Tile backsplash band behind the counter.
  ctx.fillStyle = '#7fb3a3';
  ctx.fillRect(0, 268, VIEW_W, 62);
  ctx.fillStyle = '#8fc4b4';
  for (let x = 0; x < VIEW_W; x += 42) {
    for (let y = 268; y < 330; y += 31) {
      ctx.fillRect(x + 2, y + 2, 38, 27);
    }
  }
  ctx.fillStyle = '#5d8f80';
  ctx.fillRect(0, 326, VIEW_W, 4);

  // Wooden counter.
  const wood = ctx.createLinearGradient(0, 470, 0, 520);
  wood.addColorStop(0, '#a9713f');
  wood.addColorStop(1, '#7d4f27');
  ctx.fillStyle = wood;
  ctx.fillRect(0, 470, VIEW_W, 50);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 470, VIEW_W, 6);
  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(0, 516, VIEW_W, 204);
  ctx.fillStyle = '#6d4423';
  for (let x = 40; x < VIEW_W; x += 120) ctx.fillRect(x, 516, 4, 204);
}

// --- HUD ---

function drawHud(ctx, game) {
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 0, VIEW_W, 64);
  text(ctx, 'DAPUR KILAT', 24, 33, 30, '#ffd54a', 'left');
  text(ctx, 'Warung Rush', 270, 34, 15, '#ffccbc', 'left', 600);
  text(ctx, `SKOR ${game.score}`, 430, 33, 24, '#ffffff', 'left');
  text(ctx, `KOIN ${game.coins}`, 640, 33, 24, '#ffd54a', 'left');
  text(ctx, `LEVEL ${game.level}`, 800, 33, 22, '#a5d6a7', 'left');
  for (let i = 0; i < MAX_LIVES; i++) {
    const x = 910 + i * 32;
    const y = 32;
    ctx.fillStyle = i < game.lives ? '#ef5350' : '#5d4037';
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.bezierCurveTo(x - 14, y - 4, x - 8, y - 16, x, y - 6);
    ctx.bezierCurveTo(x + 8, y - 16, x + 14, y - 4, x, y + 10);
    ctx.fill();
  }
  // Shift timer: a bar plus the seconds left.
  const frac = Math.max(0, game.shiftLeft / 120);
  ctx.fillStyle = '#5d4037';
  rr(ctx, 1010, 20, 105, 24, 12);
  ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#66bb6a' : '#ef5350';
  rr(ctx, 1010, 20, 105 * frac, 24, 12);
  ctx.fill();
  text(ctx, `${Math.ceil(game.shiftLeft)} dtk`, 1062, 33, 16, '#ffffff');
  text(ctx, game.muted ? 'SUARA: MATI (M)' : 'SUARA: NYALA (M)', 1268, 33, 12, '#bcaaa4', 'right', 600);
}

// --- order board ---

function drawBoard(ctx, game, L) {
  ctx.fillStyle = '#37474f';
  rr(ctx, 24, 76, VIEW_W - 48, 178, 12);
  ctx.fill();
  ctx.fillStyle = '#455a64';
  ctx.fillRect(24, 76, VIEW_W - 48, 10);
  text(ctx, 'PAPAN PESANAN  —  klik tiket untuk memilih, lalu rakit di piring', 40, 88, 15, '#b0bec5', 'left', 600);
  game.tickets.forEach((ticket, i) => {
    const box = L.tickets[i];
    if (!box) return;
    const isActive = game.activeId === ticket.id;
    const frac = Math.max(0, ticket.timeLeft / ticket.timeMax);
    const urgent = ticket.timeLeft <= 6;
    ctx.fillStyle = isActive ? '#fff8e1' : '#eceff1';
    rr(ctx, box.x, box.y, box.w, box.h, 10);
    ctx.fill();
    ctx.lineWidth = isActive ? 5 : 2;
    ctx.strokeStyle = isActive ? '#ff7043' : urgent ? '#e53935' : '#90a4ae';
    ctx.stroke();
    if (isActive) {
      ctx.fillStyle = '#ff7043';
      rr(ctx, box.x + box.w - 92, box.y + 8, 84, 22, 11);
      ctx.fill();
      text(ctx, 'DIPILIH', box.x + box.w - 50, box.y + 20, 13, '#ffffff');
    }
    text(ctx, ticket.name, box.x + 16, box.y + 30, 21, '#263238', 'left');
    // Ingredient chips the dish needs.
    ticket.needs.forEach((id, j) => {
      const ing = ING_BY_ID[id];
      const cx = box.x + 30 + j * 92;
      const cy = box.y + 74;
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = ing.edge;
      ctx.stroke();
      glyph(ctx, ing.glyph, cx, cy, 15);
      text(ctx, ing.name, cx, cy + 34, 13, '#455a64');
      if (game.plate.includes(id)) {
        ctx.strokeStyle = '#2e7d32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy);
        ctx.lineTo(cx - 3, cy + 7);
        ctx.lineTo(cx + 10, cy - 7);
        ctx.stroke();
      }
    });
    // Countdown bar.
    ctx.fillStyle = '#cfd8dc';
    rr(ctx, box.x + 16, box.y + 116, box.w - 32, 14, 7);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#66bb6a' : frac > 0.25 ? '#ffa726' : '#e53935';
    rr(ctx, box.x + 16, box.y + 116, (box.w - 32) * frac, 14, 7);
    ctx.fill();
    text(ctx, `${Math.ceil(ticket.timeLeft)} dtk`, box.x + box.w - 16, box.y + 44, 15, urgent ? '#c62828' : '#546e7a', 'right');
  });
  if (game.tickets.length === 0) {
    text(ctx, 'Belum ada pesanan — tunggu sebentar…', 640, 180, 20, '#eceff1');
  }
}

// --- ingredient counter ---

function drawCounter(ctx, game, L) {
  text(ctx, 'BAHAN DI COUNTER  —  klik bahan (atau tekan 1–6) untuk menambah ke piring', 640, 306, 16, '#5d4037', 'center', 600);
  L.bins.forEach((bin) => {
    const ing = ING_BY_ID[bin.id];
    const onPlate = game.plate.includes(bin.id);
    ctx.fillStyle = onPlate ? '#fff3e0' : '#fffdf6';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 14);
    ctx.fill();
    ctx.lineWidth = onPlate ? 5 : 2;
    ctx.strokeStyle = onPlate ? '#2e7d32' : ing.edge;
    ctx.stroke();
    glyph(ctx, ing.glyph, bin.x + bin.w / 2, bin.y + 48, 34);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 96, 20, '#3e2723');
    ctx.fillStyle = '#8d6e63';
    rr(ctx, bin.x + bin.w - 34, bin.y + 8, 26, 22, 6);
    ctx.fill();
    text(ctx, ing.key, bin.x + bin.w - 21, bin.y + 20, 14, '#ffffff');
    if (onPlate) text(ctx, '✓ DI PIRING', bin.x + bin.w / 2, bin.y + 118, 12, '#2e7d32');
  });
}

// --- plate, serve button, clear button ---

function drawPlateArea(ctx, game, L) {
  const ready = plateMatches(game);
  const ticket = activeTicket(game);

  // Serving station label, on the wooden counter band above the plate.
  text(ctx, ticket ? `MERAKIT: ${ticket.name}` : 'Pilih pesanan di papan dulu', 640, 498, 18, '#fff3e0', 'center', 600);

  // The plate.
  const p = L.plate;
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2 + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 34, 200, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fafafa';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 200, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bcaaa4';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#eceff1';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  if (game.plate.length === 0) {
    text(ctx, 'Piring kosong — klik bahan di atas', cx, cy, 17, '#90a4ae', 'center', 600);
  } else {
    game.plate.forEach((id, i) => {
      const ing = ING_BY_ID[id];
      const gx = cx - 90 + i * 62 + (game.plate.length === 1 ? 90 : 0);
      const gy = cy - 6 + (i % 2) * 10;
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(gx, gy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = ing.edge;
      ctx.stroke();
      glyph(ctx, ing.glyph, gx, gy, 19);
    });
    text(ctx, `${game.plate.length} bahan di piring`, cx, cy + 46, 14, '#616161', 'center', 600);
  }

  // Serve button.
  const s = L.serve;
  ctx.fillStyle = ready ? '#43a047' : '#9e9e9e';
  rr(ctx, s.x, s.y, s.w, s.h, 16);
  ctx.fill();
  if (ready) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffd54a';
    ctx.stroke();
  }
  text(ctx, ready ? 'SAJIKAN!' : 'SAJIKAN', s.x + s.w / 2, s.y + 34, 30, '#ffffff');
  text(ctx, ready ? 'Siap disajikan — Spasi' : 'Lengkapi pesanan dulu', s.x + s.w / 2, s.y + 66, 14, ready ? '#e8f5e9' : '#e0e0e0', 'center', 600);

  // Clear button.
  const c = L.clear;
  ctx.fillStyle = '#efebe9';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8d6e63';
  ctx.stroke();
  text(ctx, 'BERSIHKAN', c.x + c.w / 2, c.y + 26, 18, '#5d4037');
  text(ctx, 'tombol C', c.x + c.w / 2, c.y + 50, 13, '#8d6e63', 'center', 600);

  // Floating score pops.
  const now = Date.now();
  for (const pop of game.pops) {
    const age = 1 - (pop.until - now) / 1100;
    ctx.globalAlpha = Math.max(0, 1 - age);
    text(ctx, pop.text, pop.x, pop.y - age * 46, 30, pop.color);
    ctx.globalAlpha = 1;
  }
  if (game.message && game.message.until > now) {
    ctx.fillStyle = 'rgba(62,39,35,0.9)';
    rr(ctx, 390, 690, 500, 26, 13);
    ctx.fill();
    text(ctx, game.message.text, 640, 703, 16, '#ffffff', 'center', 600);
  }
}

function drawOverlays(ctx, game, L) {
  if (game.phase === 'title') {
    ctx.fillStyle = 'rgba(38,20,8,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'DAPUR KILAT', 640, 150, 72, '#ffd54a');
    text(ctx, 'Warung Rush — rakit pesanan sebelum pelanggan kabur!', 640, 210, 24, '#ffffff', 'center', 600);
    text(ctx, 'Klik tiket pesanan di papan, lalu klik bahan di counter.', 640, 280, 20, '#ffccbc', 'center', 600);
    text(ctx, 'Lengkapi piring, lalu tekan SAJIKAN (atau Spasi).', 640, 312, 20, '#ffccbc', 'center', 600);
    text(ctx, 'Tombol 1–6 = bahan  •  C = bersihkan piring  •  P = jeda  •  M = suara', 640, 344, 18, '#bcaaa4', 'center', 600);
    const b = L.start;
    ctx.fillStyle = '#43a047';
    rr(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();
    text(ctx, 'MULAI SHIFT (120 dtk)', b.x + b.w / 2, b.y + b.h / 2, 26, '#ffffff');
    if (game.best > 0) text(ctx, `Skor terbaik: ${game.best}`, 640, 600, 18, '#ffd54a', 'center', 600);
  } else if (game.phase === 'over') {
    ctx.fillStyle = 'rgba(38,20,8,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const closed = game.lives <= 0;
    text(ctx, closed ? 'WARUNG TUTUP!' : 'SHIFT SELESAI!', 640, 170, 64, '#ffd54a');
    text(ctx, closed ? 'Nyawa habis — terlalu banyak pesanan hangus.' : 'Waktu shift habis — warung istirahat dulu.', 640, 230, 22, '#ffffff', 'center', 600);
    text(ctx, `SKOR AKHIR: ${game.score}`, 640, 310, 36, '#ffffff');
    text(ctx, `Pesanan tersaji: ${game.served}   •   Koin: ${game.coins}   •   Level: ${game.level}`, 640, 366, 22, '#ffccbc', 'center', 600);
    text(ctx, `Skor terbaik: ${game.best}`, 640, 404, 20, '#ffd54a', 'center', 600);
    const b = L.restart;
    ctx.fillStyle = '#43a047';
    rr(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();
    text(ctx, 'MAIN LAGI (R)', b.x + b.w / 2, b.y + b.h / 2, 26, '#ffffff');
  }
}

export function drawGame(ctx, game) {
  const L = layout();
  ctx.save();
  if (game.shake > 0) {
    const s = game.shake;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawKitchen(ctx);
  drawHud(ctx, game);
  if (game.phase !== 'title') {
    drawBoard(ctx, game, L);
    drawCounter(ctx, game, L);
    drawPlateArea(ctx, game, L);
  }
  if (game.flash && game.flash.until > Date.now()) {
    ctx.fillStyle = game.flash.kind === 'good' ? 'rgba(76,175,80,0.18)' : 'rgba(229,57,53,0.20)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  drawOverlays(ctx, game, L);
  ctx.restore();
}
