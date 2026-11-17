// Jeux « à indices » du jour : Devine l'anime (6 essais) et Devine le perso.
// Fonctions pures : tirage du jour, comparaison d'un essai, points, indices.
import { seeded } from "./token";

export const DLE_TRIES = 6;
/** 100 points du premier coup, 15 de moins par essai en plus ; 0 si raté. */
export const dlePoints = (tries: number | null) => (tries && tries >= 1 && tries <= DLE_TRIES ? 100 - (tries - 1) * 15 : 0);

/** Index du jour dans une liste : le même pour tout le monde à une date donnée. */
export function pickDaily(date: string, length: number, salt: string): number {
  return Math.floor(seeded(`${salt}-${date}`)() * length);
}

export interface DleAnime { id: number; title: string; alt: string | null; cover: string; year: number; format: string; episodes: number | null; score: number; genres: string[]; studio: string | null; source: string | null }
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

export interface DleChar { id: number; name: string; alt: string[]; image: string; gender: string | null; age: string | null; role: string; anime: string; animeId: number; year: number | null; genres: string[] }
export interface CharHint { label: string; value: string; kind: "text" | "image" }

/**
 * Indices du perso mystère, dévoilés un par un : un de plus à chaque essai raté.
 * Le dernier palier donne l'initiale ; l'image nette n'est envoyée qu'à la fin.
 */
export function charHints(c: DleChar, wrong: number, imageUrl: (level: 1 | 2) => string): CharHint[] {
  const all: CharHint[] = [
    { label: "Rôle", value: c.role, kind: "text" },
    ...(c.gender ? [{ label: "Genre", value: c.gender, kind: "text" as const }] : []),
    ...(c.age ? [{ label: "Âge", value: c.age, kind: "text" as const }] : []),
  ];
  const steps: CharHint[][] = [
    [{ label: "Anime : genres", value: c.genres.slice(0, 3).join(", ") || "inconnus", kind: "text" }, ...(c.year ? [{ label: "Année de l'anime", value: String(c.year), kind: "text" as const }] : [])],
    [{ label: "Portrait (très flou)", value: imageUrl(1), kind: "image" }],
    [{ label: "Anime", value: c.anime, kind: "text" }],
    [{ label: "Portrait (moins flou)", value: imageUrl(2), kind: "image" }],
    [{ label: "Initiale", value: `${c.name.slice(0, 1)}…`, kind: "text" }],
  ];
  return [...all, ...steps.slice(0, Math.min(wrong, steps.length)).flat()];
}

/** Recherche tolérante (accents, casse, ponctuation). */
export const normTitle = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
