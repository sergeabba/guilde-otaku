import { Rank } from "../../data/members";
export type { Rank };

// ─── COULEURS PRINCIPALES PAR RANG ───────────────────────────────────────────
export const rankAccents: Record<Rank | "Tous", string> = {
  "Fondateur":      "#f59e0b",
  "Monarque":       "#c9a84c",
  "Ex Monarque":    "#fb923c",
  "Ordre Céleste":  "#7c3aed",
  "New G dorée":    "#db2777",
  "Futurs Espoirs": "#2563eb",
  "Vieux Briscard": "#0d9488",
  "Fantôme":        "#64748b",
  "Revenant":       "#8b5cf6",
  "Tous":           "#c9a84c",
};

// ─── THÈMES COMPLETS (bg, nav, texte) ────────────────────────────────────────
export const rankBg: Record<Rank | "Tous", { bg: string; nav: string; text: string }> = {
  "Tous":           { bg: "#fcfaf8", nav: "rgba(252,250,248,0.75)", text: "#111" },
  "Fondateur":      { bg: "#0a0800", nav: "rgba(10,8,0,0.92)",      text: "#fff" },
  "Monarque":       { bg: "#09080a", nav: "rgba(9,8,10,0.92)",       text: "#fff" },
  "Ex Monarque":    { bg: "#0d0700", nav: "rgba(13,7,0,0.92)",       text: "#fff" },
  "Ordre Céleste":  { bg: "#06030f", nav: "rgba(6,3,15,0.92)",       text: "#fff" },
  "New G dorée":    { bg: "#fff0f6", nav: "rgba(255,240,246,0.92)",  text: "#111" },
  "Futurs Espoirs": { bg: "#f0f5ff", nav: "rgba(240,245,255,0.92)",  text: "#111" },
  "Vieux Briscard": { bg: "#f0fafa", nav: "rgba(240,250,250,0.92)",  text: "#111" },
  "Fantôme":        { bg: "#f2f2f2", nav: "rgba(242,242,242,0.92)",  text: "#111" },
  "Revenant":       { bg: "#08030f", nav: "rgba(8,3,15,0.92)",       text: "#fff" },
};

// ─── RANGS SOMBRES (texte blanc) ─────────────────────────────────────────────
export const darkRanks: Rank[] = [
  "Fondateur",
  "Monarque",
  "Ex Monarque",
  "Ordre Céleste",
  "Revenant",
];

// ─── LOGOS PAR RANG ───────────────────────────────────────────────────────────
export const rankLogos: Record<Rank, string> = {
  "Fondateur":      "/ranks/fondateur.png",
  "Monarque":       "/ranks/monarque.png",
  "Ex Monarque":    "/ranks/ex-monarque.png",
  "Ordre Céleste":  "/ranks/ordre-celeste.png",
  "New G dorée":    "/ranks/new-g-doree.png",
  "Futurs Espoirs": "/ranks/futurs-espoirs.png",
  "Vieux Briscard": "/ranks/vieux-briscard.png",
  "Fantôme":        "/ranks/fantome.png",
  "Revenant":       "/ranks/revenant.png",
};

// ─── RANGS EN JAPONAIS (AESTHETIC MANGA / ANIME) ───────────────────────────
export const rankJapanese: Record<Rank | "Tous", string> = {
  "Fondateur":      "創設者",
  "Monarque":       "君主",
  "Ex Monarque":    "先代君主",
  "Ordre Céleste":  "天の騎士",
  "New G dorée":    "新世代",
  "Futurs Espoirs": "若き希望",
  "Vieux Briscard": "歴戦の勇士",
  "Fantôme":        "亡霊",
  "Revenant":       "再生者",
  "Tous":           "全メンバー",
};

// ─── HELPER : couleur d'un rang ───────────────────────────────────────────────
export function getRankAccent(rank: Rank | "Tous"): string {
  return rankAccents[rank] ?? "#c9a84c";
}

// ─── HELPER : est-ce un rang sombre ? ────────────────────────────────────────
export function isDarkRank(rank: Rank | "Tous"): boolean {
  return darkRanks.includes(rank as Rank);
}

