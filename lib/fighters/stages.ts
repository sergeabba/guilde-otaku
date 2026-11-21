// Arènes de Guilde Fighters : décors originaux en pixel art (384 × 216), peints une fois
// dans un canevas, plus une couche animée légère dessinée à chaque image.
import { FLOOR, STAGE_H, STAGE_W } from "./engine";

export interface Stage {
  id: string;
  name: string;
  romaji: string;
  /** Décor fixe, peint une seule fois. */
  paint: (ctx: CanvasRenderingContext2D) => void;
  /** Éléments animés (neige, néons, vagues…), dessinés à chaque image. */
  animate?: (ctx: CanvasRenderingContext2D, frame: number) => void;
}

const bands = (ctx: CanvasRenderingContext2D, colors: string[], h: number) => {
  const band = h / colors.length;
  colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, Math.round(i * band), STAGE_W, Math.ceil(band) + 1); });
  for (let i = 1; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    const y = Math.round(i * band) - 1;
    for (let x = i % 2; x < STAGE_W; x += 2) ctx.fillRect(x, y, 1, 1);
  }
};
const disc = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y) * 2); ctx.fillRect(cx - w / 2, cy + y, w, 1); }
};
const ridge = (ctx: CanvasRenderingContext2D, base: number, amp: number, f1: number, f2: number, color: string, phase = 0) => {
  ctx.fillStyle = color;
  for (let x = 0; x < STAGE_W; x++) { const h = amp + Math.round(Math.sin(x / f1 + phase) * amp * 0.4 + Math.sin(x / f2) * amp * 0.15); ctx.fillRect(x, base - h, 1, h); }
};
/** Pseudo-hasard stable (le décor est identique à chaque partie). */
const rand = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

// ── Dojo au crépuscule (décor d'origine) ─────────────────────────────────────
function paintDojo(ctx: CanvasRenderingContext2D) {
  bands(ctx, ["#2a1442", "#3d1a52", "#5b2259", "#83305b", "#b4475a", "#e2685a", "#f39a5c", "#fbc276"], 112);
  disc(ctx, 292, 92, 18, "#ffe3a0");
  ridge(ctx, 112, 22, 23, 9, "#4a1f55");
  ridge(ctx, 120, 12, 17, 7, "#32173f", 2);
  ctx.fillStyle = "#3b2230"; ctx.fillRect(0, 112, STAGE_W, 50);
  ctx.fillStyle = "#4d2d3c";
  for (let x = 0; x < STAGE_W; x += 32) ctx.fillRect(x + 2, 116, 28, 40);
  ctx.fillStyle = "#24131d";
  for (let x = 0; x < STAGE_W; x += 32) ctx.fillRect(x, 112, 3, 50);
  ctx.fillRect(0, 112, STAGE_W, 4); ctx.fillRect(0, 158, STAGE_W, 4);
  for (const lx of [48, 176, 304]) {
    ctx.fillStyle = "#24131d"; ctx.fillRect(lx + 4, 116, 1, 6);
    ctx.fillStyle = "#e85b3a"; ctx.fillRect(lx, 122, 9, 11);
    ctx.fillStyle = "#ffb15c"; ctx.fillRect(lx + 2, 124, 5, 7);
    ctx.fillStyle = "#24131d"; ctx.fillRect(lx, 122, 9, 1); ctx.fillRect(lx, 132, 9, 1);
  }
  ctx.fillStyle = "#c9a84c"; ctx.fillRect(150, 136, 84, 16);
  ctx.fillStyle = "#24131d"; ctx.fillRect(150, 136, 84, 1); ctx.fillRect(150, 151, 84, 1);
  ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#24131d";
  ctx.fillText("GUILDE OTAKU", 192, 147);
  ctx.fillStyle = "#1d1018";
  for (let x = 0; x < STAGE_W; x += 7) { const h = 4 + ((x * 13) % 5); ctx.fillRect(x, 162 - h, 6, h + 4); ctx.fillRect(x + 1, 158 - h - 4, 4, 4); }
  const floor = ["#7a4a2c", "#6c4127", "#5f3922", "#53311d"];
  for (let y = 166; y < STAGE_H; y++) { ctx.fillStyle = floor[Math.floor((y - 166) / 6) % floor.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#43271a";
  for (let i = -12; i <= 12; i++) for (let y = 166; y < STAGE_H; y += 2) { const x = STAGE_W / 2 + i * 16 * (1 + (y - 166) / 40); ctx.fillRect(Math.round(x), y, 1, 2); }
  ctx.fillStyle = "#9a6a42"; ctx.fillRect(0, 166, STAGE_W, 1);
  ctx.fillStyle = "rgba(201,168,76,0.35)";
  for (let x = 120; x < 264; x += 2) ctx.fillRect(x, FLOOR + 6, 1, 1);
}
function animateDojo(ctx: CanvasRenderingContext2D, frame: number) {
  // Les lanternes vacillent.
  for (const [i, lx] of [48, 176, 304].entries()) {
    const on = Math.sin(frame / 7 + i * 2) > -0.2;
    ctx.fillStyle = on ? "#ffd27a" : "#ff9a4a"; ctx.fillRect(lx + 3, 125, 3, 5);
  }
}

// ── Toits de la ville, la nuit ───────────────────────────────────────────────
function paintRooftop(ctx: CanvasRenderingContext2D) {
  bands(ctx, ["#070a1e", "#0b1030", "#111a44", "#1a2456", "#25306a", "#33407c"], 120);
  for (let i = 0; i < 70; i++) { ctx.fillStyle = rand(i) > 0.8 ? "#ffffff" : "#9fb3ff"; ctx.fillRect(Math.floor(rand(i + 3) * STAGE_W), Math.floor(rand(i + 9) * 80), 1, 1); }
  disc(ctx, 70, 38, 14, "#f4f1d8"); disc(ctx, 64, 34, 4, "#dcd8b8");
  // Immeubles lointains, puis proches, fenêtres allumées.
  for (const [layer, color, top, win] of [[0, "#141a3a", 70, "#3b4a8a"], [1, "#0c1029", 92, "#ffcf5a"]] as const) {
    let x = layer ? -6 : 0;
    let k = layer * 50;
    while (x < STAGE_W) {
      const w = 22 + Math.floor(rand(k) * 26), h = 30 + Math.floor(rand(k + 1) * (layer ? 50 : 40));
      ctx.fillStyle = color; ctx.fillRect(x, top + 60 - h, w, h + 60);
      for (let wy = top + 64 - h; wy < top + 100; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        if (rand(wx * 3 + wy) > (layer ? 0.62 : 0.75)) { ctx.fillStyle = win; ctx.fillRect(wx, wy, 2, 3); }
      }
      x += w + 3; k += 2;
    }
  }
  // Enseigne au néon (texte original).
  ctx.fillStyle = "#1a0f22"; ctx.fillRect(248, 108, 96, 22);
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#ff4fb0"; ctx.fillText("NAKAMA", 296, 123);
  // Toit : rebord, citerne, antenne, sol en béton.
  ctx.fillStyle = "#2c2f45"; ctx.fillRect(0, 150, STAGE_W, 16);
  ctx.fillStyle = "#3d4160"; ctx.fillRect(0, 150, STAGE_W, 2);
  ctx.fillStyle = "#24263a"; for (let x = 0; x < STAGE_W; x += 24) ctx.fillRect(x, 152, 2, 14);
  ctx.fillStyle = "#3a3348"; ctx.fillRect(22, 112, 30, 38); ctx.fillStyle = "#4b4360"; ctx.fillRect(22, 112, 30, 4);
  ctx.fillStyle = "#555a78"; ctx.fillRect(360, 80, 2, 70); ctx.fillRect(352, 88, 18, 1); ctx.fillRect(355, 98, 12, 1);
  const floor = ["#3a3d52", "#34374b", "#2f3244", "#2a2d3d"];
  for (let y = 166; y < STAGE_H; y++) { ctx.fillStyle = floor[Math.floor((y - 166) / 7) % floor.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#454962"; for (let x = 0; x < STAGE_W; x += 48) ctx.fillRect(x, 166, 1, STAGE_H - 166);
  ctx.fillStyle = "#e8e3a0"; for (let x = 150; x < 234; x += 6) ctx.fillRect(x, FLOOR + 8, 3, 1);
}
function animateRooftop(ctx: CanvasRenderingContext2D, frame: number) {
  // Néon qui grésille, feu de l'antenne qui clignote.
  const flicker = (frame % 180) < 6 && frame % 2 === 0;
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  ctx.fillStyle = flicker ? "#5a1d40" : "#ff7ccc"; ctx.fillText("NAKAMA", 296, 123);
  ctx.fillStyle = Math.floor(frame / 30) % 2 ? "#ff3b3b" : "#5a1010"; ctx.fillRect(360, 78, 2, 2);
}

// ── Temple sous la neige ─────────────────────────────────────────────────────
function paintSnow(ctx: CanvasRenderingContext2D) {
  bands(ctx, ["#9fb4cf", "#adc0d8", "#bccbe0", "#cbd7e8", "#dae3f0", "#e8eef6"], 120);
  ridge(ctx, 112, 40, 31, 11, "#8e9fb8");
  ridge(ctx, 118, 26, 21, 8, "#7a8ca6", 1.4);
  // Sommets enneigés.
  ctx.fillStyle = "#f4f7fb";
  for (let x = 0; x < STAGE_W; x++) { const h = 40 + Math.round(Math.sin(x / 31) * 16 + Math.sin(x / 11) * 6); if (h > 46) ctx.fillRect(x, 112 - h, 1, Math.min(6, h - 46)); }
  // Pins.
  for (const [px, s] of [[24, 1], [58, 0.8], [330, 1.1], [362, 0.85]] as const) {
    ctx.fillStyle = "#2f4a3c";
    for (let i = 0; i < 30 * s; i++) { const w = Math.round(i * 0.6) + 2; ctx.fillRect(px - w / 2, 120 + i, w, 1); }
    ctx.fillStyle = "#f4f7fb"; for (let i = 4; i < 30 * s; i += 7) ctx.fillRect(px - i * 0.3, 120 + i, i * 0.6, 1);
    ctx.fillStyle = "#4a3426"; ctx.fillRect(px - 1, 120 + 30 * s, 3, 10);
  }
  // Temple : toit incurvé, piliers rouges, lanterne de pierre.
  ctx.fillStyle = "#2b2730"; ctx.fillRect(126, 92, 132, 6);
  for (let i = 0; i < 10; i++) { ctx.fillRect(126 - i, 92 + i * 0.4, 1, 3); ctx.fillRect(258 + i, 92 + i * 0.4, 1, 3); }
  ctx.fillStyle = "#f4f7fb"; ctx.fillRect(126, 90, 132, 2);
  ctx.fillStyle = "#3a3440"; ctx.fillRect(136, 98, 112, 8);
  ctx.fillStyle = "#b8322b"; for (const x of [142, 170, 206, 236]) ctx.fillRect(x, 106, 6, 52);
  ctx.fillStyle = "#e9dcc4"; ctx.fillRect(148, 108, 22, 40); ctx.fillRect(176, 108, 30, 40); ctx.fillRect(212, 108, 24, 40);
  ctx.fillStyle = "#c9b896"; for (let y = 112; y < 148; y += 8) ctx.fillRect(148, y, 88, 1);
  ctx.fillStyle = "#8d8a90"; ctx.fillRect(96, 140, 12, 4); ctx.fillRect(99, 128, 6, 12); ctx.fillRect(94, 124, 16, 4);
  ctx.fillStyle = "#ffcf7a"; ctx.fillRect(100, 131, 4, 4);
  // Sol enneigé.
  const floor = ["#eef2f8", "#e4eaf3", "#d9e1ed", "#ced8e6"];
  for (let y = 158; y < STAGE_H; y++) { ctx.fillStyle = floor[Math.floor((y - 158) / 8) % floor.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#c2cddd"; for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rand(i + 40) * STAGE_W), 170 + Math.floor(rand(i + 80) * 40), 3, 1);
}
function animateSnow(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 46; i++) {
    const speed = 0.25 + rand(i) * 0.5;
    const y = (rand(i + 7) * STAGE_H + frame * speed) % STAGE_H;
    const x = (rand(i + 13) * STAGE_W + Math.sin((frame + i * 40) / 50) * 6 + STAGE_W) % STAGE_W;
    ctx.fillRect(Math.round(x), Math.round(y), rand(i + 2) > 0.7 ? 2 : 1, rand(i + 2) > 0.7 ? 2 : 1);
  }
}

// ── Plage d'été ──────────────────────────────────────────────────────────────
function paintBeach(ctx: CanvasRenderingContext2D) {
  bands(ctx, ["#3aa6e8", "#52b3ec", "#6cc0ef", "#88cdf2", "#a6daf4", "#c3e6f6"], 104);
  disc(ctx, 320, 34, 16, "#fff1a8"); disc(ctx, 320, 34, 11, "#fffbe0");
  for (const [cx, cy, w] of [[60, 30, 40], [150, 46, 54], [240, 22, 36]] as const) { ctx.fillStyle = "#ffffff"; ctx.fillRect(cx, cy, w, 6); ctx.fillRect(cx + 6, cy - 4, w - 16, 4); ctx.fillRect(cx + 12, cy - 7, w - 30, 3); }
  // Île au loin, mer.
  ctx.fillStyle = "#3d8a6a"; for (let x = 40; x < 120; x++) { const h = Math.round(Math.sin((x - 40) / 80 * Math.PI) * 14); ctx.fillRect(x, 104 - h, 1, h); }
  const sea = ["#1f7fc4", "#1b74b4", "#176aa6", "#135f97"];
  for (let y = 104; y < 150; y++) { ctx.fillStyle = sea[Math.floor((y - 104) / 12) % sea.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  // Palmiers.
  for (const [px, lean] of [[18, 1], [356, -1]] as const) {
    ctx.fillStyle = "#8a5a32";
    for (let i = 0; i < 70; i++) ctx.fillRect(px + Math.round(lean * i * i / 400), 160 - i, 4, 1);
    const tx = px + Math.round(lean * 4900 / 400), ty = 90;
    ctx.fillStyle = "#2f8a44";
    for (let a = 0; a < 6; a++) { const ang = (a / 6) * Math.PI * 2; for (let r = 0; r < 22; r++) ctx.fillRect(tx + Math.round(Math.cos(ang) * r), ty + Math.round(Math.sin(ang) * r * 0.5 + r * r / 60), 3, 2); }
  }
  // Parasol et sable.
  ctx.fillStyle = "#e9d6a4"; ctx.fillRect(0, 150, STAGE_W, STAGE_H - 150);
  const sand = ["#f2dfae", "#ecd6a1", "#e5cc94", "#ddc287"];
  for (let y = 152; y < STAGE_H; y++) { ctx.fillStyle = sand[Math.floor((y - 152) / 8) % sand.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#c9a86c"; for (let i = 0; i < 80; i++) ctx.fillRect(Math.floor(rand(i + 300) * STAGE_W), 160 + Math.floor(rand(i + 500) * 50), 1, 1);
  ctx.fillStyle = "#6b4b2a"; ctx.fillRect(300, 118, 2, 40);
  for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 6 < 3 ? "#e8412c" : "#fff7e6"; ctx.fillRect(301 - 22 + i * 2.5, 118 - Math.round(Math.sin(i / 17 * Math.PI) * 10), 3, Math.round(Math.sin(i / 17 * Math.PI) * 10) + 2); }
}
function animateBeach(ctx: CanvasRenderingContext2D, frame: number) {
  // Écume qui va et vient, reflets sur la mer.
  const off = Math.sin(frame / 40) * 4;
  ctx.fillStyle = "#e8f6ff";
  for (let x = 0; x < STAGE_W; x += 2) { const y = 148 + Math.round(Math.sin(x / 14 + frame / 30) * 1.5 + off); ctx.fillRect(x, y, 2, 2); }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 18; i++) { const x = (rand(i) * STAGE_W + frame * 0.2) % STAGE_W; const y = 108 + rand(i + 4) * 36; if (Math.sin(frame / 20 + i) > 0.5) ctx.fillRect(Math.round(x), Math.round(y), 4, 1); }
}

// ── Grand stade de la Guilde ─────────────────────────────────────────────────
function paintArena(ctx: CanvasRenderingContext2D) {
  bands(ctx, ["#0d0a14", "#140f1f", "#1b142a", "#231a36"], 80);
  // Gradins pleins, avec des taches de couleur (le public).
  for (let y = 40; y < 150; y += 5) {
    ctx.fillStyle = y % 10 ? "#2a2139" : "#251d33"; ctx.fillRect(0, y, STAGE_W, 5);
    for (let x = (y / 5) % 2 ? 2 : 0; x < STAGE_W; x += 4) {
      const r = rand(x * 7 + y);
      ctx.fillStyle = r > 0.85 ? "#e8412c" : r > 0.7 ? "#c9a84c" : r > 0.55 ? "#4c7bd6" : "#3a2f4c";
      ctx.fillRect(x, y + 1, 2, 3);
    }
  }
  // Écran géant et bannières de la Guilde.
  ctx.fillStyle = "#0a0810"; ctx.fillRect(140, 14, 104, 44);
  ctx.fillStyle = "#c9a84c"; ctx.fillRect(140, 14, 104, 2); ctx.fillRect(140, 56, 104, 2);
  ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#e8412c"; ctx.fillText("GUILDE", 192, 34);
  ctx.fillStyle = "#f6f0e6"; ctx.fillText("FIGHTERS", 192, 48);
  for (const bx of [20, 330]) { ctx.fillStyle = bx < 100 ? "#e8412c" : "#3f7ad8"; ctx.fillRect(bx, 20, 34, 60); ctx.fillStyle = "#0d0a14"; ctx.fillRect(bx + 14, 28, 6, 40); }
  // Barrière publicitaire et ring.
  ctx.fillStyle = "#16121f"; ctx.fillRect(0, 150, STAGE_W, 14);
  ctx.fillStyle = "#c9a84c"; ctx.fillRect(0, 150, STAGE_W, 1);
  ctx.font = "bold 8px monospace"; ctx.fillStyle = "#6c6280"; for (let x = 30; x < STAGE_W; x += 96) ctx.fillText("ASOBI · TATAKAI", x + 20, 160);
  const floor = ["#3a2a52", "#33254a", "#2d2142", "#271d3a"];
  for (let y = 164; y < STAGE_H; y++) { ctx.fillStyle = floor[Math.floor((y - 164) / 7) % floor.length]; ctx.fillRect(0, y, STAGE_W, 1); }
  ctx.fillStyle = "#c9a84c"; ctx.fillRect(0, 164, STAGE_W, 1);
  ctx.fillStyle = "rgba(232,65,44,0.5)"; for (let x = 96; x < 288; x += 3) ctx.fillRect(x, FLOOR + 7, 2, 1);
}
function animateArena(ctx: CanvasRenderingContext2D, frame: number) {
  // Projecteurs qui balaient, flashs d'appareils photo dans le public.
  for (const [i, base] of [[0, 60], [1, 324]] as const) {
    const a = Math.sin(frame / 90 + i * 2) * 0.5;
    ctx.fillStyle = "rgba(255,240,200,0.06)";
    ctx.beginPath(); ctx.moveTo(base, 0); ctx.lineTo(base + 120 * Math.sin(a) - 30, STAGE_H); ctx.lineTo(base + 120 * Math.sin(a) + 30, STAGE_H); ctx.closePath(); ctx.fill();
  }
  if (frame % 9 === 0) { ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.floor(rand(frame) * STAGE_W), 42 + Math.floor(rand(frame + 1) * 100), 2, 2); }
}

export const STAGES: Stage[] = [
  { id: "dojo", name: "Dojo au crépuscule", romaji: "Yūyake Dōjō", paint: paintDojo, animate: animateDojo },
  { id: "toits", name: "Toits de la ville", romaji: "Yoru no Okujō", paint: paintRooftop, animate: animateRooftop },
  { id: "temple", name: "Temple sous la neige", romaji: "Yuki no Tera", paint: paintSnow, animate: animateSnow },
  { id: "plage", name: "Plage d'été", romaji: "Natsu no Hama", paint: paintBeach, animate: animateBeach },
  { id: "stade", name: "Grand stade de la Guilde", romaji: "Dai Kyōgijō", paint: paintArena, animate: animateArena },
];
export const stageById = (id: string | null | undefined) => STAGES.find((s) => s.id === id) ?? STAGES[0];
