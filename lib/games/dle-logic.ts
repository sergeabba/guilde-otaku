// Jeux « à indices » du jour : Devine l'anime (6 essais) et Devine le perso.
// Fonctions pures : tirage du jour, comparaison d'un essai, points, indices.
import type { Level } from "./levels";
import { seeded } from "./token";

export const DLE_TRIES = 6;
/** Expert : Devine l'anime en 5 essais seulement. */
export const animeTries = (level: Level) => (level === "expert" ? 5 : DLE_TRIES);
/** 100 points du premier coup, 15 de moins par essai en plus ; 0 si raté. */
export const dlePoints = (tries: number | null) => (tries && tries >= 1 && tries <= DLE_TRIES ? 100 - (tries - 1) * 15 : 0);

/** Index du jour dans une liste : le même pour tout le monde à une date donnée. */
export function pickDaily(date: string, length: number, salt: string): number {
  return Math.floor(seeded(`${salt}-${date}`)() * length);
}

export interface DleAnime { id: number; title: string; alt: string | null; cover: string; year: number; format: string; episodes: number | null; score: number; genres: string[]; studio: string | null; source: string | null; tags?: string[]; rank?: number }
export type Dir = "eq" | "up" | "down";
export interface AnimeFeedback {
  id: number; title: string; cover: string; ok: boolean;
  year: { value: number; dir: Dir; near: boolean };
  score: { value: number; dir: Dir; near: boolean };
  episodes: { value: number | null; dir: Dir | null; near: boolean };
  format: { value: string; ok: boolean };
  studio: { value: string | null; ok: boolean };
  source: { value: string | null; ok: boolean };
  genres: { value: string[]; shared: string[]; all: boolean };
}

const dir = (guess: number, secret: number): Dir => (secret === guess ? "eq" : secret > guess ? "up" : "down");

/** Ce que l'essai a en commun avec l'anime mystère (flèche : l'anime mystère est plus haut / plus bas). */
export function compareAnime(g: DleAnime, s: DleAnime): AnimeFeedback {
  const shared = g.genres.filter((x) => s.genres.includes(x));
  return {
    id: g.id, title: g.title, cover: g.cover, ok: g.id === s.id,
    year: { value: g.year, dir: dir(g.year, s.year), near: Math.abs(g.year - s.year) <= 2 },
    score: { value: g.score, dir: dir(g.score, s.score), near: Math.abs(g.score - s.score) <= 3 },
    episodes: { value: g.episodes, dir: g.episodes != null && s.episodes != null ? dir(g.episodes, s.episodes) : null, near: g.episodes != null && s.episodes != null && Math.abs(g.episodes - s.episodes) <= 6 },
    format: { value: g.format, ok: g.format === s.format },
    studio: { value: g.studio, ok: !!g.studio && g.studio === s.studio },
    source: { value: g.source, ok: !!g.source && g.source === s.source },
    genres: { value: g.genres, shared, all: shared.length === s.genres.length && g.genres.length === s.genres.length },
  };
}

export interface DleChar { id: number; name: string; alt: string[]; image: string; gender: string | null; age: string | null; role: string; anime: string; animeId: number; year: number | null; genres: string[]; voice?: string | null; rank?: number; studio?: string | null; themes?: string[] }
export interface CharHint { label: string; value: string; kind: "text" | "image" }

/** « Monkey D. Luffy » → « M····· D. L···· (6, 1, 5 lettres) » : initiales et longueur de chaque mot. */
export function nameShape(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const shape = words.map((w) => (w.length <= 2 && w.endsWith(".") ? w : `${w[0]}${"·".repeat(Math.max(0, w.length - 1))}`)).join(" ");
  const lengths = words.map((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length);
  return `${shape} (${lengths.join(", ")} lettre${lengths.length === 1 && lengths[0] < 2 ? "" : "s"})`;
}

/** Ce qu'un essai a en commun avec le perso mystère (comme Devine l'anime, case par case). */
export function compareChar(g: DleChar, s: DleChar) {
  const shared = g.genres.filter((x) => s.genres.includes(x));
  return {
    id: g.id, name: g.name, anime: g.anime, image: g.image, ok: g.id === s.id,
    sameAnime: g.animeId === s.animeId,
    sameGender: !!g.gender && g.gender === s.gender,
    gender: g.gender,
    sameRole: g.role === s.role, role: g.role,
    year: g.year != null && s.year != null ? { value: g.year, dir: dir(g.year, s.year), near: Math.abs(g.year - s.year) <= 2 } : null,
    genres: { value: g.genres.slice(0, 3), shared: shared.slice(0, 3) },
    sameStudio: !!g.studio && g.studio === s.studio, studio: g.studio ?? null,
  };
}
export type CharVerdict = ReturnType<typeof compareChar>;

/**
 * Indices du perso mystère : une base dès le départ, puis un indice de plus à chaque essai
 * raté, du plus vague (studio, thèmes) au plus précis (portrait presque net, initiales).
 * L'image nette n'est envoyée qu'à la fin.
 */
export function charHints(c: DleChar, wrong: number, imageUrl: (level: 1 | 2 | 3) => string, level: Level = "normal"): CharHint[] {
  const t = (label: string, value: string | null | undefined): CharHint[] => (value ? [{ label, value, kind: "text" }] : []);
  const anime = t("Anime", c.anime);
  const base = [...t("Rôle", c.role), ...t("Genre", c.gender), ...t("Âge", c.age)];
  const genres = [...t("Son anime : genres", c.genres.slice(0, 3).join(", ")), ...t("Son anime : année", c.year ? String(c.year) : null)];
  const studio = t("Son anime : studio", c.studio);
  const themes = t("Son anime : thèmes", (c.themes ?? []).slice(0, level === "expert" ? 2 : 3).join(", "));
  const pix = (n: 1 | 2 | 3, label: string): CharHint => ({ label, value: imageUrl(n), kind: "image" });
  const pix1 = pix(1, "Portrait (très flou)"), pix2 = pix(2, "Portrait (flou)"), pix3 = pix(3, "Portrait (presque net)");
  const voice = t("Doubleur japonais", c.voice);
  const shape = t("Son nom", nameShape(c.name));
  const [start, steps]: [CharHint[], CharHint[][]] = level === "facile"
    ? [[...base, ...anime, ...genres, pix1], [[pix2, ...studio, ...themes], [...voice, pix3], shape, shape, shape]]
    : level === "expert"
      ? [base, [[...genres, ...studio, ...themes], [pix1], voice.length ? voice : [pix2], [...anime, pix2], [pix3, ...shape]]]
      : [[...base, ...genres], [[pix1, ...studio, ...themes], anime, [pix2, ...voice], [pix3], shape]];
  const out = [...start, ...steps.slice(0, Math.min(wrong, steps.length)).flat()];
  return out.filter((h, i) => out.findIndex((x) => x.label === h.label && x.value === h.value) === i);
}

export interface AnimeHint { label: string; value: string }
/** « Commence par S, 3 mots » : sans révéler le titre. */
export function titleShape(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const first = title.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "?";
  return `Commence par « ${first} », ${words.length} mot${words.length > 1 ? "s" : ""}`;
}
/**
 * Indices de Devine l'anime, en plus des comparaisons : ses thèmes, puis la forme de son titre.
 * Facile : thèmes dès le 1er raté, titre au 2e ; Normal : 1er et 3e ; Expert : 2e et 4e.
 */
export function animeHints(a: DleAnime, wrong: number, level: Level = "normal"): AnimeHint[] {
  const [themesAt, titleAt, n] = level === "facile" ? [1, 2, 5] : level === "expert" ? [2, 4, 3] : [1, 3, 4];
  const out: AnimeHint[] = [];
  if (wrong >= themesAt && a.tags?.length) out.push({ label: "Ses thèmes", value: a.tags.slice(0, n).join(", ") });
  if (wrong >= titleAt) out.push({ label: "Son titre", value: titleShape(a.title) });
  return out;
}

/** Recherche tolérante (accents, casse, ponctuation). */
export const normTitle = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
