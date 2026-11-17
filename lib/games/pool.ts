// Réservoir d'animes pour « L'Affiche en morceaux », « Plus ou moins » et le défi du
// jour : les 200 séries et films les plus populaires d'AniList (sans clé), titre en
// lettres latines, affiche et note moyenne réelles. En cache 24 h. Module serveur.
import { unstable_cache } from "next/cache";
import { hasJapanese } from "../member-extras";

export interface PoolAnime { id: number; title: string; cover: string; score: number; year: number | null }

const QUERY = `query($p:Int){Page(page:$p,perPage:50){media(type:ANIME,sort:POPULARITY_DESC,isAdult:false,format_in:[TV,MOVIE]){id title{romaji english} averageScore seasonYear coverImage{extraLarge large}}}}`;
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

export const getAnimePool = unstable_cache(async (): Promise<PoolAnime[]> => {
  const pages = await Promise.all([1, 2, 3, 4].map(async (p) => {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { p } }), signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const d = await res.json();
    return (d?.data?.Page?.media ?? []) as Raw[];
  }));
  const pool = toPool(pages.flat());
  if (pool.length < 40) throw new Error("Réservoir d'animes trop petit.");
  return pool;
}, ["games-anime-pool-v1"], { revalidate: 86_400 });
