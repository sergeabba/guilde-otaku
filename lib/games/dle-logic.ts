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

/**
 * Indices du perso mystère, dévoilés un par un : un de plus à chaque essai raté.
 * Ils vont du plus vague (genres, studio, thèmes de son anime) au plus précis
 * (titre de l'anime, initiales). L'image nette n'est envoyée qu'à la fin.
 */
export function charHints(c: DleChar, wrong: number, imageUrl: (level: 1 | 2) => string, level: Level = "normal"): CharHint[] {
  const t = (label: string, value: string | null | undefined): CharHint[] => (value ? [{ label, value, kind: "text" }] : []);
  const anime = t("Anime", c.anime);
  const all: CharHint[] = [
    ...t("Rôle", c.role), ...t("Genre", c.gender), ...t("Âge", c.age),
    // Facile : le titre de l'anime est donné tout de suite.
    ...(level === "facile" ? anime : []),
  ];
  const genres = [...t("Son anime : genres", c.genres.slice(0, 3).join(", ")), ...t("Son anime : année", c.year ? String(c.year) : null)];
  const studio = t("Son anime : studio", c.studio);
  const themes = t("Son anime : thèmes", (c.themes ?? []).slice(0, level === "expert" ? 2 : 3).join(", "));
  const pix1: CharHint = { label: "Portrait (très flou)", value: imageUrl(1), kind: "image" };
  const pix2: CharHint = { label: "Portrait (moins flou)", value: imageUrl(2), kind: "image" };
  const voice = t("Doubleur japonais", c.voice);
  const shape = t("Son nom", nameShape(c.name));
  const or = (a: CharHint[], b: CharHint[]) => (a.length ? a : b);
  const steps: CharHint[][] = level === "expert"
    ? [genres, [pix1, ...studio], or(voice, themes), or(themes, [pix2]), anime]
    : level === "facile"
      ? [[...genres, ...studio, ...themes], [pix1], [pix2, ...voice], shape, shape]
      : [[...genres, ...studio], [pix1, ...themes], anime, [pix2, ...voice], shape];
  const out = [...all, ...steps.slice(0, Math.min(wrong, steps.length)).flat()];
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
 * Facile : thèmes dès le 1er raté ; Normal : au 2e ; Expert : au 3e (2 thèmes seulement).
 */
export function animeHints(a: DleAnime, wrong: number, level: Level = "normal"): AnimeHint[] {
  const [themesAt, titleAt, n] = level === "facile" ? [1, 3, 5] : level === "expert" ? [3, 4, 2] : [2, 4, 3];
  const out: AnimeHint[] = [];
  if (wrong >= themesAt && a.tags?.length) out.push({ label: "Ses thèmes", value: a.tags.slice(0, n).join(", ") });
  if (wrong >= titleAt) out.push({ label: "Son titre", value: titleShape(a.title) });
  return out;
}

/** Recherche tolérante (accents, casse, ponctuation). */
export const normTitle = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
