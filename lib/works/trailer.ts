// Bande-annonce d'un anime favori, pour les fiches des membres : vidéo YouTube référencée
// par TMDB (favoris de la recherche française) ou par AniList (anciens favoris).
// Rien n'est inventé : sans bande-annonce connue, la fiche n'affiche rien. Cache 7 jours.
import { unstable_cache } from "next/cache";
import { tmdbDetail } from "./tmdb";

export interface Trailer { youtubeId: string; lang?: string }

const YT = /^[\w-]{11}$/;

async function fromAnilist(id: number): Promise<Trailer | null> {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: "query($id:Int){Media(id:$id){trailer{id site}}}", variables: { id } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const t = (await res.json())?.data?.Media?.trailer;
  return t?.site === "youtube" && YT.test(t.id ?? "") ? { youtubeId: t.id } : null;
}

/** source « tmdb » (id « tv:123 » / « movie:123 ») ou « anilist » (id numérique). */
export const getTrailer = unstable_cache(async (source: "tmdb" | "anilist", id: string): Promise<Trailer | null> => {
  if (source === "tmdb") {
    const d = await tmdbDetail(id);
    return d.trailer && YT.test(d.trailer.youtubeId) ? { youtubeId: d.trailer.youtubeId, lang: d.trailer.lang } : null;
  }
  return fromAnilist(Number(id));
}, ["work-trailer-v1"], { revalidate: 60 * 60 * 24 * 7 });
