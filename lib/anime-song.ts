// Générique du jour : un opening ou un ending d'anime tiré du catalogue
// (data/anime-songs.json, vérifié une fois contre iTunes), avec pochette,
// extrait de 30 s et lien vers la version complète. Module serveur.
import { unstable_cache } from "next/cache";
import catalog from "../data/anime-songs.json";

export interface CatalogSong { title: string; artist: string; anime: string; kind: "OP" | "ED"; year: number; itunesId: number }
export interface AnimeSong extends CatalogSong {
  index: number;
  cover: string | null;
  preview: string | null;
  appleUrl: string | null;
  youtubeUrl: string;
}

const SONGS = catalog as CatalogSong[];
export const SONG_COUNT = SONGS.length;

/** Pochette, extrait et lien Apple Music d'un titre (iTunes Lookup, sans clé).
 *  Un échec lève une erreur : il n'est pas mis en cache, le prochain appel réessaie. */
const lookupCached = unstable_cache(async (id: number) => {
  const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=US&entity=song`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const r = (await res.json())?.results?.[0];
  if (!r) throw new Error("iTunes : titre introuvable");
  const https = (u: unknown) => (typeof u === "string" && u.startsWith("https://") ? u : null);
  return {
    cover: https(r.artworkUrl100)?.replace(/\/\d+x\d+bb\./, "/600x600bb.") ?? null,
    preview: https(r.previewUrl),
    appleUrl: https(r.trackViewUrl),
  };
}, ["itunes-lookup-v2"], { revalidate: 60 * 60 * 24 * 3 });

const lookup = (id: number) => lookupCached(id).catch(() => null);

/** Ordre de passage fixe (mélange déterministe) : tout le catalogue passe avant une répétition. */
const ORDER = (() => {
  const idx = SONGS.map((_, i) => i);
  let seed = 20201214;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
})();

/** Index du générique du jour (le même pour tout le monde, change à minuit UTC). */
export function todayIndex(now = new Date()): number {
  const day = Math.floor(now.getTime() / 86_400_000);
  return ORDER[day % ORDER.length];
}

export async function getAnimeSong(index: number): Promise<AnimeSong | null> {
  const s = SONGS[index];
  if (!s) return null;
  const extra = await lookup(s.itunesId);
  return {
    ...s,
    index,
    cover: extra?.cover ?? null,
    preview: extra?.preview ?? null,
    appleUrl: extra?.appleUrl ?? null,
    youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.anime} ${s.kind === "OP" ? "opening" : "ending"} ${s.title} ${s.artist}`)}`,
  };
}
