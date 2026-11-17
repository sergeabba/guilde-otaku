// Réservoir d'animes pour « L'Affiche en morceaux », « Plus ou moins » et le défi du
// jour, tiré du catalogue AniList (lib/games/catalog.ts) : titre en lettres latines,
// affiche, note moyenne et popularité réelles. Module serveur.
import { hasJapanese } from "../member-extras";
import { catalogAnimes } from "./catalog";
import type { Level } from "./levels";

export interface PoolAnime { id: number; title: string; cover: string; score: number; year: number | null; popularity?: number }

interface Raw { id: number; title: { romaji?: string | null; english?: string | null }; averageScore: number | null; seasonYear: number | null; coverImage?: { extraLarge?: string | null; large?: string | null } }

const latin = (s?: string | null) => (s && !hasJapanese(s) ? s.trim() : null);

/** Normalise une page AniList : titre lisible, affiche et note obligatoires, doublons de titre écartés. */
export function toPool(raw: Raw[]): PoolAnime[] {
  const seen = new Set<string>(), out: PoolAnime[] = [];
  for (const m of raw) {
    const title = latin(m.title.english) ?? latin(m.title.romaji);
    const cover = m.coverImage?.extraLarge ?? m.coverImage?.large;
    if (!title || !cover || !m.averageScore) continue;
    const k = title.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ id: m.id, title, cover, score: m.averageScore, year: m.seasonYear ?? null });
  }
  return out;
}

/** Animes du catalogue entre deux rangs de popularité (note et affiche connues). */
export async function animeRange(minRank: number, maxRank: number): Promise<PoolAnime[]> {
  const list = (await catalogAnimes(maxRank)).filter((a) => a.rank >= minRank && a.score && a.year);
  return list.map((a) => ({ id: a.id, title: a.title, cover: a.cover, score: a.score!, year: a.year, popularity: a.popularity }));
}

/** Les 200 plus populaires (défi du jour). */
export async function getAnimePool(): Promise<PoolAnime[]> {
  const pool = await animeRange(1, 200);
  if (pool.length < 40) throw new Error("Réservoir d'animes trop petit.");
  return pool;
}

/** Réservoir selon le niveau : Facile top 100, Normal top 300, Expert du 300e au 800e. */
export function levelPool(level: Level): Promise<PoolAnime[]> {
  return level === "facile" ? animeRange(1, 100) : level === "expert" ? animeRange(301, 800) : animeRange(1, 300);
}
