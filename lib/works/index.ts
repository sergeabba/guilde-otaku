// Point d'entrée unique de la recherche d'œuvres (serveur uniquement).
// Anime et films d'animation : TMDB en français. Mangas : MangaDex.
// AniList n'est plus nécessaire : les anciens favoris AniList restent lisibles tels quels.
import { mangadexDetail, searchMangadex } from "./mangadex";
import { searchTmdbAnime, tmdbDetail, WorkSearchError } from "./tmdb";
import type { WorkCandidate, WorkKind, WorkSource } from "./types";

export { WorkSearchError };
export type { WorkCandidate, WorkKind, WorkSource };

const cache = new Map<string, { at: number; value: WorkCandidate[] }>();
const TTL = 10 * 60 * 1000;

export async function searchWorks(query: string, kind: WorkKind): Promise<WorkCandidate[]> {
  const q = query.trim().slice(0, 100);
  if (q.length < 2) throw new WorkSearchError("Tape au moins deux caractères.", 400);
  const key = `${kind}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const value = kind === "ANIME" ? await searchTmdbAnime(q) : await searchMangadex(q);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return value;
}

export async function workDetail(source: WorkSource, sourceId: string): Promise<WorkCandidate> {
  if (source === "tmdb") return tmdbDetail(sourceId);
  if (source === "mangadex") return mangadexDetail(sourceId);
  throw new WorkSearchError("Source inconnue.", 400);
}
